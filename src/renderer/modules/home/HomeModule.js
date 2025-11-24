class HomeModule {
    constructor() {
        // No initialization needed yet
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
                <div class="grid">
                    <div class="card">
                        <div class="card-icon" style="background-color: rgba(236, 240, 241, 0.5); color: var(--text-main);">
                            <i class="fas fa-book-open"></i>
                        </div>
                        <h3>Analisi Matematica</h3>
                        <p>Ultima modifica: 2 ore fa</p>
                    </div>
                </div>
            </section>
        </div>
        `;
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
    }
}
