/**
 * Screen overlay for the demo: an app-styled toast carrying each caption.
 *
 * The caption lives in the page rather than being burned into the video, so it
 * is always exactly in sync with the action, survives client-side navigation
 * via ensureToast(), and looks like part of the app instead of a subtitle
 * track. Styling mirrors the app's sonner toaster (--popover background,
 * --border, --radius).
 *
 * Text, speaker and hold duration all come from captions.ts + the generated
 * audio index, so the toast cannot disagree with what the voice says, and it
 * stays on screen long enough to still be readable after the voice finishes.
 */

import { readFile } from "node:fs/promises";

import { CAPTIONS, VOICES, estimatedDurationMs } from "./captions";

import type { Page } from "@playwright/test";

const TOAST_ID = "demo-toast";
const STYLE_ID = "demo-overlays";
const AUDIO_INDEX = "demo/out/audio/index.json";

const OVERLAY_CSS = `
  #${TOAST_ID} {
    position: fixed;
    left: 50%;
    /* Clears the burned-in chapter strip along the bottom edge. */
    bottom: 62px;
    transform: translate(-50%, 28px);
    z-index: 2147483645;
    display: flex;
    align-items: flex-start;
    gap: 13px;
    width: min(900px, calc(100vw - 96px));
    padding: 15px 22px 16px;
    border-radius: 14px;
    border: 1px solid oklch(0.922 0 0);
    background: oklch(1 0 0);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.06),
      0 14px 34px -8px rgba(0, 0, 0, 0.24);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    color: oklch(0.145 0 0);
    opacity: 0;
    pointer-events: none;
    transition:
      opacity 320ms cubic-bezier(0.22, 1, 0.36, 1),
      transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  #${TOAST_ID}[data-visible="true"] {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  #${TOAST_ID} .demo-toast-dot {
    flex: none;
    width: 9px;
    height: 9px;
    margin-top: 7px;
    border-radius: 9999px;
    background: oklch(0.696 0.17 162.48);
    box-shadow: 0 0 0 4px oklch(0.696 0.17 162.48 / 0.15);
    animation: demo-toast-breathe 2.1s ease-in-out infinite;
  }

  @keyframes demo-toast-breathe {
    0%, 100% { box-shadow: 0 0 0 3px oklch(0.696 0.17 162.48 / 0.10); }
    50%      { box-shadow: 0 0 0 7px oklch(0.696 0.17 162.48 / 0.22); }
  }

  #${TOAST_ID} .demo-toast-body { flex: 1 1 auto; }

  #${TOAST_ID} .demo-toast-speaker {
    display: block;
    margin-bottom: 3px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: oklch(0.556 0 0);
  }

  #${TOAST_ID} .demo-toast-text {
    display: block;
    font-size: 17px;
    line-height: 1.5;
    letter-spacing: -0.006em;
    text-wrap: balance;
  }

  /* Split-screen scenes get half-width panes, so the toast shrinks to match. */
  html[data-demo-compact="true"] #${TOAST_ID} {
    width: min(560px, calc(100vw - 44px));
    padding: 12px 17px 13px;
    bottom: 20px;
    gap: 11px;
  }

  html[data-demo-compact="true"] #${TOAST_ID} .demo-toast-text {
    font-size: 14.5px;
    line-height: 1.45;
  }

  html[data-demo-compact="true"] #${TOAST_ID} .demo-toast-speaker {
    font-size: 10px;
    margin-bottom: 2px;
  }

  html[data-demo-compact="true"] #${TOAST_ID} .demo-toast-dot {
    margin-top: 6px;
  }
`;

/** A caption as shown on screen and spoken, with its on-screen timing. */
export interface CaptionEvent {
  captionId: string;
  speaker: string;
  text: string;
  /** Wall-clock ms when the toast began fading in. */
  startMs: number;
  /** How long the toast was held, in ms. */
  holdMs: number;
  /** Clip duration from the audio index, for the composer. */
  audioMs: number;
}

/**
 * Wall-clock origin for the scene currently being recorded, set by the
 * recorder so caption timings can be expressed as offsets from the start of
 * the recorded segment.
 */
let timelineOrigin = 0;

