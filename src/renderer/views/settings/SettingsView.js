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





        // Session duration
        const sessionDurationInput = document.getElementById('session-duration-input');
        const sessionDurationValue = document.getElementById('session-duration-value');
        if (sessionDurationInput && sessionDurationValue) {
            // Aggiorna il valore visivo durante il trascinamento
            sessionDurationInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                sessionDurationValue.textContent = `${value}min`;
            });

            // Applica l'impostazione solo al rilascio (conferma)
            sessionDurationInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                this.controller.updateSetting('defaultSessionDuration', value);
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




    }
}
