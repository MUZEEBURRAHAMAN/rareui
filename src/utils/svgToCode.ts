export type Framework =
  | "react-tailwind"
  | "react-jsx"
  | "html-css"
  | "vue-sfc"
  | "svelte";

// ─── Normalized Design Node ─────────────────────────────────────
interface DesignNode {
  id: string;
  figmaName: string;
  type: "frame" | "text" | "rect" | "vector" | "image" | "ellipse" | "group";
  position: { x: number; y: number };
  size: { width: number; height: number };
  layout: {
    mode: "flex-row" | "flex-col" | "absolute" | "none";
    gap: number;
    padding: { top: number; right: number; bottom: number; left: number };
    alignItems: string;
    justifyContent: string;
  };
  style: {
    background: string;
    opacity: number;
    border: string;
    borderRadius: string;
    shadow: string;
    blur: string;
    transform: string;
    overflow: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
    textAlign: string;
    color: string;
    textDecoration: string;
  };
  textContent: string;
  svgContent: string;
  imageHref: string;
  children: DesignNode[];
  className: string;
}

let classCounter = 0;
let gradientMap: Map<string, string> = new Map();

function nextClass(): string {
  return `f${classCounter++}`;
}

function r(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── SVG Parsing Helpers ─────────────────────────────────────────

function collectGradients(root: Element): void {
  gradientMap = new Map();
  const process = (container: Element) => {
    for (const grad of container.querySelectorAll("linearGradient, radialGradient")) {
      const id = grad.getAttribute("id");
      if (!id) continue;
      const stops: string[] = [];
      for (const stop of grad.querySelectorAll("stop")) {
        const color = stop.getAttribute("stop-color") || "#000";
        const offset = stop.getAttribute("offset") || "0";
        const opacity = stop.getAttribute("stop-opacity");
        const c = opacity && parseFloat(opacity) < 1
          ? hexToRgba(color, parseFloat(opacity))
          : color;
        stops.push(`${c} ${offset.includes("%") ? offset : parseFloat(offset) * 100 + "%"}`);
      }
      if (grad.tagName === "linearGradient" || grad.tagName.toLowerCase() === "lineargradient") {
        const x1 = parseFloat(grad.getAttribute("x1") || "0");
        const y1 = parseFloat(grad.getAttribute("y1") || "0");
        const x2 = parseFloat(grad.getAttribute("x2") || "1");
        const y2 = parseFloat(grad.getAttribute("y2") || "0");
        const angle = Math.round((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI + 90);
        gradientMap.set(id, `linear-gradient(${angle}deg, ${stops.join(", ")})`);
      } else {
        gradientMap.set(id, `radial-gradient(circle, ${stops.join(", ")})`);
      }
    }
  };
  for (const defs of root.querySelectorAll("defs")) process(defs);
  process(root);
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return hex;
  const rv = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${rv}, ${g}, ${b}, ${alpha})`;
}

function resolveColor(raw: string | null): string {
  if (!raw || raw === "none" || raw === "transparent") return "";
  if (raw.startsWith("url(#")) {
    const id = raw.slice(5, -1);
    return gradientMap.get(id) || "";
  }
  return raw;
}

function parseTransform(t: string | null): { tx: number; ty: number; rotate: string } {
  if (!t) return { tx: 0, ty: 0, rotate: "" };
  let tx = 0, ty = 0, rotate = "";
  const tr = t.match(/translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/);
  if (tr) { tx = parseFloat(tr[1]); ty = parseFloat(tr[2]); }
  const mx = t.match(/matrix\(\s*([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)\s*\)/);
  if (mx) { tx = parseFloat(mx[5]); ty = parseFloat(mx[6]); }
  const rot = t.match(/rotate\(\s*([-\d.]+)/);
  if (rot) rotate = `rotate(${rot[1]}deg)`;
  return { tx, ty, rotate };
}

function getNum(el: Element, attr: string, fb = 0): number {
  const v = el.getAttribute(attr);
  return v ? parseFloat(v) : fb;
}

function figmaName(el: Element): string {
  return el.getAttribute("data-name")
    || el.getAttribute("data-figma")
    || el.getAttribute("id")
    || el.getAttribute("aria-label")
    || "";
}

function isSkippable(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  return ["defs", "clippath", "mask", "filter", "style", "title", "desc", "metadata", "symbol"].includes(tag);
}

function collectText(el: Element): string {
  const parts: string[] = [];
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const t = child.textContent?.trim();
      if (t) parts.push(t);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = (child as Element).tagName.toLowerCase();
      if (tag === "tspan" || tag === "text") {
        const t = (child as Element).textContent?.trim();
        if (t) parts.push(t);
      }
    }
  }
  return parts.join(" ");
}

function serializeSvgFragment(el: Element): string {
  const serializer = new XMLSerializer();
  let svg = serializer.serializeToString(el);
  svg = svg.replace(/\s*xmlns="[^"]*"/g, "");
  return svg;
}

function pathBBox(el: Element): { x: number; y: number; w: number; h: number } {
  const d = el.getAttribute("d") || "";
  const xs: number[] = [];
  const ys: number[] = [];
  let i = 0;
  for (const m of d.matchAll(/[-+]?\d*\.?\d+/g)) {
    const n = parseFloat(m[0]);
    if (i % 2 === 0) xs.push(n); else ys.push(n);
    i++;
  }
  if (!xs.length || !ys.length) return { x: 0, y: 0, w: 0, h: 0 };
  return {
    x: Math.min(...xs), y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

// ─── Build Design Tree ───────────────────────────────────────────

function buildDesignNode(el: Element, ox: number, oy: number): DesignNode | null {
  if (isSkippable(el)) return null;
  const tag = el.tagName.toLowerCase();
  if (tag === "use") return null;

  const { tx, ty, rotate } = parseTransform(el.getAttribute("transform"));
  const ax = ox + tx;
  const ay = oy + ty;
  const name = figmaName(el);
  const cls = nextClass();

  const fill = resolveColor(el.getAttribute("fill"));
  const stroke = resolveColor(el.getAttribute("stroke"));
  const strokeW = el.getAttribute("stroke-width") || "";
  const opacity = parseFloat(el.getAttribute("opacity") || "1");
  const rx = el.getAttribute("rx") || "";
  const ry = el.getAttribute("ry") || "";

  const emptyLayout = (): DesignNode["layout"] => ({
    mode: "none", gap: 0,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    alignItems: "", justifyContent: "",
  });

  const emptyTypo = (): DesignNode["typography"] => ({
    fontFamily: "", fontSize: "", fontWeight: "", lineHeight: "",
    letterSpacing: "", textAlign: "", color: "", textDecoration: "",
  });

  const emptyStyle = (): DesignNode["style"] => ({
    background: "", opacity: 1, border: "", borderRadius: "",
    shadow: "", blur: "", transform: "", overflow: "",
  });

  // TEXT
  if (tag === "text") {
    const text = collectText(el);
    if (!text) return null;
    const fontSize = el.getAttribute("font-size") || "14";
    const fSize = parseFloat(fontSize);

    // Get position from tspan if available (Figma puts coords on tspan)
    const tspan = el.querySelector("tspan");
    const textX = tspan ? getNum(tspan, "x") : getNum(el, "x");
    const textY = tspan ? getNum(tspan, "y") : getNum(el, "y");

    // SVG y is baseline — convert to top by subtracting ~0.8em
    const x = textX + ax;
    const y = textY + ay - fSize * 0.85;

    // Estimate width from text length and font size
    const estimatedWidth = text.length * fSize * 0.6;
    const estimatedHeight = fSize * 1.4;

    return {
      id: cls, figmaName: name || text.slice(0, 24), type: "text",
      position: { x: r(x), y: r(y) },
      size: { width: r(estimatedWidth), height: r(estimatedHeight) },
      layout: emptyLayout(),
      style: { ...emptyStyle(), opacity, transform: rotate },
      typography: {
        fontFamily: el.getAttribute("font-family") || "",
        fontSize: fSize + "px",
        fontWeight: el.getAttribute("font-weight") || "",
        lineHeight: el.getAttribute("line-height") || "",
        letterSpacing: el.getAttribute("letter-spacing") || "",
        textAlign: el.getAttribute("text-anchor") === "middle" ? "center"
          : el.getAttribute("text-anchor") === "end" ? "right" : "",
        color: fill || "#000",
        textDecoration: el.getAttribute("text-decoration") || "",
      },
      textContent: text, svgContent: "", imageHref: "", children: [], className: cls,
    };
  }

  // RECT
  if (tag === "rect") {
    const x = getNum(el, "x") + ax;
    const y = getNum(el, "y") + ay;
    const w = getNum(el, "width");
    const h = getNum(el, "height");
    const border = stroke ? `${strokeW || "1"}px solid ${stroke}` : "";
    const radius = rx ? `${rx}px` : ry ? `${ry}px` : "";
    return {
      id: cls, figmaName: name || "rect", type: "rect",
      position: { x: r(x), y: r(y) },
      size: { width: r(w), height: r(h) },
      layout: emptyLayout(),
      style: { ...emptyStyle(), background: fill, opacity, border, borderRadius: radius, transform: rotate },
      typography: emptyTypo(),
      textContent: "", svgContent: "", imageHref: "", children: [], className: cls,
    };
  }

  // CIRCLE / ELLIPSE
  if (tag === "circle" || tag === "ellipse") {
    let cx: number, cy: number, w: number, h: number;
    if (tag === "circle") {
      const cr = getNum(el, "r");
      cx = getNum(el, "cx") - cr; cy = getNum(el, "cy") - cr;
      w = cr * 2; h = cr * 2;
    } else {
      const erx = getNum(el, "rx"); const ery = getNum(el, "ry");
      cx = getNum(el, "cx") - erx; cy = getNum(el, "cy") - ery;
      w = erx * 2; h = ery * 2;
    }
    const border = stroke ? `${strokeW || "1"}px solid ${stroke}` : "";
    return {
      id: cls, figmaName: name || tag, type: "ellipse",
      position: { x: r(cx + ax), y: r(cy + ay) },
      size: { width: r(w), height: r(h) },
      layout: emptyLayout(),
      style: { ...emptyStyle(), background: fill, opacity, border, borderRadius: "50%", transform: rotate },
      typography: emptyTypo(),
      textContent: "", svgContent: "", imageHref: "", children: [], className: cls,
    };
  }

  // PATH / LINE / POLYGON / POLYLINE → preserve as SVG
  if (["path", "line", "polygon", "polyline"].includes(tag)) {
    const bbox = tag === "path" ? pathBBox(el) : { x: 0, y: 0, w: 0, h: 0 };
    const viewBox = `${r(bbox.x)} ${r(bbox.y)} ${r(bbox.w || 1)} ${r(bbox.h || 1)}`;
    const svgStr = serializeSvgFragment(el);
    return {
      id: cls, figmaName: name || "Vector", type: "vector",
      position: { x: r(bbox.x + ax), y: r(bbox.y + ay) },
      size: { width: r(bbox.w || 24), height: r(bbox.h || 24) },
      layout: emptyLayout(),
      style: { ...emptyStyle(), opacity, transform: rotate },
      typography: emptyTypo(),
      textContent: "", svgContent: svgStr, imageHref: "",
      children: [], className: cls,
    };
  }

  // IMAGE
  if (tag === "image") {
    const href = el.getAttribute("href")
      || el.getAttributeNS("http://www.w3.org/1999/xlink", "href") || "";
    return {
      id: cls, figmaName: name || "Image", type: "image",
      position: { x: r(getNum(el, "x") + ax), y: r(getNum(el, "y") + ay) },
      size: { width: r(getNum(el, "width")), height: r(getNum(el, "height")) },
      layout: emptyLayout(),
      style: { ...emptyStyle(), opacity, borderRadius: rx ? `${rx}px` : "", transform: rotate },
      typography: emptyTypo(),
      textContent: "", svgContent: "", imageHref: href, children: [], className: cls,
    };
  }

  // GROUP / SVG (frame)
  if (tag === "g" || tag === "svg" || tag === "a" || tag === "foreignobject") {
    const children: DesignNode[] = [];
    for (const child of el.children) {
      const node = buildDesignNode(child, ax, ay);
      if (node) children.push(node);
    }
    if (tag !== "svg" && children.length === 0) return null;

    let w: number, h: number, groupX = 0, groupY = 0;
    if (tag === "svg") {
      w = getNum(el, "width") || parseViewBox(el, 2);
      h = getNum(el, "height") || parseViewBox(el, 3);
    } else {
      const bounds = computeBounds(children);
      groupX = bounds.x;
      groupY = bounds.y;
      w = bounds.w; h = bounds.h;
    }

    normalizeChildren(children);
    const layout = detectLayout(children);
    const gap = computeGap(children, layout);

    return {
      id: cls, figmaName: name || (tag === "svg" ? "root" : "Frame"), type: "frame",
      position: { x: r(groupX), y: r(groupY) },
      size: { width: r(w), height: r(h) },
      layout: {
        mode: layout === "vertical" ? "flex-col" : layout === "horizontal" ? "flex-row" : "absolute",
        gap, padding: { top: 0, right: 0, bottom: 0, left: 0 },
        alignItems: "", justifyContent: "",
      },
      style: {
        ...emptyStyle(),
        background: tag === "svg" ? "" : fill,
        opacity,
        borderRadius: rx ? `${rx}px` : "",
        overflow: "",
        transform: rotate,
      },
      typography: emptyTypo(),
      textContent: "", svgContent: "", imageHref: "",
      children, className: cls,
    };
  }

  return null;
}

function parseViewBox(el: Element, idx: number): number {
  const vb = el.getAttribute("viewBox");
  if (!vb) return 0;
  return parseFloat(vb.split(/[\s,]+/)[idx]) || 0;
}

function computeBounds(nodes: DesignNode[]): { x: number; y: number; w: number; h: number } {
  if (!nodes.length) return { x: 0, y: 0, w: 0, h: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + n.size.width);
    maxY = Math.max(maxY, n.position.y + n.size.height);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function normalizeChildren(nodes: DesignNode[]): void {
  if (!nodes.length) return;
  const bounds = computeBounds(nodes);
  for (const n of nodes) {
    n.position.x = r(n.position.x - bounds.x);
    n.position.y = r(n.position.y - bounds.y);
  }
}

function detectLayout(children: DesignNode[]): "vertical" | "horizontal" | "absolute" {
  if (children.length <= 1) return "vertical";
  const sorted = [...children].sort((a, b) => a.position.y - b.position.y);
  let vert = true;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].position.y < sorted[i - 1].position.y + sorted[i - 1].size.height * 0.3) {
      vert = false; break;
    }
  }
  if (vert) return "vertical";
  const hSorted = [...children].sort((a, b) => a.position.x - b.position.x);
  let horiz = true;
  for (let i = 1; i < hSorted.length; i++) {
    if (hSorted[i].position.x < hSorted[i - 1].position.x + hSorted[i - 1].size.width * 0.3) {
      horiz = false; break;
    }
  }
  if (horiz) return "horizontal";
  return "absolute";
}

function computeGap(children: DesignNode[], dir: "vertical" | "horizontal" | "absolute"): number {
  if (children.length < 2 || dir === "absolute") return 0;
  const sorted = [...children].sort((a, b) =>
    dir === "vertical" ? a.position.y - b.position.y : a.position.x - b.position.x
  );
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = dir === "vertical"
      ? sorted[i].position.y - (sorted[i - 1].position.y + sorted[i - 1].size.height)
      : sorted[i].position.x - (sorted[i - 1].position.x + sorted[i - 1].size.width);
    gaps.push(Math.max(0, Math.round(gap)));
  }
  return gaps.length ? gaps[0] : 0;
}

function sortChildren(children: DesignNode[], mode: string): DesignNode[] {
  if (mode === "flex-col") return [...children].sort((a, b) => a.position.y - b.position.y);
  if (mode === "flex-row") return [...children].sort((a, b) => a.position.x - b.position.x);
  return children;
}

// ─── CSS Class Generator ─────────────────────────────────────────

function generateCSS(node: DesignNode, rules: Map<string, string>, parentLayout: string = "none"): void {
  const props: string[] = [];
  const s = node.style;
  const l = node.layout;
  const t = node.typography;

  // Position within parent + own layout
  const isAbsChild = parentLayout === "absolute";
  const needsContaining = (l.mode === "absolute" && node.children.length > 0);

  if (isAbsChild) {
    props.push("position: absolute");
    props.push(`left: ${node.position.x}px`);
    props.push(`top: ${node.position.y}px`);
  } else if (needsContaining) {
    props.push("position: relative");
  }

  // Layout
  if (l.mode === "flex-col") {
    props.push("display: flex", "flex-direction: column");
    if (l.gap) props.push(`gap: ${l.gap}px`);
  } else if (l.mode === "flex-row") {
    props.push("display: flex", "flex-direction: row");
    if (l.gap) props.push(`gap: ${l.gap}px`);
    props.push("align-items: center");
  }

  // Size — skip for text (let it auto-size)
  if (node.type !== "text") {
    if (node.size.width) props.push(`width: ${node.size.width}px`);
    if (node.size.height) props.push(`height: ${node.size.height}px`);
  } else {
    props.push("white-space: nowrap");
  }

  // Style
  if (s.background) {
    props.push(`background: ${s.background}`);
  }
  if (s.opacity < 1) props.push(`opacity: ${s.opacity}`);
  if (s.border) props.push(`border: ${s.border}`);
  if (s.borderRadius) props.push(`border-radius: ${s.borderRadius}`);
  if (s.shadow) props.push(`box-shadow: ${s.shadow}`);
  if (s.overflow) props.push(`overflow: ${s.overflow}`);
  if (s.transform) props.push(`transform: ${s.transform}`);

  // Typography
  if (t.color) props.push(`color: ${t.color}`);
  if (t.fontSize) props.push(`font-size: ${t.fontSize}`);
  if (t.fontWeight) props.push(`font-weight: ${t.fontWeight}`);
  if (t.fontFamily) props.push(`font-family: ${t.fontFamily}`);
  if (t.lineHeight) props.push(`line-height: ${t.lineHeight}`);
  if (t.letterSpacing) props.push(`letter-spacing: ${t.letterSpacing}`);
  if (t.textAlign) props.push(`text-align: ${t.textAlign}`);
  if (t.textDecoration) props.push(`text-decoration: ${t.textDecoration}`);

  if (props.length) {
    rules.set(`.${node.className}`, props.join(";\n  "));
  }

  const childLayout = l.mode;
  for (const child of node.children) {
    generateCSS(child, rules, childLayout);
  }
}

// ─── HTML Generator (used by html-css, vue-sfc, svelte) ──────────

function renderHTML(node: DesignNode, indent: number, useClasses: boolean): string {
  const pad = "  ".repeat(indent);
  const cls = useClasses ? ` class="${node.className}"` : "";
  const dataAttr = node.figmaName ? ` data-figma="${escHtml(node.figmaName)}"` : "";

  if (node.type === "text") {
    return `${pad}<span${cls}${dataAttr}>${escHtml(node.textContent)}</span>`;
  }

  if (node.type === "image") {
    return `${pad}<img${cls}${dataAttr} src="${node.imageHref}" alt="${escHtml(node.figmaName)}" />`;
  }

  if (node.type === "vector" && node.svgContent) {
    const w = node.size.width || 24;
    const h = node.size.height || 24;
    return `${pad}<svg${cls}${dataAttr} viewBox="0 0 ${r(w)} ${r(h)}" width="${r(w)}" height="${r(h)}" fill="none" xmlns="http://www.w3.org/2000/svg">\n${pad}  ${node.svgContent}\n${pad}</svg>`;
  }

  if (node.type === "rect" || node.type === "ellipse") {
    return `${pad}<div${cls}${dataAttr}></div>`;
  }

  if (node.type === "frame" || node.type === "group") {
    const sorted = sortChildren(node.children, node.layout.mode);
    const childStr = sorted
      .map((c) => renderHTML(c, indent + 1, useClasses))
      .filter(Boolean)
      .join("\n");
    if (!childStr && !node.textContent) return "";
    return `${pad}<div${cls}${dataAttr}>\n${childStr}\n${pad}</div>`;
  }

  return "";
}

// ─── React + Tailwind Generator ──────────────────────────────────

function nodeToTailwind(node: DesignNode, parentLayout: string = "none"): string {
  const tw: string[] = [];
  const s = node.style;
  const l = node.layout;
  const t = node.typography;

  // Position within parent + own layout
  const isAbsChild = parentLayout === "absolute";
  const needsContaining = (l.mode === "absolute" && node.children.length > 0);

  if (isAbsChild) {
    tw.push("absolute");
    tw.push(`left-[${node.position.x}px]`);
    tw.push(`top-[${node.position.y}px]`);
  } else if (needsContaining) {
    tw.push("relative");
  }

  if (l.mode === "flex-col") { tw.push("flex", "flex-col"); if (l.gap) tw.push(`gap-[${l.gap}px]`); }
  else if (l.mode === "flex-row") { tw.push("flex", "flex-row", "items-center"); if (l.gap) tw.push(`gap-[${l.gap}px]`); }

  // Size — skip for text (auto-size)
  if (node.type !== "text") {
    if (node.size.width) tw.push(`w-[${node.size.width}px]`);
    if (node.size.height) tw.push(`h-[${node.size.height}px]`);
  } else {
    tw.push("whitespace-nowrap");
  }

  if (s.background) {
    if (s.background.includes("gradient")) tw.push(`bg-gradient-to-br`);
    else tw.push(`bg-[${s.background}]`);
  }
  if (s.opacity < 1) tw.push(`opacity-[${s.opacity}]`);
  if (s.borderRadius === "50%") tw.push("rounded-full");
  else if (s.borderRadius) tw.push(`rounded-[${s.borderRadius}]`);
  if (s.border) {
    const m = s.border.match(/([\d.]+)px\s+solid\s+(.*)/);
    if (m) { tw.push("border"); tw.push(`border-[${m[2]}]`); }
  }
  if (s.overflow === "hidden") tw.push("overflow-hidden");

  if (t.color) tw.push(`text-[${t.color}]`);
  if (t.fontSize) tw.push(`text-[${t.fontSize}]`);
  if (t.fontWeight) {
    const w = parseInt(t.fontWeight);
    if (w >= 700) tw.push("font-bold");
    else if (w >= 600) tw.push("font-semibold");
    else if (w >= 500) tw.push("font-medium");
    else if (w <= 300) tw.push("font-light");
  }
  if (t.letterSpacing) tw.push(`tracking-[${t.letterSpacing}]`);
  if (t.textAlign === "center") tw.push("text-center");
  if (t.textAlign === "right") tw.push("text-right");
  if (t.textDecoration === "underline") tw.push("underline");

  return tw.join(" ");
}

function renderReactTailwind(node: DesignNode, indent: number, parentLayout: string = "none"): string {
  const pad = "  ".repeat(indent);
  const tw = nodeToTailwind(node, parentLayout);
  const dataAttr = node.figmaName ? ` data-figma="${escHtml(node.figmaName)}"` : "";

  if (node.type === "text") {
    return `${pad}<span${tw ? ` className="${tw}"` : ""}${dataAttr}>${escJsx(node.textContent)}</span>`;
  }

  if (node.type === "image") {
    return `${pad}<img${tw ? ` className="${tw}"` : ""} src="${node.imageHref}" alt="${escHtml(node.figmaName)}"${dataAttr} />`;
  }

  if (node.type === "vector" && node.svgContent) {
    const w = node.size.width || 24;
    const h = node.size.height || 24;
    return `${pad}<svg${tw ? ` className="${tw}"` : ""}${dataAttr} viewBox="0 0 ${r(w)} ${r(h)}" width="${r(w)}" height="${r(h)}" fill="none">\n${pad}  ${node.svgContent}\n${pad}</svg>`;
  }

  if (node.type === "rect" || node.type === "ellipse") {
    return `${pad}<div${tw ? ` className="${tw}"` : ""}${dataAttr} />`;
  }

  if (node.type === "frame" || node.type === "group") {
    const sorted = sortChildren(node.children, node.layout.mode);
    const childLayout = node.layout.mode;
    const childStr = sorted
      .map((c) => renderReactTailwind(c, indent + 1, childLayout))
      .filter(Boolean)
      .join("\n");
    if (!childStr) return "";
    return `${pad}<div${tw ? ` className="${tw}"` : ""}${dataAttr}>\n${childStr}\n${pad}</div>`;
  }

  return "";
}

// ─── React JSX (inline styles) Generator ─────────────────────────

function nodeToReactStyle(node: DesignNode, parentLayout: string = "none"): string {
  const obj: string[] = [];
  const s = node.style;
  const l = node.layout;
  const t = node.typography;

  // Position within parent + own layout
  const isAbsChild = parentLayout === "absolute";
  const needsContaining = (l.mode === "absolute" && node.children.length > 0);

  if (isAbsChild) {
    obj.push('position: "absolute"');
    obj.push(`left: ${node.position.x}`);
    obj.push(`top: ${node.position.y}`);
  } else if (needsContaining) {
    obj.push('position: "relative"');
  }

  if (l.mode === "flex-col") { obj.push('display: "flex"', 'flexDirection: "column"'); if (l.gap) obj.push(`gap: ${l.gap}`); }
  else if (l.mode === "flex-row") { obj.push('display: "flex"', 'flexDirection: "row"', 'alignItems: "center"'); if (l.gap) obj.push(`gap: ${l.gap}`); }

  // Size — skip for text (auto-size)
  if (node.type !== "text") {
    if (node.size.width) obj.push(`width: ${node.size.width}`);
    if (node.size.height) obj.push(`height: ${node.size.height}`);
  } else {
    obj.push('whiteSpace: "nowrap"');
  }

  if (s.background) obj.push(`background: "${s.background}"`);
  if (s.opacity < 1) obj.push(`opacity: ${s.opacity}`);
  if (s.border) obj.push(`border: "${s.border}"`);
  if (s.borderRadius) obj.push(`borderRadius: "${s.borderRadius}"`);
  if (s.overflow) obj.push(`overflow: "${s.overflow}"`);
  if (s.transform) obj.push(`transform: "${s.transform}"`);

  if (t.color) obj.push(`color: "${t.color}"`);
  if (t.fontSize) obj.push(`fontSize: "${t.fontSize}"`);
  if (t.fontWeight) obj.push(`fontWeight: ${t.fontWeight}`);
  if (t.fontFamily) obj.push(`fontFamily: "${t.fontFamily}"`);
  if (t.lineHeight) obj.push(`lineHeight: "${t.lineHeight}"`);
  if (t.letterSpacing) obj.push(`letterSpacing: "${t.letterSpacing}"`);
  if (t.textAlign) obj.push(`textAlign: "${t.textAlign}"`);

  return obj.length ? `{ ${obj.join(", ")} }` : "{}";
}

function renderReactJSX(node: DesignNode, indent: number, parentLayout: string = "none"): string {
  const pad = "  ".repeat(indent);
  const style = nodeToReactStyle(node, parentLayout);
  const dataAttr = node.figmaName ? ` data-figma="${escHtml(node.figmaName)}"` : "";

  if (node.type === "text") {
    return `${pad}<span style={${style}}${dataAttr}>${escJsx(node.textContent)}</span>`;
  }

  if (node.type === "image") {
    return `${pad}<img style={${style}} src="${node.imageHref}" alt="${escHtml(node.figmaName)}"${dataAttr} />`;
  }

  if (node.type === "vector" && node.svgContent) {
    const w = node.size.width || 24;
    const h = node.size.height || 24;
    return `${pad}<svg style={${style}}${dataAttr} viewBox="0 0 ${r(w)} ${r(h)}" width="${r(w)}" height="${r(h)}" fill="none">\n${pad}  ${node.svgContent}\n${pad}</svg>`;
  }

  if (node.type === "rect" || node.type === "ellipse") {
    return `${pad}<div style={${style}}${dataAttr} />`;
  }

  if (node.type === "frame" || node.type === "group") {
    const sorted = sortChildren(node.children, node.layout.mode);
    const childLayout = node.layout.mode;
    const childStr = sorted
      .map((c) => renderReactJSX(c, indent + 1, childLayout))
      .filter(Boolean)
      .join("\n");
    if (!childStr) return "";
    return `${pad}<div style={${style}}${dataAttr}>\n${childStr}\n${pad}</div>`;
  }

  return "";
}

// ─── Escape helpers ──────────────────────────────────────────────

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escJsx(s: string): string {
  return s.replace(/[{}]/g, (c) => (c === "{" ? "&#123;" : "&#125;"));
}

// ─── Main exports ────────────────────────────────────────────────

export function convertSvgToCode(svgString: string, framework: Framework): string {
  classCounter = 0;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const root = doc.documentElement;

  if (root.nodeName === "parsererror") {
    return "// Could not parse the pasted SVG content";
  }

  collectGradients(root);
  const tree = buildDesignNode(root, 0, 0);

  if (!tree || (tree.children.length === 0 && !tree.textContent)) {
    return "// No convertible elements found in the SVG.\n// Make sure you copied as SVG from Figma\n// (Right-click → Copy/Paste as → Copy as SVG)";
  }

  switch (framework) {
    case "react-tailwind": {
      const body = renderReactTailwind(tree, 2);
      return [
        `export default function FigmaComponent() {`,
        `  return (`,
        body,
        `  );`,
        `}`,
      ].join("\n");
    }

    case "react-jsx": {
      const body = renderReactJSX(tree, 2);
      return [
        `export default function FigmaComponent() {`,
        `  return (`,
        body,
        `  );`,
        `}`,
      ].join("\n");
    }

    case "html-css": {
      const cssRules = new Map<string, string>();
      generateCSS(tree, cssRules);
      let css = "";
      for (const [sel, props] of cssRules) {
        css += `${sel} {\n  ${props};\n}\n\n`;
      }
      const body = renderHTML(tree, 2, true);
      return [
        `<!DOCTYPE html>`,
        `<html lang="en">`,
        `<head>`,
        `  <meta charset="UTF-8" />`,
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
        `  <title>Figma Component</title>`,
        `  <style>`,
        `    * { margin: 0; padding: 0; box-sizing: border-box; }`,
        `    body { display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; padding: 20px; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }`,
        ``,
        css.split("\n").map(l => `    ${l}`).join("\n"),
        `  </style>`,
        `</head>`,
        `<body>`,
        body,
        `</body>`,
        `</html>`,
      ].join("\n");
    }

    case "vue-sfc": {
      const cssRules = new Map<string, string>();
      generateCSS(tree, cssRules);
      let css = "";
      for (const [sel, props] of cssRules) {
        css += `  ${sel} {\n    ${props};\n  }\n\n`;
      }
      const body = renderHTML(tree, 2, true);
      return [
        `<template>`,
        body,
        `</template>`,
        ``,
        `<script setup lang="ts">`,
        `// Component logic here`,
        `</script>`,
        ``,
        `<style scoped>`,
        css,
        `</style>`,
      ].join("\n");
    }

    case "svelte": {
      const cssRules = new Map<string, string>();
      generateCSS(tree, cssRules);
      let css = "";
      for (const [sel, props] of cssRules) {
        css += `  ${sel} {\n    ${props};\n  }\n\n`;
      }
      const body = renderHTML(tree, 0, true);
      return [
        `<script lang="ts">`,
        `  // Component logic here`,
        `</script>`,
        ``,
        body,
        ``,
        `<style>`,
        css,
        `</style>`,
      ].join("\n");
    }

    default:
      return "// Unknown framework";
  }
}

export function extractHtmlFromClipboard(clipboardData: DataTransfer): string | null {
  const html = clipboardData.getData("text/html");
  if (html) {
    const svgMatch = html.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) return svgMatch[0];
  }
  const text = clipboardData.getData("text/plain");
  if (text && text.trim().startsWith("<svg")) return text;
  return null;
}
