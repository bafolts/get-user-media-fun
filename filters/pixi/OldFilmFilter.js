
/**
 * First PIXI Filter - OldFilmFilter
 * Compatible with the existing filter interface
 */

/**
 * Setup the OldFilm filter on a sprite
 * @param {PIXI.Sprite} sprite - The sprite to apply the filter to
 * @param {Object} PIXI - The PIXI library reference
 * @returns {Object} - The filter instance
 */
export const setup = (sprite, PIXI) => {
  try {
    // Debug: Check if PIXI.filters exists
    if (!PIXI.filters) {
      console.error('PIXI.filters not available');
      return null;
    }

    // Debug: Check if OldFilmFilter exists
    if (!PIXI.filters.OldFilmFilter) {
      console.error('PIXI.filters.OldFilmFilter not available');
      console.log('Available filters:', Object.keys(PIXI.filters));
      return null;
    }

    // Create OldFilmFilter with proper parameters
    const filter = new PIXI.filters.OldFilmFilter();
    
    // Configure filter parameters for vintage film effect
    filter.sepia = 0.3; // Sepia tone intensity (0-1)
    filter.noise = 0.3; // Film grain noise (0-1)
    filter.noiseSize = 1.0; // Size of noise particles (0.1-2.0)
    filter.scratch = 0.5; // Scratch intensity (0-1)
    filter.scratchDensity = 0.3; // Density of scratches (0-1)
    filter.scratchWidth = 1.0; // Width of scratches (1-10)
    filter.vignetting = 0.3; // Vignette effect intensity (0-1)
    filter.vignettingAlpha = 1.0; // Vignette opacity (0-1)
    filter.vignettingBlur = 0.3; // Vignette blur amount (0-1)
    
    // Apply filter to sprite
    sprite.filters = [filter];
    
    console.log('OldFilmFilter applied successfully');
    console.log('Filter properties:', {
      sepia: filter.sepia,
      noise: filter.noise,
      noiseSize: filter.noiseSize,
      scratch: filter.scratch,
      scratchDensity: filter.scratchDensity,
      scratchWidth: filter.scratchWidth,
      vignetting: filter.vignetting,
      vignettingAlpha: filter.vignettingAlpha,
      vignettingBlur: filter.vignettingBlur
    });
    
    return filter;
  } catch (error) {
    console.error('Failed to setup OldFilmFilter:', error);
    return null;
  }
};

export const update = (filter) => {
   filter.seed = Math.random();
};

/**
 * Update filter parameters (optional, for dynamic effects)
 * @param {Object} filter - The filter instance
 * @param {Object} params - Parameters to update
 */
export const apply = (filter, params = {}) => {
  if (!filter) return;
  
  try {
    let hasChanges = false;
    
    if (params.sepia !== undefined) {
      filter.sepia = Math.max(0, Math.min(1, params.sepia));
      hasChanges = true;
    }
    if (params.noise !== undefined) {
      filter.noise = Math.max(0, Math.min(1, params.noise));
      hasChanges = true;
    }
    if (params.noiseSize !== undefined) {
      filter.noiseSize = Math.max(0.1, Math.min(2.0, params.noiseSize));
      hasChanges = true;
    }
    if (params.scratch !== undefined) {
      filter.scratch = Math.max(0, Math.min(1, params.scratch));
      hasChanges = true;
    }
    if (params.scratchDensity !== undefined) {
      filter.scratchDensity = Math.max(0, Math.min(1, params.scratchDensity));
      hasChanges = true;
    }
    if (params.scratchWidth !== undefined) {
      filter.scratchWidth = Math.max(1, Math.min(10, params.scratchWidth));
      hasChanges = true;
    }
    if (params.vignetting !== undefined) {
      filter.vignetting = Math.max(0, Math.min(1, params.vignetting));
      hasChanges = true;
    }
    if (params.vignettingAlpha !== undefined) {
      filter.vignettingAlpha = Math.max(0, Math.min(1, params.vignettingAlpha));
      hasChanges = true;
    }
    if (params.vignettingBlur !== undefined) {
      filter.vignettingBlur = Math.max(0, Math.min(1, params.vignettingBlur));
      hasChanges = true;
    }
    
    if (hasChanges) {
      console.log('Filter parameters updated:', params);
    }
  } catch (error) {
    console.error('Failed to apply filter parameters:', error);
  }
};

/**
 * Destroy/cleanup the filter
 * @param {PIXI.Sprite} sprite - The sprite to remove filters from
 */
export const destroy = (sprite) => {
  try {
    if (sprite && sprite.filters) {
      sprite.filters = [];
      console.log('OldFilmFilter removed successfully');
    }
  } catch (error) {
    console.error('Failed to destroy OldFilmFilter:', error);
  }
};

/**
 * Get filter metadata
 * @returns {Object} - Filter information
 */
export const getInfo = () => {
  return {
    name: 'OldFilmFilter',
    description: 'GPU-accelerated vintage film effect with sepia, grain, scratches, and vignetting',
    parameters: {
      sepia: { min: 0, max: 1, default: 0.3 },
      noise: { min: 0, max: 1, default: 0.3 },
      noiseSize: { min: 0.1, max: 2.0, default: 1.0 },
      scratch: { min: 0, max: 1, default: 0.5 },
      scratchDensity: { min: 0, max: 1, default: 0.3 },
      scratchWidth: { min: 1, max: 10, default: 1.0 },
      vignetting: { min: 0, max: 1, default: 0.3 },
      vignettingAlpha: { min: 0, max: 1, default: 1.0 },
      vignettingBlur: { min: 0, max: 1, default: 0.3 }
    }
  };
}; 