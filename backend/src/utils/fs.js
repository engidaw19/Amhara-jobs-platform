const fs = require('fs');
const path = require('path');

function removeFile(filePath) {
  if (!filePath) return;
  try {
    fs.unlinkSync(path.resolve(filePath));
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Failed to remove uploaded file:', error.message);
  }
}

module.exports = { removeFile };
