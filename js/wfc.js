import GridCell from "./gridCell.js";
import { dir } from "./tile.js";
import { random } from "./utils.js";

export default class WaveFunctionCollapser {
    constructor(context, imageGrid, controller, pixelSize, maxDepth=10) {
        this.canvas = context.canvas;
        this.context = context;
        this.controller = controller;
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
        this.abort = false;
        this.showProgress = true;

        context.font = pixelSize * 0.5 + "px monospace";
        console.groupCollapsed('Generations');
    }

    regenerate() {
        if(this.start && !this.finished) {
            console.timeEnd('Generation');
            console.log('Cancelled!');
        }

        this.reset();
        this.init();
    }

    reset() {
        for(const gridCell of this.grid) {
            gridCell.reset();
        }

        this.history = [];
        this.currentHistory = null;

        this.start = false;
        this.finished = false;
        this.abort = false;
    }

    createNewHistoryObj(cell) {
        this.currentHistory = {
            cell, 
            entropyCheckedCells: new Set()
        };
        this.history.push(this.currentHistory);
    }

    createGrid() {
        console.time('Grid');
        const { rows, cols, pixelSize } = this;

        // Creating Grid cells
        this.grid = [];
        let index = 0;
        for(let j = 0; j < rows; j++) {
            for(let i = 0; i < cols; i++) {
                this.grid.push(new GridCell(this.imageGrid.tiles, i * pixelSize, j * pixelSize, pixelSize, index++));
            }
        }
        console.timeEnd('Grid');
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
                console.log('Finished!');
                this.finished = true;
                if(this.showProgress) {
                    this.drawFinalImage();
                }
                return;
            }
        } else this.start = true;
        
        // Selecting Random Cell (from least entropy cells)
        const randomCell = random(leastEntropyCells);
        this.createNewHistoryObj(randomCell);
        randomCell.collapsed = true;
        randomCell.selectRandomOption();

        this.reduceEntropy(randomCell);

        // Back Tracking
        if(this.isCellWithNoOptions()) {
            this.backtrack();
            return
        }

        // Collapse Cell with one option left
        for(const cellIndex of this.currentHistory.entropyCheckedCells) {
            const cell = this.grid[cellIndex];
            if(!cell.collapsed && cell.cellOptions.size === 1) {
                cell.collapsed = true;
                cell.optionIndex = [...cell.cellOptions][0];
                this.reduceEntropy(cell); // It is important, check 'chessboard' image with and without this!
            }
        }
    }

    isCellWithNoOptions() {
        for(const cell of this.grid) {
            if(!cell.cellOptions.size) {
                return true
            }
        }
        return false
    }

    backtrack() {
        try {
            do {
                // console.log('Backtrack...');
                const {cell: lastCell, entropyCheckedCells} = this.currentHistory;
                lastCell.revertCellOptions();
                for(const cellIndex of entropyCheckedCells) {
                    this.grid[cellIndex].revertCellOptions();
                }
                this.currentHistory = this.history.pop();
            } while (this.isCellWithNoOptions());
        }
        catch(err) {
            console.warn('Generation Messed Up! Trying Again...', err);
            this.reset();
        }
    }

    reduceEntropy(cell, depth=0) {
        if(depth > this.maxDepth) return;
        cell.entropyChecked = true;

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
                    validOptions = validOptions.union(cell.options[tileIndex].adjacencies[dir]);
                }
    
                const newOptions = neighborCell.cellOptions.intersection(validOptions);
                if(neighborCell.cellOptions.size === newOptions.size) {
                    return
                }
                try {
                    if(!neighborCell.entropyChecked) {
                        neighborCell.setNewOptions(newOptions);
                        neighborCell.entropyChecked = true;
                        this.currentHistory.entropyCheckedCells.add(neighborCell.index);
                    } else {
                        neighborCell.cellOptions = newOptions;
                    }
                }
                catch(err) {
                    console.error(this.currentHistory);
                    this.regenerate();
                }
                this.reduceEntropy(neighborCell, depth+1);
            }
        }

        propagate(i+1, j, dir.RIGHT);
        propagate(i-1, j, dir.LEFT);
        propagate(i, j-1, dir.TOP);
        propagate(i, j+1, dir.BOTTOM);
    }

    init() {
        requestIdleCallback(() => {
            console.time('Generation');
            this.animate();
        }, { timeout: 50 });
    }

    drawFinalImage() {
        for(const cell of this.grid) {
            cell.drawFinalPixel(this.context);
        }
    }

    refreshImage() {
        for(const cell of this.grid) {
            cell.drawn = false;
            this.prevOptionsSize = null;
        }
    }

    animate() {
        if(!this.abort) {
            if(this.showProgress) {
                for(const cell of this.grid) {
                    cell.draw(this.context);
                }
            }
            if(!this.finished) {
                this.wfc();
                requestAnimationFrame(() => this.animate());

                // For Debugging
                // window.addEventListener('keydown', e => {
                //     if(e.key === ' ') {
                //         requestAnimationFrame(() => this.animate());
                //     }
                // }, { once: true, signal: this.controller.signal });
            }
        }
    }
}