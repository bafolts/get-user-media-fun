
export function GameBoyColorFilter(canvas, ctx) {

  const originalWidth = canvas.width;
  const originalHeight = canvas.height;

  // Game Boy Camera's native resolution
  const gbWidth = 128;
  const gbHeight = 112;

  // 1. Create a small temporary canvas to render the effect at low resolution
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = gbWidth;
  tempCanvas.height = gbHeight;

  // 2. Draw the original canvas image onto the small canvas, downscaling it
  tempCtx.drawImage(canvas, 0, 0, gbWidth, gbHeight);

  const imageData = tempCtx.getImageData(0, 0, gbWidth, gbHeight);
  const data = imageData.data;

  // Original Game Boy 4-color palette (shades of green)
  const palette = [
    [15, 56, 15],   // #0f380f - Darkest Green
    [48, 98, 48],   // #306230 - Dark Green
    [139, 172, 15], // #8bac0f - Light Green
    [155, 188, 15]  // #9bbc0f - Lightest Green
  ];

  // Bayer 4x4 dithering matrix
  const bayerMatrix = [
    [1, 9, 3, 11],
    [13, 5, 15, 7],
    [4, 12, 2, 10],
    [16, 8, 14, 6]
  ];
  const matrixSize = 4;

  // 3. Apply grayscale, dithering, and color palette to the low-res image data
  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale (luminosity method)
    const grayscale = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

    const x = (i / 4) % gbWidth;
    const y = Math.floor((i / 4) / gbWidth);

    // Apply dithering
    const dither = bayerMatrix[y % matrixSize][x % matrixSize] * 16;
    const ditheredGrayscale = Math.max(0, Math.min(255, grayscale + dither - 128));

    // Find the closest color in the palette
    const paletteIndex = Math.floor(ditheredGrayscale / 64);
    const closestColor = palette[paletteIndex];

    data[i] = closestColor[0];     // Red
    data[i + 1] = closestColor[1]; // Green
    data[i + 2] = closestColor[2]; // Blue
  }

  // 4. Put the modified pixel data back onto the small canvas
  tempCtx.putImageData(imageData, 0, 0);

  // 5. Turn off image smoothing on the original canvas
  ctx.imageSmoothingEnabled = false;
  // In some browsers, you may need vendor prefixes
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;

  // 6. Clear the original canvas and draw the small, filtered canvas onto it, scaling it up
  ctx.clearRect(0, 0, originalWidth, originalHeight);
  ctx.drawImage(tempCanvas, 0, 0, originalWidth, originalHeight);

}

