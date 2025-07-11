
// Internal state for the pipeline
let app = null;
let pixiCanvas = null;
let sprite = null;
let texture = null;
let isInitialized = false;
let currentFilter = null;

/**
 * Initialize the PIXI pipeline with video element and optional filter
 * @param {HTMLVideoElement} videoEl - The source video element
 * @param {Function} filterSetupFn - Optional filter setup function
 * @returns {MediaStream|null} - Returns the canvas stream or null if initialization fails
 */
export const initPixiPipeline = (videoEl, filterSetupFn = null) => {
  // Guard against multiple initializations
  if (isInitialized) {
    console.warn('PIXI pipeline already initialized');
    return null;
  }

  try {
    // Create hidden canvas
    pixiCanvas = document.createElement('canvas');
    pixiCanvas.style.display = 'none';
    pixiCanvas.id = '__pixi-canvas__';
    pixiCanvas.width = videoEl.videoWidth || 1280;
    pixiCanvas.height = videoEl.videoHeight || 720;
    document.body.appendChild(pixiCanvas);

    // Initialize PIXI Application (synchronous in v7)
    app = new PIXI.Application({
      view: pixiCanvas,
      width: pixiCanvas.width,
      height: pixiCanvas.height,
      backgroundAlpha: 0,
      antialias: false,
      resolution: 1,
      forceCanvas: false // Use WebGL by default
    });

    // Create texture from video element
    texture = PIXI.Texture.from(videoEl);
    sprite = new PIXI.Sprite(texture);
    
    // Scale sprite to fit canvas
    sprite.width = pixiCanvas.width;
    sprite.height = pixiCanvas.height;
    
    app.stage.addChild(sprite);

    // Apply filter if provided
    if (filterSetupFn) {
      currentFilter = filterSetupFn(sprite, PIXI);
    }

    isInitialized = true;
    console.log('PIXI pipeline initialized successfully');
    
    // Return the canvas stream
    return pixiCanvas.captureStream();

  } catch (error) {
    console.error('Failed to initialize PIXI pipeline:', error);
    destroyPixiPipeline();
    return null;
  }
};

/**
 * Update the PIXI frame - should be called in the main draw loop
 */
export const updatePixiFrame = (updateFilter = null) => {
  if (!isInitialized || !app || app.destroyed) {
    return;
  }
  if (updateFilter) {
    updateFilter(currentFilter);
  }

  try {
    // In PIXI v7, we need to manually update video textures
    if (texture && texture.baseTexture && texture.baseTexture.resource) {
      texture.baseTexture.resource.update();
    }
    
    // Render the frame
    app.renderer.render(app.stage);
  } catch (error) {
    console.error('Error updating PIXI frame:', error);
  }
};

/**
 * Destroy the PIXI pipeline and clean up resources
 */
export const destroyPixiPipeline = () => {
  if (!isInitialized) {
    return;
  }

  try {
    // Clear filters
    if (sprite && sprite.filters) {
      sprite.filters = [];
    }

    // Destroy PIXI application
    if (app && !app.destroyed) {
      app.destroy(true, { children: true });
    }

    // Remove canvas from DOM
    if (pixiCanvas && pixiCanvas.parentNode) {
      pixiCanvas.parentNode.removeChild(pixiCanvas);
    }

    // Nullify references
    app = null;
    pixiCanvas = null;
    sprite = null;
    texture = null;
    currentFilter = null;
    isInitialized = false;

    console.log('PIXI pipeline destroyed successfully');
  } catch (error) {
    console.error('Error destroying PIXI pipeline:', error);
  }
};

/**
 * Resize the PIXI pipeline to match new video dimensions
 * @param {number} width - New width
 * @param {number} height - New height
 */
export const resizePixiPipeline = (width, height) => {
  if (!isInitialized || !app || !pixiCanvas || !sprite) {
    return;
  }

  try {
    // Resize canvas
    pixiCanvas.width = width;
    pixiCanvas.height = height;
    
    // Resize PIXI renderer
    app.renderer.resize(width, height);
    
    // Resize sprite
    sprite.width = width;
    sprite.height = height;
    
    console.log(`PIXI pipeline resized to ${width}x${height}`);
  } catch (error) {
    console.error('Error resizing PIXI pipeline:', error);
  }
};

/**
 * Get the current canvas stream (useful for switching streams)
 * @returns {MediaStream|null}
 */
export const getPixiStream = () => {
  if (!isInitialized || !pixiCanvas) {
    return null;
  }
  return pixiCanvas.captureStream();
}; 