// Authentication handler for PWA App
class AuthManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupLoginForm();
        this.checkExistingAuth();
    }
    
    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');
        const loginBtn = document.getElementById('loginBtn');
        
        // Clear previous errors
        this.hideError();
        
        // Add loading state
        this.setLoadingState(loginBtn, true);
        
        try {
            // Simple demo authentication using configurable credentials
            // Load configured credentials from `CONFIG.AUTH` if available
            const authConfig = (typeof CONFIG !== 'undefined') ? CONFIG.AUTH : null;
            const validUsername = authConfig && authConfig.USERNAME ? authConfig.USERNAME : 'admin';
            const validPassword = authConfig && authConfig.PASSWORD ? authConfig.PASSWORD : 'admin123';

            if (username === validUsername && password === validPassword) {
                // Store auth token
                localStorage.setItem('pwa_auth_token', 'demo_token_' + Date.now());
                localStorage.setItem('pwa_username', username);
                
                // Show success message
                this.showSuccess('Login berhasil! Mengalihkan...');
                
                // Redirect to main app
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                
            } else {
                this.showError('Username atau password salah!');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Terjadi kesalahan saat login. Silakan coba lagi.');
        } finally {
            this.setLoadingState(loginBtn, false);
        }
    }
    
    checkExistingAuth() {
        const token = localStorage.getItem('pwa_auth_token');
        const currentPath = window.location.pathname;
        
        if (token && currentPath.includes('login.html')) {
            // User already logged in, redirect to main app
            window.location.href = 'index.html';
        } else if (!token && currentPath.includes('index.html')) {
            // User not logged in, redirect to login
            window.location.href = 'login.html';
        }
    }
    
    logout() {
        localStorage.removeItem('pwa_auth_token');
        localStorage.removeItem('pwa_username');
        window.location.href = 'login.html';
    }
    
    isAuthenticated() {
        return !!localStorage.getItem('pwa_auth_token');
    }
    
    getUsername() {
        return localStorage.getItem('pwa_username') || 'User';
    }
    
    showError(message) {
        const errorMsg = document.getElementById('errorMsg');
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.style.display = 'block';
            errorMsg.style.background = '#f8d7da';
            errorMsg.style.color = '#721c24';
            errorMsg.style.border = '1px solid #f5c6cb';
        }
    }
    
    showSuccess(message) {
        const errorMsg = document.getElementById('errorMsg');
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.style.display = 'block';
            errorMsg.style.background = '#d4edda';
            errorMsg.style.color = '#155724';
            errorMsg.style.border = '1px solid #c3e6cb';
        }
    }
    
    hideError() {
        const errorMsg = document.getElementById('errorMsg');
        if (errorMsg) {
            errorMsg.style.display = 'none';
        }
    }
    
    setLoadingState(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.textContent = 'Memproses...';
            button.style.opacity = '0.7';
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.textContent = 'Login';
            button.style.opacity = '1';
            button.classList.remove('loading');
        }
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}