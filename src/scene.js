import { ACTIVITY_META } from './constants.js'
import { drawNormieSprite, SPRITE_W, SPRITE_H } from './pixel-renderer.js'
import { TILE_MAP, ROOM_LAYOUTS } from './tilemap.js'

// ── Constants ──────────────────────────────────────────────────────────────
const TILE    = 16        // source tile size
const SCALE   = 3         // display scale (16px → 48px)
const TS      = TILE * SCALE  // 48px per tile on screen

const ROOM_TILES_W = 12   // room width in tiles
const ROOM_TILES_H = 8    // room height in tiles
const ROOM_W = ROOM_TILES_W * TS   // 576px
const ROOM_H = ROOM_TILES_H * TS   // 384px

const WALL_COLOR    = '#2a2a2a'
const FLOOR_COLORS  = { bedroom:'#3a3530', study:'#2e3028', gaming:'#1e1e28', kitchen:'#303030' }
const ACCENT_COLORS = { bedroom:'#4a4540', study:'#3a4038', gaming:'#252535', kitchen:'#404040' }
const NORMIE_SCALE  = 2.5  // normie sprite display scale

// ── Tileset ────────────────────────────────────────────────────────────────
let _sheet = null
let _sheetMono = null  // grayscale processed version

function _loadSheet() {
  return new Promise(resolve => {
    if (_sheetMono) { resolve(_sheetMono); return }
    const img = new Image()
    img.onload = () => {
      // Process to monochrome once
      const tmp = document.createElement('canvas')
      tmp.width = img.naturalWidth
      tmp.height = img.naturalHeight
      const tc = tmp.getContext('2d', { willReadFrequently: true })
      tc.drawImage(img, 0, 0)
      const id = tc.getImageData(0, 0, tmp.width, tmp.height)
      const d = id.data
      for (let i = 0; i < d.length; i += 4) {
        const g = Math.round(0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2])
        // Boost contrast slightly
        const boosted = Math.min(255, Math.round(g * 1.15))
        d[i] = d[i+1] = d[i+2] = boosted
      }
      tc.putImageData(id, 0, 0)
      _sheetMono = tmp
      _sheet = img
      resolve(_sheetMono)
    }
    img.onerror = () => { console.warn('Tileset failed to load'); resolve(null) }
    img.src = '/tileset.png'
  })
}

function _drawSprite(ctx, name, dx, dy, alpha = 1) {
  if (!_sheetMono) return
  const t = TILE_MAP[name]
  if (!t) return
  const [sx, sy, sw, sh] = t
  const dw = sw * SCALE
  const dh = sh * SCALE
  const prev = ctx.globalAlpha
  ctx.globalAlpha = alpha
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(_sheetMono, sx, sy, sw, sh, dx, dy, dw, dh)
  ctx.globalAlpha = prev
}

// ── Sprite state ───────────────────────────────────────────────────────────
const spriteState = new Map()  // normieId → { cvs, sceneEl, x, targetX, y, targetY, dir, walkPhase, ... }

// ── Scene elements map ─────────────────────────────────────────────────────
// roomId → { canvas, ctx, wrap }
const sceneCanvases = new Map()

