class SessionListView {
    constructor(controller) {
        this.controller = controller;
        this.uploadedFiles = [];

        // Initialize modal logic immediately as it is global
        this.initModal();
    }

    getTemplate() {
        return `
        <div id="study-spaces" class="view-section">
            <header>
                <h1>Spazi di Studio</h1>
                <p class="subtitle">Le tue sessioni organizzate.</p>
            </header>
            <div class="grid" id="sessions-grid">
                <!-- Folders will be injected here -->
            </div>
        </div>
        `;
    }

    init() {
        this.cacheViewDOM();
        // No specific view events to bind for now other than grid interactions handled in render
    }

    initModal() {
        this.modal = document.getElementById('new-session-modal');
        this.closeModalBtn = document.querySelector('#new-session-modal .close-modal');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.createBtn = document.getElementById('create-session-btn');
        this.sessionNameInput = document.getElementById('session-name');
        this.dropZone = document.getElementById('drop-zone');
        this.fileList = document.getElementById('file-list');

        this.bindModalEvents();
    }

    cacheViewDOM() {
        this.sessionsGrid = document.getElementById('sessions-grid');
    }

    // The original cacheDOM and bindEvents methods are no longer needed in their previous form
    // as their responsibilities are split into initModal, cacheViewDOM, and bindModalEvents.
    // Keeping them empty or removing them based on the user's provided structure.
    // The user's instruction implies replacing the old structure with the new one.

    bindModalEvents() {
        if (this.closeModalBtn) this.closeModalBtn.addEventListener('click', () => this.closeModal());
        if (this.cancelBtn) this.cancelBtn.addEventListener('click', () => this.closeModal());

        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        if (this.createBtn) this.createBtn.addEventListener('click', () => this.handleCreateSession());

        if (this.dropZone) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                this.dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                this.dropZone.addEventListener(eventName, () => this.dropZone.classList.add('highlight'), false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                this.dropZone.addEventListener(eventName, () => this.dropZone.classList.remove('highlight'), false);
            });

            this.dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
        }

        // Listen for global event to open modal
        if (typeof eventManager !== 'undefined') {
            eventManager.subscribe('OPEN_NEW_SESSION_MODAL', () => this.openModal());
        }
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        this.handleFiles(files);
    }

    handleFiles(files) {
        ([...files]).forEach(file => {
            this.uploadedFiles.push(file);
        });
        this.renderFileList();
    }

    renderFileList() {
        if (!this.fileList) return;
        this.fileList.innerHTML = '';
        this.uploadedFiles.forEach((file, index) => {
            const div = document.createElement('div');
            div.className = 'file-item';
            div.innerHTML = `
                <i class="fas fa-file"></i>
                <span>${file.name}</span>
                <i class="fas fa-times remove-file" data-index="${index}"></i>
            `;
            this.fileList.appendChild(div);
        });

        this.fileList.querySelectorAll('.remove-file').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                this.uploadedFiles.splice(index, 1);
                this.renderFileList();
            });
        });
    }

    openModal() {
        if (!this.modal) return;
        this.modal.style.display = 'flex';
        this.sessionNameInput.value = '';
        this.uploadedFiles = [];
        this.renderFileList();
        this.sessionNameInput.focus();
    }

    closeModal() {
        if (!this.modal) return;
        this.modal.style.display = 'none';
    }

    async handleCreateSession() {
        const name = this.sessionNameInput.value.trim();
        if (!name) {
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Errore', 'Inserisci un nome per lo spazio', 'error');
            }
            return;
        }

        const result = await this.controller.createSession(name, this.uploadedFiles);

        if (result && result.success) {
            this.closeModal();
        }
        // Se c'è un errore, il controller mostrerà già il toast, il modal rimane aperto
    }

    render(sessions) {
        // Ensure DOM is cached if not already (e.g. first render)
        if (!this.sessionsGrid) this.cacheViewDOM();

        if (!this.sessionsGrid) return;
        this.sessionsGrid.innerHTML = '';

        sessions.forEach(session => {
            const folder = document.createElement('div');
            folder.className = 'folder-wrapper';
            folder.setAttribute('data-session-path', session.fullPath);
            folder.setAttribute('data-session-name', session.name);
            folder.innerHTML = `
                <div class="folder">
                    <div class="folder-back">
                        <div class="paper"></div>
                        <div class="paper"></div>
                        <div class="paper"></div>
                    </div>
                    <div class="folder-front"></div>
                </div>
                <div class="folder-name">${session.name}</div>
                <div class="folder-info">${session.files.length} file</div>
            `;

            const folderEl = folder.querySelector('.folder');

            folder.addEventListener('mouseenter', () => folderEl.classList.add('open'));
            folder.addEventListener('mouseleave', () => folderEl.classList.remove('open'));

            // Click per aprire la sessione
            folder.addEventListener('click', (e) => {
                // Previeni l'apertura se si sta cliccando sul menu contestuale
                if (e.target.closest('.context-menu')) return;
                this.controller.openSession(session);
            });

            // Tasto destro per il menu contestuale
            folder.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const sessionPath = folder.getAttribute('data-session-path');
                const sessionName = folder.getAttribute('data-session-name');

                this.showContextMenu(e.clientX, e.clientY, sessionPath, sessionName);
            });

            this.sessionsGrid.appendChild(folder);
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
}
