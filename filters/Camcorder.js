/**
 * Applies a 90s camcorder-style filter to a canvas element.
 * This function manipulates the pixel data of the canvas to create several effects,
 * including a sepia tone, scan lines, a vignette, digital noise, and a timestamp.
 */
export function CamcorderFilter(ctx, width, height) {
  // Get the image data from the entire canvas
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data; // The array of pixel data (R,G,B,A)

  // --- Timestamp Generation ---
  // Get the current time to create the classic on-screen display.
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.toLocaleString('default', { month: 'short' }).toUpperCase());
  const year = String(now.getFullYear()).slice(-2);
  const timestamp = `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;

  // --- Vignette Calculation Setup ---
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  // Loop through every pixel in the imageData array.
  // Each pixel is represented by 4 values (R, G, B, A), so we increment by 4.
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // --- 1. Sepia Tone Effect ---
    // Apply a sepia formula to give the image an aged, brownish look.
    const sepiaR = r * 0.393 + g * 0.769 + b * 0.189;
    const sepiaG = r * 0.349 + g * 0.686 + b * 0.168;
    const sepiaB = r * 0.272 + g * 0.534 + b * 0.131;

    data[i] = Math.min(255, sepiaR);
    data[i + 1] = Math.min(255, sepiaG);
    data[i + 2] = Math.min(255, sepiaB);

    // --- 2. Noise/Grain Effect ---
    // Add a random value to each color channel to simulate analog video noise.
    const noise = (Math.random() - 0.5) * 40;
    data[i] += noise;
    data[i + 1] += noise;
    data[i + 2] += noise;

    // Get the y (row) and x (column) coordinate of the current pixel
    const y = Math.floor(i / 4 / width);
    const x = (i / 4) % width;

    // --- 3. Scan Lines Effect ---
    // Darken every third horizontal line to mimic a CRT screen.
    if (y % 3 === 0) {
      data[i] *= 0.85;
      data[i + 1] *= 0.85;
      data[i + 2] *= 0.85;
    }
    
    // --- 4. Vignette Effect ---
    // Darken pixels based on their distance from the center of the canvas.
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const vignette = 1 - (dist / maxDist) * 0.6;
    data[i] *= vignette;
    data[i + 1] *= vignette;
    data[i + 2] *= vignette;
  }

  // Put the modified pixel data back onto the canvas
  ctx.putImageData(imageData, 0, 0);

  // --- 5. Draw Timestamp ---
  // Render the timestamp text on top of the filtered image.
  ctx.font = 'bold 24px "Courier New", Courier, monospace';
  ctx.fillStyle = 'rgba(255, 255, 100, 0.8)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  // Add a slight black outline for better readability against bright backgrounds
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.lineWidth = 4;
  ctx.strokeText(timestamp, width - 20, height - 20);
  ctx.fillText(timestamp, width - 20, height - 20);
}
