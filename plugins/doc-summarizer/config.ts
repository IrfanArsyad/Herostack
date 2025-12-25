export const config = {
  gemini: {
    model: "gemini-1.5-flash", // atau gemini-1.5-pro
    maxOutputTokens: 4000,
  },
  scraper: {
    timeout: 30000,
    maxContentLength: 100000, // 100KB max content
  },
  summarizer: {
    chunkSize: 8000, // characters per chunk for summarization
    maxChunks: 10,
  },
};