/**
 * Split-screen scenes render each lane into half a frame, so the toast has to
 * be told to shrink before it is injected.
 */
let compact = false;

export function setCompactToasts(value: boolean): void {
  compact = value;
}

export function beginCaptionTimeline(): void {
  timelineOrigin = Date.now();
}

let events: CaptionEvent[] = [];

/** Captions recorded since the last drain, for the composer. */
export function takeCaptionEvents(): CaptionEvent[] {
  const drained = events;
  events = [];
  return drained;
}

interface AudioIndex {
  durations: Record<string, number>;
}

let audioIndex: AudioIndex | null = null;

/** Load generated clip durations once per process. */
async function loadAudioIndex(): Promise<AudioIndex> {
  if (audioIndex) return audioIndex;
  try {
    audioIndex = JSON.parse(await readFile(AUDIO_INDEX, "utf8")) as AudioIndex;
  } catch {
    // Not generated yet — fall back to reading-time estimates.
    audioIndex = { durations: {} };
  }
  return audioIndex;
}

/** Create the toast element if this document does not have one yet. */
/** Inject the overlay stylesheet once per document. */
async function ensureStyle(page: Page, css: string): Promise<void> {
  await page
    .evaluate(
      ({ styleId, text }) => {
        const existing = document.getElementById(styleId) as HTMLStyleElement | null;
        if (existing) {
          // The stylesheet carries both overlays; refresh it so a scene that
          // added an overlay later is styled without a reload.
          if (existing.textContent !== text) existing.textContent = text;
          return;
        }
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = text;
        document.head.appendChild(style);
      },
      { styleId: STYLE_ID, text: css },
    )
    .catch(() => undefined);
}

async function ensureToastElement(page: Page): Promise<void> {
  await page
    .evaluate(
      ({ toastId }) => {
        if (document.getElementById(toastId)) return;

        const toast = document.createElement("div");
        toast.id = toastId;
        toast.setAttribute("role", "status");

        const dot = document.createElement("span");
        dot.className = "demo-toast-dot";

        const body = document.createElement("span");
        body.className = "demo-toast-body";
        const speaker = document.createElement("span");
        speaker.className = "demo-toast-speaker";
        const text = document.createElement("span");
        text.className = "demo-toast-text";
        body.append(speaker, text);

        toast.append(dot, body);
        document.body.appendChild(toast);
      },
      { toastId: TOAST_ID },
    )
    .catch(() => undefined);
}

/** Re-inject the toast after a navigation replaced the document. */
export async function ensureToast(page: Page): Promise<void> {
  await ensureStyle(page, OVERLAY_CSS);
  await ensureToastElement(page);
  // The document is fresh after a navigation, so re-apply the size mode.
  await page
    .evaluate((isCompact) => {
      const root = document.documentElement;
      if (isCompact) root.setAttribute("data-demo-compact", "true");
      else root.removeAttribute("data-demo-compact");
    }, compact)
    .catch(() => undefined);
}

/**
 * Show a caption for as long as it takes to read it aloud, then fade out.
 *
 * The hold time is derived from the generated clip so the text is still on
 * screen when the voice reaches the end of the sentence, plus a beat to finish
 * reading in silence.
 */
export async function toast(page: Page, captionId: string): Promise<void> {
  const caption = CAPTIONS[captionId];
  if (!caption) throw new Error(`unknown caption "${captionId}"`);

  const index = await loadAudioIndex();
  const audioMs = index.durations[captionId] ?? estimatedDurationMs(caption.text);
  const holdMs = audioMs + 900;

  await ensureToast(page);

  const startMs = Date.now() - timelineOrigin;
  const label = VOICES[caption.speaker].label;

  await page.evaluate(
    ({ toastId, speaker, message }) => {
      const element = document.getElementById(toastId);
      if (!element) return;
      const speakerNode = element.querySelector<HTMLElement>(".demo-toast-speaker");
      const textNode = element.querySelector<HTMLElement>(".demo-toast-text");
      if (speakerNode) speakerNode.textContent = speaker;
      if (textNode) textNode.textContent = message;
      element.setAttribute("data-visible", "true");
    },
    { toastId: TOAST_ID, speaker: label, message: caption.text },
  );

  events.push({
    captionId,
    speaker: caption.speaker,
    text: caption.text,
    startMs,
    holdMs,
    audioMs,
  });

  await page.waitForTimeout(holdMs);

  await page
    .evaluate((toastId) => {
      document.getElementById(toastId)?.setAttribute("data-visible", "false");
    }, TOAST_ID)
    .catch(() => undefined);

  // Let the fade-out finish before the next step.
  await page.waitForTimeout(400);
}

