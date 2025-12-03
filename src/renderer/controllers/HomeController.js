class HomeController {
    constructor() {
        this.model = new HomeModel();
        this.view = new HomeView(this);
    }

    getTemplate() {
        return this.view.getTemplate();
    }

    async init() {
        // Inizializza la view
        this.view.init();

        // Carica le sessioni recenti
        await this.loadRecentSessions();
    }

    async loadRecentSessions() {
        const sessions = await this.model.getRecentSessions(3);
        this.view.renderRecentSessions(sessions);
    }

    formatRelativeTime(dateString) {
        if (!dateString) return 'Data sconosciuta';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Proprio ora';
        if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minuto' : 'minuti'} fa`;
        if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'ora' : 'ore'} fa`;
        if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'giorno' : 'giorni'} fa`;

        return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    async openSession(sessionPath, sessionName) {
        try {
            const session = await this.model.getSessionByPath(sessionPath);

            if (session && typeof eventManager !== 'undefined') {
                eventManager.notify('OPEN_SESSION', session);
            }
        } catch (error) {
            console.error('Error opening session:', error);
        }
    }

    async renameSession(sessionPath, oldName, newName) {
        try {
            // Valida che il nuovo nome non sia vuoto
            if (!newName || !newName.trim()) {
                return { success: false, error: 'EMPTY_NAME' };
            }

            // Controlla se il nome esiste già (escludendo la sessione corrente)
            const checkResult = await this.model.checkSessionNameExists(newName, sessionPath);
            if (checkResult.exists) {
                return { success: false, error: 'SESSION_NAME_EXISTS' };
            }

            // Rinomina la sessione
            const result = await this.model.renameSession(sessionPath, newName);

            if (result.success) {
                // Ricarica le sessioni recenti
                await this.loadRecentSessions();
            }

            return result;
        } catch (error) {
            console.error('Error renaming session:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteSession(sessionPath, sessionName) {
        try {
            const result = await this.model.deleteSession(sessionPath);

            if (result.success) {
                // Ricarica le sessioni recenti
                await this.loadRecentSessions();

                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Successo', `Spazio "${sessionName}" eliminato`, 'success');
                }
            } else {
                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Errore', 'Impossibile eliminare lo spazio', 'error');
                }
            }

            return result;
        } catch (error) {
            console.error('Error deleting session:', error);
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Errore', 'Errore durante l\'eliminazione', 'error');
            }
            return { success: false, error: error.message };
        }
    }
}
