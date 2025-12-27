const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function registerFileHandlers() {
    ipcMain.handle('add-files-to-session', async (event, { sessionPath }) => {
        try {
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
}

module.exports = registerFileHandlers;
