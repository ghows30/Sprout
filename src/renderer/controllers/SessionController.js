class SessionController {
    constructor() {
        this.model = new SessionModel();
        this.listView = new SessionListView(this);
        this.activeView = new ActiveSessionView(this);
        this.timerView = new TimerView();
        this.flashcardView = new FlashcardView(this);
        this.documentView = new DocumentView();

        this.init();
    }

    init() {
        this.loadSessions();

        // Subscribe to global events
        if (typeof eventManager !== 'undefined') {
            eventManager.subscribe('SESSION_CREATED', () => {
                this.loadSessions();
            });
        }
    }

    async loadSessions() {
        const sessions = await this.model.getSessions();
        this.listView.render(sessions);
    }

    async createSession(name, uploadedFiles) {
        // Valida che il nome non sia vuoto
        if (!name || !name.trim()) {
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Errore', 'Inserisci un nome per la sessione', 'error');
            }
            return { success: false, error: 'EMPTY_NAME' };
        }

        // Controlla se il nome esiste già
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
            // Valida che il nuovo nome non sia vuoto
            if (!newName || !newName.trim()) {
                return { success: false, error: 'EMPTY_NAME' };
            }

            // Controlla se il nome esiste già (escludendo la sessione corrente)
            const checkResult = await this.model.checkSessionNameExists(newName, sessionPath);
            if (checkResult.exists) {
                return { success: false, error: 'SESSION_NAME_EXISTS' };
            }

            // Rinomina la sessione
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
                // Ricarica le sessioni
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

    openSession(session) {
        this.model.setCurrentSession(session);

        // Switch view using App navigation
        if (typeof App !== 'undefined' && App.showView) {
            App.showView('active-session');
        } else {
            console.error('App.showView is not defined');
        }
    }

    initActiveSessionViews() {
        this.activeView.init();
        this.documentView.init();
        this.flashcardView.init();
        this.timerView.init();
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

    createFlashcard(question, answer) {
        const currentSession = this.model.getCurrentSession();
        if (!currentSession) return;

        const flashcard = {
            id: Date.now(),
            question: question,
            answer: answer,
            createdAt: new Date().toISOString()
        };

        if (!currentSession.flashcards) {
            currentSession.flashcards = [];
        }
        currentSession.flashcards.push(flashcard);

        this.model.saveSessionData(currentSession);
        this.flashcardView.render(currentSession.flashcards);
    }

    openDocument(file, fileName) {
        const currentSession = this.model.getCurrentSession();
        if (!currentSession) return;

        const fullPath = `file://${currentSession.fullPath}/${file.path || file}`; // Handle both object and string path
        // Note: file might be just the relative path string in some cases depending on how it was saved
        // Let's check how we stored it. In main.js we store relative paths.
        // But when we load it back, we need to construct the full path.
        // The View passes the file object from the category list.

        // Actually, let's look at how we constructed the list in ActiveSessionView.
        // We passed { file, fileName, ext }. 'file' is the item from session.files array.
        // session.files contains relative paths (strings) or objects?
        // In main.js: processedFiles.push(path.join(subfolder, file.name)); -> It's a string (relative path).

        // So 'file' is a string like "documents/notes.txt".
        // fullPath should be `file://${currentSession.fullPath}/${file}`.

        const absolutePath = `file://${currentSession.fullPath}/${file}`;
        this.documentView.openDocument(absolutePath, fileName);
    }
}
