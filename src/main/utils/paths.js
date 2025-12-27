const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const documentsPath = app.getPath('documents');
const sproutPath = path.join(documentsPath, 'Sprout');

function ensureDirectoryExists() {
    if (!fs.existsSync(sproutPath)) {
        fs.mkdirSync(sproutPath);
    }
}

module.exports = {
    sproutPath,
    ensureDirectoryExists
};
