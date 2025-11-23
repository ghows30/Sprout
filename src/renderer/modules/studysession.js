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
    let documentViewer, viewerPlaceholder, viewerContent, viewerFilename, closeViewerBtn, documentIframe, documentImage, splitResizer;
    let timerModal, closeTimerModal, timerIconBtn, timerCountdown;
    let addDocumentBtn;

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

        // Document Viewer Elements
        documentViewer = document.getElementById('document-viewer');
        viewerPlaceholder = document.querySelector('.viewer-placeholder');
        viewerContent = document.getElementById('viewer-content');
        viewerFilename = document.getElementById('viewer-filename');
        closeViewerBtn = document.getElementById('close-viewer-btn');
        documentIframe = document.getElementById('document-iframe');
        documentImage = document.getElementById('document-image');
        splitResizer = document.getElementById('split-resizer');

        // Timer Modal Elements
        timerModal = document.getElementById('timer-modal');
        closeTimerModal = document.getElementById('close-timer-modal');
        timerIconBtn = document.getElementById('timer-icon-btn');
        timerCountdown = document.getElementById('timer-countdown');

        // Add Document Button
        addDocumentBtn = document.getElementById('add-document-btn');
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

        // Timer controls
        if (timerStartBtn) timerStartBtn.addEventListener('click', startTimer);
        if (timerPauseBtn) timerPauseBtn.addEventListener('click', pauseTimer);
        if (timerResetBtn) timerResetBtn.addEventListener('click', resetTimer);

        // Timer modal
        if (timerIconBtn) timerIconBtn.addEventListener('click', openTimerModal);
        if (closeTimerModal) closeTimerModal.addEventListener('click', closeTimerModalFn);

        // Update preset buttons selector for large version
        const presetBtnsLarge = document.querySelectorAll('.preset-btn-large');
        presetBtnsLarge.forEach(btn => {
            btn.addEventListener('click', () => {
                setTimerPreset(parseInt(btn.dataset.minutes));
                closeTimerModalFn();
            });
        });

        // Flashcard controls
        if (createFlashcardBtn) createFlashcardBtn.addEventListener('click', createFlashcard);
        if (importFlashcardBtn) importFlashcardBtn.addEventListener('click', importFlashcards);

        // Document viewer controls
        if (closeViewerBtn) closeViewerBtn.addEventListener('click', closeDocument);
        initSplitResizer();

        // Add document button
        if (addDocumentBtn) addDocumentBtn.addEventListener('click', addDocumentsToSession);

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

            // Render files grouped by category
            sessionFileList.innerHTML = '';
            if (session.files && session.files.length > 0) {
                // Categorize files
                const categories = {
                    pdf: { name: 'PDF', files: [], icon: 'fas fa-file-pdf', color: 'file-icon-pdf' },
                    document: { name: 'Documenti', files: [], icon: 'fas fa-file-word', color: 'file-icon-doc' },
                    image: { name: 'Immagini', files: [], icon: 'fas fa-file-image', color: 'file-icon-image' },
                    spreadsheet: { name: 'Fogli di calcolo', files: [], icon: 'fas fa-file-excel', color: 'file-icon-excel' },
                    presentation: { name: 'Presentazioni', files: [], icon: 'fas fa-file-powerpoint', color: 'file-icon-ppt' },
                    text: { name: 'Testo', files: [], icon: 'fas fa-file-alt', color: 'file-icon-text' },
                    other: { name: 'Altri', files: [], icon: 'fas fa-file', color: 'file-icon-default' }
                };

                // Group files by category
                session.files.forEach(file => {
                    const fileName = typeof file === 'string' ? file.split('/').pop().split('\\').pop() : file.name;
                    const ext = fileName.split('.').pop().toLowerCase();

                    if (ext === 'pdf') {
                        categories.pdf.files.push({ file, fileName, ext });
                    } else if (['doc', 'docx'].includes(ext)) {
                        categories.document.files.push({ file, fileName, ext });
                    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
                        categories.image.files.push({ file, fileName, ext });
                    } else if (['xls', 'xlsx'].includes(ext)) {
                        categories.spreadsheet.files.push({ file, fileName, ext });
                    } else if (['ppt', 'pptx'].includes(ext)) {
                        categories.presentation.files.push({ file, fileName, ext });
                    } else if (['txt', 'md'].includes(ext)) {
                        categories.text.files.push({ file, fileName, ext });
                    } else {
                        categories.other.files.push({ file, fileName, ext });
                    }
                });

                // Render each category
                Object.values(categories).forEach(category => {
                    if (category.files.length > 0) {
                        // Category header
                        const categoryHeader = document.createElement('li');
                        categoryHeader.className = 'file-category-header';
                        categoryHeader.innerHTML = `
                            <i class="fas fa-chevron-down category-chevron collapsed"></i>
                            <i class="${category.icon} ${category.color}"></i>
                            <span>${category.name}</span>
                            <span class="file-count">(${category.files.length})</span>
                        `;

                        // Create container for category files (start collapsed)
                        const categoryContainer = document.createElement('div');
                        categoryContainer.className = 'category-files-container collapsed';

                        // Category files
                        category.files.forEach(({ file, fileName }) => {
                            const li = document.createElement('li');
                            li.className = 'session-file-item';
                            li.innerHTML = `
                                <i class="${category.icon} ${category.color}"></i>
                                <span>${fileName}</span>
                            `;

                            // Add click handler to open document
                            li.addEventListener('click', () => {
                                openDocument(file, fileName);
                            });

                            categoryContainer.appendChild(li);
                        });

                        // Toggle collapse/expand on header click
                        categoryHeader.addEventListener('click', () => {
                            categoryContainer.classList.toggle('collapsed');
                            categoryHeader.querySelector('.category-chevron').classList.toggle('collapsed');
                        });

                        sessionFileList.appendChild(categoryHeader);
                        sessionFileList.appendChild(categoryContainer);
                    }
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

    // Timer Modal Functions
    function openTimerModal() {
        if (timerModal) {
            timerModal.style.display = 'flex';
        }
    }

    function closeTimerModalFn() {
        if (timerModal) {
            timerModal.style.display = 'none';
        }
    }

    // Timer Functions
    function updateTimerDisplay() {
        const minutes = Math.floor(timerSeconds / 60);
        const seconds = timerSeconds % 60;
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Update both modal display and countdown
        timerDisplay.textContent = timeString;
        if (timerCountdown) {
            timerCountdown.textContent = timeString;
        }
    }

    function startTimer() {
        if (timerInterval) return; // Already running

        // Hide icon, show countdown
        if (timerIconBtn) timerIconBtn.style.display = 'none';
        if (timerCountdown) timerCountdown.style.display = 'block';

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

        // Show icon, hide countdown
        if (timerIconBtn) timerIconBtn.style.display = 'flex';
        if (timerCountdown) timerCountdown.style.display = 'none';
    }

    function setTimerPreset(minutes) {
        pauseTimer();
        timerSeconds = minutes * 60;
        updateTimerDisplay();

        // Show icon, hide countdown
        if (timerIconBtn) timerIconBtn.style.display = 'flex';
        if (timerCountdown) timerCountdown.style.display = 'none';
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

    // Document Viewer Functions
    function openDocument(filePath, fileName) {
        if (!currentSession || !filePath) return;

        const ext = fileName.split('.').pop().toLowerCase();
        const fullPath = `file://${currentSession.fullPath}/${filePath}`;

        // Show document viewer
        documentViewer.style.display = 'flex';

        // Update filename in header
        viewerFilename.textContent = fileName;

        // Hide both iframe and image first
        documentIframe.style.display = 'none';
        documentImage.style.display = 'none';

        // Show appropriate viewer based on file type
        if (ext === 'pdf') {
            documentIframe.src = fullPath;
            documentIframe.style.display = 'block';
        } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
            documentImage.src = fullPath;
            documentImage.style.display = 'block';
        } else {
            // For other file types, try to open in system default app
            const { shell } = require('electron');
            shell.openPath(fullPath.replace('file://', ''));
        }
    }

    function closeDocument() {
        // Hide document viewer
        documentViewer.style.display = 'none';
        viewerFilename.textContent = 'Nessun documento aperto';
        documentIframe.src = '';
        documentImage.src = '';
        documentIframe.style.display = 'none';
        documentImage.style.display = 'none';
    }

    function initSplitResizer() {
        if (!splitResizer) return;

        let isResizing = false;
        const notesEditor = document.querySelector('.notes-editor');

        splitResizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            splitResizer.classList.add('resizing');
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const container = document.querySelector('.split-view-container');
            const containerRect = container.getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;

            // Set min/max widths
            if (newWidth > 200 && newWidth < containerRect.width - 200) {
                notesEditor.style.flex = `0 0 ${newWidth}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                splitResizer.classList.remove('resizing');
            }
        });
    }

    // Toast Notification System
    function showToast(title, message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => removeToast(toast));

        // Auto remove
        setTimeout(() => removeToast(toast), duration);
    }

    function removeToast(toast) {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Add Documents to Session
    async function addDocumentsToSession() {
        if (!currentSession) {
            showToast('Errore', 'Nessuna sessione attiva', 'error');
            return;
        }

        const { ipcRenderer } = require('electron');

        try {
            // Open file dialog
            const result = await ipcRenderer.invoke('add-files-to-session', {
                sessionPath: currentSession.fullPath
            });

            if (result.success && result.files && result.files.length > 0) {
                // Check for duplicates
                if (result.duplicates && result.duplicates.length > 0) {
                    const dupCount = result.duplicates.length;
                    showToast(
                        'File duplicati',
                        `${dupCount} file ${dupCount === 1 ? 'è già presente' : 'sono già presenti'} nella sessione`,
                        'warning'
                    );
                }

                // Check for new files added
                const newCount = result.newFilesCount || 0;
                if (newCount > 0) {
                    // Update current session files
                    currentSession.files = result.files;

                    // Re-render file list
                    openSession(currentSession);

                    showToast(
                        'File aggiunti',
                        `${newCount} ${newCount === 1 ? 'file aggiunto' : 'file aggiunti'} con successo`,
                        'success'
                    );
                }
            } else if (result.canceled) {
                // User canceled - no notification needed
            }
        } catch (error) {
            console.error('Errore durante l\'aggiunta dei file:', error);
            showToast('Errore', 'Impossibile aggiungere i file', 'error');
        }
    }

    function importFlashcards() {
        alert('Funzionalità di importazione in arrivo!');
        // TODO: Implement file picker and JSON import
    }

    return {
        init
    };
})();
