import { ACTIVITY_META } from './constants.js'
import { drawNormieSprite, SPRITE_W, SPRITE_H } from './pixel-renderer.js'
import { TILE_MAP, ROOM_LAYOUTS } from './tilemap.js'

// ── Constants ──────────────────────────────────────────────────────────────
const TILE    = 16
const SCALE   = 2         // tighter scale for 3-col layout
const TS      = TILE * SCALE

const ROOM_TILES_W = 10
const ROOM_TILES_H = 7
const ROOM_W = ROOM_TILES_W * TS   // 320px
const ROOM_H = ROOM_TILES_H * TS   // 224px

// Light, warm room palettes — always light, unaffected by dark mode
const WALL_COLORS  = { bedroom:'#e8e2d8', study:'#e4dfd4', gaming:'#dde0e6', kitchen:'#ede8e0', chill:'#e6e0d6', gym:'#e0e4e2', library:'#e2ddd4', music:'#e4dee6', art:'#eae4dc' }
const FLOOR_COLORS = { bedroom:'#f5f0e8', study:'#f0ece2', gaming:'#eaecf0', kitchen:'#f4f0e8', chill:'#f2eee4', gym:'#eef0ee', library:'#eeead0', music:'#f0ecf2', art:'#f4f0e6' }
const ACCENT_COLORS= { bedroom:'#d8d0c4', study:'#d4cec0', gaming:'#c8ccd4', kitchen:'#dcd6cc', chill:'#d6d0c4', gym:'#d0d4d2', library:'#d4d0c0', music:'#d6d0d8', art:'#dcd6cc' }
const NORMIE_SCALE = 1.5
const SPRITE_W_PCT = (SPRITE_W * NORMIE_SCALE) / ROOM_W * 100

// ── Tileset — load in full colour ──────────────────────────────────────────
let _sheet = null

function _loadSheet() {
  return new Promise(resolve => {
    if (_sheet) { resolve(_sheet); return }
    const img = new Image()
    img.onload = () => { _sheet = img; resolve(_sheet) }
    img.onerror = () => { console.warn('Tileset failed to load'); resolve(null) }
    img.src = '/tileset.png'
  })
}

function _drawSprite(ctx, name, dx, dy, alpha = 1) {
  if (!_sheet) return
  const t = TILE_MAP[name]
  if (!t) return
  const [sx, sy, sw, sh] = t
  const dw = sw * SCALE
  const dh = sh * SCALE
  const prev = ctx.globalAlpha
  ctx.globalAlpha = alpha
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(_sheet, sx, sy, sw, sh, dx, dy, dw, dh)
  ctx.globalAlpha = prev
}

// ── Sprite state ───────────────────────────────────────────────────────────
const spriteState = new Map()

// ── Scene elements map ─────────────────────────────────────────────────────
const sceneCanvases = new Map()

// ── Build dorm (3-col grid + outdoor spanning full width) ──────────────────
export async function buildDorm(rooms) {
  await _loadSheet()
  sceneCanvases.clear()

  const wrap = document.createElement('div')
  wrap.className = 'dorm-building'

  const roomGrid = document.createElement('div')
  roomGrid.className = 'room-grid'

  const sceneEls = {}

  for (const room of rooms) {
    if (room.typeId === 'outdoor') continue

    const roomWrap = document.createElement('div')
    roomWrap.className = 'room-wrap'
    roomWrap.id = `roomwrap-${room.id}`

    const strip = document.createElement('div')
    strip.className = 'room-strip'
    strip.innerHTML = `
      <span class="rs-icon">${_roomIcon(room.typeId)}</span>
      <span class="rs-name">${room.typeName}</span>
      <span class="rs-occ" id="occ-${room.id}">0/${room.maxOcc}</span>`
    roomWrap.appendChild(strip)

    const roomScene = document.createElement('div')
    roomScene.className = 'room-scene'

    const canvas = document.createElement('canvas')
    canvas.width  = ROOM_W
    canvas.height = ROOM_H
    canvas.className = 'room-canvas'
    canvas.id = `canvas-${room.id}`
    roomScene.appendChild(canvas)
    roomWrap.appendChild(roomScene)

    const ctx = canvas.getContext('2d')
    _drawRoom(ctx, room)

    sceneCanvases.set(room.id, { canvas, ctx, room })
    sceneEls[room.id] = roomWrap
    roomGrid.appendChild(roomWrap)
  }

  wrap.appendChild(roomGrid)

  // Outdoor spanning full width below the grid
  const outdoorRoom = rooms.find(r => r.typeId === 'outdoor')
  if (outdoorRoom) {
    const od = _buildOutdoorDOM(outdoorRoom)
    sceneEls['outdoor'] = od
    wrap.appendChild(od)
  }

  return { el: wrap, sceneEls }
}

