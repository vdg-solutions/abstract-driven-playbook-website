// Syntax highlighting and code block functionality
// This file provides enhanced code block features without external dependencies

document.addEventListener('DOMContentLoaded', function() {
    initializeCodeBlocks();
    initializeCodeTabs();
    addLanguageLabels();
});

function initializeCodeBlocks() {
    const codeBlocks = document.querySelectorAll('pre code');

    codeBlocks.forEach(codeBlock => {
        const pre = codeBlock.parentElement;

        // Wrap in code-block container if not already wrapped
        if (!pre.parentElement.classList.contains('code-block')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block';
            pre.parentElement.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);
        }

        // Add copy button if not already present
        const wrapper = pre.parentElement;
        if (!wrapper.querySelector('.copy-button')) {
            addCopyButton(wrapper, codeBlock);
        }

        // Add line numbers if requested
        if (codeBlock.classList.contains('line-numbers')) {
            addLineNumbers(codeBlock);
        }

        // Enhance syntax highlighting
        enhanceSyntaxHighlighting(codeBlock);
    });
}

function addCopyButton(wrapper, codeBlock) {
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copy';
    copyButton.setAttribute('aria-label', 'Copy code to clipboard');

    copyButton.addEventListener('click', async function() {
        try {
            await navigator.clipboard.writeText(codeBlock.textContent);

            // Show success feedback
            const originalText = this.textContent;
            this.textContent = 'Copied!';
            this.classList.add('copied');

            setTimeout(() => {
                this.textContent = originalText;
                this.classList.remove('copied');
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = codeBlock.textContent;
            document.body.appendChild(textArea);
            textArea.select();

            try {
                document.execCommand('copy');
                this.textContent = 'Copied!';
                this.classList.add('copied');

                setTimeout(() => {
                    this.textContent = 'Copy';
                    this.classList.remove('copied');
                }, 2000);
            } catch (fallbackErr) {
                console.error('Copy failed:', fallbackErr);
                this.textContent = 'Copy failed';
                setTimeout(() => {
                    this.textContent = 'Copy';
                }, 2000);
            }

            document.body.removeChild(textArea);
        }
    });

    wrapper.appendChild(copyButton);
}

function addLanguageLabels() {
    const codeBlocks = document.querySelectorAll('pre code[class*="language-"]');

    codeBlocks.forEach(codeBlock => {
        const wrapper = codeBlock.closest('.code-block');
        if (!wrapper || wrapper.querySelector('.language-label')) return;

        const classList = Array.from(codeBlock.classList);
        const languageClass = classList.find(cls => cls.startsWith('language-'));

        if (languageClass) {
            const language = languageClass.replace('language-', '');
            const label = document.createElement('span');
            label.className = 'language-label';
            label.textContent = getLanguageDisplayName(language);
            wrapper.appendChild(label);
        }
    });
}

function getLanguageDisplayName(language) {
    const languageNames = {
        'js': 'JavaScript',
        'ts': 'TypeScript',
        'javascript': 'JavaScript',
        'typescript': 'TypeScript',
        'html': 'HTML',
        'css': 'CSS',
        'json': 'JSON',
        'sql': 'SQL',
        'bash': 'Bash',
        'shell': 'Shell',
        'yaml': 'YAML',
        'yml': 'YAML',
        'dockerfile': 'Dockerfile',
        'diff': 'Diff',
        'xml': 'XML',
        'python': 'Python',
        'py': 'Python',
        'java': 'Java',
        'csharp': 'C#',
        'cs': 'C#',
        'php': 'PHP',
        'ruby': 'Ruby',
        'go': 'Go',
        'rust': 'Rust',
        'swift': 'Swift',
        'kotlin': 'Kotlin'
    };

    return languageNames[language.toLowerCase()] || language.toUpperCase();
}

function addLineNumbers(codeBlock) {
    const lines = codeBlock.textContent.split('\n');
    const wrapper = document.createElement('div');
    wrapper.className = 'code-with-lines';

    lines.forEach((line, index) => {
        if (index === lines.length - 1 && line === '') return; // Skip empty last line

        const lineDiv = document.createElement('div');
        lineDiv.className = 'line';
        lineDiv.textContent = line;
        wrapper.appendChild(lineDiv);
    });

    codeBlock.innerHTML = '';
    codeBlock.appendChild(wrapper);
}

function enhanceSyntaxHighlighting(codeBlock) {
    // Basic syntax highlighting for common patterns
    // This is a simple implementation that adds basic token classes

    const language = getCodeBlockLanguage(codeBlock);
    if (!language) return;

    const content = codeBlock.textContent;
    let highlightedContent = content;

    // Apply language-specific highlighting
    switch (language) {
        case 'javascript':
        case 'typescript':
            highlightedContent = highlightJavaScript(content);
            break;
        case 'json':
            highlightedContent = highlightJSON(content);
            break;
        case 'css':
            highlightedContent = highlightCSS(content);
            break;
        case 'html':
            highlightedContent = highlightHTML(content);
            break;
        default:
            return; // No highlighting for other languages
    }

    codeBlock.innerHTML = highlightedContent;
}

function getCodeBlockLanguage(codeBlock) {
    const classList = Array.from(codeBlock.classList);
    const languageClass = classList.find(cls => cls.startsWith('language-'));
    return languageClass ? languageClass.replace('language-', '') : null;
}

function highlightJavaScript(content) {
    // Basic JavaScript/TypeScript highlighting
    return content
        // Keywords
        .replace(/\b(const|let|var|function|class|interface|type|export|import|from|return|if|else|for|while|try|catch|finally|async|await|new|this|super|extends|implements|public|private|protected|static)\b/g,
            '<span class="token keyword">$1</span>')
        // Strings
        .replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
            '<span class="token string">$1$2$1</span>')
        // Numbers
        .replace(/\b(\d+\.?\d*)\b/g,
            '<span class="token number">$1</span>')
        // Comments
        .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
            '<span class="token comment">$1</span>')
        // Functions
        .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
            '<span class="token function">$1</span>(');
}

