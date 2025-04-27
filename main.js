import './js/image.js';
import './js/imageData.js';
import './js/imageOptions.js'
import ImageGrid from './js/imageGrid.js';
import { createPath, options } from './js/imageOptions.js';

export let drawCellOptionsCount = false;
const pixelSize = 20;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const tileCanvas = document.getElementById('tileCanvas');
const tileCtx = tileCanvas.getContext('2d');

canvas.width = canvas.height = 700;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

function setTileCanvas() {
    tileCanvas.width = window.innerWidth - 100;
    tileCanvas.height = window.innerHeight - 110;
    tileCtx.textAlign = 'center'
    tileCtx.textBaseline = 'middle'
}
setTileCanvas();
window.addEventListener('resize', setTileCanvas);

// Image Selector
const select = document.getElementById('selectImage');
let lastOption;
select.addEventListener('change', () => {
    select.blur();
    lastOption?.imageGrid.abort();
    const option = options.get(select.value);
    if(option.imageGrid) {
        option.imageGrid.load(); 
    } else {
        option.imageGrid = new ImageGrid(ctx, option.src, select.value);
    }
    option.imageGrid.generate(pixelSize);
    lastOption = option;
});

const totalOptions = select.options.length;
const randomIndex = Math.floor(Math.random() * totalOptions);
select.selectedIndex = randomIndex;
select.dispatchEvent(new Event('change'));

const saveBtn = document.getElementById('save');
saveBtn.addEventListener('click', () => {
    const { activeCanvas } =  lastOption.imageGrid;
    const { width, height } = activeCanvas;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(activeCanvas, 0, 0);

    const a = document.createElement('a');
    const fileName = select.value;
    a.download = fileName.substring(fileName.indexOf('/', 2) + 1);
    a.href = canvas.toDataURL();
    a.click();
});