# Burnote

A zero-knowledge secret sharing web app. All encryption happens in the browser using the Web Crypto API — the server never sees the plaintext or the decryption key.

## Architecture

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS (dark theme, amber/orange accent)
- **Storage**: `@replit/database` (Replit KV store)
- **Crypto**: Web Crypto API (AES-GCM 256-bit), browser-only
- **IDs**: `nanoid` for short random secret IDs

## Security Model

1. Encryption and decryption happen exclusively in the browser via `lib/crypto.ts`.
2. The server stores only: `{ ciphertext, iv, burnOnRead, createdAt, expiresAt }`.
3. The decryption key lives **only** in the URL `#fragment` — never sent in HTTP requests.
4. Burn-on-read: secrets are deleted from KV on first retrieval.
5. TTL: expiry enforced at read time by comparing `expiresAt` against `Date.now()`.

## File Structure

```
app/
  layout.tsx               # Root layout, Inter font, dark base
  page.tsx                 # Home: secret form
  globals.css              # Tailwind base + fade-in animation
  api/
    secret/route.ts        # POST: store encrypted blob, return { id }
    secret/[id]/route.ts   # GET: retrieve blob (delete if burnOnRead)
  s/[id]/page.tsx          # Secret viewer page
lib/
  crypto.ts                # generateKey, encryptSecret, decryptSecret, exportKeyToFragment, importKeyFromFragment
  db.ts                    # Replit KV adapter: storeSecret, getSecret, deleteSecret
components/
  SecretForm.tsx           # Client component: textarea, expiry, burn toggle, encrypt & generate link
  SecretViewer.tsx         # Client component: auto-decrypt on mount from #fragment
```

## Running

```
npm install
npm run dev   # runs on port 5000
```

## Key Dependencies

- `next@14.2.29`
- `@replit/database@^2`
- `nanoid@^5`
- `tailwindcss@^3`
