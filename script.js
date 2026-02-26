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
