document.documentElement.classList.add("js");

const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
const THEME_KEY = "vibepod-theme";

const getStoredTheme = () => {
  try {
    const value = localStorage.getItem(THEME_KEY);
    if (value === "light" || value === "dark") {
      return value;
    }
  } catch (error) {
    return null;
  }
  return null;
};

const getSystemTheme = () => (themeQuery.matches ? "dark" : "light");

const setTheme = (theme) => {
  root.dataset.theme = theme;
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", theme === "dark" ? "#071120" : "#fff7ed");
  }
  if (themeToggle) {
    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  }
};

setTheme(getStoredTheme() || getSystemTheme());

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch (error) {
      return;
    }
  });
}

const syncSystemTheme = () => {
  if (!getStoredTheme()) {
    setTheme(getSystemTheme());
  }
};

if (typeof themeQuery.addEventListener === "function") {
  themeQuery.addEventListener("change", syncSystemTheme);
} else if (typeof themeQuery.addListener === "function") {
  themeQuery.addListener(syncSystemTheme);
}

const yearNode = document.getElementById("year");
if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const revealNodes = document.querySelectorAll("[data-reveal]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  revealNodes.forEach((node) => node.classList.add("in-view"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      threshold: 0.14,
      rootMargin: "0px 0px -24px 0px"
    }
  );

  revealNodes.forEach((node) => revealObserver.observe(node));
}

const faqItems = Array.from(document.querySelectorAll(".faq details"));
faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) {
      return;
    }

    faqItems.forEach((other) => {
      if (other !== item) {
        other.open = false;
      }
    });
  });
});

const lightbox = document.getElementById("agent-lightbox");
if (lightbox) {
  const lightboxImage = lightbox.querySelector(".lightbox-image");
  const closeButton = lightbox.querySelector(".lightbox-close");
  const triggerImages = Array.from(document.querySelectorAll(".tool-card img"));
  let lastActiveElement = null;
  let currentIndex = -1;

  const showImageAt = (index) => {
    if (index < 0 || index >= triggerImages.length) {
      return;
    }
    const img = triggerImages[index];
    currentIndex = index;
    lightboxImage.src = img.currentSrc || img.src;
    lightboxImage.alt = img.alt || "Enlarged screenshot";
  };

  const openLightbox = (img) => {
    lastActiveElement = document.activeElement;
    showImageAt(triggerImages.indexOf(img));
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    closeButton.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    lightboxImage.src = "";
    currentIndex = -1;
    if (lastActiveElement) {
      lastActiveElement.focus();
    }
  };

  const showNext = () => {
    if (currentIndex === -1) {
      return;
    }
    const nextIndex = (currentIndex + 1) % triggerImages.length;
    showImageAt(nextIndex);
  };

  const showPrev = () => {
    if (currentIndex === -1) {
      return;
    }
    const prevIndex = (currentIndex - 1 + triggerImages.length) % triggerImages.length;
    showImageAt(prevIndex);
  };

  triggerImages.forEach((img) => {
    img.setAttribute("role", "button");
    img.setAttribute("tabindex", "0");
    img.setAttribute("aria-haspopup", "dialog");
    img.addEventListener("click", () => openLightbox(img));
    img.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(img);
      }
    });
  });

  closeButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) {
      return;
    }

    if (event.key === "Escape") {
      closeLightbox();
    } else if (event.key === "ArrowRight") {
      showNext();
    } else if (event.key === "ArrowLeft") {
      showPrev();
    }
  });
}

(() => {
  const starNodes = document.querySelectorAll("[data-star-count]");
  if (!starNodes.length) {
    return;
  }

  const STAR_KEY = "vibepod-star-count";
  const applyCount = (count) => {
    starNodes.forEach((node) => {
      node.textContent = count;
    });
  };

  let cached = null;
  try {
    cached = sessionStorage.getItem(STAR_KEY);
  } catch (error) {
    cached = null;
  }

  if (cached && /^\d+$/.test(cached)) {
    applyCount(cached);
    return;
  }

  fetch("https://api.github.com/repos/VibePod/vibepod-cli")
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (data && typeof data.stargazers_count === "number") {
        const count = String(data.stargazers_count);
        applyCount(count);
        try {
          sessionStorage.setItem(STAR_KEY, count);
        } catch (error) {
          return;
        }
      }
    })
    .catch(() => {});
})();

/* ============================================================
   Hero install widget + animated hero terminal
   Append to script.js (loaded with defer). Both blocks guard
   against missing elements so other pages sharing script.js
   are unaffected.
   ============================================================ */

