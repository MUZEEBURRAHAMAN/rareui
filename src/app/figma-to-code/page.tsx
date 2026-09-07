"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  convertSvgToCode,
  extractHtmlFromClipboard,
  type Framework,
} from "@/utils/svgToCode";

const frameworks: { id: Framework; label: string; note: string }[] = [
  { id: "react-tailwind", label: "React + Tailwind", note: "arbitrary values" },
  { id: "react-jsx", label: "React (JSX)", note: "inline style objects" },
  { id: "html-css", label: "HTML / CSS", note: "self-contained document" },
  { id: "vue-sfc", label: "Vue (SFC)", note: "single-file component" },
  { id: "svelte", label: "Svelte", note: "single-file component" },
];

export default function FigmaToCodePage() {
  const [svgData, setSvgData] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [framework, setFramework] = useState<Framework>("react-tailwind");
  const [code, setCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      e.preventDefault();
      const clip = e.clipboardData;
      if (!clip) return;

      const svg = extractHtmlFromClipboard(clip);
      if (svg) {
        setSvgData(svg);
        setCode(convertSvgToCode(svg, framework));
        const blob = new Blob([svg], { type: "image/svg+xml" });
        setImageUrl(URL.createObjectURL(blob));
        return;
      }

      const items = clip.items;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            setImageUrl(URL.createObjectURL(file));
            setSvgData(null);
            setCode(
              "// Pasted as image — for editable code, copy from Figma as SVG\n// (Right-click → Copy as SVG in Figma)"
            );
          }
          return;
        }
      }

      const text = clip.getData("text/plain");
      if (text?.trim().startsWith("<svg")) {
        setSvgData(text);
        setCode(convertSvgToCode(text, framework));
        const blob = new Blob([text], { type: "image/svg+xml" });
        setImageUrl(URL.createObjectURL(blob));
      }
    },
    [framework]
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    if (svgData) {
      setCode(convertSvgToCode(svgData, framework));
    }
  }, [framework, svgData]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const svg = extractHtmlFromClipboard(e.dataTransfer);
      if (svg) {
        setSvgData(svg);
        setCode(convertSvgToCode(svg, framework));
        const blob = new Blob([svg], { type: "image/svg+xml" });
        setImageUrl(URL.createObjectURL(blob));
        return;
      }
      const file = e.dataTransfer.files[0];
      if (file?.type === "image/svg+xml") {
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string;
          setSvgData(text);
          setCode(convertSvgToCode(text, framework));
          const blob = new Blob([text], { type: "image/svg+xml" });
          setImageUrl(URL.createObjectURL(blob));
        };
        reader.readAsText(file);
      } else if (file?.type.startsWith("image/")) {
        setImageUrl(URL.createObjectURL(file));
        setSvgData(null);
        setCode("// Dropped as image — for editable code, use SVG files");
      }
    },
    [framework]
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
  }, [code]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const handleReset = useCallback(() => {
    setSvgData(null);
    setImageUrl(null);
    setCode("");
  }, []);

  return (
    <div className="mx-auto min-h-svh max-w-6xl">
      <header className="px-5 pt-6 pb-8 sm:px-8">
        <h1 className="text-[28px] font-bold tracking-tight text-ink sm:text-[36px]">
          Figma to Code
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-ink-3">
          Paste a component from Figma, choose your technology, and get
          production-ready code.
        </p>
      </header>

      <div className="flex flex-col gap-6 px-5 pb-16 sm:px-8 lg:flex-row">
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-ink">Canvas</h2>
            {imageUrl && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-control border border-line px-2.5 py-1 text-[11px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>
          <div
            ref={canvasRef}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex min-h-[420px] items-center justify-center overflow-hidden rounded-[16px] border-2 border-dashed transition-colors ${
              isDragging
                ? "border-accent bg-accent-dim"
                : imageUrl
                  ? "border-line bg-surface"
                  : "border-line/60 bg-surface"
            }`}
          >
            {imageUrl ? (
              <div className="flex items-center justify-center p-6">
                <img
                  src={imageUrl}
                  alt="Pasted design"
                  className="max-h-[380px] max-w-full rounded-[8px] object-contain"
                  style={{
                    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))",
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 px-8 py-16 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-field">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-ink-3"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-medium text-ink">
                    Paste from Figma
                  </p>
                  <p className="mt-1 text-[13px] text-ink-3">
                    Select a component in Figma, right-click &rarr;{" "}
                    <span className="font-mono text-[12px] text-ink-2">
                      Copy/Paste as
                    </span>{" "}
                    &rarr;{" "}
                    <span className="font-mono text-[12px] text-ink-2">
                      Copy as SVG
                    </span>
                  </p>
                  <p className="mt-1 text-[12px] text-ink-4">
                    Then press{" "}
                    <kbd className="rounded-[3px] border border-line px-1.5 py-0.5 font-mono text-[11px]">
                      ⌘V
                    </kbd>{" "}
                    here
                  </p>
                </div>
                <p className="text-[11px] text-ink-4">
                  or drag &amp; drop an SVG file
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 lg:max-w-[480px]">
          <div className="mb-4">
            <h2 className="mb-3 text-[14px] font-semibold text-ink">
              Technology
            </h2>
            <div className="flex flex-col gap-1">
              {frameworks.map((fw) => (
                <button
                  key={fw.id}
                  type="button"
                  onClick={() => setFramework(fw.id)}
                  className={`flex items-center justify-between rounded-control px-3 py-2.5 text-left transition-colors ${
                    framework === fw.id
                      ? "bg-accent-dim border border-accent/30 text-ink"
                      : "border border-transparent text-ink-2 hover:bg-hover hover:text-ink"
                  }`}
                >
                  <span className="text-[13px] font-medium">{fw.label}</span>
                  <span className="text-[11px] text-ink-4">{fw.note}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-ink">Code</h2>
              {code && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-control border border-line px-2.5 py-1 text-[11px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <div className="max-h-[500px] overflow-auto rounded-[12px] border border-line bg-canvas p-4">
              {code ? (
                <pre className="font-mono text-[12px] leading-[1.7] text-ink">
                  <code>{code}</code>
                </pre>
              ) : (
                <div className="flex items-center justify-center py-12 text-[13px] text-ink-4">
                  Paste a design to generate code
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
