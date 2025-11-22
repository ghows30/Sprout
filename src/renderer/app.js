const App = (() => {
    function init() {


        // Initialize Modules
        if (typeof HomeModule !== 'undefined') HomeModule.init();
        if (typeof StudySessionsModule !== 'undefined') StudySessionsModule.init();

        setupNavigation();
        setupObservers();
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
