class TimerView {
    constructor() {
        this.timerSeconds = 1500; // 25 minutes default
        this.timerInterval = null;
        this.selectedPresetMinutes = 25;

        // Advanced Timer State
        this.mode = 'WORK'; // WORK, BREAK
        this.breakMinutes = 5;
        this.totalCycles = 1;
        this.currentCycle = 1;
        this.workMinutes = 25; // Store work duration separately
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
    }

    cacheDOM() {
        this.timerDisplay = document.getElementById('timer-display');
        this.timerStartBtn = document.getElementById('timer-start');
        this.timerPauseBtn = document.getElementById('timer-pause');
        this.timerResetBtn = document.getElementById('timer-reset');
        this.timerModal = document.getElementById('timer-modal');
        this.closeTimerModalBtn = document.getElementById('close-timer-modal');
        this.timerIconBtn = document.getElementById('timer-icon-btn');
        this.timerCountdown = document.getElementById('timer-countdown');
        this.presetButtons = Array.from(document.querySelectorAll('.preset-btn-large:not(#custom-preset-btn)'));
        this.customPresetBtn = document.getElementById('custom-preset-btn');

        // Advanced Inputs
        this.breakInput = document.getElementById('break-duration');
        this.cyclesInput = document.getElementById('timer-cycles');

        // Sprout View
        this.sproutView = new SproutView();
    }

    bindEvents() {
        if (this.timerStartBtn) this.timerStartBtn.addEventListener('click', () => this.startTimer());
        if (this.timerPauseBtn) this.timerPauseBtn.addEventListener('click', () => this.pauseTimer());
        if (this.timerResetBtn) this.timerResetBtn.addEventListener('click', () => this.resetTimer());

        if (this.timerIconBtn) this.timerIconBtn.addEventListener('click', () => this.openModal());
        if (this.timerCountdown) this.timerCountdown.addEventListener('click', () => this.openModal());
        if (this.closeTimerModalBtn) this.closeTimerModalBtn.addEventListener('click', () => this.closeModal());

        this.presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes, 10);
                this.setTimerPreset(minutes);

