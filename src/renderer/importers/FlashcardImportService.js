class FlashcardImportService {
    constructor(adapters = []) {
        this.adapters = adapters;
    }

    registerAdapter(adapter) {
        this.adapters.push(adapter);
    }

    getExtension(fileName) {
        if (!fileName || typeof fileName !== 'string') return '';
        const lastDot = fileName.lastIndexOf('.');
        return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase();
    }

    resolveAdapter(fileName, content) {
        const extension = this.getExtension(fileName);
        return this.adapters.find(adapter => adapter.canHandle({ name: fileName, extension, content }));
    }

    importFromContent(fileName, content, { adapterKey = null, parseOptions = {} } = {}) {
        if (content === undefined || content === null) {
            throw new Error('File non valido');
        }

        let adapter = null;
        if (adapterKey) {
            adapter = this.findAdapterByKey(adapterKey);
            if (!adapter) {
                throw new Error(`Formato ${adapterKey} non supportato`);
            }
        } else {
            adapter = this.resolveAdapter(fileName, content);
        }

        if (!adapter) {
            throw new Error('Formato non supportato. Usa CSV o JSON');
        }

        const result = adapter.parse(content, parseOptions || {});
        return {
            ...result,
            adapter: adapter.name,
            fileName
        };
    }

    findAdapterByKey(key) {
        if (!key) return null;
        const normalized = key.toLowerCase();
        return this.adapters.find(adapter => adapter.name.toLowerCase() === normalized);
    }

    importFile(file, { adapterKey = null, parseOptions = {} } = {}) {
        if (!file || !file.path) {
            throw new Error('File non valido');
        }

        const fs = require('fs');
        let content = '';

        try {
            content = fs.readFileSync(file.path, 'utf8');
        } catch (error) {
            throw new Error('Impossibile leggere il file selezionato');
        }

        let adapter = null;

        if (adapterKey) {
            adapter = this.findAdapterByKey(adapterKey);
            if (!adapter) {
                throw new Error(`Formato ${adapterKey} non supportato`);
            }
        } else {
            adapter = this.resolveAdapter(file.name, content);
        }

        if (!adapter) {
            throw new Error('Formato non supportato. Usa CSV o JSON');
        }

        const result = adapter.parse(content, parseOptions || {});
        return {
            ...result,
            adapter: adapter.name,
            fileName: file.name
        };
    }

    summarize(cards) {
        const summary = {
            total: cards.length,
            byDeck: {}
        };

        cards.forEach(card => {
            const deckKey = (card.deck && String(card.deck).trim()) || 'Nessun deck';
            summary.byDeck[deckKey] = (summary.byDeck[deckKey] || 0) + 1;
        });

        return summary;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlashcardImportService;
} else {
    window.FlashcardImportService = FlashcardImportService;
}
