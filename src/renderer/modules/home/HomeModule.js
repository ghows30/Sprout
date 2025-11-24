class HomeModule {
    constructor() {
        this.ipcRenderer = require('electron').ipcRenderer;
    }

    getTemplate() {
        return `
        <div id="home" class="view-section">
            <header>
                <h1>Dashboard</h1>
                <p class="subtitle">I tuoi appunti e documenti.</p>
            </header>

            <section>
                <h2>Accesso Rapido</h2>
                <div class="grid">
                    <div class="card" id="new-session-btn">
                        <div class="card-icon">
                            <i class="fas fa-plus"></i>
                        </div>
                        <h3>Nuova Sessione</h3>
                        <p>Crea una nuova sessione di studio.</p>
                    </div>
                    <div class="card">
                        <div class="card-icon">
                            <i class="fas fa-file-import"></i>
                        </div>
                        <h3>Importa PDF</h3>
                        <p>Carica slide o documenti da studiare.</p>
                    </div>
                    <div class="card">
                        <div class="card-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <h3>Recenti</h3>
                        <p>Riprendi da dove avevi lasciato.</p>
                    </div>
                </div>
            </section>

            <section>
                <h2>Recenti</h2>
                <div class="grid" id="recent-sessions-container">
                    <!-- Le sessioni recenti verranno caricate dinamicamente qui -->
                </div>
            </section>
        </div>
        `;
    }

    async loadRecentSessions() {
        try {
            const sessions = await this.ipcRenderer.invoke('get-sessions');

            // Ordina per lastModified (più recenti prima)
            const sortedSessions = sessions.sort((a, b) => {
                const dateA = new Date(a.lastModified || a.createdAt || 0);
                const dateB = new Date(b.lastModified || b.createdAt || 0);
                return dateB - dateA;
            });

            // Prendi solo le prime 3 sessioni
            const recentSessions = sortedSessions.slice(0, 3);

            const container = document.getElementById('recent-sessions-container');
            if (!container) return;

            if (recentSessions.length === 0) {
                container.innerHTML = `
                    <div class="card" style="opacity: 0.6;">
                        <div class="card-icon" style="background-color: rgba(236, 240, 241, 0.5); color: var(--text-main);">
                            <i class="fas fa-inbox"></i>
                        </div>
                        <h3>Nessuna sessione</h3>
                        <p>Crea la tua prima sessione di studio!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = recentSessions.map(session => {
                const lastModified = this.formatRelativeTime(session.lastModified || session.createdAt);
                return `
                    <div class="card recent-session-card" data-session-path="${session.fullPath}" data-session-name="${session.name}">
                        <div class="card-icon" style="background-color: rgba(236, 240, 241, 0.5); color: var(--text-main);">
                            <i class="fas fa-book-open"></i>
                        </div>
                        <h3>${session.name}</h3>
                        <p>Ultima modifica: ${lastModified}</p>
                    </div>
                `;
            }).join('');

            // Aggiungi event listener alle card
            const cards = container.querySelectorAll('.recent-session-card');
            cards.forEach(card => {
                card.addEventListener('click', () => {
                    const sessionPath = card.getAttribute('data-session-path');
                    const sessionName = card.getAttribute('data-session-name');
                    this.openSession(sessionPath, sessionName);
                });
            });
        } catch (error) {
            console.error('Error loading recent sessions:', error);
        }
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
            // Carica i dati della sessione
            const sessions = await this.ipcRenderer.invoke('get-sessions');
            const session = sessions.find(s => s.fullPath === sessionPath);

            if (session && typeof eventManager !== 'undefined') {
                eventManager.notify('OPEN_SESSION', session);
            }
        } catch (error) {
            console.error('Error opening session:', error);
        }
    }

    init() {
        // Bind events if needed after rendering
        const newSessionBtn = document.getElementById('new-session-btn');
        if (newSessionBtn) {
            newSessionBtn.addEventListener('click', () => {
                if (typeof eventManager !== 'undefined') {
                    eventManager.notify('OPEN_NEW_SESSION_MODAL');
                }
            });
        }

        // Carica le sessioni recenti
        this.loadRecentSessions();
    }
}
