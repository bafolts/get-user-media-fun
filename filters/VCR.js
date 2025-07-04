let frame = 0;

export function VCRFilter(context, width, height) {
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) << 2;
      data[i] *= Math.random() > 0.5 ? 0.85 : 0.84;
      data[i + 1] *= 0.85;
      data[i + 2] *= 0.85;
      data[i + 3] *= 0.85;
    }
  }
  const distortionHeight = 60;
  const distortionPos = (frame << 1) % height;

  for (let y = distortionPos; y < distortionPos + distortionHeight; y++) {
    if (y >= height) continue;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) << 2;
      const offset = Math.floor(Math.sin(y * 0.1 + frame * 0.1) * 10);
      // Shift red channel
      data[i] = data[(y * width + (x + offset)) << 2];
      // Shift blue channel
      data[i + 2] = data[((y * width + (x - offset)) << 2) + 2];
    }
  }
  // 3. Analog Noise
  for (let i = 0; i < data.length; i += 6) {
    const noise = (Math.random() - 0.5) * 50;
    data[i] += noise;
    data[i + 1] += noise;
    data[i + 2] += noise;
    data[i + 3] += noise;
    data[i + 4] += noise;
  }
  // Put the manipulated image data back
  context.putImageData(imageData, 0, 0);
  // 4. Timestamp
  context.fillStyle = 'rgba(255, 255, 255, 0.7)';
  context.font = '48px "Courier New", Courier, monospace';
  const date = new Date();
  const timeString = `PLAY ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  context.fillText(timeString, 48, height - 48);
  frame++;
}

