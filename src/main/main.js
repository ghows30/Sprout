const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ensureDirectoryExists } = require('./utils/paths');
const registerSessionHandlers = require('./handlers/session-handler');
const registerFileHandlers = require('./handlers/file-handler');
const registerNoteHandlers = require('./handlers/note-handler');
const registerDeckHandlers = require('./handlers/deck-handler');
const registerBackupHandlers = require('./handlers/backup-handler');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#2d2d2d', // Dark theme background
        show: false, // Don't show until ready to prevent white flash
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile(path.join(__dirname, '../renderer/index.html'));

    win.once('ready-to-show', () => {
        win.show();
    });
}

app.whenReady().then(() => {
    ensureDirectoryExists();
    createWindow();

    // Registra gli handler IPC
    registerSessionHandlers();
    registerFileHandlers();
    registerNoteHandlers();
    registerDeckHandlers();
    registerBackupHandlers();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
