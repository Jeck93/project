// Performance Optimized JavaScript - Ganti animations.js dan particles.js dengan ini

// Minimal animations for better performance
class OptimizedAnimations {
    constructor() {
        this.init();
    }
    
    init() {
        // Only add essential animations
        this.addBasicInteractions();
        this.addLoadingStates();
    }
    
    addBasicInteractions() {
        // Simple button hover effects
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }
    
    addLoadingStates() {
        // Simple loading states without heavy animations
        const loadingButtons = ['#testBtn', '#syncBtn', '#refreshBtn'];
        
        loadingButtons.forEach(selector => {
            const button = document.querySelector(selector);
            if (button) {
                const originalClick = button.onclick;
                button.onclick = function(e) {
                    this.disabled = true;
                    this.style.opacity = '0.7';
                    
                    if (originalClick) {
                        const result = originalClick.call(this, e);
                        
                        if (result && typeof result.then === 'function') {
                            result.finally(() => {
                                this.disabled = false;
                                this.style.opacity = '1';
                            });
                        } else {
                            setTimeout(() => {
                                this.disabled = false;
                                this.style.opacity = '1';
                            }, 1000);
                        }
                    }
                };
            }
        });
    }
}

// Initialize only when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if user prefers reduced motion or is on mobile
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth <= 768;
    
    // Only initialize minimal animations
    if (!prefersReducedMotion) {
        new OptimizedAnimations();
    }
    
    // Remove any existing heavy effects
    const particlesContainer = document.querySelector('.particles-bg');
    if (particlesContainer) {
        particlesContainer.remove();
    }
    
    // Disable parallax effects
    const parallaxElements = document.querySelectorAll('.parallax');
    parallaxElements.forEach(el => {
        el.classList.remove('parallax');
        el.style.transform = 'none';
    });
    
    // Remove mouse trail
    const trailPoints = document.querySelectorAll('.mouse-trail-point');
    trailPoints.forEach(point => point.remove());
});

// Export for compatibility
window.animations = {
    OptimizedAnimations
};