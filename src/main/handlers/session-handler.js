const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { sproutPath } = require('../utils/paths');

function registerSessionHandlers() {
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
}

module.exports = registerSessionHandlers;