function highlightJSON(content) {
    // Basic JSON highlighting
    return content
        // Property names
        .replace(/"([^"]+)":/g,
            '<span class="token property">"$1"</span>:')
        // String values
        .replace(/:\s*"([^"]*)"/g,
            ': <span class="token string">"$1"</span>')
        // Numbers
        .replace(/:\s*(\d+\.?\d*)/g,
            ': <span class="token number">$1</span>')
        // Booleans and null
        .replace(/:\s*(true|false|null)\b/g,
            ': <span class="token boolean">$1</span>');
}

function highlightCSS(content) {
    // Basic CSS highlighting
    return content
        // Selectors
        .replace(/^([^{]+)\s*{/gm,
            '<span class="token selector">$1</span> {')
        // Properties
        .replace(/^\s*([a-z-]+):/gm,
            '  <span class="token property">$1</span>:')
        // Values
        .replace(/:\s*([^;]+);/g,
            ': <span class="token value">$1</span>;');
}

function highlightHTML(content) {
    // Basic HTML highlighting
    return content
        // Tags
        .replace(/(<\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^>]*)?>)/g,
            '$1<span class="token tag">$2</span>$3')
        // Attributes
        .replace(/(\s+)([a-zA-Z-]+)(=)/g,
            '$1<span class="token attr-name">$2</span>$3')
        // Attribute values
        .replace(/=\s*"([^"]*)"/g,
            '=<span class="token attr-value">"$1"</span>');
}

function initializeCodeTabs() {
    const codeTabContainers = document.querySelectorAll('.code-tabs');

    codeTabContainers.forEach(container => {
        const tabs = container.querySelectorAll('.code-tab');
        const panels = container.parentElement.querySelectorAll('.code-panel');

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

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export functions for use in other scripts
window.SyntaxHighlighter = {
    initializeCodeBlocks,
    addCopyButton,
    addLanguageLabels,
    enhanceSyntaxHighlighting
};