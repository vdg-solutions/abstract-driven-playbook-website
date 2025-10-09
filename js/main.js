// Main JavaScript for Abstract Driven Development website

// DEBUG flag - set to false for production builds
const DEBUG = true;

// Debug logging utility
function debugLog(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

console.log('main.js loading...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired');
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
                    const dataAttribute = this.getAttribute('data-example') || this.getAttribute('data-tab');

                    // Remove active class from all tabs and panels
                    tabs.forEach(t => t.classList.remove('active'));
                    panels.forEach(p => p.classList.remove('active'));

                    // Add active class to clicked tab
                    tab.classList.add('active');

                    // Show corresponding panel by data attribute or index
                    if (dataAttribute) {
                        const targetPanel = container.parentElement.querySelector(`#${dataAttribute}-example, [data-example="${dataAttribute}"], [data-tab="${dataAttribute}"]`);
                        if (targetPanel) {
                            targetPanel.classList.add('active');
                        }
                    } else if (panels[index]) {
                        panels[index].classList.add('active');
                    }
                });
            });
        });
    }

    // Layer tab functionality for architecture section
    function initializeLayerTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const layerDetails = document.querySelectorAll('.layer-detail');

        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetLayer = this.getAttribute('data-layer');

                // Remove active class from all buttons and details
                tabButtons.forEach(btn => btn.classList.remove('active'));
                layerDetails.forEach(detail => detail.classList.remove('active'));

                // Add active class to clicked button
                this.classList.add('active');

                // Show corresponding layer detail
                const targetDetail = document.querySelector(`.layer-detail[data-layer="${targetLayer}"]`);
                if (targetDetail) {
                    targetDetail.classList.add('active');
                }
            });
        });
    }

    // Initialize tabs
    initializeTabs();

    // Initialize layer tabs (Architecture section)
    initializeLayerTabs();

    // Example tab functionality for "See ADD in Action" section
    function initializeExampleTabs() {
        const exampleTabs = document.querySelectorAll('.example-tab');
        const examplePanels = document.querySelectorAll('.example-panel');

        exampleTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetExample = this.getAttribute('data-example');

                // Remove active class from all tabs and panels
                exampleTabs.forEach(t => t.classList.remove('active'));
                examplePanels.forEach(p => p.classList.remove('active'));

                // Add active class to clicked tab
                this.classList.add('active');

                // Show corresponding panel
                const targetPanel = document.querySelector(`#${targetExample}-example`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
    }

    // Initialize example tabs (See ADD in Action section)
    initializeExampleTabs();

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
        if (!header) return; // Fix: check if header exists

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

    // Enhanced documentation progress bar
    function initializeProgressBar() {
        const progressBar = document.getElementById('docs-progress');
        if (!progressBar) return;

        function updateProgress() {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (window.pageYOffset / docHeight) * 100;
            progressBar.style.width = Math.min(progress, 100) + '%';
        }

        window.addEventListener('scroll', throttle(updateProgress, 16));
        updateProgress();
    }


    // Animation on scroll
    function initializeScrollAnimations() {
        const animatedElements = document.querySelectorAll('.docs-section, .sidebar-section');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }

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

        // Search functionality removed for now
    }

    // Working viewBox fix from debug
    function initializeMermaid() {
        if (typeof mermaid !== 'undefined') {
            mermaid.initialize({
                startOnLoad: true
            });

            // Fix viewBox after Mermaid renders - debug version
            setTimeout(() => {
                console.log('Running Mermaid fix...');
                document.querySelectorAll('.mermaid svg').forEach(svg => {
                    console.log('Processing SVG:', svg);
                    try {
                        // Try different selectors for content
                        let content = svg.querySelector('g.root g.nodes');

                        if (!content) {
                            content = svg.querySelector('g.nodes');
                        }

                        if (!content) {
                            content = svg.querySelector('g.root');
                        }

                        console.log('Found content:', content);

                        if (content) {
                            const bbox = content.getBBox();
                            console.log('BBox:', bbox);
                            if (bbox && bbox.width > 0) {
                                const newViewBox = `${bbox.x - 20} ${bbox.y - 20} ${bbox.width + 40} ${bbox.height + 40}`;
                                console.log('Setting viewBox:', newViewBox);
                                svg.setAttribute('viewBox', newViewBox);
                            }
                        } else {
                            console.log('No content found, trying fallback');
                            // Force viewBox reset
                            svg.removeAttribute('width');
                            svg.removeAttribute('height');
                            svg.style.width = '100%';
                            svg.style.height = 'auto';
                        }
                    } catch (e) {
                        console.error('ViewBox fix error:', e);
                    }
                });
            }, 3000); // Longer for production debugging
        }
    }

    // Debug path detection
    console.log('Current path:', window.location.pathname);
    console.log('Current href:', window.location.href);

    // Initialize documentation features if on documentation page
    if (window.location.pathname.includes('documentation') || window.location.href.includes('documentation')) {
        console.log('Documentation page detected');
        initializeDocumentationFeatures();
        initializeProgressBar();
        initializeScrollAnimations();

        // Initialize Mermaid with delay to ensure all content is loaded
        if (document.readyState === 'complete') {
            initializeMermaid();
        } else {
            window.addEventListener('load', initializeMermaid);
        }
    } else {
        console.log('Not documentation page');
    }

    debugLog('Abstract Driven Development website initialized successfully');
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