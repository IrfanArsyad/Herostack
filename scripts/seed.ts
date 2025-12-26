import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import slugify from "slugify";

const connectionString = process.env.DATABASE_URL!;
const queryClient = postgres(connectionString);
const db = drizzle(queryClient, { schema });

const createSlug = (text: string) =>
  slugify(text, { lower: true, strict: true });

async function seed() {
  console.log("Seeding sample content...");

  // Create Shelf
  const [shelf] = await db
    .insert(schema.shelves)
    .values({
      name: "HeroStack Guide",
      slug: createSlug("herostack-guide"),
      description:
        "Official documentation and tutorials for HeroStack platform",
      sortOrder: 0,
    })
    .returning();

  console.log("Created shelf:", shelf.name);

  // Create Book
  const [book] = await db
    .insert(schema.books)
    .values({
      shelfId: shelf.id,
      name: "Getting Started",
      slug: createSlug("getting-started"),
      description: "Learn the basics of HeroStack and start creating documentation",
      sortOrder: 0,
    })
    .returning();

  console.log("Created book:", book.name);

  // Create Chapters
  const chaptersData = [
    {
      name: "Introduction",
      slug: createSlug("introduction"),
      description: "Welcome to HeroStack",
      sortOrder: 0,
    },
    {
      name: "Basic Concepts",
      slug: createSlug("basic-concepts"),
      description: "Understanding the core concepts",
      sortOrder: 1,
    },
    {
      name: "Creating Content",
      slug: createSlug("creating-content"),
      description: "How to create and organize content",
      sortOrder: 2,
    },
  ];

  const chapters = await db
    .insert(schema.chapters)
    .values(chaptersData.map((c) => ({ ...c, bookId: book.id })))
    .returning();

  console.log("Created chapters:", chapters.map((c) => c.name).join(", "));

  // Create Pages with content
  const pagesData = [
    // Introduction Chapter
    {
      chapterId: chapters[0].id,
      bookId: book.id,
      name: "What is HeroStack?",
      slug: createSlug("what-is-herostack"),
      sortOrder: 0,
      content: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "What is HeroStack?" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "HeroStack is a self-hosted documentation platform built with Next.js. It allows you to organize your knowledge into a hierarchical structure of Shelves, Books, Chapters, and Pages.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Key Features" }],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        marks: [{ type: "bold" }],
                        text: "Hierarchical Organization",
                      },
                      {
                        type: "text",
                        text: " - Structure your content with Shelves, Books, Chapters, and Pages",
                      },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        marks: [{ type: "bold" }],
                        text: "Rich Text Editor",
                      },
                      {
                        type: "text",
                        text: " - Create beautiful documentation with our TipTap-based editor",
                      },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        marks: [{ type: "bold" }],
                        text: "Full-Text Search",
                      },
                      {
                        type: "text",
                        text: " - Find content quickly with PostgreSQL-powered search",
                      },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        marks: [{ type: "bold" }],
                        text: "Role-Based Access",
                      },
                      {
                        type: "text",
                        text: " - Control who can view and edit your documentation",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
      html: `<h1>What is HeroStack?</h1><p>HeroStack is a self-hosted documentation platform built with Next.js. It allows you to organize your knowledge into a hierarchical structure of Shelves, Books, Chapters, and Pages.</p><h2>Key Features</h2><ul><li><strong>Hierarchical Organization</strong> - Structure your content with Shelves, Books, Chapters, and Pages</li><li><strong>Rich Text Editor</strong> - Create beautiful documentation with our TipTap-based editor</li><li><strong>Full-Text Search</strong> - Find content quickly with PostgreSQL-powered search</li><li><strong>Role-Based Access</strong> - Control who can view and edit your documentation</li></ul>`,
    },
    {
      chapterId: chapters[0].id,
      bookId: book.id,
      name: "Quick Start",
      slug: createSlug("quick-start"),
      sortOrder: 1,
      content: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Quick Start" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Get up and running with HeroStack in just a few minutes.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "1. Create Your First Shelf" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: 'A Shelf is the top-level container for your documentation. Think of it as a bookshelf that holds related books. To create a shelf, click on "New Shelf" button in the sidebar.',
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "2. Add a Book" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: 'Books contain chapters and pages. Each book should focus on a specific topic or project. Click on "New Book" within a shelf to create one.',
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "3. Create Chapters and Pages" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Organize your content into chapters, and add pages within each chapter. Pages are where you write your actual documentation using the rich text editor.",
              },
            ],
          },
        ],
      }),
      html: `<h1>Quick Start</h1><p>Get up and running with HeroStack in just a few minutes.</p><h2>1. Create Your First Shelf</h2><p>A Shelf is the top-level container for your documentation. Think of it as a bookshelf that holds related books. To create a shelf, click on "New Shelf" button in the sidebar.</p><h2>2. Add a Book</h2><p>Books contain chapters and pages. Each book should focus on a specific topic or project. Click on "New Book" within a shelf to create one.</p><h2>3. Create Chapters and Pages</h2><p>Organize your content into chapters, and add pages within each chapter. Pages are where you write your actual documentation using the rich text editor.</p>`,
    },
    // Basic Concepts Chapter
    {
      chapterId: chapters[1].id,
      bookId: book.id,
      name: "Content Hierarchy",
      slug: createSlug("content-hierarchy"),
      sortOrder: 0,
      content: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Content Hierarchy" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "HeroStack uses a four-level hierarchy to organize your documentation:",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Shelves" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "The highest level of organization. Use shelves to group related books together. For example, you might have shelves for different departments, projects, or documentation types.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Books" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Books belong to shelves and contain your main documentation topics. Each book can have multiple chapters and standalone pages.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Chapters" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Chapters help organize pages within a book. They act as folders or sections for grouping related pages together.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Pages" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Pages are where your actual content lives. Each page has a rich text editor where you can write documentation, add code blocks, images, and more.",
              },
            ],
          },
        ],
      }),
      html: `<h1>Content Hierarchy</h1><p>HeroStack uses a four-level hierarchy to organize your documentation:</p><h2>Shelves</h2><p>The highest level of organization. Use shelves to group related books together. For example, you might have shelves for different departments, projects, or documentation types.</p><h2>Books</h2><p>Books belong to shelves and contain your main documentation topics. Each book can have multiple chapters and standalone pages.</p><h2>Chapters</h2><p>Chapters help organize pages within a book. They act as folders or sections for grouping related pages together.</p><h2>Pages</h2><p>Pages are where your actual content lives. Each page has a rich text editor where you can write documentation, add code blocks, images, and more.</p>`,
    },
    {
      chapterId: chapters[1].id,
      bookId: book.id,
      name: "User Roles",
      slug: createSlug("user-roles"),
      sortOrder: 1,
      content: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "User Roles" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "HeroStack has three user roles with different permission levels:",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Admin" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Full access to everything. Admins can manage users, create/edit/delete all content, and configure system settings.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Editor" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Can create, edit, and delete content. Editors cannot manage users or access admin-only settings.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Viewer" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Read-only access. Viewers can browse and search documentation but cannot make any changes.",
              },
            ],
          },
        ],
      }),
      html: `<h1>User Roles</h1><p>HeroStack has three user roles with different permission levels:</p><h2>Admin</h2><p>Full access to everything. Admins can manage users, create/edit/delete all content, and configure system settings.</p><h2>Editor</h2><p>Can create, edit, and delete content. Editors cannot manage users or access admin-only settings.</p><h2>Viewer</h2><p>Read-only access. Viewers can browse and search documentation but cannot make any changes.</p>`,
    },
    // Creating Content Chapter
    {
      chapterId: chapters[2].id,
      bookId: book.id,
      name: "Using the Editor",
      slug: createSlug("using-the-editor"),
      sortOrder: 0,
      content: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Using the Editor" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "HeroStack uses TipTap, a powerful rich text editor that supports various formatting options.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Text Formatting" }],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        marks: [{ type: "bold" }],
                        text: "Bold",
                      },
                      { type: "text", text: " - Ctrl/Cmd + B" },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        marks: [{ type: "italic" }],
                        text: "Italic",
                      },
                      { type: "text", text: " - Ctrl/Cmd + I" },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        marks: [{ type: "underline" }],
                        text: "Underline",
                      },
                      { type: "text", text: " - Ctrl/Cmd + U" },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        marks: [{ type: "strike" }],
                        text: "Strikethrough",
                      },
                      { type: "text", text: " - Ctrl/Cmd + Shift + X" },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Code Blocks" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: 'You can add syntax-highlighted code blocks by typing ``` followed by the language name, or by clicking the code block button in the toolbar.',
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Tables" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Insert tables to organize data. You can add/remove rows and columns, and merge cells as needed.",
              },
            ],
          },
        ],
      }),
      html: `<h1>Using the Editor</h1><p>HeroStack uses TipTap, a powerful rich text editor that supports various formatting options.</p><h2>Text Formatting</h2><ul><li><strong>Bold</strong> - Ctrl/Cmd + B</li><li><em>Italic</em> - Ctrl/Cmd + I</li><li><u>Underline</u> - Ctrl/Cmd + U</li><li><s>Strikethrough</s> - Ctrl/Cmd + Shift + X</li></ul><h2>Code Blocks</h2><p>You can add syntax-highlighted code blocks by typing \`\`\` followed by the language name, or by clicking the code block button in the toolbar.</p><h2>Tables</h2><p>Insert tables to organize data. You can add/remove rows and columns, and merge cells as needed.</p>`,
    },
    {
      chapterId: chapters[2].id,
      bookId: book.id,
      name: "Sharing Content",
      slug: createSlug("sharing-content"),
      sortOrder: 1,
      content: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Sharing Content" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "HeroStack allows you to share your documentation with people outside your organization.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Public Links" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "You can generate a public link for any page. Anyone with the link can view the page without logging in. The link is read-only and does not give access to edit the content.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "How to Share" }],
          },
          {
            type: "orderedList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", text: "Open the page you want to share" },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", text: 'Click the "Share" button in the toolbar' },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", text: 'Toggle "Public Access" on' },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", text: "Copy the generated link and share it" },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Revoking Access" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: 'To revoke public access, simply toggle "Public Access" off. The previously shared link will no longer work.',
              },
            ],
          },
        ],
      }),
      html: `<h1>Sharing Content</h1><p>HeroStack allows you to share your documentation with people outside your organization.</p><h2>Public Links</h2><p>You can generate a public link for any page. Anyone with the link can view the page without logging in. The link is read-only and does not give access to edit the content.</p><h2>How to Share</h2><ol><li>Open the page you want to share</li><li>Click the "Share" button in the toolbar</li><li>Toggle "Public Access" on</li><li>Copy the generated link and share it</li></ol><h2>Revoking Access</h2><p>To revoke public access, simply toggle "Public Access" off. The previously shared link will no longer work.</p>`,
    },
    {
      chapterId: chapters[2].id,
      bookId: book.id,
      name: "Exporting Content",
      slug: createSlug("exporting-content"),
      sortOrder: 2,
      content: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Exporting Content" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "HeroStack supports exporting your documentation in multiple formats.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "PDF Export" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Export individual pages, entire chapters, or complete books as PDF files. The PDF preserves formatting, code blocks, and images.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Markdown Export" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Download your content as Markdown files. This is useful for migrating content to other platforms or for backup purposes.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "How to Export" }],
          },
          {
            type: "orderedList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", text: "Navigate to the page, chapter, or book you want to export" },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", text: 'Click the "Export" button' },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", text: "Choose your preferred format (PDF or Markdown)" },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", text: "The file will be downloaded to your device" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
      html: `<h1>Exporting Content</h1><p>HeroStack supports exporting your documentation in multiple formats.</p><h2>PDF Export</h2><p>Export individual pages, entire chapters, or complete books as PDF files. The PDF preserves formatting, code blocks, and images.</p><h2>Markdown Export</h2><p>Download your content as Markdown files. This is useful for migrating content to other platforms or for backup purposes.</p><h2>How to Export</h2><ol><li>Navigate to the page, chapter, or book you want to export</li><li>Click the "Export" button</li><li>Choose your preferred format (PDF or Markdown)</li><li>The file will be downloaded to your device</li></ol>`,
    },
  ];

  const pages = await db.insert(schema.pages).values(pagesData).returning();

  console.log("Created pages:", pages.map((p) => p.name).join(", "));

  // Create Tags
  const tagsData = [
    { name: "Tutorial", slug: createSlug("tutorial") },
    { name: "Getting Started", slug: createSlug("getting-started-tag") },
    { name: "Documentation", slug: createSlug("documentation") },
  ];

  const tags = await db.insert(schema.tags).values(tagsData).returning();

  console.log("Created tags:", tags.map((t) => t.name).join(", "));

  // Tag the shelf and book
  await db.insert(schema.taggables).values([
    { tagId: tags[0].id, taggableId: shelf.id, taggableType: "shelf" },
    { tagId: tags[2].id, taggableId: shelf.id, taggableType: "shelf" },
    { tagId: tags[0].id, taggableId: book.id, taggableType: "book" },
    { tagId: tags[1].id, taggableId: book.id, taggableType: "book" },
  ]);

  console.log("Tagged content successfully");

  console.log("\nSeed completed successfully!");
  console.log("Created:");
  console.log(`  - 1 Shelf: "${shelf.name}"`);
  console.log(`  - 1 Book: "${book.name}"`);
  console.log(`  - ${chapters.length} Chapters`);
  console.log(`  - ${pages.length} Pages`);
  console.log(`  - ${tags.length} Tags`);

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