function _roomIcon(typeId) {
  const icons = { study:'📖', gaming:'🎮', chill:'☕', gym:'💪', library:'📚', music:'🎵', kitchen:'🍳', art:'🎨', bedroom:'🛏️' }
  return icons[typeId] || '🏠'
}

// ── Draw a room onto its canvas — LIGHT palette ────────────────────────────
function _drawRoom(ctx, room) {
  const theme = room.typeId
  ctx.imageSmoothingEnabled = false

  // Light floor
  ctx.fillStyle = FLOOR_COLORS[theme] || '#f0ece4'
  ctx.fillRect(0, 0, ROOM_W, ROOM_H)

  // Subtle floor grid
  ctx.strokeStyle = ACCENT_COLORS[theme] || '#ddd'
  ctx.lineWidth = 0.5
  for (let tx = 0; tx <= ROOM_TILES_W; tx++) {
    ctx.beginPath(); ctx.moveTo(tx * TS, TS * 2); ctx.lineTo(tx * TS, ROOM_H); ctx.stroke()
  }
  for (let ty = 2; ty <= ROOM_TILES_H; ty++) {
    ctx.beginPath(); ctx.moveTo(0, ty * TS); ctx.lineTo(ROOM_W, ty * TS); ctx.stroke()
  }

  // Back wall — lighter
  ctx.fillStyle = WALL_COLORS[theme] || '#e8e4dc'
  ctx.fillRect(0, 0, ROOM_W, TS * 2)

  // Wall bottom border (baseboard line)
  ctx.fillStyle = ACCENT_COLORS[theme] || '#d0ccc0'
  ctx.fillRect(0, TS * 2 - 2, ROOM_W, 2)

  // Top edge
  ctx.fillStyle = '#d0ccc0'
  ctx.fillRect(0, 0, ROOM_W, 1)

  // Bottom skirting
  ctx.fillStyle = ACCENT_COLORS[theme] || '#d0ccc0'
  ctx.fillRect(0, ROOM_H - 2, ROOM_W, 2)

  // Draw furniture from layout
  const layout = ROOM_LAYOUTS[theme] || ROOM_LAYOUTS.bedroom
  for (const item of layout) {
    _drawSprite(ctx, item.sprite, item.x * SCALE, item.y * SCALE)
  }
}

