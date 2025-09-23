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

    // Initialize Mermaid diagrams - copied from working test file
    function initializeMermaid() {
        if (typeof mermaid !== 'undefined') {
            // Minimal, clean initialization like the test file
            mermaid.initialize({
                startOnLoad: true,
                fontSize: 16,
                securityLevel: 'loose',
                theme: 'base',
                flowchart: {
                    useMaxWidth: false,
                    htmlLabels: true
                },
                themeVariables: {
                    primaryColor: '#667eea',
                    primaryTextColor: '#1a202c',
                    primaryBorderColor: '#667eea',
                    lineColor: '#667eea',
                    secondaryColor: '#f7fafc',
                    tertiaryColor: '#edf2f7',
                    background: '#ffffff',
                    mainBkg: '#f8fafc',
                    secondBkg: '#edf2f7',
                    tertiaryBkg: '#e2e8f0'
                }
            });

            console.log('Mermaid initialized with clean config');

            // EXACT same approach as working test file
            setTimeout(() => {
                document.querySelectorAll('.mermaid svg').forEach(svg => {
                    // Minimal cleanup like test file
                    svg.removeAttribute('width');
                    svg.removeAttribute('height');
                    svg.style.width = '100%';
                    svg.style.height = 'auto';
                    svg.style.maxWidth = '100%';
                    if (!svg.getAttribute('preserveAspectRatio')) {
                        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                    }

                    // Add click handlers for modal
                    const diagram = svg.closest('.mermaid');
                    if (diagram) {
                        diagram.style.cursor = 'pointer';
                        diagram.title = 'Click to enlarge diagram';
                        diagram.addEventListener('click', function() {
                            openDiagramModal(this);
                        });
                    }
                });
            }, 300);  // Back to 300ms like test file
        }
    }

    function normalizeMermaidSvgs() {
        const svgs = document.querySelectorAll('.mermaid svg');
        svgs.forEach(svg => {
            try {
                // Remove fixed dimensions so CSS can size it responsively
                svg.removeAttribute('width');
                svg.removeAttribute('height');
                svg.style.width = '100%';
                svg.style.height = 'auto';
                svg.style.maxWidth = '100%';

                // Ensure viewBox exists for proper scaling
                if (!svg.getAttribute('viewBox')) {
                    const bbox = svg.getBBox();
                    if (bbox && isFinite(bbox.width) && isFinite(bbox.height) && bbox.width > 0 && bbox.height > 0) {
                        svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
                    }
                }

                // Keep aspect ratio while scaling to width
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            } catch (e) {
                // ignore
            }
        });
    }

    function retryNormalizeMermaid(times, delayMs) {
        let attempts = 0;
        const timer = setInterval(() => {
            attempts++;
            normalizeMermaidSvgs();
            const ok = Array.from(document.querySelectorAll('.mermaid svg')).some(svg => svg.clientWidth > 300);
            if (ok || attempts >= times) {
                clearInterval(timer);
            }
        }, delayMs);
    }

    // Mermaid will auto-render with startOnLoad: true

    function openDiagramModal(diagramElement) {
        console.log('Opening diagram modal', diagramElement);

        // Create modal if it doesn't exist
        let modal = document.getElementById('diagram-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'diagram-modal';
            modal.className = 'diagram-modal';
            modal.innerHTML = `
                <div class="diagram-modal-content">
                    <button class="diagram-close-btn" style="position: absolute; top: 20px; right: 20px; background: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.2); z-index: 10001;">✕</button>
                </div>
            `;
            document.body.appendChild(modal);

            // Close modal on click outside or close button
            modal.addEventListener('click', function(e) {
                if (e.target === this || e.target.classList.contains('diagram-close-btn')) {
                    this.classList.remove('active');
                }
            });

            // ESC key to close
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    modal.classList.remove('active');
                }
            });
        }

        // Find the SVG - could be direct child or nested
        const svg = diagramElement.querySelector('svg');
        console.log('Found SVG:', svg);

        if (svg) {
            const modalContent = modal.querySelector('.diagram-modal-content');

            // Clear previous content (except close button)
            const closeBtn = modalContent.querySelector('.diagram-close-btn');
            modalContent.innerHTML = '';
            if (closeBtn) {
                modalContent.appendChild(closeBtn);
            }

            // Clone the entire SVG with all its content
            const clonedSvg = svg.cloneNode(true);
            console.log('Cloned SVG:', clonedSvg);

            // Reset styles for modal display
            clonedSvg.style.cssText = '';
            clonedSvg.style.width = 'auto';
            clonedSvg.style.height = 'auto';
            clonedSvg.style.maxWidth = '90vw';
            clonedSvg.style.maxHeight = '90vh';
            clonedSvg.style.minWidth = '400px';
            clonedSvg.style.minHeight = '200px';
            clonedSvg.removeAttribute('width');
            clonedSvg.removeAttribute('height');

            modalContent.appendChild(clonedSvg);

            // Show modal
            modal.classList.add('active');
            console.log('Modal should be visible now');
        } else {
            console.error('No SVG found in diagram element', diagramElement);
            alert('Unable to find diagram to display');
        }
    }

    // Initialize documentation features if on documentation page
    if (window.location.pathname.includes('documentation.html')) {
        initializeDocumentationFeatures();
        initializeProgressBar();
        initializeScrollAnimations();

        // Initialize Mermaid with delay to ensure all content is loaded
        if (document.readyState === 'complete') {
            initializeMermaid();
        } else {
            window.addEventListener('load', initializeMermaid);
        }
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