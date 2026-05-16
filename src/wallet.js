import { NORMIES_CONTRACT, API_BASE } from './constants.js'

const PUBLIC_RPC = 'https://eth.llamarpc.com'
const NORMIES_FROM_BLOCK = '0xCE4D00'   // contract deployment block

async function _rpc(method, params, timeoutMs = 15000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(PUBLIC_RPC, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
      signal:  ctrl.signal,
    })
    const json = await res.json()
    if (json.error) throw new Error(json.error.message || 'RPC error')
    return json.result
  } finally {
    clearTimeout(timer)
  }
}

// ── Address lookup — no wallet needed, no cap ──────────────────────────────
// Returns every Normie ID the address owns (no artificial limit).
// Strategy order (mirrors NormiesArchive):
//  1. api.normies.art  /holders/:address  — fastest, always accurate
//  2. eth_getLogs from deployment block   — pure on-chain fallback
export async function lookupNormies(address) {
  const addr = address.toLowerCase()

  // 1. normies.art holders endpoint  →  { address, tokenIds: ["42", "100"] }
  try {
    const r = await fetch(`${API_BASE}/holders/${addr}`,
      { signal: AbortSignal.timeout(10000) })
    if (r.ok) {
      const data = await r.json()
      const ids  = Array.isArray(data?.tokenIds) ? data.tokenIds
                 : Array.isArray(data?.ids)       ? data.ids
                 : Array.isArray(data)            ? data
                 : null
      if (ids?.length) {
        return ids.map(Number).filter(n => Number.isFinite(n) && n >= 0 && n <= 9999)
                  .sort((a, b) => a - b)   // no slice — return all of them
      }
    }
  } catch { /* fall through */ }

  // 2. eth_getLogs fallback
  const paddedAddr = '0x' + addr.slice(2).padStart(64, '0')
  const TRANSFER   = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

  const [toLogs, fromLogs] = await Promise.all([
    _rpc('eth_getLogs', [{ address: NORMIES_CONTRACT, topics: [TRANSFER, null, paddedAddr],  fromBlock: NORMIES_FROM_BLOCK, toBlock: 'latest' }]),
    _rpc('eth_getLogs', [{ address: NORMIES_CONTRACT, topics: [TRANSFER, paddedAddr, null],  fromBlock: NORMIES_FROM_BLOCK, toBlock: 'latest' }]),
  ])

  const owned = new Set()
  for (const log of toLogs)   owned.add(BigInt(log.topics[3]).toString())
  for (const log of fromLogs) owned.delete(BigInt(log.topics[3]).toString())

  return [...owned].map(Number).sort((a, b) => a - b)  // no slice — return all
}

// ── Normie metadata from normies.art API ───────────────────────────────────
export async function fetchNormieData(id) {
  const [trRes, ciRes] = await Promise.allSettled([
    fetch(`${API_BASE}/normie/${id}/traits`).then(r => r.ok ? r.json() : null),
    fetch(`${API_BASE}/normie/${id}/canvas/info`).then(r => r.ok ? r.json() : null),
  ])
  const traits = trRes.value?.attributes || []
  const canvas = ciRes.value || {}
  return {
    id,
    name:         `Normie #${id}`,
    imageUrl:     `${API_BASE}/normie/${id}/image.png`,
    traits,
    type:         traits.find(t => t.trait_type === 'Type')?.value       || 'Human',
    age:          traits.find(t => t.trait_type === 'Age')?.value        || 'Young',
    expression:   traits.find(t => t.trait_type === 'Expression')?.value || '',
    level:        canvas.level        || 1,
    actionPoints: canvas.actionPoints || 0,
    customized:   canvas.customized   || false,
  }
}

export async function fetchNormiesData(ids, onProgress) {
  const results = []
  // Fetch in batches of 8 for speed; all IDs, no cap
  for (let i = 0; i < ids.length; i += 8) {
    const batch   = ids.slice(i, i + 8)
    const settled = await Promise.allSettled(batch.map(id => fetchNormieData(id)))
    for (const s of settled) if (s.status === 'fulfilled' && s.value) results.push(s.value)
    onProgress?.(results.length, ids.length)
  }
  return results
}
