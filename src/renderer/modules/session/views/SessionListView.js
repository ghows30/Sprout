class SessionListView {
    constructor(controller) {
        this.controller = controller;
        this.uploadedFiles = [];
        this.cacheDOM();
        this.bindEvents();
    }

    cacheDOM() {
        this.sessionsGrid = document.getElementById('sessions-grid');
        this.modal = document.getElementById('new-session-modal');
        this.newSessionBtn = document.getElementById('new-session-btn');
        this.closeModalBtn = document.querySelector('.close-modal');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.createBtn = document.getElementById('create-session-btn');
        this.sessionNameInput = document.getElementById('session-name');
        this.dropZone = document.getElementById('drop-zone');
        this.fileList = document.getElementById('file-list');
    }

    bindEvents() {
        if (this.newSessionBtn) this.newSessionBtn.addEventListener('click', () => this.openModal());
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
        this.modal.style.display = 'flex';
        this.sessionNameInput.value = '';
        this.uploadedFiles = [];
        this.renderFileList();
        this.sessionNameInput.focus();
    }

    closeModal() {
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
