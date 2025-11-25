class HomeView {
    constructor(controller) {
        this.controller = controller;
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

    renderRecentSessions(sessions) {
        const container = document.getElementById('recent-sessions-container');
        if (!container) return;

        if (sessions.length === 0) {
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

        container.innerHTML = sessions.map(session => {
            const lastModified = this.controller.formatRelativeTime(session.lastModified || session.createdAt);
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
                this.controller.openSession(sessionPath, sessionName);
            });
        });
    }

    init() {
        // Bind events
        const newSessionBtn = document.getElementById('new-session-btn');
        if (newSessionBtn) {
            newSessionBtn.addEventListener('click', () => {
                if (typeof eventManager !== 'undefined') {
                    eventManager.notify('OPEN_NEW_SESSION_MODAL');
                }
            });
        }
    }
}