// ── Build dorm ─────────────────────────────────────────────────────────────
export async function buildDorm(rooms) {
  await _loadSheet()
  sceneCanvases.clear()

  const wrap = document.createElement('div')
  wrap.className = 'dorm-building'

  const sceneEls = {}

  for (const room of rooms) {
    if (room.typeId === 'outdoor') continue

    const roomWrap = document.createElement('div')
    roomWrap.className = 'room-wrap'
    roomWrap.id = `roomwrap-${room.id}`

    // Header strip
    const strip = document.createElement('div')
    strip.className = 'room-strip'
    strip.innerHTML = `
      <span class="rs-num">${room.number}</span>
      <span class="rs-name">${room.name}</span>
      <span class="rs-occ" id="occ-${room.id}">0/${room.maxOcc}</span>
      <span class="rs-tag">${room.typeName}</span>`
    roomWrap.appendChild(strip)

    // Room canvas
    const canvas = document.createElement('canvas')
    canvas.width  = ROOM_W
    canvas.height = ROOM_H
    canvas.className = 'room-canvas'
    canvas.id = `canvas-${room.id}`
    canvas.style.cssText = `width:${ROOM_W}px;height:${ROOM_H}px;image-rendering:pixelated;display:block;cursor:pointer`
    roomWrap.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    _drawRoom(ctx, room)

    sceneCanvases.set(room.id, { canvas, ctx, room })
    sceneEls[room.id] = roomWrap
    wrap.appendChild(roomWrap)
    wrap.appendChild(_makeSep())
  }

  // Outdoor strip
  const outdoorRoom = rooms.find(r => r.typeId === 'outdoor')
  if (outdoorRoom) {
    const od = _buildOutdoorDOM(outdoorRoom)
    sceneEls['outdoor'] = od
    wrap.appendChild(od)
  }

  return { el: wrap, sceneEls }
}

function _makeSep() {
  const s = document.createElement('div')
  s.className = 'room-sep'
  return s
}

// ── Draw a room onto its canvas ────────────────────────────────────────────
function _drawRoom(ctx, room) {
  const theme = room.typeId
  ctx.imageSmoothingEnabled = false

  // Floor fill
  ctx.fillStyle = FLOOR_COLORS[theme] || '#2e2e2e'
  ctx.fillRect(0, 0, ROOM_W, ROOM_H)

  // Floor tile pattern (subtle grid)
  ctx.strokeStyle = ACCENT_COLORS[theme] || '#333'
  ctx.lineWidth = 1
  for (let tx = 0; tx <= ROOM_TILES_W; tx++) {
    ctx.beginPath()
    ctx.moveTo(tx * TS, 0)
    ctx.lineTo(tx * TS, ROOM_H)
    ctx.stroke()
  }
  for (let ty = 0; ty <= ROOM_TILES_H; ty++) {
    ctx.beginPath()
    ctx.moveTo(0, ty * TS)
    ctx.lineTo(ROOM_W, ty * TS)
    ctx.stroke()
  }

  // Back wall
  ctx.fillStyle = WALL_COLOR
  ctx.fillRect(0, 0, ROOM_W, TS * 1.5)

  // Wall top border
  ctx.fillStyle = '#111'
  ctx.fillRect(0, 0, ROOM_W, 3)

  // Skirting board
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, ROOM_H - 4, ROOM_W, 4)

  // Left accent strip
  ctx.fillStyle = '#111'
  ctx.fillRect(0, 0, 3, ROOM_H)

  // Draw furniture from layout
  const layout = ROOM_LAYOUTS[theme] || ROOM_LAYOUTS.bedroom
  for (const item of layout) {
    _drawSprite(ctx, item.sprite, item.x * SCALE, item.y * SCALE)
  }

  // Room label on wall
  ctx.font = `bold ${10 * SCALE / 3}px "IBM Plex Mono", monospace`
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillText(room.typeName.toUpperCase(), TS * 0.3, TS * 1.1)
}

