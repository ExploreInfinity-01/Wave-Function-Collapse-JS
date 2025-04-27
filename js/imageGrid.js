import { updateLoadingScreen } from './utils.js';
import WaveFunctionCollapser from './wfc.js';

export default class ImageGrid {
    constructor(context, src, label, tileSize=3) {
        this.canvas = context.canvas;
        this.context = context;
        this.tileSize = tileSize;
        this.image = new Image();
        this.image.src = src;
        this.label = label;

        this.tileCanvas = document.getElementById('tileCanvas');
        this.tileContext = this.tileCanvas.getContext('2d');
        this.clearTileCanvas = () => {
            this.tileContext.clearRect(0, 0, this.tileCanvas.width, this.tileCanvas.height);
        };

        this.floatingWindow = document.getElementById('floatingWindow');
        this.showFloatingWindow = () => {
            this.canvas.style.display = 'none';
            floatingWindow.style.display = 'block';
        }
        this.hideFloatingWindow = () => {
            this.canvas.style.display = 'block';
            floatingWindow.style.display = 'none';
        }

        this.load();

        // Tile Extraction
        this.image.onload = async () => {
            await this.image.extractTilesWorker(context, tileSize);
            
            // Tiles Extracted
            console.time('Adjacancies');
            this.createTileAdjacencies();
            console.timeEnd('Adjacancies');
            this.tiles = this.image.tiles;
            this.extracted = true;
            document.dispatchEvent(new Event('tilesOnLoad'));
        };
        this.padding = 10;
        this.showTiles = false;
    }

    load() {
        console.group(this.label);
        updateLoadingScreen(this.context);
        this.addOptions();
    }

    addOptions() {
        const { context } = this;
        const { width, height } = this.canvas;

        const controller = new AbortController();
        this.controller = controller;
        this.abort = () => {
            this.controller.abort();
            this.hideFloatingWindow();
            if(!this.wfc.finished) {
                this.wfc.abort = true;
                console.timeEnd('Generation');
                console.log('Cancelled!');
            }
            console.groupEnd();
            console.groupEnd();
        }

        const changeView = () => {
            currentView = (currentView + 1) % totalViews;

            context.clearRect(0, 0, width, height);
            this.clearTileCanvas();

            switch(currentView) {
                case 0: // Generated Image
                    this.hideFloatingWindow();
                    this.wfc.showProgress = true;
                    this.wfc.finished
                        ? this.wfc.drawFinalImage()
                        : this.wfc.refreshImage();
                    break;
                case 1: // Original Image
                    this.wfc.showProgress = false;
                    const pixelScale = Math.min(
                        this.canvas.width / this.image.width, 
                        this.canvas.height / this.image.height);
                    this.image.renderImage(context, 0, 0, pixelScale);
                    break;
                case 2: // Tiles extracted from Image
                    this.setPadding(5);
                    this.showExtractedTiles();
                    break;
                case 3: // Every Tile with their Adjacencies
                    this.showFloatingWindow();
                    this.showTileAdjacencies(index);
                    break;
            }
        }

        let currentView = 0;
        const totalViews = 4;
        const changeViewBtn = document.getElementById('changeView');
        changeViewBtn.addEventListener('click', () => {
            changeViewBtn.blur();
            changeView();
        }, controller);

        const regenerateBtn = document.getElementById('regenerate');
        regenerateBtn.addEventListener('click', () => this.wfc.regenerate(), controller);

        // Tile Adjacencies Key Handler
        let index = 0;
        window.addEventListener('keydown', e => {
            if(currentView !== 3) return;

            switch(e.key) {
                case 'ArrowRight':
                    if(index < this.tiles.length - 1) index++;
                    break;
                case 'ArrowLeft':
                    if(index > 0) index--;
                    break;
                case 'ArrowUp':
                    index = 0;
                    break;
                case 'ArrowDown':
                    index = this.tiles.length - 1;
                    break;
            }

            this.clearTileCanvas();
            this.showTileAdjacencies(index);
        }, controller);
        window.addEventListener('resize', () => {
            this.clearTileCanvas();
            this.showTileAdjacencies(index)
        });
    }

    generate(pixelSize=25) {
        // When Tiles Loaded
        if(!this.extracted) {
            document.addEventListener('tilesOnLoad', () => {
                this.#intializeCollapser(pixelSize);
            }, { once: true });
        } else {
            this.#intializeCollapser(pixelSize);
        }
    }

    #intializeCollapser(pixelSize=25) {
        this.wfc = new WaveFunctionCollapser(this.context, this, this.controller, pixelSize, 20);
        this.wfc.init();
    }

    showExtractedTiles() {
        this.showTiles = true;
        this.image.drawTileGrid(this.context, 0, 0, this.canvas.width, this.padding);
    }

    setPadding(value) {
        this.padding = value;
    }

    showTileAdjacencies(index, {tileSize=75, padding=10}={}) {
        this.tiles[index].showAdjacencies(this.tileContext, index, this.tiles, tileSize, padding);
    }

    createTileAdjacencies() {
        for(const tile of this.image.tiles) {
            tile.getAdjacentTiles(this.image.tiles);
        }
    }
}