import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");
const html = await readFile(join(dist, "index.html"), "utf8");
const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
const external = references.filter((reference) => /^(?:https?:)?\/\//i.test(reference));

if (external.length > 0) {
  throw new Error(`External runtime assets found: ${external.join(", ")}`);
}

for (const reference of references.filter((item) => item.startsWith("/"))) {
  const clean = reference.split(/[?#]/, 1)[0].replace(/^\//, "");
  await access(join(dist, clean));
}

const assetsDirectory = join(dist, "assets");
let combinedCss = "";
for (const file of await readdir(assetsDirectory)) {
  if (!file.endsWith(".css")) continue;
  const css = await readFile(join(assetsDirectory, file), "utf8");
  combinedCss += css;
  if (/url\(\s*["']?(?:https?:)?\/\//i.test(css)) {
    throw new Error(`External CSS asset found in ${file}.`);
  }
}

const requiredCss = [
  ["focus-visible", combinedCss.includes(":focus-visible")],
  ["780px responsive layout", combinedCss.includes("max-width:780px") || combinedCss.includes("width<=780px")],
  ["reduced motion", combinedCss.includes("prefers-reduced-motion:reduce")],
];
for (const [name, present] of requiredCss) {
  if (!present) throw new Error(`Required release CSS rule is missing: ${name}`);
}

console.log(`Offline verification passed: ${references.length} local document assets.`);
