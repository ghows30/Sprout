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
                    </div>
                </section>

                <!-- Timer -->
                <section class="settings-section">
                    <h2><i class="fas fa-clock"></i> Timer</h2>
                    <div class="settings-group">
                        <div class="setting-item">
                            <div class="setting-info">
                                <label for="session-duration-input">Durata Spazio Predefinita</label>
                                <p class="setting-description">Durata predefinita del timer (minuti)</p>
                            </div>
                            <div class="setting-control-group">
                                <input type="range" id="session-duration-input" min="5" max="60" step="5" class="setting-slider">
                                <span id="session-duration-value" class="setting-value">25min</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Accessibilità -->
                <section class="settings-section">
                    <h2><i class="fas fa-universal-access"></i> Accessibilità</h2>
                    <div class="settings-group">
                        <div class="setting-item">
                            <div class="setting-info">
                                <label for="font-size-select">Dimensione Testo</label>
                                <p class="setting-description">Regola la dimensione del testo</p>
                            </div>
                            <select id="font-size-select" class="setting-control">
                                <option value="small">Piccolo</option>
                                <option value="normal">Normale</option>
                                <option value="large">Grande</option>
                                <option value="xlarge">Molto Grande</option>
                            </select>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <label for="font-family-select">Tipo di Font</label>
                                <p class="setting-description">Seleziona il tipo di carattere per l'interfaccia</p>
                            </div>
                            <select id="font-family-select" class="setting-control">
                                <option value="default">Standard (Inter)</option>
                                <option value="dyslexic">Alta Leggibilità (OpenDyslexic)</option>
                            </select>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <label for="color-filter-select">Filtro Colore</label>
                                <p class="setting-description">Filtri per daltonismo</p>
                            </div>
                            <select id="color-filter-select" class="setting-control">
                                <option value="none">Nessuno</option>
                                <option value="protanopia">Protanopia (Rosso)</option>
                                <option value="deuteranopia">Deuteranopia (Verde)</option>
                                <option value="tritanopia">Tritanopia (Blu)</option>
                                <option value="achromatopsia">Achromatopsia (Monocromatico)</option>
                                <option value="grayscale">Scala di Grigi (Contrasto)</option>
                            </select>
                        </div>
                    </div>
                </section>

                <!-- Backup & Ricostruzione (Precedente) -->
                <section class="settings-section">
                    <h2><i class="fas fa-save"></i> Backup & Ripristino</h2>
                    <div class="settings-group">
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Esporta Dati</label>
                                <p class="setting-description">Scarica un archivio con tutti i tuoi dati e impostazioni</p>
                            </div>
                            <button id="export-backup-btn" class="btn btn-secondary">
                                <i class="fas fa-download"></i> Esporta Backup
                            </button>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Importa Dati</label>
                                <p class="setting-description">Ripristina i dati da un backup precedente (sovrascrive i dati attuali)</p>
                            </div>
                            <button id="import-backup-btn" class="btn btn-secondary">
                                <i class="fas fa-upload"></i> Importa Backup
                            </button>
                            <input type="file" id="import-backup-input" accept=".zip" style="display: none;">
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
                                <p class="setting-description">Electron, JavaScript</p>
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

        // Session duration
        const sessionDurationInput = document.getElementById('session-duration-input');
        const sessionDurationValue = document.getElementById('session-duration-value');
        if (sessionDurationInput && sessionDurationValue) {
            sessionDurationInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                sessionDurationValue.textContent = `${value}min`;
            });

            sessionDurationInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                this.controller.updateSetting('defaultSessionDuration', value);
            });
        }

        // Accessibility Events
        const fontSizeSelect = document.getElementById('font-size-select');
        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', (e) => {
                this.controller.updateSetting('accessibilityFontSize', e.target.value);
            });
        }

        const fontFamilySelect = document.getElementById('font-family-select');
        if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', (e) => {
                this.controller.updateSetting('accessibilityFont', e.target.value);
            });
        }

        const colorFilterSelect = document.getElementById('color-filter-select');
        if (colorFilterSelect) {
            colorFilterSelect.addEventListener('change', (e) => {
                this.controller.updateSetting('colorFilter', e.target.value);
            });
        }

        // Backup & Restore
        const exportBackupBtn = document.getElementById('export-backup-btn');
        if (exportBackupBtn) {
            exportBackupBtn.addEventListener('click', () => {
                this.controller.exportBackup();
            });
        }

        const importBackupBtn = document.getElementById('import-backup-btn');
        const importBackupInput = document.getElementById('import-backup-input');
        if (importBackupBtn && importBackupInput) {
            importBackupBtn.addEventListener('click', () => {
                importBackupInput.click();
            });

            importBackupInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.controller.importBackup();
                    e.target.value = '';
                }
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
    }

    loadCurrentSettings() {
        const settings = this.controller.getSettings();

        // Tema
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) themeSelect.value = settings.theme;

        // Session duration
        const sessionDurationInput = document.getElementById('session-duration-input');
        const sessionDurationValue = document.getElementById('session-duration-value');
        if (sessionDurationInput && sessionDurationValue) {
            sessionDurationInput.value = settings.defaultSessionDuration;
            sessionDurationValue.textContent = `${settings.defaultSessionDuration}min`;
        }

        // Load Accessibility Settings
        const fontSizeSelect = document.getElementById('font-size-select');
        if (fontSizeSelect) fontSizeSelect.value = settings.accessibilityFontSize || 'normal';

        const fontFamilySelect = document.getElementById('font-family-select');
        if (fontFamilySelect) fontFamilySelect.value = settings.accessibilityFont || 'default';

        const colorFilterSelect = document.getElementById('color-filter-select');
        if (colorFilterSelect) colorFilterSelect.value = settings.colorFilter || 'none';
    }
}
