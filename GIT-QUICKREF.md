# Git Commands Quick Reference

## 🚀 Initial Setup

### Fork Workflow
```bash
# 1. Fork di GitHub (klik Fork button)

# 2. Clone fork Anda
git clone https://github.com/YOUR-USERNAME/Herostack.git
cd Herostack

# 3. Add upstream
git remote add upstream https://github.com/IrfanArsyad/Herostack.git

# 4. Verify
git remote -v
```

### Change Remote URL
```bash
# Quick: Ubah remote dengan script
./setup-repo.sh

# Manual: Lihat remote saat ini
git remote -v

# Manual: Ubah URL origin
git remote set-url origin https://github.com/YOUR-USERNAME/your-repo.git

# Manual: Hapus dan tambah baru
git remote remove origin
git remote add origin https://github.com/YOUR-USERNAME/your-repo.git

# Manual: Verify
git remote -v
```

## 🔄 Daily Workflow

### Sync dengan Upstream
```bash
# Fetch dari upstream
git fetch upstream

# Checkout ke main
git checkout main

# Merge upstream ke main
git merge upstream/main

# Push ke origin
git push origin main
```

### Buat Feature Branch
```bash
# Buat dan checkout branch baru
git checkout -b feature/my-feature

# Atau untuk bug fix
git checkout -b fix/bug-name
```

### Commit & Push
```bash
# Check status
git status

# Add semua perubahan
git add .

# Atau add file spesifik
git add path/to/file.js

# Commit dengan message
git commit -m "feat: add new feature"

# Push ke fork
git push origin feature/my-feature
```

## 🌿 Branch Management

### List Branches
```bash
# Local branches
git branch

# Remote branches
git branch -r

# All branches
git branch -a
```

### Switch Branch
```bash
# Checkout ke branch lain
git checkout main
git checkout feature/my-feature

# Buat dan checkout sekaligus
git checkout -b new-branch
```

### Delete Branch
```bash
# Delete local branch
git branch -d feature/my-feature

# Force delete
git branch -D feature/my-feature

# Delete remote branch
git push origin --delete feature/my-feature
```

### Rename Branch
```bash
# Rename current branch
git branch -m new-name

# Rename specific branch
git branch -m old-name new-name

# Update di remote
git push origin -u new-name
git push origin --delete old-name
```

## 📝 Commit Management

### Undo Commits
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo specific file
git checkout -- path/to/file.js
```

### Amend Commit
```bash
# Ubah commit message terakhir
git commit --amend -m "new message"

# Tambah file ke commit terakhir
git add forgotten-file.js
git commit --amend --no-edit
```

### Cherry-pick
```bash
# Apply specific commit ke branch saat ini
git cherry-pick <commit-hash>
```

## 🔍 View Changes

### Status & Diff
```bash
# Check status
git status

# Lihat perubahan (unstaged)
git diff

# Lihat perubahan (staged)
git diff --staged

# Lihat perubahan di file spesifik
git diff path/to/file.js
```

### Log & History
```bash
# Lihat commit history
git log

# Compact log
git log --oneline

# Graph view
git log --graph --oneline --all

# Lihat commit untuk file tertentu
git log -- path/to/file.js
```

## 🔀 Merge & Rebase

### Merge
```bash
# Merge branch ke current branch
git merge feature/my-feature

# Merge tanpa fast-forward
git merge --no-ff feature/my-feature
```

### Rebase
```bash
# Rebase current branch ke main
git rebase main

# Continue setelah resolve conflict
git rebase --continue

# Abort rebase
git rebase --abort

# Interactive rebase (squash, edit, dll)
git rebase -i HEAD~3
```

## 🚨 Fix Conflicts

```bash
# Saat merge/rebase conflict
# 1. Edit file yang conflict
# 2. Remove conflict markers (<<<, ===, >>>)
# 3. Add resolved files
git add .

# 4. Continue
git merge --continue
# atau
git rebase --continue
```

## 🗑️ Cleanup

### Stash Changes
```bash
# Stash perubahan
git stash

# Stash dengan message
git stash save "WIP: working on feature"

# List stashes
git stash list

# Apply stash
git stash apply

# Apply dan hapus stash
git stash pop

# Hapus stash
git stash drop
```

### Clean Untracked Files
```bash
# Preview apa yang akan dihapus
git clean -n

# Hapus untracked files
git clean -f

# Hapus directories juga
git clean -fd
```

## 🔐 Remote Management

### Manage Remotes
```bash
# List remotes
git remote -v

# Add remote
git remote add <name> <url>

# Remove remote
git remote remove <name>

# Rename remote
git remote rename <old> <new>

# Change URL
git remote set-url <name> <new-url>

# Show remote info
git remote show origin
```

### Fetch & Pull
```bash
# Fetch dari remote (no merge)
git fetch origin

# Fetch dari semua remotes
git fetch --all

# Pull (fetch + merge)
git pull origin main

# Pull dengan rebase
git pull --rebase origin main
```

## 🏷️ Tags

```bash
# Create tag
git tag v1.0.0

# Create annotated tag
git tag -a v1.0.0 -m "Version 1.0.0"

# List tags
git tag

# Push tag
git push origin v1.0.0

# Push all tags
git push origin --tags

# Delete tag
git tag -d v1.0.0
git push origin --delete v1.0.0
```

## 🔧 Config

```bash
# Set name & email
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Set default editor
git config --global core.editor "code --wait"

# Set default branch name
git config --global init.defaultBranch main

# List config
git config --list

# Show specific config
git config user.name
```

## 💡 Useful Aliases

```bash
# Add to ~/.gitconfig or run these commands

# Status shortcut
git config --global alias.st status

# Checkout shortcut
git config --global alias.co checkout

# Branch shortcut
git config --global alias.br branch

# Commit shortcut
git config --global alias.cm commit

# Pretty log
git config --global alias.lg "log --graph --oneline --all"

# Usage:
git st  # instead of git status
git co main  # instead of git checkout main
git lg  # pretty log
```

## 🆘 Emergency Commands

### Undo Everything
```bash
# Reset ke state terakhir di remote
git fetch origin
git reset --hard origin/main

# Atau ke upstream
git fetch upstream
git reset --hard upstream/main
```

### Restore Deleted Branch
```bash
# Find commit hash
git reflog

# Recreate branch
git checkout -b branch-name <commit-hash>
```

### Accidentally Committed to Wrong Branch
```bash
# On wrong branch
git log  # copy commit hash

# Switch to correct branch
git checkout correct-branch
git cherry-pick <commit-hash>

# Go back and remove from wrong branch
git checkout wrong-branch
git reset --hard HEAD~1
```

## 📚 Cheat Sheet

| Command | Description |
|---------|-------------|
| `git status` | Check working tree status |
| `git add .` | Stage all changes |
| `git commit -m "msg"` | Commit with message |
| `git push` | Push to remote |
| `git pull` | Pull from remote |
| `git fetch` | Fetch from remote |
| `git checkout <branch>` | Switch branch |
| `git branch` | List branches |
| `git merge <branch>` | Merge branch |
| `git log` | View commit history |
| `git diff` | View changes |
| `git stash` | Stash changes |
| `git remote -v` | List remotes |

## 🔗 Resources

- [Official Git Docs](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Interactive Git Tutorial](https://learngitbranching.js.org/)
- [Git Cheat Sheet PDF](https://education.github.com/git-cheat-sheet-education.pdf)
