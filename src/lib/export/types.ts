export type ExportFormat = "pdf" | "markdown";

export interface PageExportData {
  id: string;
  name: string;
  slug: string;
  html: string | null;
  content: string | null;
}

export interface ChapterExportData {
  id: string;
  name: string;
  slug: string;
  pages: PageExportData[];
}

export interface BookExportData {
  id: string;
  name: string;
  slug: string;
  chapters: ChapterExportData[];
  directPages: PageExportData[];
}
