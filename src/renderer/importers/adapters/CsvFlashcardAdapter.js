class CsvFlashcardAdapter extends BaseFlashcardAdapter {
    constructor() {
        super('CSV', ['.csv']);
    }

    canHandle(context) {
        return super.canHandle(context);
    }

    parse(content, options = {}) {
        const errors = [];
        if (!content || !content.trim()) {
            errors.push({ line: 1, message: 'Il file è vuoto' });
            return { cards: [], errors };
        }

        const sanitized = content.replace(/^\uFEFF/, ''); // Remove BOM if present
        const lines = sanitized.split(/\r?\n/).filter(line => line.trim().length > 0);

        if (lines.length === 0) {
            errors.push({ line: 1, message: 'Nessuna riga da importare' });
            return { cards: [], errors };
        }

        const delimiter = this.resolveDelimiter(lines[0], options.delimiter);
        const quoteChar = this.resolveQuote(options.quote);

        const rawHeader = this.tokenizeLine(lines[0], delimiter, quoteChar);
        const headers = rawHeader.map(h => h.trim().toLowerCase());
        let columnMap = this.mapColumns(headers);
        let dataStartIndex = 1;

        // Fallback: no headers present, assume first two columns are question/answer
        if (columnMap.question === -1 || columnMap.answer === -1) {
            columnMap = {
                question: 0,
                answer: 1,
                deck: rawHeader.length > 2 ? 2 : -1,
                status: rawHeader.length > 3 ? 3 : -1
            };
            dataStartIndex = 0; // include first line as data
        }

        if (columnMap.question === -1 || columnMap.answer === -1) {
            errors.push({
                line: 1,
                message: 'Colonne obbligatorie mancanti. Usa "question" e "answer" (opzionale: deck, status)'
            });
            return { cards: [], errors };
        }

        const cards = [];

        lines.slice(dataStartIndex).forEach((line, idx) => {
            const rowNumber = idx + 1 + dataStartIndex; // 1-based including header offset
            const values = this.tokenizeLine(line, delimiter, quoteChar);

            const question = (values[columnMap.question] || '').trim();
            const answer = (values[columnMap.answer] || '').trim();
            const deck = columnMap.deck !== -1 ? (values[columnMap.deck] || '').trim() : '';
            const status = columnMap.status !== -1 ? (values[columnMap.status] || '').trim() : '';

            if (!question || !answer) {
                errors.push({ line: rowNumber, message: 'Domanda o risposta mancante' });
                return;
            }

            cards.push({
                question,
                answer,
                deck: deck || null,
                status
            });
        });

        return { cards, errors };
    }

    detectDelimiter(line) {
        const candidates = [',', ';', '\t', '|'];
        let best = ',';
        let bestCount = 0;

        candidates.forEach((candidate) => {
            const regexFragment = candidate === '\t' ? '\\t' : `\\${candidate}`;
            const count = (line.match(new RegExp(regexFragment, 'g')) || []).length;
            if (count > bestCount) {
                best = candidate;
                bestCount = count;
            }
        });

        return best;
    }

    resolveDelimiter(line, explicitDelimiter) {
        const allowed = ['auto', ',', ';', '\t', '|'];
        const fallback = ',';
        if (explicitDelimiter && allowed.includes(explicitDelimiter)) {
            if (explicitDelimiter === 'auto') return this.detectDelimiter(line);
            return explicitDelimiter;
        }
        return this.detectDelimiter(line || '') || fallback;
    }

    resolveQuote(quote) {
        if (!quote || quote === 'auto') return '"';
        if (quote === 'none') return '';
        return quote;
    }

    mapColumns(headers) {
        const findIndex = (aliases) => headers.findIndex(h => aliases.includes(h));

        return {
            question: findIndex(['question', 'domanda', 'front', 'q']),
            answer: findIndex(['answer', 'risposta', 'back', 'a']),
            deck: findIndex(['deck', 'mazzo', 'deckname']),
            status: findIndex(['status', 'stato'])
        };
    }

    tokenizeLine(line, delimiter, quoteChar) {
        const result = [];
        let current = '';
        let inQuotes = false;
        const useQuotes = quoteChar && quoteChar.length === 1;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (useQuotes && char === quoteChar) {
                if (inQuotes && line[i + 1] === quoteChar) {
                    current += quoteChar;
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delimiter && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CsvFlashcardAdapter;
} else {
    window.CsvFlashcardAdapter = CsvFlashcardAdapter;
}
