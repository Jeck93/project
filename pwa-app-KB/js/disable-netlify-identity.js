// Disable Netlify Identity completely and force secure authentication
(function() {
    'use strict';
    
    console.log('🚫 Disabling Netlify Identity...');
    
    // Block Netlify Identity from loading
    if (window.netlifyIdentity) {
        window.netlifyIdentity = null;
        console.log('✅ Netlify Identity disabled');
    }
    
    // Prevent Netlify Identity from being loaded
    Object.defineProperty(window, 'netlifyIdentity', {
        get: function() {
            console.log('🚫 Netlify Identity access blocked');
            return null;
        },
        set: function(value) {
            console.log('🚫 Netlify Identity assignment blocked');
            return null;
        },
        configurable: false
    });
    
    // Block Netlify Identity script loading
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        
        if (tagName.toLowerCase() === 'script') {
            const originalSetAttribute = element.setAttribute;
            element.setAttribute = function(name, value) {
                if (name === 'src' && value && value.includes('netlify-identity')) {
                    console.log('🚫 Blocked Netlify Identity script:', value);
                    return;
                }
                return originalSetAttribute.call(this, name, value);
            };
        }
        
        return element;
    };
    
    // Remove any existing Netlify Identity elements
    function removeNetlifyElements() {
        const selectors = [
            '[data-netlify-identity]',
            '.netlify-identity-widget',
            '.netlify-identity-button',
            '.netlify-identity-modal',
            '#netlify-identity-widget',
            'iframe[src*="netlify"]'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.remove();
                console.log('🗑️ Removed Netlify element:', selector);
            });
        });
    }
    
    // Run removal on DOM ready and periodically
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeNetlifyElements);
    } else {
        removeNetlifyElements();
    }
    
    // Monitor for new Netlify elements
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    if (node.matches && (
                        node.matches('[data-netlify-identity]') ||
                        node.matches('.netlify-identity-widget') ||
                        node.matches('.netlify-identity-button') ||
                        node.matches('.netlify-identity-modal') ||
                        (node.tagName === 'IFRAME' && node.src && node.src.includes('netlify'))
                    )) {
                        console.log('🚫 Blocking new Netlify element:', node);
                        node.remove();
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Force secure authentication mode
    localStorage.setItem('pwa_auth_mode', 'secure_only');
    
    console.log('✅ Netlify Identity completely disabled, secure auth enforced');
    
})();