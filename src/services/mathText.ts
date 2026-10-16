// Pembersih teks hasil AI: mengubah sisa kode LaTeX menjadi simbol Unicode
// dan menghapus format markdown (*, **, #) agar teks rapi saat tampil di aplikasi.

const SUPERSCRIPT: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "−": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", "n": "ⁿ", "i": "ⁱ", "x": "ˣ", "y": "ʸ",
};

const SUBSCRIPT: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎", "a": "ₐ", "e": "ₑ", "o": "ₒ", "x": "ₓ", "h": "ₕ",
  "k": "ₖ", "l": "ₗ", "m": "ₘ", "n": "ₙ", "p": "ₚ", "s": "ₛ", "t": "ₜ", "i": "ᵢ", "r": "ᵣ", "u": "ᵤ", "v": "ᵥ",
};

const LATEX_SYMBOLS: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", Gamma: "Γ", delta: "δ", Delta: "Δ", epsilon: "ε", varepsilon: "ε",
  zeta: "ζ", eta: "η", theta: "θ", Theta: "Θ", lambda: "λ", Lambda: "Λ", mu: "μ", nu: "ν", xi: "ξ",
  pi: "π", Pi: "Π", rho: "ρ", sigma: "σ", Sigma: "Σ", tau: "τ", phi: "φ", varphi: "φ", Phi: "Φ",
  chi: "χ", psi: "ψ", Psi: "Ψ", omega: "ω", Omega: "Ω",
  cdot: "·", times: "×", div: "÷", pm: "±", mp: "∓", leq: "≤", le: "≤", geq: "≥", ge: "≥",
  neq: "≠", ne: "≠", approx: "≈", sim: "∼", equiv: "≡", infty: "∞", propto: "∝", partial: "∂",
  rightarrow: "→", to: "→", leftarrow: "←", Rightarrow: "⇒", Leftarrow: "⇐", leftrightarrow: "↔",
  circ: "°", degree: "°", int: "∫", sum: "Σ", prod: "∏", nabla: "∇", perp: "⊥", parallel: "∥",
  angle: "∠", triangle: "△", ldots: "…", cdots: "⋯", dots: "…",
  sin: "sin ", cos: "cos ", tan: "tan ", cot: "cot ", sec: "sec ", csc: "csc ",
  arcsin: "arcsin ", arccos: "arccos ", arctan: "arctan ", log: "log ", ln: "ln ", exp: "exp ",
  lim: "lim ", max: "max ", min: "min ",
};

// Membungkus dengan kurung jika isinya lebih dari satu "token", misal a+b -> (a+b)
function wrap(s: string): string {
  const t = s.trim();
  return /^[A-Za-z0-9.\u0370-\u03FF\u2070-\u209F\u00B2\u00B3\u00B9\u20D7]+$/.test(t) ? t : `(${t})`;
}

function toScript(s: string, map: Record<string, string>): string | null {
  let out = "";
  for (const ch of s) {
    if (!map[ch]) return null;
    out += map[ch];
  }
  return out;
}

// Mengubah satu potongan kode LaTeX menjadi teks Unicode
export function latexToUnicode(input: string): string {
  let s = input;

  // Perintah pembungkus teks: \text{abc} -> abc
  s = s.replace(/\\(?:text|mathrm|mathbf|mathit|operatorname|textbf|textit)\s*\{([^{}]*)\}/g, "$1");
  s = s.replace(/\\(?:left|right|big|Big|bigg|Bigg)\s*/g, "");
  s = s.replace(/\\(?:,|;|:|!|quad|qquad)/g, " ");

  // Pecahan & akar (diulang untuk menangani pecahan bertingkat)
  for (let i = 0; i < 6; i++) {
    const before = s;
    s = s.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, (_, a, b) => `${wrap(a)}/${wrap(b)}`);
    s = s.replace(/\\sqrt\s*\[([^\]]*)\]\s*\{([^{}]*)\}/g, (_, n, x) => `${toScript(n, SUPERSCRIPT) ?? n}√${wrap(x)}`);
    s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, (_, x) => `√${wrap(x)}`);
    s = s.replace(/\\(?:vec|overrightarrow)\s*\{([^{}]*)\}/g, (_, x) => `${x}\u20D7`);
    s = s.replace(/\\(?:hat|bar|overline)\s*\{([^{}]*)\}/g, "$1");
    if (s === before) break;
  }
  s = s.replace(/\\(?:vec|overrightarrow)\s*([A-Za-z])/g, "$1\u20D7");

  // Simbol & huruf Yunani
  s = s.replace(/\\([A-Za-z]+)/g, (m, name) => LATEX_SYMBOLS[name] ?? m);

  // Pangkat & indeks
  s = s.replace(/\^\{([^{}]*)\}/g, (_, x) => toScript(x, SUPERSCRIPT) ?? `^(${x})`);
  s = s.replace(/\^([A-Za-z0-9+\-])/g, (_, x) => toScript(x, SUPERSCRIPT) ?? `^${x}`);
  s = s.replace(/_\{([^{}]*)\}/g, (_, x) => toScript(x, SUBSCRIPT) ?? `_${x}`);
  s = s.replace(/_([A-Za-z0-9])/g, (_, x) => toScript(x, SUBSCRIPT) ?? `_${x}`);

  // Sisa perintah yang tidak dikenal & kurung kurawal
  s = s.replace(/\\[A-Za-z]+/g, "");
  s = s.replace(/[{}]/g, "");
  s = s.replace(/\\/g, "");
  return s.replace(/[ \t]{2,}/g, " ").trim();
}

