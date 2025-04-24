export const dir = {
    "TOP": 0,
    "LEFT": 1,
    "RIGHT": 2,
    "BOTTOM": 3
}
const directions = Object.keys(dir).length;

export default class Tile extends ImageData {
    constructor(pixelData, width, height, index, frequency=1) {
        super(pixelData, width, height);
        this.index = index;
        this.centerPixelIndex = {
            i: Math.floor(this.width * 0.5), 
            j: Math.floor(this.height * 0.5)
        };
        this.frequency = frequency;
        this.adjacencies = Array(directions).fill(0).map(() => new Set());
    }

    getCenterPixel() {
        return this.getPixelAt(this.centerPixelIndex.i, this.centerPixelIndex.j);
    }

    showAdjacencies(context, index, tiles, tileSize=100, padding=10) {
        const { canvas } = context;
        const pixelSize = tileSize / this.width;
        let x = padding;
        let y = padding * 2;
        this.renderImage(context, x, y, pixelSize);

        context.save();
        context.fillStyle = 'black';
        context.font = '20px monospace';
        context.fillText(index + 1, x + this.width * 0.5 * pixelSize, y + this.height * 1.25 * pixelSize);
        context.restore();

        for(const tileColumn of this.adjacencies) {
            x += tileSize + padding * 2;
            y = padding * 2;
            const rectX = x - padding;
            for(const tileIndex of tileColumn) {
                tiles[tileIndex].renderImage(context, x, y, pixelSize);
                y += tileSize + padding;
                if(y + (tileSize + padding * 2) >= canvas.height) {
                    x += tileSize + padding;
                    y = padding * 2;
                }
            }
            // Section Ouline
            context.strokeRect(rectX, padding, x + tileSize + padding - rectX, canvas.height - padding * 2);
        }
    }

    getAdjacentTiles(tiles) {
        for(const tile of tiles) {
            if(tile === this) continue;
            for(const key of Object.keys(dir)) {
                if(this.checkTileOverlapping(tile, key)) {
                    this.adjacencies[dir[key]].add(tile.index);
                }
            }
        }
    }

    checkTileOverlapping(tile, dirKey) {
        const configValues = {
            "TOP": { loopValues : { i: [0, 0], j: [0, -1] } , offset: { i: 0, j: 1 } },
            "LEFT": { loopValues : { i: [0, -1], j: [0, 0] } , offset: { i: 1, j: 0 } },
            "RIGHT": { loopValues : { i: [1, 0], j: [0, 0] } , offset: { i: -1, j: 0 } },
            "BOTTOM": { loopValues : { i: [0, 0], j: [1, 0] } , offset: { i: 0, j: -1 } }
        }

        const config = configValues[dirKey];
        const configLoop = config.loopValues;
        for(let i = configLoop.i[0]; i < this.width + configLoop.i[1]; i++) {
            for(let j = configLoop.j[0]; j < this.height + configLoop.j[1]; j++) {
                const indexA = (i + j * this.width) * 4;
                const rA = this.data[indexA];
                const gA = this.data[indexA + 1];
                const bA = this.data[indexA + 2];
                const aA = this.data[indexA + 3];

                const indexB = ((i + config.offset.i) + (j + config.offset.j) * tile.width) * 4;
                const rB = tile.data[indexB];
                const gB = tile.data[indexB + 1];
                const bB = tile.data[indexB + 2];
                const aB = tile.data[indexB + 3];

                if(rA !== rB || gA !== gB || bA !== bB || aA !== aB) {
                    return false
                }
            }
        }

        return true
    }
}