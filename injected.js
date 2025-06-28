/**
 * injected.js
 * * This script runs in the context of the web page itself.
 * It has access to the page's `navigator` object to override `getUserMedia`.
 * It communicates with the extension's background script via the content.js bridge.
 */

import { ImageSegmenter, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

console.log(ImageSegmenter);

let imageSegmenter;

const createImageSegmenter = async () => {
  const audio = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
  );

  imageSegmenter = await ImageSegmenter.createFromOptions(audio, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite",
      delegate: "GPU"
    },
    runningMode: 'VIDEO',
    outputCategoryMask: true,
    outputConfidenceMasks: false
  });
};
createImageSegmenter();

const legendColors = [
  [255, 197, 0, 255], // Vivid Yellow
  [128, 62, 117, 255], // Strong Purple
  [255, 255, 0, 0], // Vivid Orange
  [166, 189, 215, 0], // Very Light Blue
/*  [193, 0, 32, 255], // Vivid Red
  [206, 162, 98, 255], // Grayish Yellow
  [129, 112, 102, 255], // Medium Gray
  [0, 125, 52, 255], // Vivid Green
  [246, 118, 142, 255], // Strong Purplish Pink
  [0, 83, 138, 255], // Strong Blue
  [255, 112, 92, 255], // Strong Yellowish Pink
  [83, 55, 112, 255], // Strong Violet
  [255, 142, 0, 255], // Vivid Orange Yellow
  [179, 40, 81, 255], // Strong Purplish Red
  [244, 200, 0, 255], // Vivid Greenish Yellow
  [127, 24, 13, 255], // Strong Reddish Brown
  [147, 170, 0, 255], // Vivid Yellowish Green
  [89, 51, 21, 255], // Deep Yellowish Brown
  [241, 58, 19, 255], // Vivid Reddish Orange
  [35, 44, 22, 255], // Dark Olive Green
  [0, 161, 194, 255] // Vivid Blue
*/];

(function() {
  // Store the original getUserMedia function to call it later.
  const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  
  // The currently active filter. Default to 'none'.
  let currentFilter = 'none'; 

  // --- Communication with Content Script ---

  // Listen for messages from the content script bridge.
  window.addEventListener('message', (event) => {
    // Basic security: only accept messages from the current window.
    if (event.source !== window || !event.data.type) {
      return;
    }
    
    // Handle filter updates from the extension.
    if (event.data.type === 'FROM_EXTENSION_FILTER_UPDATE') {
        console.log('Injected script received filter:', event.data.filter);
        currentFilter = event.data.filter;
    }
  });

  // On load, request the initial filter value from the extension.
  console.log('Injected script requesting initial filter value.');
  window.postMessage({ type: 'FROM_PAGE_GET_FILTER' }, '*');


  // --- getUserMedia Override Logic ---

  navigator.mediaDevices.getUserMedia = async function(constraints) {
    // Only intercept requests that include video.
    if (constraints && constraints.video) {
      try {
        // First, get the real camera stream.
        const stream = await originalGetUserMedia(constraints);
        
        // Set up a canvas to process the video frames.
        const videoTrack = stream.getVideoTracks()[0];
        const canvas = document.createElement('canvas');
        // 'willReadFrequently' is an important performance hint for the browser.
        const context = canvas.getContext('2d', { willReadFrequently: true });
        
        // Create a hidden video element to play the real stream.
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true; // Mute to avoid audio feedback.
        video.play();

        // When the video metadata is loaded, set canvas dimensions.
        video.addEventListener('loadedmetadata', () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          // Start the drawing loop.
          draw();
        });

        // The drawing loop that applies the filter to each frame.
        function draw() {
          if (isCSSFilter(currentFilter)) {
            // Apply the dynamically updated CSS filter.
            context.filter = getCSSFilter(currentFilter);
	    context.drawImage(video, 0, 0, canvas.width, canvas.height);
       	    // Use requestAnimationFrame for a smooth, efficient loop.
            requestAnimationFrame(draw);
          } else {
	    context.drawImage(video, 0, 0, canvas.width, canvas.height);
            imageSegmenter.segmentForVideo(video, performance.now(), function (result) {
              let imageData = context.getImageData(
    		0,
    		0,
    		video.videoWidth,
    		video.videoHeight
  		).data;
  		const mask = result.categoryMask.getAsFloat32Array();
  		let j = 0;
  		for (let i = 0; i < mask.length; ++i) {
    			const maskVal = Math.round(mask[i] * 255.0);
			const legendIndex = maskVal % legendColors.length;
    			const legendColor = legendColors[maskVal % legendColors.length];
			if (legendIndex === 3) {
				j += 4;
				continue;
			}
    			imageData[j] = 0//(legendColor[0] + imageData[j]) / 2;
    			imageData[j + 1] = 0// (legendColor[1] + imageData[j + 1]) / 2;
    			imageData[j + 2] = 0// (legendColor[2] + imageData[j + 2]) / 2;
    			imageData[j + 3] = 255// (legendColor[3] + imageData[j + 3]) / 2;
    			j += 4;
  		}
  const uint8Array = new Uint8ClampedArray(imageData.buffer);
  const dataNew = new ImageData(
    uint8Array,
    video.videoWidth,
    video.videoHeight
  );
  context.putImageData(dataNew, 0, 0);
  requestAnimationFrame(draw);

	    });
	  }
        }
        
        // Capture the filtered canvas content as a new video stream.
        const canvasStream = canvas.captureStream();
        const newVideoTrack = canvasStream.getVideoTracks()[0];
        
        // Preserve the original audio track, if one was requested.
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
            canvasStream.addTrack(audioTracks[0]);
        }

        const finalStream = new MediaStream([newVideoTrack, ...audioTracks]);

        return finalStream;

      } catch (e) {
        console.error("Error in GetUserMediaFun override:", e);
        // If anything goes wrong, fall back to the original function.
        return originalGetUserMedia(constraints);
      }
    }
    // For non-video requests, just use the original function.
    return originalGetUserMedia(constraints);
  };

  function isCSSFilter(filterName) {
    return filterName === 'grayscale' || filterName === 'sepia' || filterName === 'invert' || filterName === 'hue-rotate' || filterName === 'none';
  }

  // Helper function to convert our filter name to a valid CSS filter value.
  function getCSSFilter(filterName) {
      switch(filterName) {
          case 'grayscale': return 'grayscale(100%)';
          case 'sepia': return 'sepia(100%)';
          case 'invert': return 'invert(100%)';
          case 'hue-rotate': return 'hue-rotate(90deg)';
          default: return 'none';
      }
  }

})();

