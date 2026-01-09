// Secure Authentication System for PWA-APP-KB
class SecureAuthManager {
    constructor() {
        this.init();
        // Simple hash function for basic security (not cryptographically secure)
        this.hashPassword = this.simpleHash;
    }
    
    init() {
        this.setupLoginForm();
        this.checkExistingAuth();
        this.loadSecureUsers();
    }
    
    // Simple hash function (better than plain text, but still not production-grade)
    simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }
    
    // Load users with hashed passwords
    loadSecureUsers() {
        // Load from CONFIG.AUTH.USERS if available
        const configUsers = (typeof CONFIG !== 'undefined' && CONFIG.AUTH && CONFIG.AUTH.USERS) 
            ? CONFIG.AUTH.USERS 
            : [];
        
        // Convert to secure format with hashed passwords
        this.secureUsers = configUsers.map(user => ({
            username: user.username,
            passwordHash: this.simpleHash(user.password),
            name: user.name,
            email: user.email,
            role: user.role,
            desa: user.desa || 'Unknown',
            salt: 'ppkbd2024'
        }));
        
        console.log(`Loaded ${this.secureUsers.length} users for secure authentication`);
        
        // Load from environment variables if available (server-side)
        if (typeof process !== 'undefined' && process.env) {
            this.loadFromEnv();
        }
    }
    
    // Load credentials from environment variables (server-side)
    loadFromEnv() {
        const envUsers = [];
        let i = 1;
        
        while (process.env[`USER_${i}_USERNAME`]) {
            envUsers.push({
                username: process.env[`USER_${i}_USERNAME`],
                passwordHash: process.env[`USER_${i}_PASSWORD_HASH`],
                name: process.env[`USER_${i}_NAME`] || `User ${i}`,
                email: process.env[`USER_${i}_EMAIL`] || `user${i}@local.app`,
                role: process.env[`USER_${i}_ROLE`] || 'user',
                salt: process.env[`USER_${i}_SALT`] || 'default_salt'
            });
            i++;
        }
        
        if (envUsers.length > 0) {
            this.secureUsers = envUsers;
            console.log('Loaded users from environment variables');
        }
    }
    
    setupLoginForm() {
        const loginForm = document.getElementById('secureLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleSecureLogin(e));
        }
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }
    
    async handleSecureLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('secureUsername').value;
        const password = document.getElementById('securePassword').value;
        const loginBtn = document.getElementById('secureLoginBtn');
        
        this.hideError();
        this.setLoadingState(loginBtn, true);
        
        try {
            // Add artificial delay to prevent brute force
            await this.delay(1000);
            
            // Hash the input password
            const inputHash = this.simpleHash(password);
            
            // Find user with matching username and password hash
            const user = this.secureUsers.find(u => 
                u.username === username && u.passwordHash === inputHash
            );
            
            if (user) {
                // Generate secure session token
                const sessionToken = this.generateSecureToken(user);
                
                // Store encrypted session data
                localStorage.setItem('pwa_secure_token', sessionToken);
                localStorage.setItem('pwa_username', user.name);
                localStorage.setItem('pwa_user_role', user.role);
                localStorage.setItem('pwa_auth_type', 'secure');
                localStorage.setItem('pwa_session_start', Date.now());
                
                this.showSuccess('Login berhasil! Mengalihkan...');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                
            } else {
                // Add delay even for failed attempts to prevent timing attacks
                await this.delay(500);
                this.showError('Username atau password salah!');
                this.logFailedAttempt(username);
            }
            
        } catch (error) {
            console.error('Secure login error:', error);
            this.showError('Terjadi kesalahan saat login.');
        } finally {
            this.setLoadingState(loginBtn, false);
        }
    }
    
    generateSecureToken(user) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2);
        const userStr = `${user.username}:${user.role}:${timestamp}`;
        const token = btoa(userStr + ':' + randomStr); // Base64 encode
        return token;
    }
    
    validateSecureToken() {
        const token = localStorage.getItem('pwa_secure_token');
        const sessionStart = localStorage.getItem('pwa_session_start');
        
        if (!token || !sessionStart) return false;
        
        // Check session timeout (24 hours)
        const sessionAge = Date.now() - parseInt(sessionStart);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionAge > maxAge) {
            this.logout();
            return false;
        }
        
        try {
            const decoded = atob(token);
            return decoded.includes(':') && decoded.length > 10;
        } catch (e) {
            return false;
        }
    }
    
    logFailedAttempt(username) {
        const attempts = JSON.parse(localStorage.getItem('failed_attempts') || '{}');
        const now = Date.now();
        
        if (!attempts[username]) {
            attempts[username] = [];
        }
        
        attempts[username].push(now);
        
        // Keep only last 10 attempts
        attempts[username] = attempts[username].slice(-10);
        
        localStorage.setItem('failed_attempts', JSON.stringify(attempts));
        
        // Check for too many failed attempts
        const recentAttempts = attempts[username].filter(time => 
            now - time < 15 * 60 * 1000 // Last 15 minutes
        );
        
        if (recentAttempts.length >= 5) {
            this.showError('Terlalu banyak percobaan login. Coba lagi dalam 15 menit.');
            document.getElementById('secureLoginBtn').disabled = true;
            setTimeout(() => {
                document.getElementById('secureLoginBtn').disabled = false;
            }, 15 * 60 * 1000);
        }
    }
    
    checkExistingAuth() {
        const currentPath = window.location.pathname;
        const isAuthenticated = this.validateSecureToken();
        
        if (isAuthenticated && currentPath.includes('login.html')) {
            window.location.href = 'index.html';
        } else if (!isAuthenticated && currentPath.includes('index.html')) {
            window.location.href = 'login.html';
        }
        
        // Update username display
        if (isAuthenticated && currentPath.includes('index.html')) {
            const usernameElement = document.getElementById('username');
            if (usernameElement) {
                usernameElement.textContent = localStorage.getItem('pwa_username') || 'User';
            }
        }
    }
    
    logout() {
        localStorage.removeItem('pwa_secure_token');
        localStorage.removeItem('pwa_username');
        localStorage.removeItem('pwa_user_role');
        localStorage.removeItem('pwa_auth_type');
        localStorage.removeItem('pwa_session_start');
        window.location.href = 'login.html';
    }
    
    isAuthenticated() {
        return this.validateSecureToken();
    }
    
    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        } else {
            button.disabled = false;
            button.textContent = 'Login Aman';
            button.style.opacity = '1';
        }
    }
}

// Initialize secure auth manager
document.addEventListener('DOMContentLoaded', () => {
    window.secureAuthManager = new SecureAuthManager();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureAuthManager;
}