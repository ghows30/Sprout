class SettingsView {
    constructor(controller) {
        this.controller = controller;
    }

    getTemplate() {
        return `
        <div id="settings" class="view-section">
            <header>
                <h1>Impostazioni</h1>
                <p class="subtitle">Personalizza la tua esperienza di studio.</p>
            </header>

            <div class="settings-container">
                <!-- Generali -->
                <section class="settings-section">
                    <h2><i class="fas fa-palette"></i> Generali</h2>
                    <div class="settings-group">
                        <div class="setting-item">
                            <div class="setting-info">
                                <label for="theme-select">Tema</label>
                                <p class="setting-description">Scegli tra tema chiaro o scuro</p>
                            </div>
                            <select id="theme-select" class="setting-control">
                                <option value="light">Chiaro</option>
                                <option value="dark">Scuro</option>
                            </select>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <label for="language-select">Lingua</label>
                                <p class="setting-description">Lingua dell'interfaccia</p>
                            </div>
                            <select id="language-select" class="setting-control">
                                <option value="it">Italiano</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                    </div>
                </section>

                <!-- Editor -->
                <section class="settings-section">
                    <h2><i class="fas fa-edit"></i> Editor</h2>
                    <div class="settings-group">
                        <div class="setting-item">
                            <div class="setting-info">
                                <label for="font-size-input">Dimensione Font</label>
                                <p class="setting-description">Dimensione del testo nell'editor (px)</p>
                            </div>
                            <div class="setting-control-group">
                                <input type="range" id="font-size-input" min="12" max="24" step="1" class="setting-slider">
                                <span id="font-size-value" class="setting-value">16px</span>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <label for="font-family-select">Font</label>
                                <p class="setting-description">Famiglia di caratteri per l'editor</p>
                            </div>
                            <select id="font-family-select" class="setting-control">
                                <option value="Inter, system-ui, sans-serif">Inter (Default)</option>
                                <option value="'Courier New', monospace">Courier New</option>
                                <option value="Georgia, serif">Georgia</option>
                                <option value="'Arial', sans-serif">Arial</option>
                            </select>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <label for="autosave-input">Intervallo Auto-Save</label>
                                <p class="setting-description">Salvataggio automatico ogni N secondi</p>
                            </div>
                            <div class="setting-control-group">
                                <input type="range" id="autosave-input" min="10" max="120" step="10" class="setting-slider">
                                <span id="autosave-value" class="setting-value">30s</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Timer -->
                <section class="settings-section">
                    <h2><i class="fas fa-clock"></i> Timer</h2>
                    <div class="settings-group">
                        <div class="setting-item">
                            <div class="setting-info">
                                <label for="session-duration-input">Durata Sessione Predefinita</label>
                                <p class="setting-description">Durata predefinita del timer (minuti)</p>
                            </div>
                            <div class="setting-control-group">
                                <input type="range" id="session-duration-input" min="5" max="60" step="5" class="setting-slider">
                                <span id="session-duration-value" class="setting-value">25min</span>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <label for="sound-notifications-toggle">Notifiche Sonore</label>
                                <p class="setting-description">Riproduci un suono al termine del timer</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="sound-notifications-toggle">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </section>

                <!-- Dati -->
                <section class="settings-section">
                    <h2><i class="fas fa-database"></i> Dati</h2>
                    <div class="settings-group">
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Percorso Sessioni</label>
                                <p class="setting-description" id="sessions-path-display">Cartella dove vengono salvate le sessioni</p>
                            </div>
                            <button id="change-path-btn" class="btn-secondary">Cambia Percorso</button>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <label for="auto-backup-toggle">Backup Automatico</label>
                                <p class="setting-description">Crea backup automatici delle sessioni</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="auto-backup-toggle">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </section>

                <!-- Informazioni -->
                <section class="settings-section">
                    <h2><i class="fas fa-info-circle"></i> Informazioni</h2>
                    <div class="settings-group">
                        <div class="setting-item info-item">
                            <div class="setting-info">
                                <label>Versione</label>
                                <p class="setting-description">Sprout v1.0.0</p>
                            </div>
                        </div>

                        <div class="setting-item info-item">
                            <div class="setting-info">
                                <label>Sviluppato con</label>
                                <p class="setting-description">Electron, JavaScript, Quill.js</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Azioni -->
                <div class="settings-actions">
                    <button id="reset-settings-btn" class="btn-danger">
                        <i class="fas fa-undo"></i> Ripristina Predefinite
                    </button>
                </div>
            </div>
        </div>
        `;
    }

    init() {
        this.bindEvents();
        this.loadCurrentSettings();
    }

    bindEvents() {
        // Tema
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.controller.updateSetting('theme', e.target.value);
            });
        }

        // Lingua
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.controller.updateSetting('language', e.target.value);
            });
        }

        // Font size
        const fontSizeInput = document.getElementById('font-size-input');
        const fontSizeValue = document.getElementById('font-size-value');
        if (fontSizeInput && fontSizeValue) {
            fontSizeInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                fontSizeValue.textContent = `${value}px`;
                this.controller.updateSetting('editorFontSize', value);
            });
        }

        // Font family
        const fontFamilySelect = document.getElementById('font-family-select');
        if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', (e) => {
                this.controller.updateSetting('editorFontFamily', e.target.value);
            });
        }

        // Auto-save interval
        const autosaveInput = document.getElementById('autosave-input');
        const autosaveValue = document.getElementById('autosave-value');
        if (autosaveInput && autosaveValue) {
            autosaveInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                autosaveValue.textContent = `${value}s`;
                this.controller.updateSetting('autoSaveInterval', value);
            });
        }

        // Session duration
        const sessionDurationInput = document.getElementById('session-duration-input');
        const sessionDurationValue = document.getElementById('session-duration-value');
        if (sessionDurationInput && sessionDurationValue) {
            sessionDurationInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                sessionDurationValue.textContent = `${value}min`;
                this.controller.updateSetting('defaultSessionDuration', value);
            });
        }

        // Sound notifications
        const soundToggle = document.getElementById('sound-notifications-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                this.controller.updateSetting('soundNotifications', e.target.checked);
            });
        }

        // Auto backup
        const autoBackupToggle = document.getElementById('auto-backup-toggle');
        if (autoBackupToggle) {
            autoBackupToggle.addEventListener('change', (e) => {
                this.controller.updateSetting('autoBackup', e.target.checked);
            });
        }

        // Reset settings
        const resetBtn = document.getElementById('reset-settings-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Sei sicuro di voler ripristinare le impostazioni predefinite?')) {
                    this.controller.resetSettings();
                }
            });
        }

        // Change path (placeholder - richiede integrazione con Electron)
        const changePathBtn = document.getElementById('change-path-btn');
        if (changePathBtn) {
            changePathBtn.addEventListener('click', () => {
                alert('Funzionalità disponibile nella versione desktop completa');
            });
        }
    }

    loadCurrentSettings() {
        const settings = this.controller.getSettings();

        // Tema
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) themeSelect.value = settings.theme;

        // Lingua
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) languageSelect.value = settings.language;

        // Font size
        const fontSizeInput = document.getElementById('font-size-input');
        const fontSizeValue = document.getElementById('font-size-value');
        if (fontSizeInput && fontSizeValue) {
            fontSizeInput.value = settings.editorFontSize;
            fontSizeValue.textContent = `${settings.editorFontSize}px`;
        }

        // Font family
        const fontFamilySelect = document.getElementById('font-family-select');
        if (fontFamilySelect) fontFamilySelect.value = settings.editorFontFamily;

        // Auto-save
        const autosaveInput = document.getElementById('autosave-input');
        const autosaveValue = document.getElementById('autosave-value');
        if (autosaveInput && autosaveValue) {
            autosaveInput.value = settings.autoSaveInterval;
            autosaveValue.textContent = `${settings.autoSaveInterval}s`;
        }

        // Session duration
        const sessionDurationInput = document.getElementById('session-duration-input');
        const sessionDurationValue = document.getElementById('session-duration-value');
        if (sessionDurationInput && sessionDurationValue) {
            sessionDurationInput.value = settings.defaultSessionDuration;
            sessionDurationValue.textContent = `${settings.defaultSessionDuration}min`;
        }

        // Sound notifications
        const soundToggle = document.getElementById('sound-notifications-toggle');
        if (soundToggle) soundToggle.checked = settings.soundNotifications;

        // Auto backup
        const autoBackupToggle = document.getElementById('auto-backup-toggle');
        if (autoBackupToggle) autoBackupToggle.checked = settings.autoBackup;

        // Sessions path
        const pathDisplay = document.getElementById('sessions-path-display');
        if (pathDisplay && settings.sessionsPath) {
            pathDisplay.textContent = settings.sessionsPath;
        }
    }
}
