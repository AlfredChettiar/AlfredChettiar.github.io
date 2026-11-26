/* Alfred Chettiar — portfolio interactions (vanilla JS, no dependencies).
   The page works fully without this file; it only adds copy-to-clipboard
   and the one-time Figure 1 animation. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Masthead rule once the page scrolls ---------- */
  var masthead = document.querySelector(".masthead");
  function onScroll() {
    if (masthead) masthead.classList.toggle("is-scrolled", window.scrollY > 4);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Copy email ---------- */
  var toast = document.getElementById("toast");
  var toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 2200);
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
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return legacyCopy(text); }
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  Array.prototype.forEach.call(document.querySelectorAll(".copy-btn"), function (btn) {
    var label = btn.textContent;
    var resetTimer;
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      copyText(text).then(function (ok) {
        if (!ok) return showToast("Copy failed. Email: " + text);
        btn.textContent = "Copied";
        btn.classList.add("is-copied");
        showToast("Email address copied");
        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () {
          btn.textContent = label;
          btn.classList.remove("is-copied");
        }, 2000);
      });
    });
  });

  /* ---------- Figure 1: reproduced values travel from the published ones ---------- */
  // Without JS, or with reduced motion, the figure simply shows its final state.
  var fig = document.getElementById("fig-r2");
  if (fig && "IntersectionObserver" in window && !reduceMotion.matches) {
    fig.classList.add("is-armed");
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      fig.classList.add("is-playing");
      io.disconnect();
    }, { threshold: 0.45 });
    io.observe(fig);
  }
})();
