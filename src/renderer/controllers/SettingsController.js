class SettingsController {
    constructor() {
        this.model = new SettingsModel();
        this.view = new SettingsView(this);
    }

    getTemplate() {
        return this.view.getTemplate();
    }

    init() {
        this.view.init();
        // Applica il tema salvato
        this.model.applyTheme();
    }

    getSettings() {
        return this.model.getAllSettings();
    }

    updateSetting(key, value) {
        const update = {};
        update[key] = value;

        if (this.model.saveSettings(update)) {
            // Applica immediatamente alcune impostazioni
            this.applySettingImmediately(key, value);

            // Notifica globale del cambiamento
            if (typeof eventManager !== 'undefined') {
                eventManager.notify('SETTINGS_UPDATED', { key, value });
            }
        }
    }

    applySettingImmediately(key, value) {
        switch (key) {
            case 'theme':
                this.model.applyTheme(value);
                break;
            case 'editorFontSize':
            case 'editorFontFamily':
                // Aggiorna l'editor se è aperto
                this.updateEditorStyles();
                break;
        }
    }

    updateEditorStyles() {
        const settings = this.model.getAllSettings();
        const editor = document.querySelector('.ql-editor');
        if (editor) {
            editor.style.fontSize = `${settings.editorFontSize}px`;
            editor.style.fontFamily = settings.editorFontFamily;
        }
    }

    resetSettings() {
        const defaults = this.model.resetToDefaults();
        this.view.loadCurrentSettings();
        this.model.applyTheme(defaults.theme);
        this.updateEditorStyles();
    }

    async exportBackup() {
        try {
            const settings = this.model.getAllSettings();
            const { ipcRenderer } = require('electron');

            // Disable button feedback handled by UI usually, but here we invoke IPC
            const result = await ipcRenderer.invoke('create-backup', { settings });

            if (result.success) {
                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Successo', 'Backup esportato con successo', 'success');
                }
            } else if (!result.canceled) {
                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Errore', 'Errore durante l\'esportazione: ' + result.error, 'error');
                }
            }
        } catch (error) {
            console.error('Export backup error:', error);
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Errore', 'Errore imprevisto durante l\'esportazione', 'error');
            }
        }
    }

    async importBackup() {
        const { ipcRenderer } = require('electron');

        if (!confirm('ATTENZIONE: Importare un backup sovrascriverà TUTTI i dati attuali (sessioni, file, appunti). Sei sicuro di voler procedere?')) {
            return;
        }

        try {
            const result = await ipcRenderer.invoke('restore-backup');

            if (result.success) {
                if (result.settings) {
                    this.model.importSettings(result.settings);
                }

                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Successo', 'Backup ripristinato. L\'app verrà ricaricata.', 'success');
                }

                // Ricarica l'app dopo breve delay per applicare tutto
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else if (!result.canceled) {
                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Errore', 'Errore durante il ripristino: ' + result.error, 'error');
                }
            }
        } catch (error) {
            console.error('Import backup error:', error);
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Errore', 'Errore imprevisto durante il ripristino', 'error');
            }
        }
    }

    // Metodo per ottenere una singola impostazione (utile per altri controller)
    getSetting(key) {
        return this.model.getSetting(key);
    }
}
