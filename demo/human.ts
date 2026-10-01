/**
 * Human-like interaction primitives for the demo recording.
 *
 * Playwright's default input is robotic: mouse.move() teleports in a straight
 * line, scroll jumps in one wheel event, and fill()/insertText() drops a whole
 * string in a single frame — which reads as a paste on screen.
 *
 * These helpers keep the demo watchable:
 *   - the pointer travels a curved, slightly jittery bezier path with easing
 *   - clicks settle on the target before pressing, and hold briefly
 *   - scrolling is stepped with momentum, so it reads as a wheel
 *   - text is typed one character at a time, quickly, with human word gaps
 *
 * Playwright does not record the real cursor into video, so a DOM cursor is
 * injected by installCursor() and driven from the same input events.
 */

import type { Locator, Page } from "@playwright/test";

import { ensureChrome, ensureToast } from "./overlay";

const rand = (min: number, max: number): number => min + Math.random() * (max - min);
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const clamp = (value: number, min: number, max: number): number =>
  value < min ? min : value > max ? max : value;

/** Cubic ease-in-out: a real hand accelerates and decelerates. */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** A pause that looks like the user is reading the screen. */
export async function humanRead(page: Page, minMs = 700, maxMs = 1500): Promise<void> {
  void page;
  await sleep(rand(minMs, maxMs));
}

/** Drift the pointer a little, as if the hand is moving while thinking. */
export async function humanIdle(page: Page, minMs = 250, maxMs = 700): Promise<void> {
  const from = { ...(await lastPoint(page)) };
  await sleep(rand(minMs, maxMs));
  await moveTo(page, from.x + rand(-90, 90), from.y + rand(-60, 60));
}

const pointerMemory = new WeakMap<Page, { x: number; y: number }>();

async function lastPoint(page: Page): Promise<{ x: number; y: number }> {
  return pointerMemory.get(page) ?? { x: 40, y: 40 };
}

/**
 * Move the pointer to an absolute viewport point along a curved path.
 * The control point sits off the straight line, so travel arcs instead of
 * gliding, and each step carries a little jitter.
 */
export async function moveTo(
  page: Page,
  targetX: number,
  targetY: number,
  options: { steps?: number; jitter?: number } = {},
): Promise<void> {
  const from = await lastPoint(page);
  const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
  const to = {
    x: clamp(targetX, 2, viewport.width - 2),
    y: clamp(targetY, 2, viewport.height - 2),
  };

  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  if (distance < 1) {
    return;
  }

  const steps = options.steps ?? clamp(Math.round(distance / 14), 8, 60);
  const jitterAmount = options.jitter ?? 2.4;

  // Control point perpendicular to the travel direction, offset by up to 18%
  // of the distance, which is what makes the path read as a hand arc.
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const bow = rand(-0.18, 0.18) * distance;
  const control = { x: midX - (dy / distance) * bow, y: midY + (dx / distance) * bow };

  await page.mouse.move(from.x, from.y);
  for (let i = 1; i <= steps; i += 1) {
    const t = easeInOutCubic(i / steps);
    const oneMinus = 1 - t;
    const x =
      oneMinus * oneMinus * from.x +
      2 * oneMinus * t * control.x +
      t * t * to.x +
      rand(-jitterAmount, jitterAmount);
    const y =
      oneMinus * oneMinus * from.y +
      2 * oneMinus * t * control.y +
      t * t * to.y +
      rand(-jitterAmount, jitterAmount);
    await page.mouse.move(clamp(x, 1, viewport.width - 1), clamp(y, 1, viewport.height - 1));
    await sleep(rand(7, 20));
  }

  pointerMemory.set(page, to);
}

/** Make sure the locator is on screen, scrolling it into view naturally. */
export async function reveal(page: Page, locator: Locator): Promise<void> {
  const state = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      inView: rect.top >= 0 && rect.bottom <= window.innerHeight,
      fullyInView: rect.top >= 0 && rect.bottom <= window.innerHeight,
    };
  });

  if (state.inView && state.fullyInView) {
    return;
  }

  await scrollIntoViewNaturally(page, locator);
}

/**
 * Wheel toward a locator using many small deltas with momentum, rather than
 * one programmatic jump, so the scroll looks hand-driven.
 */
export async function scrollIntoViewNaturally(page: Page, locator: Locator): Promise<void> {
  const viewport = page.viewportSize() ?? { height: 720 };
  // Aim for the element to land around 45% down the viewport.
  const desired = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.top + window.scrollY;
  });

  const current = await page.evaluate(() => window.scrollY);
  const targetY = clamp(desired - viewport.height * 0.45, 0, await maxScroll(page));
  await wheelTo(page, targetY - current);
}

