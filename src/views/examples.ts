import freeFormSketch from "../samples/MeArm_Free_Form.ino?raw";
import instructorSketch from "../samples/MeArm_Dance_Instructor.ino?raw";
import studentSketch from "../samples/MeArm_Dance_Student.ino?raw";
import cyberpunkBeatSketch from "../samples/MeArm_Cyberpunk_Beat_Dance.ino?raw";
import houseShapeSketch from "../samples/MeArm_House_Shape_Dance.ino?raw";
import pickAndPlaceSketch from "../samples/MeArm_Pick_And_Place.ino?raw";
import sortingLineSketch from "../samples/MeArm_Sorting_Line.ino?raw";
import palletizingSketch from "../samples/MeArm_Palletizing.ino?raw";

/**
 * The bundled sketches, grouped by what a student is meant to do with them.
 *
 * A single flat dropdown gave a student no way to tell that "Student starter"
 * is an exercise to edit while "Palletizing" is a routine to watch. The grouping
 * below follows the categories already used in docs/CLASSROOM_INTERFACE.md.
 */

export type SampleMode =
  | "instructor" | "student" | "pick-place" | "sorting"
  | "palletizing" | "house" | "cyberpunk" | "freeform";

export const samples: Record<SampleMode, { title: string; source: string; description: string }> = {
  student: {
    title: "Student starter",
    source: studentSketch,
    description: "Change a working dance. Three guided edits: rhythm, order, and one pose of your own.",
  },
  freeform: {
    title: "Free form",
    source: freeFormSketch,
    description: "An almost empty sketch with the reach limits shown on the viewport. Explore what the arm can and cannot reach.",
  },
  instructor: {
    title: "Instructor dance",
    source: instructorSketch,
    description: "The full demonstration sequence, using only instructor-approved poses.",
  },
  house: {
    title: "House shape dance",
    source: houseShapeSketch,
    description: "Traces a house outline in the X–Z plane, so a list of coordinates becomes a drawing you can predict.",
  },
  cyberpunk: {
    title: "Cyberpunk beat dance",
    source: cyberpunkBeatSketch,
    description: "Choreography timed to a 90 BPM track, where the delays become musical structure.",
  },
  "pick-place": {
    title: "Pick and place",
    source: pickAndPlaceSketch,
    description: "Moves a part between two workstations: approach, lift, transfer, place, retract.",
  },
  sorting: {
    title: "Sorting line",
    source: sortingLineSketch,
    description: "Routes two known parts through an inspection waypoint into left and right bins. Fixed order, no sensors.",
  },
  palletizing: {
    title: "Palletizing",
    source: palletizingSketch,
    description: "Repeats a supply-to-pallet cycle across three pallet positions.",
  },
};

export function isSampleMode(value: string): value is SampleMode {
  return Object.prototype.hasOwnProperty.call(samples, value);
}

interface ExampleGroup {
  title: string;
  blurb: string;
  modes: SampleMode[];
}

export const EXAMPLE_GROUPS: readonly ExampleGroup[] = [
  {
    title: "Lessons",
    blurb: "Open these and change the code.",
    modes: ["student", "freeform"],
  },
  {
    title: "Dances",
    blurb: "Complete routines to watch and take ideas from.",
    modes: ["instructor", "house", "cyberpunk"],
  },
  {
    title: "Industrial routines",
    blurb: "How the same commands are used on a production line. Custom poses need physical review.",
    modes: ["pick-place", "sorting", "palletizing"],
  },
];

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"]/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character] ?? character);

/**
 * Renders the gallery. `stats` carries a short factual line per sketch — the
 * command count and loop duration, measured by compiling each one with the real
 * timeline builder rather than being written down by hand and going stale.
 */
export function renderExampleGallery(
  container: HTMLElement,
  activeMode: SampleMode,
  stats: ReadonlyMap<SampleMode, string>,
): void {
  container.innerHTML = EXAMPLE_GROUPS.map((group) => {
    const cards = group.modes.map((mode) => {
      const sample = samples[mode];
      const measured = stats.get(mode);
      const current = mode === activeMode;
      return `<button class="example-card${current ? " is-current" : ""}" type="button" data-mode="${mode}"${current ? ' aria-current="true"' : ""}>
        <span class="example-card-name">${escapeHtml(sample.title)}</span>
        <span class="example-card-description">${escapeHtml(sample.description)}</span>
        <span class="example-card-meta">${measured ? escapeHtml(measured) : ""}</span>
      </button>`;
    }).join("");
    return `<section class="example-group">
      <h3 class="example-group-title">${escapeHtml(group.title)}</h3>
      <p class="example-group-blurb">${escapeHtml(group.blurb)}</p>
      <div class="example-card-row">${cards}</div>
    </section>`;
  }).join("");
}
