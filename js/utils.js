export function rgba(r, g, b, a) {
    return `rgba(${r}, ${g}, ${b}, ${a})`
}

export function getBrightnessContrastingColor(r, g, b) {
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance < 128 ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)';
}

export function random(array) {
    return array[Math.floor(Math.random() * array.length)]
}