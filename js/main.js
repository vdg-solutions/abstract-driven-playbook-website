// Main JavaScript for Abstract Driven Development website

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu functionality
    const mobileMenuButton = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenuButton && navMenu) {
        mobileMenuButton.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            mobileMenuButton.classList.toggle('active');
            const isActive = navMenu.classList.contains('active');
            mobileMenuButton.setAttribute('aria-expanded', isActive);
        });
    }

    // Tab functionality for code examples
    function initializeTabs() {
        const tabContainers = document.querySelectorAll('.example-tabs, .code-tabs');

        tabContainers.forEach(container => {
            const tabs = container.querySelectorAll('.example-tab, .code-tab');
            const panels = container.parentElement.querySelectorAll('.example-panel, .code-panel');

            tabs.forEach((tab, index) => {
                tab.addEventListener('click', function() {
                    // Remove active class from all tabs and panels
                    tabs.forEach(t => t.classList.remove('active'));
                    panels.forEach(p => p.classList.remove('active'));

                    // Add active class to clicked tab and corresponding panel
                    tab.classList.add('active');
                    if (panels[index]) {
                        panels[index].classList.add('active');
                    }
                });
            });
        });
    }

    // Initialize tabs
    initializeTabs();

    // Copy to clipboard functionality for code blocks
    function initializeCopyButtons() {
        const copyButtons = document.querySelectorAll('.copy-button');

        copyButtons.forEach(button => {
            button.addEventListener('click', async function() {
                const codeBlock = this.parentElement.querySelector('pre code');
                if (!codeBlock) return;

                try {
                    await navigator.clipboard.writeText(codeBlock.textContent);

                    // Show feedback
                    const originalText = this.textContent;
                    this.textContent = 'Copied!';
                    this.classList.add('copied');

                    setTimeout(() => {
                        this.textContent = originalText;
                        this.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy code:', err);
                }
            });
        });
    }

    // Initialize copy buttons
    initializeCopyButtons();

    // Smooth scrolling for anchor links
    function initializeSmoothScrolling() {
        const links = document.querySelectorAll('a[href^="#"]');

        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();

                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    const headerOffset = 80; // Account for fixed header
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Initialize smooth scrolling
    initializeSmoothScrolling();

    // Add intersection observer for fade-in animations
    function initializeFadeInAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements that should fade in
        const elementsToAnimate = document.querySelectorAll(
            '.principle-card, .pattern-item, .example-card, .path-card'
        );

        elementsToAnimate.forEach(element => {
            observer.observe(element);
        });
    }

    // Initialize fade-in animations
    initializeFadeInAnimations();

    // Add header scroll effect
    function initializeHeaderScrollEffect() {
        const header = document.querySelector('.header');
        let lastScrollTop = 0;

        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollTop > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        });
    }

    // Initialize header scroll effect
    initializeHeaderScrollEffect();

    // Add loading state management
    function hideLoadingStates() {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(element => {
            element.style.display = 'none';
        });
    }

    // Hide loading states after page load
    hideLoadingStates();

    // Add keyboard navigation support
    function initializeKeyboardNavigation() {
        document.addEventListener('keydown', function(e) {
            // ESC key closes mobile menu
            if (e.key === 'Escape' && navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileMenuButton.classList.remove('active');
                if (mobileMenuButton) {
                    mobileMenuButton.setAttribute('aria-expanded', 'false');
                    mobileMenuButton.focus();
                }
            }
        });
    }

    // Initialize keyboard navigation
    initializeKeyboardNavigation();

    // Documentation page specific functionality
    function initializeDocumentationFeatures() {
        // Sidebar navigation active state management
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        const sections = document.querySelectorAll('.docs-section');

        if (sidebarLinks.length > 0 && sections.length > 0) {
            // Update active link based on scroll position
            const updateActiveLink = throttle(() => {
                let currentSection = '';

                sections.forEach(section => {
                    const rect = section.getBoundingClientRect();
                    if (rect.top <= 100 && rect.bottom >= 100) {
                        currentSection = section.id;
                    }
                });

                sidebarLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentSection}`) {
                        link.classList.add('active');
                    }
                });
            }, 100);

            window.addEventListener('scroll', updateActiveLink);

            // Handle sidebar link clicks
            sidebarLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href').substring(1);
                    const targetElement = document.getElementById(targetId);

                    if (targetElement) {
                        const headerOffset = 100;
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });

                        // Update active state immediately
                        sidebarLinks.forEach(l => l.classList.remove('active'));
                        this.classList.add('active');
                    }
                });
            });
        }

        // Search functionality placeholder
        const searchInput = document.getElementById('docs-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(function() {
                const searchTerm = this.value.toLowerCase();
                // Placeholder for search functionality
                console.log('Searching for:', searchTerm);
            }, 300));
        }
    }

    // Initialize documentation features if on documentation page
    if (window.location.pathname.includes('documentation.html')) {
        initializeDocumentationFeatures();
    }

    console.log('Abstract Driven Development website initialized successfully');
});

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export for use in other scripts if needed
window.ADDWebsite = {
    debounce,
    throttle
};