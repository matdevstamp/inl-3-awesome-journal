import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  expect,
  test,
  type Browser,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from "@playwright/test";

import { installCursor, settle } from "./human";
import {
  beginCaptionTimeline,
  installChrome,
  setCompactToasts,
  takeCaptionEvents,
} from "./overlay";
import { DEMO_NOTE_TEXTS, SERVER_1, SERVER_2, uiLogin, type Scene } from "./scenes";
import { PARALLEL_NOTE_TEXTS } from "./scenes-parallel";
import { activeTarget } from "./sets";

/**
 * Records one video segment per scene into demo/out/raw/<sceneId>-<lane>/ and
 * writes demo/out/timeline.json describing where every caption landed.
 *
 * Notes created while recording are deleted afterwards, so rehearsing the demo
 * repeatedly does not pile up throwaway notes on the seeded patient.
 *
 * Nothing here decides pacing beyond the script: the composer measures the
 * finished clips and pads them to fit the caption audio, so a scene that runs
 * long is handled by the timeline rather than by hand-tuned durations.
 */

const OUT_DIR = "demo/out";

/**
 * Each lane is recorded at the exact pixel size it occupies in the final frame,
 * so the composer never has to rescale anything and the video stays sharp.
 *
 * A single-lane scene owns the whole 1920x1080 frame. A two-lane scene gives
 * each browser half the width, and the composer hstacks the two halves back
 * into one 1920x1080 picture.
 */
function viewportFor(lanes: number): { width: number; height: number } {
  return lanes === 1 ? { width: 1920, height: 1080 } : { width: 960, height: 1080 };
}

const createdNoteTexts = new Set<string>();

/**
 * Record only these scene ids (comma separated) while iterating on one beat:
 *   DEMO_SCENES=access-log,realtime-p2p npm run demo:record
 * The composer then builds a partial video, which is the point.
 */
const target = activeTarget();
const selectedScenes = target.scenes;
/** Per set, so re-recording one cut does not mix with the other's footage. */
const RAW_DIR = `${OUT_DIR}/raw-${target.set}`;

interface TimelineScene {
  id: string;
  label: string;
  chapter: string;
  lanes: number;
  /** One .webm per lane, in lane order. */
  videos: string[];
  captions: Array<{ captionId: string; startMs: number; audioMs: number }>;
}

test("record every demo scene", async ({ browser, playwright }) => {
  test.setTimeout(40 * 60 * 1000);

  await mkdir(RAW_DIR, { recursive: true });
  const timeline: TimelineScene[] = [];
  const started = Date.now();

  // Clear notes a previous aborted run left behind before adding more.
  await deleteDemoNotes(playwright);

  for (const scene of selectedScenes) {
    const laneVideos = await recordScene(browser, scene);
    timeline.push({
      id: scene.id,
      label: scene.label,
      chapter: scene.chapter ?? scene.label,
      lanes: scene.lanes,
      videos: laneVideos,
      captions: takeCaptionEvents().map((event) => ({
        captionId: event.captionId,
        startMs: event.startMs,
        audioMs: event.audioMs,
      })),
    });
  }

  await writeFile(target.timeline, `${JSON.stringify(timeline, null, 2)}\n`, "utf8");
  await deleteDemoNotes(playwright);

  const spoken = timeline.reduce(
    (sum, entry) => sum + entry.captions.reduce((n, c) => n + c.audioMs, 0),
    0,
  );
  console.log(
    `\n${timeline.length} scenes · ${(spoken / 1000) | 0}s of speech · ` +
      `recorded in ${((Date.now() - started) / 1000 / 60).toFixed(1)} min`,
  );
  console.log(`timeline → ${target.timeline}`);
  expect(timeline.length).toBe(selectedScenes.length);
});

