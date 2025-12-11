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

                        <div class="auto-save-status" id="auto-save-status" style="display: none;">
                            <i class="fas fa-check-circle" style="color: var(--success); margin-right: 5px;"></i>
                            <span id="auto-save-text">Salvato</span>
                        </div>

                        <div class="header-timer-widget" id="timer-widget">
                            <button class="timer-icon-btn" id="timer-icon-btn">
                                <i class="fas fa-clock"></i>
                            </button>
                            <span class="timer-countdown" id="timer-countdown" style="display: none;">25:00</span>
                        </div>
                    </header>

                    <div class="split-view-container">
                        <div class="notes-editor">
                            <div class="notes-header">
                                <i class="fas fa-pen-fancy" style="margin-right: 10px; color: var(--primary-light);"></i>
                                Appunti
                            </div>
                            <div class="editor-container">
                                <div id="rich-text-editor"></div>
                            </div>
                        </div>

                        <div class="split-resizer" id="split-resizer"></div>

                        <div class="document-viewer" id="document-viewer" style="display: none;">
                            <div class="document-tabs-container">
                                <div class="document-tabs-list" id="document-tabs-list">
                                    <!-- Tabs will be injected here -->
                                </div>
                                <button id="close-all-tabs-btn" class="btn-icon close-all-tabs" title="Chiudi tutto">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="viewer-content-container" id="viewer-content-container">
                                <div class="viewer-placeholder" id="viewer-placeholder">
                                    <i class="fas fa-file-alt"></i>
                                    <p>Seleziona un documento per visualizzarlo</p>
                                </div>
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
            this.sessionSidebarContent.innerHTML = '';
        }
    }

    renderSidebar() {
        if (!this.sessionSidebarContent) return;

        this.sessionSidebarContent.innerHTML = `
            <div class="sidebar-back-btn-container">
                <button id="back-to-home-btn" class="btn btn-secondary sidebar-back-btn">
                    <i class="fas fa-arrow-left"></i> <span>Torna alla Home</span>
                </button>
            </div>

            <div class="sidebar-section">
                <div class="section-title-row">
                    <h3 class="section-title">
                        <i class="fas fa-folder-open"></i> <span>Documenti</span>
                    </h3>
                    <button class="add-document-btn" id="add-document-btn" title="Aggiungi documenti">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <ul id="session-file-list" class="session-file-list">
                </ul>
            </div>

            <!-- Flashcards Section -->
            <div class="sidebar-section">
                <h3 class="section-title">
                    <i class="fas fa-layer-group"></i> <span>Flashcard</span>
                </h3>
                <div class="flashcard-actions">
                    <button class="btn btn-primary btn-sm create-flashcard-btn" id="create-flashcard-btn">
                        <i class="fas fa-plus"></i> <span>Crea</span>
                    </button>
                    <button class="btn btn-secondary btn-sm import-flashcard-btn" id="import-flashcard-btn">
                        <i class="fas fa-file-import"></i> <span>Importa</span>
                    </button>
                </div>
                <ul id="flashcard-list" class="flashcard-list">
                </ul>
            </div>
        `;

        this.sessionFileList = document.getElementById('session-file-list');
        this.addDocumentBtn = document.getElementById('add-document-btn');

        const backBtn = document.getElementById('back-to-home-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.controller.isTimerRunning()) {
                    this.showExitConfirmation();
                } else {
                    if (typeof App !== 'undefined' && App.showView) {
                        App.showView('home');
                    }
                }
            });
        }

        if (this.addDocumentBtn) {
            this.addDocumentBtn.addEventListener('click', () => this.controller.addDocuments());
        }

        // Add click-to-expand logic for section titles
        const sectionTitles = this.sessionSidebarContent.querySelectorAll('.section-title');
        sectionTitles.forEach(title => {
            title.addEventListener('click', () => {
                const sidebar = document.getElementById('main-sidebar');
                if (sidebar && sidebar.classList.contains('collapsed')) {
                    sidebar.classList.remove('collapsed');
                    // Trigger resize event to update layout if needed
                    window.dispatchEvent(new Event('resize'));
                }
            });
        });

        // Re-render lists if data is available
        const currentSession = this.controller.model.getCurrentSession();
        if (currentSession) {
            this.renderFileList(currentSession.files);
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
        if (!this.sessionTitle) this.cacheDOM();

        if (!this.sessionTitle) return;

        this.sessionTitle.textContent = session.name;

        this.initEditor();

        // Re-initialize document view to bind events to new DOM
        if (this.controller.documentView) {
            this.controller.documentView.init();
        }

        const notesResult = await this.controller.loadNotes();
        if (notesResult.success && this.editor) {
            this.editor.setContent(notesResult.content);

            if (notesResult.migrated && typeof toastManager !== 'undefined') {
                toastManager.show('Migrazione completata', 'I tuoi appunti sono stati convertiti al nuovo formato!', 'success');
            }
        }

        this.renderFileList(session.files);

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

            // Context Menu per eliminazione
            li.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showFileContextMenu(e.clientX, e.clientY, file, fileName);
            });

            categoryContainer.appendChild(li);
        });

        categoryHeader.addEventListener('click', () => {
            categoryContainer.classList.toggle('collapsed');
            categoryHeader.querySelector('.category-chevron').classList.toggle('collapsed');
        });

        this.sessionFileList.appendChild(categoryHeader);
        this.sessionFileList.appendChild(categoryContainer);
    }

    showFileContextMenu(x, y, file, fileName) {
        this.hideFileContextMenu();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'file-context-menu';
        menu.innerHTML = `
            <div class="context-menu-item danger" data-action="delete">
                <i class="fas fa-trash"></i>
                <span>Elimina</span>
            </div>
        `;

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        document.body.appendChild(menu);

        menu.querySelector('.context-menu-item').addEventListener('click', () => {
            this.handleDeleteFile(file, fileName);
            this.hideFileContextMenu();
        });

        setTimeout(() => {
            document.addEventListener('click', this.hideFileContextMenu.bind(this), { once: true });
        }, 0);
    }

    hideFileContextMenu() {
        const menu = document.getElementById('file-context-menu');
        if (menu) menu.remove();
    }

    handleDeleteFile(file, fileName) {
        const modal = document.createElement('div');
        modal.id = 'delete-file-confirm-modal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2 style="color: #e74c3c;">⚠️ Conferma Eliminazione</h2>
                <p style="margin: 20px 0; line-height: 1.6;">
                    Sei sicuro di voler eliminare il file <strong>"${fileName}"</strong>?
                </p>
                <p style="margin: 20px 0; padding: 12px; background-color: rgba(231, 76, 60, 0.1); border-left: 4px solid #e74c3c; border-radius: 4px; line-height: 1.6;">
                    <strong>⚠️ Attenzione:</strong> Questa azione è <strong>permanente</strong>.
                </p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="delete-file-cancel-btn">Annulla</button>
                    <button class="btn" id="delete-file-confirm-btn" style="background-color: #e74c3c; color: white;">Elimina</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();

        modal.querySelector('.close-modal').addEventListener('click', closeModal);
        document.getElementById('delete-file-cancel-btn').addEventListener('click', closeModal);

        document.getElementById('delete-file-confirm-btn').addEventListener('click', async () => {
            await this.controller.deleteFile(file);
            closeModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    /**
     * Inizializza l'editor di testo ricco
     */
    initEditor() {
        if (!this.editorElement) return;

        if (this.editor) {
            this.editor.destroy();
        }

        this.editor = new RichTextEditor();
        this.editor.init(
            this.editorElement,
            (content) => this.handleAutoSave(),
            null
        );
    }

    destroyEditor() {
        if (this.editor) {
            this.editor.destroy();
            this.editor = null;
        }
    }

    showExitConfirmation() {
        const modal = document.createElement('div');
        modal.id = 'exit-confirm-modal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2 style="color: #e74c3c;">⚠️ Timer Attivo</h2>
                <p style="margin: 20px 0; line-height: 1.6;">
                    La modalità focus è attiva. Se esci ora, il timer verrà <strong>resettato</strong> e perderai i progressi della sessione corrente.
                </p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="exit-cancel-btn">Rimani</button>
                    <button class="btn" id="exit-confirm-btn" style="background-color: #e74c3c; color: white;">Esci comunque</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();

        modal.querySelector('.close-modal').addEventListener('click', closeModal);
        document.getElementById('exit-cancel-btn').addEventListener('click', closeModal);

        document.getElementById('exit-confirm-btn').addEventListener('click', () => {
            this.controller.stopTimer();
            closeModal();
            if (typeof App !== 'undefined' && App.showView) {
                App.showView('home');
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
}
