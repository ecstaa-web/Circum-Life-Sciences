import Lenis from "https://cdn.jsdelivr.net/npm/lenis@1.0.45/+esm";

const LENIS_KEEP = ".nav, .nav-mobile";

function ensureLenisStructure() {
  if (document.getElementById("lenis-root")) {
    return {
      wrapper: document.getElementById("lenis-root"),
      content: document.getElementById("lenis-content"),
    };
  }

  const wrapper = document.createElement("div");
  wrapper.id = "lenis-root";
  const content = document.createElement("div");
  content.id = "lenis-content";

  const body = document.body;
  const nodes = [];
  for (const child of body.children) {
    if (child.tagName === "SCRIPT") continue;
    if (child.matches?.(LENIS_KEEP)) continue;
    nodes.push(child);
  }

  wrapper.appendChild(content);
  for (const node of nodes) content.appendChild(node);
  body.appendChild(wrapper);

  return { wrapper, content };
}

function getLenisOptions(page) {
  if (page === "home") {
    return {
      duration: 0.35,
      smoothWheel: true,
      syncTouch: true,
      wheelMultiplier: 0.9,
      lerp: 0.12,
    };
  }
  return {
    duration: 1.1,
    smoothWheel: true,
  };
}

const page = document.body.dataset.page || "";
const { wrapper, content } = ensureLenisStructure();

const lenis = (window.lenis = new Lenis({
  ...getLenisOptions(page),
  wrapper,
  content,
}));

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);
window.dispatchEvent(new CustomEvent("circum:lenis-ready", { detail: { lenis } }));
