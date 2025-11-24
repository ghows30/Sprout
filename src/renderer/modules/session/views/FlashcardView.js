class FlashcardView {
    constructor(controller) {
        this.controller = controller;
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
    }

    cacheDOM() {
        this.flashcardList = document.getElementById('flashcard-list');
        this.createFlashcardBtn = document.getElementById('create-flashcard-btn');
        this.importFlashcardBtn = document.getElementById('import-flashcard-btn');
    }

    bindEvents() {
        if (this.createFlashcardBtn) this.createFlashcardBtn.addEventListener('click', () => this.handleCreateFlashcard());
        if (this.importFlashcardBtn) this.importFlashcardBtn.addEventListener('click', () => this.handleImportFlashcards());
    }

    handleCreateFlashcard() {
        const question = prompt('Inserisci la domanda:');
        if (!question) return;

        const answer = prompt('Inserisci la risposta:');
        if (!answer) return;

        this.controller.createFlashcard(question, answer);
    }

    handleImportFlashcards() {
        alert('Funzionalità di importazione in arrivo!');
    }

    render(flashcards) {
        if (!this.flashcardList) return;
        this.flashcardList.innerHTML = '';

        if (!flashcards || flashcards.length === 0) {
            this.flashcardList.innerHTML = '<li style="text-align: center; color: var(--text-muted); padding: 20px;">Nessuna flashcard</li>';
            return;
        }

        flashcards.forEach(card => {
            const li = document.createElement('li');
            li.className = 'flashcard-item';
            li.innerHTML = `
                <div class="flashcard-question">${card.question}</div>
                <div class="flashcard-answer">${card.answer}</div>
            `;
            this.flashcardList.appendChild(li);
        });
    }
}
