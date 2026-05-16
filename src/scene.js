import { ACTIVITY_META } from './constants.js'
import { drawNormieSprite, drawZzz, SPRITE_W, SPRITE_H } from './pixel-renderer.js'

// ── Constants ──────────────────────────────────────────────────────────────
const TILE    = 16
const SCALE   = 2         // tighter scale for 3-col layout
const TS      = TILE * SCALE

const ROOM_TILES_W = 10
const ROOM_TILES_H = 7
const ROOM_W = ROOM_TILES_W * TS   // 320px
const ROOM_H = ROOM_TILES_H * TS   // 224px
const WALL_H = TS * 2

const NORMIE_SCALE  = 1.5
const SPRITE_W_PCT  = (SPRITE_W * NORMIE_SCALE) / ROOM_W * 100
// CSS height = auto; aspect ratio = SPRITE_W:SPRITE_H so CSS height ≈ SPRITE_W_PCT * (SPRITE_H/SPRITE_W)%

// Monochrome room identity — each type reads as a distinct “set” at a glance
const MONO = {
  study:   { wall: '#cecece', floor: '#eaeaea', line: '#9a9a9a', ink: '#0f0f0f', soft: '#6a6a6a' },
  gaming:  { wall: '#c6c6c6', floor: '#e4e4e4', line: '#8e8e8e', ink: '#0a0a0a', soft: '#585858' },
  chill:   { wall: '#d2d2d2', floor: '#eeeeee', line: '#a2a2a2', ink: '#121212', soft: '#646464' },
  gym:     { wall: '#bfbfbf', floor: '#e2e2e2', line: '#888888', ink: '#080808', soft: '#505050' },
  library: { wall: '#c9c9c9', floor: '#e8e8e8', line: '#949494', ink: '#101010', soft: '#5c5c5c' },
  music:   { wall: '#cbcbcb', floor: '#ebebeb', line: '#989898', ink: '#0c0c0c', soft: '#626262' },
  kitchen: { wall: '#c4c4c4', floor: '#e6e6e6', line: '#909090', ink: '#0e0e0e', soft: '#565656' },
  art:     { wall: '#d0d0d0', floor: '#efefef', line: '#9e9e9e', ink: '#111111', soft: '#686868' },
  bedroom: { wall: '#d4d4d4', floor: '#ececec', line: '#a0a0a0', ink: '#111111', soft: '#666666' },
}

function _floorGrid(ctx, C, step = TS) {
  ctx.strokeStyle = C.line
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 0.5
  for (let x = 0; x <= ROOM_W; x += step) {
    ctx.beginPath(); ctx.moveTo(x, WALL_H); ctx.lineTo(x, ROOM_H); ctx.stroke()
  }
  for (let y = WALL_H; y <= ROOM_H; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ROOM_W, y); ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function _windowFrame(ctx, x, y, w, h, C) {
  ctx.fillStyle = C.soft
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 2
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2)
  ctx.beginPath()
  ctx.lineWidth = 1
  ctx.strokeStyle = C.line
  ctx.moveTo(x + w / 2, y + 2); ctx.lineTo(x + w / 2, y + h - 2)
  ctx.moveTo(x + 2, y + h / 2); ctx.lineTo(x + w - 2, y + h / 2)
  ctx.stroke()
}

function _drawStudy(ctx, C) {
  _floorGrid(ctx, C, TS)
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = C.ink
    ctx.fillRect(24 + i * 52, 10, 44, 3)
    ctx.fillStyle = C.soft
    ctx.fillRect(26 + i * 52, 13, 8, 2)
  }
  _windowFrame(ctx, 108, 6, 104, 52, C)
  ctx.fillStyle = C.ink
  ctx.fillRect(16, 72, 112, 8)
  ctx.fillRect(16, 80, 8, 40)
  ctx.fillRect(120, 72, 8, 48)
  ctx.beginPath()
  ctx.fillStyle = C.soft
  ctx.arc(148, 132, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = C.ink
  ctx.fillRect(200, 64, 6, 36)
  ctx.beginPath(); ctx.arc(203, 58, 10, 0, Math.PI * 2); ctx.fill()
}

function _drawGaming(ctx, C) {
  ctx.strokeStyle = C.line
  ctx.globalAlpha = 0.4
  for (let y = WALL_H + 8; y < ROOM_H; y += 14)
    for (let x = 8; x < ROOM_W; x += 14) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y); ctx.stroke()
    }
  ctx.globalAlpha = 1
  _windowFrame(ctx, 56, 8, 48, 48, C)
  ctx.fillStyle = C.ink
  ctx.fillRect(72, 36, 176, 68)
  ctx.fillStyle = C.floor
  ctx.fillRect(80, 44, 160, 52)
  ctx.fillStyle = C.soft
  ctx.fillRect(88, 52, 24, 18)
  ctx.fillRect(208, 52, 24, 18)
  ctx.fillStyle = C.ink
  ctx.fillRect(40, 120, 96, 20)
  ctx.fillRect(48, 116, 80, 8)
  ctx.fillRect(184, 124, 96, 16)
}

