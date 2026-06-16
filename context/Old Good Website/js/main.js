/**
 * THE SANDBAGR - Shared Website JavaScript
 * Preserves original functionality from FinalizedWebsite.html
 * Adds: nav injection, footer injection, particles, tilt, mouse gradient, enhanced counters
 * Loaded on all pages
 */

// ── ACCESS GATE — redirect to gate.html if not unlocked ──
(function() {
  var isGatePage = window.location.pathname.indexOf('gate.html') !== -1;
  if (!isGatePage && sessionStorage.getItem('sandbagr_access') !== 'granted') {
    window.location.replace('gate.html');
  }
})();

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // ============================================================================
  // CONFIGURATION
  // ============================================================================
  const WL_URL = 'https://script.google.com/macros/s/AKfycbzETJhFYu-2GqizUWcv6UFbDg9iAji7F9tQ1LEHctR6DJQMUz9x2ncyGx9sASAVCVk/exec';

  // ============================================================================
  // 1. NAV INJECTION & ACTIVE STATE
  // ============================================================================
  function injectNav() {
    const navPlaceholder = document.getElementById('nav-placeholder');
    if (!navPlaceholder) return;

    const navHTML = `
      <nav id="nav">
        <div class="nav-inner">
          <a href="index.html" class="nav-logo">SANDBAGR</a>
          <div class="nav-links" id="navLinks">
            <div class="nav-dropdown">
              <a href="features.html">How It Works</a>
              <div class="nav-dropdown-menu">
                <a href="features.html#engine">The Engine</a>
                <a href="features.html#under-the-hood">Under the Hood</a>
                <a href="features.html#bet-catalog">Bet Catalog</a>
              </div>
            </div>
            <div class="nav-dropdown">
              <a href="market.html">Why Now</a>
              <div class="nav-dropdown-menu">
                <a href="market.html#betting">Betting Boom</a>
                <a href="market.html#golf">Golf's Shift</a>
                <a href="market.html#whitespace">White Space</a>
                <a href="market.html#convergence">Convergence</a>
                <a href="market.html#roadmap">Roadmap</a>
              </div>
            </div>
            <div class="nav-dropdown">
              <a href="story.html">Our Story</a>
              <div class="nav-dropdown-menu">
                <a href="story.html">Our Story</a>
                <a href="story.html#journey">Journey</a>
                <a href="story.html#founder">Founder</a>
              </div>
            </div>
            <a href="faq.html">FAQ</a>
            <a href="https://instagram.com/sandbagrapp" target="_blank" rel="noopener">Instagram</a>
            <a href="waitlist.html" class="nav-cta">Join Waitlist</a>
          </div>
          <button class="mob-toggle" id="mobToggle" aria-label="Menu"><span></span><span></span><span></span></button>
        </div>
      </nav>
    `;

    navPlaceholder.innerHTML = navHTML;
    setActiveNavLink();
  }

  function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    // Only mark top-level nav links active, not dropdown sub-links
    const navLinks = document.querySelectorAll('#navLinks > a:not([target="_blank"]), #navLinks > .nav-dropdown > a');

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      const hrefPage = href ? href.split('#')[0] : '';
      if (hrefPage === currentPage || (currentPage === '' && hrefPage === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  // ============================================================================
  // 2. FOOTER INJECTION
  // ============================================================================
  function injectFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) return;

    const footerHTML = `
      <footer>
        <div class="footer-content">
          <div class="footer-logo">SANDBAGR</div>
          <div class="footer-tagline">Talk sh*t. Back it up.</div>
          <div class="footer-links">
            <a href="#waitlist">Waitlist</a>
            <a href="features.html">How It Works</a>
            <a href="faq.html">FAQ</a>
            <a href="market.html">Why Now</a>
            <a href="story.html">Story</a>
            <a href="https://instagram.com/sandbagrapp" target="_blank" rel="noopener">Instagram</a>
            <a href="mailto:ccritch123@gmail.com">Contact</a>
          </div>
          <div class="footer-copyright">&copy; 2026 SANDBAGR. All rights reserved.</div>
          <div class="footer-disclaimer">SANDBAGR is a social score-tracking and entertainment tool. No real money is wagered or processed through the app. Tokens represent a points-based accounting ledger between friends. All settlement occurs externally between participants.</div>
        </div>
      </footer>
    `;

    footerPlaceholder.innerHTML = footerHTML;
  }

  // ============================================================================
  // 3. SCROLL PROGRESS BAR (ORIGINAL)
  // ============================================================================
  function initScrollProgressBar() {
    const scrollProgress = document.getElementById('scrollProgress');
    if (!scrollProgress) return;

    window.addEventListener('scroll', function() {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      scrollProgress.style.width = scrolled + '%';
    });
  }

  // ============================================================================
  // 4. NAV SCROLL BEHAVIOR & MOBILE TOGGLE (ORIGINAL)
  // ============================================================================
  function initNavScrollBehavior() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    window.addEventListener('scroll', function() {
      nav.classList.toggle('scrolled', window.scrollY > 30);
    });

    // Mobile toggle
    const mobToggle = document.getElementById('mobToggle');
    const navLinks = document.getElementById('navLinks');
    if (mobToggle && navLinks) {
      mobToggle.addEventListener('click', function() {
        mobToggle.classList.toggle('open');
        navLinks.classList.toggle('open');
      });

      // Close menu when link clicked
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
          mobToggle.classList.remove('open');
          navLinks.classList.remove('open');
        });
      });
    }
  }

  // ============================================================================
  // 5. SMOOTH SCROLL FOR ANCHOR LINKS (ORIGINAL + ENHANCED)
  // ============================================================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Handle links to anchors on other pages
    // e.g., features.html#betting → navigate to features and scroll to #betting
    document.querySelectorAll('a[href*="#"]').forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        // Only handle if it's an external page with anchor
        if (href.includes('.html#')) {
          const [page, anchor] = href.split('#');
          // Check if we're already on that page
          const currentPage = window.location.pathname.split('/').pop() || 'index.html';
          if (currentPage !== page) {
            // Will navigate via normal link, then scroll via sessionStorage hint
            sessionStorage.setItem('scrollToAnchor', anchor);
          }
        }
      });
    });

    // On page load, check if we need to scroll to an anchor
    const targetAnchor = sessionStorage.getItem('scrollToAnchor');
    if (targetAnchor) {
      sessionStorage.removeItem('scrollToAnchor');
      setTimeout(() => {
        const target = document.getElementById(targetAnchor);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    }
  }

  // ============================================================================
  // 6. SCROLL REVEAL WITH INTERSECTION OBSERVER (ORIGINAL)
  // ============================================================================
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.rv, .rv-s');
    if (revealElements.length === 0) return;

    const observerOptions = {
      threshold: 0.08,
      rootMargin: '0px 0px -20px 0px'
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('vis');

          // Animate odds bars
          entry.target.querySelectorAll('.odds-fill[data-w]').forEach(bar => {
            setTimeout(() => {
              bar.style.width = bar.dataset.w + '%';
            }, 200);
          });

          // Animate counters
          entry.target.querySelectorAll('.stat-n[data-count]').forEach(el => {
            animateCount(el);
          });
        }
      });
    }, observerOptions);

    revealElements.forEach(el => observer.observe(el));
  }

  // ============================================================================
  // 7. ANIMATED COUNTERS (ORIGINAL + ENHANCED)
  // ============================================================================
  function animateCount(el) {
    // Don't animate twice
    if (el.dataset.animated) return;
    el.dataset.animated = '1';

    const target = parseFloat(el.dataset.count);

    // Handle zero case
    if (target === 0) {
      el.textContent = '0';
      return;
    }

    const isDecimal = target % 1 !== 0;
    const duration = 1200;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = target * easeOut;

      // Determine format from data-format attribute or fall back to original behavior
      const format = el.dataset.format || '';
      let displayValue;

      if (format === '$B') {
        displayValue = '$' + currentValue.toFixed(1) + 'B';
      } else if (format === '$M') {
        displayValue = '$' + currentValue.toFixed(1) + 'M';
      } else if (format === 'M+') {
        displayValue = currentValue.toFixed(1) + 'M+';
      } else if (format === 'M') {
        displayValue = currentValue.toFixed(1) + 'M';
      } else if (format === '') {
        // Plain number
        displayValue = Math.round(currentValue);
      } else {
        // Default to original behavior
        if (isDecimal) {
          displayValue = '$' + currentValue.toFixed(1) + 'B';
        } else {
          displayValue = Math.round(currentValue) + 'M+';
        }
      }

      el.textContent = displayValue;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        // Apply final value with special cases from original
        if (target === 2.4) {
          el.textContent = '$2.4B';
        } else if (target === 25) {
          el.textContent = '25M+';
        } else if (target === 29) {
          el.textContent = '29';
        } else {
          el.textContent = target;
        }
      }
    }

    requestAnimationFrame(tick);
  }

  // ============================================================================
  // 8. WAITLIST FORM HANDLER (ORIGINAL)
  // ============================================================================
  function initWaitlistForm() {
    const form = document.getElementById('wlForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      const submitBtn = document.getElementById('wlBtn');
      if (submitBtn) {
        submitBtn.textContent = 'Joining...';
        submitBtn.disabled = true;
      }

      const firstNameInput = form.querySelector('[name="firstName"]');
      const emailInput = form.querySelector('[name="email"]');

      const firstName = firstNameInput ? firstNameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';

      try {
        // Only fetch if URL is configured
        if (WL_URL !== 'YOUR_WAITLIST_SCRIPT_URL_HERE') {
          await fetch(WL_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              firstName: firstName,
              email: email,
              source: 'website',
              timestamp: new Date().toISOString()
            })
          });
        }
      } catch (error) {
        // Silently handle errors per original
        console.error('Waitlist submission error:', error);
      }

      // Hide form and show success
      form.style.display = 'none';
      const successDiv = document.getElementById('wlSuccess');
      if (successDiv) {
        successDiv.style.display = 'block';
      }
    });
  }

  // ============================================================================
  // 9. PARTICLES.JS INITIALIZATION
  // ============================================================================
  function initParticles() {
    const particlesDiv = document.getElementById('particles-js');
    if (!particlesDiv) return;

    // Check if particles.js is loaded
    if (typeof particlesJS === 'undefined') {
      return;
    }

    try {
      particlesJS('particles-js', {
        particles: {
          number: {
            value: 80,
            density: {
              enable: true,
              value_area: 800
            }
          },
          color: {
            value: '#00FF87'
          },
          shape: {
            type: 'circle'
          },
          opacity: {
            value: 0.5,
            random: true,
            anim: {
              enable: false
            }
          },
          size: {
            value: 2,
            random: true,
            anim: {
              enable: false
            }
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: 'rgba(0, 255, 135, 0.04)',
            opacity: 0.04,
            width: 1
          },
          move: {
            enable: true,
            speed: 0.6,
            direction: 'none',
            random: true,
            straight: false,
            out_mode: 'out',
            attract: {
              enable: false
            }
          }
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: {
              enable: true,
              mode: 'grab'
            },
            onclick: {
              enable: true,
              mode: 'push'
            },
            resize: true
          },
          modes: {
            grab: {
              distance: 140,
              line_linked: {
                opacity: 0.08
              }
            },
            push: {
              particles_nb: 4
            }
          }
        },
        retina_detect: true
      });
    } catch (error) {
      console.error('Particles.js initialization error:', error);
    }
  }

  // ============================================================================
  // 10. VANILLA TILT INITIALIZATION
  // ============================================================================
  function initVanillaTilt() {
    if (typeof VanillaTilt === 'undefined') {
      return;
    }

    try {
      const tiltElements = document.querySelectorAll('[data-tilt]');
      tiltElements.forEach(element => {
        VanillaTilt.init(element, {
          max: 6,
          speed: 400,
          glare: true,
          'max-glare': 0.08
        });
      });
    } catch (error) {
      console.error('Vanilla Tilt initialization error:', error);
    }
  }

  // ============================================================================
  // 11. MOUSE-FOLLOW GRADIENT (HERO ONLY)
  // ============================================================================
  function initMouseFollowGradient() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const heroBg = hero.querySelector('.hero-bg');
    if (!heroBg) return;

    document.addEventListener('mousemove', function(e) {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate percentage relative to hero element
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;

      // Update CSS custom properties
      heroBg.style.setProperty('--mouse-x', xPercent + '%');
      heroBg.style.setProperty('--mouse-y', yPercent + '%');
    });

    // Reset when mouse leaves
    hero.addEventListener('mouseleave', function() {
      heroBg.style.setProperty('--mouse-x', '50%');
      heroBg.style.setProperty('--mouse-y', '50%');
    });
  }

  // ============================================================================
  // INITIALIZATION CALL
  // ============================================================================
  function initAll() {
    injectNav();
    injectFooter();
    initScrollProgressBar();
    initNavScrollBehavior();
    initSmoothScroll();
    initScrollReveal();
    initWaitlistForm();
    initParticles();
    initVanillaTilt();
    initMouseFollowGradient();
  }

  // Run all initializations
  initAll();
});

// ============================================================================
// GLOBAL UTILITIES (optional, for debugging)
// ============================================================================
window.SANDBAGRUtils = {
  reloadNav: function() {
    const placeholder = document.getElementById('nav-placeholder');
    if (placeholder) {
      placeholder.innerHTML = '';
      document.dispatchEvent(new Event('DOMContentLoaded'));
    }
  }
};
