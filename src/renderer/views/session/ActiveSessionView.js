class ActiveSessionView {
    constructor(controller) {
        this.controller = controller;
        this.editor = null;
        this.autoSaveTimeout = null;
        // No immediate DOM caching, wait for render
    }

    getTemplate() {
        return `
        <div id="active-session" class="view-section">
            <div class="session-container">
                <main class="session-main">
                    <header class="session-header">
                        <h2 id="active-session-title">Spazio</h2>

                        <!-- Auto-save status indicator -->
                        <div class="auto-save-status" id="auto-save-status" style="display: none;">
                            <i class="fas fa-check-circle" style="color: var(--success); margin-right: 5px;"></i>
                            <span id="auto-save-text">Salvato</span>
                        </div>

                        <!-- Timer Icon/Display -->
                        <div class="header-timer-widget" id="timer-widget">
                            <button class="timer-icon-btn" id="timer-icon-btn">
                                <i class="fas fa-clock"></i>
                            </button>
                            <span class="timer-countdown" id="timer-countdown" style="display: none;">25:00</span>
                        </div>
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
                                <!-- Quill Editor (con toolbar integrata) -->
                                <div id="rich-text-editor"></div>
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
        this.showSidebar();
    }

    cacheDOM() {
        this.sessionView = document.getElementById('active-session');
        this.sessionTitle = document.getElementById('active-session-title');
        this.editorElement = document.getElementById('rich-text-editor');
        this.autoSaveStatus = document.getElementById('auto-save-status');
        this.autoSaveText = document.getElementById('auto-save-text');

        // Main Sidebar Elements
        this.mainNavLinks = document.getElementById('main-nav-links');
        this.sessionSidebarContent = document.getElementById('session-sidebar-content');
    }

    bindEvents() {
        // Quill gestisce la toolbar automaticamente, non serve bindare eventi
    }

    showSidebar() {
        if (this.mainNavLinks && this.sessionSidebarContent) {
            this.mainNavLinks.style.display = 'none';
            this.sessionSidebarContent.style.display = 'flex';
            this.sessionSidebarContent.style.flexDirection = 'column';
            this.renderSidebar();
        }
    }

    hideSidebar() {
        if (this.mainNavLinks && this.sessionSidebarContent) {
            this.sessionSidebarContent.style.display = 'none';
            this.mainNavLinks.style.display = 'block';
            this.sessionSidebarContent.innerHTML = ''; // Clean up
        }
    }

    renderSidebar() {
        if (!this.sessionSidebarContent) return;

        this.sessionSidebarContent.innerHTML = `
            <div class="sidebar-back-btn-container">
                <button id="back-to-home-btn" class="btn btn-secondary sidebar-back-btn">
                    <i class="fas fa-arrow-left"></i> Torna alla Home
                </button>
            </div>

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
                    <button class="btn btn-primary btn-sm create-flashcard-btn" id="create-flashcard-btn">
                        <i class="fas fa-plus"></i> Crea
                    </button>
                    <button class="btn btn-secondary btn-sm import-flashcard-btn" id="import-flashcard-btn">
                        <i class="fas fa-file-import"></i> Importa
                    </button>
                </div>
                <ul id="flashcard-list" class="flashcard-list">
                    <!-- Flashcards will be injected here -->
                </ul>
            </div>
        `;

        // Cache new elements
        this.sessionFileList = document.getElementById('session-file-list');
        this.addDocumentBtn = document.getElementById('add-document-btn');

        // Bind events for new elements
        const backBtn = document.getElementById('back-to-home-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (typeof App !== 'undefined' && App.showView) {
                    App.showView('home');
                }
            });
        }

        if (this.addDocumentBtn) {
            this.addDocumentBtn.addEventListener('click', () => this.controller.addDocuments());
        }

        // Re-render lists if data is available
        const currentSession = this.controller.model.getCurrentSession();
        if (currentSession) {
            this.renderFileList(currentSession.files);
            // Flashcards are rendered by FlashcardView, but we need to make sure the container exists
        }
    }

    handleAutoSave() {
        // Cancella il timer precedente
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        // Imposta un nuovo timer di 2 secondi
        this.autoSaveTimeout = setTimeout(async () => {
            if (!this.editor) return;

            const content = this.editor.getJSON();
            const result = await this.controller.autoSaveNote(content);

            if (result.success && this.autoSaveStatus && this.autoSaveText) {
                this.autoSaveStatus.style.display = 'flex';
                this.autoSaveText.textContent = `Salvato alle ${result.timestamp}`;
            }
        }, 2000);
    }

    async render(session) {
        // Assicurati che il DOM sia caricato
        if (!this.sessionTitle) this.cacheDOM();

        if (!this.sessionTitle) return;

        this.sessionTitle.textContent = session.name;

        // Inizializza l'editor
        this.initEditor();

        // Carica gli appunti esistenti
        const notesResult = await this.controller.loadNotes();
        if (notesResult.success && this.editor) {
            this.editor.setContent(notesResult.content);

            // Mostra un toast se è stata effettuata una migrazione
            if (notesResult.migrated && typeof toastManager !== 'undefined') {
                toastManager.show('Migrazione completata', 'I tuoi appunti sono stati convertiti al nuovo formato!', 'success');
            }
        }

        this.renderFileList(session.files);

        // Renderizza i mazzi se presenti
        if (this.controller.flashcardView) {
            this.controller.flashcardView.render(session.decks);
        }
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

    /**
     * Inizializza l'editor di testo ricco
     */
    initEditor() {
        if (!this.editorElement) return;

        // Distruggi l'editor esistente se presente
        if (this.editor) {
            this.editor.destroy();
        }

        // Crea una nuova istanza dell'editor
        this.editor = new RichTextEditor();
        this.editor.init(
            this.editorElement,
            (content) => this.handleAutoSave(),
            null
        );
    }

    /**
     * Distrugge l'editor quando si esce dalla sessione
     */
    destroyEditor() {
        if (this.editor) {
            this.editor.destroy();
            this.editor = null;
        }
    }
}
