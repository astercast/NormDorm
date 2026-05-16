// Full-body normie sprites via fullynormies.vercel.app
const FULLNORM = 'https://fullynormies.vercel.app/api/v1'

const metaCache  = new Map()   // id → meta object
const frameCache = new Map()   // `${id}:${pose}:${frame}` → HTMLCanvasElement | null

// Default dimensions if meta endpoint not available
const DEFAULT_META = {
  pixelWidth:      40,
  pixelHeight:     80,
  anchor:          { x: 20, y: 76 },
  posesAvailable:  ['stand', 'walk', 'sit', 'sleep'],
  walkFrames:      4,
}

export const SPRITE_W = 40
export const SPRITE_H = 80

// ── Preload: fetch meta, then eagerly load stand / sit / sleep ──────────────
export async function preloadNormieImage(id) {
  if (metaCache.has(id)) return

  let meta = { ...DEFAULT_META }
  try {
    const r = await fetch(`${FULLNORM}/normies/${id}/full-meta.json`)
    if (r.ok) meta = { ...DEFAULT_META, ...await r.json() }
  } catch { /* use defaults */ }
  metaCache.set(id, meta)

  const eager = ['stand', 'sit', 'sleep'].filter(p =>
    !meta.posesAvailable || meta.posesAvailable.includes(p)
  )
  await Promise.allSettled(eager.map(p => _loadFrame(id, p, 0)))
}

// ── Per-frame loader ────────────────────────────────────────────────────────
function _loadFrame(id, pose, frame) {
  const key = `${id}:${pose}:${frame}`
  if (frameCache.has(key)) return Promise.resolve(frameCache.get(key))

  return new Promise(resolve => {
    const meta = metaCache.get(id) || DEFAULT_META
    const url  = pose === 'walk'
      ? `${FULLNORM}/normies/${id}/full.png?pose=walk&frame=${frame}`
      : `${FULLNORM}/normies/${id}/full.png?pose=${pose}`

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const cvs = document.createElement('canvas')
      cvs.width  = meta.pixelWidth
      cvs.height = meta.pixelHeight
      const c = cvs.getContext('2d')
      c.imageSmoothingEnabled = false
      c.drawImage(img, 0, 0, meta.pixelWidth, meta.pixelHeight)
      frameCache.set(key, cvs)
      resolve(cvs)
    }
    img.onerror = () => { frameCache.set(key, null); resolve(null) }
    img.src = url
  })
}

// Kick off all walk frames without awaiting (called as normie starts moving)
function _kickWalkFrames(id) {
  const n = (metaCache.get(id) || DEFAULT_META).walkFrames || 4
  for (let f = 0; f < n; f++) _loadFrame(id, 'walk', f)
}

// ── Draw ────────────────────────────────────────────────────────────────────
// ctx is already scaled by NORMIE_SCALE by the caller (_redrawSprite in scene.js).
// We draw at native SPRITE_W × SPRITE_H coords — scaling is the caller's concern.
// Night overlay and zzz are handled by the caller.
export function drawNormieSprite(ctx, normieId, pose, walkPhase, effects = {}) {
  const meta = metaCache.get(normieId) || DEFAULT_META
  const W    = meta.pixelWidth
  const H    = meta.pixelHeight
  const dir  = effects.direction || 'right'

  let cvs
  if (pose === 'walk') {
    const f = Math.floor(walkPhase * 4) % 4
    _kickWalkFrames(normieId)
    cvs = frameCache.get(`${normieId}:walk:${f}`)
  } else if (pose === 'sit') {
    cvs = frameCache.get(`${normieId}:sit:0`)
  } else if (pose === 'sleep') {
    cvs = frameCache.get(`${normieId}:sleep:0`)
  }
  cvs = cvs ?? frameCache.get(`${normieId}:stand:0`)

  ctx.save()
  if (dir === 'left') { ctx.scale(-1, 1); ctx.translate(-W, 0) }
  if (dir === 'up')     ctx.globalAlpha = 0.72

  if (cvs) {
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(cvs, 0, 0, W, H)
  } else {
    _fallback(ctx, W, H)
  }
  ctx.restore()
}

// Also export a zzz helper so scene.js can call it for sleeping normies
export function drawZzz(ctx, zzzPhase, W) {
  ctx.font = 'bold 6px monospace'
  ctx.fillStyle = `rgba(100,100,150,${Math.abs(Math.sin(zzzPhase * 0.8) * 0.85).toFixed(2)})`
  ctx.fillText('z', W - 10, 12)
  ctx.font = 'bold 8px monospace'
  ctx.fillStyle = `rgba(100,100,150,${Math.abs(Math.sin(zzzPhase * 0.8 + 2) * 0.65).toFixed(2)})`
  ctx.fillText('Z', W - 7, 4)
}

function _fallback(ctx, W, H) {
  ctx.fillStyle = '#1c1c1c'
  ctx.fillRect(W * .30, H * .02, W * .40, H * .20)  // head
  ctx.fillRect(W * .18, H * .24, W * .64, H * .28)  // body
  ctx.fillRect(W * .04, H * .24, W * .14, H * .22)  // arm L
  ctx.fillRect(W * .82, H * .24, W * .14, H * .22)  // arm R
  ctx.fillRect(W * .20, H * .54, W * .24, H * .42)  // leg L
  ctx.fillRect(W * .56, H * .54, W * .24, H * .42)  // leg R
}
