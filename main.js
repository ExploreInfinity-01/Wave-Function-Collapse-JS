import './js/image.js';
import './js/imageData.js';
import './js/imageOptions.js'
import ImageGrid from './js/imageGrid.js';

export let drawCellOptionsCount = false;

const canvas = document.getElementById('canvas');
canvas.width = canvas.height = 700;
const ctx = canvas.getContext('2d');
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

const select = document.getElementById('selectImage');
let image;
select.addEventListener('change', () => {
    select.blur();
    if(image) {
        image.abort();
    }
    image = new ImageGrid(ctx, select.value);
    image.generate(20);
});

const totalOptions = select.options.length;
const randomIndex = Math.floor(Math.random() * totalOptions);
select.selectedIndex = randomIndex;
select.dispatchEvent(new Event('change'));

const saveBtn = document.getElementById('save');
saveBtn.addEventListener('click', () => {
    if(image.wfc.finished) {
        const a = document.createElement('a');
        const fileName = select.value;
        a.download = fileName.substring(fileName.indexOf('/', 2) + 1);
        a.href = canvas.toDataURL();
        a.click();
    }
});