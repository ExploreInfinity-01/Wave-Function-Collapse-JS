import './imageData.js';

onmessage = e => {
    const { pixels, size, width, height, rotate=false, flip=false } = e.data;    
    const tilePixelArrayLen = size * size * 4;
    const tiles = [];

    for(let j = 0; j < height; j++) {
        for(let i = 0; i < width; i++) {
            const tilePixels = new Uint8ClampedArray(tilePixelArrayLen);
            for(let ti = 0; ti < size; ti++) {
                for(let tj = 0; tj < size; tj++) {
                    const srcIndex = (((j + tj) % height) * width +  ((i + ti) % width)) * 4;
                    const tileIndex = (tj * size + ti) * 4;
                    tilePixels[tileIndex] = pixels[srcIndex];
                    tilePixels[tileIndex+1] = pixels[srcIndex+1];
                    tilePixels[tileIndex+2] = pixels[srcIndex+2];
                    tilePixels[tileIndex+3] = pixels[srcIndex+3];
                }
            }

            tiles.push(tilePixels);
        }
    }

    
    const extraTiles = [];
    if(rotate || flip) {
        const originalTiles = [];
        for(const pixels of tiles) {
            originalTiles.push(new ImageData(pixels, size, size));
        }
        // Rotating Pixel Tiles
        if(rotate) {
            for(const original of originalTiles) {
                const rotate90 = original.rotate90();
                const rotate180 = rotate90.rotate90();
                const rotate270 = rotate180.rotate90();
                extraTiles.push(rotate90.data, rotate180.data, rotate270.data);
            }
        }
        // Flipping Pixel Tiles
        if(flip) {
            for(const original of originalTiles) {
                const flipVertical = original.flipVertical();
                const flipHorizontal = original.flipHorizontal();
                const flippedImage = flipVertical.flipHorizontal();
                extraTiles.push(flipVertical.data, flipHorizontal.data, flippedImage.data);
            }
        }
    }

    const frequencyMap = new Map();
    for (const pixels of tiles.concat(extraTiles)) {
        const key = pixels.join(',');
        frequencyMap.set(key, (frequencyMap.get(key) ?? 0) + 1);
    }

    postMessage({ tiles, frequencyMap });
}