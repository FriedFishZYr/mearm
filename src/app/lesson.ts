/**
 * Reads the lesson out of the sketch's own comments.
 *
 * The bundled teaching sketches already carry their lesson: a PROJECT GOAL
 * block and numbered `// TODO n - TITLE` steps with prediction prompts beneath
 * them. Until now none of it was visible unless a student scrolled the source
 * and noticed.
 *
 * Extracting rather than duplicating means an instructor writes a lesson by
 * editing the `.ino` file — which is how this product is actually used — and
 * the interface follows. Nothing here is required: a sketch with no goal and no
 * TODO comments simply has no lesson, and the strip stays hidden.
 */

export interface LessonStep {
  /** The number written in the comment, which need not be sequential. */
  number: number;
  title: string;
  /** 1-based source line of the TODO comment itself. */
  line: number;
  /** The comment lines beneath the marker, joined into one prompt. */
  detail: string;
}

export interface Lesson {
  goal?: string;
  steps: LessonStep[];
}

const TODO_MARKER = /^\s*\/\/\s*TODO\s+(\d+)\s*[-–—:]\s*(.+?)\s*$/;
const COMMENT_LINE = /^\s*\/\/\s?(.*)$/;
const GOAL_HEADING = /^\s*PROJECT GOAL\s*$/;

function extractGoal(lines: readonly string[]): string | undefined {
  const heading = lines.findIndex((line) => GOAL_HEADING.test(line));
  if (heading === -1) return undefined;
  const paragraph: string[] = [];
  for (let index = heading + 1; index < lines.length; index += 1) {
    const line = (lines[index] ?? "").trim();
    if (!line || line.startsWith("*/")) break;
    paragraph.push(line);
  }
  const goal = paragraph.join(" ").trim();
  return goal || undefined;
}

export function extractLesson(source: string): Lesson | null {
  const lines = source.split("\n");
  const steps: LessonStep[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const marker = TODO_MARKER.exec(lines[index] ?? "");
    if (!marker) continue;

    const detail: string[] = [];
    for (let follow = index + 1; follow < lines.length; follow += 1) {
      const comment = COMMENT_LINE.exec(lines[follow] ?? "");
      if (!comment) break;
      detail.push((comment[1] ?? "").trim());
    }

    steps.push({
      number: Number(marker[1]),
      title: (marker[2] ?? "").trim(),
      line: index + 1,
      detail: detail.join(" ").replace(/\s+/g, " ").trim(),
    });
  }

  const goal = extractGoal(lines);
  if (!goal && steps.length === 0) return null;
  return goal ? { goal, steps } : { steps };
}
