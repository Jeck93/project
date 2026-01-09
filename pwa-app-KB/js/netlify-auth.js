// Netlify Identity Authentication handler for PWA App
class NetlifyAuthManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Initialize Netlify Identity
        if (typeof netlifyIdentity !== 'undefined') {
            netlifyIdentity.init();
            this.setupEventListeners();
        }
        
        this.setupLoginForm();
        this.checkExistingAuth();
    }
    
    setupEventListeners() {
        // Listen for login events
        netlifyIdentity.on('login', (user) => {
            console.log('User logged in:', user);
            this.handleLoginSuccess(user);
        });
        
        // Listen for logout events
        netlifyIdentity.on('logout', () => {
            console.log('User logged out');
            this.handleLogout();
        });
        
        // Listen for init event
        netlifyIdentity.on('init', (user) => {
            if (user) {
                console.log('User already logged in:', user);
                this.handleLoginSuccess(user);
            }
        });
    }
    
    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const netlifyForm = document.getElementById('netlifyForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (netlifyForm) {
            netlifyForm.addEventListener('submit', (e) => this.handleNetlifyLogin(e));
        }
        
        // Setup logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }
    
    async handleNetlifyLogin(e) {
        e.preventDefault();
        
        const loginBtn = document.getElementById('netlifyLoginBtn');
        
        // Clear previous errors
        this.hideError();
        
        // Add loading state
        this.setLoadingState(loginBtn, true, 'Membuka Login...');
        
        try {
            // Open Netlify Identity modal
            netlifyIdentity.open();
            
        } catch (error) {
            console.error('Netlify login error:', error);
            this.showError('Terjadi kesalahan saat membuka Netlify Identity.');
        } finally {
            this.setLoadingState(loginBtn, false, '🔐 Login / Daftar dengan Netlify');
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username');
        const password = document.getElementById('password');
        const errorMsg = document.getElementById('errorMsg');
        const loginBtn = document.getElementById('loginBtn');
        
        // Clear previous errors
        this.hideError();
        
        // Add loading state
        this.setLoadingState(loginBtn, true);
        
        try {
            // Check if we have username/password fields (fallback mode)
            if (username && password && username.value && password.value) {
                // Fallback to local authentication
                await this.handleLocalLogin(username.value, password.value);
            } else {
                // Use Netlify Identity modal
                netlifyIdentity.open();
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Terjadi kesalahan saat login. Silakan coba lagi.');
        } finally {
            this.setLoadingState(loginBtn, false);
        }
    }
    
    async handleLocalLogin(username, password) {
        // Load configured credentials from CONFIG.AUTH if available
        const authConfig = (typeof CONFIG !== 'undefined') ? CONFIG.AUTH : null;
        const validCredentials = authConfig && authConfig.USERS ? authConfig.USERS : [
            { username: 'admin', password: 'admin123', name: 'Administrator' },
            { username: 'user1', password: 'user123', name: 'User 1' },
            { username: 'ppkbd', password: 'ppkbd2024', name: 'PPKBD Staff' }
        ];

        const user = validCredentials.find(u => u.username === username && u.password === password);
        
        if (user) {
            // Store auth token
            localStorage.setItem('pwa_auth_token', 'local_token_' + Date.now());
            localStorage.setItem('pwa_username', user.name || user.username);
            localStorage.setItem('pwa_user_email', user.email || `${user.username}@local.app`);
            localStorage.setItem('pwa_auth_type', 'local');
            
            // Show success message
            this.showSuccess('Login berhasil! Mengalihkan...');
            
            // Redirect to main app
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } else {
            this.showError('Username atau password salah!');
        }
    }
    
    handleLoginSuccess(user) {
        // Store user info
        localStorage.setItem('pwa_auth_token', user.token.access_token);
        localStorage.setItem('pwa_username', user.user_metadata.full_name || user.email);
        localStorage.setItem('pwa_user_email', user.email);
        
        // Show success message if on login page
        if (window.location.pathname.includes('login.html')) {
            this.showSuccess('Login berhasil! Mengalihkan...');
            
            // Redirect to main app
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
        
        // Update username display if on main page
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            usernameElement.textContent = user.user_metadata.full_name || user.email;
        }
        
        // Close the modal
        netlifyIdentity.close();
    }
    
    handleLogout() {
        localStorage.removeItem('pwa_auth_token');
        localStorage.removeItem('pwa_username');
        localStorage.removeItem('pwa_user_email');
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
    
    checkExistingAuth() {
        // Wait for Netlify Identity to fully initialize
        setTimeout(() => {
            const currentUser = netlifyIdentity.currentUser();
            const localToken = localStorage.getItem('pwa_auth_token');
            const authType = localStorage.getItem('pwa_auth_type');
            const currentPath = window.location.pathname;
            
            // Check if user is authenticated (either Netlify or local)
            const isAuthenticated = currentUser || (localToken && authType);
            
            console.log('Checking auth - Netlify user:', currentUser);
            console.log('Local token:', localToken, 'Auth type:', authType);
            console.log('Current path:', currentPath);
            
            if (isAuthenticated && (currentPath.includes('login.html') || currentPath === '/')) {
                // User already logged in, redirect to main app
                console.log('User logged in, redirecting to index.html');
                window.location.href = 'index.html';
            } else if (!isAuthenticated && (currentPath.includes('index.html') || currentPath === '/')) {
                // User not logged in, redirect to login
                console.log('User not logged in, redirecting to login.html');
                window.location.href = 'login.html';
            }
            
            // Update username display if user is logged in and on main page
            if (isAuthenticated && currentPath.includes('index.html')) {
                const usernameElement = document.getElementById('username');
                if (usernameElement) {
                    if (currentUser) {
                        // Netlify user
                        usernameElement.textContent = currentUser.user_metadata.full_name || currentUser.email;
                    } else if (authType === 'local') {
                        // Local user
                        usernameElement.textContent = localStorage.getItem('pwa_username') || 'User';
                    }
                }
            }
        }, 500); // Give Netlify Identity time to initialize
    }
    
    logout() {
        const authType = localStorage.getItem('pwa_auth_type');
        
        if (authType === 'local') {
            // Local logout
            localStorage.removeItem('pwa_auth_token');
            localStorage.removeItem('pwa_username');
            localStorage.removeItem('pwa_user_email');
            localStorage.removeItem('pwa_auth_type');
            window.location.href = 'login.html';
        } else {
            // Netlify logout
            netlifyIdentity.logout();
        }
    }
    
    isAuthenticated() {
        const currentUser = netlifyIdentity.currentUser();
        const localToken = localStorage.getItem('pwa_auth_token');
        const authType = localStorage.getItem('pwa_auth_type');
        
        return !!(currentUser || (localToken && authType));
    }
    
    getUsername() {
        const currentUser = netlifyIdentity.currentUser();
        return currentUser ? (currentUser.user_metadata.full_name || currentUser.email) : 'User';
    }
    
    getCurrentUser() {
        return netlifyIdentity.currentUser();
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
    
    setLoadingState(button, isLoading, customText = null) {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.textContent = customText || 'Memproses...';
            button.style.opacity = '0.7';
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.textContent = customText || 'Login';
            button.style.opacity = '1';
            button.classList.remove('loading');
        }
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Netlify Identity to load
    if (typeof netlifyIdentity !== 'undefined') {
        window.authManager = new NetlifyAuthManager();
    } else {
        // Fallback if Netlify Identity doesn't load
        console.warn('Netlify Identity not loaded, falling back to local auth');
        // You can add fallback auth here if needed
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetlifyAuthManager;
}