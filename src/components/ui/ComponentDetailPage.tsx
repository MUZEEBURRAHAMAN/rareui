"use client";

import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { domToFigmaSvg } from "@/utils/domToFigmaSvg";
import { AiIcon } from "./AiIcon";
import { PromptModal } from "./PromptModal";

interface CodeFile {
  name: string;
  code: string;
}

interface ComponentDetailPageProps {
  title: string;
  description: string;
  category: string;
  categoryGroup: string;
  installCommand?: string;
  files: CodeFile[];
  foundationFile?: string;
  foundationHref?: string;
  children: ReactNode;
}

export const ComponentDetailPage = memo(function ComponentDetailPage({
  title,
  description,
  category,
  categoryGroup,
  installCommand,
  files,
  foundationFile = "src/index.css",
  foundationHref,
  children,
}: ComponentDetailPageProps) {
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("dark");
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [figmaStatus, setFigmaStatus] = useState<"idle" | "copying" | "done">("idle");
  const [promptOpen, setPromptOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const activeFile = files[activeFileIdx];

  const copyInstall = useCallback(() => {
    if (installCommand) {
      navigator.clipboard?.writeText(installCommand);
      setCopiedInstall(true);
    }
  }, [installCommand]);

  const copyCode = useCallback(() => {
    if (activeFile) {
      navigator.clipboard?.writeText(activeFile.code);
      setCopiedCode(true);
    }
  }, [activeFile]);

  const copyAsSvg = useCallback(async () => {
    if (!previewRef.current) return;
    setFigmaStatus("copying");
    try {
      const svgText = await domToFigmaSvg(previewRef.current);
      await navigator.clipboard.writeText(svgText);
      setFigmaStatus("done");
    } catch {
      setFigmaStatus("idle");
    }
  }, []);

  const openPrompt = useCallback(() => setPromptOpen(true), []);
  const closePrompt = useCallback(() => setPromptOpen(false), []);

  useEffect(() => {
    if (figmaStatus !== "done") return;
    const t = setTimeout(() => setFigmaStatus("idle"), 2000);
    return () => clearTimeout(t);
  }, [figmaStatus]);

  useEffect(() => {
    if (!copiedInstall) return;
    const t = setTimeout(() => setCopiedInstall(false), 1600);
    return () => clearTimeout(t);
  }, [copiedInstall]);

  useEffect(() => {
    if (!copiedCode) return;
    const t = setTimeout(() => setCopiedCode(false), 1600);
    return () => clearTimeout(t);
  }, [copiedCode]);

  useEffect(() => {
    setCopiedCode(false);
  }, [activeFileIdx]);

  return (
    <div className="mx-auto min-h-svh max-w-4xl pb-16">
      {/* ── Breadcrumb ── */}
      <div className="px-5 pt-6 sm:px-8">
        <div className="flex items-center gap-2 text-[13px] text-ink-3">
          <a href="/" className="transition-colors hover:text-ink">Components</a>
          <span className="text-ink-4">/</span>
          <span>{categoryGroup}</span>
        </div>
      </div>

      {/* ── Title ── */}
      <header className="px-5 pt-5 pb-8 sm:px-8">
        <h1 className="text-[28px] font-bold tracking-tight text-ink sm:text-[36px]">
          {title}
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-ink-3">
          {description}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-medium text-ink-4">
            {category}
          </span>
        </div>
      </header>

      {/* ── Preview ── */}
      <section className="px-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-[16px] font-semibold text-ink">Preview</h2>
          <div className="flex items-center gap-1.5">
            {/* Copy for Figma — editable SVG */}
            <button
              type="button"
              onClick={copyAsSvg}
              disabled={figmaStatus === "copying"}
              className="flex items-center gap-1.5 rounded-control border border-accent/40 bg-accent-dim px-2.5 py-1.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {figmaStatus === "copying"
                ? "Copying…"
                : figmaStatus === "done"
                  ? "Copied!"
                  : "Figma"}
            </button>
            {/* AI prompt */}
            <button
              type="button"
              onClick={openPrompt}
              aria-label="AI prompt"
              className="flex items-center justify-center rounded-control border border-line p-1.5 text-ink-3 transition-colors hover:bg-hover hover:text-ink"
            >
              <AiIcon />
            </button>
            {/* Theme toggle */}
            <div className="flex overflow-hidden rounded-control border border-line">
              <button
                type="button"
                onClick={() => setPreviewTheme("light")}
                className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  previewTheme === "light"
                    ? "bg-ink text-canvas"
                    : "bg-surface text-ink-3 hover:text-ink"
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setPreviewTheme("dark")}
                className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  previewTheme === "dark"
                    ? "bg-ink text-canvas"
                    : "bg-surface text-ink-3 hover:text-ink"
                }`}
              >
                Dark
              </button>
            </div>
          </div>
        </div>
        <div
          ref={previewRef}
          data-theme={previewTheme}
          className="relative overflow-hidden rounded-[16px] border border-line"
          style={{
            backgroundColor: "var(--color-canvas)",
            minHeight: 420,
          }}
        >
          {children}
        </div>
      </section>

      {/* ── Install ── */}
      {installCommand && (
        <section className="px-5 pt-10 sm:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-ink">Install</h2>
            <button
              type="button"
              onClick={copyInstall}
              className="rounded-control border border-line px-3 py-1.5 text-[12px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
            >
              {copiedInstall ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="overflow-x-auto rounded-[12px] border border-line bg-surface px-4 py-3">
            <pre className="font-mono text-[13px] text-ink-2">
              <span className="mr-2 select-none text-ink-4">$</span>
              {installCommand}
            </pre>
          </div>
        </section>
      )}

      {/* ── Code ── */}
      <section className="px-5 pt-10 sm:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold text-ink">Code</h2>
          <button
            type="button"
            onClick={copyCode}
            className="rounded-control border border-line px-3 py-1.5 text-[12px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
          >
            {copiedCode ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="overflow-hidden rounded-[12px] border border-line">
          {/* File tabs */}
          {files.length > 1 && (
            <div className="flex overflow-x-auto border-b border-line bg-surface">
              {files.map((file, idx) => (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => setActiveFileIdx(idx)}
                  className={`shrink-0 border-b-2 px-4 py-2.5 font-mono text-[12px] transition-colors ${
                    idx === activeFileIdx
                      ? "border-accent bg-canvas text-ink"
                      : "border-transparent text-ink-3 hover:bg-hover hover:text-ink-2"
                  }`}
                >
                  {file.name}
                </button>
              ))}
            </div>
          )}
          {/* Code body */}
          <div className="max-h-[600px] overflow-auto bg-canvas p-4 sm:p-5">
            <pre className="font-mono text-[12.5px] leading-[1.7]">
              <code>
                {activeFile?.code.split("\n").map((line, i) => (
                  <div key={i} className="flex">
                    <span className="mr-4 inline-block w-8 select-none text-right text-ink-4/50">
                      {i + 1}
                    </span>
                    <SyntaxLine text={line} />
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* ── Foundation note ── */}
      {foundationFile && (
        <section className="px-5 pt-8 sm:px-8">
          <div className="flex items-center gap-2 rounded-[12px] border border-line bg-surface px-4 py-3">
            <svg className="shrink-0 text-ink-4" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-ink-3">
              Foundation required — paste{" "}
              <code className="rounded-[4px] bg-field px-1.5 py-0.5 font-mono text-[12px] text-ink-2">
                {foundationFile}
              </code>{" "}
              once (tokens, <code className="font-mono text-[12px]">@theme</code> mappings, keyframes).
            </p>
            {foundationHref && (
              <a
                href={foundationHref}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-[12.5px] font-medium text-ink underline-offset-2 hover:underline"
              >
                View file <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </section>
      )}

      {files[0] && (
        <PromptModal
          open={promptOpen}
          onClose={closePrompt}
          title={title}
          filePath={`components/ui/${files[0].name}`}
          code={files[0].code}
          extraFiles={files.slice(1).map((f) => ({ path: f.name, code: f.code }))}
        />
      )}
    </div>
  );
});

/* Simple syntax highlight for JSX/TS */
function SyntaxLine({ text }: { text: string }) {
  if (!text.trim()) return <span>{"\n"}</span>;

  const tokens: { text: string; cls: string }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let match: RegExpMatchArray | null;

    // Single-line comment
    if ((match = remaining.match(/^(\/\/.*)/))) {
      tokens.push({ text: match[1], cls: "text-ink-4" });
      remaining = remaining.slice(match[1].length);
    }
    // String (double-quoted)
    else if ((match = remaining.match(/^("(?:[^"\\]|\\.)*")/))) {
      tokens.push({ text: match[1], cls: "text-green-400" });
      remaining = remaining.slice(match[1].length);
    }
    // String (single-quoted)
    else if ((match = remaining.match(/^('(?:[^'\\]|\\.)*')/))) {
      tokens.push({ text: match[1], cls: "text-green-400" });
      remaining = remaining.slice(match[1].length);
    }
    // Template literal (backtick)
    else if ((match = remaining.match(/^(`(?:[^`\\]|\\.)*`)/))) {
      tokens.push({ text: match[1], cls: "text-green-400" });
      remaining = remaining.slice(match[1].length);
    }
    // Keywords
    else if ((match = remaining.match(/^(import|export|from|const|let|var|function|return|if|else|type|interface|default|as|new|typeof|extends|implements|class|this|true|false|null|undefined|void|async|await|for|of|in)\b/))) {
      tokens.push({ text: match[1], cls: "text-purple-400" });
      remaining = remaining.slice(match[1].length);
    }
    // JSX tags
    else if ((match = remaining.match(/^(<\/?[A-Z][A-Za-z0-9.]*)/))) {
      tokens.push({ text: match[1], cls: "text-blue-400" });
      remaining = remaining.slice(match[1].length);
    }
    // HTML tags
    else if ((match = remaining.match(/^(<\/?[a-z][a-z0-9-]*)/))) {
      tokens.push({ text: match[1], cls: "text-red-400" });
      remaining = remaining.slice(match[1].length);
    }
    // Numbers
    else if ((match = remaining.match(/^(\d+\.?\d*)/))) {
      tokens.push({ text: match[1], cls: "text-amber-400" });
      remaining = remaining.slice(match[1].length);
    }
    // Type annotations after colon
    else if ((match = remaining.match(/^(:\s*)(string|number|boolean|void|any|never|unknown|null|undefined|ReactNode|HTMLElement|HTMLDivElement)\b/))) {
      tokens.push({ text: match[1], cls: "text-ink" });
      tokens.push({ text: match[2], cls: "text-cyan-400" });
      remaining = remaining.slice(match[0].length);
    }
    // Everything else — one char at a time
    else {
      tokens.push({ text: remaining[0], cls: "text-ink" });
      remaining = remaining.slice(1);
    }
  }

  return (
    <span>
      {tokens.map((tok, i) => (
        <span key={i} className={tok.cls}>{tok.text}</span>
      ))}
    </span>
  );
}
