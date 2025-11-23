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

                // Update nav highlight after toggle
                if (App.updateHighlight) {
                    setTimeout(() => {
                        const activeLink = document.querySelector('.nav-link.active');
                        if (activeLink) App.updateHighlight(activeLink);
                    }, 50);
                }
            });
        }

        // Resize Logic
        if (resizer && sidebar) {
            resizer.addEventListener('mousedown', initResize);

            let animationFrame;

            function initResize(e) {
                e.preventDefault();
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', stopResize);
                resizer.classList.add('resizing');
                sidebar.style.transition = 'none'; // Disable transition during drag
            }

            function onMouseMove(e) {
                if (animationFrame) cancelAnimationFrame(animationFrame);
                animationFrame = requestAnimationFrame(() => resize(e));
            }

            function resize(e) {
                const newWidth = e.clientX;

                // Logic for snapping and limits
                if (newWidth < 100) {
                    // Snap to collapsed
                    if (!sidebar.classList.contains('collapsed')) {
                        sidebar.classList.add('collapsed');
                        sidebar.style.width = ''; // Reset inline width to let CSS take over
                    }
                } else if (newWidth >= 100 && newWidth < 150) {
                    // Dead zone or hysteresis, keep current state or snap?
                    // Let's allow expanding if we are dragging out
                    if (sidebar.classList.contains('collapsed')) {
                        sidebar.classList.remove('collapsed');
                    }
                    sidebar.style.width = `${newWidth}px`;
                } else if (newWidth >= 150 && newWidth < 500) {
                    // Normal resizing
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
                sidebar.style.transition = ''; // Re-enable transition
                if (animationFrame) cancelAnimationFrame(animationFrame);

                // Update nav highlight after resize
                if (App.updateHighlight) {
                    setTimeout(() => {
                        const activeLink = document.querySelector('.nav-link.active');
                        if (activeLink) App.updateHighlight(activeLink);
                    }, 50);
                }
            }
        }
    }

    function setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const views = document.querySelectorAll('.view-section');
        const highlight = document.querySelector('.nav-highlight');

        function updateHighlight(targetLink) {
            if (!targetLink || !highlight) return;

            // Get position relative to the UL
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
            views.forEach(view => view.style.display = 'none');
            const targetView = document.getElementById(viewId);
            if (targetView) {
                targetView.style.display = 'block';
            }

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.dataset.view === viewId) {
                    link.classList.add('active');
                    updateHighlight(link);
                }
            });
        }

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = link.dataset.view;
                if (viewId) showView(viewId);
            });

            // Hover effect
            link.addEventListener('mouseenter', () => {
                updateHighlight(link);
            });
        });

        // Handle mouse leaving the entire nav area
        const navLinksContainer = document.querySelector('.nav-links');
        if (navLinksContainer) {
            navLinksContainer.addEventListener('mouseleave', () => {
                // Return to active link when mouse leaves the nav area
                const activeLink = document.querySelector('.nav-link.active');
                if (activeLink) updateHighlight(activeLink);
            });
        }

        // Initial highlight
        const activeLink = document.querySelector('.nav-link.active');
        if (activeLink) {
            // Small delay to ensure layout is ready
            setTimeout(() => updateHighlight(activeLink), 100);
        }

        // Update highlight on window resize (for sidebar resize)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const currentActive = document.querySelector('.nav-link.active');
                if (currentActive) updateHighlight(currentActive);
            }, 100);
        });

        // Expose showView for internal use if needed, or just rely on event listeners
        App.showView = showView;
        App.updateHighlight = updateHighlight; // Expose for sidebar resize
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
