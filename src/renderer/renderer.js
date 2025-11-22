document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view-section');

    function showView(viewId) {
        // Hide all views
        views.forEach(view => view.style.display = 'none');
        // Show target view
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.style.display = 'block';
        }

        // Update nav active state
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === viewId) {
                link.classList.add('active');
            }
        });
    }

    // Handle Nav Clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = link.dataset.view;
            if (viewId) showView(viewId);
        });
    });

    // Modal Handling
    const modal = document.getElementById('new-session-modal');
    const newSessionBtn = document.getElementById('new-session-btn');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const createBtn = document.getElementById('create-session-btn');
    const sessionNameInput = document.getElementById('session-name');
    const dropZone = document.getElementById('drop-zone');
    const fileList = document.getElementById('file-list');

    let uploadedFiles = [];

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

    if (newSessionBtn) newSessionBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('highlight');
    }

    function unhighlight(e) {
        dropZone.classList.remove('highlight');
    }

    dropZone.addEventListener('drop', handleDrop, false);

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

        // Add remove listeners
        document.querySelectorAll('.remove-file').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                uploadedFiles.splice(index, 1);
                renderFileList();
            });
        });
    }

    // Create Session
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            const name = sessionNameInput.value.trim();
            if (!name) {
                alert('Inserisci un nome per la sessione');
                return;
            }

            const session = {
                id: Date.now(),
                name: name,
                files: uploadedFiles.map(f => f.name), // In a real app we'd store paths or copy files
                createdAt: new Date().toISOString()
            };

            saveSession(session);
            closeModal();
            renderSessions();
            showView('study-spaces'); // Redirect to Study Spaces
        });
    }

    function saveSession(session) {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        sessions.push(session);
        localStorage.setItem('sessions', JSON.stringify(sessions));
    }

    function renderSessions() {
        const container = document.getElementById('sessions-grid');
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');

        container.innerHTML = '';

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
            folder.addEventListener('click', (e) => {
                // Toggle open state
                const folderEl = folder.querySelector('.folder');
                folderEl.classList.toggle('open');

                // Optional: Close other folders
                document.querySelectorAll('.folder').forEach(f => {
                    if (f !== folderEl) f.classList.remove('open');
                });
            });
            container.appendChild(folder);
        });
    }

    // Initial Render
    renderSessions();
});
