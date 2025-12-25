import { FileSearch } from "lucide-react";
import type { Plugin } from "@/lib/plugins/types";

const docSummarizerPlugin: Plugin = {
  config: {
    id: "doc-summarizer",
    name: "Doc Summarizer",
    version: "1.0.0",
    description: "Summarize documentation from URLs into books",
    menuItems: [
      {
        title: "Summarize Docs",
        href: "/summarizer",
        icon: FileSearch,
      },
    ],
  },
};

export default docSummarizerPlugin;
