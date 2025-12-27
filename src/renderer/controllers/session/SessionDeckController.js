class SessionDeckController {
    constructor(controller) {
        this.controller = controller;
    }

    get model() {
        return this.controller.model;
    }

    get flashcardView() {
        return this.controller.flashcardView;
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

            if (!skipRender && this.flashcardView) {
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
            if (this.flashcardView) {
                this.flashcardView.render(currentSession.decks);
            }
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
            if (this.flashcardView) {
                this.flashcardView.render(currentSession.decks);
            }
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

        if (this.flashcardView) {
            this.flashcardView.render(currentSession.decks);
        }
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
            if (this.flashcardView) {
                this.flashcardView.render(currentSession.decks);
            }
            return true;
        }
        return false;
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
            if (created && created.deck) { // createDeck returns {success, deck} or just deck
                const deckObj = created.deck || created;
                deckById.set(String(deckObj.id), deckObj);
                deckByName.set(key, deckObj);
                return deckObj;
            }
            return null;
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

        if (this.flashcardView) {
            this.flashcardView.render(currentSession.decks);
        }

        return {
            success: true,
            imported,
            skipped,
            updatedDecks: deckBuckets.size
        };
    }
}
