// NormDorm global leaderboard
// Mirrors the Caster101 / caster-valley-leaderboard.js pattern exactly.
//
// Upstash Redis KV via REST API.
// Single key  nd:leaderboard = JSON object keyed by Ethereum address
// Entry shape: { address, coins, normieCount, happiness, updatedAt }
// Coins only ever increase (server-side guard, prevents spoofing regressions).
//
// Env vars needed (add in Vercel project settings):
//   KV_REST_API_URL   — e.g. https://xxx.upstash.io
//   KV_REST_API_TOKEN — Upstash REST token

const KV_URL   = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN
const LB_KEY   = 'nd:leaderboard'

async function kvCmd(...args) {
  if (!KV_URL || !KV_TOKEN) throw new Error('KV not configured')
  const resp = await fetch(KV_URL.replace(/\/$/, ''), {
    method:  'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(args),
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`KV ${resp.status}: ${text}`)
  }
  const data = await resp.json()
  if (data.error) throw new Error(data.error)
  return data.result
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const json = (status, body) => res.status(status).json(body)

  try {
    // ── GET — return sorted top-50 ──────────────────────────────────────────
    if (req.method === 'GET') {
      let lb = {}
      try {
        const raw = await kvCmd('GET', LB_KEY)
        lb = raw ? JSON.parse(raw) : {}
      } catch (_) {}

      const entries = Object.values(lb)
        .filter(e => e.address && typeof e.coins === 'number')
        .sort((a, b) => b.coins - a.coins)
        .slice(0, 50)

      return json(200, { ok: true, entries })
    }

    // ── POST — upsert one entry ─────────────────────────────────────────────
    if (req.method === 'POST') {
      const { address, coins, normieCount, happiness } = req.body || {}
      if (!address || typeof coins !== 'number') {
        return json(400, { ok: false, error: 'Missing address or coins' })
      }

      const addr = String(address).toLowerCase().trim()
      if (!/^0x[0-9a-f]{40}$/.test(addr)) {
        return json(400, { ok: false, error: 'Invalid Ethereum address' })
      }

      const parsedCoins = Math.max(0, Math.floor(Number(coins)))
      if (!Number.isFinite(parsedCoins)) {
        return json(400, { ok: false, error: 'Invalid coins value' })
      }

      let lb = {}
      try {
        const raw = await kvCmd('GET', LB_KEY)
        lb = raw ? JSON.parse(raw) : {}
      } catch (_) {}

      const existing = lb[addr]
      lb[addr] = {
        address:     addr,
        coins:       Math.max(parsedCoins, existing?.coins || 0),  // never decrease
        normieCount: Math.max(1, Math.min(parseInt(normieCount) || 1, 10000)),
        happiness:   Math.max(0, Math.min(Math.floor(Number(happiness) || 0), 100)),
        updatedAt:   Date.now(),
      }

      await kvCmd('SET', LB_KEY, JSON.stringify(lb))
      return json(200, { ok: true })
    }

    return json(405, { ok: false, error: 'Method not allowed' })
  } catch (err) {
    return json(500, { ok: false, error: err.message || 'Server error' })
  }
}