// Menghapus format markdown: **tebal**, *miring*, # judul, bullet "*" / "-"
function stripMarkdown(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      let l = line;
      l = l.replace(/^(\s*)#{1,6}\s+/, "$1");              // # Judul
      l = l.replace(/^(\s*)[*\-+]\s+/, "$1• ");             // * poin / - poin
      l = l.replace(/\*\*([^*\n]+?)\*\*/g, "$1");           // **tebal**
      l = l.replace(/__([^_\n]+?)__/g, "$1");               // __tebal__
      l = l.replace(/\*([^*\n]+?)\*/g, "$1");               // *miring*
      l = l.replace(/\s\*\s/g, " × ");                      // "a * b" -> "a × b"
      l = l.replace(/\*/g, "");                             // sisa bintang
      l = l.replace(/`([^`]*)`/g, "$1");                    // `kode`
      return l;
    })
    .join("\n");
}

// Mengubah LaTeX di dalam kalimat ($...$, \(...\)) menjadi Unicode
function convertInlineLatex(text: string): string {
  return text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, x) => latexToUnicode(x.replace(/\s*\n\s*/g, " ")))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, x) => latexToUnicode(x.replace(/\s*\n\s*/g, " ")))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, x) => latexToUnicode(x))
    .replace(/\$([^$\n]+?)\$/g, (_, x) => latexToUnicode(x));
}

// Untuk teks pendek (soal, pilihan jawaban, penjelasan)
export function cleanMathText(text: string): string {
  if (!text) return text;
  let s = convertInlineLatex(String(text));
  if (/\\[A-Za-z]+/.test(s)) s = latexToUnicode(s); // sisa LaTeX tanpa tanda $
  return stripMarkdown(s).replace(/[ \t]{2,}/g, " ").trim();
}

function isLatexBlockLine(line: string): boolean {
  const t = line.trim();
  return /^\$\$[\s\S]*\$\$$/.test(t) || /^\\\[[\s\S]*\\\]$/.test(t) || (/^\$[^$]+\$$/.test(t) && /\\[A-Za-z]/.test(t));
}

function looksLikeFormula(line: string): boolean {
  const t = line.trim();
  return t.length > 0 && /[=]/.test(t) && !/\$|\\[A-Za-z]/.test(t);
}

// Untuk teks panjang hasil membaca gambar
export function cleanOcrText(text: string): string {
  if (!text) return "";

  // Satukan blok $$ ... $$ yang terpecah ke beberapa baris
  let s = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, x) => `$$${x.replace(/\s*\n\s*/g, " ")}$$`);
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_, x) => `\\[${x.replace(/\s*\n\s*/g, " ")}\\]`);

  const lines = s.split("\n");
  const nextNonEmpty = (i: number, dir: 1 | -1) => {
    for (let j = i + dir; j >= 0 && j < lines.length; j += dir) {
      if (lines[j].trim()) return lines[j];
    }
    return "";
  };

  const kept: string[] = [];
  lines.forEach((line, i) => {
    if (isLatexBlockLine(line)) {
      // Jika rumus yang sama sudah ditulis dalam versi Unicode di sebelahnya, buang versi LaTeX-nya
      if (looksLikeFormula(nextNonEmpty(i, 1)) || looksLikeFormula(nextNonEmpty(i, -1))) return;
      const indent = line.match(/^\s*/)?.[0] ?? "";
      kept.push(indent + latexToUnicode(line.trim().replace(/^\$\$|\$\$$|^\\\[|\\\]$|^\$|\$$/g, "")));
      return;
    }
    kept.push(line);
  });

  let out = convertInlineLatex(kept.join("\n"));
  out = stripMarkdown(out);
  return out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
