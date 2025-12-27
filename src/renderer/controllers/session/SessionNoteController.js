class SessionNoteController {
    constructor(controller) {
        this.controller = controller;
    }

    get model() {
        return this.controller.model;
    }

    async saveNote(content, fileName) {
        if (typeof toastManager === 'undefined') return;

        try {
            const result = await this.model.saveNote(content, fileName);
            if (result.success) {
                toastManager.show('Salvato', 'Appunti salvati con successo!', 'success');
            } else {
                toastManager.show('Errore', 'Errore durante il salvataggio: ' + result.error, 'error');
            }
        } catch (error) {
            console.error(error);
            toastManager.show('Errore', 'Errore durante il salvataggio.', 'error');
        }
    }

    async autoSaveNote(content) {
        try {
            const result = await this.model.autoSaveNotes(content);
            return result;
        } catch (error) {
            console.error('Auto-save error:', error);
            return { success: false };
        }
    }

    async loadNotes() {
        try {
            const result = await this.model.loadNotes();
            return result;
        } catch (error) {
            console.error('Load notes error:', error);
            return { success: false, content: '' };
        }
    }
}
