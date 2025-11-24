class ActiveSessionView {
    constructor(controller) {
        this.controller = controller;
        // No immediate DOM caching, wait for render
    }

    getTemplate() {
        return `
        <div id="active-session" class="view-section">
            <div class="session-container">
                <aside class="session-sidebar" id="session-sidebar">
                    <!-- Documents Section -->
                    <div class="sidebar-section">
                        <div class="section-title-row">
                            <h3 class="section-title">
                                <i class="fas fa-folder-open"></i> Documenti
                            </h3>
                            <button class="add-document-btn" id="add-document-btn" title="Aggiungi documenti">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <ul id="session-file-list" class="session-file-list">
                            <!-- Files will be injected here -->
                        </ul>
                    </div>

                    <!-- Flashcards Section -->
                    <div class="sidebar-section">
                        <h3 class="section-title">
                            <i class="fas fa-layer-group"></i> Flashcard
                        </h3>
                        <div class="flashcard-actions">
                            <button class="btn btn-primary btn-sm" id="create-flashcard-btn">
                                <i class="fas fa-plus"></i> Crea
                            </button>
                            <button class="btn btn-secondary btn-sm" id="import-flashcard-btn">
                                <i class="fas fa-file-import"></i> Importa
                            </button>
                        </div>
                        <ul id="flashcard-list" class="flashcard-list">
                            <!-- Flashcards will be injected here -->
                        </ul>
                    </div>
                </aside>
                <div class="resizer-container">
                    <button id="toggle-sidebar-btn" class="sidebar-toggle-btn" title="Toggle Sidebar">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="resizer" id="session-resizer"></div>
                </div>
                <main class="session-main">
                    <header class="session-header">
                        <h2 id="active-session-title">Sessione</h2>

                        <!-- Timer Icon/Display -->
                        <div class="header-timer-widget" id="timer-widget">
                            <button class="timer-icon-btn" id="timer-icon-btn">
                                <i class="fas fa-clock"></i>
                            </button>
                            <span class="timer-countdown" id="timer-countdown" style="display: none;">25:00</span>
                        </div>

                        <button id="save-note-btn" class="btn btn-primary">
                            <i class="fas fa-save"></i> Salva Appunti
                        </button>
                    </header>

                    <!-- Split View Container -->
                    <div class="split-view-container">
                        <!-- Notes Editor (Left) -->
                        <div class="notes-editor">
                            <div class="notes-header">
                                <i class="fas fa-pen-fancy" style="margin-right: 10px; color: var(--primary-light);"></i>
                                Appunti
                            </div>
                            <div class="editor-container">
                                <textarea id="session-notes" placeholder="Scrivi qui i tuoi appunti..."></textarea>
                            </div>
                        </div>

                        <!-- Resizer -->
                        <div class="split-resizer" id="split-resizer"></div>

                        <!-- Document Viewer (Right) -->
                        <div class="document-viewer" id="document-viewer" style="display: none;">
                            <div class="viewer-content" id="viewer-content">
                                <div class="viewer-header">
                                    <span id="viewer-filename">Nessun documento aperto</span>
                                    <button id="close-viewer-btn" class="btn-icon">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <iframe id="document-iframe" style="display: none;"></iframe>
                                <img id="document-image" style="display: none;" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
        `;
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
    }

    cacheDOM() {
        this.sessionView = document.getElementById('active-session');
        this.sessionTitle = document.getElementById('active-session-title');
        this.sessionFileList = document.getElementById('session-file-list');
        this.sessionNotes = document.getElementById('session-notes');
        this.saveNoteBtn = document.getElementById('save-note-btn');
        this.sessionSidebar = document.getElementById('session-sidebar');
        this.sessionResizer = document.getElementById('session-resizer');
        this.toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
        this.addDocumentBtn = document.getElementById('add-document-btn');
    }

    bindEvents() {
        if (this.saveNoteBtn) {
            this.saveNoteBtn.addEventListener('click', () => this.handleSaveNote());
        }

        if (this.sessionResizer) {
            this.sessionResizer.addEventListener('mousedown', (e) => this.initResize(e));
        }

        if (this.toggleSidebarBtn) {
            this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        }

        if (this.addDocumentBtn) {
            this.addDocumentBtn.addEventListener('click', () => this.controller.addDocuments());
        }
    }

    initResize(e) {
        e.preventDefault();
        const resize = (e) => {
            if (!this.sessionSidebar) return;
            const newWidth = e.clientX - this.sessionSidebar.getBoundingClientRect().left;
            if (newWidth > 150 && newWidth < 600) {
                this.sessionSidebar.style.width = `${newWidth}px`;
            }
        };
        const stopResize = () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResize);
            this.sessionResizer.classList.remove('resizing');
        };
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResize);
        this.sessionResizer.classList.add('resizing');
    }

    toggleSidebar() {
        if (this.sessionSidebar) {
            this.sessionSidebar.classList.toggle('collapsed');
        }
    }

    async handleSaveNote() {
        const content = this.sessionNotes.value;
        if (!content.trim()) {
            alert('La nota è vuota.');
            return;
        }
        const fileName = prompt('Inserisci il nome del file (es. appunti.txt):', 'appunti.txt');
        if (!fileName) return;

        await this.controller.saveNote(content, fileName);
    }

    render(session) {
        // Ensure DOM is cached
        if (!this.sessionTitle) this.cacheDOM();

        if (!this.sessionTitle) return;

        this.sessionTitle.textContent = session.name;
        this.sessionNotes.value = ''; // Reset notes
        this.renderFileList(session.files);
    }

    renderFileList(files) {
        if (!this.sessionFileList) return;
        this.sessionFileList.innerHTML = '';
        if (files && files.length > 0) {
            const categories = this.categorizeFiles(files);

            Object.values(categories).forEach(category => {
                if (category.files.length > 0) {
                    this.renderCategory(category);
                }
            });
        } else {
            this.sessionFileList.innerHTML = '<li class="session-file-item" style="cursor: default;">Nessun file</li>';
        }
    }

    categorizeFiles(files) {
        const categories = {
            pdf: { name: 'PDF', files: [], icon: 'fas fa-file-pdf', color: 'file-icon-pdf' },
            document: { name: 'Documenti', files: [], icon: 'fas fa-file-word', color: 'file-icon-doc' },
            image: { name: 'Immagini', files: [], icon: 'fas fa-file-image', color: 'file-icon-image' },
            spreadsheet: { name: 'Fogli di calcolo', files: [], icon: 'fas fa-file-excel', color: 'file-icon-excel' },
            presentation: { name: 'Presentazioni', files: [], icon: 'fas fa-file-powerpoint', color: 'file-icon-ppt' },
            text: { name: 'Testo', files: [], icon: 'fas fa-file-alt', color: 'file-icon-text' },
            other: { name: 'Altri', files: [], icon: 'fas fa-file', color: 'file-icon-default' }
        };

        files.forEach(file => {
            const fileName = typeof file === 'string' ? file.split('/').pop().split('\\').pop() : file.name;
            const ext = fileName.split('.').pop().toLowerCase();

            if (ext === 'pdf') categories.pdf.files.push({ file, fileName, ext });
            else if (['doc', 'docx'].includes(ext)) categories.document.files.push({ file, fileName, ext });
            else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) categories.image.files.push({ file, fileName, ext });
            else if (['xls', 'xlsx'].includes(ext)) categories.spreadsheet.files.push({ file, fileName, ext });
            else if (['ppt', 'pptx'].includes(ext)) categories.presentation.files.push({ file, fileName, ext });
            else if (['txt', 'md'].includes(ext)) categories.text.files.push({ file, fileName, ext });
            else categories.other.files.push({ file, fileName, ext });
        });

        return categories;
    }

    renderCategory(category) {
        const categoryHeader = document.createElement('li');
        categoryHeader.className = 'file-category-header';
        categoryHeader.innerHTML = `
            <i class="fas fa-chevron-down category-chevron collapsed"></i>
            <i class="${category.icon} ${category.color}"></i>
            <span>${category.name}</span>
            <span class="file-count">(${category.files.length})</span>
        `;

        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'category-files-container collapsed';

        category.files.forEach(({ file, fileName }) => {
            const li = document.createElement('li');
            li.className = 'session-file-item';
            li.innerHTML = `
                <i class="${category.icon} ${category.color}"></i>
                <span>${fileName}</span>
            `;
            li.addEventListener('click', () => this.controller.openDocument(file, fileName));
            categoryContainer.appendChild(li);
        });

        categoryHeader.addEventListener('click', () => {
            categoryContainer.classList.toggle('collapsed');
            categoryHeader.querySelector('.category-chevron').classList.toggle('collapsed');
        });

        this.sessionFileList.appendChild(categoryHeader);
        this.sessionFileList.appendChild(categoryContainer);
    }
}
