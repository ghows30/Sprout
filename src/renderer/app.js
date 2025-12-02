const App = (() => {
    let homeController;
    let sessionController;
    let settingsController;
    let navLinks;
    let highlight;

    function init() {
        // Initialize Controllers
        homeController = new HomeController();
        sessionController = new SessionController();
        settingsController = new SettingsController();

        // Apply saved theme
        settingsController.model.applyTheme();

        setupSidebar();
        setupNavigation();

        // Initial render
        showView('home');
    }

    function setupSidebar() {
        const sidebar = document.getElementById('main-sidebar');
        const resizer = document.getElementById('main-resizer');
        const toggleBtn = document.getElementById('main-sidebar-toggle');

        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                setTimeout(() => {
                    const activeLink = document.querySelector('.nav-link.active');
                    if (activeLink) updateHighlight(activeLink);
                }, 50);
            });
        }

        if (resizer && sidebar) {
            resizer.addEventListener('mousedown', initResize);
            let animationFrame;

            function initResize(e) {
                e.preventDefault();
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', stopResize);
                resizer.classList.add('resizing');
                sidebar.style.transition = 'none';
            }

            function onMouseMove(e) {
                if (animationFrame) cancelAnimationFrame(animationFrame);
                animationFrame = requestAnimationFrame(() => resize(e));
            }

            function resize(e) {
                const newWidth = e.clientX;
                if (newWidth < 100) {
                    if (!sidebar.classList.contains('collapsed')) {
                        sidebar.classList.add('collapsed');
                        sidebar.style.width = '';
                    }
                } else if (newWidth >= 100 && newWidth < 150) {
                    if (sidebar.classList.contains('collapsed')) {
                        sidebar.classList.remove('collapsed');
                    }
                    sidebar.style.width = `${newWidth}px`;
                } else if (newWidth >= 150 && newWidth < 500) {
                    if (sidebar.classList.contains('collapsed')) {
                        sidebar.classList.remove('collapsed');
                    }
                    sidebar.style.width = `${newWidth}px`;
                }
            }

            function stopResize() {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', stopResize);
                resizer.classList.remove('resizing');
                sidebar.style.transition = '';
                if (animationFrame) cancelAnimationFrame(animationFrame);
                setTimeout(() => {
                    const activeLink = document.querySelector('.nav-link.active');
                    if (activeLink) updateHighlight(activeLink);
                }, 50);
            }
        }
    }

    function renderView(viewId) {
        const contentContainer = document.getElementById('app-content');
        if (!contentContainer) return;

        contentContainer.innerHTML = ''; // Clear current content

        switch (viewId) {
            case 'home':
                contentContainer.innerHTML = homeController.getTemplate();
                homeController.init();
                break;
            case 'study-spaces':
                contentContainer.innerHTML = sessionController.listView.getTemplate();
                sessionController.listView.init();
                sessionController.loadSessions(); // Reload sessions
                break;
            case 'settings':
                contentContainer.innerHTML = settingsController.getTemplate();
                settingsController.init();
                break;
            case 'active-session':
                contentContainer.innerHTML = sessionController.activeView.getTemplate();

                // Initialize all active session views (activeView, documentView, flashcardView, timerView)
                sessionController.initActiveSessionViews();

                // We need to re-render the current session data
                const currentSession = sessionController.model.getCurrentSession();
                if (currentSession) {
                    sessionController.activeView.render(currentSession);
                    sessionController.flashcardView.render(currentSession.flashcards);
                }
                break;
        }
    }

    function updateHighlight(targetLink) {
        if (!targetLink || !highlight) return;
        const parent = targetLink.closest('.nav-links');
        if (!parent) return;
        const parentRect = parent.getBoundingClientRect();
        const linkRect = targetLink.getBoundingClientRect();
        const top = linkRect.top - parentRect.top;
        const height = linkRect.height;
        highlight.style.top = `${top}px`;
        highlight.style.height = `${height}px`;
        highlight.style.opacity = '1';
    }

    function showView(viewId) {
        // Render the view content
        renderView(viewId);

        // Update navigation state
        if (navLinks) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.dataset.view === viewId) {
                    link.classList.add('active');
                    updateHighlight(link);
                }
            });
        }
    }

    function setupNavigation() {
        navLinks = document.querySelectorAll('.nav-link');
        highlight = document.querySelector('.nav-highlight');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = link.dataset.view;
                if (viewId) showView(viewId);
            });
            link.addEventListener('mouseenter', () => updateHighlight(link));
        });

        const navLinksContainer = document.querySelector('.nav-links');
        if (navLinksContainer) {
            navLinksContainer.addEventListener('mouseleave', () => {
                const activeLink = document.querySelector('.nav-link.active');
                if (activeLink) updateHighlight(activeLink);
            });
        }

        const activeLink = document.querySelector('.nav-link.active');
        if (activeLink) {
            setTimeout(() => updateHighlight(activeLink), 100);
        }

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const currentActive = document.querySelector('.nav-link.active');
                if (currentActive) updateHighlight(currentActive);
            }, 100);
        });

        // Subscribe to session creation to switch view
        if (typeof eventManager !== 'undefined') {
            eventManager.subscribe('SESSION_CREATED', () => {
                showView('study-spaces');
            });
        }
    }

    return {
        init,
        showView
    };
})();

document.addEventListener('DOMContentLoaded', App.init);
