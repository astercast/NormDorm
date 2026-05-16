// Full-body normie sprites — API overlay + procedural fallback
const FULLNORM = 'https://fullnormies.vercel.app/api/v1'

const metaCache  = new Map()   // id → meta object
const frameCache = new Map()   // `${id}:${pose}:${frame}` → HTMLImageElement | null

const DEFAULT_META = {
  pixelWidth:      40,
  pixelHeight:     80,
  anchor:          { x: 20, y: 74 },
  posesAvailable:  ['stand', 'walk', 'sit', 'sleep'],
  walkFrames:      4,
}

export const SPRITE_W = 40
export const SPRITE_H = 80

// ── Preload: fetch meta + eager frames ─────────────────────────────────────
export async function preloadNormieImage(id) {
  if (metaCache.has(id)) return

  let meta = { ...DEFAULT_META }
  try {
    const r = await fetch(`${FULLNORM}/normies/${id}/full-meta.json`,
      { signal: AbortSignal.timeout(3000) })
    if (r.ok) meta = { ...DEFAULT_META, ...await r.json() }
  } catch { /* use defaults */ }
  metaCache.set(id, meta)

  const eager = ['stand', 'sit', 'sleep'].filter(p =>
    !meta.posesAvailable || meta.posesAvailable.includes(p)
  )
  await Promise.allSettled(eager.map(p => _loadFrame(id, p, 0)))
}

// ── Per-frame image loader ─────────────────────────────────────────────────
function _loadFrame(id, pose, frame) {
  const key = `${id}:${pose}:${frame}`
  if (frameCache.has(key)) return Promise.resolve(frameCache.get(key))

  return new Promise(resolve => {
    const url = pose === 'walk'
      ? `${FULLNORM}/normies/${id}/full.png?pose=walk&frame=${frame}`
      : `${FULLNORM}/normies/${id}/full.png?pose=${pose}`
    const img = new Image()
    // No crossOrigin — canvas will be tainted but we only write, never read
    img.onload  = () => { frameCache.set(key, img);   resolve(img)  }
    img.onerror = () => { frameCache.set(key, null);  resolve(null) }
    img.src = url
  })
}

function _kickWalkFrames(id) {
  const n = (metaCache.get(id) || DEFAULT_META).walkFrames || 4
  for (let f = 0; f < n; f++) _loadFrame(id, 'walk', f)
}

// ── Draw ───────────────────────────────────────────────────────────────────
// ctx is already scaled by NORMIE_SCALE by the caller.
// We draw at native 40×80 coords; night overlay / zzz handled by caller.
export function drawNormieSprite(ctx, normieId, pose, walkPhase, effects = {}) {
  const meta = metaCache.get(normieId) || DEFAULT_META
  const W    = meta.pixelWidth
  const H    = meta.pixelHeight
  const dir  = effects.direction || 'right'

  let img
  if (pose === 'walk') {
    const f = Math.floor((walkPhase || 0) * 4) % 4
    _kickWalkFrames(normieId)
    img = frameCache.get(`${normieId}:walk:${f}`)
  } else if (pose === 'sit') {
    img = frameCache.get(`${normieId}:sit:0`)
  } else if (pose === 'sleep') {
    img = frameCache.get(`${normieId}:sleep:0`)
  }
  img = img ?? frameCache.get(`${normieId}:stand:0`)

  ctx.save()
  if (dir === 'left') { ctx.scale(-1, 1); ctx.translate(-W, 0) }
  if (dir === 'up')   ctx.globalAlpha = 0.72

  if (img) {
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, 0, 0, W, H)
  } else {
    _proceduralNormie(ctx, normieId, pose, walkPhase || 0)
  }
  ctx.restore()
}

// ── ZZZ helper ─────────────────────────────────────────────────────────────
export function drawZzz(ctx, zzzPhase, W) {
  ctx.font = 'bold 6px monospace'
  ctx.fillStyle = `rgba(100,100,150,${Math.abs(Math.sin(zzzPhase * 0.8) * 0.85).toFixed(2)})`
  ctx.fillText('z', W - 10, 12)
  ctx.font = 'bold 8px monospace'
  ctx.fillStyle = `rgba(100,100,150,${Math.abs(Math.sin(zzzPhase * 0.8 + 2) * 0.65).toFixed(2)})`
  ctx.fillText('Z', W - 7, 4)
}

// ── Procedural normie sprite ───────────────────────────────────────────────
// Draws a unique pixel-art character seeded by normie ID.
// Drawn at native 40×80 px; NORMIE_SCALE is applied by the caller.

function _rng(id, s) {
  const x = Math.sin(id * 47.231 + s * 311.7 + 5.4321) * 43758.5453
  return x - Math.floor(x)
}

