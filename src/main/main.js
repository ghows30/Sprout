const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const documentsPath = app.getPath('documents');
const sproutPath = path.join(documentsPath, 'Sprout');
const sessionsFile = path.join(sproutPath, 'sessions.json');

function ensureDirectoryExists() {
    if (!fs.existsSync(sproutPath)) {
        fs.mkdirSync(sproutPath);
    }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // Needed for nodeIntegration: true to work easily
        }
    });

    win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
    ensureDirectoryExists();
    createWindow();

    // IPC Handlers
    ipcMain.handle('get-sessions', async () => {
        try {
            if (!fs.existsSync(sproutPath)) return [];

            const sessions = [];
            const items = fs.readdirSync(sproutPath, { withFileTypes: true });

            for (const item of items) {
                if (item.isDirectory()) {
                    const sessionFile = path.join(sproutPath, item.name, 'session.json');
                    if (fs.existsSync(sessionFile)) {
                        try {
                            const data = fs.readFileSync(sessionFile, 'utf8');
                            sessions.push(JSON.parse(data));
                        } catch (e) {
                            console.error(`Error reading session in ${item.name}:`, e);
                        }
                    }
                }
            }
            return sessions;
        } catch (error) {
            console.error('Error reading sessions:', error);
            return [];
        }
    });

    ipcMain.on('save-session', (event, session) => {
        try {
            // Sanitize session name for folder usage (basic)
            const safeName = session.name.replace(/[^a-z0-9àèéìòùç\s-_]/gi, '').trim();
            const sessionDir = path.join(sproutPath, safeName);

            if (!fs.existsSync(sessionDir)) {
                fs.mkdirSync(sessionDir, { recursive: true });
            }

            // Copy files
            const processedFiles = [];
            if (session.files && Array.isArray(session.files)) {
                for (const file of session.files) {
                    if (file.path && file.name) {
                        try {
                            const destPath = path.join(sessionDir, file.name);
                            fs.copyFileSync(file.path, destPath);
                            processedFiles.push(file.name); // Store only name
                        } catch (err) {
                            console.error(`Failed to copy file ${file.name}:`, err);
                            processedFiles.push(file.name); // Keep name even if copy fails? Or skip? Keeping for now.
                        }
                    } else {
                        // Handle legacy or simple string case if needed, or just push name
                        processedFiles.push(file.name || file);
                    }
                }
            }
            session.files = processedFiles;

            const filePath = path.join(sessionDir, 'session.json');
            fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
        } catch (error) {
            console.error('Error saving session:', error);
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