function _drawChill(ctx, C) {
  ctx.strokeStyle = C.line
  ctx.globalAlpha = 0.25
  for (let y = WALL_H; y < ROOM_H; y += 8) {
    ctx.beginPath()
    for (let x = -20; x < ROOM_W + 20; x += 16) {
      ctx.moveTo(x, y); ctx.lineTo(x + 12, y + 8); ctx.lineTo(x + 24, y)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  _windowFrame(ctx, 88, 6, 96, 56, C)
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 3
  ctx.strokeRect(96, 100, 128, 72)
  ctx.lineWidth = 1
  ctx.fillStyle = C.soft
  ctx.fillRect(40, 132, 56, 28)
  ctx.fillStyle = C.ink
  ctx.fillRect(132, 48, 56, 36)
  ctx.fillRect(168, 44, 8, 8)
  ctx.beginPath()
  ctx.arc(244, 140, 22, 0, Math.PI * 2)
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 2
  ctx.stroke()
}

function _drawGym(ctx, C) {
  ctx.fillStyle = C.line
  ctx.globalAlpha = 0.15
  for (let y = WALL_H + 10; y < ROOM_H; y += 20)
    for (let x = 10 + (y % 40 ? 0 : 10); x < ROOM_W; x += 20) {
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
    }
  ctx.globalAlpha = 1
  _windowFrame(ctx, 40, 6, 88, 52, C)
  _windowFrame(ctx, 184, 6, 88, 52, C)
  ctx.fillStyle = C.ink
  ctx.fillRect(24, 52, 272, 4)
  ctx.fillRect(140, 44, 40, 64)
  ctx.fillStyle = C.soft
  ctx.fillRect(144, 48, 32, 54)
  ctx.fillStyle = C.ink
  ctx.fillRect(96, 108, 128, 56)
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(160, 136, 18, 0, Math.PI * 2); ctx.stroke()
}

function _drawLibrary(ctx, C) {
  _floorGrid(ctx, C, TS / 2)
  for (let col = 0; col < 11; col++) {
    ctx.fillStyle = col % 3 === 0 ? C.ink : C.soft
    const x = 8 + col * 26
    ctx.fillRect(x, 8, 20, 56)
    for (let r = 0; r < 8; r++)
      ctx.fillRect(x + 3, 14 + r * 6, 14, 2)
  }
  _windowFrame(ctx, 118, 6, 84, 40, C)
  ctx.fillStyle = C.ink
  ctx.fillRect(88, 88, 144, 10)
  ctx.fillRect(88, 98, 12, 44)
  ctx.fillRect(220, 98, 12, 44)
  ctx.fillStyle = C.soft
  ctx.beginPath(); ctx.arc(160, 152, 16, 0, Math.PI * 2); ctx.fill()
}

function _drawMusic(ctx, C) {
  ctx.strokeStyle = C.line
  ctx.globalAlpha = 0.35
  for (let i = 0; i < 28; i++) {
    const x = 12 + i * 11
    ctx.beginPath()
    ctx.moveTo(x, ROOM_H)
    for (let w = 0; w < 9; w++) ctx.lineTo(x + w * 6, WALL_H + 40 + Math.sin((i + w) * 0.7) * 28)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  _windowFrame(ctx, 100, 6, 120, 52, C)
  ctx.fillStyle = C.ink
  ctx.fillRect(40, 44, 28, 40)
  ctx.fillRect(252, 44, 28, 40)
  ctx.fillRect(56, 132, 96, 20)
  ctx.fillRect(176, 132, 96, 20)
  ctx.fillStyle = C.soft
  ctx.fillRect(136, 112, 48, 4)
  ctx.strokeStyle = C.ink
  ctx.beginPath(); ctx.moveTo(160, 112); ctx.lineTo(160, 64); ctx.stroke()
  ctx.beginPath(); ctx.arc(160, 58, 7, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill()
}

function _drawKitchen(ctx, C) {
  ctx.strokeStyle = C.line
  ctx.globalAlpha = 0.3
  for (let y = WALL_H + 6; y < ROOM_H; y += 12)
    for (let x = 4; x < ROOM_W; x += 12) {
      ctx.strokeRect(x, y, 10, 10)
    }
  ctx.globalAlpha = 1
  _windowFrame(ctx, 120, 8, 80, 48, C)
  ctx.fillStyle = C.soft
  ctx.fillRect(8, 40, 200, 14)
  ctx.fillRect(8, 54, 14, 8)
  ctx.fillStyle = C.ink
  ctx.fillRect(52, 46, 36, 4)
  ctx.fillRect(108, 46, 40, 4)
  ctx.beginPath(); ctx.arc(72, 50, 6, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(130, 50, 6, 0, Math.PI * 2); ctx.fill()
  ctx.fillRect(248, 34, 56, 72)
  ctx.fillRect(96, 108, 128, 12)
  ctx.fillStyle = C.soft
  for (const [x, y] of [[88, 124], [152, 124], [88, 92], [152, 92]])
    ctx.fillRect(x, y, 16, 12)
}

function _drawArt(ctx, C) {
  ctx.fillStyle = C.line
  ctx.globalAlpha = 0.12
  const seeded = (n) => ((Math.sin(n * 12.9898) * 43758.5453) % 1 + 1) % 1
  for (let i = 0; i < 120; i++) {
    const x = seeded(i) * ROOM_W
    const y = WALL_H + seeded(i + 17) * (ROOM_H - WALL_H)
    ctx.fillRect(x, y, 2, 2)
  }
  ctx.globalAlpha = 1
  _windowFrame(ctx, 96, 6, 128, 52, C)
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(178, 160); ctx.lineTo(160, 64); ctx.lineTo(142, 160)
  ctx.stroke()
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(150, 72); ctx.lineTo(170, 72); ctx.stroke()
  ctx.lineWidth = 2
  ctx.strokeRect(32, 76, 72, 56)
  ctx.fillStyle = C.soft
  ctx.fillRect(38, 82, 60, 44)
  ctx.fillStyle = C.ink
  ctx.fillRect(12, 96, 88, 10)
  ctx.fillRect(200, 88, 48, 64)
}

function _drawBedroom(ctx, C) {
  _floorGrid(ctx, C)
  _windowFrame(ctx, 104, 6, 112, 52, C)
  ctx.fillStyle = C.ink
  ctx.fillRect(48, 56, 144, 36)
  ctx.fillStyle = C.soft
  ctx.fillRect(52, 60, 136, 8)
  ctx.fillStyle = C.ink
  ctx.fillRect(208, 68, 20, 24)
  ctx.fillRect(72, 64, 8, 10)
  ctx.fillRect(232, 40, 64, 96)
  ctx.fillRect(16, 80, 40, 56)
  ctx.fillStyle = C.line
  ctx.fillRect(108, 124, 72, 56)
}

const ROOM_DRAW = {
  study: _drawStudy, gaming: _drawGaming, chill: _drawChill, gym: _drawGym,
  library: _drawLibrary, music: _drawMusic, kitchen: _drawKitchen, art: _drawArt,
  bedroom: _drawBedroom,
}

// ── Sprite state ───────────────────────────────────────────────────────────
const spriteState = new Map()

// ── Scene elements map ─────────────────────────────────────────────────────
const sceneCanvases = new Map()

// ── Build dorm (3-col grid + outdoor spanning full width) ──────────────────
export async function buildDorm(rooms) {
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

// ── Draw room — procedural monochrome (no tileset) ─────────────────────────
function _drawRoom(ctx, room) {
  const theme = room.typeId
  const C = MONO[theme] || MONO.study
  ctx.imageSmoothingEnabled = false

  ctx.fillStyle = C.floor
  ctx.fillRect(0, WALL_H, ROOM_W, ROOM_H - WALL_H)

  ctx.fillStyle = C.wall
  ctx.fillRect(0, 0, ROOM_W, WALL_H)

  const draw = ROOM_DRAW[theme] || ROOM_DRAW.study
  draw(ctx, C)

  ctx.fillStyle = C.soft
  ctx.fillRect(0, WALL_H - 2, ROOM_W, 2)
  ctx.fillStyle = C.ink
  ctx.fillRect(0, 0, ROOM_W, 1)
  ctx.fillRect(0, ROOM_H - 2, ROOM_W, 2)
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
    startX = 4 + Math.random() * (88 - SPRITE_W_PCT)
    startY = 1 + Math.random() * 14          // bottom % — keeps feet on the floor
    cvs.style.left   = startX + '%'
    cvs.style.bottom = startY + '%'
    cvs.style.top    = 'auto'
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
    ss.x = 4 + Math.random() * (88 - SPRITE_W_PCT)
    ss.y = 1 + Math.random() * 14
    ss.cvs.style.left   = ss.x + '%'
    ss.cvs.style.bottom = ss.y + '%'
    ss.cvs.style.top    = 'auto'
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
        ss.targetX = 4 + Math.random() * (88 - SPRITE_W_PCT)
        ss.targetY = 1 + Math.random() * 14
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
        ss.cvs.style.left   = ss.x + '%'
        ss.cvs.style.bottom = ss.y + '%'
      }
      ss.cvs.style.zIndex = String(ss.isOutdoor ? Math.floor(ss.y) : Math.floor(100 - ss.y))
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
  })
  ctx.restore()

  const tint = ss.isOutdoor ? nightAlpha : nightAlpha * 0.15
  if (tint > 0) {
    ctx.fillStyle = `rgba(0,0,0,${(tint * 0.4).toFixed(3)})`
    ctx.fillRect(0, 0, ss.cvs.width, ss.cvs.height)
  }

  if (pose === 'sleep') {
    drawZzz(ctx, ss.zzzPhase || 0, ss.cvs.width)
  }
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
      ctx.fillStyle = `rgba(0, 0, 0, ${(night * 0.12).toFixed(3)})`
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