/* ---------- Component 1: install widget ---------- */
(() => {
  const widget = document.querySelector(".install-widget");
  if (!widget) {
    return;
  }

  const commands = {
    pip: "pip install vibepod",
    brew: "brew install vibepod/vibepod/vibepod"
  };

  const tabs = Array.from(widget.querySelectorAll(".install-tab"));
  const cmdNode = widget.querySelector(".install-cmd");
  const copyButton = widget.querySelector(".install-copy");
  let activeInstaller = "pip";
  let copyResetTimer = null;

  const setInstaller = (installer) => {
    if (!commands[installer]) {
      return;
    }
    activeInstaller = installer;
    if (cmdNode) {
      cmdNode.textContent = commands[installer];
    }
    tabs.forEach((tab) => {
      const isActive = tab.dataset.install === installer;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-pressed", String(isActive));
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setInstaller(tab.dataset.install));
  });

  const legacyCopy = (text) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch (error) {
      /* Silently give up; the command is still selectable by hand. */
    }
  };

  const showCopied = () => {
    if (!copyButton) {
      return;
    }
    copyButton.textContent = "Copied ✓";
    clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
      copyButton.textContent = "Copy";
    }, 1800);
  };

  if (copyButton) {
    copyButton.addEventListener("click", () => {
      const text = commands[activeInstaller];
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(showCopied)
          .catch(() => {
            legacyCopy(text);
            showCopied();
          });
      } else {
        legacyCopy(text);
        showCopied();
      }
    });
  }
})();

/* ---------- Component 2: animated hero terminal ---------- */
(() => {
  const terminalBody = document.getElementById("hero-terminal-body");
  if (!terminalBody) {
    return;
  }

  const AGENTS = [
    { cmd: "claude", name: "Claude Code" },
    { cmd: "gemini", name: "Google Gemini" },
    { cmd: "codex", name: "OpenAI Codex" },
    { cmd: "copilot", name: "GitHub Copilot" },
    { cmd: "opencode", name: "OpenCode" },
    { cmd: "agy", name: "Google Antigravity" }
  ];

  const buildScript = (agent) => [
    { t: "cmd", text: "pip install vibepod" },
    { t: "dim", text: "Successfully installed vibepod" },
    { t: "cmd", text: "vp version" },
    { t: "out", text: "VibePod CLI: 0.17.0" },
    { t: "out", text: "Python:      3.12.3" },
    { t: "out", text: "Docker:      28.3.3" },
    { t: "cmd", text: "vp run " + agent.cmd },
    { t: "dim", text: "Pulling vibepod/" + agent.cmd + ":latest ████████ 100%" },
    { t: "ok", text: "✓ " + agent.name + " running in isolated container" },
    { t: "cmd", text: "vp logs start" },
    { t: "ok", text: "✓ Dashboard → http://localhost:8642" }
  ];

  const makeLine = (step) => {
    const line = document.createElement("div");
    if (step.t === "cmd") {
      const prompt = document.createElement("span");
      prompt.className = "term-prompt";
      prompt.textContent = "$ ";
      const cmd = document.createElement("span");
      cmd.className = "term-cmd";
      cmd.textContent = step.text;
      line.append(prompt, cmd);
    } else {
      line.className = "term-" + step.t;
      line.textContent = step.text;
    }
    return line;
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    buildScript(AGENTS[0]).forEach((step) => {
      terminalBody.appendChild(makeLine(step));
    });
    return;
  }

  /* Persistent typing line: "$ <typed-so-far><cursor>" */
  const typingLine = document.createElement("div");
  const typingPrompt = document.createElement("span");
  typingPrompt.className = "term-prompt";
  typingPrompt.textContent = "$ ";
  const typingText = document.createElement("span");
  typingText.className = "term-cmd";
  const cursor = document.createElement("span");
  cursor.className = "term-cursor";
  typingLine.append(typingPrompt, typingText, cursor);
  terminalBody.appendChild(typingLine);

  let loopIndex = 0;
  let script = buildScript(AGENTS[0]);
  let stepIndex = 0;
  let charIndex = 0;
  let timer = null;

  const syncTypingLine = () => {
    const next = script[stepIndex];
    const showTyping = !next || next.t === "cmd";
    typingLine.style.display = showTyping ? "" : "none";
  };

  const resetLoop = () => {
    loopIndex += 1;
    script = buildScript(AGENTS[loopIndex % AGENTS.length]);
    stepIndex = 0;
    charIndex = 0;
    typingText.textContent = "";
    Array.from(terminalBody.children).forEach((child) => {
      if (child !== typingLine) {
        child.remove();
      }
    });
    syncTypingLine();
  };

  const tick = () => {
    const step = script[stepIndex];

    if (!step) {
      timer = setTimeout(() => {
        resetLoop();
        tick();
      }, 4000);
      return;
    }

    let delay;
    if (step.t === "cmd") {
      charIndex += 1;
      typingText.textContent = step.text.slice(0, charIndex);
      if (charIndex >= step.text.length) {
        terminalBody.insertBefore(makeLine(step), typingLine);
        typingText.textContent = "";
        charIndex = 0;
        stepIndex += 1;
        delay = 500;
      } else {
        delay = 40 + Math.random() * 55;
      }
    } else {
      terminalBody.insertBefore(makeLine(step), typingLine);
      stepIndex += 1;
      delay = step.t === "dim" ? 650 : 420;
    }

    syncTypingLine();
    terminalBody.scrollTop = terminalBody.scrollHeight;
    timer = setTimeout(tick, delay);
  };

  /* Pause the animation while the tab is hidden to avoid burst
     rendering when the user returns. */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimeout(timer);
    } else {
      timer = setTimeout(tick, 400);
    }
  });

  syncTypingLine();
  timer = setTimeout(tick, 600);
})();
