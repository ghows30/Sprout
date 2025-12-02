class SettingsModel {
    constructor() {
        this.storageKey = 'sprout_settings';
        this.defaults = {
            // Generali
            theme: 'light',
            language: 'it',

            // Editor
            editorFontSize: 16,
            editorFontFamily: 'Inter, system-ui, sans-serif',
            autoSaveInterval: 30, // secondi

            // Timer
            defaultSessionDuration: 25, // minuti (Pomodoro)
            soundNotifications: true,

            // Dati
            sessionsPath: '',
            autoBackup: false
        };

        this.settings = this.loadSettings();
    }

    loadSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge con defaults per nuove impostazioni
                return { ...this.defaults, ...parsed };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return { ...this.defaults };
    }

    saveSettings(newSettings) {
        try {
            this.settings = { ...this.settings, ...newSettings };
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    getSetting(key) {
        return this.settings[key];
    }

    getAllSettings() {
        return { ...this.settings };
    }

    resetToDefaults() {
        this.settings = { ...this.defaults };
        localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        return this.settings;
    }

    // Applica il tema
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme || this.settings.theme);
    }
}
