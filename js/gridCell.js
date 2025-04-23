import { getBrightnessContrastingColor, rgba } from "./utils.js";

const invLn2 = 1 / Math.log(2);
export default class GridCell {
    constructor(options, x, y, size, index) {
        this.options = options;
        this.x = x;
        this.y = y;
        this.size = size;
        this.index = index;

        this.collapsed = false;
        this.entropyChecked = false;
        this.optionIndex = null;
        this.drawn = false;
        this.createEveryCellOptions();

        this.prevOptions = [];
        this.showOptions = true;
    }

    calculateEntropy() {
        if(this.prevNumberOfOptions === this.cellOptions.size) return;
        this.prevNumberOfOptions = this.cellOptions.size;

        this.totalFrequency = 0;
        for(const optionIndex of this.cellOptions) {
            this.totalFrequency += this.options[optionIndex].frequency;
        }

        this.entropy = 0;
        for(const optionIndex of this.cellOptions) {
            const { frequency } = this.options[optionIndex];
            const probability = frequency / this.totalFrequency;
            this.entropy -= probability * Math.log(probability) * invLn2;
        }
    }

    setNewOptions(newOptions) {
        this.prevOptions.push(this.cellOptions);
        this.cellOptions = newOptions;
    }

    revertCellOptions() {
        if(this.prevOptions.length > 0) {
            this.cellOptions = this.prevOptions.pop();
            if(typeof(this.optionIndex) === 'number') {
                this.cellOptions.delete(this.optionIndex);
                this.collapsed = false;
                this.optionIndex = null;
            }
        }
    }

    createEveryCellOptions() {
        this.cellOptions = new Set();
        for(let i = 0; i < this.options.length; i++) {
            this.cellOptions.add(i);
        }
    }

    drawFinalPixel(context) {
        try {
            const { r, g, b, a } = this.options[this.optionIndex].getCenterPixel();
            context.fillStyle = rgba(r, g, b, a);
            context.fillRect(this.x, this.y, this.size, this.size);
            this.drawn = true;
          } catch (error) {
               console.log(this.optionIndex);
          }
    }

    draw(context) {
        if(this.cellOptions.size === 0) {
            context.fillStyle = 'pink';
            context.fillRect(this.x, this.y, this.size, this.size);
            // this.drawn = true;
        } else if(this.collapsed && !this.drawn) {
            this.drawFinalPixel(context);
        } else if (!this.collapsed && this.prevOptionsSize !== this.cellOptions.size) {
            let r, g, b;
            r = g = b = 0;
            for(const optionIndex of this.cellOptions) {
                try {
                    const optionColor = this.options[optionIndex].getCenterPixel();
                    r += optionColor.r;
                    g += optionColor.g;
                    b += optionColor.b;
                } catch (error) {
                    // console.log(optionIndex, this.cellOptions);
                }
            }
            r /= this.cellOptions.size;
            g /= this.cellOptions.size; 
            b /= this.cellOptions.size;

            context.fillStyle = rgba(r, g, b, 255);
            context.fillRect(this.x, this.y, this.size, this.size);

            if(this.showOptions) {
                // context.fillStyle = 'red';
                context.fillStyle = getBrightnessContrastingColor(r, g, b);
                context.fillText(this.cellOptions.size, this.x + this.size * 0.5, this.y + this.size * 0.5);
            }

            this.prevOptionsSize = this.cellOptions.size;
        }
    }
}