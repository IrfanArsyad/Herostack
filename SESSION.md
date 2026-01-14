# Session Management Guide

HeroStack menggunakan sistem session management yang aman dengan fitur auto-logout otomatis ketika session berakhir.

## 🔒 Fitur Session Management

### 1. Auto-Logout Otomatis
Ketika session berakhir, user akan otomatis di-logout dan diarahkan ke halaman login.

### 2. Session Expiry Warning
5 menit sebelum session berakhir, user akan mendapat notifikasi untuk menyimpan pekerjaan mereka.

### 3. Session Monitoring
Session di-monitor secara real-time di client side:
- Check setiap 1 menit
- Auto-refresh session setiap 5 menit (jika masih aktif)
- Refetch session ketika window focused

### 4. Multi-Tab Logout
Ketika logout di satu tab, semua tab lainnya akan otomatis logout juga.

## ⚙️ Konfigurasi

### Session Timeout

Default session timeout adalah **24 jam**. Anda dapat mengubahnya dengan menambahkan environment variable:

```bash
# .env
SESSION_TIMEOUT_HOURS="24"
```

**Contoh konfigurasi:**
- `SESSION_TIMEOUT_HOURS="1"` - 1 jam
- `SESSION_TIMEOUT_HOURS="8"` - 8 jam (working hours)
- `SESSION_TIMEOUT_HOURS="24"` - 24 jam (default)
- `SESSION_TIMEOUT_HOURS="168"` - 1 minggu
- `SESSION_TIMEOUT_HOURS="720"` - 30 hari

### Session Refresh Interval

Session otomatis di-refresh setiap **5 menit** jika user masih aktif. Anda dapat mengubahnya di `src/components/providers/session-provider.tsx`:

```typescript
<NextAuthSessionProvider
  refetchInterval={5 * 60} // 5 minutes (dalam detik)
  refetchOnWindowFocus={true}
>
```

### Session Warning Time

Warning muncul **5 menit** sebelum session berakhir. Anda dapat mengubahnya di `src/components/providers/session-monitor.tsx`:

```typescript
const fiveMinutes = 5 * 60 * 1000; // 5 minutes (dalam milliseconds)
if (timeRemaining <= fiveMinutes && !hasShownWarning.current) {
  // Show warning
}
```

## 📋 Cara Kerja

### 1. JWT Token
Session menggunakan JWT (JSON Web Token) dengan expiration time:

```typescript
// src/lib/auth.ts
session: {
  strategy: "jwt",
  maxAge: SESSION_MAX_AGE, // Dari SESSION_TIMEOUT_HOURS
},
jwt: {
  maxAge: SESSION_MAX_AGE,
},
```

### 2. Session Callbacks
Token JWT menyimpan expiration time:

```typescript
async jwt({ token, user }) {
  if (!token.exp) {
    const now = Math.floor(Date.now() / 1000);
    token.exp = now + SESSION_MAX_AGE;
  }
  return token;
}
```

### 3. Client-Side Monitoring
`SessionMonitor` component memonitor session:

```typescript
useEffect(() => {
  const checkSession = () => {
    const expiresAt = new Date(session.expires).getTime();
    const now = Date.now();
    const timeRemaining = expiresAt - now;

    // Auto-logout jika expired
    if (timeRemaining <= 0) {
      window.location.href = "/login?reason=expired";
    }

    // Warning 5 menit sebelum expired
    if (timeRemaining <= fiveMinutes) {
      toast.warning("Sesi Anda akan segera berakhir");
    }
  };

  // Check setiap 1 menit
  const interval = setInterval(checkSession, 60 * 1000);
}, [session]);
```

### 4. Auto-Refresh
SessionProvider otomatis refresh session:

```typescript
<SessionProvider
  refetchInterval={5 * 60} // Refresh every 5 minutes
  refetchOnWindowFocus={true} // Refresh when window focused
>
```

## 🔧 Troubleshooting

### Session tidak auto-logout

1. **Check environment variable:**
   ```bash
   # .env
   SESSION_TIMEOUT_HOURS="24"
   ```

2. **Restart aplikasi:**
   ```bash
   npm run dev
   # atau
   pm2 restart herostack
   ```

3. **Clear browser cache & cookies**

### Session expire terlalu cepat

1. **Tingkatkan timeout:**
   ```bash
   # .env
   SESSION_TIMEOUT_HOURS="48"  # 2 hari
   ```

2. **Check refetch interval:**
   - Default: refresh setiap 5 menit
   - Jika user inactive > 5 menit, session tidak di-refresh

### Warning tidak muncul

Check `SessionMonitor` component sudah terimport di layout:

```typescript
// src/app/layout.tsx
import { SessionProvider } from "@/components/providers/session-provider";

<SessionProvider>
  {children}
</SessionProvider>
```

## 🔐 Security Best Practices

### 1. Session Timeout
- **Development**: 24 jam untuk kemudahan development
- **Production (internal)**: 8-12 jam (working hours)
- **Production (public)**: 1-2 jam untuk keamanan lebih baik

### 2. Sensitive Operations
Untuk operasi sensitif (delete data, change password), selalu minta re-authentication:

```typescript
// Example: Ask for password before delete
const confirmDelete = async () => {
  const password = await prompt("Enter password to confirm:");
  // Verify password
  // Then delete
};
```

### 3. HTTPS Only
Di production, **ALWAYS** gunakan HTTPS untuk mencegah session hijacking:

```bash
# .env.production
AUTH_URL="https://yourdomain.com"
```

### 4. Secure Cookies
NextAuth secara default menggunakan secure cookies di production:
- `httpOnly`: true
- `sameSite`: "lax"
- `secure`: true (di production)

## 📊 Monitoring

### Check Session Status

```typescript
import { useSession } from "next-auth/react";

const { data: session, status } = useSession();

console.log("Status:", status); // "loading" | "authenticated" | "unauthenticated"
console.log("Expires:", session?.expires); // ISO timestamp
```

### Calculate Time Remaining

```typescript
const expiresAt = new Date(session.expires).getTime();
const now = Date.now();
const timeRemaining = expiresAt - now;
const minutesRemaining = Math.floor(timeRemaining / (60 * 1000));

console.log(`Session expires in ${minutesRemaining} minutes`);
```

## 💡 Tips

1. **Development**: Set `SESSION_TIMEOUT_HOURS="24"` agar tidak perlu login berulang
2. **Production**: Set `SESSION_TIMEOUT_HOURS="8"` atau `"12"` untuk keamanan lebih baik
3. **Public access**: Set `SESSION_TIMEOUT_HOURS="1"` atau `"2"` untuk aplikasi yang accessible publicly
4. **Remember**: Session di-refresh setiap 5 menit, jadi user yang aktif tidak akan auto-logout

## 🔄 Manual Logout

User dapat logout manual dengan:

1. Click logout button di UI
2. Session akan di-clear
3. Redirect ke login page
4. All tabs akan logout (via localStorage event)

## 📚 Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [JWT.io - Decode JWT tokens](https://jwt.io/)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
