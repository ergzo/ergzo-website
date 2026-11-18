/*!
 * Ergzo analytics consent gate
 * ---------------------------------------------------------------------------
 * Microsoft Clarity loads ONLY after the visitor accepts. No tracking script,
 * no cookie, is created before that click.
 *
 * Vanilla JS, no dependencies, no build step. Font is inherited so the page's
 * Inter is used throughout and no second family is ever introduced.
 *
 * Public API (used by the "change preference" button in privacy.html):
 *   window.ergzoConsent.status()  -> "granted" | "denied" | "unset"
 *   window.ergzoConsent.reset()   -> clears the choice, removes Clarity
 *                                    cookies, and shows the banner again
 */
(function () {
  "use strict";

  var CLARITY_ID = "zf3j7d0ic8";
  var KEY = "ergzo-consent-v1";

  /* localStorage throws in some privacy modes - never let that break the page.
     When it is unavailable the choice simply lasts for this page view only. */
  var memory = null;

  function read() {
    try {
      return window.localStorage.getItem(KEY) || memory;
    } catch (e) {
      return memory;
    }
  }

  function write(value) {
    memory = value;
    try {
      window.localStorage.setItem(KEY, value);
    } catch (e) {
      /* session-only fallback */
    }
    announce();
  }

  /* Lets any page react to a change without polling - privacy.html uses this
     to keep its "your current choice" line accurate after the banner is used. */
  function announce() {
    try {
      document.dispatchEvent(
        new CustomEvent("ergzo:consent", { detail: { status: read() || "unset" } })
      );
    } catch (e) {}
  }

  function clear() {
    memory = null;
    try {
      window.localStorage.removeItem(KEY);
    } catch (e) {}
    announce();
  }

  /* Withdrawal has to actually remove what was set, otherwise "decline" is
     cosmetic. These are Clarity's first-party cookies, so we can expire them. */
  function dropClarityCookies() {
    var names = ["_clck", "_clsk"];
    var host = location.hostname;
    var domains = [host, "." + host];
    if (host.indexOf("www.") === 0) {
      domains.push(host.slice(4), "." + host.slice(4));
    }
    names.forEach(function (name) {
      domains.forEach(function (domain) {
        document.cookie =
          name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" + domain;
      });
      document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    });
  }

  var clarityLoaded = false;

  function loadClarity() {
    if (clarityLoaded || document.getElementById("ez-clarity")) return;
    clarityLoaded = true;
    (function (c, l, a, r, i) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      var t = l.createElement(r);
      t.async = 1;
      t.id = "ez-clarity";
      t.src = "https://www.clarity.ms/tag/" + i;
      var y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }

  /* Defer to window load so analytics can never compete with render. */
  function loadClarityWhenIdle() {
    if (document.readyState === "complete") {
      loadClarity();
    } else {
      window.addEventListener("load", loadClarity);
    }
  }

  var STYLE = [
    ".ez-consent{position:fixed;left:0;right:0;bottom:0;z-index:9999;",
    "padding:0 max(16px,4%) max(16px,4%);pointer-events:none;}",
    ".ez-consent__card{pointer-events:auto;box-sizing:border-box;",
    "max-width:1100px;margin:0 auto;background:#fff;",
    "border:1px solid #d6e2e2;border-radius:.75rem;",
    "box-shadow:0 10px 36px rgba(35,45,66,.1);",
    "padding:1.125rem 1.25rem;display:flex;flex-wrap:wrap;align-items:center;",
    "gap:.875rem 1.25rem;font:inherit;}",
    ".ez-consent__text{flex:1 1 320px;min-width:0;margin:0;",
    "font-size:.9375rem;line-height:1.55;color:#354463;}",
    ".ez-consent__text a{color:#232d42;text-decoration:underline;",
    "text-underline-offset:2px;}",
    ".ez-consent__text a:hover{color:#354463;}",
    ".ez-consent__actions{flex:0 0 auto;display:flex;flex-wrap:wrap;gap:.625rem;}",
    ".ez-consent__btn{font:inherit;font-size:.9375rem;font-weight:600;",
    /* 14px block padding keeps the hit area at 45px, above the 44px
       touch-target minimum, without changing the type scale. */
    "line-height:1;padding:.875rem 1.25rem;border-radius:.5rem;",
    "border:1px solid #232d42;cursor:pointer;white-space:nowrap;",
    "transition:background 180ms cubic-bezier(.16,1,.3,1),",
    "color 180ms cubic-bezier(.16,1,.3,1);}",
    ".ez-consent__btn--accept{background:#232d42;color:#fff;}",
    ".ez-consent__btn--accept:hover{background:#354463;}",
    ".ez-consent__btn--decline{background:#fff;color:#232d42;}",
    ".ez-consent__btn--decline:hover{background:#f4f7f7;}",
    ".ez-consent__btn:focus-visible{outline:2px solid #232d42;outline-offset:2px;}",
    ".ez-consent__card:focus{outline:none;}",
    "@media (max-width:560px){",
    ".ez-consent__actions{width:100%;}",
    ".ez-consent__btn{flex:1 1 0;text-align:center;}}",
    "@media (prefers-reduced-motion:no-preference){",
    "@keyframes ez-consent-in{from{opacity:0;transform:translateY(12px)}",
    "to{opacity:1;transform:none}}",
    ".ez-consent__card{animation:ez-consent-in 220ms cubic-bezier(.16,1,.3,1) both;}}"
  ].join("");

  var banner = null;

  function hide() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
  }

  function show() {
    if (banner) return;

    if (!document.getElementById("ez-consent-style")) {
      var style = document.createElement("style");
      style.id = "ez-consent-style";
      style.textContent = STYLE;
      document.head.appendChild(style);
    }

    banner = document.createElement("div");
    banner.className = "ez-consent";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Analytics cookie consent");

    var card = document.createElement("div");
    card.className = "ez-consent__card";
    card.setAttribute("tabindex", "-1");

    var text = document.createElement("p");
    text.className = "ez-consent__text";
    text.innerHTML =
      "We’d like to use Microsoft Clarity to see how this site is used, so we " +
      "can improve it. It sets analytics cookies and records how pages are " +
      "navigated. We run no advertising or tracking cookies. See our " +
      '<a href="/privacy.html#analytics">Privacy Policy</a>.';

    var actions = document.createElement("div");
    actions.className = "ez-consent__actions";

    var decline = document.createElement("button");
    decline.type = "button";
    decline.className = "ez-consent__btn ez-consent__btn--decline";
    decline.textContent = "Decline";

    var accept = document.createElement("button");
    accept.type = "button";
    accept.className = "ez-consent__btn ez-consent__btn--accept";
    accept.textContent = "Accept";

    decline.addEventListener("click", function () {
      write("denied");
      dropClarityCookies();
      hide();
    });

    accept.addEventListener("click", function () {
      write("granted");
      hide();
      loadClarity();
    });

    /* Decline first in the DOM so it is never the harder option to reach,
       by pointer or by keyboard. Both buttons are the same size and weight. */
    actions.appendChild(decline);
    actions.appendChild(accept);
    card.appendChild(text);
    card.appendChild(actions);
    banner.appendChild(card);
    document.body.appendChild(banner);

    /* The banner is appended last, so without this a keyboard or screen reader
       user would only reach a decision they must make at the very end. */
    try {
      card.focus({ preventScroll: true });
    } catch (e) {}
  }

  window.ergzoConsent = {
    status: function () {
      return read() || "unset";
    },
    reset: function () {
      clear();
      dropClarityCookies();
      show();
    }
  };

  var choice = read();
  if (choice === "granted") {
    loadClarityWhenIdle();
  } else if (choice !== "denied") {
    show();
  }
})();
