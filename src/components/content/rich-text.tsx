import { Fragment, type ReactNode } from "react";

/**
 * Renders a TipTap / ProseMirror JSON document to React elements. Output is
 * built from typed elements only (no dangerouslySetInnerHTML), so stored content
 * cannot inject markup — XSS-safe by construction. Unknown node types fall back
 * to rendering their children. Element styling comes from the `.reader-prose`
 * wrapper (see globals.css).
 */
interface PMMark {
  type?: string;
  attrs?: Record<string, unknown>;
}
interface PMNode {
  type?: string;
  content?: PMNode[];
  text?: string;
  marks?: PMMark[];
  attrs?: Record<string, unknown>;
}

function applyMarks(text: string, marks: PMMark[] | undefined): ReactNode {
  let el: ReactNode = text;
  for (const mark of marks ?? []) {
    switch (mark.type) {
      case "bold":
      case "strong":
        el = <strong>{el}</strong>;
        break;
      case "italic":
      case "em":
        el = <em>{el}</em>;
        break;
      case "code":
        el = <code>{el}</code>;
        break;
      case "strike":
        el = <s>{el}</s>;
        break;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
        el = (
          <a href={href} rel="noopener noreferrer nofollow" target="_blank">
            {el}
          </a>
        );
        break;
      }
      default:
        break;
    }
  }
  return el;
}

function renderChildren(node: PMNode): ReactNode[] {
  return (node.content ?? []).map((child, i) => <Fragment key={i}>{renderNode(child)}</Fragment>);
}

function textContent(node: PMNode): string {
  if (typeof node.text === "string") return node.text;
  return (node.content ?? []).map(textContent).join("");
}

function renderNode(node: PMNode): ReactNode {
  switch (node.type) {
    case "text":
      return applyMarks(node.text ?? "", node.marks);
    case "paragraph":
      return <p>{renderChildren(node)}</p>;
    case "heading": {
      const level = typeof node.attrs?.level === "number" ? node.attrs.level : 2;
      const clamped = Math.min(4, Math.max(2, level));
      const Tag = `h${clamped}` as "h2" | "h3" | "h4";
      return <Tag>{renderChildren(node)}</Tag>;
    }
    case "bulletList":
      return <ul>{renderChildren(node)}</ul>;
    case "orderedList":
      return <ol>{renderChildren(node)}</ol>;
    case "listItem":
      return <li>{renderChildren(node)}</li>;
    case "blockquote":
      return <blockquote>{renderChildren(node)}</blockquote>;
    case "codeBlock":
      return (
        <pre>
          <code>{textContent(node)}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr />;
    case "hardBreak":
      return <br />;
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      // eslint-disable-next-line @next/next/no-img-element
      return src ? <img src={src} alt={alt} /> : null;
    }
    default:
      return <>{renderChildren(node)}</>;
  }
}

export function RichText({ doc }: { doc: unknown }) {
  const root = (doc && typeof doc === "object" ? (doc as PMNode) : { type: "doc", content: [] });
  const children = root.content ?? [];
  if (children.length === 0) {
    return <p className="text-muted">This note has no content yet.</p>;
  }
  return <div className="reader-prose">{renderChildren(root)}</div>;
}
