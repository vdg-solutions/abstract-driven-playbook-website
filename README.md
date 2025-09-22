# Abstract Driven Development Website

This is the official website for Abstract Driven Development (ADD) at [abstractdriven.com](https://abstractdriven.com).

## 🌟 Features

- **Responsive Design**: Mobile-first design that works on all devices
- **Interactive Examples**: Live code examples with syntax highlighting
- **Comprehensive Documentation**: Complete guide to ADD principles and patterns
- **Modern Web Standards**: Built with HTML5, CSS3, and vanilla JavaScript
- **Accessibility**: ARIA labels, keyboard navigation, and reduced motion support

## 📁 File Structure

```
website/
├── index.html              # Homepage with overview and examples
├── documentation.html      # Complete documentation
├── styles/
│   ├── main.css            # Core styles and layout
│   ├── components.css      # Component-specific styles
│   └── syntax-highlight.css # Code syntax highlighting
├── js/
│   ├── main.js             # Main functionality and navigation
│   └── syntax-highlight.js # Code block enhancements
└── README.md               # This file
```

## 🚀 Quick Start

1. **Local Development**: Simply open `index.html` in your browser
2. **Web Server**: Serve the website folder with any HTTP server

```bash
# Using Python (Python 3)
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

3. **Production**: Upload all files to your web server

## 📱 Responsive Breakpoints

- **Mobile**: < 480px
- **Tablet**: 480px - 768px
- **Desktop**: > 768px

## 🎨 Design System

### Colors
- **Primary**: #0284c7 (Sky blue)
- **Secondary**: #6366f1 (Indigo)
- **Success**: #10b981 (Emerald)
- **Warning**: #f59e0b (Amber)
- **Error**: #ef4444 (Red)

### Typography
- **Primary Font**: Inter (Google Fonts)
- **Monospace**: JetBrains Mono (Google Fonts)

### Spacing
- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)
- **3xl**: 4rem (64px)

## 🔧 Interactive Features

### Code Examples
- **Syntax Highlighting**: TypeScript, JavaScript, JSON, HTML, CSS, SQL, Bash, YAML
- **Copy to Clipboard**: One-click code copying
- **Language Labels**: Automatic language detection and labeling
- **Responsive**: Code blocks adapt to screen size

### Navigation
- **Mobile Menu**: Hamburger menu for mobile devices
- **Smooth Scrolling**: Animated scrolling to sections
- **Active States**: Visual feedback for current page/section
- **Keyboard Support**: Full keyboard navigation support

### Documentation
- **Sidebar Navigation**: Sticky sidebar with active section highlighting
- **Search Placeholder**: Ready for search functionality implementation
- **Progressive Disclosure**: Information organized by complexity level

## 🌐 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **CSS Grid & Flexbox**: Full support required
- **JavaScript ES6+**: Modern JavaScript features used

## 📈 Performance Optimizations

- **CSS Custom Properties**: Efficient styling system
- **Minimal Dependencies**: Only Google Fonts and Font Awesome icons
- **Optimized Images**: No heavy images, icon fonts used
- **Code Splitting**: Separate CSS files for different concerns

## 🎯 SEO & Accessibility

- **Semantic HTML**: Proper heading hierarchy and semantic elements
- **Meta Tags**: Open Graph and description meta tags
- **ARIA Labels**: Screen reader support
- **Alt Text**: Descriptive text for all images/icons
- **Focus Indicators**: Clear focus states for keyboard users
- **Reduced Motion**: Respects user motion preferences

## 🔗 External Links

All external links are properly configured:
- **GitHub Repository**: Links to abstract-driven-playbook repository
- **Pattern Examples**: Direct links to GitHub pattern folders
- **Community**: Links to GitHub Discussions

## 📄 License

This website is part of the Abstract Driven Development project, licensed under MIT License.

## 🤝 Contributing

To contribute to the website:

1. **Content Updates**: Edit HTML files directly
2. **Styling**: Modify CSS files in the `styles/` folder
3. **Functionality**: Update JavaScript files in the `js/` folder
4. **Testing**: Test on multiple devices and browsers
5. **Pull Request**: Submit changes via GitHub

## 📞 Support

- **Documentation**: [abstractdriven.com/documentation.html](https://abstractdriven.com/documentation.html)
- **GitHub Issues**: [Report issues](https://github.com/abstractdriven/abstract-driven-playbook/issues)
- **Discussions**: [Join discussions](https://github.com/abstractdriven/abstract-driven-playbook/discussions)

---

Built with ❤️ following Abstract Driven Development principles.