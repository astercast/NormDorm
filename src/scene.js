import { ACTIVITY_META } from './constants.js'
import { drawNormieSprite, drawZzz, SPRITE_W, SPRITE_H, SPRITE_FEET_Y } from './pixel-renderer.js'

// ── Constants ──────────────────────────────────────────────────────────────
const TILE    = 16
const SCALE   = 2
const TS      = TILE * SCALE

const ROOM_TILES_W = 10
const ROOM_TILES_H = 7
const ROOM_W = ROOM_TILES_W * TS   // 320px
const ROOM_H = ROOM_TILES_H * TS   // 224px
const WALL_H = TS * 2              // 64px

const NORMIE_SCALE         = 1.9          // indoor room sprite scale
const OUTDOOR_NORMIE_SCALE = 1.1          // outdoor — must fit inside 180px mobile scene
const SPRITE_W_PCT  = (SPRITE_W * NORMIE_SCALE) / ROOM_W * 100

// Outdoor scene layout — keep in sync with .out-ground in style.css
const OUTDOOR_GROUND_PX = 56
const OUT_FOOT_OFFSET   = (SPRITE_H - SPRITE_FEET_Y) * OUTDOOR_NORMIE_SCALE  // 4 * 1.1 = 4.4
// Sprite `bottom` CSS so feet land exactly on the horizon line
const OUTDOOR_FEET_Y    = OUTDOOR_GROUND_PX - OUT_FOOT_OFFSET   // 56 - 4.4 = ~52px

// ── Minimal monochrome rooms: back layer + front occlusion layer ─────────
// Normie sprites sit in .room-sprite-layer between the two canvases.

const MONO = {
  study:   { wall:'#F3F1ED', floor:'#FAF8F4', ink:'#141210', dim:'#3A3834', soft:'#9E9A94', glass:'#DCE8F2', screen:'#0A1018' },
  gaming:  { wall:'#F2F0EC', floor:'#F9F7F2', ink:'#10100C', dim:'#2C2A24', soft:'#908C86', glass:'#D6E2EC', screen:'#050818' },
  chill:   { wall:'#F4F2EE', floor:'#FAF8F4', ink:'#131210', dim:'#34322C', soft:'#96928A', glass:'#E2E4E0', screen:'#0C0C0C' },
  gym:     { wall:'#F1F0EC', floor:'#F7F6F0', ink:'#12110E', dim:'#302E28', soft:'#8A8880', glass:'#D8E2EA', screen:'#101418' },
  library: { wall:'#F5F3EF', floor:'#FAF8F4', ink:'#14120E', dim:'#36342C', soft:'#989388', glass:'#E6E0D4', screen:'#0C1418' },
  music:   { wall:'#F1EFEB', floor:'#F7F5F0', ink:'#131210', dim:'#323028', soft:'#8E8A84', glass:'#E0DEDA', screen:'#08080C' },
  kitchen: { wall:'#F6F5F1', floor:'#FAF9F5', ink:'#151410', dim:'#343230', soft:'#949088', glass:'#E4EAE6', screen:'#161412' },
  art:     { wall:'#F3F2EE', floor:'#FAF8F4', ink:'#131110', dim:'#323028', soft:'#969088', glass:'#E2E0DA', screen:'#121210' },
  bedroom: { wall:'#F5F4F0', floor:'#FBF9F5', ink:'#141210', dim:'#343230', soft:'#969188', glass:'#E6E4DC', screen:'#161412' },
}

function _shell(ctx, C) {
  ctx.fillStyle = C.wall; ctx.fillRect(0, 0, ROOM_W, WALL_H)
  const wg = ctx.createLinearGradient(0, 0, 0, WALL_H)
  wg.addColorStop(0, 'rgba(255,255,255,0.16)'); wg.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = wg; ctx.fillRect(0, 0, ROOM_W, WALL_H)
  ctx.fillStyle = C.floor; ctx.fillRect(0, WALL_H, ROOM_W, ROOM_H - WALL_H)
  const fg = ctx.createLinearGradient(0, ROOM_H - 48, 0, ROOM_H)
  fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,0.045)')
  ctx.fillStyle = fg; ctx.fillRect(0, ROOM_H - 48, ROOM_W, 48)
  ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.fillRect(0, WALL_H - 2, ROOM_W, 2)
  ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.2
  ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, ROOM_W - 1, ROOM_H - 1)
  ctx.globalAlpha = 1
}

function _winT(ctx, C, x, y, w, h) {
  ctx.fillStyle = C.soft; ctx.globalAlpha = 0.4; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1
  ctx.fillStyle = C.glass; ctx.fillRect(x + 3, y + 3, w - 6, h - 6)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h)
}

function _f(ctx, C, x, y, w, h) {
  ctx.fillStyle = C.dim; ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.4; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); ctx.globalAlpha = 1
}

function _scr(ctx, C, x, y, w, h) {
  ctx.fillStyle = C.dim; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = C.screen; ctx.fillRect(x + 3, y + 3, w - 6, h - 6)
  ctx.strokeStyle = C.ink; ctx.strokeRect(x, y, w, h)
}

