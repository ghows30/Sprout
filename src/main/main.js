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

                            // Add lastModified from file stats
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

            // Aggiungi .txt se il file non ha estensione
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

    // Salva automaticamente in 'appunti.json' (formato TipTap)
    ipcMain.handle('auto-save-notes', async (event, { sessionPath, content }) => {
        try {
            if (!sessionPath) {
                throw new Error('Missing sessionPath');
            }

            const filePath = path.join(sessionPath, 'appunti.json');

            // Salva il contenuto JSON di TipTap
            const jsonContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
            fs.writeFileSync(filePath, jsonContent, 'utf8');

            // Update lastModified in session.json
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


    // Carica gli appunti da 'appunti.json' se esiste, altrimenti migra da 'appunti.txt'
    ipcMain.handle('load-notes', async (event, { sessionPath }) => {
        try {
            if (!sessionPath) {
                throw new Error('Missing sessionPath');
            }

            const jsonFilePath = path.join(sessionPath, 'appunti.json');
            const txtFilePath = path.join(sessionPath, 'appunti.txt');

            // Prova a caricare il file JSON
            if (fs.existsSync(jsonFilePath)) {
                const content = fs.readFileSync(jsonFilePath, 'utf8');
                return { success: true, content: JSON.parse(content) };
            }
            // Se non esiste JSON ma esiste TXT, migra automaticamente
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

                // Salva il contenuto migrato in formato JSON
                fs.writeFileSync(jsonFilePath, JSON.stringify(tiptapContent, null, 2), 'utf8');

                // Opzionalmente, rinomina il file .txt come backup
                const backupPath = path.join(sessionPath, 'appunti.txt.backup');
                fs.renameSync(txtFilePath, backupPath);

                return { success: true, content: tiptapContent, migrated: true };
            }
            // Nessun file esistente, restituisci contenuto vuoto
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

            // Read existing session to preserve file paths
            let existingSession = {};
            if (fs.existsSync(filePath)) {
                existingSession = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }

            // Merge with new data (preserve files array, update flashcards)
            const updatedSession = {
                ...existingSession,
                ...sessionData,
                files: existingSession.files || sessionData.files, // Keep existing files
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

            // Open file dialog
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

            // Read existing session
            const sessionJsonPath = path.join(sessionPath, 'session.json');
            let session = {};
            if (fs.existsSync(sessionJsonPath)) {
                session = JSON.parse(fs.readFileSync(sessionJsonPath, 'utf8'));
            }

            // Copy files to appropriate subfolders and update session
            const existingFiles = session.files || [];
            const newFiles = [];
            const duplicates = [];

            for (const filePath of result.filePaths) {
                const fileName = path.basename(filePath);
                const ext = path.extname(fileName).toLowerCase();

                // Determine subfolder based on file type
                let subfolder = 'others';
                if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
                    subfolder = 'images';
                } else if (['.pdf', '.txt', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.md'].includes(ext)) {
                    subfolder = 'documents';
                }

                // Create subfolder if it doesn't exist
                const categoryDir = path.join(sessionPath, subfolder);
                if (!fs.existsSync(categoryDir)) {
                    fs.mkdirSync(categoryDir, { recursive: true });
                }

                // Copy file
                const destPath = path.join(categoryDir, fileName);
                const relativePath = path.join(subfolder, fileName);

                // Check if file already exists in session
                if (existingFiles.includes(relativePath)) {
                    duplicates.push(fileName);
                    continue;
                }

                try {
                    // Copy file
                    fs.copyFileSync(filePath, destPath);
                    newFiles.push(relativePath);
                } catch (err) {
                    console.error(`Failed to copy file ${fileName}:`, err);
                }
            }

            // Update session files
            session.files = [...existingFiles, ...newFiles];

            // Save updated session
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

    // Check if a session name already exists
    ipcMain.handle('check-session-name-exists', async (event, { name, excludePath }) => {
        try {
            const safeName = name.replace(/[^a-z0-9àèéìòùç\s-_]/gi, '').trim();
            const sessionDir = path.join(sproutPath, safeName);

            // If excludePath is provided, ignore that specific path (for rename validation)
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

    // Rename a session
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

            // Check if new name already exists (and it's not the same folder)
            if (fs.existsSync(newSessionDir) && sessionPath !== newSessionDir) {
                return { success: false, error: 'SESSION_NAME_EXISTS' };
            }

            // Read current session data
            const sessionFile = path.join(sessionPath, 'session.json');
            if (!fs.existsSync(sessionFile)) {
                throw new Error('Session file not found');
            }

            const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));

            // Update session name
            session.name = newName;
            session.lastModified = new Date().toISOString();

            // If the folder name needs to change
            if (sessionPath !== newSessionDir) {
                // Rename the folder
                fs.renameSync(sessionPath, newSessionDir);

                // Write updated session file to new location
                const newSessionFile = path.join(newSessionDir, 'session.json');
                fs.writeFileSync(newSessionFile, JSON.stringify(session, null, 2));
            } else {
                // Just update the session file
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

    // Delete a session
    ipcMain.handle('delete-session', async (event, { sessionPath }) => {
        try {
            if (!sessionPath) {
                throw new Error('Missing sessionPath');
            }

            // Verifica che la cartella esista
            if (!fs.existsSync(sessionPath)) {
                return { success: false, error: 'SESSION_NOT_FOUND' };
            }

            // Elimina ricorsivamente la cartella
            fs.rmSync(sessionPath, { recursive: true, force: true });

            return { success: true };
        } catch (error) {
            console.error('Error deleting session:', error);
            return { success: false, error: error.message };
        }
    });
    // Save a deck
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

            // Update lastModified
            deck.lastModified = new Date().toISOString();

            fs.writeFileSync(deckFile, JSON.stringify(deck, null, 2));
            return { success: true, path: deckDir };
        } catch (error) {
            console.error('Error saving deck:', error);
            return { success: false, error: error.message };
        }
    });

    // Load decks
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
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