/** Highest scroll offset the page allows. */
async function maxScroll(page: Page): Promise<number> {
  return page.evaluate(() => document.body.scrollHeight - window.innerHeight);
}

/** Scroll the window by `delta` pixels with momentum and small pauses. */
export async function wheelTo(page: Page, delta: number): Promise<void> {
  const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
  const pointer = await lastPoint(page);
  // Park the pointer over the scrollable content before using the wheel.
  await page.mouse.move(
    clamp(viewport.width / 2, 10, viewport.width - 10),
    clamp(pointer.y, 10, viewport.height - 10),
  );
  pointerMemory.set(page, {
    x: clamp(viewport.width / 2, 10, viewport.width - 10),
    y: clamp(pointer.y, 10, viewport.height - 10),
  });

  let remaining = delta;
  // First chunk carries the motion, later chunks decay like a real wheel.
  let chunk = clamp(Math.abs(delta) / 5, 18, 130) * Math.sign(delta);
  while (Math.abs(remaining) > 1) {
    const step = clamp(remaining, -Math.abs(chunk), Math.abs(chunk));
    await page.mouse.wheel(0, step);
    remaining -= step;
    chunk *= 0.82;
    await sleep(rand(12, 30));
  }
  // Settle: a real wheel coasts a little after the last event.
  await sleep(rand(120, 320));
}

/** Scroll down by roughly `fraction` of a viewport, like a flick of the wheel. */
export async function scrollDown(page: Page, fraction = 0.5): Promise<void> {
  const viewport = page.viewportSize() ?? { height: 720 };
  await wheelTo(page, viewport.height * fraction);
  await sleep(rand(200, 450));
}

/** Scroll back up by roughly `fraction` of a viewport. */
export async function scrollUp(page: Page, fraction = 0.5): Promise<void> {
  const viewport = page.viewportSize() ?? { height: 720 };
  await wheelTo(page, -viewport.height * fraction);
  await sleep(rand(200, 450));
}

/** Move onto an element and let it register as hovered. */
export async function humanHover(page: Page, locator: Locator): Promise<void> {
  await reveal(page, locator);
  const box = await locator.boundingBox();
  if (!box) throw new Error("humanHover: element has no bounding box");
  await moveTo(page, box.x + box.width / 2, box.y + box.height / 2);
  await sleep(rand(180, 420));
}

/**
 * Point at a plausible spot inside an element (not always dead centre, which
 * is what makes synthetic clicks look odd) and click it.
 */
export async function humanClick(
  page: Page,
  locator: Locator,
  options: { settle?: number } = {},
): Promise<void> {
  await reveal(page, locator);
  const box = await locator.boundingBox();
  if (!box) throw new Error("humanClick: element has no bounding box");

  const x = box.x + box.width * rand(0.32, 0.68);
  const y = box.y + box.height * rand(0.34, 0.66);
  await moveTo(page, x, y);

  // Let the pointer rest on the target before pressing, so hover styles settle.
  await sleep(options.settle ?? rand(150, 330));

  await page.mouse.down();
  await sleep(rand(45, 105));
  await page.mouse.up();
}

/** Click with the mouse held a little longer, for a deliberate press. */
export async function humanClickSlow(page: Page, locator: Locator): Promise<void> {
  await reveal(page, locator);
  const box = await locator.boundingBox();
  if (!box) throw new Error("humanClickSlow: element has no bounding box");
  await moveTo(page, box.x + box.width * rand(0.3, 0.7), box.y + box.height * rand(0.35, 0.65));
  await sleep(rand(200, 400));
  await page.mouse.down();
  await sleep(rand(120, 220));
  await page.mouse.up();
}

/**
 * Focus a field by clicking it, then type one character at a time.
 *
 * Deliberately fast (the brief says typing may look quick), but never a single
 * insertText: every character produces its own key events and its own frame,
 * so the text appears to be typed rather than pasted. Pauses after spaces and
 * sentence punctuation give it human rhythm.
 */
export async function humanType(
  page: Page,
  locator: Locator,
  text: string,
  options: { clickFirst?: boolean; minDelay?: number; maxDelay?: number } = {},
): Promise<void> {
  const { clickFirst = true, minDelay = 26, maxDelay = 74 } = options;

  if (clickFirst) {
    await humanClick(page, locator);
    await sleep(rand(90, 220));
  }

  for (const character of text) {
    await page.keyboard.type(character);

    if (character === " ") {
      await sleep(rand(55, 130));
    } else if (/[.,!?]/.test(character)) {
      await sleep(rand(120, 240));
    } else {
      await sleep(rand(minDelay, maxDelay));
    }
  }
}

