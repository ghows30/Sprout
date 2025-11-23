const StudySessionsModule = (() => {
    let uploadedFiles = [];

    let currentSession = null;
    let modal, newSessionBtn, closeModalBtn, cancelBtn, createBtn, sessionNameInput, dropZone, fileList, sessionsGrid;
    let sessionView, sessionTitle, sessionFileList, sessionNotes, saveNoteBtn;
    let sessionSidebar, sessionResizer, toggleSidebarBtn;

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

        // Active Session Elements
        sessionView = document.getElementById('active-session');
        sessionTitle = document.getElementById('active-session-title');
        sessionFileList = document.getElementById('session-file-list');
        sessionNotes = document.getElementById('session-notes');
        saveNoteBtn = document.getElementById('save-note-btn');

        // Resizer & Toggle
        sessionSidebar = document.getElementById('session-sidebar');
        sessionResizer = document.getElementById('session-resizer');
        toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
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

        if (saveNoteBtn) {
            saveNoteBtn.addEventListener('click', saveNote);
        }

        // Resizer Logic
        if (sessionResizer) {
            sessionResizer.addEventListener('mousedown', initResize);
        }

        // Toggle Logic
        if (toggleSidebarBtn) {
            toggleSidebarBtn.addEventListener('click', toggleSidebar);
        }
    }

    // Resizing Functions
    function initResize(e) {
        e.preventDefault(); // Prevent text selection
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResize);
        sessionResizer.classList.add('resizing');
    }

    function resize(e) {
        if (!sessionSidebar) return;
        // Calculate new width based on mouse position relative to sidebar start
        // Since sidebar is on the left, e.clientX is roughly the width
        // But we need to account for the main sidebar (260px) + padding (40px) = 300px offset?
        // Actually, .session-container has margin -40px, so it starts at the edge of .content?
        // Let's check the DOM structure.
        // body > nav.sidebar (260px)
        // body > main.content (flex-grow)
        // So e.clientX includes the nav.sidebar width.

        const newWidth = e.clientX - sessionSidebar.getBoundingClientRect().left;

        if (newWidth > 150 && newWidth < 600) { // Min and Max width constraints
            sessionSidebar.style.width = `${newWidth}px`;
        }
    }

    function stopResize() {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResize);
        if (sessionResizer) sessionResizer.classList.remove('resizing');
    }

    function toggleSidebar() {
        if (sessionSidebar) {
            sessionSidebar.classList.toggle('collapsed');
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
            files: uploadedFiles.map(f => {
                // Electron's File object has a path property, but it might not serialize automatically
                // or requires webUtils in newer Electron versions.
                // Since we have nodeIntegration: true, let's try accessing it directly but explicitly.
                // If f.path is undefined, we might need webUtils.
                let filePath = f.path;
                if (!filePath) {
                    try {
                        const { webUtils } = require('electron');
                        filePath = webUtils.getPathForFile(f);
                    } catch (e) {
                        // console.error('Error getting path:', e);
                    }
                }
                return { name: f.name, path: filePath };
            }),
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
                    folderEl.classList.add('open');

                    // Open session after animation
                    setTimeout(() => {
                        openSession(session);
                    }, 300);
                });
                sessionsGrid.appendChild(folder);
            });
        });
    }

    function openSession(session) {
        currentSession = session;

        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');

        // Show active session view
        if (sessionView) {
            sessionView.style.display = 'block';
            sessionTitle.textContent = session.name;
            sessionNotes.value = ''; // Clear notes or load existing if we had them

            // Render files
            sessionFileList.innerHTML = '';
            if (session.files && session.files.length > 0) {
                session.files.forEach(file => {
                    // file is a relative path string in the new structure, or object?
                    // In main.js we updated it to store relative paths as strings in session.files array
                    // But wait, in createSession we send objects {name, path}.
                    // In save-session in main.js, we process them and update session.files to be an array of strings (relative paths).
                    // So when we read it back in get-sessions, session.files is an array of strings.

                    const fileName = typeof file === 'string' ? file.split('/').pop().split('\\').pop() : file.name;

                    const li = document.createElement('li');
                    li.className = 'session-file-item';
                    li.innerHTML = `
                        <i class="fas fa-file-alt"></i>
                        <span>${fileName}</span>
                    `;
                    sessionFileList.appendChild(li);
                });
            } else {
                sessionFileList.innerHTML = '<li class="session-file-item" style="cursor: default;">Nessun file</li>';
            }
        }
    }

    async function saveNote() {
        if (!currentSession) return;

        const content = sessionNotes.value;
        if (!content.trim()) {
            alert('La nota è vuota.');
            return;
        }

        const fileName = prompt('Inserisci il nome del file (es. appunti.txt):', 'appunti.txt');
        if (!fileName) return;

        const { ipcRenderer } = require('electron');
        try {
            const result = await ipcRenderer.invoke('save-note', {
                sessionPath: currentSession.fullPath,
                fileName: fileName,
                content: content
            });

            if (result.success) {
                alert('Appunti salvati con successo!');
            } else {
                alert('Errore durante il salvataggio: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('Errore durante il salvataggio.');
        }
    }

    return {
        init
    };
})();