const ROOM_LAYERS = {
  study: {
    back(ctx, C) {
      _shell(ctx, C)
      _winT(ctx, C, 118, 8, 84, 44)
      ctx.strokeStyle = C.soft; ctx.globalAlpha = 0.5; ctx.lineWidth = 1
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo(124, 14 + i * 8); ctx.lineTo(196, 14 + i * 8); ctx.stroke()
      }
      ctx.globalAlpha = 1
      _f(ctx, C, 244, 10, 68, 48)
      _scr(ctx, C, 26, 56, 56, 34)
      ctx.fillStyle = C.dim; ctx.fillRect(14, 98, 130, 18)
      ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.35; ctx.strokeRect(14, 98, 130, 18); ctx.globalAlpha = 1
    },
    front(ctx, C) {
      ctx.clearRect(0, 0, ROOM_W, ROOM_H)
      _f(ctx, C, 14, 112, 132, 14)
      _f(ctx, C, 22, 132, 46, 32)
      _f(ctx, C, 254, 158, 8, 54)
      ctx.fillStyle = C.soft; ctx.beginPath(); ctx.arc(258, 154, 10, Math.PI, 0); ctx.fill()
    },
  },
  gaming: {
    back(ctx, C) {
      _shell(ctx, C)
      ctx.fillStyle = 'rgba(20,40,90,0.06)'; ctx.fillRect(0, ROOM_H - 16, ROOM_W, 8)
      _scr(ctx, C, 62, 46, 196, 62)
      _scr(ctx, C, 224, 56, 64, 48)
      ctx.fillStyle = C.dim; ctx.fillRect(26, 96, 268, 16)
    },
    front(ctx, C) {
      ctx.clearRect(0, 0, ROOM_W, ROOM_H)
      _f(ctx, C, 26, 108, 268, 22)
      _f(ctx, C, 48, 128, 58, 62)
      _f(ctx, C, 26, 100, 28, 48)
    },
  },
  chill: {
    back(ctx, C) {
      _shell(ctx, C)
      _scr(ctx, C, 96, 10, 128, 48)
      ctx.fillStyle = C.dim; ctx.globalAlpha = 0.18; ctx.fillRect(62, 132, 196, 72); ctx.globalAlpha = 1
      ctx.fillStyle = C.soft; ctx.fillRect(48, 118, 224, 20)
    },
    front(ctx, C) {
      ctx.clearRect(0, 0, ROOM_W, ROOM_H)
      _f(ctx, C, 44, 132, 232, 22)
      _f(ctx, C, 94, 168, 132, 24)
      _f(ctx, C, 14, 168, 18, 20)
      _f(ctx, C, 284, 160, 8, 48)
      ctx.fillStyle = C.soft; ctx.beginPath(); ctx.arc(288, 156, 9, Math.PI, 0); ctx.fill()
    },
  },
  gym: {
    back(ctx, C) {
      _shell(ctx, C)
      _winT(ctx, C, 14, 8, 72, 46); _winT(ctx, C, 234, 8, 72, 46)
      ctx.fillStyle = C.dim; ctx.fillRect(76, 14, 168, 6)
      ctx.fillStyle = C.soft; ctx.fillRect(18, 142, 108, 28)
      ctx.fillStyle = C.dim; ctx.fillRect(198, 132, 108, 24)
    },
    front(ctx, C) {
      ctx.clearRect(0, 0, ROOM_W, ROOM_H)
      _f(ctx, C, 14, 158, 112, 36)
      _f(ctx, C, 196, 146, 116, 30)
      _f(ctx, C, 32, 170, 40, 8)
    },
  },
  library: {
    back(ctx, C) {
      _shell(ctx, C)
      ctx.strokeStyle = C.soft; ctx.globalAlpha = 0.45; ctx.lineWidth = 1
      for (let r = 0; r < 3; r++) {
        ctx.beginPath(); ctx.moveTo(10, 18 + r * 18); ctx.lineTo(310, 18 + r * 18); ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = C.dim; ctx.fillRect(8, 62, 54, 96); ctx.fillRect(258, 62, 54, 96)
      ctx.fillStyle = C.soft; ctx.fillRect(88, 152, 144, 20)
    },
    front(ctx, C) {
      ctx.clearRect(0, 0, ROOM_W, ROOM_H)
      _f(ctx, C, 88, 168, 144, 28)
      _f(ctx, C, 98, 182, 38, 28)
      _f(ctx, C, 190, 182, 38, 28)
    },
  },
  music: {
    back(ctx, C) {
      _shell(ctx, C)
      ctx.strokeStyle = C.soft; ctx.globalAlpha = 0.35
      for (let i = 0; i < 10; i++) {
        ctx.beginPath(); ctx.moveTo(16 + i * 32, 4); ctx.lineTo(16 + i * 32, WALL_H); ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = C.dim; ctx.fillRect(40, 100, 200, 26)
      ctx.fillStyle = '#EDEDE8'; ctx.fillRect(44, 88, 192, 10)
    },
    front(ctx, C) {
      ctx.clearRect(0, 0, ROOM_W, ROOM_H)
      _f(ctx, C, 40, 122, 200, 38)
      _f(ctx, C, 14, 178, 56, 44)
      ctx.strokeStyle = C.dim; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(168, 186); ctx.lineTo(168, 120); ctx.stroke()
      ctx.fillStyle = C.soft; ctx.beginPath(); ctx.ellipse(168, 112, 8, 13, 0, 0, Math.PI * 2); ctx.fill()
      _f(ctx, C, 254, 170, 52, 48)
    },
  },
  kitchen: {
    back(ctx, C) {
      _shell(ctx, C)
      _winT(ctx, C, 118, 8, 84, 48)
      ctx.fillStyle = C.soft; ctx.fillRect(10, 104, 200, 52)
      _f(ctx, C, 258, 78, 54, 92)
    },
    front(ctx, C) {
      ctx.clearRect(0, 0, ROOM_W, ROOM_H)
      _f(ctx, C, 10, 152, 200, 28)
      _f(ctx, C, 258, 126, 54, 62)
      _f(ctx, C, 36, 174, 22, 10)
      _f(ctx, C, 70, 174, 22, 10)
    },
  },
  art: {
    back(ctx, C) {
      _shell(ctx, C)
      _winT(ctx, C, 196, 6, 116, 56)
      ctx.strokeStyle = C.dim; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(148, 192); ctx.lineTo(134, 86); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(172, 192); ctx.lineTo(186, 86); ctx.stroke()
      ctx.fillStyle = C.wall; ctx.fillRect(128, 76, 64, 78)
      ctx.strokeStyle = C.ink; ctx.strokeRect(128, 76, 64, 78)
      _f(ctx, C, 12, 142, 90, 22)
    },
    front(ctx, C) {
      ctx.clearRect(0, 0, ROOM_W, ROOM_H)
      _f(ctx, C, 12, 160, 92, 36)
      _f(ctx, C, 216, 142, 48, 58)
      _f(ctx, C, 144, 186, 34, 10)
    },
  },
  bedroom: {
    back(ctx, C) {
      _shell(ctx, C)
      _winT(ctx, C, 108, 8, 104, 48)
      ctx.fillStyle = C.soft; ctx.fillRect(20, 126, 152, 36)
      ctx.fillStyle = C.dim; ctx.fillRect(238, 68, 72, 104)
      _scr(ctx, C, 168, 104, 46, 30)
    },
    front(ctx, C) {
      ctx.clearRect(0, 0, ROOM_W, ROOM_H)
      _f(ctx, C, 18, 154, 152, 40)
      _f(ctx, C, 170, 148, 72, 24)
      _f(ctx, C, 238, 160, 72, 84)
    },
  },
}

function _drawRoomLayers(backCtx, frontCtx, room) {
  const C = MONO[room.typeId] || MONO.study
  const L = ROOM_LAYERS[room.typeId] || ROOM_LAYERS.study
  backCtx.save(); frontCtx.save()
  backCtx.imageSmoothingEnabled = true
  frontCtx.imageSmoothingEnabled = true
  L.back(backCtx, C)
  frontCtx.clearRect(0, 0, ROOM_W, ROOM_H)
  L.front(frontCtx, C)
  backCtx.restore(); frontCtx.restore()
}
// ── Activity classification ────────────────────────────────────────────────
const WALK_ACTS = new Set(['walking', 'outside', 'exercising', 'dancing'])

// ── Per-room furniture anchor spots (x=left%, y=bottom%) ──────────────────
// x: left edge of sprite as % of room width (valid: 4 – ~69)
// y: bottom edge of sprite as % of room height
//    ~6–10% = floor/front,  ~22–30% = at furniture depth
const DEFAULT_SPOTS = [{ x:25, y:6 }, { x:45, y:6 }, { x:62, y:6 }]

const ROOM_ACTIVITY_SPOTS = {
  study: {
    studying:   [{ x:4,  y:28 }],
    coding:     [{ x:4,  y:28 }],
    gaming:     [{ x:4,  y:28 }],
    reading:    [{ x:4,  y:28 }, { x:54, y:8 }],
    eating:     [{ x:4,  y:28 }],
    sketching:  [{ x:4,  y:28 }],
    journaling: [{ x:4,  y:28 }, { x:54, y:8 }],
    chatting:   [{ x:36, y:8  }, { x:52, y:8  }],
    showering:  [{ x:58, y:8  }],
    _default:   [{ x:26, y:8  }, { x:46, y:8  }, { x:60, y:8  }],
  },
  gaming: {
    gaming:     [{ x:14, y:28 }],
    coding:     [{ x:14, y:28 }],
    studying:   [{ x:14, y:28 }],
    watching:   [{ x:14, y:28 }, { x:34, y:28 }],
    eating:     [{ x:46, y:8  }],
    chatting:   [{ x:46, y:8  }, { x:60, y:8  }],
    sketching:  [{ x:46, y:8  }],
    _default:   [{ x:30, y:8  }, { x:50, y:8  }, { x:64, y:8  }],
  },
  chill: {
    gaming:     [{ x:9,  y:28 }, { x:34, y:28 }, { x:57, y:28 }],
    watching:   [{ x:9,  y:28 }, { x:34, y:28 }, { x:57, y:28 }],
    chatting:   [{ x:9,  y:28 }, { x:34, y:28 }, { x:57, y:28 }],
    reading:    [{ x:9,  y:28 }, { x:57, y:28 }],
    eating:     [{ x:34, y:28 }, { x:50, y:28 }],
    napping:    [{ x:18, y:28 }],
    meditating: [{ x:48, y:8  }],
    dancing:    [{ x:38, y:8  }, { x:55, y:8  }],
    cooking:    [{ x:62, y:8  }],
    sketching:  [{ x:12, y:8  }],
    _default:   [{ x:22, y:8  }, { x:44, y:28 }, { x:60, y:8  }],
  },
  gym: {
    exercising: [{ x:5,  y:28 }, { x:22, y:28 }],
    yoga:       [{ x:38, y:8  }, { x:54, y:8  }],
    walking:    [{ x:5,  y:28 }, { x:22, y:28 }],
    showering:  [{ x:60, y:8  }],
    chatting:   [{ x:42, y:8  }, { x:56, y:8  }],
    meditating: [{ x:42, y:8  }],
    dancing:    [{ x:38, y:8  }, { x:54, y:8  }],
    _default:   [{ x:28, y:8  }, { x:46, y:8  }, { x:60, y:8  }],
  },
  library: {
    reading:    [{ x:18, y:24 }, { x:34, y:24 }, { x:50, y:24 }],
    studying:   [{ x:18, y:24 }, { x:34, y:24 }],
    sketching:  [{ x:50, y:24 }],
    journaling: [{ x:18, y:24 }, { x:50, y:24 }],
    meditating: [{ x:36, y:8  }],
    chatting:   [{ x:18, y:24 }, { x:50, y:24 }],
    napping:    [{ x:36, y:24 }],
    _default:   [{ x:22, y:8  }, { x:42, y:24 }, { x:58, y:8  }],
  },
  music: {
    jamming:    [{ x:11, y:28 }],
    dancing:    [{ x:38, y:8  }, { x:54, y:8  }],
    chatting:   [{ x:38, y:8  }, { x:54, y:8  }],
    sketching:  [{ x:26, y:8  }],
    meditating: [{ x:48, y:8  }],
    exercising: [{ x:7,  y:28 }],
    _default:   [{ x:26, y:8  }, { x:46, y:8  }, { x:60, y:8  }],
  },
  kitchen: {
    cooking:    [{ x:18, y:28 }, { x:36, y:28 }],
    eating:     [{ x:18, y:28 }, { x:36, y:28 }],
    chatting:   [{ x:44, y:8  }, { x:57, y:8  }],
    walking:    [{ x:32, y:8  }, { x:50, y:8  }],
    _default:   [{ x:20, y:8  }, { x:38, y:28 }, { x:54, y:8  }],
  },
  art: {
    sketching:  [{ x:32, y:28 }],
    studying:   [{ x:32, y:28 }],
    journaling: [{ x:18, y:8  }, { x:50, y:8  }],
    meditating: [{ x:18, y:8  }],
    chatting:   [{ x:18, y:8  }, { x:60, y:8  }],
    reading:    [{ x:6,  y:8  }],
    dancing:    [{ x:46, y:8  }, { x:60, y:8  }],
    _default:   [{ x:22, y:8  }, { x:42, y:28 }, { x:60, y:8  }],
  },
  bedroom: {
    sleeping:   [{ x:5,  y:28 }, { x:32, y:28 }],
    napping:    [{ x:5,  y:28 }, { x:32, y:28 }],
    reading:    [{ x:49, y:28 }],
    studying:   [{ x:49, y:28 }],
    gaming:     [{ x:49, y:28 }],
    watching:   [{ x:5,  y:28 }, { x:32, y:28 }],
    sketching:  [{ x:49, y:28 }],
    journaling: [{ x:49, y:28 }],
    chatting:   [{ x:26, y:8  }, { x:46, y:8  }],
    _default:   [{ x:20, y:8  }, { x:40, y:28 }, { x:56, y:8  }],
  },
}

function _getSpot(normie, ss) {
  if (ss.isOutdoor) return null
  const roomId  = ss.sceneEl?.id?.replace('roomwrap-', '')
  const roomRec = sceneCanvases.get(roomId)
  if (!roomRec) return null
  const spots = ROOM_ACTIVITY_SPOTS[roomRec.room.typeId]?.[normie.activity]
    ?? ROOM_ACTIVITY_SPOTS[roomRec.room.typeId]?._default
    ?? DEFAULT_SPOTS
  return spots[normie.id % spots.length]
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
    roomWrap.dataset.dropRoom = room.id
    const strip = document.createElement('div')
    strip.className = 'room-strip'
    strip.innerHTML = `
      <span class="rs-icon">${_roomIcon(room.typeId)}</span>
      <span class="rs-name">${room.typeName}</span>
      <span class="rs-occ" id="occ-${room.id}">0/${room.maxOcc}</span>`
    roomWrap.appendChild(strip)

    const roomScene = document.createElement('div')
    roomScene.className = 'room-scene'

    const canvasBack = document.createElement('canvas')
    canvasBack.width  = ROOM_W
    canvasBack.height = ROOM_H
    canvasBack.className = 'room-canvas room-canvas-back'
    canvasBack.id = `canvas-back-${room.id}`

    const spriteLayer = document.createElement('div')
    spriteLayer.className = 'room-sprite-layer'
    spriteLayer.id = `sprites-${room.id}`

    const canvasFront = document.createElement('canvas')
    canvasFront.width  = ROOM_W
    canvasFront.height = ROOM_H
    canvasFront.className = 'room-canvas room-canvas-front'
    canvasFront.id = `canvas-front-${room.id}`

    roomScene.appendChild(canvasBack)
    roomScene.appendChild(spriteLayer)
    roomScene.appendChild(canvasFront)
    roomWrap.appendChild(roomScene)

    const ctxBack  = canvasBack.getContext('2d')
    const ctxFront = canvasFront.getContext('2d')
    _drawRoomLayers(ctxBack, ctxFront, room)

    sceneCanvases.set(room.id, {
      canvasBack, ctxBack, canvasFront, ctxFront, room, spriteLayer,
    })
    sceneEls[room.id] = roomWrap
    roomGrid.appendChild(roomWrap)
  }

  wrap.appendChild(roomGrid)

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

// ── Outdoor DOM ────────────────────────────────────────────────────────────
// ── The Quad: minimal, modern, with a single clean horizon line ─────────────
//
// Layout (heights):
//   sky      → full
//   horizon  → @ bottom: 64px  (the FLOOR top — sprites land here)
//   ground   → bottom 64px tall
//
// Props are positioned via `left: %` so the scene reflows responsively.
function _buildOutdoorDOM(room) {
  const wrap = document.createElement('div')
  wrap.className = 'room-wrap outdoor-wrap'
  wrap.id = `roomwrap-outdoor`
  wrap.dataset.dropRoom = 'outdoor'

  const strip = document.createElement('div')
  strip.className = 'room-strip outdoor-strip'
  strip.innerHTML = `
    <span class="rs-name">The Quad</span>
    <span class="rs-occ" id="occ-outdoor">0 in quad</span>`
  wrap.appendChild(strip)

  const scene = document.createElement('div')
  scene.className = 'outdoor-scene'
  scene.id = 'scene-outdoor'

  // Sky
  const sky = document.createElement('div')
  sky.className = 'out-sky'
  sky.id = 'outdoor-sky'
  const sun = document.createElement('div')
  sun.className = 'out-sun'; sun.id = 'sun'
  sky.appendChild(sun)
  const moon = document.createElement('div')
  moon.className = 'out-moon'; moon.id = 'moon'
  sky.appendChild(moon)
  // Subtle stars (only visible at night)
  for (let i = 0; i < 24; i++) {
    const s = document.createElement('div')
    s.className = 'out-star'
    s.style.cssText = `left:${Math.random()*100}%;top:${(2 + Math.random() * 50).toFixed(1)}%;animation-delay:${(Math.random()*4).toFixed(1)}s`
    sky.appendChild(s)
  }
  // Distant silhouette (single layer, very low opacity)
  const skyline = document.createElement('div')
  skyline.className = 'out-skyline'
  ;[42,68,38,80,52,30,72,46,60,34].forEach(h => {
    const b = document.createElement('div')
    b.className = 'out-skyline-bldg'; b.style.height = h + 'px'
    skyline.appendChild(b)
  })
  sky.appendChild(skyline)
  scene.appendChild(sky)

  // Ground — flat, single tone, with subtle path
  const ground = document.createElement('div')
  ground.className = 'out-ground'; ground.id = 'outdoor-ground'
  scene.appendChild(ground)

  // Horizon line (visible thin separator at ground top)
  const horizon = document.createElement('div')
  horizon.className = 'out-horizon'
  scene.appendChild(horizon)

  // Objects layer — small, well-spaced, percentage-positioned
  const objs = document.createElement('div')
  objs.className = 'out-objects'; scene.appendChild(objs)
  ;[
    _mkOutTree(6,  'oak'),
    _mkOutTree(28, 'pine'),
    _mkOutBench(46),
    _mkOutLamp(63),
    _mkOutTree(78, 'oak'),
    _mkOutBench(93),
  ].forEach(el => objs.appendChild(el))

  wrap.appendChild(scene)
  return wrap
}

function _mkOutTree(xPct, type) {
  const t = document.createElement('div')
  t.className = `out-tree ot-${type}`; t.style.left = xPct + '%'
  if (type === 'oak') {
    t.innerHTML = `
      <div class="oak-canopy"></div>
      <div class="oak-trunk"></div>`
  } else {
    t.innerHTML = `
      <div class="pine-l1"></div>
      <div class="pine-l2"></div>
      <div class="pine-l3"></div>
      <div class="pine-trunk"></div>`
  }
  return t
}
function _mkOutBench(xPct) {
  const b = document.createElement('div')
  b.className = 'out-bench'; b.style.left = xPct + '%'
  b.innerHTML = `
    <div class="ob-seat"></div>
    <div class="ob-legs"><span></span><span></span></div>`
  return b
}
function _mkOutLamp(xPct) {
  const l = document.createElement('div')
  l.className = 'out-lamp'; l.style.left = xPct + '%'
  l.innerHTML = `
    <div class="ol-head"></div>
    <div class="ol-pole"></div>`
  return l
}

function _roomIdFromPoint(x, y) {
  const stack = document.elementsFromPoint(x, y)
  for (const el of stack) {
    const byData = el.closest?.('[data-drop-room]')
    if (byData?.dataset?.dropRoom) return byData.dataset.dropRoom
    const wrap = el.closest?.('[id^="roomwrap-"]')
    if (wrap?.id?.startsWith('roomwrap-')) return wrap.id.slice(9)
  }
  return null
}

// ── Drag & Drop ───────────────────────────────────────────────────────────────
// Document-level pointer tracking so drops register over any room, not only the sprite canvas.
let _drag            = null
let _lastDragId      = null
let _dragBlockTimer  = null

function _startDrag(normie, srcCvs, e) {
  if (_drag) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  const pointerId = e.pointerId
  const ghost = document.createElement('canvas')
  ghost.width  = srcCvs.width
  ghost.height = srcCvs.height
  ghost.style.cssText =
    'position:fixed;pointer-events:none;image-rendering:pixelated;z-index:10000;' +
    'opacity:0.9;transform:translate(-50%,-90%) scale(1.12);' +
    'filter:drop-shadow(0 8px 24px rgba(0,0,0,0.45));transition:none;touch-action:none'
  ghost.getContext('2d').drawImage(srcCvs, 0, 0)
  document.body.appendChild(ghost)
  ghost.style.left = e.clientX + 'px'
  ghost.style.top  = e.clientY + 'px'
  srcCvs.style.opacity = '0.2'
  document.body.style.userSelect = 'none'
  document.body.style.webkitUserSelect = 'none'

  const onMove = (ev) => { if (_drag) _updateDrag(ev) }
  const onUp = (ev) => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp, true)
    document.removeEventListener('pointercancel', onUp, true)
    if (_drag && _drag.normieId === normie.id) _endDrag(ev)
  }
  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp, true)
  document.addEventListener('pointercancel', onUp, true)

  _drag = { normieId: normie.id, srcCvs, ghost, pointerId, startX: e.clientX, startY: e.clientY, moved: false }
  try { srcCvs.setPointerCapture(pointerId) } catch { /* touch / some browsers */ }
}

