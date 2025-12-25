import type { SummaryResult, GeneratedBook, GeneratedChapter, GeneratedPage } from "../types";

export function generateBookStructure(summary: SummaryResult): GeneratedBook {
  const chapters: GeneratedChapter[] = summary.chapters.map((chapter, index) => {
    // Convert chapter content to pages
    // If chapter has explicit pages, use them; otherwise create a single page
    const pages: GeneratedPage[] = chapter.pages
      ? chapter.pages.map((page) => ({
          name: page.title,
          content: page.content,
          html: markdownToHtml(page.content),
        }))
      : [
          {
            name: chapter.title,
            content: chapter.content,
            html: markdownToHtml(chapter.content),
          },
        ];

    return {
      name: chapter.title || `Chapter ${index + 1}`,
      pages,
    };
  });

  return {
    name: summary.title,
    description: summary.summary,
    chapters,
  };
}

function markdownToHtml(markdown: string): string {
  // Basic markdown to HTML conversion
  // In production, you'd want to use a proper markdown parser
  let html = markdown;

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang || "plaintext"}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Headers
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // Paragraphs
  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");
  html = html.replace(/<p>(<h[1-6]>)/g, "$1");
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, "$1");
  html = html.replace(/<p>(<pre>)/g, "$1");
  html = html.replace(/(<\/pre>)<\/p>/g, "$1");
  html = html.replace(/<p>(<ul>)/g, "$1");
  html = html.replace(/(<\/ul>)<\/p>/g, "$1");
  html = html.replace(/<p>(<blockquote>)/g, "$1");
  html = html.replace(/(<\/blockquote>)<\/p>/g, "$1");

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getBookStats(book: GeneratedBook): {
  totalChapters: number;
  totalPages: number;
  estimatedReadTime: number;
} {
  const totalChapters = book.chapters.length;
  const totalPages = book.chapters.reduce((acc, ch) => acc + ch.pages.length, 0);
  const totalWords = book.chapters.reduce((acc, ch) => {
    return acc + ch.pages.reduce((pacc, p) => pacc + p.content.split(/\s+/).length, 0);
  }, 0);
  const estimatedReadTime = Math.ceil(totalWords / 200); // 200 words per minute

  return { totalChapters, totalPages, estimatedReadTime };
}
