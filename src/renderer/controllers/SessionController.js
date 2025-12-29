class SessionController {
    constructor() {
        this.model = new SessionModel();
        this.settingsModel = new SettingsModel();
        this.listView = new SessionListView(this);
        this.activeView = new ActiveSessionView(this);
        this.timerView = new TimerView();
        this.flashcardView = new FlashcardView(this);
        // DocumentView initialized in initActiveSessionViews

        // Instantiate Sub-Controllers
        this.fileController = new SessionFileController(this);
        this.noteController = new SessionNoteController(this);
        this.deckController = new SessionDeckController(this);

        this.init();
    }

    init() {
        this.loadSessions();

        // Subscribe to global events
        if (typeof eventManager !== 'undefined') {
            eventManager.subscribe('SESSION_CREATED', () => {
                this.loadSessions();
            });

            eventManager.subscribe('SETTINGS_UPDATED', (data) => {
                if (data.key === 'defaultSessionDuration') {
                    this.timerView.setDefaultDuration(data.value);
                }
            });
        }
    }

    async loadSessions() {
        const sessions = await this.model.getSessions();
        this.listView.setSessions(sessions);
    }

    async createSession(name, uploadedFiles) {
        if (!name || !name.trim()) {
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Errore', 'Inserisci un nome per la sessione', 'error');
            }
            return { success: false, error: 'EMPTY_NAME' };
        }

        const checkResult = await this.model.checkSessionNameExists(name);
        if (checkResult.exists) {
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Errore', 'Esiste già uno spazio con questo nome', 'error');
            }
            return { success: false, error: 'SESSION_NAME_EXISTS' };
        }

        const processedFiles = this.model.processNewSessionFiles(uploadedFiles);

        const session = {
            id: Date.now(),
            name: name,
            files: processedFiles,
            createdAt: new Date().toISOString()
        };

        this.model.saveSession(session);

        if (typeof eventManager !== 'undefined') {
            eventManager.notify('SESSION_CREATED', session);
        }

        return { success: true };
    }

    async renameSession(sessionPath, oldName, newName) {
        try {
            if (!newName || !newName.trim()) {
                return { success: false, error: 'EMPTY_NAME' };
            }

            const checkResult = await this.model.checkSessionNameExists(newName, sessionPath);
            if (checkResult.exists) {
                return { success: false, error: 'SESSION_NAME_EXISTS' };
            }

            const result = await this.model.renameSession(sessionPath, newName);

            if (result.success) {
                // Ricarica le sessioni
                await this.loadSessions();
            }

            return result;
        } catch (error) {
            console.error('Error renaming session:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteSession(sessionPath, sessionName) {
        try {
            const result = await this.model.deleteSession(sessionPath);

            if (result.success) {
                await this.loadSessions();

                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Successo', `Spazio "${sessionName}" eliminato`, 'success');
                }
            } else {
                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Errore', 'Impossibile eliminare lo spazio', 'error');
                }
            }

            return result;
        } catch (error) {
            console.error('Error deleting session:', error);
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Errore', 'Errore durante l\'eliminazione', 'error');
            }
            return { success: false, error: error.message };
        }
    }

    async openSession(session) {
        this.model.setCurrentSession(session);

        try {
            const decksResult = await this.model.loadDecks();
            if (decksResult.success) {
                session.decks = decksResult.decks;
            } else {
                session.decks = [];
            }
        } catch (error) {
            console.error('Error loading decks:', error);
            session.decks = [];
        }

        // Switch view using App navigation
        if (typeof App !== 'undefined' && App.showView) {
            App.showView('active-session');
        } else {
            console.error('App.showView is not defined');
        }
    }

    initActiveSessionViews() {
        this.activeView.init();

        // Initialize DocumentView with callback to save tabs
        this.documentView = new DocumentView((tabsState) => {
            const currentSession = this.model.getCurrentSession();
            if (currentSession) {
                currentSession.tabsState = tabsState;
                this.model.saveSessionData(currentSession);
            }
        });
        this.documentView.init();

        // Restore tabs if they exist in the session
        const currentSession = this.model.getCurrentSession();
        if (currentSession && currentSession.tabsState) {
            this.documentView.restoreTabs(currentSession.tabsState);
        }

        this.flashcardView.init();
        this.timerView.init();

        this.settingsModel.settings = this.settingsModel.loadSettings();
        const settings = this.settingsModel.getAllSettings();

        if (settings && settings.defaultSessionDuration) {
            this.timerView.setDefaultDuration(settings.defaultSessionDuration);
        }
    }

    // --- Delegates to SessionNoteController ---
    async saveNote(content, fileName) {
        return this.noteController.saveNote(content, fileName);
    }

    async autoSaveNote(content) {
        return this.noteController.autoSaveNote(content);
    }

    async loadNotes() {
        return this.noteController.loadNotes();
    }

    // --- Delegates to SessionFileController ---
    async addDocuments() {
        return this.fileController.addDocuments();
    }

    async deleteFile(fileName) {
        return this.fileController.deleteFile(fileName);
    }

    openDocument(file, fileName) {
        const currentSession = this.model.getCurrentSession();
        if (!currentSession) return;

        const absolutePath = `file://${currentSession.fullPath}/${file}`;
        this.documentView.openDocument(absolutePath, fileName);
    }

    // --- Delegates to SessionDeckController ---
    async createDeck(name, options = {}) {
        return this.deckController.createDeck(name, options);
    }

    async deleteDeck(deckId) {
        return this.deckController.deleteDeck(deckId);
    }

    async renameDeck(deckId, newName) {
        return this.deckController.renameDeck(deckId, newName);
    }

    async createFlashcard(deckId, question, answer) {
        return this.deckController.createFlashcard(deckId, question, answer);
    }

    async updateFlashcardStatus(deckId, cardId, status) {
        return this.deckController.updateFlashcardStatus(deckId, cardId, status);
    }

    async importFlashcards(params) {
        return this.deckController.importFlashcards(params);
    }

    // --- Timer Methods (Simple enough to keep here or move to TimerController later) ---
    isTimerRunning() {
        return this.timerView && this.timerView.isRunning();
    }

    stopTimer() {
        if (this.timerView) {
            this.timerView.resetTimer();
        }
    }

    async exportSelectedSessions(sessionPaths) {
        if (!sessionPaths || sessionPaths.length === 0) {
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Info', 'Seleziona almeno uno spazio da esportare', 'info');
            }
            return { success: false };
        }

        if (typeof toastManager !== 'undefined') {
            toastManager.show('Info', 'Esportazione in corso...', 'info');
        }

        const result = await this.model.exportSessions(sessionPaths);

        if (result.success) {
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Successo', 'Spazi esportati con successo', 'success');
            }
        } else if (!result.canceled) {
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Errore', 'Errore durante l\'esportazione: ' + result.error, 'error');
            }
        }
        return result;
    }

    async importSessions() {
        if (typeof toastManager !== 'undefined') {
            toastManager.show('Info', 'Selezione file in corso...', 'info');
        }

        const result = await this.model.importSessions();

        if (result.success) {
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Successo', `${result.count} spazi importati con successo`, 'success');
            }
            await this.loadSessions();
        } else if (!result.canceled) {
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Errore', 'Errore durante l\'importazione: ' + result.error, 'error');
            }
        }
        return result;
    }
}
