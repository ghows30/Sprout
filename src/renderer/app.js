const App = (() => {
    function init() {


        // Initialize Modules
        if (typeof HomeModule !== 'undefined') HomeModule.init();
        if (typeof StudySessionsModule !== 'undefined') StudySessionsModule.init();

        setupNavigation();
        setupObservers();
        setupSidebar();
    }

    function setupSidebar() {
        const sidebar = document.getElementById('main-sidebar');
        const resizer = document.getElementById('main-resizer');
        const toggleBtn = document.getElementById('main-sidebar-toggle');

        // Toggle Logic
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }

        // Resize Logic
        if (resizer && sidebar) {
            resizer.addEventListener('mousedown', initResize);

            function initResize(e) {
                e.preventDefault();
                window.addEventListener('mousemove', resize);
                window.addEventListener('mouseup', stopResize);
                resizer.classList.add('resizing');
                sidebar.style.transition = 'none'; // Disable transition during drag
            }

            function resize(e) {
                const newWidth = e.clientX;
                if (newWidth > 150 && newWidth < 400) {
                    sidebar.style.width = `${newWidth}px`;
                    if (sidebar.classList.contains('collapsed')) {
                        sidebar.classList.remove('collapsed');
                    }
                } else if (newWidth <= 100) {
                    // Optional: snap to collapsed if dragged too small
                    // sidebar.classList.add('collapsed');
                }
            }

            function stopResize() {
                window.removeEventListener('mousemove', resize);
                window.removeEventListener('mouseup', stopResize);
                resizer.classList.remove('resizing');
                sidebar.style.transition = ''; // Re-enable transition
            }
        }
    }

    function setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const views = document.querySelectorAll('.view-section');

        function showView(viewId) {
            views.forEach(view => view.style.display = 'none');
            const targetView = document.getElementById(viewId);
            if (targetView) {
                targetView.style.display = 'block';
            }

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.dataset.view === viewId) {
                    link.classList.add('active');
                }
            });
        }

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = link.dataset.view;
                if (viewId) showView(viewId);
            });
        });

        // Expose showView for internal use if needed, or just rely on event listeners
        App.showView = showView;
    }

    function setupObservers() {
        if (typeof EventManager !== 'undefined') {
            EventManager.subscribe('SESSION_CREATED', (session) => {
                console.log('Observer: New session created, switching to Study Spaces...');
                if (App.showView) {
                    App.showView('study-spaces');
                }
            });
        }
    }

    return {
        init
    };
})();

document.addEventListener('DOMContentLoaded', App.init);
