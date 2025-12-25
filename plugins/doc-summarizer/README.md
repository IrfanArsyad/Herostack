# Doc Summarizer Plugin for HeroStack

Plugin untuk merangkum dokumentasi dari URL eksternal menjadi buku yang terstruktur menggunakan AI (Google Gemini).

## Fitur

- **Web Scraping** - Otomatis mengambil dan mengekstrak konten dari halaman dokumentasi
- **AI Summarization** - Merangkum konten menggunakan Google Gemini AI
- **Book Generation** - Membuat buku lengkap dengan chapters dan pages
- **Multi-language** - Support Bahasa Indonesia dan English
- **Preview** - Lihat hasil rangkuman sebelum membuat buku
- **API Key di UI** - Input API key langsung di form, tersimpan di browser

## Penggunaan

1. Buka menu **Summarize Docs** di sidebar
2. Masukkan **Gemini API Key** (dapatkan dari [Google AI Studio](https://aistudio.google.com/app/apikey))
3. Masukkan URL dokumentasi yang ingin dirangkum
4. (Optional) Ubah nama buku, bahasa, dan model AI
5. Klik **Summarize & Preview**
6. Review hasil rangkuman
7. Klik **Create Book** untuk membuat buku

## Model AI yang Tersedia

- **Gemini 1.5 Flash** - Cepat dan efisien (default)
- **Gemini 1.5 Pro** - Kualitas terbaik
- **Gemini 2.0 Flash** - Model terbaru

## Struktur Plugin

```
plugins/doc-summarizer/
├── index.ts              # Entry point
├── config.ts             # Konfigurasi
├── types.ts              # TypeScript types
├── lib/
│   ├── scraper.ts        # Web scraping
│   ├── summarizer.ts     # Gemini integration
│   └── book-generator.ts # Book structure generation
├── components/
│   ├── summarizer-form.tsx
│   └── summarizer-preview.tsx
└── README.md
```

## Dependencies

Plugin ini membutuhkan:
- `cheerio` - HTML parsing
- `@google/generative-ai` - Gemini AI SDK

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - See the main project license.
