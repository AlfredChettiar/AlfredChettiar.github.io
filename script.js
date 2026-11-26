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
  // Hot spot (amber) to far field (cyan), like a stress contour legend
  function mix(t) {
    var a = [240, 160, 32], b = [14, 159, 191];
    return "rgb(" + a.map(function (v, k) { return Math.round(v + (b[k] - v) * t); }).join(",") + ")";
  }
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
      path.setAttribute("pathLength", "1");
      path.setAttribute("stroke", mix(l / levels));
      path.setAttribute("stroke-opacity", (0.95 - 0.5 * l / levels).toFixed(2));
      path.style.setProperty("--i", String(l));
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
      if (match) shown++;
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
      var run = function () { applyFilter(btn.getAttribute("data-filter"), btn.textContent.trim()); };
      // Cards glide to their new grid slots where View Transitions exist; instant elsewhere
      if (document.startViewTransition && !prefersReducedMotion) document.startViewTransition(run);
      else run();
    });
  });
  cards.forEach(function (card, i) { card.style.viewTransitionName = "card-" + i; });

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
      ".project-card, .pub, .edu"
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
      var sibs = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.transitionDelay = Math.min(sibs, 3) * 70 + "ms";
      el.classList.add("reveal");
      revealObserver.observe(el);
    });
  }

  /* ---------- Smooth in-page navigation (header-offset aware, focus-managed) ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var id = a.getAttribute("href").slice(1);
    var target = id ? document.getElementById(id) : document.body;
    if (!target) return;
    e.preventDefault();
    var top = id ? target.getBoundingClientRect().top + window.pageYOffset -
      (header ? header.offsetHeight : 0) : 0;
    window.scrollTo({ top: Math.max(top, 0), behavior: prefersReducedMotion ? "auto" : "smooth" });
    if (history.pushState) history.pushState(null, "", id ? "#" + id : window.location.pathname);
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });

  /* ---------- Toast + Copy Email ---------- */
  var toastEl = document.getElementById("toast");
  var toastTimer;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2200);
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; },
        function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  Array.prototype.forEach.call(document.querySelectorAll(".copy-btn"), function (btn) {
    var label = btn.querySelector(".copy-label");
    var original = label ? label.textContent : "";
    var resetTimer;
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      copyText(text).then(function (ok) {
        if (ok) {
          btn.classList.add("is-copied");
          if (label) label.textContent = "Copied!";
          showToast("Email copied to clipboard");
          clearTimeout(resetTimer);
          resetTimer = setTimeout(function () {
            btn.classList.remove("is-copied");
            if (label) label.textContent = original;
          }, 2000);
        } else {
          showToast("Copy failed — " + text);
        }
      });
    });
  });

  /* ---------- Architecture & Pipeline modal ---------- */
  var PROJECTS = {
    p1: {
      title: "FRAMED Benchmark: Reproducing a Published Bicycle-Frame Surrogate Study, then Extending It with Physics",
      flow: [
        ["Published dataset", "FRAMED (MIT DeCoDE Lab, Computer-Aided Design 2023): 4,047 community-designed bicycle frames, 39 inputs, each solved in SolidWorks under three load cases with ten recorded outputs."],
        ["Re-derive the paper's claims", "Frame counts, the non-dominated set and the three case-study frames are recomputed from the released data before any model is trained."],
        ["Rebuild the benchmark", "The paper's five regressors are rebuilt with the authors' hyperparameters on 10 \u00d7 5-fold cross-validation; the published ranking is preserved."],
        ["Add physics", "Beam-theory features, log-scaled targets, physical guardrails and 95% intervals, scored on the paper models' exact folds."],
        ["Constrained optimisation", "NSGA-II re-sizes the tubes of titanium frame 3853 for minimum mass and deflection with both safety factors \u2265 1, nominal and robust."]
      ],
      arch: [
        ["Dataset", "4,047 frames; inputs: geometry, 9 tube diameters, 7 wall thicknesses, bridge flags, material; outputs: deflections, rotations, two safety factors, mass"],
        ["Physics features", "Tube area, bending and torsional stiffness (EI, GJ), slenderness, analytic mass \u03c1\u00b7A\u00b7L, yield strength"],
        ["Models", "AutoGluon + physics (best), deep ensemble + physics, physics-guided MLP, XGBoost + physics, Gaussian process + physics"],
        ["Statistics", "Paired folds; Nadeau\u2013Bengio corrected resampled t-test"],
        ["Optimiser", "NSGA-II over 10 variables (outer diameter and wall thickness of the top, down and seat tubes and the stays), D/t \u2264 50, within the dataset's 1st\u201399th percentile"]
      ],
      metrics: [
        ["11 / 11", "Checkable dataset claims in the paper reproduced from the released data"],
        ["0.747", "R\u00b2 of the best model (AutoGluon + physics) vs 0.737 for the best reproduced paper model"],
        ["-13%", "MAE vs the best reproduced paper model on identical folds"],
        ["94.6\u201398.4%", "Held-out frames inside the deep ensemble's 95% intervals"],
        ["-23.8%", "Mass of re-sized titanium frame 3853 at mean SF \u2265 1 (surrogate-predicted)"],
        ["-30.5%", "In-plane deflection of that design (surrogate-predicted)"]
      ],
      note: "The R\u00b2 gain over the best paper model is not significant over 5 folds (p = 0.15). Optimised designs are surrogate predictions, not FE re-verified. The structure is a bicycle frame, not a motorcycle sub-frame."
    },
    p2: {
      title: "RLD-to-PSD Random Vibration Fatigue & Resonance Predictor",
      flow: [
        ["Road-load data (RLD)", "Measured acceleration / load time histories as input."],
        ["Spectral conversion", "SciPy FFT converts time series into power spectral densities."],
        ["1D-CNN inference", "PyTorch 1D-CNN reads PSD profiles to flag resonance and damage."],
        ["Fatigue & resonance output", "Predicted resonance risk and random-vibration fatigue damage."],
        ["Plotly dashboards", "Interactive spectra and damage plots for review."]
      ],
      arch: [
        ["Signal processing", "SciPy FFT / PSD estimation of road-load signals"],
        ["Model", "PyTorch 1D convolutional network over spectral features"],
        ["Visualization", "Plotly interactive PSD and damage views"],
        ["Status", "In development"]
      ],
      metrics: [
        ["Planned", "Benchmark against PSD-based fatigue solver output"],
        ["Planned", "Check resonance prediction against test-bench data"]
      ],
      note: "Project is in development; validation metrics will be published when available."
    },
    p3: {
      title: "3D FEA Mesh-to-Stress Graph Neural Network Surrogate",
      flow: [
        ["FEA model import", "pyNastran reads Nastran meshes, loads and results."],
        ["Mesh-to-graph conversion", "Nodes from grid points, edges from element connectivity."],
        ["Attention message passing", "GATv2 layers learn how neighbouring nodes influence stress."],
        ["Nodal stress prediction", "Stress field predicted directly from geometry and loading."],
        ["Comparison with FEA", "Predicted fields checked against solver results."]
      ],
      arch: [
        ["Graph model", "PyTorch Geometric GATv2 (graph attention) network"],
        ["Data layer", "pyNastran for mesh and result parsing"],
        ["Goal", "Generalize across mesh topologies without re-solving"],
        ["Status", "Upcoming"]
      ],
      metrics: [
        ["Planned", "Nodal stress error versus FEA ground truth"],
        ["Planned", "Generalization to unseen geometries and meshes"]
      ],
      note: "Research is upcoming; no results claimed yet."
    },
    e1: {
      title: "Automated Multi-Tool CAE DVP Pipeline & Centralized Chassis Durability Hub",
      flow: [
        ["Model setup", "Standardized chassis models and load cases per DVP."],
        ["HyperMesh pre-processing", "Tcl/Tk scripts automate meshing, connections and load application."],
        ["OptiStruct solve", "Batch structural analysis runs."],
        ["CAEFatigue assessment", "Durability and fatigue post-processing of solver results."],
        ["Python reporting & hub", "Results consolidated in a centralized chassis durability hub."]
      ],
      arch: [
        ["Orchestration", "Python drives the multi-tool workflow end to end"],
        ["Pre-processing", "Tcl/Tk automation inside HyperMesh"],
        ["Solver", "Altair OptiStruct"],
        ["Fatigue", "CAEFatigue durability analysis"],
        ["Hub", "Centralized repository of chassis durability results"]
      ],
      metrics: [
        ["12+", "Standardized durability DVPs"],
        ["~60%", "Reduction in turnaround time"],
        [">90%", "Virtual-to-physical PSD fatigue correlation"]
      ],
      note: "Proprietary Royal Enfield R&D work; details summarized at a high level."
    }
  };

  var modal = document.getElementById("arch-modal");
  var lastTrigger = null;

  function fillList(parent, items, build) {
    while (parent.firstChild) parent.removeChild(parent.firstChild);
    items.forEach(function (it) { parent.appendChild(build(it)); });
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function openModal(id, trigger) {
    var data = PROJECTS[id];
    if (!modal || !data || typeof modal.showModal !== "function") return;
    lastTrigger = trigger;
    document.getElementById("modal-title").textContent = data.title;
    fillList(document.getElementById("m-flow"), data.flow, function (s) {
      var li = el("li");
      li.appendChild(el("strong", "", s[0]));
      li.appendChild(el("span", "", s[1]));
      return li;
    });
    fillList(document.getElementById("m-arch"), data.arch, function (r) {
      var row = el("div");
      row.appendChild(el("dt", "", r[0]));
      row.appendChild(el("dd", "", r[1]));
      return row;
    });
    fillList(document.getElementById("m-val"), data.metrics, function (m) {
      var li = el("li", m[0] === "Planned" ? "is-planned" : "");
      li.appendChild(el("p", "m-val", m[0]));
      li.appendChild(el("p", "m-label", m[1]));
      return li;
    });
    document.getElementById("m-note").textContent = data.note || "";
    modal.querySelector(".modal-body").scrollTop = 0;
    document.body.classList.add("modal-open");
    modal.showModal();
  }

  if (modal) {
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-modal]");
      if (b) openModal(b.getAttribute("data-modal"), b);
    });
    // Exit plays a short reverse of the entrance before the dialog actually closes
    var closeModal = function () {
      if (!modal.open || modal.classList.contains("is-closing")) return;
      if (prefersReducedMotion) return modal.close();
      modal.classList.add("is-closing");
      setTimeout(function () { modal.classList.remove("is-closing"); modal.close(); }, 180);
    };
    modal.querySelector(".modal-close").addEventListener("click", closeModal);
    modal.addEventListener("cancel", function (e) { e.preventDefault(); closeModal(); });
    // Click on the backdrop (the dialog element itself) closes it
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
    modal.addEventListener("close", function () {
      document.body.classList.remove("modal-open");
      if (lastTrigger) lastTrigger.focus();
    });
  }
})();