function _updateDrag(e) {
  if (!_drag) return
  _drag.ghost.style.left = e.clientX + 'px'
  _drag.ghost.style.top  = e.clientY + 'px'
  if (!_drag.moved && Math.hypot(e.clientX - _drag.startX, e.clientY - _drag.startY) > 8) _drag.moved = true
  if (!_drag.moved) return
  _drag.ghost.style.display = 'none'
  const over = _roomIdFromPoint(e.clientX, e.clientY)
  _drag.ghost.style.display = ''
  document.querySelectorAll('.room-drop-active').forEach(el => el.classList.remove('room-drop-active'))
  if (over != null) document.getElementById('roomwrap-' + over)?.classList.add('room-drop-active')
}

function _endDrag(e) {
  if (!_drag) return
  const { normieId, srcCvs, ghost, moved, pointerId } = _drag
  _drag = null
  try { srcCvs.releasePointerCapture(pointerId) } catch { /* ignore */ }

  let roomId = null
  ghost.remove()
  srcCvs.style.opacity = ''
  document.body.style.userSelect = ''
  document.body.style.webkitUserSelect = ''
  document.querySelectorAll('.room-drop-active').forEach(el => el.classList.remove('room-drop-active'))
  if (moved) roomId = _roomIdFromPoint(e.clientX, e.clientY)
  if (!moved) return
  if (roomId != null) {
    _lastDragId = normieId
    clearTimeout(_dragBlockTimer)
    _dragBlockTimer = setTimeout(() => { _lastDragId = null }, 100)
    document.dispatchEvent(new CustomEvent('normie-drop', { detail: { id: normieId, roomId } }))
  }
}

