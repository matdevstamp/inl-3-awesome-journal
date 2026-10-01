/**
 * Builds demo/out/demo.mp4 from the recorded segments and the caption voice
 * track.
 *
 * For each scene it
 *   1. normalises the lanes to 1080p (side by side for the split-screen
 *      scene, letterboxed so neither pane is cropped),
 *   2. pads the clip so the caption audio always fits,
 *   3. lays the matching clips onto a silent track at the offsets the
 *      recorder logged,
 * then concatenates the scenes and muxes the finished audio onto the result.
 *
 * Padding uses tpad's clone mode, so a scene that ends while a caption is
 * still being spoken holds its last frame instead of cutting to black.
 *
 *   npm run demo:compose
 *
 * Encoder note: this machine's ffmpeg is built without libx264, so H.264 goes
 * through libopenh264 instead. It has no CRF mode, hence the explicit bitrate.
 */

import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";

import { chapterFilter, type Chapter } from "./chapters";
import { activeTarget } from "./sets";

const run = promisify(execFile);

const OUT = "demo/out";
const AUDIO_DIR = `${OUT}/audio`;

// DEMO_SET decides which timeline is read and which file is written; the two
// cuts share the scratch directory so a re-record of one does not disturb the
// other's inputs.
const target = activeTarget();
const TIMELINE = target.timeline;
const SEGMENTS = `${OUT}/segments-${target.set}`;
const FINAL = target.output;

const FPS = 30;
/** Silence between scenes, so a cut does not butt against the next login. */
const SCENE_GAP_S = 0.7;
/** Generous for a screen recording, where most frames are flat UI. */
const VIDEO_BITRATE = "8M";

const BASE = ["-hide_banner", "-loglevel", "error", "-y"];
const H264 = [
  "-c:v",
  "libopenh264",
  "-rc_mode",
  "quality",
  "-b:v",
  VIDEO_BITRATE,
  "-profile:v",
  "main",
  "-pix_fmt",
  "yuv420p",
];

interface TimelineCaption {
  captionId: string;
  startMs: number;
  audioMs: number;
}

interface TimelineScene {
  id: string;
  label: string;
  chapter: string;
  lanes: number;
  videos: string[];
  captions: TimelineCaption[];
}

/** ffmpeg with the banner suppressed, so a real error is actually readable. */
async function ffmpeg(args: string[]): Promise<void> {
  try {
    await run("ffmpeg", [...BASE, ...args]);
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? "";
    const detail = stderr.split("\n").filter(Boolean).slice(-6).join("\n  ");
    throw new Error(`ffmpeg failed: ${detail || (error as Error).message}`);
  }
}

async function durationOf(path: string): Promise<number> {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    path,
  ]);
  return Number.parseFloat(stdout.trim());
}

/**
 * Normalise a scene's lanes to 1080p and return the composited result.
 *
 * Lanes are tpad'ed to the longest of them first: two lanes recorded from
 * slightly different start instants would otherwise drift apart visibly by the
 * end of the scene.
 */
