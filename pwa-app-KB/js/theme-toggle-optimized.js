// Lightweight Theme Toggle - No heavy animations

class ThemeToggle {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }
    
    init() {
        // Apply saved theme
        this.applyTheme(this.currentTheme);
        
        // Create toggle button
        this.createToggleButton();
        
        // Listen for system theme changes
        this.listenForSystemTheme();
    }
    
    createToggleButton() {
        const button = document.createElement('button');
        button.className = 'theme-toggle';
        button.innerHTML = this.currentTheme === 'dark' ? '☀️' : '🌙';
        button.title = `Switch to ${this.currentTheme === 'dark' ? 'light' : 'dark'} mode`;
        
        button.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        document.body.appendChild(button);
        this.toggleButton = button;
    }
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        this.updateToggleButton();
        
        // Save preference
        localStorage.setItem('theme', this.currentTheme);
    }
    
    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    
    updateToggleButton() {
        if (this.toggleButton) {
            this.toggleButton.innerHTML = this.currentTheme === 'dark' ? '☀️' : '🌙';
            this.toggleButton.title = `Switch to ${this.currentTheme === 'dark' ? 'light' : 'dark'} mode`;
        }
    }
    
    listenForSystemTheme() {
        // Auto-detect system theme preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Only apply system theme if user hasn't set preference
        if (!localStorage.getItem('theme')) {
            this.currentTheme = mediaQuery.matches ? 'dark' : 'light';
            this.applyTheme(this.currentTheme);
            this.updateToggleButton();
        }
        
        // Listen for system theme changes
        mediaQuery.addEventListener('change', (e) => {
            // Only apply if user hasn't manually set theme
            if (!localStorage.getItem('theme')) {
                this.currentTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(this.currentTheme);
                this.updateToggleButton();
            }
        });
    }
}

// Initialize theme toggle when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new ThemeToggle();
});

// Export for compatibility
window.ThemeToggle = ThemeToggle;