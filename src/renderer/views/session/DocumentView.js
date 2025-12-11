class DocumentView {
    constructor(onTabsChange) {
        this.tabs = [];
        this.activeTabId = null;
        this.onTabsChange = onTabsChange;
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        // Re-render tabs if they exist (persistence)
        if (this.tabs.length > 0) {
            this.renderTabs();
            if (this.activeTabId) {
                this.setActiveTab(this.activeTabId);
            }
        }
    }

    getTabsState() {
        return {
            tabs: this.tabs.map(t => ({
                id: t.id,
                path: t.path,
                name: t.name,
                ext: t.ext
            })),
            activeTabId: this.activeTabId
        };
    }

    restoreTabs(state) {
        if (!state || !state.tabs) return;

        this.tabs = state.tabs.map(t => ({
            ...t,
            contentElement: this.createContentElement(t.path, t.ext)
        }));
        this.activeTabId = state.activeTabId;

        if (this.documentViewer) {
            this.renderTabs();
            if (this.activeTabId) {
                this.setActiveTab(this.activeTabId);
            }
        }
    }

    notifyChange() {
        if (this.onTabsChange) {
            this.onTabsChange(this.getTabsState());
        }
    }

    cacheDOM() {
        this.documentViewer = document.getElementById('document-viewer');
        this.tabsList = document.getElementById('document-tabs-list');
        this.viewerContentContainer = document.getElementById('viewer-content-container');
        this.viewerPlaceholder = document.getElementById('viewer-placeholder');
        this.closeAllBtn = document.getElementById('close-all-tabs-btn');
        this.splitResizer = document.getElementById('split-resizer');
    }

    bindEvents() {
        if (this.closeAllBtn) {
            this.closeAllBtn.addEventListener('click', () => this.closeAllTabs());
        }
        this.initSplitResizer();
    }

    openDocument(fullPath, fileName) {
        // Check if already open
        const existingTab = this.tabs.find(t => t.path === fullPath);
        if (existingTab) {
            this.setActiveTab(existingTab.id);
            return;
        }

        const tabId = 'tab-' + Date.now();
        const ext = fileName.split('.').pop().toLowerCase();

        const tab = {
            id: tabId,
            path: fullPath,
            name: fileName,
            ext: ext,
            contentElement: this.createContentElement(fullPath, ext)
        };

        this.tabs.push(tab);
        this.renderTabs();
        this.setActiveTab(tabId);
        this.notifyChange();
    }

    createContentElement(fullPath, ext) {
        let element;

        if (ext === 'pdf') {
            element = document.createElement('iframe');
            element.src = fullPath;
            element.className = 'document-content';
        } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
            element = document.createElement('img');
            element.src = fullPath;
            element.className = 'document-content';
        } else {
            // For external files, we don't create a viewer element
            // We just open it externally and don't add a tab? 
            // Or maybe add a placeholder tab?
            // Current logic opens externally. Let's keep it consistent.
            const { shell } = require('electron');
            shell.openPath(fullPath.replace('file://', ''));
            return null;
        }

        return element;
    }

    setActiveTab(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab || !tab.contentElement) return;

        this.activeTabId = tabId;
        this.documentViewer.style.display = 'flex';
        if (this.splitResizer) this.splitResizer.style.display = 'flex';

        // Update Tabs UI
        const tabElements = this.tabsList.querySelectorAll('.doc-tab');
        tabElements.forEach(el => {
            if (el.dataset.id === tabId) el.classList.add('active');
            else el.classList.remove('active');
        });

        // Update Content
        this.viewerContentContainer.innerHTML = '';
        this.viewerContentContainer.appendChild(tab.contentElement);

        // Hide placeholder
        if (this.viewerPlaceholder) this.viewerPlaceholder.style.display = 'none';

        this.notifyChange();
    }

    closeTab(tabId, event) {
        if (event) event.stopPropagation();

        const tabIndex = this.tabs.findIndex(t => t.id === tabId);
        if (tabIndex === -1) return;

        const wasActive = this.activeTabId === tabId;

        // Remove from array
        this.tabs.splice(tabIndex, 1);

        // Update UI
        this.renderTabs();

        if (this.tabs.length === 0) {
            this.closeAllTabs();
        } else if (wasActive) {
            // Switch to the previous tab or the first one
            const newActiveIndex = Math.max(0, tabIndex - 1);
            this.setActiveTab(this.tabs[newActiveIndex].id);
        }
        this.notifyChange();
    }

    closeAllTabs() {
        this.tabs = [];
        this.activeTabId = null;
        this.documentViewer.style.display = 'none';
        if (this.splitResizer) this.splitResizer.style.display = 'none';
        this.tabsList.innerHTML = '';
        this.viewerContentContainer.innerHTML = '';
        if (this.viewerPlaceholder) {
            this.viewerContentContainer.appendChild(this.viewerPlaceholder);
            this.viewerPlaceholder.style.display = 'flex';
        }
        this.notifyChange();
    }

    renderTabs() {
        this.tabsList.innerHTML = '';

        this.tabs.forEach(tab => {
            if (!tab.contentElement) return; // Skip external files

            const tabEl = document.createElement('div');
            tabEl.className = `doc-tab ${tab.id === this.activeTabId ? 'active' : ''}`;
            tabEl.dataset.id = tab.id;
            tabEl.title = tab.name;

            let iconClass = 'fas fa-file';
            if (tab.ext === 'pdf') iconClass = 'fas fa-file-pdf';
            else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(tab.ext)) iconClass = 'fas fa-file-image';

            tabEl.innerHTML = `
                <i class="${iconClass}"></i>
                <span class="doc-tab-name">${tab.name}</span>
                <span class="doc-tab-close"><i class="fas fa-times"></i></span>
            `;

            tabEl.addEventListener('click', () => this.setActiveTab(tab.id));

            const closeBtn = tabEl.querySelector('.doc-tab-close');
            closeBtn.addEventListener('click', (e) => this.closeTab(tab.id, e));

            this.tabsList.appendChild(tabEl);
        });
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
