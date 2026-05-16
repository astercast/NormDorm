// ── NormDorm Leaderboard ───────────────────────────────────────────────────
//
// Calls the Vercel serverless function at /api/leaderboard (Upstash KV).
// Falls back to localStorage when the API is unavailable (dev / offline).
//
// Env vars for the API function (set in Vercel project settings):
//   KV_REST_API_URL
//   KV_REST_API_TOKEN

const API_ENDPOINT = '/api/leaderboard'
const LS_KEY       = 'nd_leaderboard_v3'

function _getLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function _saveLocal(entries) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(entries)) } catch {}
}

// True when the API endpoint is likely reachable (i.e. we're deployed on Vercel)
export function isGlobalEnabled() {
  return !location.hostname.includes('localhost') && !location.hostname.includes('127.0.0.1')
}

export async function submitScore({ address, coins, normieCount, happiness }) {
  if (!address) return
  const entry = {
    address:     address.toLowerCase(),
    coins:       Math.floor(coins),
    normieCount: normieCount || 0,
    happiness:   Math.floor(happiness || 0),
    updatedAt:   Date.now(),
  }

  // Always write locally first
  const local = _getLocal().filter(e => e.address !== entry.address)
  local.push(entry)
  local.sort((a, b) => b.coins - a.coins)
  _saveLocal(local.slice(0, 200))

  // Submit to global API (fire-and-forget)
  try {
    await fetch(API_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(entry),
      signal:  AbortSignal.timeout(5000),
    })
  } catch { /* silent — local save already succeeded */ }
}

export async function fetchLeaderboard() {
  // Try global API first
  if (isGlobalEnabled()) {
    try {
      const r = await fetch(API_ENDPOINT, { signal: AbortSignal.timeout(6000) })
      if (r.ok) {
        const data = await r.json()
        if (data.ok && Array.isArray(data.entries)) return data.entries
      }
    } catch {}
  }
  // Fall back to local scores
  return _getLocal()
}

export function fmtCoins(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}
