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
}
