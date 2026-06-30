/* =========================================
   Ember & Iron — Dark Theme JS
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ------------------------------------------------------------------
  // Mobile nav toggle
  // ------------------------------------------------------------------
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    if (!links.id) links.id = "primary-navigation";
    toggle.setAttribute("aria-controls", links.id);
    const setExpanded = (open) => {
      toggle.classList.toggle("open", open);
      links.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    toggle.addEventListener("click", () => {
      setExpanded(!toggle.classList.contains("open"));
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => setExpanded(false))
    );
    links.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        setExpanded(false);
        toggle.focus();
      }
    });
  }

  // ------------------------------------------------------------------
  // Fade-in observer
  // ------------------------------------------------------------------
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

  initSlider();
  initLightbox();
  initCookieBanner();
  initSignupForm();

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
});

/* =========================================
   Reviews carousel
   ========================================= */
function initSlider() {
  const track = document.querySelector(".slider-track");
  if (!track) return;
  if (!track.id) track.id = "reviews-slider-track";

  const slides = track.querySelectorAll(".review-card");
  const dotsContainer = document.querySelector(".slider-dots");
  const prevBtn = document.querySelector(".slider-prev");
  const nextBtn = document.querySelector(".slider-next");
  const pauseBtn = document.querySelector(".slider-pause");
  if (!slides.length) return;

  let index = 0;
  let intervalId = null;
  let userPaused = false;

  // Build dot buttons (replaces any span versions)
  if (dotsContainer) {
    dotsContainer.innerHTML = "";
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Go to review ${i + 1}`);
      dot.setAttribute("aria-controls", track.id);
      if (i === 0) {
        dot.classList.add("active");
        dot.setAttribute("aria-current", "true");
      }
      dot.addEventListener("click", () => goTo(i));
      dotsContainer.appendChild(dot);
    });
  }

  slides.forEach((slide, i) => {
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", `${i + 1} of ${slides.length}`);
  });

  // Wire prev/next aria-controls
  [prevBtn, nextBtn, pauseBtn].forEach((b) => {
    if (b && !b.getAttribute("aria-controls")) b.setAttribute("aria-controls", track.id);
  });

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
    if (dotsContainer) {
      dotsContainer.querySelectorAll("button").forEach((d, i) => {
        d.classList.toggle("active", i === index);
        if (i === index) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
    }
  }
  function goTo(i) {
    index = (i + slides.length) % slides.length;
    update();
    if (!userPaused) resetAuto();
  }
  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  prevBtn && prevBtn.addEventListener("click", prev);
  nextBtn && nextBtn.addEventListener("click", next);

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function startAuto() {
    if (prefersReducedMotion || userPaused) return;
    stopAuto();
    intervalId = setInterval(next, 7000);
  }
  function stopAuto() {
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
  }
  function resetAuto() { stopAuto(); startAuto(); }
  startAuto();

  // Visible pause/play toggle (WCAG 2.2.2 — Pause, Stop, Hide)
  if (pauseBtn) {
    const setPaused = (paused) => {
      userPaused = paused;
      pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
      pauseBtn.setAttribute(
        "aria-label",
        paused ? "Resume auto-rotating reviews" : "Pause auto-rotating reviews"
      );
      const icon = pauseBtn.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-pause", !paused);
        icon.classList.toggle("fa-play", paused);
      }
      if (paused) stopAuto();
      else startAuto();
    };
    pauseBtn.addEventListener("click", () => setPaused(!userPaused));
  }

  const slider = document.querySelector(".slider");
  if (slider) {
    slider.addEventListener("mouseenter", stopAuto);
    slider.addEventListener("mouseleave", () => { if (!userPaused) startAuto(); });
    slider.addEventListener("focusin", stopAuto);
    slider.addEventListener("focusout", () => { if (!userPaused) startAuto(); });

    slider.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "Home") { e.preventDefault(); goTo(0); }
      else if (e.key === "End") { e.preventDefault(); goTo(slides.length - 1); }
    });
  }

  let startX = 0;
  track.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
  track.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) diff > 0 ? prev() : next();
  });
}

/* =========================================
   Lightbox (gallery) — proper focus trap
   ========================================= */
function initLightbox() {
  const items = document.querySelectorAll(".gallery-item");
  if (!items.length) return;

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Image viewer");
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = `
    <button class="lightbox-close" aria-label="Close image viewer" type="button">&times;</button>
    <img alt="" tabindex="0" />
  `;
  document.body.appendChild(lightbox);

  const img = lightbox.querySelector("img");
  const close = lightbox.querySelector(".lightbox-close");
  let lastFocused = null;

  const focusable = () => [close, img].filter((el) => el && !el.hasAttribute("disabled"));

  const openLightbox = (src, alt) => {
    lastFocused = document.activeElement;
    img.src = src;
    img.alt = alt || "";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    close.focus();
  };
  const closeLightbox = () => {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  };

  items.forEach((item) => {
    if (item.tagName !== "BUTTON" && !item.hasAttribute("tabindex")) {
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
    }
    const trigger = () => {
      const imgEl = item.querySelector("img");
      if (!imgEl) return;
      openLightbox(imgEl.currentSrc || imgEl.src, imgEl.alt);
    };
    item.addEventListener("click", trigger);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        trigger();
      }
    });
  });
  close.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Proper focus trap: cycle between close and image
  lightbox.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") { e.preventDefault(); closeLightbox(); return; }
    if (e.key !== "Tab") return;
    const list = focusable();
    if (list.length < 2) { e.preventDefault(); return; }
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

/* =========================================
   Cookie banner
   ========================================= */
function initCookieBanner() {
  const banner = document.querySelector(".cookie-banner");
  if (!banner) return;
  const key = "ei_cookie_consent";
  const existing = localStorage.getItem(key);
  if (!existing) setTimeout(() => banner.classList.add("show"), 800);

  banner.querySelectorAll("[data-consent]").forEach((btn) =>
    btn.addEventListener("click", () => {
      localStorage.setItem(key, btn.dataset.consent);
      banner.classList.remove("show");
    })
  );
}

/* =========================================
   Subscribe form — accessible validation
   ========================================= */
function initSignupForm() {
  const form = document.querySelector(".signup-form");
  if (!form) return;

  const inputs = form.querySelectorAll("input[required]");

  // Clear error state when user starts typing/checking
  inputs.forEach((input) => {
    input.addEventListener("input", () => clearError(input));
    input.addEventListener("change", () => clearError(input));
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.querySelector("input[type='email']");
    const consent = form.querySelector("input[name='marketingConsent']");
    const msg = form.querySelector(".form-msg") || form.parentElement.querySelector(".form-msg");

    // Wipe previous error states
    inputs.forEach(clearError);

    // Validate email
    if (!email || !email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      flagError(email, msg, "Please enter a valid email address.");
      email && email.focus();
      return;
    }
    // Validate consent
    if (consent && !consent.checked) {
      flagError(consent, msg, "Please agree to receive marketing messages to continue.");
      consent.focus();
      return;
    }
    // Success
    if (msg) {
      msg.textContent = `Confirmed. Promos incoming to ${email.value}.`;
      msg.setAttribute("role", "status");
      msg.removeAttribute("aria-invalid");
    }
    form.reset();
  });

  function flagError(input, msg, message) {
    if (input) {
      input.setAttribute("aria-invalid", "true");
      if (msg && msg.id) input.setAttribute("aria-describedby", msg.id);
      else if (msg) {
        if (!msg.id) msg.id = "form-msg-" + Math.random().toString(36).slice(2, 8);
        input.setAttribute("aria-describedby", msg.id);
      }
    }
    if (msg) {
      msg.textContent = message;
      msg.setAttribute("role", "alert");
    }
  }
  function clearError(input) {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  }
}
