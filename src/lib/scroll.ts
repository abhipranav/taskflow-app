// Smooth scrolling utilities for a premium feel
type ScrollBlock = "start" | "center" | "end";

function getScrollParent(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    const isScrollable = overflowY === "auto" || overflowY === "scroll";
    if (isScrollable && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function smoothScrollToElement(
  el: HTMLElement,
  options: { block?: ScrollBlock; durationMs?: number } = {}
) {
  const block = options.block || "center";
  const container = getScrollParent(el) || document.documentElement;

  const containerRect = container.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  const currentTop = container.scrollTop;

  let targetTop = currentTop + (elRect.top - containerRect.top);
  if (block === "center") {
    targetTop = targetTop - containerRect.height / 2 + elRect.height / 2;
  } else if (block === "end") {
    targetTop = targetTop - containerRect.height + elRect.height;
  }

  const maxTop = container.scrollHeight - container.clientHeight;
  targetTop = Math.max(0, Math.min(targetTop, maxTop));

  const distance = Math.abs(targetTop - currentTop);
  const duration = options.durationMs ?? Math.min(600, Math.max(220, distance * 0.6));

  const start = performance.now();
  const startTop = currentTop;

  const tick = (now: number) => {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / duration);
    const eased = easeOutCubic(t);
    container.scrollTop = startTop + (targetTop - startTop) * eased;
    if (t < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}

