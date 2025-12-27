const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function registerNoteHandlers() {
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
}

module.exports = registerNoteHandlers;
