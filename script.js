document.documentElement.classList.add("js");

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
