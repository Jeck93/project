// Initialization script to handle authentication flow
(function() {
    'use strict';
    
    console.log('🚀 Initializing PWA App...');
    
    // Wait for Netlify Identity to load
    function waitForNetlifyIdentity() {
        return new Promise((resolve) => {
            if (typeof netlifyIdentity !== 'undefined') {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (typeof netlifyIdentity !== 'undefined') {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    console.warn('⚠️ Netlify Identity not loaded, continuing without it');
                    resolve();
                }, 5000);
            }
        });
    }
    
    // Initialize authentication check
    async function initAuth() {
        await waitForNetlifyIdentity();
        
        const currentPath = window.location.pathname;
        console.log('Current path:', currentPath);
        
        // Initialize Netlify Identity if available
        if (typeof netlifyIdentity !== 'undefined') {
            netlifyIdentity.init();
            
            // Wait a bit more for initialization
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const currentUser = netlifyIdentity.currentUser();
            console.log('Current user:', currentUser ? currentUser.email : 'None');
            
            // Handle routing based on authentication
            if (currentPath === '/' || currentPath.includes('index.html')) {
                if (!currentUser) {
                    console.log('🔄 No user found, redirecting to login...');
                    window.location.href = 'login.html';
                    return;
                } else {
                    console.log('✅ User authenticated, staying on index.html');
                }
            } else if (currentPath.includes('login.html')) {
                if (currentUser) {
                    console.log('🔄 User already logged in, redirecting to index...');
                    window.location.href = 'index.html';
                    return;
                } else {
                    console.log('✅ No user, staying on login.html');
                }
            }
        } else {
            console.warn('⚠️ Netlify Identity not available, using fallback auth');
            
            // Fallback to localStorage auth
            const authToken = localStorage.getItem('pwa_auth_token');
            
            if (currentPath === '/' || currentPath.includes('index.html')) {
                if (!authToken) {
                    window.location.href = 'login.html';
                    return;
                }
            } else if (currentPath.includes('login.html')) {
                if (authToken) {
                    window.location.href = 'index.html';
                    return;
                }
            }
        }
    }
    
    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
    
})();