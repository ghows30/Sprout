/**
 * Memento Pattern Implementation for Study Session Undo
 */

/**
 * Memento: Stores the internal state of the FlashcardView (Originator)
 */
class StudyMemento {
    constructor(cardId, previousStatus, cardIndex) {
        this.cardId = cardId;
        this.previousStatus = previousStatus;
        this.cardIndex = cardIndex;
        this.timestamp = Date.now();
    }
}

/**
 * Caretaker: Manages the history of mementos
 */
class StudyHistory {
    constructor() {
        this.mementos = [];
    }

    push(memento) {
        this.mementos.push(memento);
    }

    pop() {
        return this.mementos.pop();
    }

    peek() {
        return this.mementos[this.mementos.length - 1];
    }

    isEmpty() {
        return this.mementos.length === 0;
    }

    clear() {
        this.mementos = [];
    }
}

// Export for use in other files (if using modules, otherwise global)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StudyMemento, StudyHistory };
} else {
    window.StudyMemento = StudyMemento;
    window.StudyHistory = StudyHistory;
}
