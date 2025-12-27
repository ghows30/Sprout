const { ipcMain, dialog, app } = require('electron');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { sproutPath } = require('../utils/paths');

function registerBackupHandlers() {
    ipcMain.handle('create-backup', async (event, { settings }) => {
        try {
            const { filePath } = await dialog.showSaveDialog({
                title: 'Esporta Backup',
                defaultPath: `sprout-backup-${new Date().toISOString().split('T')[0]}.zip`,
                filters: [{ name: 'Sprout Backup', extensions: ['zip'] }]
            });

            if (!filePath) return { success: false, canceled: true };

            const zip = new AdmZip();

            // Aggiungi file e cartelle di Sprout
            if (fs.existsSync(sproutPath)) {
                zip.addLocalFolder(sproutPath, 'sprout_data');
            }

            // Aggiungi impostazioni
            zip.addFile('settings.json', Buffer.from(JSON.stringify(settings, null, 2), 'utf8'));

            // Scrivi il file zip
            zip.writeZip(filePath);

            return { success: true, filePath };
        } catch (error) {
            console.error('Error creating backup:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('restore-backup', async () => {
        try {
            const { filePaths } = await dialog.showOpenDialog({
                title: 'Importa Backup',
                filters: [{ name: 'Sprout Backup', extensions: ['zip'] }],
                properties: ['openFile']
            });

            if (!filePaths || filePaths.length === 0) return { success: false, canceled: true };

            const zipPath = filePaths[0];
            const zip = new AdmZip(zipPath);
            const zipEntries = zip.getEntries();

            // 1. Estrai impostazioni
            const settingsEntry = zipEntries.find(entry => entry.entryName === 'settings.json');
            let settings = null;
            if (settingsEntry) {
                const settingsData = zip.readAsText(settingsEntry);
                settings = JSON.parse(settingsData);
            }

            // 2. Ripristina dati (sprout_data)
            // Attenzione: Questo sovrascriverà i dati esistenti!

            // Pulisci la cartella corrente (opzionale, ma consigliato per evitare mix)
            // Per sicurezza, potremmo fare un backup automatico prima? 
            // Per ora procediamo pulendo la directory sproutPath se esiste.
            if (fs.existsSync(sproutPath)) {
                fs.rmSync(sproutPath, { recursive: true, force: true });
                fs.mkdirSync(sproutPath);
            }

            // Estrai cartella dati
            // adm-zip extractAllTo non permette facilmente di filtrare solo una sottocartella senza struttura
            // Quindi estraiamo tutto in temp e spostiamo

            const tempExtractPath = path.join(app.getPath('temp'), 'sprout-restore-temp');
            if (fs.existsSync(tempExtractPath)) {
                fs.rmSync(tempExtractPath, { recursive: true, force: true });
            }
            fs.mkdirSync(tempExtractPath);

            zip.extractAllTo(tempExtractPath, true);

            const extractedDataPath = path.join(tempExtractPath, 'sprout_data');
            if (fs.existsSync(extractedDataPath)) {
                // Sposta contenuto in sproutPath
                // fs.cpSync è disponibile da Node 16.7.0
                fs.cpSync(extractedDataPath, sproutPath, { recursive: true });
            }

            // Pulizia temp
            fs.rmSync(tempExtractPath, { recursive: true, force: true });

            return { success: true, settings };
        } catch (error) {
            console.error('Error restoring backup:', error);
            return { success: false, error: error.message };
        }
    });
}

module.exports = registerBackupHandlers;
