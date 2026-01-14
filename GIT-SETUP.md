# Git Repository Setup Guide

## 🤔 Kenapa Remote URL Ikut Ketika Clone?

Ini adalah perilaku **normal** dari Git. Ketika seseorang clone repository, Git akan menyalin konfigurasi remote dari repository asli.

**Contoh:**
```bash
# User lain clone repository Anda
git clone https://github.com/IrfanArsyad/Herostack.git

# Remote akan mengarah ke repository Anda
git remote -v
# origin  https://github.com/IrfanArsyad/Herostack.git (fetch)
# origin  https://github.com/IrfanArsyad/Herostack.git (push)
```

**Masalah:** User tidak bisa push ke repository Anda (kecuali mereka punya akses).

## 🔧 Solusi untuk User yang Clone

### Opsi 1: Gunakan Script Setup (Recommended)

Jalankan script setup otomatis:

```bash
./setup-repo.sh
```

Script ini akan:
- Menampilkan remote URL saat ini
- Memberikan opsi untuk mengubah remote
- Setup remote baru sesuai kebutuhan

### Opsi 2: Manual Setup

#### A. Fork Repository (Recommended untuk Kontributor)

1. **Fork repository** di GitHub (klik tombol "Fork")
2. **Clone fork Anda:**
   ```bash
   git clone https://github.com/USERNAME-ANDA/Herostack.git
   cd Herostack
   ```

3. **Tambahkan upstream remote** (untuk sync dengan repository asli):
   ```bash
   git remote add upstream https://github.com/IrfanArsyad/Herostack.git
   ```

4. **Verifikasi:**
   ```bash
   git remote -v
   # origin    https://github.com/USERNAME-ANDA/Herostack.git (fetch)
   # origin    https://github.com/USERNAME-ANDA/Herostack.git (push)
   # upstream  https://github.com/IrfanArsyad/Herostack.git (fetch)
   # upstream  https://github.com/IrfanArsyad/Herostack.git (push)
   ```

5. **Sync dengan upstream:**
   ```bash
   git fetch upstream
   git merge upstream/main
   ```

#### B. Ubah Remote URL (Untuk Repository Baru)

Jika Anda ingin membuat repository baru:

```bash
# 1. Clone repository
git clone https://github.com/IrfanArsyad/Herostack.git my-herostack
cd my-herostack

# 2. Buat repository baru di GitHub (jangan initialize dengan README)

# 3. Ubah remote URL
git remote set-url origin https://github.com/USERNAME-ANDA/my-herostack.git

# 4. Push ke repository baru
git push -u origin main
```

#### C. Hapus dan Tambah Remote Baru

```bash
# 1. Hapus remote lama
git remote remove origin

# 2. Tambah remote baru
git remote add origin https://github.com/USERNAME-ANDA/my-herostack.git

# 3. Push
git push -u origin main
```

#### D. Start dari Scratch (No Git History)

Jika Anda ingin mulai fresh tanpa git history:

```bash
# 1. Download ZIP dari GitHub (bukan clone)
# 2. Extract ZIP
# 3. Hapus folder .git (jika ada)
rm -rf .git

# 4. Initialize git baru
git init

# 5. Add remote baru
git remote add origin https://github.com/USERNAME-ANDA/my-herostack.git

# 6. First commit
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

## 🎯 Untuk Pemilik Repository (Anda)

### Opsi 1: GitHub Template Repository

Jadikan repository sebagai **template** sehingga user bisa langsung "Use this template":

1. Go to repository settings di GitHub
2. Check "Template repository"
3. Save

User kemudian bisa:
- Klik "Use this template" button
- Create new repository dari template
- Clone repository baru mereka (sudah dengan remote URL mereka sendiri)

### Opsi 2: Tambahkan Dokumentasi di README

Tambahkan section di README.md untuk menjelaskan cara setup:

```markdown
## For Contributors

If you want to contribute or fork this repository:

1. Fork this repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/Herostack.git
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/IrfanArsyad/Herostack.git
   ```
```

### Opsi 3: Post-Clone Setup Script

Buat script `setup.sh` yang auto-detect dan tanya user:

```bash
#!/bin/bash
# Check if remote points to original repo
if git remote -v | grep -q "IrfanArsyad/Herostack"; then
    echo "⚠️  Remote masih mengarah ke repository asli"
    echo "Apakah Anda ingin mengubahnya? (y/n)"
    # ... (sudah dibuat di setup-repo.sh)
fi
```

## 📋 Workflow Recommendations

### Untuk Kontributor (Fork Model)

```bash
# Setup awal
git clone https://github.com/YOUR-USERNAME/Herostack.git
cd Herostack
git remote add upstream https://github.com/IrfanArsyad/Herostack.git

# Sebelum mulai kerja
git fetch upstream
git checkout main
git merge upstream/main

# Buat branch baru
git checkout -b feature/my-feature

# Kerja, commit, push
git add .
git commit -m "Add my feature"
git push origin feature/my-feature

# Buat Pull Request di GitHub
```

### Untuk User yang Deploy Sendiri

```bash
# Clone
git clone https://github.com/IrfanArsyad/Herostack.git my-docs
cd my-docs

# Ubah remote (jika punya repo sendiri)
git remote set-url origin https://github.com/YOUR-USERNAME/my-docs.git

# Atau hapus remote (jika tidak butuh push)
git remote remove origin

# Setup dan jalankan
cp .env.example .env
bun install
bun run dev
```

## 🔍 Check Remote URL

```bash
# Lihat semua remote
git remote -v

# Lihat detail remote 'origin'
git remote show origin

# Lihat config git
cat .git/config
```

## 🛠️ Common Commands

```bash
# Tambah remote
git remote add <name> <url>

# Hapus remote
git remote remove <name>

# Ubah URL remote
git remote set-url <name> <new-url>

# Rename remote
git remote rename <old-name> <new-name>

# Fetch dari remote
git fetch <name>

# Push ke remote
git push <name> <branch>

# Set upstream branch
git push -u <name> <branch>
```

## 💡 Tips

1. **Gunakan Fork** jika Anda ingin contribute kembali ke repository asli
2. **Ubah Remote** jika Anda ingin maintain versi sendiri
3. **Hapus .git** jika Anda ingin mulai fresh tanpa history
4. **Template Repository** di GitHub memudahkan user untuk copy project
5. **SSH vs HTTPS**: SSH lebih aman dan tidak perlu input password terus
   ```bash
   # HTTPS
   https://github.com/IrfanArsyad/Herostack.git

   # SSH
   git@github.com:IrfanArsyad/Herostack.git
   ```

## ⚠️ Warning

- **JANGAN** commit ke repository asli jika Anda hanya clone (bukan fork)
- **JANGAN** force push ke repository asli: `git push --force`
- **SELALU** buat branch baru untuk feature/fix (jangan commit langsung ke main)
- **PASTIKAN** .env tidak ter-commit (sudah ada di .gitignore)

## 📚 Resources

- [GitHub Fork Documentation](https://docs.github.com/en/get-started/quickstart/fork-a-repo)
- [Git Remote Documentation](https://git-scm.com/docs/git-remote)
- [GitHub Template Repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository)
