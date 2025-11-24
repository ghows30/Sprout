class ActiveSessionView {
    constructor(controller) {
        this.controller = controller;
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
        this.sessionTitle.textContent = session.name;
        this.sessionNotes.value = ''; // Reset notes
        this.renderFileList(session.files);
    }

    renderFileList(files) {
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
