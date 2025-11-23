const StudySessionsModule = (() => {
    let uploadedFiles = [];

    let currentSession = null;
    let modal, newSessionBtn, closeModalBtn, cancelBtn, createBtn, sessionNameInput, dropZone, fileList, sessionsGrid;
    let sessionView, sessionTitle, sessionFileList, sessionNotes, saveNoteBtn;
    let sessionSidebar, sessionResizer, toggleSidebarBtn;
    let sidebarTabs, tabContents;
    let timerDisplay, timerStartBtn, timerPauseBtn, timerResetBtn, presetBtns;
    let timerInterval, timerSeconds = 1500; // 25 minutes default
    let flashcardList, createFlashcardBtn, importFlashcardBtn;

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

        // Tab System
        sidebarTabs = document.querySelectorAll('.sidebar-tab');
        tabContents = document.querySelectorAll('.tab-content');

        // Timer Elements
        timerDisplay = document.getElementById('timer-display');
        timerStartBtn = document.getElementById('timer-start');
        timerPauseBtn = document.getElementById('timer-pause');
        timerResetBtn = document.getElementById('timer-reset');
        presetBtns = document.querySelectorAll('.preset-btn');

        // Flashcard Elements
        flashcardList = document.getElementById('flashcard-list');
        createFlashcardBtn = document.getElementById('create-flashcard-btn');
        importFlashcardBtn = document.getElementById('import-flashcard-btn');
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

        // Tab switching
        sidebarTabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });

        // Timer controls
        if (timerStartBtn) timerStartBtn.addEventListener('click', startTimer);
        if (timerPauseBtn) timerPauseBtn.addEventListener('click', pauseTimer);
        if (timerResetBtn) timerResetBtn.addEventListener('click', resetTimer);

        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => setTimerPreset(parseInt(btn.dataset.minutes)));
        });

        // Flashcard controls
        if (createFlashcardBtn) createFlashcardBtn.addEventListener('click', createFlashcard);
        if (importFlashcardBtn) importFlashcardBtn.addEventListener('click', importFlashcards);

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

                const folderEl = folder.querySelector('.folder');

                // Hover animation
                folder.addEventListener('mouseenter', () => {
                    folderEl.classList.add('open');
                });

                folder.addEventListener('mouseleave', () => {
                    folderEl.classList.remove('open');
                });

                // Click to open session
                folder.addEventListener('click', () => {
                    openSession(session);
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

            // Render files with colored icons
            sessionFileList.innerHTML = '';
            if (session.files && session.files.length > 0) {
                session.files.forEach(file => {
                    const fileName = typeof file === 'string' ? file.split('/').pop().split('\\').pop() : file.name;
                    const ext = fileName.split('.').pop().toLowerCase();

                    // Determine icon and color class based on file type
                    let iconClass = 'fas fa-file';
                    let colorClass = 'file-icon-default';

                    if (ext === 'pdf') {
                        iconClass = 'fas fa-file-pdf';
                        colorClass = 'file-icon-pdf';
                    } else if (['doc', 'docx'].includes(ext)) {
                        iconClass = 'fas fa-file-word';
                        colorClass = 'file-icon-doc';
                    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
                        iconClass = 'fas fa-file-image';
                        colorClass = 'file-icon-image';
                    } else if (['txt', 'md'].includes(ext)) {
                        iconClass = 'fas fa-file-alt';
                        colorClass = 'file-icon-text';
                    } else if (['xls', 'xlsx'].includes(ext)) {
                        iconClass = 'fas fa-file-excel';
                        colorClass = 'file-icon-excel';
                    } else if (['ppt', 'pptx'].includes(ext)) {
                        iconClass = 'fas fa-file-powerpoint';
                        colorClass = 'file-icon-ppt';
                    }

                    const li = document.createElement('li');
                    li.className = 'session-file-item';
                    li.innerHTML = `
                        <i class="${iconClass} ${colorClass}"></i>
                        <span>${fileName}</span>
                    `;
                    sessionFileList.appendChild(li);
                });
            } else {
                sessionFileList.innerHTML = '<li class="session-file-item" style="cursor: default;">Nessun file</li>';
            }

            // Render flashcards for this session
            renderFlashcards();
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

    // Tab Switching
    function switchTab(tabName) {
        // Update tab buttons
        sidebarTabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update tab contents
        tabContents.forEach(content => {
            if (content.id === `tab-${tabName}`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }

    // Timer Functions
    function updateTimerDisplay() {
        const minutes = Math.floor(timerSeconds / 60);
        const seconds = timerSeconds % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function startTimer() {
        if (timerInterval) return; // Already running

        timerStartBtn.style.display = 'none';
        timerPauseBtn.style.display = 'flex';

        timerInterval = setInterval(() => {
            if (timerSeconds > 0) {
                timerSeconds--;
                updateTimerDisplay();
            } else {
                pauseTimer();
                alert('Timer completato!');
            }
        }, 1000);
    }

    function pauseTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timerStartBtn.style.display = 'flex';
        timerPauseBtn.style.display = 'none';
    }

    function resetTimer() {
        pauseTimer();
        timerSeconds = 1500; // Reset to 25 minutes
        updateTimerDisplay();
    }

    function setTimerPreset(minutes) {
        pauseTimer();
        timerSeconds = minutes * 60;
        updateTimerDisplay();
    }

    // Flashcard Functions
    function renderFlashcards() {
        if (!flashcardList || !currentSession) return;

        const flashcards = currentSession.flashcards || [];
        flashcardList.innerHTML = '';

        if (flashcards.length === 0) {
            flashcardList.innerHTML = '<li style="text-align: center; color: var(--text-muted); padding: 20px;">Nessuna flashcard</li>';
            return;
        }

        flashcards.forEach(card => {
            const li = document.createElement('li');
            li.className = 'flashcard-item';
            li.innerHTML = `
                <div class="flashcard-question">${card.question}</div>
                <div class="flashcard-answer">${card.answer}</div>
            `;
            flashcardList.appendChild(li);
        });
    }

    function createFlashcard() {
        const question = prompt('Inserisci la domanda:');
        if (!question) return;

        const answer = prompt('Inserisci la risposta:');
        if (!answer) return;

        const flashcard = {
            id: Date.now(),
            question: question,
            answer: answer,
            createdAt: new Date().toISOString()
        };

        if (!currentSession.flashcards) {
            currentSession.flashcards = [];
        }
        currentSession.flashcards.push(flashcard);

        // Save to backend
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('save-session-data', currentSession);

        renderFlashcards();
    }

    function importFlashcards() {
        alert('Funzionalità di importazione in arrivo!');
        // TODO: Implement file picker and JSON import
    }

    return {
        init
    };
})();
