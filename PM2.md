# PM2 Production Setup Guide

HeroStack menggunakan PM2 untuk menjalankan aplikasi di production dengan fitur auto-restart, monitoring, dan zero-downtime deployment.

## 📋 File Yang Dibuat

- `ecosystem.config.js` - Konfigurasi PM2
- `pm2-setup.sh` - Script setup awal
- `pm2-deploy.sh` - Script deployment
- `package.json` - Ditambahkan script PM2

## 🚀 Setup Awal (Pertama Kali)

```bash
# Jalankan script setup
./pm2-setup.sh
```

Script ini akan otomatis:
1. Membuat direktori logs
2. Install PM2 global (jika belum ada)
3. Install dependencies
4. Build aplikasi
5. Start dengan PM2
6. Save konfigurasi PM2
7. Setup auto-start saat server reboot

## 🔄 Deployment Update

Ketika ada update code baru:

```bash
# Jalankan script deployment
./pm2-deploy.sh
```

Script ini akan:
1. Pull latest code dari git
2. Install/update dependencies
3. Build ulang aplikasi
4. Reload PM2 (zero-downtime)

## 📝 NPM Scripts

```bash
# Start/Stop/Restart
npm run pm2:start      # Start aplikasi
npm run pm2:stop       # Stop aplikasi
npm run pm2:restart    # Restart aplikasi
npm run pm2:reload     # Reload (zero-downtime)
npm run pm2:delete     # Hapus dari PM2

# Monitoring
npm run pm2:logs       # Lihat logs
npm run pm2:monit      # Monitor real-time
```

## 🛠️ PM2 Commands

```bash
# Status & List
pm2 list               # List semua process
pm2 status             # Status aplikasi
pm2 show herostack     # Detail aplikasi

# Logs
pm2 logs               # Logs semua aplikasi
pm2 logs herostack     # Logs HeroStack
pm2 logs herostack --lines 100  # 100 baris terakhir

# Monitoring
pm2 monit              # Dashboard monitoring
pm2 plus               # PM2 Plus (monitoring cloud)

# Management
pm2 restart herostack  # Restart
pm2 reload herostack   # Reload (zero-downtime)
pm2 stop herostack     # Stop
pm2 delete herostack   # Delete process

# Save & Startup
pm2 save               # Save process list
pm2 startup            # Setup auto-start
pm2 unstartup          # Remove auto-start
```

## ⚙️ Konfigurasi (ecosystem.config.js)

```javascript
{
  name: 'herostack',           // Nama aplikasi
  instances: 1,                // Jumlah instance (cluster mode)
  exec_mode: 'cluster',        // Mode eksekusi
  max_memory_restart: '1G',    // Auto-restart jika memory > 1GB
  autorestart: true,           // Auto-restart jika crash
  max_restarts: 10,            // Max restart dalam 1 menit
  min_uptime: '10s',           // Min uptime sebelum dianggap stabil
}
```

## 📊 Log Files

Logs disimpan di direktori `./logs/`:
- `pm2-error.log` - Error logs
- `pm2-out.log` - Output logs

```bash
# Lihat error logs
tail -f logs/pm2-error.log

# Lihat output logs
tail -f logs/pm2-out.log
```

## 🔧 Troubleshooting

### Aplikasi tidak start
```bash
# Check logs
pm2 logs herostack

# Check status
pm2 status

# Restart
pm2 restart herostack
```

### Memory leak
```bash
# Check memory usage
pm2 monit

# Jika memory tinggi, reload
pm2 reload herostack
```

### Port sudah digunakan
```bash
# Check process di port 3056
lsof -i :3056

# Kill process
kill -9 <PID>

# Restart PM2
pm2 restart herostack
```

## 🔐 Auto-Start pada System Reboot

Setelah setup, PM2 sudah dikonfigurasi untuk auto-start:

```bash
# Setup startup script (sudah dilakukan saat pm2-setup.sh)
pm2 startup

# Jika ingin disable auto-start
pm2 unstartup systemd

# Save konfigurasi
pm2 save
```

## 📦 Update Konfigurasi

Jika mengubah `ecosystem.config.js`:

```bash
# Stop process lama
pm2 delete herostack

# Start dengan konfigurasi baru
pm2 start ecosystem.config.js

# Save
pm2 save
```

## 🌐 Environment Variables

Environment variables diambil dari file `.env`:
- `NODE_ENV=production`
- `PORT=3056`
- `DATABASE_URL`
- `AUTH_SECRET`
- dll.

## 💡 Tips

1. **Zero-Downtime Deployment**: Gunakan `pm2 reload` bukan `pm2 restart`
2. **Monitoring**: Gunakan `pm2 monit` untuk monitor real-time
3. **Logs**: Gunakan `pm2 logs --lines 200` untuk lihat logs lebih banyak
4. **Cluster Mode**: Untuk performa lebih baik, tingkatkan `instances` di ecosystem.config.js
5. **Memory Management**: PM2 akan auto-restart jika memory usage > 1GB

## 📚 Resources

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
- [PM2 Plus Monitoring](https://pm2.io/)
