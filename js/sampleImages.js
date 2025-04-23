const fs = require('fs');
const path = require('path');

const folderPath = './samples';

// Read files from the folder
fs.readdir(folderPath, (err, files) => {
  if (err) {
    console.error('Unable to scan directory:', err);
    return;
  }

  const fileMap = []; 
  for(const file of files) {
    fileMap.push({ name: file.replace('.png', ''), fileName: file });
  }
  console.log(fileMap);
});