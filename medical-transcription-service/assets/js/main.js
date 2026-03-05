/**
 * main.js — Medical Transcription Service
 * Handles: theme, nav, FAQ, forms, animations
 */

'use strict';

// ============================================================
// THEME MANAGER
// ============================================================
const ThemeManager = (() => {
  const STORAGE_KEY = 'mts-theme';
  const ICONS = { light: '☀️', dark: '🌙' };
  let current = 'light';

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    current = saved || (prefersDark ? 'dark' : 'light');
    apply(current);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(STORAGE_KEY)) apply(e.matches ? 'dark' : 'light');
    });
  }

  function apply(theme) {
    current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
      btn.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
      const icon = btn.querySelector('[data-theme-icon]');
      if (icon) icon.textContent = theme === 'dark' ? ICONS.light : ICONS.dark;
    });
  }

  function toggle() {
    const next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
  }

  return { init, toggle, getCurrent: () => current };
})();

// ============================================================
// RTL MANAGER
// ============================================================
const RTLManager = (() => {
  const STORAGE_KEY = 'mts-direction';
  let current = 'ltr';

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    current = saved || 'ltr';
    apply(current);
  }

  function apply(dir) {
    current = dir;
    document.documentElement.setAttribute('dir', dir);
    document.querySelectorAll('[data-rtl-toggle]').forEach(btn => {
      btn.textContent = dir === 'rtl' ? 'LTR' : 'RTL';
      btn.setAttribute('aria-label', `Switch to ${dir === 'rtl' ? 'left-to-right' : 'right-to-left'} layout`);
    });
  }

  function toggle() {
    const next = current === 'ltr' ? 'rtl' : 'ltr';
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
  }

  return { init, toggle, getCurrent: () => current };
})();

// ============================================================
// NAVIGATION
// ============================================================
const NavManager = (() => {
  function init() {
    // Mobile menu toggle
    document.querySelectorAll('[data-mobile-menu-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const menu = document.querySelector('[data-mobile-menu]');
        if (!menu) return;
        const isOpen = menu.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen);
        btn.querySelector('[data-menu-icon]').textContent = isOpen ? '✕' : '☰';
      });
    });

    // Close menu on nav link click
    document.querySelectorAll('[data-mobile-menu] .nav-link').forEach(link => {
      link.addEventListener('click', () => {
        const menu = document.querySelector('[data-mobile-menu]');
        if (menu) menu.classList.remove('open');
      });
    });

    // Active nav link
    highlightActive();

    // Scroll-based nav shadow
    window.addEventListener('scroll', () => {
      const nav = document.querySelector('.navbar');
      if (nav) nav.style.boxShadow = window.scrollY > 10
        ? '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        : 'var(--nav-shadow)';
    }, { passive: true });
  }

  function highlightActive() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      const linkPath = href.split('/').pop();
      if (linkPath === path || (path === '' && linkPath === 'index.html')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  return { init };
})();

