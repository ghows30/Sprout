const StudySessionsModule = (() => {
    let uploadedFiles = [];

    let modal, newSessionBtn, closeModalBtn, cancelBtn, createBtn, sessionNameInput, dropZone, fileList, sessionsGrid;

    function init() {

        cacheDOM();
        bindEvents();
        renderSessions();

        if (typeof EventManager !== 'undefined') {
            EventManager.subscribe('SESSION_CREATED', (session) => {
                console.log('Observer: New session created, updating list...');
                renderSessions();
            });
        }
    }

    function cacheDOM() {
        modal = document.getElementById('new-session-modal');
        newSessionBtn = document.getElementById('new-session-btn');
        closeModalBtn = document.querySelector('.close-modal');
        cancelBtn = document.getElementById('cancel-btn');
        createBtn = document.getElementById('create-session-btn');
        sessionNameInput = document.getElementById('session-name');
        dropZone = document.getElementById('drop-zone');
        fileList = document.getElementById('file-list');
        sessionsGrid = document.getElementById('sessions-grid');
    }

    function bindEvents() {
        if (newSessionBtn) newSessionBtn.addEventListener('click', openModal);
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        window.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        if (createBtn) createBtn.addEventListener('click', createSession);

        if (dropZone) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, preventDefaults, false);
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, highlight, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, unhighlight, false);
            });

            dropZone.addEventListener('drop', handleDrop, false);
        }
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropZone.classList.add('highlight');
    }

    function unhighlight() {
        dropZone.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        ([...files]).forEach(file => {
            uploadedFiles.push(file);
        });
        renderFileList();
    }

    function renderFileList() {
        if (!fileList) return;
        fileList.innerHTML = '';
        uploadedFiles.forEach((file, index) => {
            const div = document.createElement('div');
            div.className = 'file-item';
            div.innerHTML = `
                <i class="fas fa-file"></i>
                <span>${file.name}</span>
                <i class="fas fa-times remove-file" data-index="${index}"></i>
            `;
            fileList.appendChild(div);
        });

        document.querySelectorAll('.remove-file').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                uploadedFiles.splice(index, 1);
                renderFileList();
            });
        });
    }

    function openModal() {
        modal.style.display = 'flex';
        sessionNameInput.value = '';
        uploadedFiles = [];
        renderFileList();
        sessionNameInput.focus();
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    function createSession() {
        const name = sessionNameInput.value.trim();
        if (!name) {
            alert('Inserisci un nome per la sessione');
            return;
        }

        const session = {
            id: Date.now(),
            name: name,
            files: uploadedFiles.map(f => ({ name: f.name, path: f.path })),
            createdAt: new Date().toISOString()
        };

        saveSession(session);
        closeModal();

        if (typeof EventManager !== 'undefined') {
            EventManager.notify('SESSION_CREATED', session);
        }
    }

    function saveSession(session) {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('save-session', session);
    }

    function renderSessions() {
        if (!sessionsGrid) return;
        const { ipcRenderer } = require('electron');

        ipcRenderer.invoke('get-sessions').then(sessions => {
            sessionsGrid.innerHTML = '';

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
                folder.addEventListener('click', () => {
                    const folderEl = folder.querySelector('.folder');
                    folderEl.classList.toggle('open');
                    document.querySelectorAll('.folder').forEach(f => {
                        if (f !== folderEl) f.classList.remove('open');
                    });
                });
                sessionsGrid.appendChild(folder);
            });
        });
    }

    return {
        init
    };
})();
