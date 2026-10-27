/* eslint-disable testing-library/no-node-access */
import { render } from "@testing-library/react";
import SafeHtml from "./SafeHtml";

const sanitized = (html) => render(<SafeHtml html={html} className="desc" />).container.firstChild;

describe("SafeHtml", () => {
  it("keeps ordinary formatting", () => {
    const el = sanitized("<p>Hello <strong>world</strong></p><ul><li>One</li><li>Two</li></ul>");
    expect(el.innerHTML).toBe("<p>Hello <strong>world</strong></p><ul><li>One</li><li>Two</li></ul>");
    expect(el).toHaveClass("desc");
  });

  it("renders plain text descriptions as text", () => {
    const el = sanitized("Just text & a < sign");
    expect(el.textContent).toBe("Just text & a < sign");
    expect(el.children).toHaveLength(0);
  });

  it("drops scripts and dangerous elements entirely", () => {
    const el = sanitized('<p>Hi</p><script>window.pwned = 1</script><iframe src="https://evil.example"></iframe><style>*{}</style>');
    expect(el.innerHTML).toBe("<p>Hi</p>");
    expect(window.pwned).toBeUndefined();
  });

  it("strips event handlers and other attributes", () => {
    const el = sanitized('<p onclick="alert(1)" style="color:red" class="x">Hi</p><img src="x" onerror="alert(1)">');
    const p = el.querySelector("p");
    expect(p.attributes).toHaveLength(0);
    const img = el.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.attributes).toHaveLength(3);
  });

  it("removes javascript: and data: links but keeps safe ones", () => {
    const el = sanitized(
      '<a href="javascript:alert(1)">bad</a><a href="data:text/html,<script>alert(1)</script>">bad2</a><a href="https://example.com/x">good</a>'
    );
    const links = el.querySelectorAll("a");
    expect(links[0].hasAttribute("href")).toBe(false);
    expect(links[1].hasAttribute("href")).toBe(false);
    expect(links[2].getAttribute("href")).toBe("https://example.com/x");
    expect(links[2].getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("unwraps unknown tags but keeps their text", () => {
    const el = sanitized("<section><font>Kept text</font></section>");
    expect(el.innerHTML).toBe("Kept text");
  });

  it("renders nothing for empty or non-string input", () => {
    expect(sanitized("").innerHTML).toBe("");
    expect(sanitized(undefined).innerHTML).toBe("");
  });
});