/** Clear a field with select-all + backspace, one key at a time. */
export async function humanClear(page: Page): Promise<void> {
  await page.keyboard.press("Control+a");
  await sleep(rand(60, 130));
  await page.keyboard.press("Backspace");
  await sleep(rand(80, 180));
}

const CURSOR_STYLE = `
  position: fixed;
  top: 0;
  left: 0;
  width: 22px;
  height: 22px;
  margin: -3px 0 0 -3px;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.28);
  border: 2.5px solid rgb(15, 23, 42);
  box-shadow: 0 1px 3px rgba(0,0,0,0.35);
  pointer-events: none;
  z-index: 2147483647;
  will-change: transform;
  transition: transform 40ms linear;
`;

const RIPPLE_STYLE = `
  position: fixed;
  top: 0;
  left: 0;
  width: 34px;
  height: 34px;
  margin: -17px 0 0 -17px;
  border-radius: 9999px;
  border: 2px solid rgb(16, 185, 129);
  pointer-events: none;
  z-index: 2147483646;
  animation: demo-cursor-ripple 520ms ease-out forwards;
  @keyframes demo-cursor-ripple {
    0%   { transform: var(--demo-t) scale(0.25); opacity: 0.9; }
    100% { transform: var(--demo-t) scale(1.15); opacity: 0; }
  }
`;

/**
 * Inject a cursor into the page. Playwright's video captures the rendered
 * frame only — the OS cursor is not in it — so without this the recording
 * looks like nobody is touching anything.
 */
export async function installCursor(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `#demo-cursor{${CURSOR_STYLE}} #demo-ripple{${RIPPLE_STYLE}}`,
  });

  await page.evaluate(() => {
    if (document.getElementById("demo-cursor")) return;

    const cursor = document.createElement("div");
    cursor.id = "demo-cursor";
    document.body.appendChild(cursor);

    const place = (x: number, y: number) => {
      cursor.style.transform = `translate(${x}px, ${y}px)`;
    };

    place(window.innerWidth * 0.42, window.innerHeight * 0.62);
    cursor.style.opacity = "0";

    document.addEventListener(
      "mousemove",
      (event) => {
        cursor.style.opacity = "1";
        place(event.clientX, event.clientY);
      },
      true,
    );

    // Hide the cursor when it leaves the window, as a real one does.
    document.addEventListener("mouseleave", () => {
      cursor.style.opacity = "0";
    });
    document.addEventListener("mouseenter", () => {
      cursor.style.opacity = "1";
    });

    document.addEventListener(
      "mousedown",
      (event) => {
        const ripple = document.createElement("div");
        ripple.id = "demo-ripple";
        ripple.style.setProperty("--demo-t", `translate(${event.clientX}px, ${event.clientY}px)`);
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 560);
      },
      true,
    );
  });

  pointerMemory.set(page, { x: 0, y: 0 });
}

/** Re-inject the cursor after a client-side navigation remounts the DOM. */
export async function ensureCursor(page: Page): Promise<void> {
  const present = await page
    .evaluate(() => Boolean(document.getElementById("demo-cursor")))
    .catch(() => false);
  if (!present) {
    await installCursor(page);
  }
}

/**
 * When a page last finished a full settle.
 *
 * `networkidle` costs real seconds and the demo calls settle() before almost
 * every click. Waiting again for a page that was already quiet just adds dead
 * air, so the idle wait is skipped when the page settled a moment ago.
 */
const lastSettledAt = new WeakMap<Page, number>();
const SETTLE_GRACE_MS = 1200;

/** Wait for the page to settle after navigation, then restore the overlays. */
export async function settle(page: Page, timeout = 15_000): Promise<void> {
  await page.waitForLoadState("domcontentloaded", { timeout }).catch(() => undefined);

  const settledAgo = Date.now() - (lastSettledAt.get(page) ?? 0);
  if (settledAgo > SETTLE_GRACE_MS) {
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
  }
  lastSettledAt.set(page, Date.now());

  await ensureCursor(page);
  // The toast and the window chrome live in the DOM too, so a navigation takes
  // them with it. ensureChrome is a no-op on scenes that never installed one.
  await ensureToast(page);
  await ensureChrome(page);
}
