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

        const columnPadding = padding * 2;
        for(const tileColumn of this.adjacencies) {
            x += tileSize + columnPadding;
            y = columnPadding;
            const rectX = x - padding;

            let index = 0;
            const tileCount = tileColumn.size;
            for(const tileIndex of tileColumn) {
                tiles[tileIndex].renderImage(context, x, y, pixelSize);
                y += tileSize + padding;
                if( index++ < tileCount - 1 && y + (tileSize + columnPadding) >= canvas.height) {
                    x += tileSize + padding;
                    y = columnPadding;
                }
            }
            // Section Ouline
            context.strokeRect(rectX, padding, x + tileSize + padding - rectX, canvas.height - padding * 2);
        }
    }

    getAdjacentTiles(tiles) {
        for(const tile of tiles) {
            this.checkTileOverlapping(tile);
        }
    }

    checkTileOverlapping(tile) {
        const configValues = {
            "TOP": { loopValues : { i: [0, 0], j: [0, -1] } , offset: { i: 0, j: 1 } },
            "LEFT": { loopValues : { i: [0, -1], j: [0, 0] } , offset: { i: 1, j: 0 } },
            "RIGHT": { loopValues : { i: [1, 0], j: [0, 0] } , offset: { i: -1, j: 0 } },
            "BOTTOM": { loopValues : { i: [0, 0], j: [1, 0] } , offset: { i: 0, j: -1 } }
        }

        const checkOverlap = (tile, dirKey) => {
            const { width, height } = this;
            const { loopValues, offset } = configValues[dirKey];
            for(let j = loopValues.j[0]; j < height + loopValues.j[1]; j++) {
                const rowOffsetA = j * width;
                const rowOffsetB = (j + offset.j) * width;
                for(let i = loopValues.i[0]; i < width + loopValues.i[1]; i++) {
                    const indexA = (i + rowOffsetA) * 4;
                    const indexB = ((i + offset.i) + rowOffsetB) * 4;
    
                    if( this.data[indexA]     !== tile.data[indexB]     || // r
                        this.data[indexA + 1] !== tile.data[indexB + 1] || // b
                        this.data[indexA + 2] !== tile.data[indexB + 2]    // g
                    ) {
                        return false
                    }
                }
            }
            return true
        }
        for(const dirKey of Object.keys(configValues)) {
            if(checkOverlap(tile, dirKey)) {
                this.adjacencies[dir[dirKey]].add(tile.index);
            }
        }
    }
}