import type { Command, ParsedSketch, SourceLocation } from "./types";

type TokenKind = "identifier" | "number" | "symbol" | "eof";

interface Token {
  kind: TokenKind;
  value: string;
  location: SourceLocation;
}

export class SketchParseError extends Error {
  readonly code: string;
  readonly location: SourceLocation;

  constructor(code: string, message: string, location: SourceLocation) {
    super(`${message} (line ${location.line}, column ${location.column})`);
    this.name = "SketchParseError";
    this.code = code;
    this.location = location;
  }
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let line = 1;
  let column = 1;
  let lineStart = true;

  const advance = (): string => {
    const char = source[index++]!;
    if (char === "\n") {
      line += 1;
      column = 1;
      lineStart = true;
    } else {
      column += 1;
      if (!/\s/.test(char)) lineStart = false;
    }
    return char;
  };

  while (index < source.length) {
    const char = source[index]!;

    if (/\s/.test(char)) {
      advance();
      continue;
    }

    if (lineStart && char === "#") {
      while (index < source.length && source[index] !== "\n") advance();
      continue;
    }

    if (char === "/" && source[index + 1] === "/") {
      while (index < source.length && source[index] !== "\n") advance();
      continue;
    }

    if (char === "/" && source[index + 1] === "*") {
      const start = { line, column };
      advance();
      advance();
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        advance();
      }
      if (index >= source.length) {
        throw new SketchParseError("UNTERMINATED_COMMENT", "Block comment is not closed.", start);
      }
      advance();
      advance();
      continue;
    }

    const location = { line, column };
    if (/[A-Za-z_]/.test(char)) {
      let value = "";
      while (index < source.length && /[A-Za-z0-9_]/.test(source[index]!)) value += advance();
      tokens.push({ kind: "identifier", value, location });
      continue;
    }

    if (/\d/.test(char) || (char === "." && /\d/.test(source[index + 1] ?? ""))) {
      const match = source.slice(index).match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
      if (!match) throw new SketchParseError("INVALID_NUMBER", "Invalid number.", location);
      for (let count = 0; count < match[0].length; count += 1) advance();
      tokens.push({ kind: "number", value: match[0], location });
      continue;
    }

    if ("{}();=,.-+".includes(char)) {
      tokens.push({ kind: "symbol", value: advance(), location });
      continue;
    }

    throw new SketchParseError("UNSUPPORTED_TOKEN", `Unsupported character '${char}'.`, location);
  }

  tokens.push({ kind: "eof", value: "", location: { line, column } });
  return tokens;
}

class Parser {
  private position = 0;
  private armVariable: string | null = null;
  private readonly pins: Record<string, number> = {};
  private setup: Command[] | null = null;
  private loop: Command[] | null = null;

  constructor(private readonly tokens: Token[]) {}

  parse(): ParsedSketch {
    while (!this.at("eof")) {
      if (this.atValue("MeArm")) this.parseArmDeclaration();
      else if (this.atValue("int")) this.parseIntegerDeclaration();
      else if (this.atValue("void")) this.parseFunction();
      else this.unsupported("Only MeArm, integer pin, setup(), and loop() declarations are supported here.");
    }

    if (!this.armVariable) this.fail("MISSING_ARM", "Declare one MeArm variable before setup().");
    if (!this.setup) this.fail("MISSING_SETUP", "A setup() function is required.");
    if (!this.loop) this.fail("MISSING_LOOP", "A loop() function is required.");
    if (!this.setup.some((command) => command.type === "begin")) {
      this.fail("MISSING_BEGIN", "setup() must initialize the arm with begin().");
    }

    return {
      armVariable: this.armVariable,
      pins: { ...this.pins },
      setup: this.setup,
      loop: this.loop,
    };
  }

  private parseArmDeclaration(): void {
    const start = this.consumeValue("MeArm");
    if (this.armVariable) this.fail("MULTIPLE_ARMS", "Only one MeArm instance is supported.", start);
    this.armVariable = this.consume("identifier", "Expected an arm variable name.").value;
    this.consumeValue(";");
  }

  private parseIntegerDeclaration(): void {
    this.consumeValue("int");
    const name = this.consume("identifier", "Expected a pin variable name.");
    this.consumeValue("=");
    const value = this.parseSignedNumber();
    if (!Number.isInteger(value)) this.fail("INVALID_PIN", "Pin values must be integers.", name);
    this.pins[name.value] = value;
    this.consumeValue(";");
  }

