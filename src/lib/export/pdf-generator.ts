import puppeteer from "puppeteer";
import { htmlToMarkdown } from "./html-to-markdown";
import type { PageExportData, ChapterExportData, BookExportData } from "./types";

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-_]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 100);
}

export function generatePageMarkdown(page: PageExportData): string {
  const content = page.html ? htmlToMarkdown(page.html) : "";
  return `# ${page.name}\n\n${content}`;
}

export function generateChapterMarkdown(chapter: ChapterExportData): string {
  const parts: string[] = [`# ${chapter.name}\n`];

  for (const page of chapter.pages) {
    const content = page.html ? htmlToMarkdown(page.html) : "";
    parts.push(`## ${page.name}\n\n${content}`);
  }

  return parts.join("\n\n---\n\n");
}

export function generateBookMarkdown(book: BookExportData): string {
  const parts: string[] = [`# ${book.name}\n`];

  // Add chapters with their pages
  for (const chapter of book.chapters) {
    parts.push(`## ${chapter.name}\n`);
    for (const page of chapter.pages) {
      const content = page.html ? htmlToMarkdown(page.html) : "";
      parts.push(`### ${page.name}\n\n${content}`);
    }
  }

  // Add direct pages (pages without chapter)
  if (book.directPages.length > 0) {
    for (const page of book.directPages) {
      const content = page.html ? htmlToMarkdown(page.html) : "";
      parts.push(`## ${page.name}\n\n${content}`);
    }
  }

  return parts.join("\n\n---\n\n");
}

// Generate HTML document for PDF rendering
function generateHtmlDocument(title: string, htmlContent: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      max-width: 100%;
      margin: 0;
      padding: 40px;
    }
    h1 {
      font-size: 28px;
      margin-top: 0;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid #eee;
    }
    h2 {
      font-size: 22px;
      margin-top: 32px;
      margin-bottom: 16px;
    }
    h3 {
      font-size: 18px;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    p {
      margin: 0 0 16px 0;
    }
    img {
      max-width: 100%;
      height: auto;
      margin: 16px 0;
    }
    pre {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
    }
    code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
    }
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      margin: 16px 0;
      padding: 12px 20px;
      border-left: 4px solid #ddd;
      background: #f9f9f9;
    }
    ul, ol {
      margin: 0 0 16px 0;
      padding-left: 24px;
    }
    li {
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background: #f5f5f5;
      font-weight: 600;
    }
    hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 32px 0;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
  `.trim();
}

export function generatePageHtml(page: PageExportData): string {
  const content = page.html || "<p>No content</p>";
  return generateHtmlDocument(page.name, `<h1>${page.name}</h1>${content}`);
}

export function generateChapterHtml(chapter: ChapterExportData): string {
  const parts: string[] = [`<h1>${chapter.name}</h1>`];

  for (const page of chapter.pages) {
    const content = page.html || "";
    parts.push(`<div class="page-break"><h2>${page.name}</h2>${content}</div>`);
  }

  return generateHtmlDocument(chapter.name, parts.join("\n"));
}

export function generateBookHtml(book: BookExportData): string {
  const parts: string[] = [`<h1>${book.name}</h1>`];

  // Add chapters with their pages
  for (const chapter of book.chapters) {
    parts.push(`<div class="page-break"><h2>${chapter.name}</h2></div>`);
    for (const page of chapter.pages) {
      const content = page.html || "";
      parts.push(`<div><h3>${page.name}</h3>${content}</div>`);
    }
  }

  // Add direct pages (pages without chapter)
  if (book.directPages.length > 0) {
    for (const page of book.directPages) {
      const content = page.html || "";
      parts.push(`<div class="page-break"><h2>${page.name}</h2>${content}</div>`);
    }
  }

  return generateHtmlDocument(book.name, parts.join("\n"));
}

export async function generatePdf(htmlContent: string): Promise<Uint8Array> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Set content with wait for images to load
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
      printBackground: true,
    });

    return new Uint8Array(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export function getFilename(name: string, format: "pdf" | "markdown"): string {
  const sanitized = sanitizeFilename(name);
  const ext = format === "pdf" ? "pdf" : "md";
  return `${sanitized}.${ext}`;
}
