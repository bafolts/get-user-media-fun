/*
 * This is the main entry point that is injected onto every page by the extension.
 * It overrides getUserMedia to provide a video and audio stream that is modified.
 */

import { ImageSegmenter } from './tasks-vision.js';
import { CamcorderFilter } from './filters/Camcorder.js';
import { FireworksFilter } from './filters/Fireworks.js';
import { GameBoyColorFilter } from './filters/GameBoyColor.js';
import { MatrixFilter } from './filters/Matrix.js';
import { VCRFilter } from './filters/VCR.js';

let imageSegmenter;
let imageSegmenterPromise;
let sharedScreen;
let currentFilter = 'none'; 
let screenVideo;

const screenCanvas = document.createElement('canvas');
const screenContext = screenCanvas.getContext('2d', { willReadFrequently: true });
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d', { willReadFrequently: true });
const video = document.createElement('video');

const createImageSegmenter = async () => {
  if (imageSegmenterPromise) {
    return;
  }
  imageSegmenterPromise = ImageSegmenter.createFromOptions({
    wasmLoaderPath: import.meta.resolve('./vision_wasm_internal.js'),
    wasmBinaryPath: import.meta.resolve('./vision_wasm_internal.wasm')
  }, {
    baseOptions: {
      modelAssetPath: import.meta.resolve('./selfie_segmenter.tflite'),
      delegate: "GPU"
    },
    runningMode: 'VIDEO',
    outputCategoryMask: true,
    outputConfidenceMasks: false
  });
  imageSegmenter = await imageSegmenterPromise;
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

async function startScreenShare() {
  screenVideo = undefined;
  sharedScreen = navigator.mediaDevices.getDisplayMedia({ video: true });
	screenVideo = document.createElement('video');
	screenVideo.srcObject = await sharedScreen;
	screenVideo.muted = true;
	screenVideo.play();
}
  
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data.type) {
    return;
  }

  if (event.data.type === 'FROM_EXTENSION_FILTER_UPDATE') {
    currentFilter = event.data.filter;
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
  } else if (currentFilter === 'gameboycolor') {
	  context.drawImage(video, 0, 0, canvas.width, canvas.height);
    GameBoyColorFilter(canvas, context);
    requestAnimationFrame(draw);
  } else if (currentFilter === 'camcorder') {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    CamcorderFilter(context, canvas.width, canvas.height);
    requestAnimationFrame(draw);
  } else if (currentFilter === 'vcr') {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    VCRFilter(context, canvas.width, canvas.height);
    requestAnimationFrame(draw);
  } else {
    let screenImageData;
    if (currentFilter === 'screen-background') {
      if (sharedScreen === undefined) {
        startScreenShare();
      } else if (screenVideo) {
	      screenContext.drawImage(screenVideo, 0, 0, screenCanvas.width, screenCanvas.height);
        screenImageData = screenContext.getImageData(0, 0, video.videoWidth, video.videoHeight).data;
      }
    } else if (sharedScreen !== undefined) {
      sharedScreen = undefined;
    }
	  context.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (!imageSegmenter) {
      createImageSegmenter().finally(() => requestAnimationFrame(draw));
      return;
    }
	  imageSegmenter.segmentForVideo(video, performance.now(), function (result) {
      const imageData = context.getImageData(0, 0, video.videoWidth, video.videoHeight).data;

      let backgroundImageData;

      if (currentFilter === 'matrix-background') {
        MatrixFilter(context);
        backgroundImageData = context.getImageData(0, 0, video.videoWidth, video.videoHeight).data;
      } else if (currentFilter === 'fireworks-background') {
        FireworksFilter(context, canvas.width, canvas.height);
        backgroundImageData = context.getImageData(0, 0, video.videoWidth, video.videoHeight).data;
      } else if (currentFilter === 'screen-background') {
        backgroundImageData = screenImageData;
      }

  		const mask = result.categoryMask.getAsFloat32Array();
  		for (let i = 0; i < mask.length; ++i) {
        if (mask[i] === 1) {
          const j = i << 2;
          imageData[j] = backgroundImageData ? backgroundImageData[j] : 0;
          imageData[j + 1] = backgroundImageData ? backgroundImageData[j + 1] : 0;
          imageData[j + 2] = backgroundImageData ? backgroundImageData[j + 2] : 0;
          imageData[j + 3] = backgroundImageData ? backgroundImageData[j + 3] : 255;
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
