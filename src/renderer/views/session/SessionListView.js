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

    handleCreateSession() {
        const name = this.sessionNameInput.value.trim();
        if (!name) {
            alert('Inserisci un nome per la sessione');
            return;
        }
        this.controller.createSession(name, this.uploadedFiles);
        this.closeModal();
    }

    render(sessions) {
        // Ensure DOM is cached if not already (e.g. first render)
        if (!this.sessionsGrid) this.cacheViewDOM();

        if (!this.sessionsGrid) return;
        this.sessionsGrid.innerHTML = '';

        sessions.forEach(session => {
            const folder = document.createElement('div');
            folder.className = 'folder-wrapper';
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
            folder.addEventListener('click', () => this.controller.openSession(session));

            this.sessionsGrid.appendChild(folder);
        });
    }
}