// ── Outdoor DOM (simpler, CSS-based for now) ───────────────────────────────
function _buildOutdoorDOM(room) {
  const wrap = document.createElement('div')
  wrap.className = 'room-wrap outdoor-wrap'
  wrap.id = `roomwrap-outdoor`

  const strip = document.createElement('div')
  strip.className = 'room-strip'
  strip.innerHTML = `
    <span class="rs-num">Q</span>
    <span class="rs-name">THE QUAD</span>
    <span class="rs-occ" id="occ-outdoor">0 outside</span>
    <span class="rs-tag">outdoor</span>`
  wrap.appendChild(strip)

  const scene = document.createElement('div')
  scene.className = 'outdoor-scene'
  scene.id = 'scene-outdoor'

  // Sky
  const sky = document.createElement('div')
  sky.className = 'out-sky'
  sky.id = 'outdoor-sky'
  for (let i = 0; i < 30; i++) {
    const s = document.createElement('div')
    s.className = `star ss${i%3}`
    s.style.cssText = `left:${Math.random()*100}%;top:${3+Math.random()*55}%;animation-delay:${(Math.random()*4).toFixed(1)}s`
    sky.appendChild(s)
  }
  const moon = document.createElement('div')
  moon.className = 'moon'; moon.id = 'moon'; moon.textContent = '◑'
  sky.appendChild(moon)
  const sun = document.createElement('div')
  sun.className = 'out-sun'; sun.id = 'sun'
  sky.appendChild(sun)

  // Skyline
  const skyline = document.createElement('div')
  skyline.className = 'bg-skyline'
  ;[55,80,45,70,60,35,90,50].forEach(h => {
    const b = document.createElement('div')
    b.className = 'skyline-bldg'; b.style.height = h + 'px'
    skyline.appendChild(b)
  })
  sky.appendChild(skyline)
  scene.appendChild(sky)

  const ground = document.createElement('div')
  ground.className = 'out-ground'; ground.id = 'outdoor-ground'
  scene.appendChild(ground)

  const path = document.createElement('div')
  path.className = 'out-path'; scene.appendChild(path)

  const objs = document.createElement('div')
  objs.className = 'out-objects'; scene.appendChild(objs)
  ;[
    _mkOutTree(28, 'oak'), _mkOutTree(195, 'pine'),
    _mkOutTree(500, 'oak'), _mkOutTree(658, 'pine'),
    _mkOutBench(128), _mkOutBench(402),
    _mkOutLamp(305), _mkFountain(450),
  ].forEach(el => objs.appendChild(el))

  wrap.appendChild(scene)
  return wrap
}

function _mkOutTree(x, type) {
  const t = document.createElement('div')
  t.className = `out-tree ot-${type}`; t.style.left = x + 'px'
  if (type === 'oak') t.innerHTML = `<div class="oak-canopy"><div class="oak-hi"></div></div><div class="oak-trunk"></div>`
  else t.innerHTML = `<div class="pine-t1"></div><div class="pine-t2"></div><div class="pine-t3"></div><div class="pine-tr"></div>`
  return t
}
function _mkOutBench(x) {
  const b = document.createElement('div')
  b.className = 'out-bench'; b.style.left = x + 'px'
  b.innerHTML = `<div class="ob-back"><div class="obs"></div><div class="obs"></div></div><div class="ob-seat"><div class="obs"></div></div><div class="ob-legs"><div></div><div></div></div>`
  return b
}
function _mkOutLamp(x) {
  const l = document.createElement('div')
  l.className = 'out-lamp'; l.style.left = x + 'px'
  l.innerHTML = `<div class="ol-head"><div class="ol-bulb"></div></div><div class="ol-pole"></div><div class="ol-base"></div>`
  return l
}
function _mkFountain(x) {
  const f = document.createElement('div')
  f.className = 'out-fountain'; f.style.left = x + 'px'
  f.innerHTML = `<div class="fo-rim"><div class="fo-water"><div class="fo-ripple"></div></div></div><div class="fo-center"></div>`
  return f
}