  private parseFunction(): void {
    this.consumeValue("void");
    const name = this.consume("identifier", "Expected a function name.");
    if (name.value !== "setup" && name.value !== "loop") {
      this.fail("UNSUPPORTED_FUNCTION", `Custom function '${name.value}' is not supported.`, name);
    }
    this.consumeValue("(");
    this.consumeValue(")");
    this.consumeValue("{");
    const commands: Command[] = [];
    while (!this.atValue("}")) {
      if (this.at("eof")) this.fail("UNCLOSED_FUNCTION", `${name.value}() is missing a closing brace.`, name);
      if (this.atValue(";")) {
        this.take();
        continue;
      }
      commands.push(this.parseStatement());
    }
    this.consumeValue("}");
    if (name.value === "setup") {
      if (this.setup) this.fail("DUPLICATE_SETUP", "Only one setup() function is supported.", name);
      this.setup = commands;
    } else {
      if (this.loop) this.fail("DUPLICATE_LOOP", "Only one loop() function is supported.", name);
      this.loop = commands;
    }
  }

  private parseStatement(): Command {
    const receiver = this.consume("identifier", "Expected a supported MeArm call or delay().");
    if (receiver.value === "delay") {
      this.consumeValue("(");
      const milliseconds = this.parseSignedNumber();
      if (!Number.isInteger(milliseconds) || milliseconds < 0) {
        this.fail("INVALID_DELAY", "delay() requires a non-negative integer literal.", receiver);
      }
      this.consumeValue(")");
      this.consumeValue(";");
      return { type: "delay", milliseconds, location: receiver.location };
    }

    if (receiver.value !== this.armVariable) {
      this.fail("UNKNOWN_RECEIVER", `Calls must use the declared arm variable '${this.armVariable}'.`, receiver);
    }
    this.consumeValue(".");
    const method = this.consume("identifier", "Expected a MeArm method name.");
    this.consumeValue("(");

    if (method.value === "openClaw" || method.value === "closeClaw") {
      this.consumeValue(")");
      this.consumeValue(";");
      return { type: method.value, location: receiver.location };
    }

    if (method.value === "moveToXYZ" || method.value === "snapToXYZ") {
      const x = this.parseSignedNumber();
      this.consumeValue(",");
      const y = this.parseSignedNumber();
      this.consumeValue(",");
      const z = this.parseSignedNumber();
      this.consumeValue(")");
      this.consumeValue(";");
      return {
        type: method.value === "moveToXYZ" ? "move" : "snap",
        target: { x, y, z },
        location: receiver.location,
      };
    }

    if (method.value === "begin") {
      const pins: number[] = [];
      for (let index = 0; index < 4; index += 1) {
        if (index > 0) this.consumeValue(",");
        const token = this.current();
        if (token.kind === "identifier") {
          this.take();
          if (!(token.value in this.pins)) this.fail("UNKNOWN_PIN", `Pin '${token.value}' is not declared.`, token);
          pins.push(this.pins[token.value]!);
        } else {
          const value = this.parseSignedNumber();
          if (!Number.isInteger(value)) this.fail("INVALID_PIN", "Pin values must be integers.", token);
          pins.push(value);
        }
      }
      this.consumeValue(")");
      this.consumeValue(";");
      return { type: "begin", pins: pins as [number, number, number, number], location: receiver.location };
    }

    this.fail("UNSUPPORTED_METHOD", `MeArm method '${method.value}' is not supported.`, method);
  }

  private parseSignedNumber(): number {
    let sign = 1;
    if (this.atValue("+") || this.atValue("-")) sign = this.take().value === "-" ? -1 : 1;
    const token = this.consume("number", "Expected a numeric literal.");
    const value = sign * Number(token.value);
    if (!Number.isFinite(value)) this.fail("INVALID_NUMBER", "Number must be finite.", token);
    return value;
  }

  private current(): Token {
    return this.tokens[this.position]!;
  }

  private take(): Token {
    return this.tokens[this.position++]!;
  }

  private at(kind: TokenKind): boolean {
    return this.current().kind === kind;
  }

  private atValue(value: string): boolean {
    return this.current().value === value;
  }

  private consume(kind: TokenKind, message: string): Token {
    if (!this.at(kind)) this.fail("UNEXPECTED_TOKEN", message);
    return this.take();
  }

  private consumeValue(value: string): Token {
    if (!this.atValue(value)) this.fail("UNEXPECTED_TOKEN", `Expected '${value}'.`);
    return this.take();
  }

  private unsupported(message: string): never {
    this.fail("UNSUPPORTED_STATEMENT", message);
  }

  private fail(code: string, message: string, token = this.current()): never {
    throw new SketchParseError(code, message, token.location);
  }
}

export function parseSketch(source: string): ParsedSketch {
  return new Parser(tokenize(source)).parse();
}