// ============================================================
// FAQ ACCORDION
// ============================================================
const FAQManager = (() => {
  function init() {
    document.querySelectorAll('[data-faq-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('[data-faq-item]');
        if (!item) return;
        const isOpen = item.classList.contains('open');

        // Close all others
        document.querySelectorAll('[data-faq-item].open').forEach(el => {
          el.classList.remove('open');
          el.querySelector('[data-faq-btn]').setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
  return { init };
})();

// ============================================================
// FORM VALIDATION
// ============================================================
const FormValidator = (() => {
  const RULES = {
    required: (v) => v.trim() !== '' || 'This field is required.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Please enter a valid email address.',
    phone: (v) => !v || /^[\d\s\-\+\(\)]{7,}$/.test(v) || 'Please enter a valid phone number.',
    minLength: (n) => (v) => v.length >= n || `Must be at least ${n} characters.`,
    maxLength: (n) => (v) => v.length <= n || `Must be no more than ${n} characters.`,
  };

  function validateField(input) {
    const rules = (input.dataset.validate || '').split(',').map(r => r.trim()).filter(Boolean);
    const value = input.value;
    let error = null;

    for (const rule of rules) {
      if (rule.startsWith('minLength:')) {
        const fn = RULES.minLength(parseInt(rule.split(':')[1]));
        const result = fn(value);
        if (result !== true) { error = result; break; }
      } else if (RULES[rule]) {
        const result = RULES[rule](value);
        if (result !== true) { error = result; break; }
      }
    }

    showFieldError(input, error);
    return !error;
  }

  function showFieldError(input, message) {
    const group = input.closest('.form-group');
    if (!group) return;
    let errorEl = group.querySelector('.form-error');

    if (message) {
      input.classList.add('error');
      input.setAttribute('aria-invalid', 'true');
      if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'form-error';
        errorEl.setAttribute('role', 'alert');
        errorEl.id = `error-${input.id || Math.random().toString(36).slice(2)}`;
        input.setAttribute('aria-describedby', errorEl.id);
        input.parentNode.insertBefore(errorEl, input.nextSibling);
      }
      errorEl.textContent = message;
    } else {
      input.classList.remove('error');
      input.removeAttribute('aria-invalid');
      if (errorEl) errorEl.remove();
    }
  }

  function initForms() {
    document.querySelectorAll('form[data-validate-form]').forEach(form => {
      // Live validation on blur
      form.querySelectorAll('[data-validate]').forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
          if (input.classList.contains('error')) validateField(input);
        });
      });

      // Submit handler
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        let allValid = true;

        form.querySelectorAll('[data-validate]').forEach(input => {
          if (!validateField(input)) allValid = false;
        });

        if (allValid) {
          const onSuccess = form.dataset.onSuccess;
          if (onSuccess && window[onSuccess]) window[onSuccess](form);
          else handleFormSuccess(form);
        } else {
          const firstError = form.querySelector('.form-error');
          if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
  }

  function handleFormSuccess(form) {
    const successMsg = form.dataset.successMsg || 'Your message has been sent successfully!';
    const existing = form.querySelector('.alert-success');
    if (existing) existing.remove();

    const alert = document.createElement('div');
    alert.className = 'alert alert-success animate-fade-in';
    alert.setAttribute('role', 'status');
    alert.innerHTML = `✅ ${successMsg}`;
    form.insertBefore(alert, form.firstChild);
    form.reset();

    setTimeout(() => alert.remove(), 6000);
  }

  return { init: initForms, validateField };
})();

// ============================================================
// INTERSECTION OBSERVER — Scroll animations
// ============================================================
const AnimationManager = (() => {
  function init() {
    if (!window.IntersectionObserver) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
  }
  return { init };
})();

// ============================================================
// SMOOTH SCROLL
// ============================================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ============================================================
// COUNTER ANIMATION
// ============================================================
function animateCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length || !window.IntersectionObserver) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.counter);
      const suffix = el.dataset.counterSuffix || '';
      const duration = 1800;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        el.textContent = (Number.isInteger(target) ? Math.floor(value) : value.toFixed(1)) + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
const Toast = (() => {
  let container;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:360px';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type = 'info', duration = 4000) {
    const c = getContainer();
    const colors = {
      success: '#16a34a', error: '#dc2626', info: '#0284c7', warning: '#d97706'
    };
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

    const toast = document.createElement('div');
    toast.style.cssText = `background:var(--surface-card);border:1px solid var(--surface-border);border-left:4px solid ${colors[type]};border-radius:8px;padding:12px 16px;box-shadow:0 4px 12px rgb(0 0 0/0.15);display:flex;align-items:flex-start;gap:10px;font-family:var(--font-ui);font-size:0.875rem;color:var(--text-primary);animation:fadeInUp 0.3s ease;max-width:360px;cursor:pointer`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `<span>${icons[type]}</span><span style="flex:1">${message}</span><span style="opacity:0.5;font-size:1.1rem" aria-label="Dismiss">✕</span>`;
    toast.addEventListener('click', () => dismiss(toast));
    c.appendChild(toast);

    if (duration > 0) setTimeout(() => dismiss(toast), duration);
    return toast;
  }

  function dismiss(toast) {
    toast.style.animation = 'fadeIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }

  return { show };
})();

// ============================================================
// BACK TO TOP
// ============================================================
function initBackToTop() {
  const btn = document.querySelector('[data-back-to-top]');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.style.opacity = window.scrollY > 400 ? '1' : '0';
    btn.style.pointerEvents = window.scrollY > 400 ? 'auto' : 'none';
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  RTLManager.init();
  NavManager.init();
  FAQManager.init();
  FormValidator.init();
  AnimationManager.init();
  animateCounters();
  initSmoothScroll();
  initBackToTop();

  // Theme toggle buttons
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', ThemeManager.toggle);
  });

  // RTL toggle buttons
  document.querySelectorAll('[data-rtl-toggle]').forEach(btn => {
    btn.addEventListener('click', RTLManager.toggle);
  });

  // Expose Toast globally for inline usage
  window.Toast = Toast;
});