                // Reset custom button text if needed
                if (this.customPresetBtn) {
                    this.customPresetBtn.textContent = 'Personalizzato';
                    this.customPresetBtn.classList.remove('preset-active');
                }
            });
        });

        if (this.customPresetBtn) {
            this.customPresetBtn.addEventListener('click', () => this.handleCustomPresetClick());
        }

        this.updatePresetSelection();
        this.updateTimerDisplay();

        // Input Listeners
        if (this.breakInput) {
            this.breakInput.addEventListener('change', (e) => {
                this.breakMinutes = parseInt(e.target.value, 10) || 5;
            });
        }
        if (this.cyclesInput) {
            this.cyclesInput.addEventListener('change', (e) => {
                this.totalCycles = parseInt(e.target.value, 10) || 1;
            });
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timerSeconds / 60);
        const seconds = this.timerSeconds % 60;
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (this.timerDisplay) this.timerDisplay.textContent = timeString;
        if (this.timerCountdown) this.timerCountdown.textContent = timeString;

        // Update UI to reflect mode
        if (this.timerDisplay) {
            this.timerDisplay.style.color = this.mode === 'BREAK' ? 'var(--accent-color)' : 'var(--primary-dark)';
        }

        this.updateSprout();
    }

    updateSprout() {
        // Inizializza SproutView se non fatto (lazy init o se il DOM è cambiato)
        if (!this.sproutView.stem) {
            this.sproutView.init();
        }

        // Calcola la percentuale di completamento
        let totalSeconds = this.workMinutes * 60;
        if (this.mode === 'BREAK') {
            totalSeconds = this.breakMinutes * 60;
        }

        const elapsed = totalSeconds - this.timerSeconds;
        const percentage = Math.min(1, Math.max(0, elapsed / totalSeconds));

        this.sproutView.update(percentage);
    }

    enterFocusMode() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        }
    }

    exitFocusMode() {
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(err => {
                console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
            });
        }
    }

    isRunning() {
        return !!this.timerInterval;
    }

    startTimer() {
        if (this.timerInterval) return;

        // If starting fresh (not paused), initialize cycle
        if (this.mode === 'WORK' && this.timerSeconds === this.workMinutes * 60 && this.currentCycle === 1) {
            // Read inputs one last time
            if (this.breakInput) this.breakMinutes = parseInt(this.breakInput.value, 10) || 5;
            if (this.cyclesInput) this.totalCycles = parseInt(this.cyclesInput.value, 10) || 1;
        }

        // Enter focus mode only if working
        if (this.mode === 'WORK') {
            this.enterFocusMode();
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Focus Mode', `Ciclo ${this.currentCycle}/${this.totalCycles}: Sessione avviata.`, 'info');
            }
        } else {
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Pausa', 'Tempo di pausa iniziato.', 'info');
            }
        }

        if (this.timerIconBtn) this.timerIconBtn.style.display = 'none';
        if (this.timerCountdown) this.timerCountdown.style.display = 'block';

        this.timerStartBtn.style.display = 'none';
        this.timerPauseBtn.style.display = 'flex';

        this.timerInterval = setInterval(() => {
            if (this.timerSeconds > 0) {
                this.timerSeconds--;
                this.updateTimerDisplay();
            } else {
                this.handleTimerComplete();
            }
        }, 1000);
    }

    handleTimerComplete() {
        this.pauseTimer(true); // Stop interval silently

        if (this.mode === 'WORK') {
            // Work session ended
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Sessione Terminata', 'Ottimo lavoro! Prenditi una pausa.', 'success');
            }

            // Switch to Break
            this.mode = 'BREAK';
            this.timerSeconds = this.breakMinutes * 60;
            this.updateTimerDisplay();

            // Auto-start break
            this.startTimer();

        } else {
            // Break ended
            if (this.currentCycle < this.totalCycles) {
                // More cycles to go
                this.currentCycle++;
                this.mode = 'WORK';
                this.timerSeconds = this.workMinutes * 60;
                this.updateTimerDisplay();

                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Pausa Terminata', `Pronto per il ciclo ${this.currentCycle}? Si riparte!`, 'info');
                }

                // Auto-start next work session
                this.startTimer();
            } else {
                // All cycles done
                this.mode = 'WORK'; // Reset for next time
                this.currentCycle = 1;
                this.timerSeconds = this.workMinutes * 60;
                this.updateTimerDisplay();

                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Ciclo Completato', 'Hai completato tutti i cicli programmati!', 'success');
                }

                // Reset UI
                this.resetTimer();
            }
        }
    }

    pauseTimer(silent = false) {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;

            // Exit focus mode when paused (only if in WORK mode)
            if (this.mode === 'WORK') {
                this.exitFocusMode();
                if (!silent && typeof toastManager !== 'undefined') {
                    toastManager.show('Focus Mode', 'Hai lasciato la modalità focus.', 'info');
                }
            }
        }
        this.timerStartBtn.style.display = 'flex';
        this.timerPauseBtn.style.display = 'none';
    }

    resetTimer() {
        this.pauseTimer();
        this.mode = 'WORK';
        this.currentCycle = 1;
        this.timerSeconds = this.selectedPresetMinutes * 60;
        this.workMinutes = this.selectedPresetMinutes;
        this.updateTimerDisplay();

        if (this.timerIconBtn) this.timerIconBtn.style.display = 'flex';
        if (this.timerCountdown) this.timerCountdown.style.display = 'none';
    }

    setTimerPreset(minutes) {
        this.pauseTimer();
        this.selectedPresetMinutes = minutes;
        this.workMinutes = minutes; // Update work duration
        this.timerSeconds = minutes * 60;
        this.updateTimerDisplay();
        this.updatePresetSelection();

        if (this.timerIconBtn) this.timerIconBtn.style.display = 'flex';
        if (this.timerCountdown) this.timerCountdown.style.display = 'none';
    }

    openModal() {
        this.updatePresetSelection();
        this.timerModal.style.display = 'flex';
    }

    closeModal() {
        this.timerModal.style.display = 'none';
    }

    handleCustomPresetClick() {
        if (this.customPresetBtn.querySelector('input')) return; // Already editing

        const originalText = this.customPresetBtn.textContent;
        this.customPresetBtn.textContent = '';

        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.max = '999';
        input.placeholder = 'min';
        input.className = 'custom-preset-input';

        // Prevent click propagation to avoid re-triggering
        input.addEventListener('click', (e) => e.stopPropagation());

        const confirmValue = () => {
            const val = parseInt(input.value, 10);
            if (val && val > 0) {
                this.setTimerPreset(val);
                this.customPresetBtn.textContent = `${val}m`;
                this.customPresetBtn.classList.add('preset-active');
                // Deselect other presets
                this.presetButtons.forEach(btn => btn.classList.remove('preset-active'));
            } else {
                this.customPresetBtn.textContent = 'Personalizzato';
                this.customPresetBtn.classList.remove('preset-active');
            }
        };

        input.addEventListener('blur', confirmValue);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });

        this.customPresetBtn.appendChild(input);
        input.focus();
    }

    updatePresetSelection() {
        if (!this.presetButtons) return;
        this.presetButtons.forEach(btn => {
            const minutes = parseInt(btn.dataset.minutes, 10);
            if (minutes === this.selectedPresetMinutes) {
                btn.classList.add('preset-active');
            } else {
                btn.classList.remove('preset-active');
            }
        });
    }

    setDefaultDuration(minutes) {
        // Aggiorna solo se il timer non è in esecuzione
        if (this.timerInterval) return;

        this.selectedPresetMinutes = minutes;
        this.workMinutes = minutes;
        this.timerSeconds = minutes * 60;
        this.updateTimerDisplay();
        this.updatePresetSelection();
    }
}
