const KEYWORDS = new Set([
  "break", "case", "const", "continue", "do", "else", "for", "if", "return", "static", "switch", "while",
]);

const TYPES = new Set([
  "bool", "char", "double", "float", "int", "long", "MeArm", "Servo", "short", "signed", "unsigned", "void",
]);

const LITERALS = new Set(["false", "HIGH", "LOW", "nullptr", "true"]);

const escapeHtml = (value: string): string => value.replace(/[&<>]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
})[character]!);

const span = (kind: string, value: string): string => `<span class="syntax-${kind}">${escapeHtml(value)}</span>`;
const isIdentifierStart = (character: string): boolean => /[A-Za-z_]/.test(character);
const isIdentifierPart = (character: string): boolean => /[A-Za-z0-9_]/.test(character);

function quotedEnd(source: string, start: number, quote: string): number {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === "\\") index += 2;
    else if (source[index] === quote) return index + 1;
    else index += 1;
  }
  return source.length;
}

export function highlightArduino(source: string): string {
  let output = "";
  let index = 0;

  while (index < source.length) {
    if (source.startsWith("//", index)) {
      const end = source.indexOf("\n", index);
      const stop = end === -1 ? source.length : end;
      output += span("comment", source.slice(index, stop));
      index = stop;
      continue;
    }

    if (source.startsWith("/*", index)) {
      const end = source.indexOf("*/", index + 2);
      const stop = end === -1 ? source.length : end + 2;
      output += span("comment", source.slice(index, stop));
      index = stop;
      continue;
    }

    const character = source[index]!;
    const lineStart = source.lastIndexOf("\n", index - 1) + 1;
    if (character === "#" && source.slice(lineStart, index).trim() === "") {
      const end = source.indexOf("\n", index);
      const stop = end === -1 ? source.length : end;
      output += span("preprocessor", source.slice(index, stop));
      index = stop;
      continue;
    }

    if (character === '"' || character === "'") {
      const end = quotedEnd(source, index, character);
      output += span("string", source.slice(index, end));
      index = end;
      continue;
    }

    const number = source.slice(index).match(/^(?:0[xX][\dA-Fa-f]+|\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)/)?.[0];
    if (number) {
      output += span("number", number);
      index += number.length;
      continue;
    }

    if (isIdentifierStart(character)) {
      let end = index + 1;
      while (end < source.length && isIdentifierPart(source[end]!)) end += 1;
      const identifier = source.slice(index, end);
      const nextCharacter = source.slice(end).match(/^\s*(.)/)?.[1];
      const kind = KEYWORDS.has(identifier)
        ? "keyword"
        : TYPES.has(identifier)
          ? "type"
          : LITERALS.has(identifier)
            ? "literal"
            : nextCharacter === "("
              ? "function"
              : "identifier";
      output += kind === "identifier" ? escapeHtml(identifier) : span(kind, identifier);
      index = end;
      continue;
    }

    const operator = source.slice(index).match(/^[+\-*/%=!<>?:&|~^]+/)?.[0];
    if (operator) {
      output += span("operator", operator);
      index += operator.length;
      continue;
    }

    output += escapeHtml(character);
    index += 1;
  }

  return output + (source.endsWith("\n") ? " " : "");
}
