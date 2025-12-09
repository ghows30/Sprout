class BaseFlashcardAdapter {
    constructor(name, supportedExtensions = []) {
        this.name = name;
        this.supportedExtensions = supportedExtensions.map(ext => ext.toLowerCase());
    }

    getExtension(fileName) {
        if (!fileName || typeof fileName !== 'string') return '';
        const lastDot = fileName.lastIndexOf('.');
        return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase();
    }

    matchesExtension(fileName) {
        const ext = this.getExtension(fileName);
        return this.supportedExtensions.includes(ext);
    }

    /**
     * Override to provide smarter detection when needed.
     */
    canHandle({ name, extension }) {
        const extToCheck = extension || this.getExtension(name);
        return this.supportedExtensions.includes(extToCheck);
    }

    /**
     * @param {string} content raw file content
     * @returns {{cards: Array, errors: Array}} normalized flashcard drafts + parse errors
     */
    // eslint-disable-next-line no-unused-vars
    parse(content) {
        throw new Error('parse must be implemented by adapters');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseFlashcardAdapter;
} else {
    window.BaseFlashcardAdapter = BaseFlashcardAdapter;
}
