/*
 * This is the main entry point that is injected onto every page by the extension.
 * It overrides getUserMedia to provide a video and audio stream that is modified.
 */

import { ImageSegmenter, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

let imageSegmenter;
let sharedScreen;
let currentFilter = 'none'; 
let screenVideo;

const screenCanvas = document.createElement('canvas');
const screenContext = screenCanvas.getContext('2d', { willReadFrequently: true });
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d', { willReadFrequently: true });
const video = document.createElement('video');

const createImageSegmenter = async () => {
  const audio = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
  );

  imageSegmenter = await ImageSegmenter.createFromOptions(audio, {
    baseOptions: {
      modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
      delegate: "GPU"
    },
    runningMode: 'VIDEO',
    outputCategoryMask: true,
    outputConfidenceMasks: false
  });
};

function isCSSFilter(filterName) {
  return filterName === 'grayscale' || filterName === 'sepia' || filterName === 'invert' || filterName === 'hue-rotate' || filterName === 'none';
}

function getCSSFilter(filterName) {
  switch(filterName) {
    case 'grayscale': return 'grayscale(100%)';
    case 'sepia': return 'sepia(100%)';
    case 'invert': return 'invert(100%)';
    case 'hue-rotate': return 'hue-rotate(90deg)';
    default: return 'none';
  }
}

const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data.type) {
    return;
  }

  if (event.data.type === 'FROM_EXTENSION_FILTER_UPDATE') {
    currentFilter = event.data.filter;
    // setup screen sharing to show user option
	  if (currentFilter === 'screen-background') {
      screenVideo = undefined;
      sharedScreen = undefined;
	    const doIt = async () => {
        sharedScreen = await navigator.mediaDevices.getDisplayMedia({ video: true });
	      screenVideo = document.createElement('video');
	      screenVideo.srcObject = sharedScreen;
	      screenVideo.muted = true;
	      screenVideo.play();
	    };
	    doIt();
	  }
  }
});

window.postMessage({ type: 'FROM_PAGE_GET_FILTER' }, '*');

video.addEventListener('loadedmetadata', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
	screenCanvas.width = video.videoWidth;
	screenCanvas.height = video.videoHeight;
  draw();
});
video.muted = true;

function draw() {
  if (video.ended) {
    return;
  }
  if (isCSSFilter(currentFilter)) {
    context.filter = getCSSFilter(currentFilter);
	  context.drawImage(video, 0, 0, canvas.width, canvas.height);
    requestAnimationFrame(draw);
  } else {
    let screenImageData;
	  if (screenVideo) {
	    screenContext.drawImage(screenVideo, 0, 0, screenCanvas.width, screenCanvas.height);
      screenImageData = screenContext.getImageData(0, 0, video.videoWidth, video.videoHeight).data;
    }
	  context.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (!imageSegmenter) {
      requestAnimationFrame(draw);
      return;
    }
	  imageSegmenter.segmentForVideo(video, performance.now(), function (result) {
      const imageData = context.getImageData(0, 0, video.videoWidth, video.videoHeight).data;
  		const mask = result.categoryMask.getAsFloat32Array();
  		for (let i = 0; i < mask.length; ++i) {
        if (mask[i] === 1) {
          const j = i << 2;
      		imageData[j] = screenImageData ? screenImageData[j] : 0;
      		imageData[j + 1] = screenImageData ? screenImageData[j + 1] : 0;
      		imageData[j + 2] = screenImageData ? screenImageData[j + 2] : 0;
      		imageData[j + 3] = screenImageData ? screenImageData[j + 3] : 255;
        }
  		}
      const uint8Array = new Uint8ClampedArray(imageData.buffer);
      const dataNew = new ImageData(uint8Array, video.videoWidth, video.videoHeight);
      context.putImageData(dataNew, 0, 0);
      requestAnimationFrame(draw);
	  });
	}
}

navigator.mediaDevices.getUserMedia = async function(constraints) {
  if (constraints && constraints.video) {
    createImageSegmenter();
    try {

      if (typeof constraints.video === 'object') {
        constraints.video.width = 1280;
        constraints.video.height = 720;
      }

      const stream = await originalGetUserMedia(constraints);
      video.width = 1920;
      video.height = 1080;
      video.srcObject = stream;
      video.play();
        
      const canvasStream = canvas.captureStream();
      const newVideoTrack = canvasStream.getVideoTracks()[0];

      return new MediaStream([newVideoTrack, ...stream.getAudioTracks()]);
    } catch (e) {
      console.error("Error in GetUserMediaFun override:", e);
    }
  }
  return originalGetUserMedia(constraints);
};
