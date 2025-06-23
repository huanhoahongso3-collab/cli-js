#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const { program } = require('commander');

let clipboardy;
try {
  clipboardy = require('clipboardy');
} catch (e) {
  clipboardy = null;
}

const STYLE_SETS = {
  default: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  blocky: "@#W$9876543210?!abc;:+=-,._ ",
  emoji: "⬛🟫🟥🟧🟨🟩🟦🟪⬜"
};

program
  .requiredOption('-f, --file <path>', 'Input image file (non-GIF)')
  .option('-w, --width <number>', 'Output width')
  .option('-h, --height <number>', 'Output height')
  .option('-s, --scale <number>', 'Scale factor (0.1 - 1)')
  .option('-i, --invert', 'Invert brightness')
  .option('-o, --output <file>', 'Save ASCII art to text file')
  .option('-c, --copy', 'Copy result to clipboard')
  .option('--style <style>', 'Style set: default, blocky, emoji', 'default')
  .parse(process.argv);

(async () => {
  const opts = program.opts();

  const inputFile = opts.file;
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: file not found - ${inputFile}`);
    process.exit(1);
  }

  if (path.extname(inputFile).toLowerCase() === '.gif') {
    console.error('Error: GIF files are not supported.');
    process.exit(1);
  }

  const width = parseInt(opts.width);
  const height = parseInt(opts.height);
  const scale = parseFloat(opts.scale);

  if ((opts.width || opts.height) && opts.scale) {
    console.error('Error: Use either width/height or scale, not both.');
    process.exit(1);
  }

  if ((opts.width && !opts.height) || (!opts.width && opts.height)) {
    console.error('Error: Both width and height must be specified.');
    process.exit(1);
  }

  const style = STYLE_SETS[opts.style] || STYLE_SETS.default;
  const img = await Jimp.read(inputFile);
  let newW, newH;

  if (opts.scale) {
    newW = Math.floor(img.bitmap.width * scale);
    newH = Math.floor(img.bitmap.height * scale * 0.5);
  } else if (opts.width && opts.height) {
    newW = width;
    newH = height;
  } else {
    newW = img.bitmap.width;
    newH = Math.floor(img.bitmap.height * 0.5);
  }

  img.resize(newW, newH).grayscale();

  let ascii = '';
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const pixel = img.getPixelColor(x, y);
      const { r, g, b } = Jimp.intToRGBA(pixel);
      let brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      if (opts.invert) brightness = 255 - brightness;
      const index = Math.floor((brightness / 255) * (style.length - 1));
      const char = style.charAt(index);
      ascii += (opts.style === 'emoji') ? char + char : char;
    }
    ascii += '\n';
  }

  // Output to terminal
  console.log(ascii);

  // Output to file
  if (opts.output) {
    try {
      fs.writeFileSync(opts.output, ascii, 'utf8');
      console.log(`Saved to ${opts.output}`);
    } catch (e) {
      console.error(`Failed to write to file: ${e.message}`);
    }
  }

  // Copy to clipboard
  if (opts.copy && clipboardy) {
    try {
      clipboardy.writeSync(ascii);
      console.log('Copied to clipboard.');
    } catch (e) {
      console.error('Clipboard error:', e.message);
    }
  }
})();