/** Record one scene and return its .webm paths, one per lane. */
async function recordScene(browser: Browser, scene: Scene) {
  const sceneStarted = Date.now();
  console.log(`\n▶ "${scene.id}" (${scene.lanes} lane${scene.lanes > 1 ? "s" : ""})`);

  setCompactToasts(scene.lanes > 1);
  takeCaptionEvents();

  const contexts: BrowserContext[] = [];
  let pages: Page[] = [];

  try {
    // Lanes are opened concurrently so a split-screen scene has both videos
    // starting at the same instant; opened one after another they would drift
    // apart by however long each page takes to come up.
    const opened = await Promise.all(
      Array.from({ length: scene.lanes }, async (_, lane) => {
        const baseURL = lane === 0 ? SERVER_1 : SERVER_2;
        const server = new URL(baseURL).port === "3001" ? "hospital-s" : "ambulance-a";
        const viewport = viewportFor(scene.lanes);
        const context = await browser.newContext({
          viewport,
          recordVideo: { dir: `${RAW_DIR}/${scene.id}-${lane}`, size: viewport },
        });
        const page = await context.newPage();

        page.on("request", (request) => {
          if (request.method() === "POST" && request.url().includes("/api/notes")) {
            try {
              const payload = JSON.parse(request.postData() ?? "{}") as { text?: string };
              if (payload.text) createdNoteTexts.add(payload.text);
            } catch {
              // A body we cannot parse is not worth failing a recording over.
            }
          }
        });
        return { context, page, baseURL, server };
      }),
    );

    contexts.push(...opened.map((entry) => entry.context));
    pages = opened.map((entry) => entry.page);

    // Playwright starts recording at page creation, so caption offsets are
    // measured from here rather than from the first navigation.
    beginCaptionTimeline();

    for (const [index, entry] of opened.entries()) {
      await entry.page.goto(`${entry.baseURL}${scene.startPath ?? "/login"}`, {
        waitUntil: "domcontentloaded",
      });
      await installCursor(entry.page);
      // The title bar names the server and the user, which is the only way a
      // viewer can tell the two panes of a split-screen scene apart.
      await installChrome(entry.page, {
        server: entry.server,
        who: scene.laneTitles?.[index] ?? "",
      });
      void index;
    }

    for (const page of pages) await settle(page);
    await pages[0]!.waitForTimeout(700);

    // Sign in before the scene body when it declares a role, so the body can
    // go straight to the page it is about.
    if (scene.loginAs) {
      await uiLogin(pages[0]!, opened[0]!.baseURL, scene.loginAs);
    }

    if (scene.lanes === 1) {
      await scene.run(pages[0]!);
    } else {
      await scene.run(pages[0]!, pages[1]!);
    }
  } finally {
    // Closing finalises the video files, even when the scene threw.
    for (const context of contexts) await context.close().catch(() => undefined);
  }

  const videos: string[] = [];
  for (let lane = 0; lane < scene.lanes; lane += 1) {
    const dir = join(RAW_DIR, `${scene.id}-${lane}`);
    const [file] = (await readdir(dir)).filter((name) => name.endsWith(".webm"));
    if (!file) throw new Error(`no video produced for ${scene.id} lane ${lane}`);
    videos.push(join(dir, file));
  }

  const seconds = ((Date.now() - sceneStarted) / 1000).toFixed(1);
  console.log(`✔ "${scene.id}" recorded in ${seconds}s`);
  return videos;
}

/**
 * Remove the notes this demo writes, matched by text rather than by what this
 * particular run happened to create.
 *
 * Matching by text is what makes an aborted run recoverable: if the process
 * dies mid-scene the in-memory set is gone, and the next run would otherwise
 * trip over the note its predecessor left behind.
 */
async function deleteDemoNotes(playwright: {
  request: { newContext(options: { baseURL: string }): Promise<APIRequestContext> };
}): Promise<void> {
  const known = new Set<string>([
    ...Object.values(DEMO_NOTE_TEXTS),
    ...Object.values(PARALLEL_NOTE_TEXTS),
  ]);

  // Only the author may delete a note, so each demo persona has to sweep its
  // own notes using its own session. Doing this as one doctor session left the
  // nurse-authored notes behind, which then piled up across aborted runs until
  // a single note text appeared many times over in one render.
  const sweepers = [
    { username: "dr_test", baseURL: SERVER_1 },
    { username: "nurse_test", baseURL: SERVER_2 },
  ];

  for (const sweeper of sweepers) {
    const context = await playwright.request.newContext({ baseURL: sweeper.baseURL });
    try {
      const login = await context.post("/api/auth/login", {
        data: { username: sweeper.username, password: "test123" },
      });
      if (!login.ok()) {
        console.warn(
          `[cleanup] login as ${sweeper.username} failed; their notes are left in place`,
        );
        continue;
      }

      const listed = await context.get("/api/notes?recordId=1");
      if (!listed.ok()) continue;

      const body = (await listed.json()) as {
        data?: { notes?: Array<{ id: number; text: string }> };
      };

      const wanted = (notes: Array<{ id: number; text: string }>) =>
        notes.filter((note) => known.has(note.text) || createdNoteTexts.has(note.text));

      for (const note of body.data?.notes ?? []) {
        if (!known.has(note.text) && !createdNoteTexts.has(note.text)) continue;
        const result = await context.delete(`/api/notes/${note.id}`);
        if (result.ok()) continue;

        // A non-2xx here does not necessarily mean the note survived: the route
        // deletes the row and only then writes the blockchain access event, so a
        // failure in that peer call reports an error for a delete that worked.
        // Re-read rather than trust the status code.
        // Re-read rather than trust the status code.
        const verify = await context.get("/api/notes?recordId=1");
        let stillThere = verify.ok()
          ? wanted(
              ((await verify.json()) as { data?: { notes?: Array<{ id: number; text: string }> } })
                .data?.notes ?? [],
            ).some((candidate) => candidate.id === note.id)
          : true;
        if (stillThere) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          const verify2 = await context.get("/api/notes?recordId=1");
          stillThere = verify2.ok()
            ? wanted(
                (
                  (await verify2.json()) as {
                    data?: { notes?: Array<{ id: number; text: string }> };
                  }
                ).data?.notes ?? [],
              ).some((candidate) => candidate.id === note.id)
            : true;
        }
        if (stillThere) {
          console.warn(
            `[cleanup] note ${note.id} (${sweeper.username}): still present after delete`,
          );
        }
      }

      const after = await context.get("/api/notes?recordId=1");
      const afterBody = (await after.json()) as {
        data?: { notes?: Array<{ id: number; text: string }> };
      };
      const remaining = wanted(afterBody.data?.notes ?? []).length;
      console.log(`[cleanup] ${sweeper.username}: ${remaining} demo notes left`);
    } finally {
      await context.dispose();
    }
  }
}
