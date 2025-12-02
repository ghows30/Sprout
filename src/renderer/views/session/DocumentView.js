class DocumentView {
    constructor() {
        // Initialization handled via init() method
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
    }

    cacheDOM() {
        this.documentViewer = document.getElementById('document-viewer');
        this.viewerContent = document.getElementById('viewer-content');
        this.viewerFilename = document.getElementById('viewer-filename');
        this.closeViewerBtn = document.getElementById('close-viewer-btn');
        this.documentIframe = document.getElementById('document-iframe');
        this.documentImage = document.getElementById('document-image');
        this.splitResizer = document.getElementById('split-resizer');
    }

    bindEvents() {
        if (this.closeViewerBtn) this.closeViewerBtn.addEventListener('click', () => this.closeDocument());
        this.initSplitResizer();
    }

    openDocument(fullPath, fileName) {
        const ext = fileName.split('.').pop().toLowerCase();

        this.documentViewer.style.display = 'flex';
        if (this.splitResizer) this.splitResizer.style.display = 'flex';
        this.viewerFilename.textContent = fileName;

        this.documentIframe.style.display = 'none';
        this.documentImage.style.display = 'none';

        if (ext === 'pdf') {
            this.documentIframe.src = fullPath;
            this.documentIframe.style.display = 'block';
        } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
            this.documentImage.src = fullPath;
            this.documentImage.style.display = 'block';
        } else {
            const { shell } = require('electron');
            shell.openPath(fullPath.replace('file://', ''));
        }
    }

    closeDocument() {
        this.documentViewer.style.display = 'none';
        if (this.splitResizer) this.splitResizer.style.display = 'none';
        this.viewerFilename.textContent = 'Nessun documento aperto';
        this.documentIframe.src = '';
        this.documentImage.src = '';
    }

    initSplitResizer() {
        if (!this.splitResizer) return;

        let isResizing = false;
        const notesEditor = document.querySelector('.notes-editor');

        this.splitResizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            this.splitResizer.classList.add('resizing');
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const container = document.querySelector('.split-view-container');
            const containerRect = container.getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;

            if (newWidth > 200 && newWidth < containerRect.width - 200) {
                notesEditor.style.flex = `0 0 ${newWidth}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                this.splitResizer.classList.remove('resizing');
            }
        });
    }
}
