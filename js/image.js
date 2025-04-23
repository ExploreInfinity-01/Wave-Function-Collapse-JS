import Tile from "./tile.js";
import { rgba } from "./utils.js";

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

Image.prototype.extractTilesWorker = async function(size=3, event=new Event('tileExtracted')) {
    if(!this.pixelLoaded) this.loadPixels();
    this.tileSize = size;
    const workerPromise = new Promise((resolve, reject) => {
        const worker = new Worker('./js/worker.js');

        worker.onmessage = e => {
            // Slow... [400-600ms] for 16x20 Img
            // this.tiles = e.data.map(pixels => {
                // const img = new Image(size, size);
                // img.pixels = pixels;
                // img.updatePixels();
                // return img
            // });

            // Fast [10-20ms] for 16x20 Img
            // this.tiles = e.data.map(pixels => new ImageData(pixels, size, size));

            // Unique Tiles
            // const excludeTiles = new Set();
            // this.tiles = [];
            // let index = 0;
            // for(const pixels of e.data) {
            //     if(excludeTiles.has(pixels)) continue;
            //     let frequency = 0;
            //     for(const tilePixels of e.data) {
            //         if(tilePixels.join('') === pixels.join('')) {
            //             excludeTiles.add(tilePixels);
            //             frequency++;
            //         }
            //     }
            //     this.tiles.push(new Tile(pixels, size, size, index++, frequency));
            // };

            // Repeat Indexes
            const checkedTiles = new Map();
            this.tiles = [];
            let index = 0;
            for(const pixels of e.data) {
                const key = pixels.join('');
                this.tiles.push(
                    new Tile(
                        pixels, size, size, 
                        checkedTiles.has(key) ?  checkedTiles.get(key) : index));
                
                if(checkedTiles.has(key)) {
                    index++;
                } else {
                    checkedTiles.set(key, index++);
                }
            };

            // this.tiles = e.data.map((pixels, i) => new Tile(pixels, size, size, i, 1));

            this.tilesExtracted = true;
            document.dispatchEvent(event);
            resolve();
        }

        worker.onerror = e => {
            console.error(e);
            reject(e);
        }

        const { pixels, width, height } = this;
        worker.postMessage({ pixels, size, width, height });
    });

    await Promise.all([workerPromise]);
    // return workerPromise
}

Image.prototype.drawTileGrid = function(context, dx, dy, gridSize, padding=10) {
    if(!this.tilesExtracted) {
        console.error('Tiles not extracted');
        return
    }
    const { width: imgWidth, tileSize } = this;
    const pixelScale = (gridSize - (imgWidth + 1) * padding) / (imgWidth * tileSize);
    const ds = tileSize * pixelScale + padding;
    for(let i = 0; i < this.tiles.length; i++) {
        let tile = this.tiles[i];
        const x = dx + padding + (i % imgWidth) * ds;
        const y = dy + padding + Math.floor(i / imgWidth) * ds;
        tile.renderImage(context, x, y, pixelScale);
        context.strokeRect(x, y, ds - padding, ds - padding);
    }
}