// ── Sprite system ──────────────────────────────────────────────────────────
export function placeSprite(normie, sceneEl) {
  removeSprite(normie.id)
  if (!sceneEl) return

  const cvs = document.createElement('canvas')
  cvs.id = `sprite-${normie.id}`
  cvs.className = 'normie-sprite'
  cvs.width  = Math.round(SPRITE_W * NORMIE_SCALE)
  cvs.height = Math.round(SPRITE_H * NORMIE_SCALE)
  cvs.style.cssText = `position:absolute;cursor:pointer;image-rendering:pixelated;z-index:10`

  // Find the actual canvas element within the scene wrap
  const roomCanvas = sceneEl.querySelector('.room-canvas') || sceneEl
  const isOutdoor   = sceneEl.classList.contains('outdoor-wrap')
  const container   = isOutdoor ? sceneEl.querySelector('.out-objects') || sceneEl : sceneEl

  const sceneW = isOutdoor ? 760 : ROOM_W
  const startX = 60 + Math.random() * (sceneW - cvs.width - 80)
  const startY = isOutdoor ? 20 + Math.random() * 30 : ROOM_H * 0.35 + Math.random() * (ROOM_H * 0.45)

  cvs.style.left   = Math.round(startX) + 'px'
  cvs.style.bottom = isOutdoor ? Math.round(startY) + 'px' : 'auto'
  cvs.style.top    = isOutdoor ? 'auto' : Math.round(startY) + 'px'

  const ss = {
    cvs, sceneEl,
    x: startX, targetX: startX,
    y: startY, targetY: startY,
    isOutdoor,
    dir: 'right',
    walkPhase: Math.random(),
    zzzPhase: Math.random() * Math.PI * 2,
    _lastDraw: 0,
    _moveTimer: 2 + Math.random() * 3,
  }
  spriteState.set(normie.id, ss)

  _redrawSprite(normie, ss)

  cvs.addEventListener('click', e => {
    e.stopPropagation()
    document.dispatchEvent(new CustomEvent('normie-click', { detail: { id: normie.id } }))
  })

  container.style.position = 'relative'
  container.appendChild(cvs)
}

export function removeSprite(id) {
  document.getElementById(`sprite-${id}`)?.remove()
  spriteState.delete(id)
}

export function onActivityChanged(normie) {
  const ss = spriteState.get(normie.id)
  if (!ss) return
  ss._moveTimer = 0
}

export function setSpriteScene(normie, newSceneEl) {
  const ss = spriteState.get(normie.id)
  if (!ss || !newSceneEl) return
  ss.cvs.remove()
  ss.sceneEl = newSceneEl
  ss.isOutdoor = newSceneEl.classList.contains('outdoor-wrap')

  const container = ss.isOutdoor
    ? newSceneEl.querySelector('.out-objects') || newSceneEl
    : newSceneEl
  container.style.position = 'relative'
  container.appendChild(ss.cvs)
}

export function animateSprites(normieMap, nightAlpha, dt) {
  for (const [id, ss] of spriteState) {
    const normie = normieMap.get(id)
    if (!normie) continue

    const pose  = ACTIVITY_META[normie.activity]?.pose || 'stand'
    const still = ['sleeping','eating','studying','gaming','reading','showering','napping','cooking','sketching','chatting','meditating'].includes(normie.activity)

    if (!still) {
      ss.walkPhase = (ss.walkPhase + dt * 3.2) % 1
      ss._moveTimer -= dt

      if (ss._moveTimer <= 0) {
        const sceneW = ss.isOutdoor ? 720 : ROOM_W
        const sceneH = ss.isOutdoor ? 80  : ROOM_H * 0.5
        ss.targetX = 40 + Math.random() * (sceneW - ss.cvs.width - 60)
        ss.targetY = (ss.isOutdoor ? 10 : ROOM_H * 0.35) + Math.random() * sceneH
        ss._moveTimer = 2 + Math.random() * 3
      }

      const dx = ss.targetX - ss.x
      const dy = ss.targetY - ss.y
      const dist = Math.hypot(dx, dy)
      const spd  = 45 * dt

      if (dist > 2) {
        ss.x += (dx / dist) * spd
        ss.y += (dy / dist) * spd
        ss.dir = Math.abs(dx) > Math.abs(dy) * 0.5 ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down')
      }

      ss.cvs.style.left = Math.round(ss.x) + 'px'
      if (ss.isOutdoor) ss.cvs.style.bottom = Math.round(ss.y) + 'px'
      else              ss.cvs.style.top    = Math.round(ss.y) + 'px'

      // Depth sort: lower y = further back = smaller
      const depthFactor = ss.isOutdoor ? 1 : 0.7 + 0.3 * (ss.y / (ROOM_H * 0.85))
      ss.cvs.style.transform = `scale(${Math.max(0.7, Math.min(1.1, depthFactor)).toFixed(3)})`
      ss.cvs.style.transformOrigin = 'bottom center'
      ss.cvs.style.zIndex = String(Math.floor(ss.y))
    } else {
      ss.cvs.style.transform = 'scale(1)'
      ss.walkPhase = 0
    }

    if (pose === 'sleep') ss.zzzPhase = ((ss.zzzPhase || 0) + dt * 1.4) % (Math.PI * 8)

    const now = performance.now()
    if (now - ss._lastDraw > 66) {
      _redrawSprite(normie, ss, nightAlpha)
      ss._lastDraw = now
    }
  }
}

