import { API_BASE } from './constants.js'

// ── Cache ──────────────────────────────────────────────────────────────────
const procCache = new Map()

// ── Normie image format ────────────────────────────────────────────────────
// API returns 1000×1000 PNG with exactly two colours on a solid background:
//   Light/background:  #e3e5e4  rgb(227,229,228)
//   Dark pixel art:    #48494b  rgb(72,73,75)
//
// We want ONLY the dark pixels — everything else → fully transparent.
// Simple luminance threshold: r,g,b all < 120 → dark pixel → keep black.
// Anything brighter (light areas, bg, anti-alias fringe) → transparent.

const BG_R = 227, BG_G = 229, BG_B = 228
const BG_TOLERANCE = 15

export const SPRITE_W = 64
export const SPRITE_H = 64

// ── Main entry ─────────────────────────────────────────────────────────────
export function preloadNormieImage(id) {
  if (procCache.has(id)) return Promise.resolve(procCache.get(id))
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => _process(img).then(c => { procCache.set(id, c); resolve(c) })
    img.onerror = () => { procCache.set(id, null); resolve(null) }
    img.src = `${API_BASE}/normie/${id}/image.png`
  })
}

// ── Processing pipeline ────────────────────────────────────────────────────
async function _process(img) {
  // Draw at native 40×40 (image is 40×40 pixel art scaled ×25 to 1000×1000)
  // Using 40×40 gives us exact unblended pixel values with no interpolation.
  const PX = 40
  const tmp = document.createElement('canvas')
  tmp.width = PX; tmp.height = PX
  const tc = tmp.getContext('2d', { willReadFrequently: true })
  tc.imageSmoothingEnabled = false
  tc.drawImage(img, 0, 0, 1000, 1000, 0, 0, PX, PX)

  const idata = tc.getImageData(0, 0, PX, PX)
  const d = idata.data

  // Remove background — keep all non-background pixels in original colour
  for (let i = 0; i < d.length; i += 4) {
    if (Math.abs(d[i] - BG_R) <= BG_TOLERANCE &&
        Math.abs(d[i+1] - BG_G) <= BG_TOLERANCE &&
        Math.abs(d[i+2] - BG_B) <= BG_TOLERANCE) {
      d[i+3] = 0
    }
  }
  tc.putImageData(idata, 0, 0)

  // Scale up to SPRITE_W×SPRITE_H with nearest-neighbour
  const out = document.createElement('canvas')
  out.width = SPRITE_W; out.height = SPRITE_H
  const oc = out.getContext('2d')
  oc.imageSmoothingEnabled = false
  oc.drawImage(tmp, 0, 0, PX, PX, 0, 0, SPRITE_W, SPRITE_H)
  return out
}

// ── Sprite draw helper ─────────────────────────────────────────────────────
// Called by DormScene each frame for each normie sprite
export function drawNormieSprite(ctx, normieId, pose, walkPhase, effects = {}) {
  const proc  = procCache.get(normieId)
  const dir   = effects.direction  || 'right'
  const night = effects.nightAlpha || 0

  ctx.save()
  if (dir === 'left') { ctx.scale(-1,1); ctx.translate(-SPRITE_W, 0) }
  if (dir === 'up')     ctx.globalAlpha = 0.75

  let bobY = 0
  if (pose === 'walk') { const f = Math.floor(walkPhase*4)%4; bobY = [0,-1,-2,-1][f] }

  if (pose === 'sleep' || pose === 'napping') {
    ctx.translate(SPRITE_W/2, SPRITE_H/2); ctx.rotate(Math.PI/2)
    _draw(ctx, proc, -SPRITE_W/2, -SPRITE_H/2)
    ctx.restore()
    _night(ctx, night)
    _zzz(ctx, effects.zzzPhase || 0)
    return
  }

  _draw(ctx, proc, 0, bobY)
  ctx.restore()
  _night(ctx, night)
}

function _draw(ctx, proc, x, y) {
  if (proc) {
    ctx.drawImage(proc, x, y, SPRITE_W, SPRITE_H)
  } else {
    // Placeholder silhouette while loading
    ctx.fillStyle = '#48494b'
    ctx.fillRect(x+20,y+2,24,18); ctx.fillRect(x+14,y+20,36,18)
    ctx.fillRect(x+5,y+20,10,14); ctx.fillRect(x+49,y+20,10,14)
    ctx.fillRect(x+16,y+38,12,22); ctx.fillRect(x+36,y+38,12,22)
  }
}

function _night(ctx, a) {
  if (a > 0) {
    ctx.fillStyle = `rgba(5,8,20,${(a*0.4).toFixed(3)})`
    ctx.fillRect(0, 0, SPRITE_W, SPRITE_H)
  }
}

function _zzz(ctx, p) {
  ctx.font = 'bold 7px monospace'
  ctx.fillStyle = `rgba(160,170,210,${Math.abs(Math.sin(p*0.8)*0.9).toFixed(2)})`
  ctx.fillText('z', SPRITE_W-13, 11)
  ctx.font = 'bold 9px monospace'
  ctx.fillStyle = `rgba(160,170,210,${Math.abs(Math.sin(p*0.8+2)*0.7).toFixed(2)})`
  ctx.fillText('Z', SPRITE_W-8, 4)
}
