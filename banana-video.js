const ASCII_CHARS = "$@B%8&WM#*oahkbdpqwmZ0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ";

function frameToAscii(imageData, width, height, invert = false) {
  const ascii = [];
  const charsLen = ASCII_CHARS.length;

  for (let y = 0; y < height; y += 1) {
    let row = '';
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];

      let brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      if (invert) brightness = 255 - brightness;

      const index = Math.floor((brightness / 255) * (charsLen - 1));
      row += ASCII_CHARS[index];
    }
    ascii.push(row);
  }

  return ascii.join('\n');
}