function _proceduralNormie(ctx, id, pose, walkPhase) {
  // Palette (pure grayscale, seeded by ID)
  const hairIdx   = Math.floor(_rng(id, 0) * 3)
  const hairShade = ['#0d0d0d', '#2e2e2e', '#5a5a5a'][hairIdx]
  const skinShade = '#c8c6c4'
  const shirtShade = ['#161616','#282828','#3c3c3c','#505050','#646464','#787878'][Math.floor(_rng(id,1)*6)]
  const pantsShade = ['#0e0e0e','#1c1c1c','#2c2c2c','#3e3e3e'][Math.floor(_rng(id,2)*4)]
  const shoeShade  = '#0a0a0a'

  const hairType   = Math.floor(_rng(id, 3) * 5)   // 0-4
  const shirtType  = Math.floor(_rng(id, 4) * 4)   // 0-3
  const hasGlasses = _rng(id, 5) > 0.72
  const smileType  = Math.floor(_rng(id, 6) * 3)   // 0 smile  1 neutral  2 smirk
  const bodyW      = 14 + Math.floor(_rng(id, 7) * 4) // 14–17

  // ── Walk animation offsets
  let bob = 0, llx = 0, lly = 0, rlx = 0, rly = 0, lAs = 0, rAs = 0
  if (pose === 'walk') {
    const p = Math.floor(walkPhase * 4) % 4
    bob  = p % 2 === 1 ? 1 : 0
    llx  = [0,-1,0, 1][p];  lly = [0,-4,0, 4][p]
    rlx  = [0, 1,0,-1][p];  rly = [0, 4,0,-4][p]
    lAs  = [0, 3,0,-3][p]   // left  arm swing (+ = down/back)
    rAs  = [0,-3,0, 3][p]   // right arm swing
  }

  // Layout
  const HX = Math.round((40 - 10) / 2)   // 15 — head left x
  const HY = 4 + bob                      // head top y
  const BX = Math.round((40 - bodyW) / 2) // body left x
  const BY = HY + 15                      // body top y
  const LY = BY + 17                      // legs top y
  const SY = LY + 21                      // shoe top y

  // ══ SLEEPING ══
  if (pose === 'sleep') {
    ctx.fillStyle = pantsShade; ctx.fillRect(2, 50, 28, 7)
    ctx.fillStyle = shirtShade; ctx.fillRect(11, 48, 18, 9)
    ctx.fillStyle = skinShade;  ctx.fillRect(28, 49, 10, 8)
    ctx.fillStyle = hairShade
    ctx.fillRect(28, 49, 10, 3)
    if (hairType <= 1) ctx.fillRect(36, 52, 3, 5)
    else               ctx.fillRect(27, 49, 2, 8)
    ctx.fillStyle = '#0c0c0c'; ctx.fillRect(30, 53, 4, 1)  // closed eye
    ctx.fillStyle = shoeShade;  ctx.fillRect(2, 50, 5, 9)
    return
  }

  // ══ SITTING ══
  if (pose === 'sit') {
    // Hair back
    ctx.fillStyle = hairShade
    if (hairType >= 2) { ctx.fillRect(HX-1, HY, 2, 14); ctx.fillRect(HX+9, HY, 2, 14) }
    // Head
    ctx.fillStyle = skinShade; ctx.fillRect(HX, HY, 10, 12)
    _drawHair(ctx, hairType, HX, HY, hairShade)
    _drawFace(ctx, HX, HY, smileType, hasGlasses, hairShade)
    // Neck
    ctx.fillStyle = skinShade; ctx.fillRect(HX+3, HY+12, 4, 3)
    // Arms
    ctx.fillStyle = shirtShade; ctx.fillRect(BX-5, BY, 5, 10)
    ctx.fillStyle = skinShade;  ctx.fillRect(BX-5, BY+10, 5, 4)
    ctx.fillStyle = shirtShade; ctx.fillRect(BX+bodyW, BY, 5, 10)
    ctx.fillStyle = skinShade;  ctx.fillRect(BX+bodyW, BY+10, 5, 4)
    // Body
    ctx.fillStyle = shirtShade; ctx.fillRect(BX, BY, bodyW, 17)
    _drawShirtDetail(ctx, BX, BY, bodyW, shirtType)
    // Sitting legs
    ctx.fillStyle = pantsShade
    ctx.fillRect(BX+1, LY, 6, 10);       ctx.fillRect(BX+bodyW-7, LY, 6, 10)
    ctx.fillRect(BX-2, LY+9, 10, 6);     ctx.fillRect(BX+bodyW-8, LY+9, 10, 6)
    ctx.fillStyle = shoeShade
    ctx.fillRect(BX-3, LY+13, 11, 3);    ctx.fillRect(BX+bodyW-9, LY+13, 11, 3)
    return
  }

  // ══ STANDING / WALKING ══
  // Hair back (long styles drape behind head)
  ctx.fillStyle = hairShade
  if (hairType >= 2) { ctx.fillRect(HX-1, HY, 2, 20); ctx.fillRect(HX+9, HY, 2, 20) }

  // Head
  ctx.fillStyle = skinShade; ctx.fillRect(HX, HY, 10, 12)
  _drawHair(ctx, hairType, HX, HY, hairShade)
  _drawFace(ctx, HX, HY, smileType, hasGlasses, hairShade)

  // Neck
  ctx.fillStyle = skinShade; ctx.fillRect(HX+3, HY+12, 4, 3)

  // Left arm (animates with lAs)
  ctx.fillStyle = shirtShade; ctx.fillRect(BX-5, BY+lAs, 5, 10)
  ctx.fillStyle = skinShade;  ctx.fillRect(BX-5, BY+10+lAs, 5, 4)

  // Right arm (animates with rAs)
  ctx.fillStyle = shirtShade; ctx.fillRect(BX+bodyW, BY+rAs, 5, 10)
  ctx.fillStyle = skinShade;  ctx.fillRect(BX+bodyW, BY+10+rAs, 5, 4)

  // Body
  ctx.fillStyle = shirtShade; ctx.fillRect(BX, BY, bodyW, 17)
  _drawShirtDetail(ctx, BX, BY, bodyW, shirtType)

  // Legs
  ctx.fillStyle = pantsShade
  ctx.fillRect(BX+1+llx, LY+lly, 6, 21)
  ctx.fillRect(BX+bodyW-7+rlx, LY+rly, 6, 21)

  // Shoes
  ctx.fillStyle = shoeShade
  ctx.fillRect(BX-1+llx, SY+lly, 9, 3)
  ctx.fillRect(BX+bodyW-8+rlx, SY+rly, 9, 3)
}

