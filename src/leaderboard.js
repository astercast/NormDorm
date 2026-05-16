// ── Leaderboard service ────────────────────────────────────────────────────
//
// Dual-mode: always writes to localStorage, optionally syncs to Supabase.
//
// To enable global leaderboard, add to .env:
//   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
//   VITE_SUPABASE_ANON=your-anon-key
//
// Supabase table SQL:
//   CREATE TABLE leaderboard (
//     address TEXT PRIMARY KEY,
//     coins BIGINT DEFAULT 0,
//     normie_count INT DEFAULT 0,
//     happiness INT DEFAULT 0,
//     updated_at TIMESTAMPTZ DEFAULT NOW()
//   );
//   ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "public_read"   ON leaderboard FOR SELECT USING (true);
//   CREATE POLICY "public_insert" ON leaderboard FOR INSERT WITH CHECK (true);
//   CREATE POLICY "public_update" ON leaderboard FOR UPDATE USING (true);

const SB_URL  = import.meta.env?.VITE_SUPABASE_URL  || ''
const SB_ANON = import.meta.env?.VITE_SUPABASE_ANON || ''
const LS_KEY  = 'nd_leaderboard_v2'

function _getLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function _saveLocal(entries) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(entries)) } catch {}
}

export function isGlobalEnabled() {
  return !!(SB_URL && SB_ANON)
}

export async function submitScore({ address, coins, normieCount, happiness }) {
  if (!address) return
  const addr  = address.toLowerCase()
  const entry = {
    address:      addr,
    coins:        Math.floor(coins),
    normie_count: normieCount,
    happiness:    Math.floor(happiness),
    updated_at:   new Date().toISOString(),
  }

  // Always save / update locally
  const local = _getLocal().filter(e => e.address !== addr)
  local.push(entry)
  local.sort((a, b) => b.coins - a.coins)
  _saveLocal(local.slice(0, 200))

  // Submit to Supabase if configured
  if (SB_URL && SB_ANON) {
    try {
      await fetch(`${SB_URL}/rest/v1/leaderboard`, {
        method:  'POST',
        headers: {
          'apikey':        SB_ANON,
          'Authorization': `Bearer ${SB_ANON}`,
          'Content-Type':  'application/json',
          'Prefer':        'resolution=merge-duplicates',
        },
        body:   JSON.stringify(entry),
        signal: AbortSignal.timeout(5000),
      })
    } catch { /* silent — local save already succeeded */ }
  }
}

export async function fetchLeaderboard() {
  if (SB_URL && SB_ANON) {
    try {
      const r = await fetch(
        `${SB_URL}/rest/v1/leaderboard?select=*&order=coins.desc&limit=100`,
        {
          headers: {
            'apikey':        SB_ANON,
            'Authorization': `Bearer ${SB_ANON}`,
          },
          signal: AbortSignal.timeout(5000),
        }
      )
      if (r.ok) return await r.json()
    } catch {}
  }
  return _getLocal()
}

export function fmtCoins(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}
