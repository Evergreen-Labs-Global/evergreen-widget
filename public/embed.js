/**
 * HealthyFarm embed script
 *
 * Webflow / any host page:
 *   <div id="app"></div>
 *   <script src="https://YOUR_DOMAIN/embed.js" async></script>
 *
 * Optional:
 *   <div id="app" data-src="https://YOUR_DOMAIN/widget" data-height="900"></div>
 */
(function () {
  var TARGET_ID = "app";
  var DEFAULT_PATH = "/widget";

  function scriptOrigin() {
    var current = document.currentScript;
    if (current && current.src) {
      try {
        return new URL(current.src).origin;
      } catch (e) {}
    }
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || "";
      if (src.indexOf("embed.js") !== -1) {
        try {
          return new URL(src).origin;
        } catch (e) {}
      }
    }
    return window.location.origin;
  }

  function mount() {
    var el = document.getElementById(TARGET_ID);
    if (!el) {
      console.warn(
        "[HealthyFarm] No #app element found. Add <div id=\"app\"></div> before this script.",
      );
      return;
    }
    if (el.getAttribute("data-hf-mounted") === "1") return;

    var origin = scriptOrigin();
    var src = el.getAttribute("data-src") || origin + DEFAULT_PATH;
    var height = el.getAttribute("data-height") || "920";

    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = "HealthyFarm Market Intelligence";
    iframe.style.width = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.style.minHeight = height + "px";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    iframe.setAttribute(
      "allow",
      "clipboard-write; fullscreen",
    );

    el.innerHTML = "";
    el.appendChild(iframe);
    el.setAttribute("data-hf-mounted", "1");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