// ── Sprite system ──────────────────────────────────────────────────────────
export function placeSprite(normie, sceneEl) {
  removeSprite(normie.id)
  if (!sceneEl) return

  const isOutdoor = sceneEl.classList.contains('outdoor-wrap')
  const scale = isOutdoor ? OUTDOOR_NORMIE_SCALE : NORMIE_SCALE

  const cvs = document.createElement('canvas')
  cvs.id = `sprite-${normie.id}`
  cvs.className = 'normie-sprite'
  cvs.width  = Math.round(SPRITE_W * scale)
  cvs.height = Math.round(SPRITE_H * scale)
  cvs.style.cssText = `position:absolute;cursor:pointer;image-rendering:pixelated;z-index:10`

  const container = isOutdoor
    ? sceneEl.querySelector('.out-objects') || sceneEl
    : sceneEl.querySelector('.room-sprite-layer') || sceneEl.querySelector('.room-scene') || sceneEl

  let startX, startY
  if (isOutdoor) {
    startX = 6 + Math.random() * 88
    startY = OUTDOOR_FEET_Y
    cvs.style.left   = startX.toFixed(1) + '%'
    cvs.style.bottom = startY.toFixed(1) + 'px'
    cvs.style.top    = 'auto'
  } else {
    startX = 4 + Math.random() * (88 - SPRITE_W_PCT)
    startY = 5
    cvs.style.left   = startX + '%'
    cvs.style.bottom = startY + '%'
    cvs.style.top    = 'auto'
    cvs.style.width  = SPRITE_W_PCT + '%'
    cvs.style.height = 'auto'
  }

  const ss = {
    cvs, sceneEl,
    x: startX,   targetX: startX,
    y: startY,   targetY: startY,
    isOutdoor,   scale,
    dir: 'right',
    walkPhase: 0,
    zzzPhase: Math.random() * Math.PI * 2,
    _lastDraw: 0,
    _moveTimer: 1 + Math.random() * 2,
    _atSpot: false,
  }
  spriteState.set(normie.id, ss)

  if (!isOutdoor && !WALK_ACTS.has(normie.activity)) {
    const spot = _getSpot(normie, ss)
    if (spot) { ss.targetX = spot.x; ss.targetY = spot.y }
  }

  _redrawSprite(normie, ss)

  cvs.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    _startDrag(normie, cvs, e)
  })
  cvs.addEventListener('click', e => {
    if (_lastDragId === normie.id) return  // swallow phantom click after drag
    e.stopPropagation()
    document.dispatchEvent(new CustomEvent('normie-click', { detail: { id: normie.id } }))
  })

  container.appendChild(cvs)
}

