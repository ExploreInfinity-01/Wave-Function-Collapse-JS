import { rgba } from "./utils.js";

ImageData.prototype.renderImage = function(context, dx, dy, pixelScale) {
    for(let i = 0; i < this.width; i++) {
        for(let j = 0; j < this.height; j++) {
            const { r, g, b, a } = this.getPixelAt(i, j);
            context.fillStyle = rgba(r, g, b, a);
            context.beginPath();
            context.rect(dx + i * pixelScale, dy + j * pixelScale, pixelScale, pixelScale);
            context.fill();
            context.stroke();
        }
    }
}

ImageData.prototype.getPixelAt = function(i, j) {
    const index = (j * this.width + i) * 4;
    const r = this.data[index];
    const g = this.data[index+1];
    const b = this.data[index+2];
    const a = this.data[index+3];
    return { r, g, b, a }
}

ImageData.prototype.setPixelAt = function(i, j, { r, g, b, a }) {
    const index = (j * this.width + i) * 4;
    this.data[index] = r;
    this.data[index+1] = g;
    this.data[index+2] = b;
    this.data[index+3] = a;
}

ImageData.prototype.rotate90 = function() {
    const rotatedImage = new ImageData(this.height, this.width);
    for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
            const pixel = this.getPixelAt(x, y);
            const newX = this.height - y - 1;
            const newY = x;
            rotatedImage.setPixelAt(newX, newY, pixel);
        }
    }
    return rotatedImage;
}

ImageData.prototype.flipVertical = function() {
    const flippedImage = new ImageData(this.width, this.height);
    for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
            flippedImage.setPixelAt(this.width - x - 1, y, this.getPixelAt(x, y));
        }
    }
    return flippedImage;
}

ImageData.prototype.flipHorizontal = function() {
    const flippedImage = new ImageData(this.width, this.height);
    for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
            flippedImage.setPixelAt(x, this.height - y - 1, this.getPixelAt(x, y));
        }
    }
    return flippedImage;
}