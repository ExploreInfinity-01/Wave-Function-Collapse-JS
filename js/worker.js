onmessage = e => {
    const { pixels, size, width, height } = e.data;    
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

    postMessage(tiles);
}