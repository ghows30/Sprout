class FlashcardView {
    constructor(controller) {
        this.controller = controller;
        this.currentDeckId = null;
        this.studyDeck = null;
        this.currentDeckId = null;
        this.studyDeck = null;
        this.currentCardIndex = 0;
        this.history = new StudyHistory();
        this.importService = new FlashcardImportService([
            new CsvFlashcardAdapter(),
            new JsonFlashcardAdapter()
        ]);
        this.importState = this.getEmptyImportState();
        this.importSource = 'csv';
        this.importSource = 'csv';
        this.importSource = 'csv';
        this.csvOptions = { delimiter: 'auto', quote: 'auto' };
        this.lastImportedFile = null; // { file, content }
        this.areModalsBound = false;
    }

    getEmptyImportState() {
        return {
            fileName: '',
            adapter: '',
            cards: [],
            errors: []
        };
    }

    init() {
        this.createModals();
        this.cacheDOM();
        this.bindEvents();
        this.bindGlobalDelegates();
    }

    cacheDOM() {
        this.flashcardList = document.getElementById('flashcard-list');
        this.createFlashcardBtn = document.getElementById('create-flashcard-btn');
        this.importFlashcardBtn = document.getElementById('import-flashcard-btn');
        this.sessionView = document.getElementById('active-session');
        this.importModal = document.getElementById('import-flashcards-modal');
        this.importFileInput = document.getElementById('import-file-input');
        this.importFileName = document.getElementById('import-file-name');
        this.importDeckSelect = document.getElementById('import-target-deck');
        this.importNewDeckInput = document.getElementById('import-new-deck-name');
        this.importConfirmBtn = document.getElementById('confirm-import-btn');
        this.importSourceItems = document.querySelectorAll('.import-source-item');
        this.importSourceList = document.querySelector('.import-source-list');
        this.importPanelTitle = document.getElementById('import-panel-title');
        this.importPanelDesc = document.getElementById('import-panel-desc');
    }

    bindGlobalDelegates() {
        // Fallback delegation to ensure clicks work even if DOM is rerendered
        document.addEventListener('click', (e) => {
            const sourceItem = e.target.closest('.import-source-item');
            if (sourceItem && document.body.contains(sourceItem)) {
                this.cacheDOM();
                this.setImportSource(sourceItem.dataset.source);
                return;
            }
        });
    }

    bindEvents() {
        if (this.createFlashcardBtn) this.createFlashcardBtn.addEventListener('click', () => this.showCreateDeckModal());
        if (this.importFlashcardBtn) this.importFlashcardBtn.addEventListener('click', () => this.handleImportFlashcards());
    }

    createModals() {
        // Create Deck Modal
        if (!document.getElementById('create-deck-modal')) {
            const deckModal = document.createElement('div');
            deckModal.id = 'create-deck-modal';
            deckModal.className = 'modal';
            deckModal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h2>Nuovo Mazzo</h2>
                    <div class="form-group">
                        <label for="deck-name-input">Nome del mazzo</label>
                        <input type="text" id="deck-name-input" class="form-control" placeholder="Es. Storia Romana" autocomplete="off">
                    </div>
                    <div class="checkbox-wrapper">
                        <input type="checkbox" id="create-deck-add-cards" checked>
                        <label for="create-deck-add-cards">Aggiungi subito delle flashcard</label>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary close-modal-btn">Annulla</button>
                        <button class="btn btn-primary" id="confirm-create-deck">Crea Mazzo</button>
                    </div>
                </div>
            `;
            document.body.appendChild(deckModal);
        }

        // Create Card Modal
        if (!document.getElementById('create-card-modal')) {
            const cardModal = document.createElement('div');
            cardModal.id = 'create-card-modal';
            cardModal.className = 'modal';
            cardModal.innerHTML = `
                <div class="modal-content modal-large">
                    <span class="close-modal">&times;</span>
                    <h2>Nuova Flashcard</h2>
                    <div class="form-group">
                        <label for="card-question-input">Domanda (Fronte)</label>
                        <textarea id="card-question-input" class="form-control" rows="3" placeholder="Scrivi la domanda o il concetto da ricordare..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="card-answer-input">Risposta (Retro)</label>
                        <textarea id="card-answer-input" class="form-control" rows="5" placeholder="Scrivi la risposta corretta..."></textarea>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary close-modal-btn">Annulla</button>
                        <button class="btn btn-outline-primary" id="save-add-another-card">Salva e Aggiungi Altra</button>
                        <button class="btn btn-primary" id="save-close-card">Salva e Chiudi</button>
                    </div>
                </div>
            `;
            document.body.appendChild(cardModal);
        }

        // Import Flashcards Modal
        if (!document.getElementById('import-flashcards-modal')) {
            const importModal = document.createElement('div');
            importModal.id = 'import-flashcards-modal';
            importModal.className = 'modal';
            importModal.innerHTML = `
                <div class="modal-content import-modal">
                    <span class="close-modal">&times;</span>
                    <div class="import-layout">
                        <aside class="import-sidebar">
                            <div class="import-sidebar-title">
                                <i class="fas fa-file-import"></i> Import
                            </div>
                            <ul class="import-source-list">
                                <li class="import-source-item active" data-source="csv">CSV</li>
                                <li class="import-source-item" data-source="json">JSON</li>
                            </ul>
                        </aside>
                        <div class="import-main">
                            <div class="import-header">
                                <h2 id="import-panel-title">Import CSV</h2>
                                <p id="import-panel-desc">Seleziona un file .csv con campi question, answer.</p>
                            </div>

                            <div class="form-group">
                                <label>File</label>
                                <div class="import-file-row">
                                    <button class="btn btn-secondary" id="import-file-picker">
                                        <i class="fas fa-file-import"></i> Scegli file
                                    </button>
                                    <span id="import-file-name" class="import-file-name">Nessun file selezionato</span>
                                </div>
                                <input type="file" id="import-file-input" accept=".csv" style="display: none;">
                            </div>

                            <div class="form-group">
                                <label for="import-target-deck">Mazzo di destinazione</label>
                                <select id="import-target-deck" class="form-control"></select>
                                <input type="text" id="import-new-deck-name" class="form-control" placeholder="Nome nuovo mazzo" style="display: none; margin-top: 8px;">
                            </div>

                            <div class="modal-actions">
                                <button class="btn btn-secondary close-modal-btn">Annulla</button>
                                <button class="btn btn-primary" id="confirm-import-btn" disabled>Importa</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(importModal);
        }

        // Study Modal
        const studyModal = document.createElement('div');
        studyModal.id = 'study-modal';
        studyModal.className = 'modal';
        studyModal.innerHTML = `
            <div class="study-modal-content">
                <button class="close-study-btn" title="Chiudi"><i class="fas fa-times"></i></button>
                <div class="study-container">
                    <div class="flip-card" id="study-flip-card">
                        <div class="flip-card-inner">
                            <div class="flip-card-front">
                                <div class="card-label">Domanda</div>
                                <div class="card-content" id="study-card-front"></div>
                                <div class="card-hint">Clicca per girare</div>
                            </div>
                            <div class="flip-card-back">
                                <div class="card-label">Risposta</div>
                                <div class="card-content" id="study-card-back"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="study-controls">
                        <button class="control-btn" id="study-prev-btn" title="Precedente">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="progress-indicator" id="study-progress">1 / 10</div>
                        <button class="control-btn" id="study-next-btn" title="Successiva">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    <div class="study-actions">
                        <button class="btn-action review-btn" id="mark-review-btn">
                            <i class="fas fa-history"></i> Da Rivedere
                        </button>
                        <button class="btn-action consolidated-btn" id="mark-consolidated-btn">
                            <i class="fas fa-check-circle"></i> Consolidato
                        </button>
                    </div>
                    
                    <div style="margin-top: 15px;">
                        <button class="btn-text-icon" id="study-undo-btn" disabled>
                            <i class="fas fa-undo"></i> Annulla ultima azione
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(studyModal);

        // Study Selection Modal
        const selectionModal = document.createElement('div');
        selectionModal.id = 'study-selection-modal';
        selectionModal.className = 'modal';
        selectionModal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <span class="close-modal">&times;</span>
                <h2>Cosa vuoi studiare?</h2>
                <p style="color: var(--text-muted); margin-bottom: 20px;">Questo mazzo contiene carte miste.</p>
                <div class="selection-actions" style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn btn-primary" id="study-all-btn" style="width: 100%; justify-content: center;">
                        Tutto (<span id="count-all">0</span>)
                    </button>
                    <button class="btn btn-secondary" id="study-review-btn" style="width: 100%; justify-content: center; border-color: #ff9f43; color: #ff9f43;">
                        Da Rivedere (<span id="count-review">0</span>)
                    </button>
                    <button class="btn btn-secondary" id="study-consolidated-btn" style="width: 100%; justify-content: center; border-color: #2ecc71; color: #2ecc71;">
                        Consolidate (<span id="count-consolidated">0</span>)
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(selectionModal);

        this.bindModalEvents();
    }

    bindModalEvents() {
        if (this.areModalsBound) return;

        // Deck Modal Events
        const deckModal = document.getElementById('create-deck-modal');
        const confirmDeckBtn = document.getElementById('confirm-create-deck');
        const deckInput = document.getElementById('deck-name-input');
        const addCardsCheckbox = document.getElementById('create-deck-add-cards');

        const closeDeckModal = () => {
            deckModal.style.display = 'none';
            deckInput.value = '';
            if (addCardsCheckbox) addCardsCheckbox.checked = true; // Reset to default
        };

        deckModal.querySelectorAll('.close-modal, .close-modal-btn').forEach(el => {
            el.addEventListener('click', closeDeckModal);
        });

        confirmDeckBtn.onclick = async () => {
            const name = deckInput.value.trim();
            if (name) {
                const result = await this.controller.createDeck(name);
                if (result && result.success) {
                    closeDeckModal();

                    // Se l'utente vuole aggiungere subito carte
                    if (addCardsCheckbox && addCardsCheckbox.checked) {
                        // Aspetta un attimo per la transizione
                        setTimeout(() => {
                            this.showCreateCardModal(result.deck.id);
                        }, 100);
                    } else {
                        if (typeof toastManager !== 'undefined') {
                            toastManager.show('Mazzo creato', `Mazzo "${name}" creato con successo`, 'success');
                        }
                    }

                } else if (result && result.error === 'DUPLICATE_NAME') {
                    if (typeof toastManager !== 'undefined') {
                        toastManager.show('Errore', 'Esiste già un mazzo con questo nome', 'error');
                    }
                } else {
                    if (typeof toastManager !== 'undefined') {
                        toastManager.show('Errore', 'Impossibile creare il mazzo', 'error');
                    }
                }
            }
        };

        // Card Modal Events
        const cardModal = document.getElementById('create-card-modal');
        const saveAddAnotherBtn = document.getElementById('save-add-another-card');
        const saveCloseBtn = document.getElementById('save-close-card');
        const questionInput = document.getElementById('card-question-input');
        const answerInput = document.getElementById('card-answer-input');

        const closeCardModal = () => {
            cardModal.style.display = 'none';
            questionInput.value = '';
            answerInput.value = '';
            this.currentDeckId = null;
        };

        cardModal.querySelectorAll('.close-modal, .close-modal-btn').forEach(el => {
            el.addEventListener('click', closeCardModal);
        });

        const saveCard = async (shouldClose) => {
            const question = questionInput.value.trim();
            const answer = answerInput.value.trim();

            if (!question || !answer) {
                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Campi mancanti', 'Inserisci sia la domanda che la risposta', 'warning');
                }
                return;
            }

            if (this.currentDeckId) {
                await this.controller.createFlashcard(this.currentDeckId, question, answer);

                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Carta aggiunta', 'Flashcard salvata con successo', 'success');
                }

                if (shouldClose) {
                    closeCardModal();
                } else {
                    // Reset inputs for next card
                    questionInput.value = '';
                    answerInput.value = '';
                    questionInput.focus();
                }
            }
        };

        if (saveAddAnotherBtn) {
            saveAddAnotherBtn.onclick = () => saveCard(false);
        }

        if (saveCloseBtn) {
            saveCloseBtn.onclick = () => saveCard(true);
        }

        // Import Modal Events
        const importModal = document.getElementById('import-flashcards-modal');
        const importFilePicker = document.getElementById('import-file-picker');
        const importFileInput = document.getElementById('import-file-input');
        const importDeckSelect = document.getElementById('import-target-deck');
        const useDeckFieldCheckbox = document.getElementById('import-use-deck-field');
        const confirmImportBtn = document.getElementById('confirm-import-btn');

        if (importModal) {
            importModal.querySelectorAll('.close-modal, .close-modal-btn').forEach(el => {
                el.addEventListener('click', () => this.closeImportModal());
            });
        }

        if (importFilePicker) {
            importFilePicker.addEventListener('click', () => {
                if (importFileInput) importFileInput.click();
            });
        }

        if (importFileInput) {
            importFileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.handleImportFile(e.target.files[0]).catch(err => console.error(err));
                }
            });
        }

        if (importDeckSelect) {
            importDeckSelect.addEventListener('change', (e) => this.onImportDeckChange(e.target.value));
        }

        if (confirmImportBtn) {
            confirmImportBtn.addEventListener('click', () => this.confirmImport());
        }

        if (this.importSourceList) {
            this.importSourceList.addEventListener('click', (e) => {
                const item = e.target.closest('.import-source-item');
                if (!item || !this.importSourceList.contains(item)) return;
                this.setImportSource(item.dataset.source);
            });
        }

        // Close on outside click
        window.addEventListener('click', (e) => {
            if (e.target === deckModal) closeDeckModal();
            if (e.target === cardModal) closeCardModal();
            if (e.target === importModal) this.closeImportModal();
            // Removed study modal close on outside click as requested
        });

        // Study Modal Events
        const studyModal = document.getElementById('study-modal');
        const flipCard = document.getElementById('study-flip-card');
        const prevBtn = document.getElementById('study-prev-btn');
        const nextBtn = document.getElementById('study-next-btn');
        const closeStudyBtn = studyModal.querySelector('.close-study-btn');
        const reviewBtn = document.getElementById('mark-review-btn');
        const consolidatedBtn = document.getElementById('mark-consolidated-btn');
        const undoBtn = document.getElementById('study-undo-btn');

        if (flipCard) {
            flipCard.addEventListener('click', () => this.flipCard());
        }

        if (prevBtn) prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.prevCard();
        });

        if (nextBtn) nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextCard();
        });

        if (closeStudyBtn) closeStudyBtn.addEventListener('click', () => {
            studyModal.style.display = 'none';
        });

        if (reviewBtn) reviewBtn.addEventListener('click', () => this.markCardStatus('review'));
        if (consolidatedBtn) consolidatedBtn.addEventListener('click', () => this.markCardStatus('consolidated'));
        if (undoBtn) undoBtn.addEventListener('click', () => this.undoLastAction());

        // Keyboard navigation for study modal
        document.addEventListener('keydown', (e) => {
            if (studyModal.style.display === 'flex') {
                if (e.key === 'ArrowLeft') this.prevCard();
                else if (e.key === 'ArrowRight') this.nextCard();
                else if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault(); // Prevent scrolling
                    this.flipCard();
                } else if (e.key === 'Escape') {
                    studyModal.style.display = 'none';
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                    e.preventDefault();
                    this.undoLastAction();
                }
            }
        });

        // Selection Modal Events
        const selectionModal = document.getElementById('study-selection-modal');
        const studyAllBtn = document.getElementById('study-all-btn');
        const studyReviewBtn = document.getElementById('study-review-btn');
        const studyConsolidatedBtn = document.getElementById('study-consolidated-btn');

        const closeSelectionModal = () => {
            selectionModal.style.display = 'none';
            this.studyDeck = null; // Reset if cancelled
        };

        selectionModal.querySelectorAll('.close-modal').forEach(el => {
            el.addEventListener('click', closeSelectionModal);
        });

        window.addEventListener('click', (e) => {
            if (e.target === selectionModal) closeSelectionModal();
        });

        if (studyAllBtn) studyAllBtn.addEventListener('click', () => {
            selectionModal.style.display = 'none';
            this.launchStudyMode(this.studyDeck);
        });

        if (studyReviewBtn) studyReviewBtn.addEventListener('click', () => {
            selectionModal.style.display = 'none';
            const filteredDeck = { ...this.studyDeck };
            filteredDeck.cards = this.studyDeck.cards.filter(c => c.status === 'review' || c.status === 'new');
            this.launchStudyMode(filteredDeck);
        });

        if (studyConsolidatedBtn) studyConsolidatedBtn.addEventListener('click', () => {
            selectionModal.style.display = 'none';
            const filteredDeck = { ...this.studyDeck };
            filteredDeck.cards = this.studyDeck.cards.filter(c => c.status === 'consolidated');
            this.launchStudyMode(filteredDeck);
        });

        this.areModalsBound = true;
    }

    showCreateDeckModal() {
        const modal = document.getElementById('create-deck-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('deck-name-input').focus();
        }
    }

    showCreateCardModal(deckId) {
        this.currentDeckId = deckId;
        const modal = document.getElementById('create-card-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('card-question-input').focus();
        }
    }

    handleImportFlashcards() {
        this.showImportModal();
    }

    showImportModal() {
        if (!this.importModal) return;
        // Refresh references in case the view was re-rendered
        this.cacheDOM();
        this.populateDeckOptions();
        this.resetImportState();
        this.importModal.style.display = 'flex';
    }

    closeImportModal() {
        if (this.importModal) {
            this.importModal.style.display = 'none';
        }
        this.resetImportState();
    }

    resetImportState() {
        this.importState = this.getEmptyImportState();
        this.importSource = 'csv';
        this.csvOptions = { delimiter: 'auto', quote: 'auto' };

        if (this.importFileInput) this.importFileInput.value = '';
        if (this.importFileName) this.importFileName.textContent = 'Nessun file selezionato';
        if (this.importConfirmBtn) this.importConfirmBtn.disabled = true;

        this.toggleNewDeckInput(this.importDeckSelect ? this.importDeckSelect.value : '');
        this.setImportSource('csv', { resetOptions: true });
    }

    populateDeckOptions() {
        if (!this.importDeckSelect) return;

        const currentSession = this.controller.model.getCurrentSession();
        const decks = (currentSession && currentSession.decks) ? currentSession.decks : [];

        this.importDeckSelect.innerHTML = '';

        this.importDeckSelect.innerHTML = '';

        decks.forEach(deck => {
            const option = document.createElement('option');
            option.value = deck.id;
            option.textContent = deck.name;
            this.importDeckSelect.appendChild(option);
        });

        const newOption = document.createElement('option');
        newOption.value = '__new__';
        newOption.textContent = 'Nuovo mazzo...';
        this.importDeckSelect.appendChild(newOption);

        if (decks.length > 0) {
            this.importDeckSelect.value = decks[0].id;
            this.toggleNewDeckInput(decks[0].id);
        } else {
            this.importDeckSelect.value = '__new__';
            this.toggleNewDeckInput('__new__');
        }
    }

    setImportSource(source, { resetOptions = false } = {}) {
        const previous = this.importSource;
        const safeSource = source === 'json' ? 'json' : 'csv';
        this.importSource = safeSource;

        if (previous && previous !== safeSource) {
            this.importState = this.getEmptyImportState();
            if (this.importFileInput) this.importFileInput.value = '';
            if (this.importFileName) this.importFileName.textContent = 'Nessun file selezionato';
            if (this.importConfirmBtn) this.importConfirmBtn.disabled = true;
            this.lastImportedFile = null;
        }

        if (this.importSourceItems && this.importSourceItems.length > 0) {
            this.importSourceItems.forEach(item => {
                item.classList.toggle('active', item.dataset.source === safeSource);
            });
        }

        if (this.csvOptionsPanel) {
            this.csvOptionsPanel.style.display = safeSource === 'csv' ? 'block' : 'none';
        }
        if (this.jsonOptionsPanel) {
            this.jsonOptionsPanel.style.display = safeSource === 'json' ? 'block' : 'none';
        }

        if (this.importPanelTitle) {
            this.importPanelTitle.textContent = safeSource === 'csv' ? 'Import CSV' : 'Import JSON';
        }
        if (this.importPanelDesc) {
            this.importPanelDesc.textContent = safeSource === 'csv'
                ? 'Seleziona un file .csv con question, answer.'
                : 'Seleziona un file .json con un array di carte o un oggetto { cards: [] }.';
        }

        if (this.importFileInput) {
            this.importFileInput.setAttribute('accept', safeSource === 'csv' ? '.csv' : '.json');
        }

        if (safeSource === 'csv' && resetOptions) {
            this.csvOptions.delimiter = 'auto';
            this.csvOptions.quote = 'auto';
        }
    }



    onImportDeckChange(value) {
        this.toggleNewDeckInput(value);
    }

    toggleNewDeckInput(value) {
        if (!this.importNewDeckInput) return;
        if (value === '__new__') {
            this.importNewDeckInput.style.display = 'block';
            this.importNewDeckInput.focus();
        } else {
            this.importNewDeckInput.style.display = 'none';
            this.importNewDeckInput.value = '';
        }
    }



    async handleImportFile(file, { silentToast = false } = {}) {
        try {
            const parseOptions = this.getCurrentParseOptions();
            let result;

            if (file && file.path) {
                result = this.importService.importFile(file, {
                    adapterKey: this.importSource,
                    parseOptions
                });
                this.lastImportedFile = { file, content: null };
            } else {
                const content = await this.readFileAsText(file);
                result = this.importService.importFromContent(file.name, content, {
                    adapterKey: this.importSource,
                    parseOptions
                });
                this.lastImportedFile = { file, content };
            }

            this.importState = {
                fileName: result.fileName,
                adapter: result.adapter,
                cards: result.cards,
                errors: result.errors || []
            };

            if (this.importFileName) {
                this.importFileName.textContent = `${result.fileName} (${result.cards.length} carte valide)`;
            }

            if (this.importConfirmBtn) {
                this.importConfirmBtn.disabled = result.cards.length === 0;
            }
        } catch (error) {
            console.error('Errore durante il parsing del file:', error);
            this.importState = this.getEmptyImportState();
            if (!silentToast && typeof toastManager !== 'undefined') {
                toastManager.show('Errore', error.message || 'Import fallito', 'error');
            }
            this.lastImportedFile = null;
        }
    }

    getCurrentParseOptions() {
        if (this.importSource === 'csv') {
            return {
                delimiter: this.csvOptions.delimiter,
                quote: this.csvOptions.quote
            };
        }
        return {};
    }



    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('File non valido'));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result || '');
            reader.onerror = () => reject(new Error('Impossibile leggere il file selezionato'));
            reader.readAsText(file);
        });
    }

    async confirmImport() {
        const { cards } = this.importState;
        if (!cards || cards.length === 0) {
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Nessuna carta', 'Carica un file valido prima di importare', 'warning');
            }
            return;
        }

        const useDeckField = this.importUseDeckField ? this.importUseDeckField.checked : false;
        const selectedDeck = this.importDeckSelect ? this.importDeckSelect.value : '';

        let targetDeckId = null;
        let newDeckName = '';

        if (selectedDeck === '__new__') {
            newDeckName = this.importNewDeckInput ? this.importNewDeckInput.value.trim() : '';
            if (!newDeckName) {
                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Nome mancante', 'Inserisci il nome del nuovo mazzo', 'warning');
                }
                return;
            }
        } else if (selectedDeck) {
            targetDeckId = selectedDeck;
        }

        if (!useDeckField && !targetDeckId && !newDeckName) {
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Mazzo non selezionato', 'Scegli un mazzo di destinazione', 'warning');
            }
            return;
        }

        if (this.importConfirmBtn) this.importConfirmBtn.disabled = true;

        const result = await this.controller.importFlashcards({
            cards,
            targetDeckId,
            newDeckName,
            useDeckField
        });

        if (result.success) {
            const deckInfo = result.updatedDecks === 1 ? '1 mazzo' : `${result.updatedDecks} mazzi`;
            const skippedInfo = result.skipped ? `, ${result.skipped} scartate` : '';
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Import completato', `${result.imported} carte importate in ${deckInfo}${skippedInfo}`, 'success');
            }
            this.closeImportModal();
        } else {
            if (typeof toastManager !== 'undefined') {
                const message = result.error === 'DECK_NOT_SELECTED'
                    ? 'Seleziona o crea un mazzo per importare'
                    : (result.error || 'Errore durante il salvataggio');
                toastManager.show('Errore', message, 'error');
            }
        }

        if (this.importConfirmBtn) this.importConfirmBtn.disabled = false;
    }

    render(decks) {
        if (!this.flashcardList) return;
        this.flashcardList.innerHTML = '';

        if (!decks || decks.length === 0) {
            this.flashcardList.innerHTML = '<li style="text-align: center; color: var(--text-muted); padding: 20px;">Nessun mazzo creato</li>';
            return;
        }

        decks.forEach(deck => {
            const deckItem = document.createElement('li');
            deckItem.className = 'deck-item';

            // Calcola conteggi
            const reviewCount = deck.cards.filter(c => c.status === 'review' || c.status === 'new').length;
            const consolidatedCount = deck.cards.filter(c => c.status === 'consolidated').length;

            deckItem.innerHTML = `
                <div class="deck-header">
                    <div class="deck-info">
                        <i class="fas fa-layer-group deck-icon"></i>
                        <span class="deck-name">${deck.name}</span>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn-icon-small study-deck-btn" title="Studia">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn-icon-small add-card-btn" title="Aggiungi Card">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="deck-stats">
                    <div class="stat-item review" title="Da rivedere">
                        <i class="fas fa-history" style="font-size: 0.7rem; color: #ff9f43;"></i>
                        <span class="stat-count">${reviewCount}</span>
                    </div>
                    <div class="stat-item consolidated" title="Consolidati">
                        <i class="fas fa-check-circle" style="font-size: 0.7rem; color: #2ecc71;"></i>
                        <span class="stat-count">${consolidatedCount}</span>
                    </div>
                </div>
            `;

            // Event listener per aggiungere card
            const addBtn = deckItem.querySelector('.add-card-btn');
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showCreateCardModal(deck.id);
            });

            // Event listener per studiare
            const studyBtn = deckItem.querySelector('.study-deck-btn');
            studyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startStudySession(deck);
            });

            deckItem.addEventListener('click', (e) => {
                // Previeni l'apertura se si sta cliccando sul menu contestuale
                if (e.target.closest('.context-menu')) return;
                this.showDeck(deck);
            });

            // Tasto destro per il menu contestuale
            deckItem.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showContextMenu(e.clientX, e.clientY, deck.id, deck.name);
            });

            this.flashcardList.appendChild(deckItem);
        });
    }

    startStudySession(deck) {
        if (!deck || !deck.cards || deck.cards.length === 0) {
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Attenzione', 'Questo mazzo è vuoto!', 'warning');
            }
            return;
        }

        // Store the original deck temporarily
        this.studyDeck = deck;

        const reviewCards = deck.cards.filter(c => c.status === 'review' || c.status === 'new');
        const consolidatedCards = deck.cards.filter(c => c.status === 'consolidated');

        // Se ci sono carte in entrambi gli stati, mostra il modale di selezione
        if (reviewCards.length > 0 && consolidatedCards.length > 0) {
            this.showStudySelectionModal(deck.cards.length, reviewCards.length, consolidatedCards.length);
            return;
        }

        // Altrimenti procedi come prima (tutto il mazzo)
        this.launchStudyMode(deck);
    }

    showStudySelectionModal(total, review, consolidated) {
        const modal = document.getElementById('study-selection-modal');
        if (!modal) return;

        document.getElementById('count-all').textContent = total;
        document.getElementById('count-review').textContent = review;
        document.getElementById('count-consolidated').textContent = consolidated;

        modal.style.display = 'flex';
    }

    launchStudyMode(deck) {
        this.studyDeck = deck;
        this.currentCardIndex = 0;
        this.history.clear(); // Reset history for new session

        const modal = document.getElementById('study-modal');
        modal.style.display = 'flex';

        this.renderCurrentCard();
    }

    renderCurrentCard() {
        if (!this.studyDeck) return;

        const card = this.studyDeck.cards[this.currentCardIndex];
        const frontEl = document.getElementById('study-card-front');
        const backEl = document.getElementById('study-card-back');
        const progressEl = document.getElementById('study-progress');
        const flipCard = document.getElementById('study-flip-card');
        const prevBtn = document.getElementById('study-prev-btn');
        const nextBtn = document.getElementById('study-next-btn');
        const undoBtn = document.getElementById('study-undo-btn');

        // Reset flip state
        flipCard.classList.remove('flipped');

        // Update content
        frontEl.textContent = card.question;
        backEl.textContent = card.answer;
        progressEl.textContent = `${this.currentCardIndex + 1} / ${this.studyDeck.cards.length}`;

        // Update buttons state
        prevBtn.disabled = this.currentCardIndex === 0;
        nextBtn.disabled = this.currentCardIndex === this.studyDeck.cards.length - 1;

        // Update undo button state
        if (undoBtn) {
            undoBtn.disabled = this.history.isEmpty();
            undoBtn.style.opacity = this.history.isEmpty() ? '0.3' : '1';
        }

        // Highlight active status
        const reviewBtn = document.getElementById('mark-review-btn');
        const consolidatedBtn = document.getElementById('mark-consolidated-btn');

        if (reviewBtn && consolidatedBtn) {
            reviewBtn.classList.remove('active');
            consolidatedBtn.classList.remove('active');

            if (card.status === 'review') {
                reviewBtn.classList.add('active');
            } else if (card.status === 'consolidated') {
                consolidatedBtn.classList.add('active');
            }
        }
    }

    flipCard() {
        const flipCard = document.getElementById('study-flip-card');
        flipCard.classList.toggle('flipped');
    }

    nextCard() {
        if (this.studyDeck && this.currentCardIndex < this.studyDeck.cards.length - 1) {
            this.currentCardIndex++;
            this.renderCurrentCard();
        }
    }

    prevCard() {
        if (this.studyDeck && this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.renderCurrentCard();
        }
    }

    async markCardStatus(status) {
        if (!this.studyDeck) return;

        // Remove focus from button to prevent sticky visual state
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        const card = this.studyDeck.cards[this.currentCardIndex];
        if (!card) return;

        // Create Memento before changing state
        const memento = new StudyMemento(card.id, card.status, this.currentCardIndex);
        this.history.push(memento);

        // Aggiorna lo stato tramite il controller
        const success = await this.controller.updateFlashcardStatus(this.studyDeck.id, card.id, status);

        if (success) {
            // Aggiorna anche l'oggetto locale per riflettere il cambiamento immediato se necessario
            card.status = status;

            // Passa alla prossima carta se non siamo all'ultima
            if (this.currentCardIndex < this.studyDeck.cards.length - 1) {
                this.nextCard();
            } else {
                // Se siamo all'ultima carta, mostra un feedback o chiudi (per ora rimaniamo qui)
                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Completato', 'Hai raggiunto la fine del mazzo!', 'success');
                }
                // Update UI to enable Undo even if we don't move
                this.renderCurrentCard();
            }
        }
    }

    async undoLastAction() {
        const memento = this.history.pop();
        if (!memento) return;

        // Restore state in backend
        const success = await this.controller.updateFlashcardStatus(this.studyDeck.id, memento.cardId, memento.previousStatus);

        if (success) {
            // Restore local state
            const card = this.studyDeck.cards.find(c => c.id === memento.cardId);
            if (card) {
                card.status = memento.previousStatus;
            }

            // Restore navigation
            this.currentCardIndex = memento.cardIndex;

            // Update UI
            this.renderCurrentCard();

            if (typeof toastManager !== 'undefined') {
                toastManager.show('Annullato', 'Azione annullata', 'info');
            }
        }
    }

    showContextMenu(x, y, deckId, deckName) {
        // Rimuovi eventuali menu esistenti
        this.hideContextMenu();

        // Crea il menu contestuale
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'deck-context-menu';
        menu.innerHTML = `
            <div class="context-menu-item" data-action="rename">
                <i class="fas fa-edit"></i>
                <span>Cambia nome</span>
            </div>
            <div class="context-menu-divider"></div>
            <div class="context-menu-item danger" data-action="delete">
                <i class="fas fa-trash"></i>
                <span>Elimina</span>
            </div>
        `;

        // Posiziona il menu
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        document.body.appendChild(menu);

        // Aggiungi event listener alle voci del menu
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = item.getAttribute('data-action');

                if (action === 'rename') {
                    this.showRenameDeckModal(deckId, deckName);
                } else if (action === 'delete') {
                    this.handleDeleteDeck(deckId, deckName);
                }

                this.hideContextMenu();
            });
        });

        // Chiudi il menu cliccando fuori
        setTimeout(() => {
            document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
        }, 0);
    }

    hideContextMenu() {
        const menu = document.getElementById('deck-context-menu');
        if (menu) {
            menu.remove();
        }
    }

    showRenameDeckModal(deckId, deckName) {
        // Rimuovi eventuali modal esistenti
        const existingModal = document.getElementById('rename-deck-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Crea il modal di rinomina
        const modal = document.createElement('div');
        modal.id = 'rename-deck-modal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Rinomina Mazzo</h2>
                <div class="form-group">
                    <label for="rename-deck-input">Nuovo nome</label>
                    <input type="text" id="rename-deck-input" class="form-control" value="${deckName}" placeholder="Inserisci il nuovo nome">
                    <div id="rename-error-message" style="color: #e74c3c; font-size: 0.9rem; margin-top: 8px; display: none;"></div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="rename-cancel-btn">Annulla</button>
                    <button class="btn btn-primary" id="rename-save-btn">Salva</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus sull'input e seleziona il testo
        const input = document.getElementById('rename-deck-input');
        const errorMessage = document.getElementById('rename-error-message');
        input.focus();
        input.select();

        // Event listeners
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = document.getElementById('rename-cancel-btn');
        const saveBtn = document.getElementById('rename-save-btn');

        const closeModal = () => {
            modal.remove();
        };

        const showError = (message) => {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            input.focus();
        };

        const hideError = () => {
            errorMessage.style.display = 'none';
        };

        // Nascondi errore quando l'utente modifica l'input
        input.addEventListener('input', hideError);

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        saveBtn.onclick = async () => {
            const newName = input.value.trim();

            if (!newName) {
                showError('Il nome non può essere vuoto');
                return;
            }

            if (newName === deckName) {
                closeModal();
                return;
            }

            // Disabilita il pulsante durante il salvataggio
            saveBtn.disabled = true;
            saveBtn.textContent = 'Salvataggio...';

            const result = await this.controller.renameDeck(deckId, newName);

            if (result.success) {
                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Successo', 'Mazzo rinominato con successo', 'success');
                }
                closeModal();
            } else {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Salva';

                if (result.error === 'DUPLICATE_NAME') {
                    showError('Esiste già un mazzo con questo nome');
                } else if (result.error === 'DECK_NOT_FOUND') {
                    showError('Mazzo non trovato');
                } else {
                    showError('Errore durante la rinomina');
                }
            }
        };

        // Chiudi con ESC
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'Enter' && e.target === input) {
                saveBtn.click();
            }
        });

        // Chiudi cliccando fuori
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    handleDeleteDeck(deckId, deckName) {
        // Crea modal di conferma
        const modal = document.createElement('div');
        modal.id = 'delete-deck-modal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2 style="color: #e74c3c;">⚠️ Conferma Eliminazione</h2>
                <p style="margin: 20px 0; line-height: 1.6;">
                    Sei sicuro di voler eliminare il mazzo <strong>"${deckName}"</strong>?
                </p>
                <p style="margin: 20px 0; padding: 12px; background-color: rgba(231, 76, 60, 0.1); border-left: 4px solid #e74c3c; border-radius: 4px; line-height: 1.6;">
                    <strong>⚠️ Attenzione:</strong> Questa azione è <strong>permanente</strong>. 
                    Tutte le flashcard contenute in questo mazzo verranno eliminate.
                </p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="delete-cancel-btn">Annulla</button>
                    <button class="btn" id="delete-confirm-btn" style="background-color: #e74c3c; color: white;">Elimina</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = document.getElementById('delete-cancel-btn');
        const confirmBtn = document.getElementById('delete-confirm-btn');

        const closeModal = () => {
            modal.remove();
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        confirmBtn.onclick = async () => {
            // Disabilita il pulsante durante l'eliminazione
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Eliminazione...';

            const result = await this.controller.deleteDeck(deckId);

            if (result.success) {
                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Successo', 'Mazzo eliminato', 'success');
                }
                closeModal();
            } else {
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Elimina';
                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Errore', 'Impossibile eliminare il mazzo', 'error');
                }
            }
        };

        // Chiudi con ESC
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });

        // Chiudi cliccando fuori
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}
