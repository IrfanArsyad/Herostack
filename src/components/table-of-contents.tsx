"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  html: string;
}

export function TableOfContents({ html }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Parse headings from HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const elements = doc.querySelectorAll("h1, h2, h3, h4");

    const items: TocItem[] = [];
    elements.forEach((el, index) => {
      const id = el.id || `heading-${index}`;
      const level = parseInt(el.tagName[1]);
      const text = el.textContent || "";
      if (text.trim()) {
        items.push({ id, text, level });
      }
    });

    setHeadings(items);
  }, [html]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
        <List className="h-4 w-4" />
        On this page
      </div>
      <ul className="space-y-1 text-sm">
        {headings.map((heading) => (
          <li key={heading.id}>
            <button
              onClick={() => handleClick(heading.id)}
              className={cn(
                "block w-full text-left py-1 text-muted-foreground hover:text-foreground transition-colors",
                heading.level === 1 && "font-medium",
                heading.level === 2 && "pl-0",
                heading.level === 3 && "pl-3",
                heading.level === 4 && "pl-6",
                activeId === heading.id && "text-foreground font-medium"
              )}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
