class TimerView {
    constructor() {
        this.timerSeconds = 1500; // 25 minutes default
        this.timerInterval = null;
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
    }

    bindEvents() {
        if (this.timerStartBtn) this.timerStartBtn.addEventListener('click', () => this.startTimer());
        if (this.timerPauseBtn) this.timerPauseBtn.addEventListener('click', () => this.pauseTimer());
        if (this.timerResetBtn) this.timerResetBtn.addEventListener('click', () => this.resetTimer());

        if (this.timerIconBtn) this.timerIconBtn.addEventListener('click', () => this.openModal());
        if (this.closeTimerModalBtn) this.closeTimerModalBtn.addEventListener('click', () => this.closeModal());

        const presetBtnsLarge = document.querySelectorAll('.preset-btn-large');
        presetBtnsLarge.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTimerPreset(parseInt(btn.dataset.minutes));
                this.closeModal();
            });
        });
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
        this.timerSeconds = 1500;
        this.updateTimerDisplay();

        if (this.timerIconBtn) this.timerIconBtn.style.display = 'flex';
        if (this.timerCountdown) this.timerCountdown.style.display = 'none';
    }

    setTimerPreset(minutes) {
        this.pauseTimer();
        this.timerSeconds = minutes * 60;
        this.updateTimerDisplay();

        if (this.timerIconBtn) this.timerIconBtn.style.display = 'flex';
        if (this.timerCountdown) this.timerCountdown.style.display = 'none';
    }

    openModal() {
        this.timerModal.style.display = 'flex';
    }

    closeModal() {
        this.timerModal.style.display = 'none';
    }
}
