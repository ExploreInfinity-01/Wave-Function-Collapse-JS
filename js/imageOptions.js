const select = document.getElementById('selectImage');
select.innerHTML = '';

export const options = new Map([
    [ '3Bricks', { src: 'samples/3Bricks.png' } ],
    [ 'Angular', { src: 'samples/Angular.png' } ],
    [ 'BrownFox', { src: 'samples/BrownFox.png' } ],
    [ 'Cat', { src: 'samples/Cat.png' } ],
    [ 'Cats', { src: 'samples/Cats.png' } ],
    [ 'Cave', { src: 'samples/Cave.png' } ],
    [ 'Chess', { src: 'samples/Chess.png' } ],
    [ 'Circle', { src: 'samples/Circle.png' } ],
    [ 'City', { src: 'samples/City.png' } ],
    [ 'ColoredCity', { src: 'samples/ColoredCity.png' } ],
    [ 'Disk', { src: 'samples/Disk.png' } ],
    [ 'Dungeon', { src: 'samples/Dungeon.png' } ],
    [ 'Fabric', { src: 'samples/Fabric.png' } ],
    [ 'Flowers', { src: 'samples/Flowers.png' } ],
    [ 'Font', { src: 'samples/Font.png' } ],
    [ 'Forest', { src: 'samples/Forest.png' } ],
    [ 'Hogs', { src: 'samples/Hogs.png' } ],
    [ 'Knot', { src: 'samples/Knot.png' } ],
    [ 'Lake', { src: 'samples/Lake.png' } ],
    [ 'LessRooms', { src: 'samples/LessRooms.png' } ],
    [ 'Lines', { src: 'samples/Lines.png' } ],
    [ 'Link', { src: 'samples/Link.png' } ],
    [ 'Link2', { src: 'samples/Link2.png' } ],
    [ 'MagicOffice', { src: 'samples/MagicOffice.png' } ],
    [ 'Maze', { src: 'samples/Maze.png' } ],
    [ 'Mazelike', { src: 'samples/Mazelike.png' } ],
    [ 'MoreFlowers', { src: 'samples/MoreFlowers.png' } ],
    [ 'Mountains', { src: 'samples/Mountains.png' } ],
    [ 'Nested', { src: 'samples/Nested.png' } ],
    [ 'NotKnot', { src: 'samples/NotKnot.png' } ],
    [ 'Office', { src: 'samples/Office.png' } ],
    [ 'Office2', { src: 'samples/Office2.png' } ],
    [ 'Paths', { src: 'samples/Paths.png' } ],
    [ 'Platformer', { src: 'samples/Platformer.png' } ],
    [ 'Qud', { src: 'samples/Qud.png' } ],
    [ 'RedDot', { src: 'samples/RedDot.png' } ],
    [ 'RedMaze', { src: 'samples/RedMaze.png' } ],
    [ 'Rooms', { src: 'samples/Rooms.png' } ],
    [ 'Rule126', { src: 'samples/Rule126.png' } ],
    [ 'Sand', { src: 'samples/Sand.png' } ],
    [ 'ScaledMaze', { src: 'samples/ScaledMaze.png' } ],
    [ 'Sewers', { src: 'samples/Sewers.png' } ],
    [ 'SimpleKnot', { src: 'samples/SimpleKnot.png' } ],
    [ 'SimpleMaze', { src: 'samples/SimpleMaze.png' } ],
    [ 'SimpleWall', { src: 'samples/SimpleWall.png' } ],
    [ 'Skew1', { src: 'samples/Skew1.png' } ],
    [ 'Skew2', { src: 'samples/Skew2.png' } ],
    [ 'Skyline', { src: 'samples/Skyline.png' } ],
    [ 'Skyline2', { src: 'samples/Skyline2.png' } ],
    [ 'SmileCity', { src: 'samples/SmileCity.png' } ],
    [ 'Spirals', { src: 'samples/Spirals.png' } ],
    [ 'Town', { src: 'samples/Town.png' } ],
    [ 'TrickKnot', { src: 'samples/TrickKnot.png' } ],
    [ 'Village', { src: 'samples/Village.png' } ],
    [ 'Wall', { src: 'samples/Wall.png' } ],
    [ 'WalledDot', { src: 'samples/WalledDot.png' } ],
    [ 'Water', { src: 'samples/Water.png' } ],
    [ 'Wrinkles', { src: 'samples/Wrinkles.png' } ]
]);

// Drag And Drop File Functionality
document.addEventListener('dragenter', e => e.preventDefault(), false);
document.addEventListener('drag', e => e.preventDefault(), false);
document.addEventListener('drop', e => e.preventDefault(), false);
document.addEventListener('dragover', e => e.preventDefault(), false);

document.addEventListener('drop', e => {
    const files = e.dataTransfer.files;
    
    for(const file of files) {
        if(file.type.startsWith('image/')) {
            const { name } = file;
            const fileReader = new FileReader();

            fileReader.onload = () => {
                const fileName = name.substring(0, name.lastIndexOf('.'));
                options.set(fileName, { src: fileReader.result });
                addOption(fileName);
            }

            fileReader.readAsDataURL(file);
        }
    }
}, false);

function addOption(name) {
    const option = document.createElement('option');
    option.textContent = name;
    option.value = name;
    select.append(option);
}

for(const [ name ] of options.entries()) {
    addOption(name);
}

export function createPath(src) {
    return location.pathname + src;
}