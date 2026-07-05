import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RichText } from "./rich-text";

const render = (doc: unknown) => renderToStaticMarkup(<RichText doc={doc} />);

describe("RichText", () => {
  it("renders headings, paragraphs, marks and lists", () => {
    const html = render({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello " },
            { type: "text", text: "bold", marks: [{ type: "bold" }] },
          ],
        },
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "one" }] }] },
          ],
        },
      ],
    });
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<ul><li><p>one</p></li></ul>");
  });

  it("escapes HTML in text (XSS-safe)", () => {
    const html = render({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "<script>alert(1)</script>" }] }],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("blocks unsafe link schemes", () => {
    const html = render({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "click",
              // eslint-disable-next-line no-script-url
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    });
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="#"');
  });

  it("allows safe link schemes", () => {
    const html = render({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "site", marks: [{ type: "link", attrs: { href: "https://example.com" } }] },
          ],
        },
      ],
    });
    expect(html).toContain('href="https://example.com"');
  });

  it("shows a fallback for empty documents", () => {
    expect(render({ type: "doc", content: [] })).toContain("no content");
  });
});