/** Fade the toast out now, without a reading pause. */
export async function hideToast(page: Page): Promise<void> {
  await page
    .evaluate((toastId) => {
      document.getElementById(toastId)?.setAttribute("data-visible", "false");
    }, TOAST_ID)
    .catch(() => undefined);
  await page.waitForTimeout(300);
}
/* -------------------------------------------------------------------------- */
/* Fake window chrome                                                         */
/* -------------------------------------------------------------------------- */

const CHROME_ID = "demo-chrome";
const CHROME_CSS = `
  #${CHROME_ID} {
    position: fixed;
    inset: 0 0 auto 0;
    height: 38px;
    z-index: 2147483646;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 12px;
    background: linear-gradient(180deg, #f8fafc, #eef2f7);
    border-bottom: 1px solid #cbd5e1;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.16);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 12px;
    color: #334155;
  }

  #${CHROME_ID} .demo-lights {
    display: flex;
    gap: 6px;
    flex: none;
  }

  #${CHROME_ID} .demo-lights i {
    width: 11px;
    height: 11px;
    border-radius: 9999px;
    display: block;
  }

  #${CHROME_ID} .demo-lights i:nth-child(1) { background: #ff5f57; }
  #${CHROME_ID} .demo-lights i:nth-child(2) { background: #febc2e; }
  #${CHROME_ID} .demo-lights i:nth-child(3) { background: #28c840; }

  #${CHROME_ID} .demo-server {
    flex: none;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: #0f172a;
    white-space: nowrap;
  }

  #${CHROME_ID} .demo-url {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 7px;
    height: 25px;
    padding: 0 11px;
    border-radius: 9999px;
    background: #ffffff;
    border: 1px solid #dbe3ec;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    font-size: 11.5px;
    color: #475569;
    overflow: hidden;
  }

  #${CHROME_ID} .demo-url[data-editing="true"] {
    border-color: #38bdf8;
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.22);
    background: #f8fdff;
  }

  /* A real input, so keystrokes land in it, dressed to look like plain text.
     A read-only one still scrolls its value to the end, which keeps the path
     visible when it is longer than the bar. */
  #${CHROME_ID} .demo-url input {
    flex: 1 1 auto;
    min-width: 0;
    width: 100%;
    border: 0;
    outline: 0;
    padding: 0;
    background: transparent;
    font: inherit;
    color: #0f172a;
    text-overflow: ellipsis;
  }

  #${CHROME_ID} .demo-url input::selection {
    background: rgba(56, 189, 248, 0.35);
  }

  #${CHROME_ID} .demo-who {
    flex: none;
    max-width: 34%;
    padding: 3px 10px;
    border-radius: 9999px;
    background: #0f172a;
    color: #f8fafc;
    font-weight: 600;
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Split-screen panes are half as wide, so the chrome has to shed the parts
     that would otherwise truncate the URL to nothing. */
  html[data-demo-compact="true"] #${CHROME_ID} { height: 30px; gap: 8px; padding: 0 8px; font-size: 10px; }
  html[data-demo-compact="true"] #${CHROME_ID} .demo-lights { display: none; }
  html[data-demo-compact="true"] #${CHROME_ID} .demo-who { display: none; }
  html[data-demo-compact="true"] #${CHROME_ID} .demo-url { font-size: 9.5px; height: 20px; }
`;

/** Push the app down so the injected chrome does not cover the header. */
const CHROME_SPACER_CSS = `
  html[data-demo-chrome="true"] body { padding-top: 38px; }
  html[data-demo-chrome="true"][data-demo-compact="true"] body { padding-top: 30px; }
`;

