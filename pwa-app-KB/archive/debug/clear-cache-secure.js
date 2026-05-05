// Clear Cache and Force Secure Login Mode
(function() {
    'use strict';
    
    console.log('🧹 Starting cache cleanup for secure login...');
    
    // Clear all localStorage
    localStorage.clear();
    console.log('✅ LocalStorage cleared');
    
    // Clear all sessionStorage
    sessionStorage.clear();
    console.log('✅ SessionStorage cleared');
    
    // Clear service worker caches
    if ('caches' in window) {
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    console.log('🗑️ Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(function() {
            console.log('✅ All caches cleared');
            
            // Unregister service worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                        registration.unregister();
                        console.log('✅ Service worker unregistered');
                    }
                    
                    // Force reload after cleanup
                    setTimeout(() => {
                        console.log('🔄 Reloading page...');
                        window.location.reload(true);
                    }, 1000);
                });
            } else {
                // Force reload if no service worker
                setTimeout(() => {
                    console.log('🔄 Reloading page...');
                    window.location.reload(true);
                }, 1000);
            }
        }).catch(function(error) {
            console.error('❌ Error clearing caches:', error);
            // Force reload anyway
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
        });
    } else {
        console.log('⚠️ Caches API not supported');
        // Force reload anyway
        setTimeout(() => {
            window.location.reload(true);
        }, 1000);
    }
    
    // Disable any Netlify Identity if present
    if (window.netlifyIdentity) {
        console.log('🚫 Disabling Netlify Identity');
        window.netlifyIdentity = null;
    }
    
    // Remove any Netlify Identity elements
    const netlifyElements = document.querySelectorAll('[data-netlify-identity], .netlify-identity-widget');
    netlifyElements.forEach(el => {
        el.remove();
        console.log('🗑️ Removed Netlify Identity element');
    });
    
})();