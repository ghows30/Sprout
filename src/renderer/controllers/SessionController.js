class SessionController {
    constructor() {
        this.model = new SessionModel();
        this.settingsModel = new SettingsModel();
        this.listView = new SessionListView(this);
        this.activeView = new ActiveSessionView(this);
        this.timerView = new TimerView();
        this.flashcardView = new FlashcardView(this);
        // DocumentView initialized in initActiveSessionViews

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

    async saveNote(content, fileName) {
        if (typeof toastManager === 'undefined') return;

        try {
            const result = await this.model.saveNote(content, fileName);
            if (result.success) {
                toastManager.show('Salvato', 'Appunti salvati con successo!', 'success');
            } else {
                toastManager.show('Errore', 'Errore durante il salvataggio: ' + result.error, 'error');
            }
        } catch (error) {
            console.error(error);
            toastManager.show('Errore', 'Errore durante il salvataggio.', 'error');
        }
    }

    async autoSaveNote(content) {
        try {
            const result = await this.model.autoSaveNotes(content);
            return result;
        } catch (error) {
            console.error('Auto-save error:', error);
            return { success: false };
        }
    }

    async loadNotes() {
        try {
            const result = await this.model.loadNotes();
            return result;
        } catch (error) {
            console.error('Load notes error:', error);
            return { success: false, content: '' };
        }
    }

    async addDocuments() {
        if (typeof toastManager === 'undefined') {
            console.error('ToastManager not found');
            return;
        }

        try {
            const result = await this.model.addFilesToSession();

            if (result.success && result.files) {
                // Check for duplicates
                if (result.duplicates && result.duplicates.length > 0) {
                    const dupCount = result.duplicates.length;
                    toastManager.show(
                        'File duplicati',
                        `${dupCount} file ${dupCount === 1 ? 'è già presente' : 'sono già presenti'} nella sessione`,
                        'warning'
                    );
                }

                // Check for new files added
                const newCount = result.newFilesCount || 0;
                if (newCount > 0) {
                    const currentSession = this.model.getCurrentSession();
                    currentSession.files = result.files;
                    this.activeView.renderFileList(currentSession.files);

                    toastManager.show(
                        'File aggiunti',
                        `${newCount} ${newCount === 1 ? 'file aggiunto' : 'file aggiunti'} con successo`,
                        'success'
                    );
                }
            } else if (result.canceled) {
                // User canceled - no notification needed
            }
        } catch (error) {
            console.error(error);
            toastManager.show('Errore', 'Impossibile aggiungere i file', 'error');
        }
    }

    async createDeck(name, options = {}) {
        const { skipRender = false } = options;
        const currentSession = this.model.getCurrentSession();
        if (!currentSession) return;

        if (!currentSession.decks) {
            currentSession.decks = [];
        }

        const trimmedName = name.trim();
        if (currentSession.decks.some(d => d.name.trim() === trimmedName)) {
            return { success: false, error: 'DUPLICATE_NAME' };
        }

        const deck = {
            id: Date.now(),
            name: name,
            cards: [],
            createdAt: new Date().toISOString()
        };

        const result = await this.model.saveDeck(deck);

        if (result.success) {
            currentSession.decks.push(deck);

            if (!skipRender) {
                this.flashcardView.render(currentSession.decks);
            }
            return { success: true, deck };
        } else {
            console.error('Failed to save deck:', result.error);
            return null;
        }
    }

    async deleteDeck(deckId) {
        const currentSession = this.model.getCurrentSession();
        if (!currentSession || !currentSession.decks) return { success: false, error: 'NO_SESSION' };

        const deckIndex = currentSession.decks.findIndex(d => d.id === deckId);
        if (deckIndex === -1) return { success: false, error: 'DECK_NOT_FOUND' };

        const deck = currentSession.decks[deckIndex];
        currentSession.decks.splice(deckIndex, 1);

        const result = await this.model.deleteDeck(deck);

        if (result.success) {
            this.flashcardView.render(currentSession.decks);
            return { success: true };
        } else {
            // Ripristina in caso di errore
            currentSession.decks.splice(deckIndex, 0, deck);
            return { success: false, error: result.error };
        }
    }

    async renameDeck(deckId, newName) {
        const currentSession = this.model.getCurrentSession();
        if (!currentSession || !currentSession.decks) return { success: false, error: 'NO_SESSION' };

        // Check duplicati (case-sensitive)
        const trimmedName = newName.trim();
        if (currentSession.decks.some(d => d.id !== deckId && d.name.trim() === trimmedName)) {
            return { success: false, error: 'DUPLICATE_NAME' };
        }

        const deck = currentSession.decks.find(d => d.id === deckId);
        if (!deck) return { success: false, error: 'DECK_NOT_FOUND' };

        const oldName = deck.name;

        const result = await this.model.renameDeck(oldName, trimmedName);

        if (result.success) {
            deck.name = trimmedName;
            this.flashcardView.render(currentSession.decks);
            return { success: true };
        } else {
            return { success: false, error: result.error };
        }
    }

    async createFlashcard(deckId, question, answer) {
        const currentSession = this.model.getCurrentSession();
        if (!currentSession || !currentSession.decks) return;

        const deck = currentSession.decks.find(d => d.id === deckId);
        if (!deck) return;

        const flashcard = {
            id: Date.now(),
            question: question,
            answer: answer,
            status: 'new', // new, review, consolidated
            createdAt: new Date().toISOString()
        };

        deck.cards.push(flashcard);

        await this.model.saveDeck(deck);

        this.flashcardView.render(currentSession.decks);
    }

    normalizeStatus(status) {
        if (!status) return 'new';
        const normalized = String(status).toLowerCase();
        if (['new', 'review', 'consolidated'].includes(normalized)) return normalized;
        if (['todo', 'pending'].includes(normalized)) return 'new';
        if (['done', 'ok', 'consolidato', 'completed'].includes(normalized)) return 'consolidated';
        return 'new';
    }

    async importFlashcards({ cards, targetDeckId = null, newDeckName = '', useDeckField = false }) {
        const currentSession = this.model.getCurrentSession();
        if (!currentSession) {
            return { success: false, error: 'NO_SESSION' };
        }

        if (!cards || cards.length === 0) {
            return { success: false, error: 'NO_CARDS' };
        }

        if (!currentSession.decks) {
            currentSession.decks = [];
        }

        const deckById = new Map(currentSession.decks.map(deck => [String(deck.id), deck]));
        const deckByName = new Map(currentSession.decks.map(deck => [deck.name.toLowerCase(), deck]));

        const ensureDeck = async (name) => {
            if (!name) return null;
            const key = name.toLowerCase();
            if (deckByName.has(key)) return deckByName.get(key);

            const created = await this.createDeck(name, { skipRender: true });
            if (created) {
                deckById.set(String(created.id), created);
                deckByName.set(key, created);
            }
            return created;
        };

        let fallbackDeck = null;
        if (targetDeckId) {
            fallbackDeck = deckById.get(String(targetDeckId)) || deckById.get(Number(targetDeckId));
        } else if (newDeckName) {
            fallbackDeck = await ensureDeck(newDeckName);
        }

        if (!useDeckField && !fallbackDeck) {
            return { success: false, error: 'DECK_NOT_SELECTED' };
        }

        const deckBuckets = new Map();
        let skipped = 0;
        let imported = 0;
        let counter = 0;
        const now = Date.now();

        for (const draft of cards) {
            const deckNameFromFile = draft.deck && String(draft.deck).trim();
            let targetDeck = fallbackDeck;

            if (useDeckField && deckNameFromFile) {
                targetDeck = await ensureDeck(deckNameFromFile);
            } else if (useDeckField && !deckNameFromFile && fallbackDeck) {
                targetDeck = fallbackDeck;
            } else if (useDeckField && !deckNameFromFile && !fallbackDeck) {
                skipped++;
                continue;
            }

            if (!targetDeck) {
                skipped++;
                continue;
            }

            if (!deckBuckets.has(targetDeck.id)) {
                deckBuckets.set(targetDeck.id, []);
            }

            deckBuckets.get(targetDeck.id).push({
                id: now + counter++,
                question: draft.question,
                answer: draft.answer,
                status: this.normalizeStatus(draft.status),
                createdAt: new Date().toISOString()
            });
        }

        for (const [deckId, newCards] of deckBuckets.entries()) {
            const deck = deckById.get(String(deckId)) || deckById.get(Number(deckId));
            if (!deck) {
                skipped += newCards.length;
                continue;
            }

            deck.cards = deck.cards || [];
            deck.cards.push(...newCards);

            const saveResult = await this.model.saveDeck(deck);
            if (!saveResult.success) {
                return { success: false, error: saveResult.error || 'SAVE_FAILED' };
            }

            imported += newCards.length;
        }

        this.flashcardView.render(currentSession.decks);

        return {
            success: true,
            imported,
            skipped,
            updatedDecks: deckBuckets.size
        };
    }

    async updateFlashcardStatus(deckId, cardId, status) {
        const currentSession = this.model.getCurrentSession();
        if (!currentSession || !currentSession.decks) return;

        const deck = currentSession.decks.find(d => d.id === deckId);
        if (!deck) return;

        const card = deck.cards.find(c => c.id === cardId);
        if (!card) return;

        card.status = status;
        card.lastReviewed = new Date().toISOString();

        const result = await this.model.saveDeck(deck);

        if (result.success) {
            this.flashcardView.render(currentSession.decks);
            return true;
        }
        return false;
    }

    openDocument(file, fileName) {
        const currentSession = this.model.getCurrentSession();
        if (!currentSession) return;

        const absolutePath = `file://${currentSession.fullPath}/${file}`;
        this.documentView.openDocument(absolutePath, fileName);
    }

    isTimerRunning() {
        return this.timerView && this.timerView.isRunning();
    }

    stopTimer() {
        if (this.timerView) {
            this.timerView.resetTimer();
        }
    }
    async deleteFile(fileName) {
        const currentSession = this.model.getCurrentSession();
        if (!currentSession) return;

        const result = await this.model.deleteFile(fileName);

        if (result.success) {
            // Rimuovi il file dalla sessione locale
            currentSession.files = currentSession.files.filter(f => f !== fileName);

            // Aggiorna la vista
            this.activeView.renderFileList(currentSession.files);

            // Se il file eliminato era aperto, chiudi il visualizzatore
            if (this.documentView && this.documentView.viewerFilename.textContent === fileName.split('/').pop().split('\\').pop()) {
                this.documentView.closeDocument();
            }

            if (typeof toastManager !== 'undefined') {
                toastManager.show('Successo', 'File eliminato correttamente', 'success');
            }
        } else {
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Errore', 'Impossibile eliminare il file', 'error');
            }
        }
    }
}
