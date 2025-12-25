"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BookExportButtonProps {
  bookSlug: string;
}

async function downloadExport(slug: string, format: "pdf" | "markdown") {
  const response = await fetch(`/api/export/book/${slug}?format=${format}`);

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

export function BookExportButton({ bookSlug }: BookExportButtonProps) {
  const [isExporting, setIsExporting] = useState<"pdf" | "markdown" | null>(null);

  const handleExport = async (format: "pdf" | "markdown") => {
    setIsExporting(format);
    try {
      await downloadExport(bookSlug, format);
      toast.success(`Book exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Export failed");
      console.error(error);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting !== null}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileDown className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("markdown")}>
          <FileText className="mr-2 h-4 w-4" />
          Export as Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