export function removeSprite(id) {
  document.getElementById(`sprite-${id}`)?.remove()
  spriteState.delete(id)
}

export function onActivityChanged(normie) {
  const ss = spriteState.get(normie.id)
  if (!ss) return
  ss._atSpot = false
  ss._moveTimer = 0
  if (!ss.isOutdoor && !WALK_ACTS.has(normie.activity)) {
    const spot = _getSpot(normie, ss)
    if (spot) { ss.targetX = spot.x; ss.targetY = spot.y }
  }
}

export function setSpriteScene(normie, newSceneEl) {
  const ss = spriteState.get(normie.id)
  if (!ss || !newSceneEl) return
  ss.cvs.remove()
  ss.sceneEl   = newSceneEl
  ss.isOutdoor = newSceneEl.classList.contains('outdoor-wrap')
  ss.scale     = ss.isOutdoor ? OUTDOOR_NORMIE_SCALE : NORMIE_SCALE
  ss._atSpot   = false
  ss._moveTimer = 0

  // Resize the canvas to match the new scale
  ss.cvs.width  = Math.round(SPRITE_W * ss.scale)
  ss.cvs.height = Math.round(SPRITE_H * ss.scale)

  const container = ss.isOutdoor
    ? newSceneEl.querySelector('.out-objects') || newSceneEl
    : newSceneEl.querySelector('.room-sprite-layer') || newSceneEl.querySelector('.room-scene') || newSceneEl

  if (ss.isOutdoor) {
    ss.x = Math.random() < 0.5 ? -8 : 105
    ss.y = OUTDOOR_FEET_Y
    ss.targetX = 10 + Math.random() * 80
    ss.targetY = OUTDOOR_FEET_Y
    ss.cvs.style.left   = ss.x.toFixed(1) + '%'
    ss.cvs.style.bottom = ss.y.toFixed(1) + 'px'
    ss.cvs.style.top    = 'auto'
    ss.cvs.style.width  = ''
    ss.cvs.style.height = ''
  } else {
    ss.x = Math.random() < 0.5 ? -20 : 90
    ss.y = 6 + Math.random() * 6
    if (!WALK_ACTS.has(normie.activity)) {
      const spot = _getSpot(normie, ss)
      if (spot) { ss.targetX = spot.x; ss.targetY = spot.y }
      else      { ss.targetX = 4 + Math.random() * (88 - SPRITE_W_PCT); ss.targetY = 6 }
    } else {
      ss.targetX = 4 + Math.random() * (88 - SPRITE_W_PCT)
      ss.targetY = 4 + Math.random() * 8
    }
    ss.cvs.style.left   = ss.x + '%'
    ss.cvs.style.bottom = ss.y + '%'
    ss.cvs.style.top    = 'auto'
    ss.cvs.style.width  = SPRITE_W_PCT + '%'
    ss.cvs.style.height = 'auto'
  }
  ss.walkPhase = 0.1
  container.appendChild(ss.cvs)
}

