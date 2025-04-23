import GridCell from "./gridCell.js";
import { dir } from "./tile.js";
import { random } from "./utils.js";

export default class WaveFunctionCollapser {
    constructor(context, imageGrid, pixelSize, maxDepth=10) {
        this.canvas = context.canvas;
        this.context = context;
        this.imageGrid = imageGrid;
        this.pixelSize = pixelSize;
        this.rows = Math.floor(this.canvas.height / pixelSize);
        this.cols = Math.floor(this.canvas.width / pixelSize);
        this.createGrid();
        this.maxDepth = maxDepth;

        this.history = [];
        this.currentHistory = null;

        this.start = false;
        this.finished = false;
        this.showProgress = true;

        context.font = pixelSize * 0.5 + "px monospace";
    }

    regenerate() {
        this.createGrid();

        this.history = [];
        this.currentHistory = null;

        this.start = false;
        this.finished = false;
        this.showProgress = true;

        this.init();
    }

    createNewHistoryObj(cell) {
        this.currentHistory = {
            cell, 
            entropyCheckedCells: new Set()
        };
        this.history.push(this.currentHistory);
    }

    createGrid() {
        const { rows, cols, pixelSize } = this;
        this.grid = [];
        // Creating Grid cells
        let index = 0;
        for(let j = 0; j < rows; j++) {
            for(let i = 0; i < cols; i++) {
                this.grid.push(
                    new GridCell(this.imageGrid.tiles, i * pixelSize, j * pixelSize, pixelSize, index++)
                );
            }
        }
    }

    wfc() {
        for(const cell of this.grid) {
            if(!cell.collapsed) {
                cell.entropyChecked = false;
                cell.calculateEntropy();
            }
        }

        // Least Entropy Cells
        const leastEntropyCells = this.start ? [] : this.grid;
        if(this.start) {
            let minEntropy = Number.MAX_SAFE_INTEGER;
            for(const cell of this.grid) {
                if( cell.collapsed || 
                    minEntropy < cell.entropy) {
                    continue
                }
                if(minEntropy > cell.entropy) {
                    minEntropy = cell.entropy;
                    leastEntropyCells.length = 0;
                    leastEntropyCells.push(cell);
                } else leastEntropyCells.push(cell);
            }
    
            if(leastEntropyCells.length === 0) {
                console.timeEnd('Generation');
                this.finished = true;
                console.log('Finished!');
                return
            }
        } else this.start = true;
        
        // Selecting Random Cell (from least entropy cells)
        const randomCell = random(leastEntropyCells);
        this.createNewHistoryObj(randomCell);
        randomCell.collapsed = true;

        const randomCellOption = random([...randomCell.cellOptions]);

        // Tried when unique tiles, frequency also gives more weightage to random selection [Failed]
        // let randomCellOption;
        // const randNum = Math.floor(Math.random() * randomCell.totalFrequency);
        // let cumulativeFrequency = 0;
        // for(const cellOption of randomCell.cellOptions) {
        //     cumulativeFrequency += this.imageGrid.tiles[cellOption].frequency;
        //     if(cumulativeFrequency > randNum) {
        //         randomCellOption = cellOption;
        //         break
        //     }
        // }
        
        randomCell.optionIndex = randomCellOption;
        randomCell.setNewOptions(new Set([randomCellOption]));
        
        this.reduceEntropy(randomCell);

        // Back Tracking
        if(this.isCellWithNoOptions()) {
            this.backtrack();
            return
        }
        // Collapse Cell with one option left
        for(const cell of this.grid) {
            if(!cell.collapsed && cell.cellOptions.size === 1) {
                cell.collapsed = true;
                cell.optionIndex = [...cell.cellOptions][0];
            }
        }
    }

    isCellWithNoOptions() {
        for(const cell of this.grid) {
            if(cell.cellOptions.size === 0) {
                return cell
            }
        }
        return false
    }

    backtrack() {
        do {
            console.log('Backtrack...');
            const {cell: lastCell, entropyCheckedCells} = this.currentHistory;
            lastCell.collapsed = false;
            lastCell.revertCellOptions();
            for(const cellIndex of entropyCheckedCells) {
                this.grid[cellIndex].revertCellOptions();
            }
            this.currentHistory = this.history.pop();
        } while (this.isCellWithNoOptions());
    }

    reduceEntropy(cell, depth=0) {
        if(depth > this.maxDepth) return;
        cell.entropyChecked = true;
        // console.time('Propagate' + cell.index);

        const cellIndex = cell.index;
        const i = cellIndex % this.cols;
        const j = Math.floor(cellIndex / this.cols);

        const propagate = (i, j, dir) => {
            if(i < 0 || i >= this.cols || j < 0 || j >= this.rows) return;

            const cellIndex = i + j * this.cols;
            const neighborCell = this.grid[cellIndex];          
            if(!neighborCell.collapsed) {
                let validOptions = new Set();
                for(const tileIndex of cell.cellOptions) {
                    try {
                        validOptions = validOptions.union(cell.options[tileIndex].adjacencies[dir]);
                    } catch (e) {
                        console.log(cell.cellOptions);
                    }
                }
    
                const newOptions = neighborCell.cellOptions.intersection(validOptions);
                if(neighborCell.cellOptions.size === newOptions.size) {
                    return
                }
                if(!neighborCell.entropyChecked) {
                    neighborCell.setNewOptions(newOptions);
                    neighborCell.entropyChecked = true;
                    this.currentHistory.entropyCheckedCells.add(neighborCell.index);
                } else {
                    neighborCell.cellOptions = newOptions;
                }
                this.reduceEntropy(neighborCell, depth+1);
            }
        }

        propagate(i+1, j, dir.RIGHT);
        propagate(i-1, j, dir.LEFT);
        propagate(i, j-1, dir.TOP);
        propagate(i, j+1, dir.BOTTOM);
        // console.timeEnd('Propagate' + cell.index);
    }

    init() {
        this.animate();
    }

    drawFinalImage() {
        for(const cell of this.grid) {
            cell.drawFinalPixel(this.context);
        }
    }


    refreshImage() {
        for(const cell of this.grid) {
            cell.drawn = false;
        }
    }

    animate() {
        if(this.showProgress) {
            for(const cell of this.grid) {
                cell.draw(this.context);
            }
        }
        if(!this.finished) {
            this.wfc();
            requestAnimationFrame(() => this.animate());
        }
    }
}