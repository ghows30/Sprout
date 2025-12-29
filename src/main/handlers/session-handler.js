const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { dialog, app } = require('electron');
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

    ipcMain.handle('export-sessions', async (event, { sessionPaths }) => {
        try {
            if (!sessionPaths || sessionPaths.length === 0) {
                return { success: false, error: 'NO_SESSIONS_SELECTED' };
            }

            const { filePath } = await dialog.showSaveDialog({
                title: 'Esporta Spazi di Studio',
                defaultPath: `sprout-sessions-export-${new Date().toISOString().split('T')[0]}.zip`,
                filters: [{ name: 'Sprout Sessions', extensions: ['zip'] }]
            });

            if (!filePath) return { success: false, canceled: true };

            const zip = new AdmZip();

            for (const sessionPath of sessionPaths) {
                if (fs.existsSync(sessionPath)) {
                    const folderName = path.basename(sessionPath);
                    zip.addLocalFolder(sessionPath, folderName);
                }
            }

            zip.writeZip(filePath);

            return { success: true, filePath };
        } catch (error) {
            console.error('Error exporting sessions:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('import-sessions', async () => {
        try {
            const { filePaths } = await dialog.showOpenDialog({
                title: 'Importa Spazi di Studio',
                filters: [{ name: 'Sprout Sessions', extensions: ['zip'] }],
                properties: ['openFile']
            });

            if (!filePaths || filePaths.length === 0) return { success: false, canceled: true };

            const zipPath = filePaths[0];
            const zip = new AdmZip(zipPath);
            const zipEntries = zip.getEntries();

            // Extract to temp folder first
            const tempExtractPath = path.join(app.getPath('temp'), `sprout-import-${Date.now()}`);
            if (fs.existsSync(tempExtractPath)) {
                fs.rmSync(tempExtractPath, { recursive: true, force: true });
            }
            fs.mkdirSync(tempExtractPath);

            zip.extractAllTo(tempExtractPath, true);

            // Move folders to sproutPath
            const items = fs.readdirSync(tempExtractPath, { withFileTypes: true });
            let importedCount = 0;

            for (const item of items) {
                if (item.isDirectory()) {
                    const sourceDir = path.join(tempExtractPath, item.name);
                    // Check if it looks like a session (has session.json)
                    const sessionFile = path.join(sourceDir, 'session.json');
                    if (fs.existsSync(sessionFile)) {
                        let targetName = item.name;
                        let targetDir = path.join(sproutPath, targetName);

                        // Handle name collision
                        let counter = 1;
                        while (fs.existsSync(targetDir)) {
                            targetName = `${item.name} (${counter})`;
                            targetDir = path.join(sproutPath, targetName);
                            counter++;
                        }

                        // Update session.json name if renamed
                        if (targetName !== item.name) {
                             try {
                                const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
                                sessionData.name = targetName; // Update internal name
                                fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
                             } catch(e) {
                                 console.error('Error updating imported session name:', e);
                             }
                        }

                        // Copy to sproutPath
                        // fs.cpSync is available in newer Node versions, using recursive copy fallback if needed or assume user has recent node (Electron usually does)
                         // fs.renameSync works if on same drive, but cpSync is safer for cross-device.
                         // Since temp is usually on C and desktop on C, rename might work, but let's use cpSync which is standard in recent Electron.
                        fs.cpSync(sourceDir, targetDir, { recursive: true });
                        importedCount++;
                    }
                }
            }

            // Cleanup
            fs.rmSync(tempExtractPath, { recursive: true, force: true });

            return { success: true, count: importedCount };
        } catch (error) {
            console.error('Error importing sessions:', error);
            return { success: false, error: error.message };
        }
    });
}

module.exports = registerSessionHandlers;
