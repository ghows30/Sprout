class TimerView {
    constructor() {
        this.timerSeconds = 1500; // 25 minutes default
        this.timerInterval = null;
        this.selectedPresetMinutes = 25;
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
        this.presetButtons = Array.from(document.querySelectorAll('.preset-btn-large'));
    }

    bindEvents() {
        if (this.timerStartBtn) this.timerStartBtn.addEventListener('click', () => this.startTimer());
        if (this.timerPauseBtn) this.timerPauseBtn.addEventListener('click', () => this.pauseTimer());
        if (this.timerResetBtn) this.timerResetBtn.addEventListener('click', () => this.resetTimer());

        if (this.timerIconBtn) this.timerIconBtn.addEventListener('click', () => this.openModal());
        if (this.closeTimerModalBtn) this.closeTimerModalBtn.addEventListener('click', () => this.closeModal());

        this.presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes, 10);
                this.setTimerPreset(minutes);
            });
        });

        this.updatePresetSelection();
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timerSeconds / 60);
        const seconds = this.timerSeconds % 60;
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (this.timerDisplay) this.timerDisplay.textContent = timeString;
        if (this.timerCountdown) this.timerCountdown.textContent = timeString;
    }

    startTimer() {
        if (this.timerInterval) return;

        if (this.timerIconBtn) this.timerIconBtn.style.display = 'none';
        if (this.timerCountdown) this.timerCountdown.style.display = 'block';

        this.timerStartBtn.style.display = 'none';
        this.timerPauseBtn.style.display = 'flex';

        this.timerInterval = setInterval(() => {
            if (this.timerSeconds > 0) {
                this.timerSeconds--;
                this.updateTimerDisplay();
            } else {
                this.pauseTimer();
                alert('Timer completato!');
            }
        }, 1000);
    }

    pauseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerStartBtn.style.display = 'flex';
        this.timerPauseBtn.style.display = 'none';
    }

    resetTimer() {
        this.pauseTimer();
        this.timerSeconds = this.selectedPresetMinutes * 60;
        this.updateTimerDisplay();

        if (this.timerIconBtn) this.timerIconBtn.style.display = 'flex';
        if (this.timerCountdown) this.timerCountdown.style.display = 'none';
    }

    setTimerPreset(minutes) {
        this.pauseTimer();
        this.selectedPresetMinutes = minutes;
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
        this.timerSeconds = minutes * 60;
        this.updateTimerDisplay();
        this.updatePresetSelection();
    }
}
