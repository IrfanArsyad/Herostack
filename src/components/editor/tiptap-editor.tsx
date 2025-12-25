"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Typography } from "@tiptap/extension-typography";
import { common, createLowlight } from "lowlight";
import { Callout } from "./extensions/callout";
import { EditorToolbar } from "./editor-toolbar";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { htmlToMarkdown } from "@/lib/export/html-to-markdown";
import { marked } from "marked";

const lowlight = createLowlight(common);

interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string, html: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

// Clean content by removing JSON strings that were accidentally embedded as text
function cleanContentNodes(nodes: unknown[]): unknown[] {
  return nodes.map((node: unknown) => {
    const n = node as { type?: string; content?: unknown[]; text?: string };
    if (!n || typeof n !== "object") return node;

    // If this is a text node containing a JSON document, skip it
    if (n.type === "text" && typeof n.text === "string") {
      try {
        const parsed = JSON.parse(n.text);
        if (parsed && parsed.type === "doc") {
          // This is embedded JSON, skip this node
          return null;
        }
      } catch {
        // Not JSON, keep the text
      }
    }

    // Recursively clean child content
    if (Array.isArray(n.content)) {
      const cleanedContent = cleanContentNodes(n.content).filter(Boolean);
      return { ...n, content: cleanedContent.length > 0 ? cleanedContent : undefined };
    }

    return node;
  }).filter(Boolean);
}

// Parse content - can be JSON string, HTML, or empty
function parseContent(content: string): object | string {
  if (!content) return "";

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(content);
    // Verify it's a TipTap document structure
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      // Clean any embedded JSON strings in the content
      if (Array.isArray(parsed.content)) {
        const cleanedContent = cleanContentNodes(parsed.content);
        return { ...parsed, content: cleanedContent };
      }
      return parsed;
    }
  } catch {
    // Not JSON, treat as HTML or empty
  }

  // Return as-is (could be HTML or empty string)
  return content;
}