// ── Outdoor DOM ────────────────────────────────────────────────────────────
function _buildOutdoorDOM(room) {
  const wrap = document.createElement('div')
  wrap.className = 'room-wrap outdoor-wrap'
  wrap.id = `roomwrap-outdoor`

  const strip = document.createElement('div')
  strip.className = 'room-strip outdoor-strip'
  strip.innerHTML = `
    <span class="rs-icon">🌳</span>
    <span class="rs-name">The Quad</span>
    <span class="rs-occ" id="occ-outdoor">0 outside</span>`
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

  const isOutdoor = sceneEl.classList.contains('outdoor-wrap')
  const container = isOutdoor
    ? sceneEl.querySelector('.out-objects') || sceneEl
    : sceneEl.querySelector('.room-scene') || sceneEl

  let startX, startY
  if (isOutdoor) {
    startX = 30 + Math.random() * 660
    startY = 15 + Math.random() * 40
    cvs.style.left   = Math.round(startX) + 'px'
    cvs.style.bottom = Math.round(startY) + 'px'
    cvs.style.top    = 'auto'
  } else {
    startX = 5 + Math.random() * (85 - SPRITE_W_PCT)
    startY = 28 + Math.random() * 45
    cvs.style.left   = startX + '%'
    cvs.style.top    = startY + '%'
    cvs.style.bottom = 'auto'
    cvs.style.width  = SPRITE_W_PCT + '%'
    cvs.style.height = 'auto'
  }

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

  if (isOutdoor) container.style.position = 'relative'
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
    : newSceneEl.querySelector('.room-scene') || newSceneEl

  if (ss.isOutdoor) {
    ss.x = 30 + Math.random() * 660
    ss.y = 15 + Math.random() * 40
    ss.cvs.style.left   = Math.round(ss.x) + 'px'
    ss.cvs.style.bottom = Math.round(ss.y) + 'px'
    ss.cvs.style.top    = 'auto'
    ss.cvs.style.width  = ''
    ss.cvs.style.height = ''
    container.style.position = 'relative'
  } else {
    ss.x = 5 + Math.random() * (85 - SPRITE_W_PCT)
    ss.y = 28 + Math.random() * 45
    ss.cvs.style.left   = ss.x + '%'
    ss.cvs.style.top    = ss.y + '%'
    ss.cvs.style.bottom = 'auto'
    ss.cvs.style.width  = SPRITE_W_PCT + '%'
    ss.cvs.style.height = 'auto'
  }
  ss.targetX = ss.x
  ss.targetY = ss.y
  container.appendChild(ss.cvs)
}

export function animateSprites(normieMap, nightAlpha, dt) {
  for (const [id, ss] of spriteState) {
    const normie = normieMap.get(id)
    if (!normie) continue

    const pose  = ACTIVITY_META[normie.activity]?.pose || 'stand'
    const still = ['sleeping','napping'].includes(normie.activity)

    if (!still) {
      ss.walkPhase = (ss.walkPhase + dt * 3.2) % 1
      ss._moveTimer -= dt

      if (ss._moveTimer <= 0) {
        if (ss.isOutdoor) {
          ss.targetX = 20 + Math.random() * 680
          ss.targetY = 10 + Math.random() * 80
        } else {
          ss.targetX = 3 + Math.random() * (87 - SPRITE_W_PCT)
          ss.targetY = 25 + Math.random() * 50
        }
        ss._moveTimer = 3 + Math.random() * 4
      }

      const dx = ss.targetX - ss.x
      const dy = ss.targetY - ss.y
      const dist = Math.hypot(dx, dy)
      const spd  = ss.isOutdoor ? 30 * dt : 12 * dt

      if (dist > (ss.isOutdoor ? 2 : 0.5)) {
        ss.x += (dx / dist) * spd
        ss.y += (dy / dist) * spd
        ss.dir = Math.abs(dx) > Math.abs(dy) * 0.5 ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down')
      }

      if (ss.isOutdoor) {
        ss.cvs.style.left   = Math.round(ss.x) + 'px'
        ss.cvs.style.bottom = Math.round(ss.y) + 'px'
      } else {
        ss.cvs.style.left = ss.x + '%'
        ss.cvs.style.top  = ss.y + '%'
      }
      ss.cvs.style.zIndex = String(Math.floor(ss.y))
    } else {
      ss.walkPhase = 0
    }

    if (pose === 'sleep') ss.zzzPhase = ((ss.zzzPhase || 0) + dt * 1.4) % (Math.PI * 8)

    const now = performance.now()
    if (now - ss._lastDraw > 66) {
      const spriteNight = ss.isOutdoor ? nightAlpha : nightAlpha * 0.15
      _redrawSprite(normie, ss, spriteNight)
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

  // Light tint on room canvases — very subtle at night
  for (const [roomId, { canvas, ctx, room }] of sceneCanvases) {
    _drawRoom(ctx, room)
    if (night > 0) {
      ctx.fillStyle = `rgba(15, 20, 45, ${(night * 0.10).toFixed(3)})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
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
