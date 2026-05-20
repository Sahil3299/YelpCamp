/* ============================================
   YELPCAMP ANIMATIONS & INTERACTIONS
   Scroll Animations, Interactive Effects
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {
    // Initialize animations
    initializeScrollAnimations();
    initializeInteractiveElements();
    initializeTooltips();
});

/**
 * Initialize Scroll Reveal Animations
 * Animates elements when they come into view
 */
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all scroll-animate elements
    document.querySelectorAll('.scroll-animate').forEach(el => {
        observer.observe(el);
    });

    // Observe stagger items for sequential animations
    document.querySelectorAll('.stagger-item').forEach(el => {
        // Add initial state
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
    });

    const staggerObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.stagger-item').forEach(el => {
        staggerObserver.observe(el);
    });
}

/**
 * Initialize Interactive Elements
 */
function initializeInteractiveElements() {
    // Add ripple effect to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function (e) {
            createRipple.call(this, e);
        });
    });

    // Add hover effects to links
    document.querySelectorAll('a:not(.btn)').forEach(link => {
        link.addEventListener('mouseenter', function () {
            if (!this.classList.contains('navbar-brand')) {
                this.style.transition = 'color var(--transition-fast)';
            }
        });
    });

    // Add smooth transitions to cards
    document.querySelectorAll('.card, [class*="card"]').forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transition = 'all var(--transition-base)';
        });
    });
}

/**
 * Create Ripple Effect
 */
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
}

/**
 * Initialize Bootstrap Tooltips
 */
function initializeTooltips() {
    // Enable Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Smooth Scroll to Element
 */
function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * Fade in images on load
 */
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('load', function () {
            this.style.animation = 'fadeIn 0.4s ease-out';
        });
    });
});

/**
 * Add fade animation to main content on page load
 */
window.addEventListener('load', function () {
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.style.animation = 'fadeIn 0.4s ease-out';
    }
});

/**
 * Debounce function for resize events
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Handle window resize
 */
const handleResize = debounce(function () {
    // Handle any resize-related logic here
}, 250);

window.addEventListener('resize', handleResize);

/**
 * Parallax scroll effect
 */
function initializeParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');

    if (parallaxElements.length === 0) return;

    window.addEventListener('scroll', debounce(function () {
        parallaxElements.forEach(element => {
            const speed = element.getAttribute('data-parallax') || 0.5;
            const yPos = window.pageYOffset * speed;
            element.style.transform = `translateY(${yPos}px)`;
        });
    }, 10));
}

initializeParallax();

/**
 * Add keyboard shortcuts
 */
document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + / for search (if search exists)
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-search]');
        if (searchInput) {
            searchInput.focus();
        }
    }
});

/**
 * Add scroll-to-top button functionality
 */
function initializeScrollToTop() {
    const scrollToTopBtn = document.querySelector('[data-scroll-to-top]');
    if (!scrollToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.display = 'block';
            scrollToTopBtn.classList.add('animate-fade-in');
        } else {
            scrollToTopBtn.style.display = 'none';
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

initializeScrollToTop();

/**
 * Initialize number counters
 */
function initializeCounters() {
    const counters = document.querySelectorAll('[data-counter]');

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-counter'));
        let current = 0;
        const increment = target / 100;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.ceil(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        // Start animation when element is visible
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                updateCounter();
                observer.unobserve(counter);
            }
        }, { threshold: 0.5 });

        observer.observe(counter);
    });
}

initializeCounters();

/**
 * Add active state to navbar based on current page
 */
function updateActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav a.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath.includes('/campgrounds') && href === '/campgrounds')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

updateActiveNavLink();

/**
 * Handle form input focus effects
 */
function initializeFormEffects() {
    const inputs = document.querySelectorAll('.form-control, .form-select');

    inputs.forEach(input => {
        input.addEventListener('focus', function () {
            this.closest('.mb-3, .form-group')?.classList.add('focused');
        });

        input.addEventListener('blur', function () {
            this.closest('.mb-3, .form-group')?.classList.remove('focused');
        });
    });
}

initializeFormEffects();

/**
 * Lazyload images
 */
function initializeLazyLoad() {
    const images = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    }
}

initializeLazyLoad();

/**
 * Add loading state to buttons on form submission
 */
function initializeButtonLoading() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', function () {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn && !this.hasAttribute('data-no-loading')) {
                submitBtn.disabled = true;
                submitBtn.classList.add('btn-loading');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading...';

                // Re-enable button after a timeout (in case of errors)
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('btn-loading');
                    submitBtn.innerHTML = originalText;
                }, 5000);
            }
        });
    });
}

initializeButtonLoading();

/**
 * Add custom page transition
 */
function initializePageTransitions() {
    document.querySelectorAll('a:not([target="_blank"]):not([data-no-transition])').forEach(link => {
        link.addEventListener('click', function (e) {
            // Only apply transition for internal links
            if (this.origin === window.location.origin) {
                const main = document.querySelector('main');
                if (main) {
                    main.style.opacity = '0.5';
                }
            }
        });
    });
}

initializePageTransitions();

console.log('YelpCamp Animations & Interactions initialized ✨');
