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
                    const sessionDir = path.join(sproutPath, item.name);
                    const sessionFile = path.join(sessionDir, 'session.json');
                    if (fs.existsSync(sessionFile)) {
                        try {
                            const data = fs.readFileSync(sessionFile, 'utf8');
                            const session = JSON.parse(data);
                            session.fullPath = sessionDir; // Add absolute path
                            sessions.push(session);
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
                            const ext = path.extname(file.name).toLowerCase();
                            let subfolder = 'others';

                            if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
                                subfolder = 'images';
                            } else if (['.pdf', '.txt', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'].includes(ext)) {
                                subfolder = 'documents';
                            }

                            const categoryDir = path.join(sessionDir, subfolder);
                            if (!fs.existsSync(categoryDir)) {
                                fs.mkdirSync(categoryDir, { recursive: true });
                            }

                            const destPath = path.join(categoryDir, file.name);
                            fs.copyFileSync(file.path, destPath);

                            // Store relative path
                            processedFiles.push(path.join(subfolder, file.name));
                        } catch (err) {
                            console.error(`Failed to copy file ${file.name}:`, err);
                            processedFiles.push(file.name);
                        }
                    } else {
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

    ipcMain.handle('save-note', async (event, { sessionPath, fileName, content }) => {
        try {
            if (!sessionPath || !fileName) {
                throw new Error('Missing sessionPath or fileName');
            }

            // Ensure filename ends with .txt if no extension provided
            if (!path.extname(fileName)) {
                fileName += '.txt';
            }

            const filePath = path.join(sessionPath, fileName);
            fs.writeFileSync(filePath, content, 'utf8');
            return { success: true, filePath };
        } catch (error) {
            console.error('Error saving note:', error);
            return { success: false, error: error.message };
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
