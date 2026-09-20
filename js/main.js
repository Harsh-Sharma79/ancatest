/* ANCA multi-page JavaScript
 * Load with: <script src="js/main.js" defer></script>
 * Configure API_ENDPOINT before enabling live form submission.
 */
(() => {
  'use strict';

  const API_ENDPOINT = '';
  const SELECTORS = {
    nav: '#primary-navigation, #navLinks, .nav-links',
    menuButton: '.menu-toggle',
    modal: '.modal-overlay, .enquiry-modal',
    form: '#enquiry-form, #enquiryForm, .enquiry-form',
    toast: '[data-toast-container]',
    reveal: '[data-reveal], .reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-scale',
    counter: '[data-counter]',
    scrollTop: '[data-scroll-top], .scroll-to-top'
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pageName = location.pathname.split('/').pop() || 'index.html';

  const text = value => String(value ?? '').trim().toLowerCase();
  const debounce = (fn, delay = 250) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  /* Toast notifications */
  function getToastContainer() {
    let container = $(SELECTORS.toast);
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.dataset.toastContainer = '';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.append(container);
    }
    return container;
  }

  function showToast(message, type = 'info', duration = 4500) {
    if (!message) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.innerHTML = `<span>${message}</span><button type="button" aria-label="Dismiss notification">×</button>`;
    const remove = () => toast.remove();
    toast.querySelector('button')?.addEventListener('click', remove);
    getToastContainer().append(toast);
    setTimeout(remove, duration);
  }
  window.showToast = showToast;

  /* Navigation and scroll state */
  const nav = $(SELECTORS.nav);
  const menuButton = $(SELECTORS.menuButton);
  const header = $('.site-header, .navbar, nav');

  function setMenu(open) {
    if (!nav) return;
    nav.classList.toggle('active', open);
    document.body.classList.toggle('menu-open', open);
    menuButton?.setAttribute('aria-expanded', String(open));
    menuButton?.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }

  menuButton?.addEventListener('click', () => setMenu(!nav.classList.contains('active')));
  $$('.navigation-list a, .nav-links a, #navLinks a').forEach(link => link.addEventListener('click', () => setMenu(false)));

  document.addEventListener('click', event => {
    if (nav?.classList.contains('active') && !nav.contains(event.target) && !menuButton?.contains(event.target)) setMenu(false);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      setMenu(false);
      closeAllModals();
    }
  });

  const setScrolled = () => header?.classList.toggle('scrolled', scrollY > 24);
  addEventListener('scroll', setScrolled, { passive: true });
  setScrolled();

  $$('.navigation-list a, .nav-links a').forEach(link => {
    const linkPage = new URL(link.href, location.href).pathname.split('/').pop() || 'index.html';
    if (linkPage === pageName) link.setAttribute('aria-current', 'page');
  });

  /* Smooth in-page navigation */
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const target = $(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', link.getAttribute('href'));
  });

  /* Scroll reveal and stagger */
  function initReveal() {
    const items = $$(SELECTORS.reveal);
    if (!items.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(item => item.classList.add('active'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const item = entry.target;
        const group = item.parentElement;
        const siblings = group ? $$(SELECTORS.reveal, group) : [];
        item.style.setProperty('--reveal-delay', `${Math.max(0, siblings.indexOf(item)) * 70}ms`);
        item.classList.add('active');
        observer.unobserve(item);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    items.forEach(item => observer.observe(item));
  }
  initReveal();

  /* Animated counters */
  function animateCounter(element) {
    if (element.dataset.counterDone === 'true') return;
    element.dataset.counterDone = 'true';
    const target = Number.parseFloat(element.dataset.counter);
    if (!Number.isFinite(target)) return;
    const duration = Number(element.dataset.counterDuration) || 1400;
    const prefix = element.dataset.counterPrefix || '';
    const suffix = element.dataset.counterSuffix || '';
    const decimals = Number.isInteger(target) ? 0 : 1;
    if (reducedMotion) {
      element.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
      return;
    }
    const started = performance.now();
    const tick = now => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${prefix}${(target * eased).toFixed(decimals)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    }), { threshold: 0.5 });
    $$(SELECTORS.counter).forEach(element => counterObserver.observe(element));
  } else $$(SELECTORS.counter).forEach(animateCounter);

  /* Modal system */
  let lastFocusedElement = null;
  function modalElements(id) {
    if (id) {
      const element = typeof id === 'string' ? document.getElementById(id.replace('#', '')) : id;
      return element ? [element] : [];
    }
    return $$(SELECTORS.modal);
  }

  function openModal(id) {
    const modal = modalElements(id)[0];
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    modal.removeAttribute('aria-hidden');
    modal.classList.add('is-open', 'active');
    document.body.classList.add('modal-open');
    const focusTarget = modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusTarget?.focus();
  }

  function closeModal(id) {
    modalElements(id).forEach(modal => {
      modal.classList.remove('is-open', 'active');
      modal.setAttribute('aria-hidden', 'true');
      modal.hidden = true;
    });
    if (!modalElements().some(modal => modal.classList.contains('is-open'))) document.body.classList.remove('modal-open');
    lastFocusedElement?.focus?.();
    lastFocusedElement = null;
  }

  function closeAllModals() {
    modalElements().forEach(modal => closeModal(modal.id || modal));
  }

  window.openModal = openModal;
  window.closeModal = closeModal;
  window.closeAllModals = closeAllModals;
  window.openEnquiry = () => {
    const id = document.getElementById('enquiry-modal') ? 'enquiry-modal' : 'enquiryModal';
    openModal(id);
  };
  window.closeEnquiry = () => {
    const id = document.getElementById('enquiry-modal') ? 'enquiry-modal' : 'enquiryModal';
    closeModal(id);
  };

  $$('.enquiry-trigger, .nav-enquiry-trigger, .nav-enquire, .enquiry-float, .course-enquiry-trigger').forEach(button => {
    button.addEventListener('click', () => window.openEnquiry());
  });
  $$(SELECTORS.modal).forEach(modal => {
    modal.querySelectorAll('.modal-close, .close-enquiry, .modal-close-action, .close-modal').forEach(button => button.addEventListener('click', () => closeModal(modal.id || modal)));
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal(modal.id || modal);
    });
  });

  /* Enquiry forms */
  const validators = {
    name: value => /^[\p{L} .'-]{2,}$/u.test(value.trim()),
    phone: value => /^(?:\+91[- ]?)?[6-9]\d{9}$/.test(value.replace(/[()\s-]/g, '')),
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  };

  function fieldError(field, message) {
    field.setCustomValidity(message);
    field.setAttribute('aria-invalid', 'true');
    let error = field.parentElement?.querySelector('.field-error');
    if (!error) {
      error = document.createElement('small');
      error.className = 'field-error';
      field.parentElement?.append(error);
    }
    error.textContent = message;
  }

  function clearFieldError(field) {
    field.setCustomValidity('');
    field.removeAttribute('aria-invalid');
    field.parentElement?.querySelector('.field-error')?.remove();
  }

  function validateForm(form) {
    let valid = true;
    $$('input, select, textarea', form).forEach(field => {
      clearFieldError(field);
      if (field.required && !field.value.trim()) {
        fieldError(field, 'This field is required.');
        valid = false;
      } else if (field.value.trim() && /name/i.test(field.name || field.id) && !validators.name(field.value)) {
        fieldError(field, 'Please enter a valid name.');
        valid = false;
      } else if (field.value.trim() && /(phone|whatsapp|mobile)/i.test(field.name || field.id) && !validators.phone(field.value)) {
        fieldError(field, 'Please enter a valid Indian mobile number.');
        valid = false;
      } else if (field.type === 'email' && field.value.trim() && !validators.email(field.value)) {
        fieldError(field, 'Please enter a valid email address.');
        valid = false;
      } else if (/message|notes/i.test(field.name || field.id) && field.value.trim() && field.value.trim().length < 10) {
        fieldError(field, 'Please provide at least 10 characters.');
        valid = false;
      }
    });
    return valid;
  }

  $$(SELECTORS.form).forEach(form => {
    form.addEventListener('input', event => clearFieldError(event.target));
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!validateForm(form)) {
        form.querySelector('[aria-invalid="true"]')?.focus();
        showToast('Please check the highlighted fields.', 'warning');
        return;
      }
      const submit = form.querySelector('[type="submit"]');
      const originalLabel = submit?.textContent || 'Submit Enquiry';
      if (submit) { submit.disabled = true; submit.textContent = 'Submitting…'; }
      try {
        if (!API_ENDPOINT) {
          showToast('Your form is ready. Please configure the enquiry endpoint before submitting online.', 'info');
          return;
        }
        const response = await fetch(API_ENDPOINT, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        form.reset();
        closeModal(form.closest('.modal-overlay')?.id);
        showToast('Enquiry submitted successfully.', 'success');
      } catch (error) {
        console.error('ANCA form submission failed:', error);
        showToast('Submission failed. Please try again or contact ANCA directly.', 'error');
      } finally {
        if (submit) { submit.disabled = false; submit.textContent = originalLabel; }
      }
    });
  });

  /* Generic filtering */
  function filterItems({ itemSelector, buttonSelector, attribute, emptySelector }) {
    const items = $$(itemSelector);
    const buttons = $$(buttonSelector);
    if (!items.length || !buttons.length) return;
    const filter = value => {
      const selected = text(value);
      let visible = 0;
      items.forEach(item => {
        const values = text(item.dataset[attribute]).split(/\s+/);
        const show = selected === 'all' || values.includes(selected) || values.includes('all');
        item.hidden = !show;
        if (show) visible++;
      });
      buttons.forEach(button => {
        const active = text(button.dataset[attribute]) === selected;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      const empty = emptySelector ? $(emptySelector) : null;
      if (empty) empty.hidden = visible > 0;
    };
    buttons.forEach(button => button.addEventListener('click', () => filter(button.dataset[attribute])));
  }
  window.filterItems = filterItems;

  filterItems({ itemSelector: '.course-card[data-category]', buttonSelector: '[data-category]', attribute: 'category', emptySelector: '[data-empty-courses]' });
  filterItems({ itemSelector: '.event-card[data-category], .gallery-item[data-category]', buttonSelector: '[data-category]', attribute: 'category', emptySelector: '[data-empty-events]' });
  filterItems({ itemSelector: '.resource-card[data-resource-type]', buttonSelector: '[data-resource-type]', attribute: 'resourceType', emptySelector: '[data-empty-resources]' });
  filterItems({ itemSelector: '.achievement-card[data-course]', buttonSelector: '[data-course]', attribute: 'course', emptySelector: '[data-empty-results]' });

  /* Search helpers */
  function initSearch(inputSelector, itemSelector, emptySelector) {
    const input = $(inputSelector);
    const items = $$(itemSelector);
    if (!input || !items.length) return;
    const run = debounce(() => {
      const query = text(input.value);
      let visible = 0;
      items.forEach(item => {
        const show = !query || text(item.textContent).includes(query);
        item.hidden = !show;
        if (show) visible++;
      });
      const empty = emptySelector ? $(emptySelector) : null;
      if (empty) empty.hidden = visible > 0;
    });
    input.addEventListener('input', run);
    input.form?.addEventListener('reset', () => setTimeout(run));
  }
  window.initSearch = initSearch;
  initSearch('#resource-search, #notes-search', '.resource-card', '[data-empty-resources]');
  initSearch('#faq-search', '.faq-section details', '[data-empty-faq]');
  initSearch('#event-search', '.event-card, .gallery-item', '[data-empty-events]');
  initSearch('#result-search', '.achievement-card', '[data-empty-results]');

  /* FAQ accordion ARIA support */
  $$('.faq-list details, .faq-section details').forEach(details => {
    const summary = details.querySelector('summary');
    if (!summary) return;
    const panel = summary.nextElementSibling;
    if (panel && !panel.id) panel.id = `faq-panel-${Math.random().toString(36).slice(2)}`;
    summary.setAttribute('aria-controls', panel?.id || '');
    const update = () => summary.setAttribute('aria-expanded', String(details.open));
    details.addEventListener('toggle', update);
    update();
  });

  /* URL query helpers and deep links */
  const query = new URLSearchParams(location.search);
  function getQuery(name) { return query.get(name) || ''; }
  function setQuery(name, value) {
    const url = new URL(location.href);
    if (value) url.searchParams.set(name, value); else url.searchParams.delete(name);
    history.replaceState(null, '', url);
  }
  function removeQuery(name) { setQuery(name, ''); }
  window.ancaQuery = { get: getQuery, set: setQuery, remove: removeQuery };

  const courseQuery = getQuery('course');
  if (courseQuery) {
    const target = document.getElementById(courseQuery) || $(`[data-course-id="${CSS.escape(courseQuery)}"]`);
    target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    target?.classList.add('is-selected');
  }
  const eventQuery = getQuery('event');
  if (eventQuery) openModal(eventQuery);

  /* Scroll-to-top button */
  const topButton = $(SELECTORS.scrollTop);
  if (topButton) {
    const update = () => topButton.hidden = scrollY < 500;
    addEventListener('scroll', update, { passive: true });
    topButton.addEventListener('click', () => scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));
    update();
  }

  /* Lightweight ripple feedback */
  document.addEventListener('click', event => {
    const button = event.target.closest('.button, .btn, button');
    if (!button || reducedMotion) return;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = button.getBoundingClientRect();
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    button.append(ripple);
    setTimeout(() => ripple.remove(), 550);
  });

  /* Native lazy-loading fallback */
  $$('img[data-src]').forEach(image => {
    if ('loading' in HTMLImageElement.prototype) {
      image.src = image.dataset.src;
      image.removeAttribute('data-src');
      image.loading = 'lazy';
    }
  });
})();
