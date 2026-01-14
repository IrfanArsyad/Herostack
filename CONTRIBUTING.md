# Contributing to HeroStack

Terima kasih atas minat Anda untuk berkontribusi ke HeroStack! 🎉

## 🍴 Fork & Clone Workflow

### 1. Fork Repository

1. Klik tombol **"Fork"** di bagian kanan atas halaman GitHub
2. Pilih akun Anda sebagai destinasi fork
3. Tunggu proses fork selesai

### 2. Clone Fork Anda

```bash
# Clone fork Anda (bukan repository asli)
git clone https://github.com/YOUR-USERNAME/Herostack.git
cd Herostack
```

### 3. Setup Remote Upstream

```bash
# Tambahkan remote upstream (repository asli)
git remote add upstream https://github.com/IrfanArsyad/Herostack.git

# Verifikasi remote
git remote -v
# origin    https://github.com/YOUR-USERNAME/Herostack.git (fetch)
# origin    https://github.com/YOUR-USERNAME/Herostack.git (push)
# upstream  https://github.com/IrfanArsyad/Herostack.git (fetch)
# upstream  https://github.com/IrfanArsyad/Herostack.git (push)
```

### 4. Setup Development Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env dengan konfigurasi Anda
# Minimal yang perlu diisi:
# - AUTH_SECRET (generate dengan: openssl rand -base64 32)
# - DATABASE_URL (atau gunakan SQLite)

# Install dependencies
bun install

# Setup database (PostgreSQL)
bun run db:push

# Atau setup database (SQLite)
bunx drizzle-kit push --config drizzle.config.sqlite.ts

# Start development server
bun run dev
```

## 💻 Development Workflow

### Sync dengan Upstream

Sebelum mulai kerja, pastikan fork Anda up-to-date:

```bash
# Fetch perubahan dari upstream
git fetch upstream

# Checkout ke main branch
git checkout main

# Merge perubahan dari upstream/main
git merge upstream/main

# Push ke origin (fork Anda)
git push origin main
```

### Buat Feature Branch

**JANGAN** commit langsung ke branch `main`:

```bash
# Buat branch baru dari main
git checkout -b feature/nama-fitur

# Atau untuk bug fix
git checkout -b fix/nama-bug
```

**Branch Naming Convention:**
- `feature/` - untuk fitur baru (contoh: `feature/pdf-export`)
- `fix/` - untuk bug fix (contoh: `fix/login-error`)
- `docs/` - untuk dokumentasi (contoh: `docs/update-readme`)
- `refactor/` - untuk refactoring (contoh: `refactor/auth-logic`)
- `test/` - untuk testing (contoh: `test/add-unit-tests`)

### Coding

```bash
# Lakukan perubahan
# ...

# Add changes
git add .

# Commit dengan pesan yang jelas
git commit -m "feat: add PDF export functionality"

# Push ke fork Anda
git push origin feature/nama-fitur
```

**Commit Message Convention:**
- `feat:` - fitur baru
- `fix:` - bug fix
- `docs:` - perubahan dokumentasi
- `style:` - formatting, missing semi colons, etc
- `refactor:` - refactoring kode
- `test:` - menambah testing
- `chore:` - update build tasks, configs, etc

### Create Pull Request

1. Buka GitHub fork Anda
2. Klik **"Compare & pull request"**
3. Pastikan base repository: `IrfanArsyad/Herostack` base: `main`
4. Pastikan head repository: `YOUR-USERNAME/Herostack` compare: `feature/nama-fitur`
5. Isi judul dan deskripsi PR dengan jelas
6. Klik **"Create pull request"**

**PR Title Format:**
```
feat: Add PDF export functionality
fix: Resolve login error on OAuth
docs: Update installation guide
```

**PR Description Template:**
```markdown
## Description
Brief description of what this PR does

## Changes
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Tested locally
- [ ] All tests pass
- [ ] No console errors

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Fixes #123
```

## 🧪 Testing

Pastikan perubahan Anda tidak merusak fitur yang ada:

```bash
# Run linter
bun run lint

# Build project
bun run build

# Test build
bun run start
```

## 📋 Checklist Sebelum PR

- [ ] Code follows project style
- [ ] Tested locally
- [ ] No console errors
- [ ] Build succeeds
- [ ] Commit messages are clear
- [ ] PR description is complete
- [ ] Branch is up-to-date with upstream/main

## 🚫 Yang TIDAK Boleh Dilakukan

- ❌ Clone repository asli dan push langsung
- ❌ Commit ke branch `main` langsung
- ❌ Force push ke repository asli
- ❌ Commit file `.env` atau credentials
- ❌ Commit `node_modules/` atau file build
- ❌ Break existing functionality tanpa alasan jelas
- ❌ Menghapus atau mengubah file yang tidak related

## ✅ Best Practices

- ✅ **Fork** repository sebelum mulai kerja
- ✅ Buat **branch baru** untuk setiap fitur/fix
- ✅ **Sync dengan upstream** sebelum mulai kerja
- ✅ Tulis **commit message** yang jelas dan deskriptif
- ✅ Test perubahan Anda sebelum PR
- ✅ Keep PR **focused** - satu PR untuk satu fitur/fix
- ✅ Update dokumentasi jika perlu
- ✅ Follow **code style** yang ada

## 🔄 Update Fork Anda

Jika upstream sudah jauh lebih update dari fork Anda:

```bash
# Fetch upstream
git fetch upstream

# Checkout main
git checkout main

# Rebase dari upstream (atau merge)
git rebase upstream/main
# atau
git merge upstream/main

# Force push ke fork (hati-hati!)
git push origin main --force

# Update feature branch
git checkout feature/nama-fitur
git rebase main
git push origin feature/nama-fitur --force
```

## 🛠️ Troubleshooting

### Conflict saat merge upstream

```bash
# Fetch upstream
git fetch upstream

# Checkout branch Anda
git checkout feature/nama-fitur

# Rebase dari upstream/main
git rebase upstream/main

# Jika ada conflict, resolve manually
# Edit file yang conflict
git add .
git rebase --continue

# Force push (karena history berubah)
git push origin feature/nama-fitur --force
```

### Salah commit ke main

```bash
# Reset main ke upstream
git checkout main
git fetch upstream
git reset --hard upstream/main
git push origin main --force

# Pindahkan commit ke branch baru
git checkout -b feature/my-feature
git cherry-pick <commit-hash>
git push origin feature/my-feature
```

### Ingin batalkan PR

- Tutup PR di GitHub (tidak perlu delete branch)
- Atau delete branch jika tidak diperlukan:
  ```bash
  git push origin --delete feature/nama-fitur
  git branch -D feature/nama-fitur
  ```

## 📞 Pertanyaan?

Jika ada pertanyaan atau butuh bantuan:
1. Check [GIT-SETUP.md](./GIT-SETUP.md) untuk Git workflow
2. Check [README.md](./README.md) untuk instalasi
3. Open issue di GitHub untuk diskusi
4. Tag @IrfanArsyad di PR atau issue

## 📜 Code of Conduct

- Be respectful and constructive
- Follow project guidelines
- Help others when possible
- Keep discussions on topic

Terima kasih sudah berkontribusi! 🚀