export function animateSprites(normieMap, nightAlpha, dt) {
  for (const [id, ss] of spriteState) {
    const normie = normieMap.get(id)
    if (!normie) continue

    const pose    = ACTIVITY_META[normie.activity]?.pose || 'stand'
    const isSleep = pose === 'sleep'
    const isWalk  = WALK_ACTS.has(normie.activity)

    if (!isSleep) {
      ss._moveTimer -= dt

      const preDx = ss.targetX - ss.x
      const preDy = ss.targetY - ss.y
      const preDist = Math.hypot(preDx, preDy)

      if (isWalk) {
        ss.walkPhase = (ss.walkPhase + dt * (3.6 + Math.min(preDist * 0.08, 2.5))) % 1
        if (ss._moveTimer <= 0) {
          if (ss.isOutdoor) {
            ss.targetX = 4   + Math.random() * 92
            ss.targetY = OUTDOOR_FEET_Y
          } else {
            ss.targetX = 6   + Math.random() * (82 - SPRITE_W_PCT)
            ss.targetY = 4.5 + Math.random() * 8.5
          }
          ss._moveTimer = 4 + Math.random() * 5
        }
      } else if (!ss.isOutdoor) {
        if (!ss._atSpot) {
          const spot = _getSpot(normie, ss)
          if (spot) { ss.targetX = spot.x; ss.targetY = spot.y }
        }
      } else {
        // Outdoor non-walk (meditating, reading, etc.): occasional re-position along horizon
        if (ss._moveTimer <= 0) {
          ss.targetX = 6   + Math.random() * 88
          ss.targetY = OUTDOOR_FEET_Y
          ss._moveTimer = 10 + Math.random() * 15
        }
      }
    } else {
      ss.walkPhase = 0
      ss._atSpot = true
    }

    // ── Movement ────────────────────────────────────────────────────────────
    const dx   = ss.targetX - ss.x
    const dy   = ss.targetY - ss.y
    const dist = Math.hypot(dx, dy)
    const kMove = (isWalk ? 6.2 : 3.6) * (ss.isOutdoor ? 1.12 : 1)
    const t = 1 - Math.exp(-kMove * dt)
    const near = ss.isOutdoor ? 1.2 : 0.12

    if (!isSleep && dist > near) {
      ss.x += dx * t
      ss.y += dy * t
      if (Math.abs(dx) > 0.04) ss.dir = dx < 0 ? 'left' : 'right'
      ss._atSpot = false
      if (!isWalk) ss.walkPhase = (ss.walkPhase + dt * (2.8 + Math.min(dist * 0.15, 2))) % 1
    } else if (!isSleep && !isWalk) {
      ss.x = ss.targetX
      ss.y = ss.targetY
      ss._atSpot  = true
      ss.walkPhase = 0
    } else if (!isSleep && isWalk && dist <= near) {
      ss.x = ss.targetX
      ss.y = ss.targetY
    }

    // ── CSS position ────────────────────────────────────────────────────────
    if (ss.isOutdoor) {
      ss.cvs.style.left   = ss.x.toFixed(2) + '%'
      ss.cvs.style.bottom = Math.round(ss.y) + 'px'
      /* depth: further right + lower px bottom → slightly higher z */
      ss.cvs.style.zIndex = String(24 + Math.floor(ss.x * 0.35) + Math.floor((OUTDOOR_FEET_Y - ss.y) * 0.15))
    } else {
      ss.cvs.style.left   = ss.x.toFixed(2) + '%'
      ss.cvs.style.bottom = ss.y.toFixed(2) + '%'
      /* Deeper into room (higher bottom %) → lower z; front of room → higher z (still under .room-canvas-front) */
      const z = 8 + Math.round((26 - ss.y) * 3.2)
      ss.cvs.style.zIndex = String(Math.max(2, Math.min(88, z)))
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
  const ctx   = ss.cvs.getContext('2d')
  const scale = ss.scale ?? NORMIE_SCALE
  ctx.clearRect(0, 0, ss.cvs.width, ss.cvs.height)

  // Draw the sprite at scale
  ctx.save()
  ctx.scale(scale, scale)
  const basePose    = ACTIVITY_META[normie.activity]?.pose || 'stand'
  const displayPose = (!ss._atSpot && ss.walkPhase > 0.01) ? 'walk' : basePose
  drawNormieSprite(ctx, normie.id, displayPose, ss.walkPhase, { direction: ss.dir })
  ctx.restore()

  // Night tint
  const tint = ss.isOutdoor ? nightAlpha : nightAlpha * 0.15
  if (tint > 0) {
    ctx.fillStyle = `rgba(0,0,0,${(tint * 0.4).toFixed(3)})`
    ctx.fillRect(0, 0, ss.cvs.width, ss.cvs.height)
  }

  if (basePose === 'sleep') drawZzz(ctx, ss.zzzPhase || 0, ss.cvs.width)
}

// ── Night overlay on room canvases ─────────────────────────────────────────
export function updateDayNight(gameMinute) {
  const hour  = (gameMinute / 60) % 24
  let night = 0
  if      (hour >= 20)   night = Math.min((hour - 20) / 3, 1)
  else if (hour < 6)     night = 1
  else if (hour < 8)     night = Math.max(1 - (hour - 6) / 2, 0)

  for (const [, { canvasBack, ctxBack, ctxFront, canvasFront, room }] of sceneCanvases) {
    _drawRoomLayers(ctxBack, ctxFront, room)
    if (night > 0) {
      const dim = `rgba(0, 0, 0, ${(night * 0.12).toFixed(3)})`
      ctxBack.fillStyle  = dim
      ctxBack.fillRect(0, 0, canvasBack.width, canvasBack.height)
      ctxFront.fillStyle = dim
      ctxFront.fillRect(0, 0, canvasFront.width, canvasFront.height)
    }
  }

  const sky    = document.getElementById('outdoor-sky')
  const sun    = document.getElementById('sun')
  const moon   = document.getElementById('moon')
  const ground = document.getElementById('outdoor-ground')
  if (sky)    sky.dataset.time    = night < 0.25 ? 'day' : night < 0.75 ? 'dusk' : 'night'
  if (sun)    sun.style.opacity   = Math.max(0, 1 - night * 2).toFixed(2)
  if (moon)   moon.style.opacity  = night > 0.5 ? ((night - 0.5) * 2).toFixed(2) : '0'
  if (ground) ground.dataset.time = night > 0.5 ? 'night' : 'day'

  return night
}

export function updateOccupancy(normies, rooms = []) {
  const maxByLoc = Object.fromEntries((rooms || []).map(r => [r.id, r.maxOcc]))
  const counts = {}
  for (const n of normies) counts[n.location] = (counts[n.location] || 0) + 1
  document.querySelectorAll('[id^="occ-"]').forEach(el => {
    const loc = el.id.replace('occ-', '')
    const count = counts[loc] || 0
    if (loc === 'outdoor') el.textContent = `${count} in quad`
    else {
      const max = maxByLoc[loc] ?? 12
      el.textContent = `${count}/${max}`
    }
  })
}
