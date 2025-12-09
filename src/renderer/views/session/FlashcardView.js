class FlashcardView {
    constructor(controller) {
        this.controller = controller;
        this.currentDeckId = null;
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
                    <button class="btn-icon-small add-card-btn" title="Aggiungi Card">
                        <i class="fas fa-plus"></i>
                    </button>
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

            this.flashcardList.appendChild(deckItem);
        });
    }
}
