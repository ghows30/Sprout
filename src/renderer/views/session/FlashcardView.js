class FlashcardView {
    constructor(controller) {
        this.controller = controller;
        this.currentDeckId = null;
        this.studyDeck = null;
        this.currentCardIndex = 0;
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
                </div>
            </div>
        `;
        document.body.appendChild(studyModal);

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
            if (e.target === document.getElementById('study-modal')) {
                document.getElementById('study-modal').style.display = 'none';
            }
        });

        // Study Modal Events
        const studyModal = document.getElementById('study-modal');
        const flipCard = document.getElementById('study-flip-card');
        const prevBtn = document.getElementById('study-prev-btn');
        const nextBtn = document.getElementById('study-next-btn');
        const closeStudyBtn = studyModal.querySelector('.close-study-btn');

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
                }
            }
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

        this.studyDeck = deck;
        this.currentCardIndex = 0;

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

        // Reset flip state
        flipCard.classList.remove('flipped');

        // Update content
        frontEl.textContent = card.question;
        backEl.textContent = card.answer;
        progressEl.textContent = `${this.currentCardIndex + 1} / ${this.studyDeck.cards.length}`;

        // Update buttons state
        prevBtn.disabled = this.currentCardIndex === 0;
        nextBtn.disabled = this.currentCardIndex === this.studyDeck.cards.length - 1;
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
}
