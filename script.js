/* Alfred Chettiar — Portfolio interactions (vanilla JS, no dependencies) */
(function () {
  "use strict";

  var prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Hero contour lines (FEA-style stress iso-lines) ---------- */
  function drawContours() {
    var group = document.getElementById("contour-group");
    if (!group) return;
    var ns = "http://www.w3.org/2000/svg";
    var cx = 600, cy = 220, levels = 14, points = 72;
    var frag = document.createDocumentFragment();

    for (var l = 1; l <= levels; l++) {
      var base = l * 34;
      var d = "";
      for (var i = 0; i <= points; i++) {
        var t = (i / points) * Math.PI * 2;
        // Perturbed ellipse: superposed harmonics give an organic iso-contour look
        var r = base *
          (1 + 0.12 * Math.sin(3 * t + l * 0.35) + 0.06 * Math.cos(5 * t - l * 0.2));
        var x = cx + r * 1.35 * Math.cos(t);
        var y = cy + r * Math.sin(t);
        d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
      }
      var path = document.createElementNS(ns, "path");
      path.setAttribute("d", d + "Z");
      path.setAttribute("stroke-opacity", (1 - l / (levels + 2)).toFixed(2));
      frag.appendChild(path);
    }
    group.appendChild(frag);
  }
  drawContours();

  /* ---------- Sticky header state ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  function closeMenu() {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("is-open", !open);
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".nav")) closeMenu();
    });
  }

  /* ---------- Active nav link on scroll ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-menu a[href^="#"]'));
  if (hasIO && navLinks.length) {
    var linkFor = {};
    navLinks.forEach(function (a) { linkFor[a.getAttribute("href").slice(1)] = a; });
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = linkFor[entry.target.id];
        if (link && entry.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove("is-current"); });
          link.classList.add("is-current");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(linkFor).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) sectionObserver.observe(s);
    });
  }

  /* ---------- Project filtering ---------- */
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll(".filter-btn"));
  var cards = Array.prototype.slice.call(document.querySelectorAll(".project-card"));
  var emptyState = document.querySelector(".empty-state");
  var filterStatus = document.getElementById("filter-status");

  function applyFilter(filter, label) {
    var shown = 0;
    cards.forEach(function (card) {
      var domains = (card.getAttribute("data-domains") || "").split(/\s+/);
      var match = filter === "all" || domains.indexOf(filter) !== -1;
      card.classList.toggle("is-hidden", !match);
      card.classList.remove("is-entering");
      if (match) {
        shown++;
        if (!prefersReducedMotion) {
          void card.offsetWidth; // restart animation
          card.classList.add("is-entering");
        }
      }
    });
    if (emptyState) emptyState.hidden = shown !== 0;
    if (filterStatus) {
      filterStatus.textContent =
        "Showing " + shown + " project" + (shown === 1 ? "" : "s") + " for " + label + ".";
    }
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      applyFilter(btn.getAttribute("data-filter"), btn.textContent.trim());
    });
  });

  /* ---------- Metric count-up ---------- */
  function formatNumber(n, format) {
    return format === "comma" ? n.toLocaleString("en-US") : String(n);
  }

  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var format = el.getAttribute("data-format");
    var duration = 1400;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + formatNumber(Math.round(target * eased), format) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var metricEls = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  if (hasIO && !prefersReducedMotion && metricEls.length) {
    var metricObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    metricEls.forEach(function (el) { metricObserver.observe(el); });
  }

  /* ---------- Reveal on scroll ---------- */
  if (hasIO && !prefersReducedMotion) {
    var revealTargets = document.querySelectorAll(
      ".section-head, .filters, .project-card, .pub, .edu, .contact-inner"
    );
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    Array.prototype.forEach.call(revealTargets, function (el) {
      el.classList.add("reveal");
      revealObserver.observe(el);
    });
  }
})();
