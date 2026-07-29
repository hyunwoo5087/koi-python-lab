type SkulptRuntime = {
  configure: (options: Record<string, unknown>) => void;
  builtinFiles?: { files?: Record<string, string> };
  builtin: { EOFError: new (message: string) => Error };
  python3: unknown;
  misceval: {
    asyncToPromise: (callback: () => unknown) => Promise<unknown>;
  };
  importMainWithBody: (
    name: string,
    dumpJs: boolean,
    code: string,
    canSuspend: boolean
  ) => unknown;
};

let skulptPromise: Promise<SkulptRuntime> | null = null;

function loadSkulpt() {
  if (!skulptPromise) {
    skulptPromise = import("skulpt").then(
      (module) => module.default as SkulptRuntime
    );
  }
  return skulptPromise;
}

export function cleanOutput(text: string) {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

export function friendlyError(raw: string) {
  const text = raw.replace(/File "\<stdin\>", /g, "").replace(/\s+at .*/g, "").trim();
  if (/TimeLimitError|timed out|execution time/i.test(text)) {
    return "코드가 너무 오래 멈추지 않았어요. 반복이 끝나는 조건을 확인해 보세요.";
  }
  if (/IndentationError/i.test(text)) {
    return "들여쓰기가 맞지 않아요. if·for 아래 줄은 같은 칸만큼 띄웠는지 확인해 보세요.";
  }
  if (/SyntaxError/i.test(text)) {
    return `파이썬 문법을 읽지 못했어요. 괄호, 따옴표, 콜론(:)을 살펴보세요. (${text})`;
  }
  if (/EOFError|input/i.test(text)) {
    return "input()의 개수나 입력을 나누는 방법을 확인해 보세요.";
  }
  if (/NameError/i.test(text)) {
    return `아직 만들지 않은 이름을 사용한 것 같아요. 변수 이름의 철자도 확인해 보세요. (${text})`;
  }
  return `실행하는 중 문제가 생겼어요. ${text}`;
}

export async function runPython(code: string, input: string) {
  const Sk = await loadSkulpt();
  let output = "";
  let inputIndex = 0;
  const inputLines = input.replace(/\r/g, "").replace(/\n$/, "").split("\n");

  Sk.configure({
    output: (text: string) => {
      output += text;
    },
    read: (path: string) => {
      const file = Sk.builtinFiles?.files?.[path];
      if (file === undefined) throw new Error(`File not found: ${path}`);
      return file;
    },
    __future__: Sk.python3,
    execLimit: 1800,
    yieldLimit: 50,
    retainGlobals: false,
    inputfunTakesPrompt: true,
    inputfun: () => {
      if (inputIndex >= inputLines.length) {
        throw new Sk.builtin.EOFError("EOF when reading a line");
      }
      return inputLines[inputIndex++];
    },
  });

  await Sk.misceval.asyncToPromise(() =>
    Sk.importMainWithBody("<stdin>", false, code, true)
  );
  return cleanOutput(output);
}
