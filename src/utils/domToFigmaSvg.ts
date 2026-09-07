interface SvgNode {
  tag: "g" | "rect" | "text" | "line";
  attrs: Record<string, string>;
  children?: SvgNode[];
  textContent?: string;
}

function rgbToHex(color: string): string | null {
  if (color === "transparent" || color === "rgba(0, 0, 0, 0)") return null;
  const match = color.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
  );
  if (!match) return color.startsWith("#") ? color : null;
  const [, r, g, b, a] = match;
  if (a !== undefined && parseFloat(a) < 0.01) return null;
  const hex = `#${[r, g, b].map((c) => parseInt(c).toString(16).padStart(2, "0")).join("")}`;
  return hex;
}

function getOpacity(color: string): number {
  const match = color.match(/rgba?\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/);
  return match ? parseFloat(match[1]) : 1;
}

function walkDom(
  el: Element,
  containerRect: DOMRect,
  depth: number
): SvgNode | null {
  if (depth > 20) return null;

  const style = getComputedStyle(el);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    (style.opacity === "0" && !el.querySelector("[style*='opacity']"))
  )
    return null;

  const rect = el.getBoundingClientRect();
  const x = rect.left - containerRect.left;
  const y = rect.top - containerRect.top;
  const w = rect.width;
  const h = rect.height;

  if (w <= 0 || h <= 0) return null;
  if (
    x + w < 0 ||
    y + h < 0 ||
    x > containerRect.width ||
    y > containerRect.height
  )
    return null;

  const children: SvgNode[] = [];
  const tagName = el.tagName.toLowerCase();
  const className =
    el.getAttribute("class")?.split(" ").slice(0, 3).join(" ") || tagName;
  const layerName = className.replace(/[^\w\s-]/g, "").trim() || tagName;

  const bgColor = rgbToHex(style.backgroundColor);
  const borderColor = rgbToHex(style.borderColor);
  const borderWidth = parseFloat(style.borderWidth) || 0;
  const borderRadius = parseFloat(style.borderRadius) || 0;
  const opacity = parseFloat(style.opacity);

  if (bgColor || (borderColor && borderWidth > 0)) {
    const rectNode: SvgNode = {
      tag: "rect",
      attrs: {
        x: String(x),
        y: String(y),
        width: String(w),
        height: String(h),
        rx: String(Math.min(borderRadius, w / 2, h / 2)),
        "data-name": `${layerName} bg`,
      },
    };
    if (bgColor) {
      rectNode.attrs.fill = bgColor;
      const bgOpacity = getOpacity(style.backgroundColor);
      if (bgOpacity < 1) rectNode.attrs["fill-opacity"] = String(bgOpacity);
    } else {
      rectNode.attrs.fill = "none";
    }
    if (borderColor && borderWidth > 0) {
      rectNode.attrs.stroke = borderColor;
      rectNode.attrs["stroke-width"] = String(borderWidth);
      const borderOpacity = getOpacity(style.borderColor);
      if (borderOpacity < 1)
        rectNode.attrs["stroke-opacity"] = String(borderOpacity);
    }
    children.push(rectNode);
  }

  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (!text) continue;

      const range = document.createRange();
      range.selectNodeContents(child);
      const textRects = range.getClientRects();

      for (const tr of textRects) {
        const tx = tr.left - containerRect.left;
        const ty = tr.top - containerRect.top;
        const fontSize = parseFloat(style.fontSize) || 14;
        const color = rgbToHex(style.color) || "#000000";

        const textNode: SvgNode = {
          tag: "text",
          attrs: {
            x: String(tx),
            y: String(ty + fontSize * 0.85),
            fill: color,
            "font-size": String(fontSize),
            "font-family": style.fontFamily.split(",")[0].replace(/['"]/g, "").trim(),
            "font-weight": style.fontWeight,
            "data-name": text.slice(0, 30),
          },
          textContent: text,
        };

        if (style.letterSpacing && style.letterSpacing !== "normal") {
          textNode.attrs["letter-spacing"] = style.letterSpacing;
        }

        const textOpacity = getOpacity(style.color);
        if (textOpacity < 1)
          textNode.attrs["fill-opacity"] = String(textOpacity);

        children.push(textNode);
        break;
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childNode = walkDom(child as Element, containerRect, depth + 1);
      if (childNode) children.push(childNode);
    }
  }

  if (children.length === 0) return null;

  const group: SvgNode = {
    tag: "g",
    attrs: { "data-name": layerName },
    children,
  };
  if (opacity < 1) group.attrs.opacity = String(opacity);

  return group;
}

function renderSvgNode(node: SvgNode, indent: number): string {
  const pad = "  ".repeat(indent);
  const attrStr = Object.entries(node.attrs)
    .map(([k, v]) => `${k}="${escapeXml(v)}"`)
    .join(" ");

  if (node.tag === "text") {
    return `${pad}<text ${attrStr}>${escapeXml(node.textContent || "")}</text>`;
  }

  if (!node.children || node.children.length === 0) {
    return `${pad}<${node.tag} ${attrStr} />`;
  }

  const childrenStr = node.children
    .map((c) => renderSvgNode(c, indent + 1))
    .join("\n");
  return `${pad}<${node.tag} ${attrStr}>\n${childrenStr}\n${pad}</${node.tag}>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function domToFigmaSvg(container: HTMLElement): Promise<string> {
  const rect = container.getBoundingClientRect();
  const tree = walkDom(container, rect, 0);

  if (!tree) return "";

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}" viewBox="0 0 ${rect.width} ${rect.height}">`,
    renderSvgNode(tree, 1),
    `</svg>`,
  ].join("\n");

  return svg;
}
