import TurndownService from "turndown";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// Custom rule for TipTap callout blocks
turndownService.addRule("callout", {
  filter: (node) => {
    return (
      node.nodeName === "DIV" &&
      node.getAttribute("data-type") === "callout"
    );
  },
  replacement: (content) => {
    return `> **Note:** ${content.trim()}\n\n`;
  },
});

// Custom rule for task lists
turndownService.addRule("taskList", {
  filter: (node) => {
    return (
      node.nodeName === "LI" &&
      node.getAttribute("data-type") === "taskItem"
    );
  },
  replacement: (content, node) => {
    const element = node as HTMLElement;
    const checked = element.getAttribute("data-checked") === "true";
    return `- [${checked ? "x" : " "}] ${content.trim()}\n`;
  },
});

// Custom rule for code blocks with language
turndownService.addRule("codeBlock", {
  filter: (node) => {
    return node.nodeName === "PRE" && node.querySelector("code") !== null;
  },
  replacement: (content, node) => {
    const element = node as HTMLElement;
    const codeElement = element.querySelector("code");
    const language = codeElement?.className?.match(/language-(\w+)/)?.[1] || "";
    const code = codeElement?.textContent || content;
    return `\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
  },
});

export function htmlToMarkdown(html: string): string {
  if (!html) return "";
  return turndownService.turndown(html);
}

export function pagesToMarkdown(
  pages: { name: string; html: string | null }[],
  options?: { includePageTitles?: boolean }
): string {
  const { includePageTitles = true } = options || {};

  return pages
    .map((page) => {
      const content = page.html ? htmlToMarkdown(page.html) : "";
      if (includePageTitles) {
        return `# ${page.name}\n\n${content}`;
      }
      return content;
    })
    .join("\n\n---\n\n");
}
