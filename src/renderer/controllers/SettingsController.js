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

    // Metodo per ottenere una singola impostazione (utile per altri controller)
    getSetting(key) {
        return this.model.getSetting(key);
    }
}
