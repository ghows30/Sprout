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
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
    ensureDirectoryExists();
    createWindow();

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
                            session.fullPath = sessionDir;

                            const stats = fs.statSync(sessionFile);
                            session.lastModified = stats.mtime.toISOString();

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
            session.lastModified = new Date().toISOString();

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

    ipcMain.handle('auto-save-notes', async (event, { sessionPath, content }) => {
        try {
            if (!sessionPath) {
                throw new Error('Missing sessionPath');
            }

            const filePath = path.join(sessionPath, 'appunti.json');

            const jsonContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
            fs.writeFileSync(filePath, jsonContent, 'utf8');

            const sessionFile = path.join(sessionPath, 'session.json');
            if (fs.existsSync(sessionFile)) {
                const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
                session.lastModified = new Date().toISOString();
                fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
            }

            return { success: true, timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) };
        } catch (error) {
            console.error('Error auto-saving note:', error);
            return { success: false, error: error.message };
        }
    });


    ipcMain.handle('load-notes', async (event, { sessionPath }) => {
        try {
            if (!sessionPath) {
                throw new Error('Missing sessionPath');
            }

            const jsonFilePath = path.join(sessionPath, 'appunti.json');
            const txtFilePath = path.join(sessionPath, 'appunti.txt');

            if (fs.existsSync(jsonFilePath)) {
                const content = fs.readFileSync(jsonFilePath, 'utf8');
                return { success: true, content: JSON.parse(content) };
            }
            else if (fs.existsSync(txtFilePath)) {
                const txtContent = fs.readFileSync(txtFilePath, 'utf8');

                // Converti il testo plain in formato TipTap JSON
                const tiptapContent = {
                    type: 'doc',
                    content: txtContent.split('\n').map(line => ({
                        type: 'paragraph',
                        content: line.trim() ? [{ type: 'text', text: line }] : []
                    }))
                };

                fs.writeFileSync(jsonFilePath, JSON.stringify(tiptapContent, null, 2), 'utf8');

                const backupPath = path.join(sessionPath, 'appunti.txt.backup');
                fs.renameSync(txtFilePath, backupPath);

                return { success: true, content: tiptapContent, migrated: true };
            }
            else {
                return {
                    success: true,
                    content: {
                        type: 'doc',
                        content: [{ type: 'paragraph' }]
                    }
                };
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            return { success: false, error: error.message };
        }
    });


    ipcMain.on('save-session-data', (event, sessionData) => {
        try {
            const safeName = sessionData.name.replace(/[^a-z0-9àèéìòùç\s-_]/gi, '').trim();
            const sessionDir = path.join(sproutPath, safeName);
            const filePath = path.join(sessionDir, 'session.json');

            let existingSession = {};
            if (fs.existsSync(filePath)) {
                existingSession = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }

            const updatedSession = {
                ...existingSession,
                ...sessionData,
                files: existingSession.files || sessionData.files,
                lastModified: new Date().toISOString()
            };

            fs.writeFileSync(filePath, JSON.stringify(updatedSession, null, 2));
        } catch (error) {
            console.error('Error saving session data:', error);
        }
    });

    ipcMain.handle('add-files-to-session', async (event, { sessionPath }) => {
        try {
            const { dialog } = require('electron');

            const result = await dialog.showOpenDialog({
                properties: ['openFile', 'multiSelections'],
                filters: [
                    { name: 'Tutti i file', extensions: ['*'] },
                    { name: 'Documenti', extensions: ['pdf', 'doc', 'docx', 'txt', 'md'] },
                    { name: 'Immagini', extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'] },
                    { name: 'Fogli di calcolo', extensions: ['xls', 'xlsx'] },
                    { name: 'Presentazioni', extensions: ['ppt', 'pptx'] }
                ]
            });

            if (result.canceled || result.filePaths.length === 0) {
                return { success: false, canceled: true };
            }

            const sessionJsonPath = path.join(sessionPath, 'session.json');
            let session = {};
            if (fs.existsSync(sessionJsonPath)) {
                session = JSON.parse(fs.readFileSync(sessionJsonPath, 'utf8'));
            }

            const existingFiles = session.files || [];
            const newFiles = [];
            const duplicates = [];

            for (const filePath of result.filePaths) {
                const fileName = path.basename(filePath);
                const ext = path.extname(fileName).toLowerCase();

                let subfolder = 'others';
                if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
                    subfolder = 'images';
                } else if (['.pdf', '.txt', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.md'].includes(ext)) {
                    subfolder = 'documents';
                }

                const categoryDir = path.join(sessionPath, subfolder);
                if (!fs.existsSync(categoryDir)) {
                    fs.mkdirSync(categoryDir, { recursive: true });
                }

                const destPath = path.join(categoryDir, fileName);
                const relativePath = path.join(subfolder, fileName);

                if (existingFiles.includes(relativePath)) {
                    duplicates.push(fileName);
                    continue;
                }

                try {
                    fs.copyFileSync(filePath, destPath);
                    newFiles.push(relativePath);
                } catch (err) {
                    console.error(`Failed to copy file ${fileName}:`, err);
                }
            }

            session.files = [...existingFiles, ...newFiles];

            fs.writeFileSync(sessionJsonPath, JSON.stringify(session, null, 2));

            return {
                success: true,
                files: session.files,
                newFilesCount: newFiles.length,
                duplicates: duplicates
            };
        } catch (error) {
            console.error('Error adding files to session:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('check-session-name-exists', async (event, { name, excludePath }) => {
        try {
            const safeName = name.replace(/[^a-z0-9àèéìòùç\s-_]/gi, '').trim();
            const sessionDir = path.join(sproutPath, safeName);

            if (excludePath) {
                const excludeSafeName = path.basename(excludePath);
                if (safeName.toLowerCase() === excludeSafeName.toLowerCase()) {
                    return { exists: false };
                }
            }

            return { exists: fs.existsSync(sessionDir) };
        } catch (error) {
            console.error('Error checking session name:', error);
            return { exists: false, error: error.message };
        }
    });

    ipcMain.handle('rename-session', async (event, { sessionPath, newName }) => {
        try {
            if (!sessionPath || !newName) {
                throw new Error('Missing sessionPath or newName');
            }

            const safeName = newName.replace(/[^a-z0-9àèéìòùç\s-_]/gi, '').trim();
            if (!safeName) {
                throw new Error('Invalid session name');
            }

            const newSessionDir = path.join(sproutPath, safeName);

            if (fs.existsSync(newSessionDir) && sessionPath !== newSessionDir) {
                return { success: false, error: 'SESSION_NAME_EXISTS' };
            }

            const sessionFile = path.join(sessionPath, 'session.json');
            if (!fs.existsSync(sessionFile)) {
                throw new Error('Session file not found');
            }

            const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));

            session.name = newName;
            session.lastModified = new Date().toISOString();

            if (sessionPath !== newSessionDir) {
                fs.renameSync(sessionPath, newSessionDir);

                const newSessionFile = path.join(newSessionDir, 'session.json');
                fs.writeFileSync(newSessionFile, JSON.stringify(session, null, 2));
            } else {
                fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
            }

            return {
                success: true,
                newPath: newSessionDir,
                session: { ...session, fullPath: newSessionDir }
            };
        } catch (error) {
            console.error('Error renaming session:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('delete-session', async (event, { sessionPath }) => {
        try {
            if (!sessionPath) {
                throw new Error('Missing sessionPath');
            }

            if (!fs.existsSync(sessionPath)) {
                return { success: false, error: 'SESSION_NOT_FOUND' };
            }

            fs.rmSync(sessionPath, { recursive: true, force: true });

            return { success: true };
        } catch (error) {
            console.error('Error deleting session:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('save-deck', async (event, { sessionPath, deck }) => {
        try {
            if (!sessionPath || !deck) {
                throw new Error('Missing sessionPath or deck');
            }

            const flashcardsDir = path.join(sessionPath, 'flashcards');
            if (!fs.existsSync(flashcardsDir)) {
                fs.mkdirSync(flashcardsDir, { recursive: true });
            }

            const safeDeckName = deck.name.replace(/[^a-z0-9àèéìòùç\s-_]/gi, '').trim();
            const deckDir = path.join(flashcardsDir, safeDeckName);

            if (!fs.existsSync(deckDir)) {
                fs.mkdirSync(deckDir, { recursive: true });
            }

            const deckFile = path.join(deckDir, 'data.json');

            deck.lastModified = new Date().toISOString();

            fs.writeFileSync(deckFile, JSON.stringify(deck, null, 2));
            return { success: true, path: deckDir };
        } catch (error) {
            console.error('Error saving deck:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('load-decks', async (event, { sessionPath }) => {
        try {
            if (!sessionPath) {
                throw new Error('Missing sessionPath');
            }

            const flashcardsDir = path.join(sessionPath, 'flashcards');
            if (!fs.existsSync(flashcardsDir)) {
                return { success: true, decks: [] };
            }

            const decks = [];
            const items = fs.readdirSync(flashcardsDir, { withFileTypes: true });

            for (const item of items) {
                if (item.isDirectory()) {
                    const deckFile = path.join(flashcardsDir, item.name, 'data.json');
                    if (fs.existsSync(deckFile)) {
                        try {
                            const data = fs.readFileSync(deckFile, 'utf8');
                            const deck = JSON.parse(data);
                            decks.push(deck);
                        } catch (e) {
                            console.error(`Error reading deck in ${item.name}:`, e);
                        }
                    }
                }
            }

            return { success: true, decks };
        } catch (error) {
            console.error('Error loading decks:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('delete-deck', async (event, { sessionPath, deckName }) => {
        try {
            if (!sessionPath || !deckName) {
                throw new Error('Missing sessionPath or deckName');
            }

            const safeDeckName = deckName.replace(/[^a-z0-9àèéìòùç\s-_]/gi, '').trim();
            const deckDir = path.join(sessionPath, 'flashcards', safeDeckName);

            if (!fs.existsSync(deckDir)) {
                return { success: false, error: 'DECK_NOT_FOUND' };
            }

            fs.rmSync(deckDir, { recursive: true, force: true });
            return { success: true };
        } catch (error) {
            console.error('Error deleting deck:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('rename-deck', async (event, { sessionPath, oldName, newName }) => {
        try {
            if (!sessionPath || !oldName || !newName) {
                throw new Error('Missing parameters');
            }

            const safeOldName = oldName.replace(/[^a-z0-9àèéìòùç\s-_]/gi, '').trim();
            const safeNewName = newName.replace(/[^a-z0-9àèéìòùç\s-_]/gi, '').trim();

            const flashcardsDir = path.join(sessionPath, 'flashcards');
            const oldDir = path.join(flashcardsDir, safeOldName);
            const newDir = path.join(flashcardsDir, safeNewName);

            if (!fs.existsSync(oldDir)) {
                return { success: false, error: 'DECK_NOT_FOUND' };
            }

            if (fs.existsSync(newDir) && oldDir !== newDir) {
                return { success: false, error: 'DECK_NAME_EXISTS' };
            }

            fs.renameSync(oldDir, newDir);

            const deckFile = path.join(newDir, 'data.json');
            if (fs.existsSync(deckFile)) {
                const data = JSON.parse(fs.readFileSync(deckFile, 'utf8'));
                data.name = newName;
                data.lastModified = new Date().toISOString();
                fs.writeFileSync(deckFile, JSON.stringify(data, null, 2));
            }

            return { success: true };
        } catch (error) {
            console.error('Error renaming deck:', error);
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('delete-file', async (event, { sessionPath, fileName }) => {
        try {
            if (!sessionPath || !fileName) {
                throw new Error('Missing sessionPath or fileName');
            }

            const sessionFile = path.join(sessionPath, 'session.json');
            if (!fs.existsSync(sessionFile)) {
                return { success: false, error: 'SESSION_NOT_FOUND' };
            }

            const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));

            // Trova il file nell'array files
            // fileName qui è il path relativo (es. "documents/file.pdf")
            const fileIndex = session.files.indexOf(fileName);

            if (fileIndex === -1) {
                // Prova a cercare solo per nome file se il path relativo non corrisponde
                const nameOnlyIndex = session.files.findIndex(f => path.basename(f) === path.basename(fileName));
                if (nameOnlyIndex === -1) {
                    return { success: false, error: 'FILE_NOT_FOUND_IN_SESSION' };
                }
                // Aggiorna fileName con quello trovato nella sessione per sicurezza
                fileName = session.files[nameOnlyIndex];
            }

            // Costruisci il path assoluto per l'eliminazione
            const absoluteFilePath = path.join(sessionPath, fileName);

            if (fs.existsSync(absoluteFilePath)) {
                fs.unlinkSync(absoluteFilePath);
            }

            // Rimuovi dal file session.json
            session.files = session.files.filter(f => f !== fileName);
            session.lastModified = new Date().toISOString();

            fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));

            return { success: true };
        } catch (error) {
            console.error('Error deleting file:', error);
            return { success: false, error: error.message };
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