async function compositeLanes(scene: TimelineScene): Promise<{ path: string; duration: number }> {
  const durations = await Promise.all(scene.videos.map(durationOf));
  const longest = Math.max(...durations);

  // Split panes are half width and keep their own aspect ratio, letterboxed
  // inside the half-frame rather than cropped.
  const width = scene.lanes === 1 ? 1920 : 960;
  const height = 1080;

  const normalised = await Promise.all(
    scene.videos.map(async (video, lane) => {
      const out = join(SEGMENTS, `${scene.id}-lane${lane}.mp4`);
      const pad = Math.max(0, longest - durations[lane]!).toFixed(3);
      await ffmpeg([
        "-i",
        video,
        "-vf",
        [
          `fps=${FPS}`,
          `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
          `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x0f172a`,
          "setsar=1",
          `tpad=stop_mode=clone:stop_duration=${pad}`,
        ].join(","),
        "-an",
        ...H264,
        out,
      ]);
      return out;
    }),
  );

  if (normalised.length === 1) {
    return { path: normalised[0]!, duration: longest };
  }

  const joined = join(SEGMENTS, `${scene.id}-joined.mp4`);
  await ffmpeg([
    "-i",
    normalised[0]!,
    "-i",
    normalised[1]!,
    "-filter_complex",
    "[0:v][1:v]hstack=inputs=2[v]",
    "-map",
    "[v]",
    "-an",
    ...H264,
    joined,
  ]);

  return { path: joined, duration: longest };
}

/**
 * Pad the scene so every caption and its clip fit, and return the final scene
 * length including the trailing gap.
 */
async function padScene(
  scene: TimelineScene,
  video: string,
  videoDuration: number,
): Promise<number> {
  // Captions are laid onto the scene track at their logged offsets; the last
  // one ends at its start plus its clip length. If that runs past the video —
  // the toast is still on screen while the voice finishes — the tail is held.
  const captionsEnd = scene.captions.reduce(
    (end, caption) => Math.max(end, caption.startMs + caption.audioMs),
    0,
  );
  const requiredMs = Math.max(captionsEnd, videoDuration * 1000) + SCENE_GAP_S * 1000;

  const out = join(SEGMENTS, `${scene.id}-final.mp4`);
  const hold = Math.max(0, requiredMs / 1000 - videoDuration).toFixed(3);

  await ffmpeg([
    "-i",
    video,
    "-vf",
    `tpad=stop_mode=clone:stop_duration=${hold}`,
    "-an",
    ...H264,
    out,
  ]);

  return requiredMs / 1000;
}

/** Lay the caption clips for one scene onto a silent track. */
async function buildSceneAudio(scene: TimelineScene, sceneLength: number): Promise<string> {
  const out = join(SEGMENTS, `${scene.id}.m4a`);

  if (scene.captions.length === 0) {
    await ffmpeg([
      "-f",
      "lavfi",
      "-i",
      "anullsrc=r=44100:cl=stereo",
      "-t",
      sceneLength.toFixed(3),
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      out,
    ]);
    return out;
  }

  const inputs: string[] = [];
  const filters: string[] = [];

  scene.captions.forEach((caption, index) => {
    inputs.push("-i", join(AUDIO_DIR, `${caption.captionId}.mp3`));
    filters.push(
      `[${index}:a]adelay=${caption.startMs}|${caption.startMs},apad=whole_dur=${sceneLength.toFixed(3)}[a${index}]`,
    );
  });

  // amix with normalize=0 keeps each clip at full level; no two captions in a
  // scene overlap, so summing never clips either.
  const mixInputs = scene.captions.map((_, index) => `[a${index}]`).join("");
  filters.push(
    `${mixInputs}amix=inputs=${scene.captions.length}:normalize=0,` +
      `apad=whole_dur=${sceneLength.toFixed(3)},atrim=0:${sceneLength.toFixed(3)}[out]`,
  );

  await ffmpeg([
    ...inputs,
    "-filter_complex",
    filters.join(";"),
    "-map",
    "[out]",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-ar",
    "44100",
    out,
  ]);

  return out;
}

/**
 * Turn the per-scene lengths into absolute chapter windows, and give each
 * scene a short enough label to survive being squeezed into its segment.
 */
function buildChapters(timeline: TimelineScene[], lengths: number[]): Chapter[] {
  const chapters: Chapter[] = [];
  let start = 0;

  timeline.forEach((scene, index) => {
    const length = lengths[index] ?? 0;
    chapters.push({ label: scene.chapter ?? scene.label, start, end: start + length });
    start += length;
  });

  return chapters;
}

async function main(): Promise<void> {
  const timeline = JSON.parse(await readFile(TIMELINE, "utf8")) as TimelineScene[];
  const audioIndex = JSON.parse(await readFile(`${AUDIO_DIR}/index.json`, "utf8")) as {
    durations: Record<string, number>;
  };

  // Refuse rather than ship a video with silently missing narration.
  for (const scene of timeline) {
    for (const caption of scene.captions) {
      if (!audioIndex.durations[caption.captionId]) {
        throw new Error(
          `missing audio for "${caption.captionId}" in scene "${scene.id}" — run npm run demo:narrate`,
        );
      }
    }
  }

  await rm(SEGMENTS, { recursive: true, force: true });
  await mkdir(SEGMENTS, { recursive: true });
  await mkdir(dirname(FINAL), { recursive: true });

  const videoParts: string[] = [];
  const audioParts: string[] = [];
  const lengths: number[] = [];

  for (const scene of timeline) {
    process.stdout.write(`  ${scene.id.padEnd(16)}`);

    const composited = await compositeLanes(scene);
    const sceneLength = await padScene(scene, composited.path, composited.duration);
    const audio = await buildSceneAudio(scene, sceneLength);

    videoParts.push(join(SEGMENTS, `${scene.id}-final.mp4`));
    audioParts.push(audio);
    lengths.push(sceneLength);
    console.log(`${sceneLength.toFixed(1)}s · ${scene.captions.length} caption(s)`);
  }

  // Stream-copy concat: fast, and safe because every part was encoded with the
  // same settings above.
  //
  // Paths must be absolute: concat resolves entries relative to the list file,
  // which lives in out/segments.
  const videoList = join(SEGMENTS, "video.txt");
  const audioList = join(SEGMENTS, "audio.txt");
  const asEntries = (paths: string[]) => paths.map((path) => `file '${resolve(path)}'`).join("\n");
  await writeFile(videoList, asEntries(videoParts), "utf8");
  await writeFile(audioList, asEntries(audioParts), "utf8");

  const silentVideo = join(SEGMENTS, "video.mp4");
  await ffmpeg(["-f", "concat", "-safe", "0", "-i", videoList, "-c", "copy", silentVideo]);

  const joinedAudio = join(SEGMENTS, "audio.m4a");
  await ffmpeg(["-f", "concat", "-safe", "0", "-i", audioList, "-c", "copy", joinedAudio]);

  // Measure the picture and lay the chapter strip over it. The strip is drawn
  // here rather than copied through because it references the full timeline,
  // which only exists once every scene has been measured.
  const silentLength = await durationOf(silentVideo);
  const chapters = buildChapters(timeline, lengths);
  const strip = await chapterFilter(chapters, silentLength);

  await ffmpeg([
    "-i",
    silentVideo,
    "-i",
    joinedAudio,
    "-vf",
    strip,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "libopenh264",
    "-rc_mode",
    "quality",
    "-b:v",
    VIDEO_BITRATE,
    "-profile:v",
    "main",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-movflags",
    "+faststart",
    FINAL,
  ]);

  const total = await durationOf(FINAL);
  console.log(
    `\n${FINAL} · ${Math.floor(total / 60)}m ${Math.round(total % 60)}s · 1920x1080@${FPS}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
