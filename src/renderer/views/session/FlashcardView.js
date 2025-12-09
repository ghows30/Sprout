class FlashcardView {
    constructor(controller) {
        this.controller = controller;
        this.currentDeckId = null;
        this.studyDeck = null;
        this.currentDeckId = null;
        this.studyDeck = null;
        this.currentCardIndex = 0;
        this.history = new StudyHistory();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.createModals();
    }

    cacheDOM() {
        this.flashcardList = document.getElementById('flashcard-list');
        this.createFlashcardBtn = document.getElementById('create-flashcard-btn');
        this.importFlashcardBtn = document.getElementById('import-flashcard-btn');
        this.sessionView = document.getElementById('active-session');
    }

    bindEvents() {
        if (this.createFlashcardBtn) this.createFlashcardBtn.addEventListener('click', () => this.showCreateDeckModal());
        if (this.importFlashcardBtn) this.importFlashcardBtn.addEventListener('click', () => this.handleImportFlashcards());
    }

    createModals() {
        // Create Deck Modal
        const deckModal = document.createElement('div');
        deckModal.id = 'create-deck-modal';
        deckModal.className = 'modal';
        deckModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Nuovo Mazzo</h2>
                <div class="form-group">
                    <label for="deck-name-input">Nome del mazzo</label>
                    <input type="text" id="deck-name-input" class="form-control" placeholder="Es. Storia Romana">
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary close-modal-btn">Annulla</button>
                    <button class="btn btn-primary" id="confirm-create-deck">Crea</button>
                </div>
            </div>
        `;
        document.body.appendChild(deckModal);

        // Create Card Modal
        const cardModal = document.createElement('div');
        cardModal.id = 'create-card-modal';
        cardModal.className = 'modal';
        cardModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Nuova Flashcard</h2>
                <div class="form-group">
                    <label for="card-question-input">Domanda</label>
                    <textarea id="card-question-input" class="form-control" rows="3" placeholder="Inserisci la domanda..."></textarea>
                </div>
                <div class="form-group">
                    <label for="card-answer-input">Risposta</label>
                    <textarea id="card-answer-input" class="form-control" rows="3" placeholder="Inserisci la risposta..."></textarea>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary close-modal-btn">Annulla</button>
                    <button class="btn btn-primary" id="confirm-create-card">Aggiungi</button>
                </div>
            </div>
        `;
        document.body.appendChild(cardModal);

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
        // Deck Modal Events
        const deckModal = document.getElementById('create-deck-modal');
        const confirmDeckBtn = document.getElementById('confirm-create-deck');
        const deckInput = document.getElementById('deck-name-input');

        const closeDeckModal = () => {
            deckModal.style.display = 'none';
            deckInput.value = '';
        };

        deckModal.querySelectorAll('.close-modal, .close-modal-btn').forEach(el => {
            el.addEventListener('click', closeDeckModal);
        });

        confirmDeckBtn.addEventListener('click', () => {
            const name = deckInput.value.trim();
            if (name) {
                this.controller.createDeck(name);
                closeDeckModal();
            }
        });

        // Card Modal Events
        const cardModal = document.getElementById('create-card-modal');
        const confirmCardBtn = document.getElementById('confirm-create-card');
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

        confirmCardBtn.addEventListener('click', () => {
            const question = questionInput.value.trim();
            const answer = answerInput.value.trim();
            if (question && answer && this.currentDeckId) {
                this.controller.createFlashcard(this.currentDeckId, question, answer);
                closeCardModal();
            }
        });

        // Close on outside click
        window.addEventListener('click', (e) => {
            if (e.target === deckModal) closeDeckModal();
            if (e.target === cardModal) closeCardModal();
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
        alert('Funzionalità di importazione in arrivo!');
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
}
