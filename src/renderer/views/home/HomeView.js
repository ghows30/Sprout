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
                        <h3>Nuovo Spazio</h3>
                        <p>Crea un nuovo spazio di studio.</p>
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
            // Click per aprire la sessione
            card.addEventListener('click', (e) => {
                // Previeni l'apertura se si sta cliccando sul menu contestuale
                if (e.target.closest('.context-menu')) return;

                const sessionPath = card.getAttribute('data-session-path');
                const sessionName = card.getAttribute('data-session-name');
                this.controller.openSession(sessionPath, sessionName);
            });

            // Tasto destro per il menu contestuale
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const sessionPath = card.getAttribute('data-session-path');
                const sessionName = card.getAttribute('data-session-name');

                this.showContextMenu(e.clientX, e.clientY, sessionPath, sessionName);
            });
        });
    }

    showContextMenu(x, y, sessionPath, sessionName) {
        // Rimuovi eventuali menu esistenti
        this.hideContextMenu();

        // Crea il menu contestuale
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'session-context-menu';
        menu.innerHTML = `
            <div class="context-menu-item" data-action="rename">
                <i class="fas fa-edit"></i>
                <span>Cambia nome</span>
            </div>
            <div class="context-menu-divider"></div>
            <div class="context-menu-item danger" data-action="delete">
                <i class="fas fa-trash"></i>
                <span>Elimina</span>
            </div>
        `;

        // Posiziona il menu
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        document.body.appendChild(menu);

        // Aggiungi event listener alle voci del menu
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = item.getAttribute('data-action');

                if (action === 'rename') {
                    this.showRenameModal(sessionPath, sessionName);
                } else if (action === 'delete') {
                    this.handleDeleteSession(sessionPath, sessionName);
                }

                this.hideContextMenu();
            });
        });

        // Chiudi il menu cliccando fuori
        setTimeout(() => {
            document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
        }, 0);
    }

    hideContextMenu() {
        const menu = document.getElementById('session-context-menu');
        if (menu) {
            menu.remove();
        }
    }

    showRenameModal(sessionPath, sessionName) {
        // Rimuovi eventuali modal esistenti
        const existingModal = document.getElementById('rename-session-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Crea il modal di rinomina
        const modal = document.createElement('div');
        modal.id = 'rename-session-modal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Rinomina Spazio</h2>
                <div class="form-group">
                    <label for="rename-session-input">Nuovo nome</label>
                    <input type="text" id="rename-session-input" value="${sessionName}" placeholder="Inserisci il nuovo nome">
                    <div id="rename-error-message" style="color: #e74c3c; font-size: 0.9rem; margin-top: 8px; display: none;"></div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="rename-cancel-btn">Annulla</button>
                    <button class="btn btn-primary" id="rename-save-btn">Salva</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus sull'input e seleziona il testo
        const input = document.getElementById('rename-session-input');
        const errorMessage = document.getElementById('rename-error-message');
        input.focus();
        input.select();

        // Event listeners
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = document.getElementById('rename-cancel-btn');
        const saveBtn = document.getElementById('rename-save-btn');

        const closeModal = () => {
            modal.remove();
        };

        const showError = (message) => {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            input.focus();
        };

        const hideError = () => {
            errorMessage.style.display = 'none';
        };

        // Nascondi errore quando l'utente modifica l'input
        input.addEventListener('input', hideError);

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        saveBtn.addEventListener('click', async () => {
            const newName = input.value.trim();

            if (!newName) {
                showError('Il nome non può essere vuoto');
                return;
            }

            if (newName === sessionName) {
                closeModal();
                return;
            }

            // Disabilita il pulsante durante il salvataggio
            saveBtn.disabled = true;
            saveBtn.textContent = 'Salvataggio...';

            const result = await this.controller.renameSession(sessionPath, sessionName, newName);

            if (result.success) {
                if (typeof toastManager !== 'undefined') {
                    toastManager.show('Successo', 'Spazio rinominato con successo', 'success');
                }
                closeModal();
            } else {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Salva';

                if (result.error === 'SESSION_NAME_EXISTS') {
                    showError('Esiste già uno spazio con questo nome');
                } else if (result.error === 'EMPTY_NAME') {
                    showError('Il nome non può essere vuoto');
                } else {
                    showError('Errore durante la rinomina: ' + (result.error || 'Errore sconosciuto'));
                }
            }
        });

        // Chiudi con ESC
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'Enter' && e.target === input) {
                saveBtn.click();
            }
        });

        // Chiudi cliccando fuori
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    handleDeleteSession(sessionPath, sessionName) {
        // Crea modal di conferma
        const modal = document.createElement('div');
        modal.id = 'delete-confirm-modal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2 style="color: #e74c3c;">⚠️ Conferma Eliminazione</h2>
                <p style="margin: 20px 0; line-height: 1.6;">
                    Sei sicuro di voler eliminare lo spazio <strong>"${sessionName}"</strong>?
                </p>
                <p style="margin: 20px 0; padding: 12px; background-color: rgba(231, 76, 60, 0.1); border-left: 4px solid #e74c3c; border-radius: 4px; line-height: 1.6;">
                    <strong>⚠️ Attenzione:</strong> Questa azione è <strong>permanente</strong> e <strong>non può essere annullata</strong>. 
                    Tutti i file e gli appunti contenuti in questo spazio verranno eliminati definitivamente.
                </p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="delete-cancel-btn">Annulla</button>
                    <button class="btn" id="delete-confirm-btn" style="background-color: #e74c3c; color: white;">Elimina</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = document.getElementById('delete-cancel-btn');
        const confirmBtn = document.getElementById('delete-confirm-btn');

        const closeModal = () => {
            modal.remove();
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        confirmBtn.addEventListener('click', async () => {
            // Disabilita il pulsante durante l'eliminazione
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Eliminazione...';

            await this.controller.deleteSession(sessionPath, sessionName);
            closeModal();
        });

        // Chiudi con ESC
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });

        // Chiudi cliccando fuori
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
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

