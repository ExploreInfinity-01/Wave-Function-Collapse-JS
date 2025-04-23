import { updateLoadingScreen } from './utils.js';
import WaveFunctionCollapser from './wfc.js';

export default class ImageGrid {
    constructor(context, src, tileSize=3) {
        this.canvas = context.canvas;
        this.context = context;
        this.tileSize = tileSize;
        this.image = new Image();
        this.image.src = src;

        updateLoadingScreen(context);

        this.#addOptions();

        // Tile Extraction
        this.image.onload = async () => {
            await this.image.extractTilesWorker(context, tileSize);
            
            // Tiles Extracted
            this.createTileAdjacencies();
            this.tiles = this.image.tiles;
            this.extracted = true;
            document.dispatchEvent(new Event('tilesOnLoad'));
        };
        this.padding = 10;
        this.showTiles = false;
    }

    #addOptions() {
        const { context } = this;
        const { width, height } = this.canvas;

        const controller = new AbortController();
        this.controller = controller;
        this.abort = () => controller.abort();

        let showGenImage = true;
        let showImage = false;
        let showTiles = false;
        let showAdjacencies = false;
        const changeView = document.getElementById('changeView');
        changeView.addEventListener('click', () => {
            changeView.blur();
            context.clearRect(0, 0, width, height);
            if(showGenImage) {
                showGenImage = this.wfc.showProgress = false;
                showImage = true;
                const pixelScale = Math.min(
                    this.canvas.width / this.image.width, 
                    this.canvas.height / this.image.height);
                this.image.renderImage(context, 0, 0, pixelScale);
            } else if(showImage) {
                showImage = false;
                showTiles = true;
                this.setPadding(5);
                this.showExtractedTiles();
            } else if(showTiles) {
                showTiles = false;
                showAdjacencies = true;
                this.showTileAdjacencies(index);
            } else if(showAdjacencies) {
                showAdjacencies = false;
                showGenImage = this.wfc.showProgress = true;
                this.wfc.finished
                    ? this.wfc.drawFinalImage()
                    : this.wfc.refreshImage();
            }
        }, controller);

        const regenerateBtn = document.getElementById('regenerate');
        regenerateBtn.addEventListener('click', () => this.wfc.regenerate(), controller);

        let index = 0;
        const createAdjacenciesViewport = () => {
            window.addEventListener('keydown', e => {
                if(!showAdjacencies) return;
                if(e.key === 'ArrowRight' && index < this.tiles.length - 1) {
                    index++;
                } else if(e.key === 'ArrowLeft' && index > 0) {
                    index--;
                }
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.showTileAdjacencies(index);
            }, controller);
        }
        createAdjacenciesViewport();
    }

    generate() {
        // When Tiles Loaded
        if(!this.extracted) {
            document.addEventListener('tilesOnLoad', () => {
                this.intializeCollapser();
            }, { once: true });
        } else {
            this.intializeCollapser();
        }
    }

    intializeCollapser() {
        this.wfc = new WaveFunctionCollapser(this.context, this, this.controller, 25, 20);
        this.wfc.init();
    }

    showExtractedTiles() {
        this.showTiles = true;
        this.image.drawTileGrid(this.context, 0, 0, this.canvas.width, this.padding);
    }

    setPadding(value) {
        this.padding = value;
    }

    showTileAdjacencies(index, tileSize=75, padding=10) {
        this.tiles[index].showAdjacencies(this.context, index, this.tiles, tileSize, padding);
    }

    createTileAdjacencies() {
        for(const tile of this.image.tiles) {
            tile.getAdjacentTiles(this.image.tiles);
        }
    }

    animate() {
        const { canvas, context } = this;
        context.clearRect(0, 0, canvas.width, canvas.height);
        if(this.showTiles) {
            this.image.drawTileGrid(context, 0, 0, canvas.width, this.padding);
        }
        requestAnimationFrame(() => this.animate());
    }
}