export function TiptapEditor({
  content = "",
  onChange,
  placeholder = "Start writing...",
  className,
  editable = true,
}: TiptapEditorProps) {
  const [editorType, setEditorType] = useState<"visual" | "markdown">("visual");
  const [markdownContent, setMarkdownContent] = useState("");

  // Upload image handler - defined first so other handlers can use it
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
    return null;
  }, []);

  // Handle editor type change
  const handleEditorTypeChange = useCallback((value: string) => {
    if (value === "markdown" && editorType !== "markdown") {
      // Switching to markdown mode - convert current HTML to markdown
      const html = document.querySelector(".ProseMirror")?.innerHTML || "";
      const markdown = htmlToMarkdown(html);
      setMarkdownContent(markdown);
    }
    setEditorType(value as "visual" | "markdown");
  }, [editorType]);

  // Handle markdown content change
  const handleMarkdownChange = useCallback((value: string) => {
    setMarkdownContent(value);
    // Parse markdown to HTML for preview
    const htmlContent = marked.parse(value) as string;
    onChange?.(value, htmlContent);
  }, [onChange]);

  // Handle paste image in markdown mode
  const handleMarkdownPaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // Save selection position before async call
          const start = e.currentTarget.selectionStart ?? markdownContent.length;
          const end = e.currentTarget.selectionEnd ?? markdownContent.length;

          const url = await uploadImage(file);
          if (url) {
            const imageMarkdown = `![image](${url})`;
            const newText = markdownContent.substring(0, start) + imageMarkdown + markdownContent.substring(end);
            handleMarkdownChange(newText);
          }
        }
        return;
      }
    }
  }, [uploadImage, markdownContent, handleMarkdownChange]);

  // Handle drop image in markdown mode
  const handleMarkdownDrop = useCallback(async (e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type.startsWith("image/")) {
      e.preventDefault();
      const url = await uploadImage(file);
      if (url) {
        const imageMarkdown = `![image](${url})\n`;
        const newText = markdownContent + imageMarkdown;
        handleMarkdownChange(newText);
      }
    }
  }, [uploadImage, markdownContent, handleMarkdownChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-md max-w-full",
        },
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: "bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border-b",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border p-2",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border p-2 bg-muted font-semibold",
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Subscript,
      Superscript,
      Typography,
      Callout,
    ],
    content: parseContent(content),
    editable,
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      const html = editor.getHTML();
      onChange?.(json, html);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose-base dark:prose-invert max-w-none",
          "focus:outline-none min-h-[400px] px-4 py-3",
          "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-4 [&_ol]:ml-4",
          "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6",
          "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5",
          "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4",
          "[&_p]:mb-3 [&_p]:leading-relaxed",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4",
          "[&_table]:w-full [&_table]:border-collapse [&_table]:my-4",
          "[&_th]:border [&_th]:p-2 [&_th]:bg-muted [&_th]:font-semibold",
          "[&_td]:border [&_td]:p-2",
          "[&_img]:rounded-md [&_img]:max-w-full [&_img]:my-4",
          // Task list styling
          "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:ml-0 [&_ul[data-type=taskList]]:pl-0",
          "[&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:gap-2 [&_li[data-type=taskItem]]:items-start",
          "[&_li[data-type=taskItem]_input]:mt-1 [&_li[data-type=taskItem]_input]:cursor-pointer",
          // Subscript/superscript
          "[&_sub]:text-xs [&_sup]:text-xs",
          // Strikethrough
          "[&_s]:line-through [&_del]:line-through"
        ),
      },
      // Handle paste events for images
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              uploadImage(file).then((url) => {
                if (url) {
                  const { state, dispatch } = view;
                  const { tr } = state;
                  const node = state.schema.nodes.image.create({ src: url });
                  dispatch(tr.replaceSelectionWith(node));
                }
              });
              return true;
            }
          }
        }
        return false;
      },
      // Handle drop events for images
      handleDrop: (view, event, slice, moved) => {
        if (moved) return false;

        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        const file = files[0];
        if (file.type.startsWith("image/")) {
          event.preventDefault();
          uploadImage(file).then((url) => {
            if (url) {
              const { state, dispatch } = view;
              const { tr } = state;
              const node = state.schema.nodes.image.create({ src: url });
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (pos) {
                dispatch(tr.insert(pos.pos, node));
              } else {
                dispatch(tr.replaceSelectionWith(node));
              }
            }
          });
          return true;
        }
        return false;
      },
    },
  });

  if (!editor) {
    return (
      <div className={cn("border rounded-md", className)}>
        <div className="h-12 border-b bg-muted animate-pulse" />
        <div className="min-h-[400px] p-4">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
      {editable ? (
        <>
          {/* Top bar - Editor type toggle */}
          <div className="flex items-center border-b bg-muted/40 px-2 py-1.5">
            <div className="flex bg-muted rounded-md p-0.5">
              <button
                type="button"
                onClick={() => handleEditorTypeChange("visual")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded transition-colors",
                  editorType === "visual"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Visual
              </button>
              <button
                type="button"
                onClick={() => handleEditorTypeChange("markdown")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded transition-colors",
                  editorType === "markdown"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Markdown
              </button>
            </div>
          </div>

          {/* Editor content */}
          {editorType === "visual" ? (
            <>
              <EditorToolbar editor={editor} onImageUpload={uploadImage} />
              <EditorContent editor={editor} />
            </>
          ) : (
            <Textarea
              value={markdownContent}
              onChange={(e) => handleMarkdownChange(e.target.value)}
              onPaste={handleMarkdownPaste}
              onDrop={handleMarkdownDrop}
              onDragOver={(e) => e.preventDefault()}
              placeholder={placeholder}
              className="min-h-[400px] w-full font-mono text-sm border-0 rounded-none focus-visible:ring-0 resize-none p-4"
              spellCheck={false}
            />
          )}
        </>
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}
