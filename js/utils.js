export function rgba(r, g, b, a) {
    return `rgba(${r}, ${g}, ${b}, ${a})`
}

export function getBrightnessContrastingColor(r, g, b) {
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance < 128 ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)';
}

export function randInt(max, min=0) {
    return Math.floor(Math.random() * (max - min) + min);
}

export function random(array) {
    return array[Math.floor(Math.random() * array.length)]
}

export function updateLoadingScreen(context, value='') {
    const { width, height } = context.canvas;
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    context.fillStyle = 'rgba(0, 0, 0, 0.4)';
    context.fillRect(0, 0, width, height);
    context.fillStyle = 'rgb(255, 255, 255)';
    context.font = `40px monospace`;
    context.fillText('Loading...', centerX, centerY);
    if(value.length) {
        context.font = `20px monospace`;
        context.fillText(value, centerX, centerY + 40);
    }
}