// ── Sub-helpers ────────────────────────────────────────────────────────────

function _drawHair(ctx, hairType, HX, HY, hairShade) {
  ctx.fillStyle = hairShade
  switch (hairType) {
    case 0:  // Short flat
      ctx.fillRect(HX-1, HY, 12, 3)
      break
    case 1:  // Side-parted puff
      ctx.fillRect(HX-1, HY, 12, 2)
      ctx.fillRect(HX-1, HY, 4, 6)
      break
    case 2:  // Shoulder-length (sides drawn as back layer already)
      ctx.fillRect(HX-1, HY, 12, 3)
      break
    case 3:  // Bun
      ctx.fillRect(HX-1, HY, 12, 2)
      ctx.beginPath(); ctx.arc(HX+5, HY-4, 4, 0, Math.PI*2); ctx.fill()
      break
    case 4:  // Spiky
      for (let s = 0; s < 5; s++)
        ctx.fillRect(HX + s*2, HY - 3 + (s%2)*2, 2, 4)
      ctx.fillRect(HX-1, HY, 12, 2)
      break
  }
}

function _drawFace(ctx, HX, HY, smileType, hasGlasses, hairShade) {
  // Eyes
  ctx.fillStyle = '#0c0c0c'
  ctx.fillRect(HX+2, HY+4, 2, 2)
  ctx.fillRect(HX+6, HY+4, 2, 2)
  // Eye highlights
  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.fillRect(HX+2, HY+4, 1, 1)
  ctx.fillRect(HX+6, HY+4, 1, 1)
  // Glasses
  if (hasGlasses) {
    ctx.strokeStyle = hairShade; ctx.lineWidth = 0.8
    ctx.strokeRect(HX+1, HY+3, 4, 4)
    ctx.strokeRect(HX+5, HY+3, 4, 4)
    ctx.lineWidth = 1
  }
  // Mouth
  ctx.fillStyle = '#1a1a1a'
  const MY = HY + 9
  if (smileType === 0) {
    ctx.fillRect(HX+2, MY, 1, 1); ctx.fillRect(HX+3, MY+1, 4, 1); ctx.fillRect(HX+7, MY, 1, 1)
  } else if (smileType === 1) {
    ctx.fillRect(HX+2, MY, 6, 1)
  } else {
    ctx.fillRect(HX+3, MY, 4, 1); ctx.fillRect(HX+7, MY, 1, 1)
  }
}

function _drawShirtDetail(ctx, BX, BY, bodyW, shirtType) {
  switch (shirtType) {
    case 0:  // Horizontal stripes
      ctx.fillStyle = 'rgba(255,255,255,0.10)'
      ctx.fillRect(BX, BY+5, bodyW, 2)
      ctx.fillRect(BX, BY+11, bodyW, 2)
      break
    case 1:  // Chest pocket
      ctx.fillStyle = 'rgba(255,255,255,0.10)'
      ctx.fillRect(BX+2, BY+6, 5, 5)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 0.5
      ctx.strokeRect(BX+2, BY+6, 5, 5); ctx.lineWidth = 1
      break
    case 2:  // V-neck collar hint
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.beginPath()
      ctx.moveTo(BX + bodyW/2, BY+5)
      ctx.lineTo(BX+3, BY); ctx.lineTo(BX+bodyW-3, BY)
      ctx.closePath(); ctx.fill()
      break
    case 3:  // Logo circle
      ctx.fillStyle = 'rgba(255,255,255,0.14)'
      ctx.beginPath(); ctx.arc(BX+bodyW/2, BY+9, 3, 0, Math.PI*2); ctx.fill()
      break
  }
}
