"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileArchive, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Shelf {
  id: string;
  name: string;
}

interface ImportBookDialogProps {
  shelves?: Shelf[];
  trigger?: React.ReactNode;
}

export function ImportBookDialog({ shelves = [], trigger }: ImportBookDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [shelfId, setShelfId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    book?: {
      bookSlug: string;
      chaptersCreated: number;
      pagesCreated: number;
    };
  } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".zip")) {
        toast.error("Please select a ZIP file");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith(".zip")) {
        toast.error("Please drop a ZIP file");
        return;
      }
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (shelfId && shelfId !== "none") {
        formData.append("shelfId", shelfId);
      }

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ success: false, message: data.error || "Import failed" });
        toast.error(data.error || "Import failed");
      } else {
        setResult({
          success: true,
          message: data.message,
          book: data.book,
        });
        toast.success(data.message);
        router.refresh();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      setResult({ success: false, message });
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setShelfId("");
    setResult(null);
  };

  const handleViewBook = () => {
    if (result?.book?.bookSlug) {
      router.push(`/books/${result.book.bookSlug}`);
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5" />
            Import from BookStack
          </DialogTitle>
          <DialogDescription>
            Import a book from a BookStack Portable ZIP export file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Result display */}
          {result && (
            <div
              className={`rounded-lg border p-4 ${
                result.success
                  ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                  : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${result.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
                    {result.success ? "Import Successful!" : "Import Failed"}
                  </p>
                  <p className={`text-sm mt-1 ${result.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                    {result.message}
                  </p>
                  {result.book && (
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                      <p>{result.book.chaptersCreated} chapters, {result.book.pagesCreated} pages imported</p>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-green-700 dark:text-green-300 underline"
                        onClick={handleViewBook}
                      >
                        View imported book
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* File drop zone */}
          {!result?.success && (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors hover:border-primary hover:bg-muted/50
                  ${file ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div className="space-y-2">
                    <FileArchive className="h-10 w-10 mx-auto text-primary" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <p className="text-xs text-muted-foreground">Click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="font-medium">Drop ZIP file here or click to browse</p>
                    <p className="text-sm text-muted-foreground">
                      BookStack Portable ZIP export (.zip)
                    </p>
                  </div>
                )}
              </div>

              {/* Shelf selection */}
              {shelves.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="shelf">Add to shelf (optional)</Label>
                  <Select value={shelfId} onValueChange={setShelfId}>
                    <SelectTrigger id="shelf">
                      <SelectValue placeholder="No shelf" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No shelf</SelectItem>
                      {shelves.map((shelf) => (
                        <SelectItem key={shelf.id} value={shelf.id}>
                          {shelf.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Import button */}
              <Button
                onClick={handleImport}
                disabled={!file || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Book
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Export a book from BookStack using &quot;Portable ZIP&quot; format, then import it here.
              </p>
            </>
          )}

          {/* Close button after success */}
          {result?.success && (
            <Button variant="outline" onClick={handleClose} className="w-full">
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
