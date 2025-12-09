class JsonFlashcardAdapter extends BaseFlashcardAdapter {
    constructor() {
        super('JSON', ['.json']);
    }

    canHandle(context) {
        return super.canHandle(context);
    }

    parse(content, _options = {}) {
        const errors = [];
        if (!content || !content.trim()) {
            errors.push({ line: 1, message: 'Il file è vuoto' });
            return { cards: [], errors };
        }

        let data;
        try {
            data = JSON.parse(content);
        } catch (e) {
            errors.push({ line: 1, message: 'JSON non valido' });
            return { cards: [], errors };
        }

        const cards = [];

        const addCard = (raw, index, fallbackDeck = null) => {
            if (!raw || typeof raw !== 'object') {
                errors.push({ line: index, message: 'Riga non valida: atteso un oggetto' });
                return;
            }

            const question = this.pickValue(raw, ['question', 'domanda', 'front', 'q']);
            const answer = this.pickValue(raw, ['answer', 'risposta', 'back', 'a']);
            const deck = raw.deck || raw.deckName || fallbackDeck || null;
            const status = raw.status || raw.state || '';

            const questionText = String(question).trim();
            const answerText = String(answer).trim();

            if (!questionText || !answerText) {
                errors.push({ line: index, message: 'Domanda o risposta mancante' });
                return;
            }

            cards.push({
                question: questionText,
                answer: answerText,
                deck: deck ? String(deck).trim() : null,
                status: status ? String(status).trim() : ''
            });
        };

        if (Array.isArray(data)) {
            data.forEach((item, idx) => addCard(item, idx + 1, null));
        } else if (data && Array.isArray(data.cards)) {
            const fallbackDeck = data.deck || data.deckName || data.name || null;
            data.cards.forEach((item, idx) => addCard(item, idx + 1, fallbackDeck));
        } else if (data && Array.isArray(data.decks)) {
            data.decks.forEach((deckObj, deckIdx) => {
                const deckName = deckObj.name || deckObj.deck || deckObj.title || `Deck ${deckIdx + 1}`;
                (deckObj.cards || []).forEach((card, idx) => addCard(card, idx + 1, deckName));
            });
        } else {
            errors.push({
                line: 1,
                message: 'Struttura JSON non riconosciuta. Usa un array di carte o un oggetto { cards: [] }'
            });
        }

        return { cards, errors };
    }

    pickValue(obj, keys) {
        for (const key of keys) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined && obj[key] !== null) {
                return obj[key];
            }
        }
        return '';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = JsonFlashcardAdapter;
} else {
    window.JsonFlashcardAdapter = JsonFlashcardAdapter;
}
