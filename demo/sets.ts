/**
 * Which demo to record and compose.
 *
 * Two cuts come out of the same harness:
 *   main     — the linear walkthrough of every requirement
 *   parallel — the split-screen cut, one user per server, side by side
 *
 * DEMO_SET picks between them; DEMO_SCENES narrows either one to a few scenes
 * while iterating.
 */

import { PARALLEL_SCENES } from "./scenes-parallel";
import { SCENES, type Scene } from "./scenes";

export type DemoSet = "main" | "parallel";

export interface DemoTarget {
  set: DemoSet;
  scenes: Scene[];
  /** Where the recorder writes the scene/caption plan. */
  timeline: string;
  /** The finished video. */
  output: string;
}

const TARGETS: Record<DemoSet, Omit<DemoTarget, "set">> = {
  main: {
    scenes: SCENES,
    timeline: "demo/out/timeline.json",
    output: "demo/out/demo.mp4",
  },
  parallel: {
    scenes: PARALLEL_SCENES,
    timeline: "demo/out/timeline-parallel.json",
    output: "demo/out/demo-parallel.mp4",
  },
};

function resolveSet(): DemoSet {
  const raw = (process.env.DEMO_SET ?? "main").trim();
  if (raw !== "main" && raw !== "parallel") {
    throw new Error(`DEMO_SET must be "main" or "parallel", got "${raw}"`);
  }
  return raw;
}

/** The set named by DEMO_SET, with DEMO_SCENES applied if it is set. */
export function activeTarget(): DemoTarget {
  const set = resolveSet();
  const base = TARGETS[set];

  const filter = (process.env.DEMO_SCENES ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return {
    set,
    scenes: filter.length ? base.scenes.filter((scene) => filter.includes(scene.id)) : base.scenes,
    timeline: base.timeline,
    output: base.output,
  };
}
