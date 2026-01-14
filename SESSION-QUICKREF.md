# Session Management - Quick Reference

## ⚡ Quick Setup

```bash
# .env
SESSION_TIMEOUT_HOURS="24"
```

## 🔑 Default Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Session Timeout | 24 hours | Auto-logout after this time |
| Session Refresh | 5 minutes | Auto-refresh interval |
| Warning Time | 5 minutes | Warning before session expires |
| Check Interval | 1 minute | Client-side check frequency |

## 📊 Common Configurations

### Development
```bash
SESSION_TIMEOUT_HOURS="24"  # atau "48" untuk 2 hari
```

### Production (Internal)
```bash
SESSION_TIMEOUT_HOURS="8"   # Working hours (8 jam)
# atau
SESSION_TIMEOUT_HOURS="12"  # Half day
```

### Production (Public)
```bash
SESSION_TIMEOUT_HOURS="1"   # 1 jam (lebih aman)
# atau
SESSION_TIMEOUT_HOURS="2"   # 2 jam
```

### Extended
```bash
SESSION_TIMEOUT_HOURS="168" # 1 minggu (7 hari)
# atau
SESSION_TIMEOUT_HOURS="720" # 30 hari
```

## 🔄 How It Works

1. **Login** → Session dimulai dengan expiry time
2. **Active Use** → Session di-refresh setiap 5 menit
3. **5 Minutes Before** → Warning notification muncul
4. **Expired** → Auto-logout & redirect ke login
5. **Multi-Tab** → Logout di satu tab = logout di semua tab

## 🛠️ Files Modified

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | Session config & JWT setup |
| `src/components/providers/session-provider.tsx` | Session refresh logic |
| `src/components/providers/session-monitor.tsx` | Auto-logout monitoring |
| `src/app/layout.tsx` | Wrap app with SessionProvider |
| `.env.example` | Environment variable template |

## 🔧 Customization

### Change Session Timeout
```bash
# .env
SESSION_TIMEOUT_HOURS="12"
```

### Change Refresh Interval
```typescript
// src/components/providers/session-provider.tsx
<NextAuthSessionProvider
  refetchInterval={10 * 60} // 10 minutes (dalam detik)
>
```

### Change Warning Time
```typescript
// src/components/providers/session-monitor.tsx
const warningMinutes = 10 * 60 * 1000; // 10 minutes (dalam ms)
```

### Change Check Interval
```typescript
// src/components/providers/session-monitor.tsx
const interval = setInterval(checkSession, 30 * 1000); // 30 seconds
```

## 💡 Tips

- ✅ Session di-refresh otomatis jika user masih aktif
- ✅ Tidak perlu login ulang jika masih dalam timeout period
- ✅ Warning muncul 5 menit sebelum logout otomatis
- ✅ Multi-tab logout synchronized
- ⚠️ Session tidak di-refresh jika user inactive > refresh interval
- ⚠️ Ubah timeout requires restart aplikasi

## 🐛 Troubleshooting

**Session tidak auto-logout:**
```bash
# Check .env
SESSION_TIMEOUT_HOURS="24"

# Restart app
pm2 restart herostack
# atau
bun run dev
```

**Session expire terlalu cepat:**
```bash
# Tingkatkan timeout
SESSION_TIMEOUT_HOURS="48"

# Restart app
pm2 restart herostack
```

**Warning tidak muncul:**
- Check browser console untuk errors
- Pastikan Toaster component ada di layout
- Pastikan SessionProvider wrap semua children

## 📚 More Info

Lihat [SESSION.md](./SESSION.md) untuk dokumentasi lengkap.
