export function MatrixFilter(ctx) {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // ASCII character set from dark to light
  const asciiChars = "`.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";
  const asciiCharsLength = asciiChars.length - 1;

  // Clear the canvas for the new content
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  // Set font properties for the ASCII characters
  const fontSize = 8;
  ctx.fillStyle = "green";
  ctx.font = `${fontSize}px monospace`;

  // Iterate over the image data and draw ASCII characters
  for (let y = 0; y < height; y += fontSize) {
    for (let x = 0; x < width; x += fontSize) {
      const i = (y * width + x) << 2;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Map brightness to an ASCII character
      const charIndex = Math.floor(((r + g + b) / 3 / 255) * asciiCharsLength);

      // Draw the character
      ctx.fillText(asciiChars[charIndex], x, y);
    }
  }
}

