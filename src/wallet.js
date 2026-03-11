import { NORMIES_CONTRACT, API_BASE } from './constants.js'

/**
 * EIP-6963 multi-wallet support.
 * READ-ONLY: only eth_requestAccounts and eth_getLogs are used.
 * No signing, no transactions, no gas.
 */

// ── EIP-6963 wallet discovery ─────────────────────────────────────────────────
const discoveredWallets = new Map()

export function startWalletDiscovery() {
  window.addEventListener('eip6963:announceProvider', (e) => {
    const { info, provider } = e.detail
    discoveredWallets.set(info.uuid, { info, provider })
  })
  window.dispatchEvent(new Event('eip6963:requestProvider'))

  // Legacy fallback
  if (window.ethereum) {
    const uuid = 'legacy'
    if (!discoveredWallets.has(uuid)) {
      discoveredWallets.set(uuid, {
        info: { uuid, name: window.ethereum.isMetaMask ? 'MetaMask' : 'Browser Wallet', icon: null },
        provider: window.ethereum,
      })
    }
  }
}

export function getDiscoveredWallets() {
  return [...discoveredWallets.values()]
}

// ── Connect ───────────────────────────────────────────────────────────────────
export async function connectWithProvider(provider) {
  try {
    const accounts = await provider.request({ method: 'eth_requestAccounts' })
    const address  = accounts[0]
    if (!address) throw new Error('No account returned')
    return { address, provider }
  } catch(e) {
    if (e.code === 4001) throw new Error('USER_REJECTED')
    throw e
  }
}

// ── Fetch owned Normies via Transfer logs (one RPC call!) ─────────────────────
// Strategy: get all Transfer events TO this address, subtract ones FROM this address.
// This finds current holdings without sequential tokenOfOwnerByIndex calls.
export async function fetchOwnedNormies(address, provider) {
  try {
    const addr = address.toLowerCase()
    const paddedAddr = '0x' + addr.slice(2).padStart(64, '0')

    // Topic[0] = Transfer(address,address,uint256) keccak256 sig
    const TRANSFER_SIG = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

    // Fetch Transfer events TO this address (received)
    const toLogsRaw = await provider.request({
      method: 'eth_getLogs',
      params: [{
        address: NORMIES_CONTRACT,
        topics:  [TRANSFER_SIG, null, paddedAddr],
        fromBlock: '0x0',
        toBlock:   'latest',
      }],
    })

    // Fetch Transfer events FROM this address (sent)
    const fromLogsRaw = await provider.request({
      method: 'eth_getLogs',
      params: [{
        address: NORMIES_CONTRACT,
        topics:  [TRANSFER_SIG, paddedAddr, null],
        fromBlock: '0x0',
        toBlock:   'latest',
      }],
    })

    // Build current holdings: tokens received minus tokens sent
    const owned = new Set()
    for (const log of toLogsRaw)   owned.add(BigInt(log.topics[3]).toString())
    for (const log of fromLogsRaw) owned.delete(BigInt(log.topics[3]).toString())

    const ids = [...owned].map(Number).sort((a, b) => a - b).slice(0, 20)
    return ids

  } catch(e) {
    console.warn('fetchOwnedNormies (logs) failed:', e)
    // Fallback: try balanceOf + tokenOfOwnerByIndex (slow but works on some nodes)
    return _fetchOwnedFallback(address, provider)
  }
}

// Fallback: sequential tokenOfOwnerByIndex (rate-limited but universal)
async function _fetchOwnedFallback(address, provider) {
  try {
    const balHex = await provider.request({
      method: 'eth_call',
      params: [{ to: NORMIES_CONTRACT, data: `0x70a08231${'0'.repeat(24)}${address.slice(2).toLowerCase()}` }, 'latest'],
    })
    const balance = Math.min(parseInt(balHex, 16) || 0, 20)
    if (!balance) return []

    const ids = []
    for (let i = 0; i < balance; i++) {
      try {
        const addrPad = address.slice(2).toLowerCase().padStart(64, '0')
        const idxPad  = i.toString(16).padStart(64, '0')
        const res = await provider.request({
          method: 'eth_call',
          params: [{ to: NORMIES_CONTRACT, data: `0x2f745c59${addrPad}${idxPad}` }, 'latest'],
        })
        ids.push(parseInt(res, 16))
      } catch { break }
    }
    return ids
  } catch(e) {
    console.warn('fetchOwnedNormies fallback also failed:', e)
    return []
  }
}

// ── Normie metadata from API ──────────────────────────────────────────────────
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
  // Fetch 5 at a time (faster than 4, still polite to API)
  for (let i = 0; i < ids.length; i += 5) {
    const batch   = ids.slice(i, i + 5)
    const settled = await Promise.allSettled(batch.map(id => fetchNormieData(id)))
    for (const s of settled) if (s.status === 'fulfilled' && s.value) results.push(s.value)
    onProgress?.(results.length, ids.length)
  }
  return results
}
