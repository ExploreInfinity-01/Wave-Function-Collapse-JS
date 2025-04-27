const fs = require('fs');
const path = require('path');

const folderPath = './samples';

// Read files from the folder
fs.readdir(folderPath, (err, files) => {
  if (err) {
    console.error('Unable to scan directory:', err);
    return;
  }

  const fileMap = new Map(); 
  for(const file of files) {
    fileMap.set(file.replace('.png', ''), { src: file });
  }
  console.log(fileMap.entries());
});