interface ChromeOptions {
  /** Server name shown left of the address bar, e.g. "hospital-s". */
  server: string;
  /** Who is driving this browser, e.g. "Dr. Sofia Berg". */
  who?: string;
}

/** Chrome settings per page, so `ensureChrome` can rebuild the bar. */
const chromeOptions = new WeakMap<Page, ChromeOptions>();

/**
 * Draw a browser title bar above the app: server name, a live address bar and
 * the signed-in user.
 *
 * The address bar is not decoration. Playwright cannot reach the real one —
 * Control+l leaves focus on <body>, since browser chrome is outside the page —
 * so this is what makes "edit the URL to reach another patient" demonstrable,
 * and at 38px tall it is actually readable from the back of a room.
 */
export async function installChrome(page: Page, options: ChromeOptions): Promise<void> {
  chromeOptions.set(page, options);
  await ensureChrome(page);
}

/** Re-inject the chrome after a navigation replaced the document. */
export async function ensureChrome(page: Page): Promise<void> {
  const options = chromeOptions.get(page);
  if (!options) return;

  await ensureStyle(page, `${OVERLAY_CSS}\n${CHROME_CSS}\n${CHROME_SPACER_CSS}`);

  await page.evaluate(
    ({ id, server, who }) => {
      if (!document.getElementById(id)) {
        const bar = document.createElement("div");
        bar.id = id;
        bar.innerHTML =
          '<span class="demo-lights"><i></i><i></i><i></i></span>' +
          `<span class="demo-server"></span>` +
          '<span class="demo-url" data-editing="false">' +
          '<input class="demo-url-field" readonly spellcheck="false" /></span>' +
          '<span class="demo-who"></span>';
        document.body.appendChild(bar);
      }

      const root = document.getElementById(id)!;
      document.documentElement.setAttribute("data-demo-chrome", "true");
      root.querySelector<HTMLElement>(".demo-server")!.textContent = server;
      root.querySelector<HTMLElement>(".demo-who")!.textContent = who ?? "";

      // Keep the bar in step with the app. A timer is blunt but it survives
      // client-side routing, which a one-shot read after load would not.
      const field = root.querySelector<HTMLInputElement>(".demo-url-field")!;
      const render = () => {
        if (root.dataset.editing === "true") return;
        field.value = `${window.location.host}${window.location.pathname}${window.location.search}`;
        field.title = window.location.href;
      };
      render();
      window.setInterval(render, 250);
    },
    { id: CHROME_ID, server: options.server, who: options.who ?? "" },
  );
}

/**
 * Put the address bar into edit mode with `text` selected, the way Control+L
 * does in a real browser.
 */
export async function focusAddressBar(page: Page): Promise<void> {
  await page.evaluate((id) => {
    const root = document.getElementById(id)!;
    const url = root.querySelector<HTMLElement>(".demo-url")!;
    const field = url.querySelector<HTMLInputElement>(".demo-url-field")!;
    // The guard the live-URL timer checks lives on the bar root; the attribute
    // that styles the field lives on the pill. Both have to be set, or the
    // timer keeps overwriting what is being typed.
    root.dataset.editing = "true";
    url.dataset.editing = "true";
    field.readOnly = false;
    field.focus();
    field.select();
  }, CHROME_ID);
}

/**
 * Navigate to whatever the address bar currently shows, as if the user had
 * pressed Enter, and hand editing back to the live URL.
 */
export async function commitAddressBar(page: Page): Promise<void> {
  const target = await page.evaluate((id) => {
    const root = document.getElementById(id)!;
    const url = root.querySelector<HTMLElement>(".demo-url")!;
    const field = url.querySelector<HTMLInputElement>(".demo-url-field")!;
    root.dataset.editing = "false";
    url.dataset.editing = "false";
    field.readOnly = true;

    const typed = field.value.trim();
    // A browser treats what you type as a path unless it looks like a URL.
    if (/^https?:\/\//i.test(typed)) return typed;
    const path = typed.startsWith("/") ? typed : `/${typed}`;
    return `${window.location.origin}${path}`;
  }, CHROME_ID);

  await page.goto(target, { waitUntil: "domcontentloaded" });
}
