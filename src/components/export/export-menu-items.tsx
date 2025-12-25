"use client";

import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { FileText, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExportMenuItemsProps {
  type: "page" | "chapter" | "book";
  slug: string;
}

async function downloadExport(
  type: string,
  slug: string,
  format: "pdf" | "markdown"
) {
  const response = await fetch(`/api/export/${type}/${slug}?format=${format}`);

  if (!response.ok) {
    throw new Error("Export failed");
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition");
  const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
  const filename = filenameMatch?.[1] || `export.${format === "pdf" ? "pdf" : "md"}`;

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function ExportMenuItems({ type, slug }: ExportMenuItemsProps) {
  const [isExporting, setIsExporting] = useState<"pdf" | "markdown" | null>(null);

  const handleExport = async (format: "pdf" | "markdown") => {
    setIsExporting(format);
    try {
      await downloadExport(type, slug, format);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Export failed");
      console.error(error);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <>
      <DropdownMenuItem
        onClick={() => handleExport("pdf")}
        disabled={isExporting !== null}
      >
        {isExporting === "pdf" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="mr-2 h-4 w-4" />
        )}
        Export as PDF
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => handleExport("markdown")}
        disabled={isExporting !== null}
      >
        {isExporting === "markdown" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        Export as Markdown
      </DropdownMenuItem>
    </>
  );
}
