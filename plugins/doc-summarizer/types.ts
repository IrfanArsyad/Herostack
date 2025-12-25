export interface ScrapeResult {
  title: string;
  content: string;
  url: string;
  sections: ContentSection[];
}

export interface ContentSection {
  heading: string;
  level: number;
  content: string;
}

export interface SummaryResult {
  title: string;
  summary: string;
  chapters: ChapterSummary[];
}

export interface ChapterSummary {
  title: string;
  content: string;
  pages?: PageSummary[];
}

export interface PageSummary {
  title: string;
  content: string;
}

export interface SummarizerOptions {
  url: string;
  bookName?: string;
  language?: "id" | "en";
  model?: "gpt-4" | "gpt-3.5-turbo" | "gpt-4-turbo";
}

export interface GeneratedBook {
  name: string;
  description: string;
  chapters: GeneratedChapter[];
}

export interface GeneratedChapter {
  name: string;
  pages: GeneratedPage[];
}

export interface GeneratedPage {
  name: string;
  content: string;
  html: string;
}
