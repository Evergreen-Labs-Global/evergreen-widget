/**
 * HealthyFarm embed script
 *
 * Webflow / any host page body:
 *   <div id="app"></div>
 *   <script src="https://YOUR_DOMAIN/embed.js" async></script>
 *
 * Language:
 *   - Auto: if the page URL contains "vi-vn" → Vietnamese
 *   - Override: <div id="app" data-lang="vi"></div> or data-lang="en"
 *
 * Optional:
 *   <div id="app" data-src="https://YOUR_DOMAIN/widget" data-height="920"></div>
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

  function detectLang(el) {
    var explicit = (el.getAttribute("data-lang") || "").toLowerCase().trim();
    if (explicit === "vi" || explicit === "vn" || explicit === "vi-vn") return "vi";
    if (explicit === "en") return "en";
    var href = (window.location.href || "").toLowerCase();
    if (href.indexOf("/vi-vn") !== -1 || href.indexOf("vi-vn") !== -1) return "vi";
    return "en";
  }

  function withLang(url, lang) {
    try {
      var u = new URL(url, window.location.href);
      u.searchParams.set("lang", lang);
      return u.toString();
    } catch (e) {
      var join = url.indexOf("?") === -1 ? "?" : "&";
      return url + join + "lang=" + encodeURIComponent(lang);
    }
  }

  function mount() {
    var el = document.getElementById(TARGET_ID);
    if (!el) {
      console.warn(
        '[HealthyFarm] No #app element found. Add <div id="app"></div> before this script.',
      );
      return;
    }
    if (el.getAttribute("data-hf-mounted") === "1") return;

    var origin = scriptOrigin();
    var lang = detectLang(el);
    var base = el.getAttribute("data-src") || origin + DEFAULT_PATH;
    var src = withLang(base, lang);
    var height = el.getAttribute("data-height") || "920";

    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title =
      lang === "vi"
        ? "Thông tin thị trường HealthyFarm"
        : "HealthyFarm Market Intelligence";
    iframe.style.width = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.style.minHeight = height + "px";
    iframe.style.background = "transparent";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    iframe.setAttribute("allow", "clipboard-write; fullscreen");
    iframe.setAttribute("scrolling", "no");

    el.innerHTML = "";
    el.appendChild(iframe);
    el.setAttribute("data-hf-mounted", "1");
    el.setAttribute("data-hf-lang", lang);

    window.addEventListener("message", function (event) {
      var data = event.data;
      if (!data || data.source !== "healthyfarm-market") return;
      if (data.type === "resize" && typeof data.height === "number") {
        iframe.style.height = Math.max(data.height, 400) + "px";
        iframe.style.minHeight = "0";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
