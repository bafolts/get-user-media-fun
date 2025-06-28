/**
 * injected.js
 * * This script runs in the context of the web page itself.
 * It has access to the page's `navigator` object to override `getUserMedia`.
 * It communicates with the extension's background script via the content.js bridge.
 */
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
          // Apply the dynamically updated CSS filter.
          context.filter = getCSSFilter(currentFilter);
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          // Use requestAnimationFrame for a smooth, efficient loop.
          requestAnimationFrame(draw);
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
        
        // --- Virtual Device Creation ---
        // We override enumerateDevices to add our "GetUserMediaFun" camera to the list.
        const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
        navigator.mediaDevices.enumerateDevices = async function() {
            const devices = await originalEnumerateDevices();
            // Add our virtual device if it's not already in the list.
            if (!devices.find(d => d.deviceId === 'getusermediafun-video')) {
                const newVideoDevice = {
                  deviceId: 'getusermediafun-video',
                  groupId: 'getusermediafun-group',
                  kind: 'videoinput',
                  label: 'GetUserMediaFun',
                  toJSON: function() { return this; }
                };
                devices.push(newVideoDevice);
            }
            return devices;
        };

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

