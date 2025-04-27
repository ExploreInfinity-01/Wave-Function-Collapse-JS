import Tile from "./tile.js";
import { rgba, updateLoadingScreen } from "./utils.js";

Image.prototype.setEmptyPixelData = function() {
    this.pixels = new Uint8ClampedArray(this.width * this.height * 4);
    this.pixelLoaded = true;
}

Image.prototype.loadPixels = function() {
    const canvas = new OffscreenCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this, 0, 0);
    const imageData = ctx.getImageData(0, 0, this.width, this.height);
    this.pixels = imageData.data;
    this.pixelLoaded = true;
}

Image.prototype.updatePixels = function() {
    const canvas = new OffscreenCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');
    const imageData = new ImageData(this.pixels, this.width, this.height);
    ctx.putImageData(imageData, 0, 0);
    canvas.convertToBlob().then((blob) => {
        const url = URL.createObjectURL(blob);
        this.src = url;
    });
}

Image.prototype.getPixelAt = function(i, j) {
    if(!this.pixelLoaded) this.loadPixels();
    const index = (j * this.width + i) * 4;
    const r = this.pixels[index];
    const g = this.pixels[index+1];
    const b = this.pixels[index+2];
    const a = this.pixels[index+3];
    return { r, g, b, a }
}

Image.prototype.setPixelAt = function(i, j, { r, g, b, a }) {
    if(!this.pixelLoaded) {
        console.error('Pixels need to be loaded before changing!');
        return
    }
    const index = (j * this.width + i) * 4;
    this.pixels[index] = r;
    this.pixels[index+1] = g;
    this.pixels[index+2] = b;
    this.pixels[index+3] = a;
}

Image.prototype.renderImage = function(context, dx, dy, pixelScale) {
    if(!this.pixelLoaded) this.loadPixels();
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

Image.prototype.sliceImage = function(x, y, w, h) {
    if(!this.pixelLoaded) this.loadPixels();
    const slicedImg = new Image(w, h);
    slicedImg.setEmptyPixelData();
    
    for(let i = 0; i < w; i++) {
        for(let j = 0; j < h; j++) {
            const pixelData = this.getPixelAt(
                ( x + i ) % this.width, 
                ( y + j ) % this.height
            );
            slicedImg.setPixelAt(i, j, pixelData);
        }
    }

    slicedImg.updatePixels();
    return slicedImg
}

Image.prototype.extractTiles = function(size=3) {
    if(!this.pixelLoaded) this.loadPixels();
    this.tileSize = size;
    this.tiles = [];
    console.time('Tiles');
    for(let j = 0; j < this.height; j++) {
        for(let i = 0; i < this.width; i++) {
            this.tiles.push(this.sliceImage(i, j, size, size));
        }
    }
    console.timeEnd('Tiles');
    this.tilesExtracted = true;
}

Image.prototype.extractTilesWorker = async function(context, size=3) {
    if(!this.pixelLoaded) this.loadPixels();
    this.tileSize = size;

    console.time('Tiles');
    const workerPromise = new Promise((resolve, reject) => {
        const worker = new Worker('./js/worker.js', { type: 'module' });

        worker.onmessage = e => {
            worker.terminate();

            const { tiles, frequencyMap } = e.data;

            this.extractedTiles = tiles.map(t => new ImageData(t, size, size));

            this.tiles = [];
            let index = 0;
            for(const [key, frequency] of frequencyMap.entries()) {
                const pixels = Uint8ClampedArray.from(key.split(',').map(Number));
                this.tiles.push(new Tile(pixels, size, size, index++, frequency));
            }

            console.timeEnd('Tiles');
            this.tilesExtracted = true;
            updateLoadingScreen(context, '[Creating WFC Grid]');

            requestIdleCallback(() => resolve(), { timeout: 50 });
        }

        worker.onerror = e => {
            worker.terminate();
            console.error(e);
            reject(e);
        }

        const { pixels, width, height } = this;
        worker.postMessage({ pixels, size, width, height, rotate: false, flip: false });
    });

    await Promise.all([workerPromise]);
}

Image.prototype.drawTileGrid = function(context, dx, dy, gridSize, padding=10) {
    if(!this.tilesExtracted) {
        console.error('Tiles not extracted!');
        return
    }
    const { width: imgWidth, tileSize } = this;
    const pixelScale = (gridSize - (imgWidth + 1) * padding) / (imgWidth * tileSize);
    const ds = tileSize * pixelScale + padding;
    for(let i = 0; i < this.extractedTiles.length; i++) {
        const tile = this.extractedTiles[i];
        const x = dx + padding + (i % imgWidth) * ds;
        const y = dy + padding + Math.floor(i / imgWidth) * ds;
        tile.renderImage(context, x, y, pixelScale);
        context.strokeRect(x, y, ds - padding, ds - padding);
    }
}