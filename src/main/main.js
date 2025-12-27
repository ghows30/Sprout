const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ensureDirectoryExists } = require('./utils/paths');
const registerSessionHandlers = require('./handlers/session-handler');
const registerFileHandlers = require('./handlers/file-handler');
const registerNoteHandlers = require('./handlers/note-handler');
const registerDeckHandlers = require('./handlers/deck-handler');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
    ensureDirectoryExists();
    createWindow();

    // Registra gli handler IPC
    registerSessionHandlers();
    registerFileHandlers();
    registerNoteHandlers();
    registerDeckHandlers();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
