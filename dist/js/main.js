(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  // Temporary QA destination. Replace with ANCA's verified WhatsApp number before launch.
  const WHATSAPP_NUMBER = "910000000000";
  const COURSE_DETAILS = {
    "11th-commerce": {
      name: "11th Commerce — HSC",
      shortName: "11th Commerce",
      overview: "A structured start to senior-secondary Commerce with attention to concepts, practice, and examination readiness.",
      audience: "Students beginning senior-secondary Commerce who want to discuss their academic goals, current subjects, and preparation needs.",
    },
    "12th-commerce": {
      name: "12th Commerce — HSC",
      shortName: "12th Commerce",
      overview: "Focused academic support for students building confidence through revision, problem-solving, and guided preparation.",
      audience: "Students continuing with senior-secondary Commerce who want to discuss revision, practice, and examination preparation.",
    },
    "ca-foundation": {
      name: "CA Foundation",
      shortName: "CA Foundation",
      overview: "A foundation pathway for learners exploring the CA route and seeking disciplined academic support.",
      audience: "Learners exploring the CA Foundation route who want to understand the available academic support before enquiring.",
    },
    "cma-foundation": {
      name: "CMA Foundation",
      shortName: "CMA Foundation",
      overview: "A foundation pathway for learners exploring the CMA route with a clear, practice-led study rhythm.",
      audience: "Learners exploring the CMA Foundation route who want to discuss the current preparation structure and study needs.",
    },
    icse: {
      name: "ICSE Commerce",
      shortName: "ICSE",
      overview: "School-level academic support shaped around the learner’s current needs and study goals.",
      audience: "ICSE learners and parents looking to discuss the learner’s class, subjects, and academic support needs.",
    },
  };
  let lastFocusedElement = null;
  let activeModal = null;

  function setHeaderState() {
    $(".site-header")?.classList.toggle("scrolled", window.scrollY > 20);
  }
  function setMenu(open) {
    const button = $(".menu-toggle");
    const panel = $(".navigation-panel");
    if (!button || !panel) return;
    panel.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute(
      "aria-label",
      open ? "Close navigation menu" : "Open navigation menu",
    );
    document.body.classList.toggle("menu-open", open);
  }
  function openModal(modal = $("#enquiry-modal")) {
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    activeModal = modal;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    $("input, select, textarea, button", modal)?.focus();
  }
  function closeModal() {
    if (!activeModal) return;
    activeModal.hidden = true;
    activeModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    lastFocusedElement?.focus?.();
    lastFocusedElement = null;
    activeModal = null;
  }
  // Keep the public names used by the original enquiry triggers available.
  window.openEnquiry = openModal;
  window.closeEnquiry = closeModal;

  function initActiveNavigation() {
    const current = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    $$(".navigation-list a").forEach((link) => {
      const target = (link.getAttribute("href") || "").split("#")[0].split("/").pop().toLowerCase();
      const isCurrent = target === current || (current === "" && target === "index.html");
      link.toggleAttribute("aria-current", isCurrent);
      if (isCurrent) link.setAttribute("aria-current", "page");
    });
  }

  function initFloatingEnquiry() {
    if ($(".floating-enquiry")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "floating-enquiry";
    button.setAttribute("aria-label", "Open enquiry form");
    button.innerHTML = '<span class="floating-enquiry-dot" aria-hidden="true"></span><span>Enquire</span>';
    button.addEventListener("click", () => openModal());
    document.body.append(button);
  }

  function whatsappUrl(course = "") {
    const message = course
      ? `Hi ANCA, I would like to enquire about the ${course} course.`
      : "Hi ANCA, I would like to enquire about your courses.";
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  function initWhatsAppLinks() {
    $$('[data-whatsapp-link]').forEach((link) => {
      const course = link.dataset.course || "";
      link.href = whatsappUrl(course);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
    $$(".course-card").forEach((card) => {
      if ($(".course-whatsapp-link", card)) return;
      const course = $("h3", card)?.textContent.trim() || "";
      const actions = $(".card-actions", card);
      if (!actions || !course) return;
      const link = document.createElement("a");
      link.className = "button button-small button-whatsapp course-whatsapp-link";
      link.dataset.whatsappLink = "true";
      link.dataset.course = course;
      link.href = whatsappUrl(course);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "WhatsApp";
      actions.append(link);
    });
    if ($(".floating-whatsapp")) return;
    const floating = document.createElement("a");
    floating.className = "floating-whatsapp";
    floating.href = whatsappUrl();
    floating.target = "_blank";
    floating.rel = "noopener noreferrer";
    floating.setAttribute("aria-label", "Chat with ANCA on WhatsApp");
    floating.innerHTML = '<span aria-hidden="true">◌</span><span>WhatsApp</span>';
    document.body.append(floating);
  }

  function initCourseLanding() {
    if (!$("#course-catalogue")) return;
    $$("[data-course-card] .text-link").forEach((link) => {
      const card = link.closest("[data-course-card]");
      const key = card?.id;
      if (!key || !COURSE_DETAILS[key]) return;
      link.textContent = "View details";
      link.href = `courses.html?course=${encodeURIComponent(key)}#course-detail`;
    });
    const key = new URLSearchParams(window.location.search).get("course") || window.location.hash.slice(1);
    const detail = COURSE_DETAILS[key];
    if (!detail) return;
    const pageHero = $(".page-hero");
    const pageTitle = $(".page-hero h1");
    const pageDescription = $(".page-hero .hero-description");
    if (pageTitle) pageTitle.textContent = detail.name;
    if (pageDescription) pageDescription.textContent = detail.overview;
    document.title = `${detail.name} | ANCA — Abhishek Naag Coaching Academy`;
    const description = `${detail.overview} Discuss the pathway with ANCA in Kopar Khairane, Navi Mumbai.`;
    $("meta[name=description]")?.setAttribute("content", description);
    $("link[rel=canonical]")?.setAttribute("href", `https://ancaeducation.in/courses.html?course=${encodeURIComponent(key)}`);
    $("meta[property='og:title']")?.setAttribute("content", document.title);
    $("meta[property='og:description']")?.setAttribute("content", description);
    const structuredData = document.createElement("script");
    structuredData.type = "application/ld+json";
    structuredData.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Course",
      name: detail.name,
      description,
      provider: { "@type": "EducationalOrganization", name: "Abhishek Naag Coaching Academy", url: "https://ancaeducation.in/" },
    });
    document.head.append(structuredData);
    const actions = document.createElement("div");
    actions.className = "hero-actions course-hero-actions";
    actions.innerHTML = `<button class="button button-primary course-enquiry-trigger" type="button" data-course="${detail.shortName}">Enquire for ${detail.shortName}</button><a class="button button-secondary" href="contact.html">Contact ANCA</a>`;
    pageDescription?.after(actions);
    const section = document.createElement("section");
    section.className = "section course-detail-section";
    section.id = "course-detail";
    section.innerHTML = `<div class="section-inner"><div class="course-detail-grid"><article class="course-detail-card"><p class="section-label">Course overview</p><h2>Build the next step with clarity.</h2><p>${detail.overview}</p></article><article class="course-detail-card"><p class="section-label">Who is this for?</p><h2>A conversation for the right learner.</h2><p>${detail.audience}</p></article></div><div class="course-detail-grid"><article class="course-detail-card"><p class="section-label">Subjects & curriculum</p><h2>Discuss the current academic structure.</h2><p>Course-specific subjects, syllabus details, and current availability are not published in the repository. Contact ANCA to confirm what is currently offered.</p><a class="text-link" href="contact.html">Ask ANCA about the curriculum</a></article><article class="course-detail-card"><p class="section-label">Learning approach</p><h2>Concepts, practice, and support.</h2><p>ANCA’s documented approach brings concept clarity, regular practice, personal attention, and exam-focused preparation into one steady rhythm.</p></article></div><div class="course-detail-grid"><article class="course-detail-card"><p class="section-label">Why ANCA</p><h2>Commerce-focused academic guidance.</h2><p>Explore structured pathways, study support, and a convenient Kopar Khairane location without relying on unsupported promises.</p></article><article class="course-detail-card"><p class="section-label">Available resources</p><h2>Continue exploring ANCA.</h2><p>Browse the existing study resources, events, and verified-results-ready information on the website.</p><div class="card-actions"><a class="text-link" href="notes.html">View notes</a><a class="text-link" href="results.html">View results</a></div></article></div><div class="course-faq"><p class="section-label">Course FAQ</p><h2>Questions to discuss with ANCA.</h2><details class="faq-item"><summary>What should I share when I enquire?</summary><div class="faq-answer">Share the learner’s current class, school, course of interest, and the kind of academic support you are looking for.</div></details><details class="faq-item"><summary>Are fees and current availability listed?</summary><div class="faq-answer">Fees and current availability are not published in the repository. Contact ANCA for the latest information.</div></details><details class="faq-item"><summary>How do I take the next step?</summary><div class="faq-answer">Use the enquiry form or contact ANCA to discuss the pathway and the learner’s current needs.</div></details></div><div class="course-detail-cta"><h2>Ready to discuss ${detail.shortName}?</h2><p>Start with a genuine question about the learner’s next academic step.</p><button class="button button-primary course-enquiry-trigger" type="button" data-course="${detail.shortName}">Enquire for ${detail.shortName}</button></div></div>`;
    pageHero?.after(section);
    $$(".course-enquiry-trigger", section).forEach((button) => button.addEventListener("click", () => openCourseEnquiry(button)));
    section.querySelectorAll("details").forEach((item) => item.addEventListener("toggle", () => {
      if (item.open) section.querySelectorAll("details").forEach((other) => { if (other !== item) other.open = false; });
    }));
  }

  function initExtendedFormFields() {
    const fields = [
      { name: "whatsapp", label: "WhatsApp number", type: "tel", placeholder: "Optional" },
      { name: "email", label: "Email address", type: "email", placeholder: "Optional" },
      { name: "previous-class", label: "Previous class", type: "text", placeholder: "e.g. 10th" },
      { name: "school", label: "School", type: "text", placeholder: "School name" },
    ];
    $$('form[data-static-form]').forEach((form) => {
      if (form.querySelector('[name="whatsapp"]')) return;
      const messageField = form.querySelector('[name="message"]')?.closest(".form-field");
      if (!messageField) return;
      const fragment = document.createDocumentFragment();
      fields.forEach(({ name, label, type, placeholder }) => {
        const field = document.createElement("div");
        field.className = "form-field";
        const id = `${name}-${Math.random().toString(36).slice(2, 7)}`;
        field.innerHTML = `<label for="${id}">${label}</label><input id="${id}" name="${name}" type="${type}" placeholder="${placeholder}" autocomplete="off" />`;
        fragment.append(field);
      });
      messageField.before(fragment);
    });
  }
  function setFieldError(field, message) {
    field.setAttribute("aria-invalid", "true");
    let error = $(`.field-error[data-for="${field.id}"]`, field.form);
    if (!error) {
      error = document.createElement("small");
      error.className = "field-error";
      error.dataset.for = field.id;
      field.parentElement?.append(error);
    }
    error.textContent = message;
  }
  function clearFieldError(field) {
    field.removeAttribute("aria-invalid");
    $(`.field-error[data-for="${field.id}"]`, field.form)?.remove();
  }
  function validateForm(form) {
    let valid = true;
    const namePattern = /^[\p{L} .'-]{2,}$/u;
    const phonePattern = /^(?:\+91[- ]?)?[6-9]\d{9}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    $$("input, select, textarea", form).forEach((field) => {
      clearFieldError(field);
      const value = field.value.trim();
      if (field.required && !value) {
        setFieldError(field, "This field is required.");
        valid = false;
      } else if (
        value &&
        /student|parent|name/i.test(field.name + field.id) &&
        !namePattern.test(value)
      ) {
        setFieldError(field, "Please enter a valid name.");
        valid = false;
      } else if (
        value &&
        /phone|whatsapp/i.test(field.name + field.id) &&
        !phonePattern.test(value.replace(/[()\s-]/g, ""))
      ) {
        setFieldError(field, "Please enter a valid Indian mobile number.");
        valid = false;
      } else if (value && field.type === "email" && !emailPattern.test(value)) {
        setFieldError(field, "Please enter a valid email address.");
        valid = false;
      }
    });
    return valid;
  }
  function submitStaticForm(form) {
    if (form.dataset.submitting === "true") return;
    if (!validateForm(form)) {
      $('[aria-invalid="true"]', form)?.focus();
      return;
    }
    form.dataset.submitting = "true";
    const submit = $('[type="submit"]', form);
    const status = $(".form-status", form);
    const selectedCourse = $('[name="course"]', form)?.value || "";
    const original = submit?.textContent || "Send enquiry";
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Preparing…";
      submit.classList.add("is-loading");
    }
    if (status) status.textContent = "Preparing your enquiry…";
    window.setTimeout(() => {
      form.reset();
      if (status)
        status.textContent =
          "Thank you. Your enquiry is ready to be reviewed by the ANCA team. We will follow up using the details you provided.";
      $(".success-actions", form)?.remove();
      const actions = document.createElement("div");
      actions.className = "success-actions";
      actions.innerHTML = `<a class="button button-whatsapp" href="${whatsappUrl(selectedCourse)}" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a><a class="button button-secondary" href="${selectedCourse ? "courses.html#course-catalogue" : "courses.html"}">Return to Courses</a>`;
      form.append(actions);
      if (submit) {
        submit.disabled = false;
        submit.textContent = original;
        submit.classList.remove("is-loading");
      }
      form.dataset.submitting = "false";
    }, 450);
  }
  function initFilters() {
    const groups = [
      {
        button: "[data-filter-category]",
        card: "[data-course-card]",
        key: "category",
        empty: "[data-empty-courses]",
      },
      {
        button: "[data-filter-event]",
        card: "[data-event-card]",
        key: "category",
        empty: "[data-empty-events]",
      },
      {
        button: "[data-filter-resource]",
        card: "[data-resource-card]",
        key: "type",
        empty: "[data-empty-resources]",
      },
    ];
    groups.forEach((group) => {
      const buttons = $$(group.button),
        cards = $$(group.card);
      if (!buttons.length || !cards.length) return;
      buttons.forEach((button) =>
        button.addEventListener("click", () => {
          const selected = button.dataset[group.key];
          buttons.forEach((item) => {
            const active = item === button;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-pressed", String(active));
          });
          let visible = 0;
          cards.forEach((card) => {
            const show =
              selected === "all" ||
              (card.dataset[group.key] || "").split(" ").includes(selected);
            card.classList.toggle("hidden", !show);
            if (show) visible += 1;
          });
          $(group.empty)?.classList.toggle("hidden", visible > 0);
        }),
      );
    });
  }
  function initResourceSearch() {
    const input = $("#resource-search");
    const cards = $$("[data-resource-card]");
    if (!input || !cards.length) return;
    input.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach((card) => {
        const show = !query || card.textContent.toLowerCase().includes(query);
        card.classList.toggle("hidden", !show);
        if (show) visible += 1;
      });
      $("[data-empty-resources]")?.classList.toggle("hidden", visible > 0);
    });
  }
  function initFaq() {
    $$(".faq-item").forEach((item) => {
      const summary = $("summary", item),
        answer = $(".faq-answer", item);
      if (!summary || !answer) return;
      if (!answer.id)
        answer.id = `faq-answer-${Math.random().toString(36).slice(2)}`;
      summary.setAttribute("aria-controls", answer.id);
      summary.setAttribute("aria-expanded", String(item.open));
      item.addEventListener("toggle", () => {
        summary.setAttribute("aria-expanded", String(item.open));
        if (item.open)
          $$(".faq-item", item.closest(".faq-list"))
            .filter((other) => other !== item)
            .forEach((other) => {
              other.open = false;
            });
      });
    });
    const search = $("#faq-search");
    search?.addEventListener("input", () => {
      const query = search.value.trim().toLowerCase();
      $$(".faq-item").forEach((item) =>
        item.classList.toggle(
          "hidden",
          Boolean(query) && !item.textContent.toLowerCase().includes(query),
        ),
      );
    });
  }
  function initReveal() {
    const elements = $$(".reveal");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.1 },
    );
    elements.forEach((element) => observer.observe(element));
  }
  function trapModalFocus(event) {
    if (!activeModal || event.key !== "Tab") return;
    const focusable = $$(
      "button, input, select, textarea, a[href]",
      activeModal,
    ).filter((item) => !item.disabled);
    if (!focusable.length) return;
    const first = focusable[0],
      last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openCourseEnquiry(button) {
    const modal = $("#enquiry-modal");
    const course = $("#modal-course", modal);
    if (course && button.dataset.course) course.value = button.dataset.course;
    openModal(modal);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setHeaderState();
    initActiveNavigation();
    initExtendedFormFields();
    initFloatingEnquiry();
    initWhatsAppLinks();
    initCourseLanding();
    window.addEventListener("scroll", setHeaderState, { passive: true });
    $(".menu-toggle")?.addEventListener("click", () =>
      setMenu(!$(".navigation-panel")?.classList.contains("is-open")),
    );
    $$(".navigation-panel a").forEach((link) =>
      link.addEventListener("click", () => setMenu(false)),
    );
    document.addEventListener("click", (event) => {
      const panel = $(".navigation-panel"),
        menu = $(".menu-toggle");
      if (
        panel?.classList.contains("is-open") &&
        !panel.contains(event.target) &&
        !menu?.contains(event.target)
      )
        setMenu(false);
    });
    $$(
      "[data-open-modal], .enquiry-trigger, .nav-enquiry-trigger, .course-enquiry-trigger",
    ).forEach((button) =>
      button.addEventListener("click", () =>
        button.classList.contains("course-enquiry-trigger")
          ? openCourseEnquiry(button)
          : openModal(),
      ),
    );
    $$(".modal-close, .modal-close-action").forEach((button) =>
      button.addEventListener("click", closeModal),
    );
    $("#enquiry-modal")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setMenu(false);
        closeModal();
      }
      trapModalFocus(event);
    });
    $$("form[data-static-form]").forEach((form) => {
      form.addEventListener("input", (event) => clearFieldError(event.target));
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        submitStaticForm(form);
      });
    });
    initFilters();
    initResourceSearch();
    initFaq();
    initReveal();
  });
})();