function _redrawSprite(normie, ss, nightAlpha = 0) {
  const ctx = ss.cvs.getContext('2d')
  ctx.clearRect(0, 0, ss.cvs.width, ss.cvs.height)
  ctx.save()
  ctx.scale(NORMIE_SCALE, NORMIE_SCALE)
  const pose = ACTIVITY_META[normie.activity]?.pose || 'stand'
  drawNormieSprite(ctx, normie.id, pose, ss.walkPhase, {
    direction: ss.dir,
    nightAlpha,
    zzzPhase: pose === 'sleep' ? ss.zzzPhase : undefined,
  })
  ctx.restore()
}

// ── Night overlay on room canvases ─────────────────────────────────────────
export function updateDayNight(gameMinute) {
  const hour  = (gameMinute / 60) % 24
  let night = 0
  if      (hour >= 20)   night = Math.min((hour - 20) / 3, 1)
  else if (hour < 6)     night = 1
  else if (hour < 8)     night = Math.max(1 - (hour - 6) / 2, 0)

  // Tint room canvases
  for (const [roomId, { canvas, ctx, room }] of sceneCanvases) {
    if (night > 0) {
      // Redraw room then overlay night tint
      _drawRoom(ctx, room)
      ctx.fillStyle = `rgba(5, 8, 30, ${(night * 0.55).toFixed(3)})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else {
      _drawRoom(ctx, room)
    }
  }

  // Outdoor sky
  const sky    = document.getElementById('outdoor-sky')
  const sun    = document.getElementById('sun')
  const moon   = document.getElementById('moon')
  const ground = document.getElementById('outdoor-ground')
  if (sky)    sky.dataset.time    = night < 0.25 ? 'day' : night < 0.75 ? 'dusk' : 'night'
  if (sun)    sun.style.opacity   = Math.max(0, 1 - night * 2).toFixed(2)
  if (moon)   moon.style.opacity  = night > 0.5 ? ((night - 0.5) * 2).toFixed(2) : '0'
  if (ground) ground.dataset.time = night > 0.5 ? 'night' : 'day'
  document.querySelectorAll('.star').forEach(s => s.style.opacity = night > 0.6 ? '1' : '0')

  return night
}

export function updateOccupancy(normies) {
  const counts = {}
  for (const n of normies) counts[n.location] = (counts[n.location] || 0) + 1
  for (const [loc, count] of Object.entries(counts)) {
    const el = document.getElementById(`occ-${loc}`)
    if (!el) continue
    el.textContent = loc === 'outdoor' ? `${count} outside` : `${count}/4`
  }
  // Zero out any rooms with no normies
  document.querySelectorAll('[id^="occ-"]').forEach(el => {
    const loc = el.id.replace('occ-', '')
    if (!counts[loc]) el.textContent = loc === 'outdoor' ? '0 outside' : '0/4'
  })
}
