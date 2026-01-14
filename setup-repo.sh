#!/bin/bash

echo "🔧 HeroStack Repository Setup"
echo "================================"
echo ""
echo "Script ini akan membantu Anda setup repository Git untuk project ini."
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Ini bukan git repository. Menjalankan git init..."
    git init
    echo "✅ Git repository initialized"
fi

# Show current remote
echo "📍 Remote URL saat ini:"
git remote -v
echo ""

# Ask if user wants to change remote
read -p "Apakah Anda ingin mengubah remote URL? (y/n): " change_remote

if [ "$change_remote" = "y" ] || [ "$change_remote" = "Y" ]; then
    echo ""
    echo "Pilih opsi:"
    echo "1. Ubah remote URL yang ada (origin)"
    echo "2. Hapus remote dan tambah yang baru"
    echo "3. Tambah remote baru (upstream) tanpa hapus origin"
    echo "4. Hapus semua remote (untuk fresh start)"
    read -p "Pilihan (1-4): " option

    case $option in
        1)
            read -p "Masukkan URL repository baru: " new_url
            git remote set-url origin "$new_url"
            echo "✅ Remote origin diubah ke: $new_url"
            ;;
        2)
            git remote remove origin
            read -p "Masukkan URL repository baru: " new_url
            git remote add origin "$new_url"
            echo "✅ Remote origin baru ditambahkan: $new_url"
            ;;
        3)
            read -p "Masukkan URL repository upstream: " upstream_url
            git remote add upstream "$upstream_url"
            echo "✅ Remote upstream ditambahkan: $upstream_url"
            echo "ℹ️  Origin tetap mengarah ke repository asli"
            ;;
        4)
            for remote in $(git remote); do
                git remote remove "$remote"
                echo "🗑️  Remote '$remote' dihapus"
            done
            echo "✅ Semua remote dihapus"
            read -p "Ingin tambah remote baru? (y/n): " add_new
            if [ "$add_new" = "y" ] || [ "$add_new" = "Y" ]; then
                read -p "Masukkan URL repository: " new_url
                git remote add origin "$new_url"
                echo "✅ Remote origin ditambahkan: $new_url"
            fi
            ;;
        *)
            echo "❌ Pilihan tidak valid"
            exit 1
            ;;
    esac
fi

echo ""
echo "📍 Remote URL sekarang:"
git remote -v

echo ""
echo "✅ Setup selesai!"
echo ""
echo "📝 Langkah selanjutnya:"
echo "   1. Edit .env (copy dari .env.example)"
echo "   2. Setup database"
echo "   3. Run: bun install"
echo "   4. Run: bun run dev"
echo ""
echo "📚 Dokumentasi lengkap ada di README.md"
echo ""
