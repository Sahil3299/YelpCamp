/* ============================================
   YELPCAMP THEME SYSTEM
   Dark Mode Toggle & Theme Persistence
   ============================================ */

class ThemeManager {
    constructor() {
        this.STORAGE_KEY = 'yelpcamp-theme';
        this.THEME_ATTR = 'data-theme';
        this.LIGHT_THEME = 'light';
        this.DARK_THEME = 'dark';
        this.AUTO_THEME = 'auto';
        
        this.init();
    }

    /**
     * Initialize theme manager
     */
    init() {
        this.loadSavedTheme();
        this.attachEventListeners();
        this.observeSystemPreference();
    }

    /**
     * Load saved theme from localStorage or system preference
     */
    loadSavedTheme() {
        this.setTheme(this.LIGHT_THEME);
    }

    /**
     * Set theme
     */
    setTheme(theme) {
        if (![this.LIGHT_THEME, this.DARK_THEME, this.AUTO_THEME].includes(theme)) {
            theme = this.LIGHT_THEME;
        }

        document.documentElement.setAttribute(this.THEME_ATTR, theme);
        localStorage.setItem(this.STORAGE_KEY, theme);
        this.updateThemeIcon();
        this.dispatchThemeChangeEvent(theme);
    }

    /**
     * Get current theme
     */
    getTheme() {
        return document.documentElement.getAttribute(this.THEME_ATTR) || this.LIGHT_THEME;
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const currentTheme = this.getTheme();
        const newTheme = currentTheme === this.LIGHT_THEME ? this.DARK_THEME : this.LIGHT_THEME;
        this.setTheme(newTheme);
    }

    /**
     * Update theme toggle button icon
     */
    updateThemeIcon() {
        const themeToggleBtn = document.getElementById('theme-toggle');
        if (!themeToggleBtn) return;

        const theme = this.getTheme();
        const icon = themeToggleBtn.querySelector('i');
        
        if (icon) {
            if (theme === this.DARK_THEME) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                themeToggleBtn.setAttribute('title', 'Switch to light mode');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
                themeToggleBtn.setAttribute('title', 'Switch to dark mode');
            }
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const themeToggleBtn = document.getElementById('theme-toggle');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Add keyboard shortcut: Ctrl/Cmd + Shift + D for dark mode
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'd') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    /**
     * Observe system preference changes
     */
    observeSystemPreference() {
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            darkModeQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a theme
                const savedTheme = localStorage.getItem(this.STORAGE_KEY);
                if (!savedTheme) {
                    this.setTheme(e.matches ? this.DARK_THEME : this.LIGHT_THEME);
                }
            });
        }
    }

    /**
     * Dispatch custom theme change event
     */
    dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('themechange', {
            detail: { theme }
        });
        document.dispatchEvent(event);
    }

    /**
     * Get computed CSS variable
     */
    getColorVariable(variableName) {
        const value = getComputedStyle(document.documentElement)
            .getPropertyValue(`--${variableName}`)
            .trim();
        return value;
    }

    /**
     * Update CSS variables dynamically
     */
    updateColorVariable(variableName, value) {
        document.documentElement.style.setProperty(`--${variableName}`, value);
    }
}

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}

/**
 * Listen for theme changes and update any custom elements
 */
document.addEventListener('themechange', (e) => {
    console.log(`Theme switched to: ${e.detail.theme}`);
    
    // Add any additional logic needed when theme changes
    updateChartsTheme(e.detail.theme);
    updateMapTheme(e.detail.theme);
});

/**
 * Update chart colors based on theme (if charts exist)
 */
function updateChartsTheme(theme) {
    // This would be implemented if using charting library
    // Example: Update ApexCharts, Chart.js colors, etc.
}

/**
 * Update map colors based on theme (if map exists)
 */
function updateMapTheme(theme) {
    // This would be implemented if using map library
    // Example: Update MapTiler map style, markers, etc.
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}

console.log('YelpCamp Theme Manager initialized 🎨');
