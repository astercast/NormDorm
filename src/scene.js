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

const NORMIE_SCALE  = 2.2          // larger sprites → always visible
const SPRITE_W_PCT  = (SPRITE_W * NORMIE_SCALE) / ROOM_W * 100

// Outdoor scene layout — keep in sync with .out-ground in style.css
const OUTDOOR_GROUND_PX = 56                                  // ground band height (= horizon line)
// How far above the canvas BOTTOM the sprite's feet are drawn:
//   canvas_h = SPRITE_H * NORMIE_SCALE
//   feet_y_in_canvas = SPRITE_FEET_Y * NORMIE_SCALE
//   foot_offset = canvas_h - feet_y_in_canvas
const FOOT_OFFSET_PX    = (SPRITE_H - SPRITE_FEET_Y) * NORMIE_SCALE
// Sprite `bottom` CSS so feet land exactly on the horizon line
const OUTDOOR_FEET_Y    = OUTDOOR_GROUND_PX - FOOT_OFFSET_PX

// Vanishing point (1-point perspective)
const VP_X = ROOM_W / 2   // 160
const VP_Y = WALL_H        // 64

// ── Monochrome palettes — all light-wall, white-floor so normies pop ────────
// Palette key:
//   wall/wHi/wLo  → wall surface shades
//   floor/fLo     → floor shades
//   ink           → sharpest dark (outlines, hair)
//   dk            → very dark (furniture frames, shadows)
//   md            → mid-gray (secondary furniture faces)
//   sg             → soft gray (subtle fills, rugs, accents)
//   lt            → near-white detail (highlights, pillow surfaces)
//   screen        → monitor glass (deep blue-black)
//   glass         → window glazing
const MONO = {
  study: {
    wall:'#F5F3EF', wHi:'#FEFEFE', wLo:'#E8E5DE',
    floor:'#FAFAF7', fLo:'#F1EEE7',
    ink:'#16140E', dk:'#2A2820', md:'#6A6660', sg:'#B8B4AC', lt:'#E8E4DC',
    screen:'#0A1828', glass:'#E4EFF8',
  },
  gaming: {
    wall:'#F2F0EC', wHi:'#FAFAF8', wLo:'#E6E2DA',
    floor:'#F8F6F2', fLo:'#EEEAE2',
    ink:'#0E0C08', dk:'#1E1C16', md:'#505048', sg:'#A0A096', lt:'#D8D8D0',
    screen:'#060E20', glass:'#D8E4F0',
  },
  chill: {
    wall:'#F6F4F0', wHi:'#FEFEFE', wLo:'#E9E6DE',
    floor:'#FBFAF6', fLo:'#F2EFE8',
    ink:'#181410', dk:'#2E2A22', md:'#6C6860', sg:'#B4B0A8', lt:'#E6E2D8',
    screen:'#101010', glass:'#E8EAE4',
  },
  gym: {
    wall:'#F4F3EF', wHi:'#FCFCFA', wLo:'#E8E5DC',
    floor:'#F9F8F4', fLo:'#F0EDE4',
    ink:'#141210', dk:'#262420', md:'#606059', sg:'#AEAAA2', lt:'#E2DEDA',
    screen:'#141414', glass:'#DDE6EE',
  },
  library: {
    wall:'#F7F5F1', wHi:'#FEFEFE', wLo:'#EAE7DE',
    floor:'#FAF8F4', fLo:'#F1EDE5',
    ink:'#1A1810', dk:'#2E2C22', md:'#726E64', sg:'#B8B4AA', lt:'#E6E2D6',
    screen:'#181408', glass:'#EAE4D8',
  },
  music: {
    wall:'#F3F1EE', wHi:'#FBFAF8', wLo:'#E5E2DA',
    floor:'#F8F6F2', fLo:'#EFECE4',
    ink:'#161410', dk:'#2A2820', md:'#686460', sg:'#B0ACA4', lt:'#E4E0D8',
    screen:'#0C0C0C', glass:'#E6E4DC',
  },
  kitchen: {
    wall:'#F8F7F4', wHi:'#FFFFFF', wLo:'#ECE9E2',
    floor:'#FAFAF6', fLo:'#F3F0E8',
    ink:'#1A1816', dk:'#2E2C28', md:'#686460', sg:'#B4B0A8', lt:'#E8E4DC',
    screen:'#1A1816', glass:'#E8EDEA',
  },
  art: {
    wall:'#F5F4F0', wHi:'#FEFEFE', wLo:'#E8E5DC',
    floor:'#FAF8F4', fLo:'#F0EDE4',
    ink:'#161410', dk:'#2C2A22', md:'#6A6660', sg:'#B0ACA4', lt:'#E4E0D8',
    screen:'#161410', glass:'#E6E4DC',
  },
  bedroom: {
    wall:'#F7F5F2', wHi:'#FEFEFE', wLo:'#EAE8E0',
    floor:'#FBFAF6', fLo:'#F2F0E8',
    ink:'#181614', dk:'#2C2A26', md:'#6A6864', sg:'#B4B0AC', lt:'#E4E2DC',
    screen:'#181614', glass:'#EAE8DC',
  },
}

// ── Drawing primitives ─────────────────────────────────────────────────────

function _base(ctx, C) {
  // Wall — clean flat fill with a single soft top-edge light
  ctx.fillStyle = C.wall
  ctx.fillRect(0, 0, ROOM_W, WALL_H)

  // Subtle top-edge brightening (like ceiling light wash)
  const wGrad = ctx.createLinearGradient(0, 0, 0, WALL_H)
  wGrad.addColorStop(0, 'rgba(255,255,255,0.14)')
  wGrad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = wGrad; ctx.fillRect(0, 0, ROOM_W, WALL_H)

  // Floor — slightly warmer/different from wall so depth reads
  ctx.fillStyle = C.floor
  ctx.fillRect(0, WALL_H, ROOM_W, ROOM_H - WALL_H)

  // Floor front-edge vignette (makes floor feel grounded)
  const fGrad = ctx.createLinearGradient(0, ROOM_H - 30, 0, ROOM_H)
  fGrad.addColorStop(0, 'rgba(0,0,0,0)')
  fGrad.addColorStop(1, 'rgba(0,0,0,0.06)')
  ctx.fillStyle = fGrad; ctx.fillRect(0, ROOM_H - 30, ROOM_W, 30)

  // Wall-floor junction shadow (the most important depth line)
  ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(0, WALL_H - 3, ROOM_W, 5)

  // Skirting board
  ctx.fillStyle = C.lt
  ctx.fillRect(0, WALL_H - 7, ROOM_W, 5)

  // Crisp boundary lines
  ctx.fillStyle = C.ink
  ctx.fillRect(0, WALL_H - 2, ROOM_W, 2)   // wall/floor seam
  ctx.fillRect(0, 0, ROOM_W, 1)             // ceiling line
  ctx.fillRect(0, ROOM_H - 1, ROOM_W, 1)   // floor bottom

  // Side-wall shadows (thin, enough for depth without muddying white)
  const lSh = ctx.createLinearGradient(0, 0, 16, 0)
  lSh.addColorStop(0, 'rgba(0,0,0,0.12)'); lSh.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = lSh; ctx.fillRect(0, 0, 16, ROOM_H)
  const rSh = ctx.createLinearGradient(ROOM_W - 16, 0, ROOM_W, 0)
  rSh.addColorStop(0, 'rgba(0,0,0,0)'); rSh.addColorStop(1, 'rgba(0,0,0,0.12)')
  ctx.fillStyle = rSh; ctx.fillRect(ROOM_W - 16, 0, 16, ROOM_H)
}

// Floor textures ────────────────────────────────────────────────────────────

function _floorPlanks(ctx, C, wide = false) {
  const ph = wide ? 18 : 13
  ctx.save(); ctx.globalAlpha = 1
  for (let y = WALL_H; y < ROOM_H; y += ph) {
    // Alternate-shade planks
    ctx.fillStyle = (Math.floor((y - WALL_H) / ph) % 2 === 0) ? C.fLo : C.floor
    ctx.fillRect(0, y, ROOM_W, ph)
    // Plank gap line
    ctx.strokeStyle = C.md; ctx.globalAlpha = 0.10; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, y + ph); ctx.lineTo(ROOM_W, y + ph); ctx.stroke()
    ctx.globalAlpha = 1
    // Short cross-cuts every few planks
    const r = Math.floor((y - WALL_H) / ph)
    const jx = (r % 3 === 0 ? 80 : r % 3 === 1 ? 200 : 40) + ((r * 53) % 60)
    ctx.strokeStyle = C.md; ctx.globalAlpha = 0.07; ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.moveTo(jx, y); ctx.lineTo(jx, y + ph); ctx.stroke()
    ctx.globalAlpha = 1
  }
  ctx.restore()
}

function _floorTiles(ctx, C, sz = 20) {
  ctx.save()
  for (let y = WALL_H; y < ROOM_H; y += sz) {
    for (let x = 0; x < ROOM_W; x += sz) {
      const dark = ((Math.floor(x / sz) + Math.floor((y - WALL_H) / sz)) % 2 === 0)
      if (dark) {
        ctx.fillStyle = C.fLo; ctx.globalAlpha = 0.18
        ctx.fillRect(x, y, sz, sz)
        ctx.globalAlpha = 1
      }
    }
  }
  ctx.strokeStyle = C.md; ctx.globalAlpha = 0.09; ctx.lineWidth = 0.5
  for (let y = WALL_H; y < ROOM_H; y += sz) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ROOM_W, y); ctx.stroke()
  }
  for (let x = 0; x < ROOM_W; x += sz) {
    ctx.beginPath(); ctx.moveTo(x, WALL_H); ctx.lineTo(x, ROOM_H); ctx.stroke()
  }
  ctx.globalAlpha = 1; ctx.restore()
}

function _floorCarpet(ctx, C) {
  ctx.save()
  const fs = 10
  ctx.globalAlpha = 0.07
  for (let y = WALL_H; y < ROOM_H; y += fs)
    for (let x = 0; x < ROOM_W; x += fs)
      if ((Math.floor(x / fs) + Math.floor((y - WALL_H) / fs)) % 2 === 0) {
        ctx.fillStyle = C.sg; ctx.fillRect(x + 1, y + 1, fs - 2, fs - 2)
      }
  ctx.globalAlpha = 1; ctx.restore()
}

// Ceiling lamp light pool ────────────────────────────────────────────────────
function _lampPool(ctx, cx, C) {
  const grad = ctx.createRadialGradient(cx, WALL_H + 4, 0, cx, WALL_H + 30, 90)
  grad.addColorStop(0, 'rgba(255,255,255,0.06)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad; ctx.fillRect(cx - 90, WALL_H, 180, 90)
}

// 3D isometric-lite box: x,y = left/bottom of front face
function _box3d(ctx, x, y, fw, fh, td, colFace, colTop, colSide) {
  const tOff = Math.round(td * 0.38)
  ctx.fillStyle = colTop
  ctx.beginPath()
  ctx.moveTo(x,            y - fh)
  ctx.lineTo(x + fw,       y - fh)
  ctx.lineTo(x + fw + td,  y - fh - tOff)
  ctx.lineTo(x + td,       y - fh - tOff)
  ctx.closePath(); ctx.fill()

  ctx.fillStyle = colFace
  ctx.fillRect(x, y - fh, fw, fh)

  ctx.fillStyle = colSide
  ctx.beginPath()
  ctx.moveTo(x + fw,       y - fh)
  ctx.lineTo(x + fw + td,  y - fh - tOff)
  ctx.lineTo(x + fw + td,  y - tOff)
  ctx.lineTo(x + fw,       y)
  ctx.closePath(); ctx.fill()

  ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y - fh); ctx.lineTo(x + fw, y - fh)
  ctx.moveTo(x, y - fh); ctx.lineTo(x, y)
  ctx.moveTo(x + fw, y - fh); ctx.lineTo(x + fw, y)
  ctx.moveTo(x, y - fh); ctx.lineTo(x + td, y - fh - tOff)
  ctx.moveTo(x + fw, y - fh); ctx.lineTo(x + fw + td, y - fh - tOff)
  ctx.moveTo(x + td, y - fh - tOff); ctx.lineTo(x + fw + td, y - fh - tOff)
  ctx.moveTo(x + fw + td, y - fh - tOff); ctx.lineTo(x + fw + td, y - tOff)
  ctx.stroke()

  const sg = ctx.createLinearGradient(0, y, 0, y + 10)
  sg.addColorStop(0, 'rgba(0,0,0,0.18)'); sg.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = sg; ctx.fillRect(x + 2, y, fw + td - 2, 10)
}

function _win(ctx, x, y, w, h, C) {
  ctx.fillStyle = C.md; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = C.glass; ctx.fillRect(x + 4, y + 4, w - 8, h - 8)
  ctx.fillStyle = C.lt
  ctx.fillRect(x + w/2 - 1, y + 4, 2, h - 8)
  ctx.fillRect(x + 4, y + h/2 - 1, w - 8, 2)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2)
  ctx.strokeStyle = C.dk; ctx.lineWidth = 0.5; ctx.strokeRect(x + 4, y + 4, w - 8, h - 8)
  const glow = ctx.createRadialGradient(x + w/2, y + h, 0, x + w/2, y + h, w)
  glow.addColorStop(0, 'rgba(255,255,255,0.09)'); glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow; ctx.fillRect(x - w * 0.4, y, w * 1.8, h + 28)
}

function _shelf(ctx, x, y, w, h, rows, C) {
  ctx.fillStyle = C.md; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = C.dk; ctx.fillRect(x, y, 4, h); ctx.fillRect(x + w - 4, y, 4, h); ctx.fillRect(x, y, w, 4)
  const rowH = h / rows
  for (let r = 0; r < rows; r++) {
    const sy = y + r * rowH
    ctx.fillStyle = C.dk; ctx.fillRect(x + 4, sy + rowH - 4, w - 8, 3)
    let bx = x + 5
    while (bx < x + w - 9) {
      const bw = 5 + ((bx * 7 + r * 17) % 5)
      const bh = Math.floor(rowH * 0.6 + ((bx + r) % 3) * 4)
      const shade = 25 + ((bx * 3 + r * 11) % 55)
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`
      ctx.fillRect(bx, sy + rowH - 4 - bh, bw, bh)
      ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.strokeRect(bx, sy + rowH - 4 - bh, bw, bh)
      bx += bw + 1
    }
  }
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h)
}

function _screen(ctx, x, y, sw, sh, screenCol, bezelCol) {
  ctx.fillStyle = bezelCol; ctx.fillRect(x, y, sw, sh)
  ctx.fillStyle = screenCol; ctx.fillRect(x + 4, y + 4, sw - 8, sh - 8)
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  ctx.beginPath()
  ctx.moveTo(x + 5, y + 5); ctx.lineTo(x + sw/2 + 2, y + 5)
  ctx.lineTo(x + sw/2 - 4, y + sh/3); ctx.lineTo(x + 5, y + sh/3)
  ctx.closePath(); ctx.fill()
  const gl = ctx.createRadialGradient(x + sw/2, y + sh/2, 0, x + sw/2, y + sh/2, sw * 0.7)
  gl.addColorStop(0, 'rgba(120,180,255,0.07)'); gl.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gl; ctx.fillRect(x - 6, y - 6, sw + 12, sh + 12)
  ctx.fillStyle = bezelCol; ctx.fillRect(x + sw/2 - 4, y + sh, 8, 8); ctx.fillRect(x + sw/2 - 10, y + sh + 8, 20, 3)
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(x, y, sw, sh)
}

function _poster(ctx, x, y, w, h, C) {
  ctx.fillStyle = C.md; ctx.fillRect(x - 3, y - 3, w + 6, h + 6)
  ctx.fillStyle = C.lt; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = C.sg; ctx.fillRect(x + 4, y + 4, w - 8, Math.floor(h * 0.55))
  ctx.fillStyle = C.dk; ctx.fillRect(x + 4, y + h - 16, w - 8, 2); ctx.fillRect(x + 4, y + h - 11, Math.floor(w * 0.5), 2)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(x - 2, y - 2, w + 4, h + 4)
}

// ── Room draw functions ────────────────────────────────────────────────────

function _drawStudy(ctx, C) {
  _base(ctx, C)
  _floorPlanks(ctx, C)
  _lampPool(ctx, 160, C)
  // Whiteboard on back wall
  ctx.fillStyle = C.lt; ctx.fillRect(84, 7, 152, 46)
  ctx.fillStyle = C.sg; ctx.fillRect(88, 11, 144, 38)
  ctx.strokeStyle = C.lt; ctx.lineWidth = 1; ctx.globalAlpha = 0.65
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(96, 19 + i * 6); ctx.lineTo(218, 19 + i * 6); ctx.stroke() }
  ctx.globalAlpha = 1
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.strokeRect(84, 7, 152, 46)
  // Bookshelf (right)
  _shelf(ctx, 238, 8, 72, 56, 3, C)
  // Floor lamp (right)
  ctx.strokeStyle = C.md; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(262, 176); ctx.lineTo(262, 120); ctx.stroke()
  ctx.fillStyle = C.sg; ctx.fillRect(250, 118, 24, 6)
  ctx.fillStyle = C.lt; ctx.beginPath(); ctx.arc(262, 118, 9, Math.PI, 0); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(262, 118, 9, Math.PI, 0); ctx.stroke()
  ctx.fillStyle = C.dk; ctx.fillRect(258, 172, 8, 6)
  // Lamp light on floor
  const lg = ctx.createRadialGradient(262, 176, 0, 262, 176, 40)
  lg.addColorStop(0, 'rgba(255,255,255,0.06)'); lg.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = lg; ctx.fillRect(222, 160, 80, 56)
  // Desk (left side)
  _box3d(ctx, 12, 118, 120, 22, 14, C.sg, C.lt, C.md)
  ctx.fillStyle = C.dk; ctx.fillRect(22, 90, 52, 8); ctx.fillStyle = C.sg; ctx.fillRect(24, 91, 48, 6)
  // Monitor
  _screen(ctx, 28, 58, 54, 34, C.screen, C.dk)
  // Desk clutter — coffee mug, notepad
  ctx.fillStyle = C.md; ctx.beginPath(); ctx.arc(110, 101, 6, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = C.lt; ctx.beginPath(); ctx.arc(110, 101, 4, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = C.sg; ctx.fillRect(86, 94, 18, 14); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.strokeRect(86, 94, 18, 14)
  // Chair
  _box3d(ctx, 20, 150, 44, 12, 8, C.md, C.sg, C.dk)
  ctx.fillStyle = C.sg; ctx.fillRect(28, 122, 28, 26); ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(28, 122, 28, 26)
  // Stack of books (right floor)
  _box3d(ctx, 198, 102, 40, 14, 6, C.md, C.sg, C.dk)
  _box3d(ctx, 201, 88, 34, 14, 5, C.lt, C.wHi, C.sg)
  // Poster on left wall
  _poster(ctx, 6, 10, 50, 40, C)
}

function _drawGaming(ctx, C) {
  _base(ctx, C)
  _floorTiles(ctx, C, 22)
  _lampPool(ctx, 130, C)
  // LED strip glow at floor level
  const led = ctx.createLinearGradient(0, ROOM_H - 4, 0, ROOM_H - 22)
  led.addColorStop(0, 'rgba(100,160,255,0.28)'); led.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = led; ctx.fillRect(40, ROOM_H - 22, 240, 22)
  // Wall LED strip
  ctx.fillStyle = 'rgba(80,130,220,0.12)'; ctx.fillRect(0, WALL_H - 3, ROOM_W, 6)
  // Desk
  _box3d(ctx, 28, 118, 264, 20, 12, C.md, C.sg, C.dk)
  // Ultrawide monitor
  _screen(ctx, 66, 44, 188, 66, C.screen, C.dk)
  // Second monitor (right, tilted slightly)
  _screen(ctx, 218, 54, 68, 52, C.screen, '#141414')
  // Keyboard + mousepad
  ctx.fillStyle = '#181818'; ctx.fillRect(82, 93, 80, 11); ctx.fillStyle = '#262626'; ctx.fillRect(84, 94, 76, 9)
  // Key highlights
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  for (let k = 0; k < 12; k++) ctx.fillRect(86 + k*6, 95, 4, 7)
  ctx.fillStyle = '#222222'; ctx.fillRect(178, 90, 56, 16); ctx.strokeStyle = '#444'; ctx.lineWidth = 0.5; ctx.strokeRect(178, 90, 56, 16)
  // Energy drink can on desk
  ctx.fillStyle = C.md; ctx.fillRect(180, 80, 8, 16); ctx.fillStyle = C.lt; ctx.fillRect(181, 82, 6, 8)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.strokeRect(180, 80, 8, 16)
  // Gaming chair
  _box3d(ctx, 46, 162, 58, 44, 12, C.md, C.sg, C.dk)
  ctx.fillStyle = C.sg; ctx.fillRect(50, 106, 50, 52); ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(50, 106, 50, 52)
  ctx.fillStyle = C.md; ctx.fillRect(58, 102, 34, 10); ctx.strokeStyle = C.ink; ctx.strokeRect(58, 102, 34, 10)
  // Armrests
  _box3d(ctx, 46, 136, 10, 6, 6, C.dk, C.md, '#0e0e0e')
  _box3d(ctx, 94, 136, 10, 6, 6, C.dk, C.md, '#0e0e0e')
  // Poster (left wall)
  _poster(ctx, 14, 9, 48, 46, { md:C.md, lt:C.sg, dk:C.dk, sg:C.md, ink:C.ink, wHi:C.lt })
  // Speaker (left desk)
  _box3d(ctx, 30, 116, 28, 38, 8, C.dk, C.md, '#0e0e0e')
  // Controller on desk
  ctx.fillStyle = C.md; ctx.fillRect(136, 94, 24, 14); ctx.fillStyle = C.dk; ctx.fillRect(138, 96, 20, 10)
  ctx.fillStyle = C.sg; ctx.beginPath(); ctx.arc(143, 100, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(152, 100, 3, 0, Math.PI*2); ctx.fill()
  // Screen glow on desk surface
  const scGlow = ctx.createLinearGradient(66, 110, 66, 130)
  scGlow.addColorStop(0, 'rgba(80,130,220,0.12)'); scGlow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = scGlow; ctx.fillRect(66, 110, 188, 22)
}

function _drawChill(ctx, C) {
  _base(ctx, C)
  _floorCarpet(ctx, C)
  _lampPool(ctx, 160, C)
  // TV on back wall
  _screen(ctx, 90, 8, 140, 54, C.screen, C.dk)
  // TV stand
  _box3d(ctx, 106, 68, 108, 8, 8, C.md, C.sg, C.dk)
  // Rug
  ctx.fillStyle = C.sg; ctx.globalAlpha = 0.22
  ctx.fillRect(54, 128, 212, 80); ctx.globalAlpha = 1
  ctx.strokeStyle = C.md; ctx.lineWidth = 2; ctx.globalAlpha = 0.20; ctx.strokeRect(58, 132, 204, 72); ctx.globalAlpha = 1
  ctx.strokeStyle = C.md; ctx.lineWidth = 1; ctx.globalAlpha = 0.12; ctx.strokeRect(66, 140, 188, 56); ctx.globalAlpha = 1
  // Sofa
  _box3d(ctx, 42, 136, 236, 14, 10, C.sg, C.lt, C.md)
  ctx.fillStyle = C.md; ctx.fillRect(42, 120, 236, 18); ctx.fillStyle = C.sg; ctx.fillRect(46, 122, 228, 14)
  // Cushions on sofa
  ctx.fillStyle = C.lt; ctx.fillRect(54, 121, 28, 14); ctx.fillRect(152, 121, 28, 14); ctx.fillRect(238, 121, 26, 14)
  ctx.strokeStyle = C.md; ctx.lineWidth = 0.5; ctx.strokeRect(54, 121, 28, 14); ctx.strokeRect(152, 121, 28, 14); ctx.strokeRect(238, 121, 26, 14)
  ctx.strokeStyle = C.dk; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(118, 120); ctx.lineTo(118, 138); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(194, 120); ctx.lineTo(194, 138); ctx.stroke()
  _box3d(ctx, 30, 140, 14, 20, 8, C.md, C.sg, C.dk)
  _box3d(ctx, 276, 140, 14, 20, 8, C.md, C.sg, C.dk)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(42, 120, 236, 18)
  // Coffee table
  _box3d(ctx, 90, 182, 140, 10, 12, C.sg, C.lt, C.md)
  // Items on coffee table
  ctx.fillStyle = C.dk; ctx.fillRect(100, 169, 28, 4)  // book
  ctx.beginPath(); ctx.arc(168, 171, 6, 0, Math.PI*2); ctx.fill()  // mug
  ctx.fillStyle = C.md; ctx.beginPath(); ctx.arc(168, 171, 3, 0, Math.PI*2); ctx.fill()
  // Plant (left corner)
  ctx.fillStyle = C.dk; ctx.fillRect(16, 168, 10, 12)
  ctx.fillStyle = C.sg; ctx.beginPath(); ctx.arc(21, 162, 14, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = C.md; ctx.beginPath(); ctx.arc(14, 157, 9, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(28, 155, 9, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(21, 162, 14, 0, Math.PI*2); ctx.stroke()
  // Side lamp
  ctx.strokeStyle = C.md; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(296, 174); ctx.lineTo(296, 130); ctx.stroke()
  ctx.fillStyle = C.sg; ctx.fillRect(285, 128, 22, 5)
  ctx.fillStyle = C.lt; ctx.beginPath(); ctx.arc(296, 128, 8, Math.PI, 0); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(296, 128, 8, Math.PI, 0); ctx.stroke()
}

function _drawGym(ctx, C) {
  _base(ctx, C)
  _floorTiles(ctx, C, 24)
  // Rubber floor stripes
  ctx.strokeStyle = C.md; ctx.globalAlpha = 0.08; ctx.lineWidth = 1
  for (let x = -ROOM_H; x < ROOM_W + ROOM_H; x += 22) {
    ctx.beginPath(); ctx.moveTo(x, WALL_H); ctx.lineTo(x + ROOM_H, ROOM_H); ctx.stroke()
  }
  ctx.globalAlpha = 1
  // Motivational poster (back wall center)
  _poster(ctx, 116, 8, 88, 46, C)
  ctx.fillStyle = C.sg; ctx.fillRect(126, 28, 68, 3); ctx.fillRect(130, 34, 58, 3)
  // Windows
  _win(ctx, 10, 8, 70, 48, C); _win(ctx, 240, 8, 70, 48, C)
  // Ceiling light
  ctx.fillStyle = C.lt; ctx.fillRect(130, 0, 60, 5)
  ctx.fillStyle = C.sg; ctx.fillRect(130, 5, 60, 3)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(130, 0, 60, 8)
  _lampPool(ctx, 160, C)
  // Pull-up bar
  ctx.fillStyle = C.dk; ctx.fillRect(74, 12, 172, 6)
  ctx.fillStyle = C.md; ctx.fillRect(68, 8, 10, 16); ctx.fillRect(242, 8, 10, 16)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(74, 12, 172, 6)
  // Treadmill (left)
  _box3d(ctx, 14, 154, 104, 28, 18, C.md, C.sg, C.dk)
  ctx.fillStyle = C.dk; ctx.fillRect(24, 115, 84, 8); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.strokeRect(24, 115, 84, 8)
  // Display screen on treadmill
  ctx.fillStyle = C.screen; ctx.fillRect(50, 104, 24, 12); ctx.strokeStyle = C.lt; ctx.lineWidth = 0.5; ctx.strokeRect(52, 106, 20, 8)
  ctx.strokeStyle = C.md; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(24, 126); ctx.lineTo(24, 107); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(108, 126); ctx.lineTo(108, 107); ctx.stroke()
  ctx.strokeStyle = C.sg; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(18, 107); ctx.lineTo(40, 107); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(100, 107); ctx.lineTo(122, 107); ctx.stroke()
  // Weight rack (right)
  _box3d(ctx, 192, 150, 114, 22, 12, C.md, C.lt, C.sg)
  const wPos = [198, 214, 230, 252, 270, 286]
  for (let i = 0; i < wPos.length; i++) {
    const r = 9 - (i % 3) * 2; const wy = 138 - ((i % 2) * 4)
    ctx.fillStyle = i % 2 === 0 ? C.dk : C.sg; ctx.beginPath(); ctx.arc(wPos[i], wy, r, 0, Math.PI*2); ctx.fill()
    ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(wPos[i], wy, r, 0, Math.PI*2); ctx.stroke()
    ctx.fillStyle = C.md; ctx.beginPath(); ctx.arc(wPos[i], wy, r * 0.4, 0, Math.PI*2); ctx.fill()
  }
  // Barbell on floor
  ctx.fillStyle = C.md; ctx.fillRect(36, 170, 4, 8); ctx.fillRect(58, 170, 4, 8); ctx.fillRect(36, 172, 28, 4)
  ctx.fillStyle = C.dk; ctx.fillRect(32, 168, 8, 12); ctx.fillRect(56, 168, 8, 12)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.strokeRect(32, 168, 8, 12); ctx.strokeRect(56, 168, 8, 12)
  // Water bottle on floor
  ctx.fillStyle = C.lt; ctx.fillRect(146, 174, 7, 18); ctx.fillStyle = C.md; ctx.fillRect(147, 172, 5, 4)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.strokeRect(146, 174, 7, 18)
}

function _drawLibrary(ctx, C) {
  _base(ctx, C)
  _floorPlanks(ctx, C, true)
  _lampPool(ctx, 160, C)
  // Full back-wall bookshelf
  _shelf(ctx, 6, 6, 308, 58, 3, C)
  // Left floor bookshelf
  _shelf(ctx, 6, 64, 58, 102, 4, C)
  // Right floor bookshelf
  _shelf(ctx, 256, 64, 58, 102, 4, C)
  // Reading table
  _box3d(ctx, 84, 164, 152, 18, 16, C.sg, C.lt, C.md)
  // Chairs
  _box3d(ctx, 96, 188, 40, 10, 8, C.md, C.sg, C.dk)
  _box3d(ctx, 188, 188, 40, 10, 8, C.md, C.sg, C.dk)
  ctx.fillStyle = C.sg; ctx.fillRect(100, 162, 32, 28); ctx.fillRect(192, 162, 32, 28)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8; ctx.strokeRect(100, 162, 32, 28); ctx.strokeRect(192, 162, 32, 28)
  // Desk lamp
  ctx.strokeStyle = C.md; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(164, 147); ctx.lineTo(164, 128); ctx.lineTo(180, 121); ctx.stroke()
  ctx.fillStyle = C.sg; ctx.fillRect(175, 118, 24, 6)
  ctx.fillStyle = C.lt; ctx.beginPath(); ctx.arc(187, 118, 8, Math.PI, 0); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(187, 118, 8, Math.PI, 0); ctx.stroke()
  // Lamp light pool on table
  const tl = ctx.createRadialGradient(187, 164, 0, 187, 164, 50)
  tl.addColorStop(0, 'rgba(255,255,255,0.09)'); tl.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = tl; ctx.fillRect(137, 148, 100, 36)
  // Globe
  ctx.fillStyle = C.md; ctx.beginPath(); ctx.arc(108, 143, 11, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(108, 143, 11, 0, Math.PI*2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(97, 143); ctx.lineTo(119, 143); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(108, 143, 5, 11, 0, 0, Math.PI*2); ctx.stroke()
  ctx.fillStyle = C.dk; ctx.fillRect(105, 154, 6, 5); ctx.fillRect(102, 158, 12, 3)
  // Open book on table
  ctx.fillStyle = C.lt; ctx.fillRect(128, 155, 44, 8)
  ctx.strokeStyle = C.md; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(150, 155); ctx.lineTo(150, 163); ctx.stroke()
  ctx.strokeStyle = C.dk; ctx.lineWidth = 0.3
  for (let l = 0; l < 5; l++) { ctx.beginPath(); ctx.moveTo(132, 157 + l); ctx.lineTo(148, 157 + l); ctx.stroke() }
  for (let l = 0; l < 5; l++) { ctx.beginPath(); ctx.moveTo(152, 157 + l); ctx.lineTo(168, 157 + l); ctx.stroke() }
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.strokeRect(128, 155, 44, 8)
  // Rug
  ctx.fillStyle = C.sg; ctx.globalAlpha = 0.16; ctx.fillRect(78, 144, 164, 68); ctx.globalAlpha = 1
  ctx.strokeStyle = C.md; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.22; ctx.strokeRect(82, 148, 156, 60); ctx.globalAlpha = 1
  ctx.strokeStyle = C.md; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.12; ctx.strokeRect(90, 156, 140, 44); ctx.globalAlpha = 1
}

function _drawMusic(ctx, C) {
  _base(ctx, C)
  _floorPlanks(ctx, C)
  // Soundproof foam diamond pattern on wall
  ctx.fillStyle = C.wHi; ctx.globalAlpha = 0.18
  const fs = 12
  for (let fx = 0; fx < ROOM_W; fx += fs)
    for (let fy = 0; fy < WALL_H; fy += fs)
      if ((Math.floor(fx/fs) + Math.floor(fy/fs)) % 2 === 0)
        ctx.fillRect(fx + 2, fy + 2, fs - 4, fs - 4)
  ctx.globalAlpha = 1
  // Studio lighting - warm strip
  const strip = ctx.createLinearGradient(0, WALL_H, 0, WALL_H + 30)
  strip.addColorStop(0, 'rgba(255,240,200,0.08)'); strip.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = strip; ctx.fillRect(0, WALL_H, ROOM_W, 30)
  // Piano / keyboard
  _box3d(ctx, 36, 130, 200, 30, 14, C.md, C.sg, C.dk)
  const keyY = 95; const kw = 8; const kh = 18
  for (let k = 0; k < 22; k++) {
    ctx.fillStyle = k % 7 === 2 || k % 7 === 6 ? C.md : C.lt
    ctx.fillRect(40 + k * kw, keyY, kw - 1, kh); ctx.strokeStyle = C.dk; ctx.lineWidth = 0.5; ctx.strokeRect(40 + k * kw, keyY, kw - 1, kh)
  }
  for (let k = 0; k < 21; k++) {
    if (k % 7 !== 2 && k % 7 !== 6) { ctx.fillStyle = C.dk; ctx.fillRect(42 + k * kw + kw * 0.6, keyY, kw * 0.55, kh * 0.65) }
  }
  // Sheet music stand
  ctx.strokeStyle = C.md; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(236, 190); ctx.lineTo(236, 120); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(224, 190); ctx.lineTo(248, 190); ctx.stroke()
  ctx.fillStyle = C.lt; ctx.fillRect(218, 104, 36, 22); ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(218, 104, 36, 22)
  // Music lines on stand
  ctx.strokeStyle = C.dk; ctx.lineWidth = 0.5
  for (let sl = 0; sl < 5; sl++) { ctx.beginPath(); ctx.moveTo(222, 108 + sl*3); ctx.lineTo(250, 108 + sl*3); ctx.stroke() }
  // Guitar silhouette (left wall)
  ctx.fillStyle = C.sg
  ctx.beginPath(); ctx.ellipse(22, 32, 12, 16, 0, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(22, 55, 9, 12, 0, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = C.md; ctx.fillRect(20, 32, 4, 26); ctx.fillRect(21, 16, 2, 20)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8
  ctx.beginPath(); ctx.ellipse(22, 32, 12, 16, 0, 0, Math.PI*2); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(22, 55, 9, 12, 0, 0, Math.PI*2); ctx.stroke()
  // Guitar strings
  ctx.strokeStyle = C.lt; ctx.globalAlpha = 0.30; ctx.lineWidth = 0.5
  for (let s = 0; s < 6; s++) { ctx.beginPath(); ctx.moveTo(22 - 2 + s*0.8, 16); ctx.lineTo(22 - 2 + s*0.8, 67); ctx.stroke() }
  ctx.globalAlpha = 1
  // Amp (left floor)
  _box3d(ctx, 16, 190, 60, 52, 10, C.md, C.sg, C.dk)
  ctx.fillStyle = C.sg; ctx.beginPath(); ctx.arc(46, 156, 18, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = C.dk; ctx.beginPath(); ctx.arc(46, 156, 10, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(46, 156, 18, 0, Math.PI*2); ctx.stroke()
  // Volume knobs on amp
  for (let kn = 0; kn < 3; kn++) {
    ctx.fillStyle = C.md; ctx.beginPath(); ctx.arc(25 + kn * 16, 192, 4, 0, Math.PI*2); ctx.fill()
    ctx.strokeStyle = C.dk; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(25 + kn * 16, 192, 4, 0, Math.PI*2); ctx.stroke()
  }
  // Mic stand (center)
  ctx.strokeStyle = C.sg; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(168, 194); ctx.lineTo(168, 122); ctx.stroke()
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(168, 194); ctx.lineTo(152, 206); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(168, 194); ctx.lineTo(184, 206); ctx.stroke()
  ctx.fillStyle = C.lt; ctx.beginPath(); ctx.ellipse(168, 114, 8, 14, 0, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(168, 114, 8, 14, 0, 0, Math.PI*2); ctx.stroke()
  ctx.strokeStyle = C.dk; ctx.lineWidth = 0.5
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(161, 102 + i * 6); ctx.lineTo(175, 102 + i * 6); ctx.stroke() }
  // Speaker stack (right)
  _box3d(ctx, 258, 190, 54, 58, 8, C.md, C.sg, C.dk)
  _box3d(ctx, 261, 133, 48, 22, 6, C.dk, C.md, '#0a0a0a')
  ctx.fillStyle = C.sg; ctx.beginPath(); ctx.arc(285, 144, 14, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = C.dk; ctx.beginPath(); ctx.arc(285, 144, 7, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(285, 144, 14, 0, Math.PI*2); ctx.stroke()
  // Stool at piano
  _box3d(ctx, 128, 172, 30, 10, 8, C.dk, C.md, '#0a0a0a')
  ctx.fillStyle = C.sg; ctx.beginPath(); ctx.ellipse(143, 168, 15, 6, 0, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.ellipse(143, 168, 15, 6, 0, 0, Math.PI*2); ctx.stroke()
}

function _drawKitchen(ctx, C) {
  _base(ctx, C)
  _floorTiles(ctx, C, 18)
  // Back-wall tile pattern
  ctx.strokeStyle = C.md; ctx.globalAlpha = 0.20; ctx.lineWidth = 0.5
  const ts = 14
  for (let tx = 0; tx < ROOM_W; tx += ts)
    for (let ty = 0; ty < WALL_H; ty += ts)
      ctx.strokeRect(tx, ty, ts, ts)
  ctx.globalAlpha = 1; ctx.lineWidth = 1
  // Window
  _win(ctx, 116, 8, 88, 48, C)
  // Counter (left to center)
  _box3d(ctx, 8, 112, 192, 24, 12, C.md, C.lt, C.sg)
  ctx.fillStyle = C.sg; ctx.fillRect(8, 112, 192, 50)
  for (let cx = 14; cx < 190; cx += 38) {
    ctx.fillStyle = C.lt; ctx.fillRect(cx, 116, 32, 44); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8; ctx.strokeRect(cx, 116, 32, 44)
    ctx.fillStyle = C.md; ctx.fillRect(cx + 11, 137, 10, 4)
  }
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(8, 112, 192, 50)
  // Microwave
  _box3d(ctx, 16, 99, 54, 18, 8, C.sg, C.lt, C.md)
  ctx.fillStyle = C.screen; ctx.fillRect(20, 85, 20, 10); ctx.strokeStyle = C.lt; ctx.lineWidth = 0.5; ctx.strokeRect(22, 87, 16, 6)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.strokeRect(20, 85, 20, 10)
  // Toaster
  _box3d(ctx, 84, 100, 36, 16, 6, C.md, C.sg, C.dk)
  ctx.fillStyle = C.dk; ctx.fillRect(88, 84, 10, 4); ctx.fillRect(102, 84, 10, 4)
  // Kettle
  ctx.fillStyle = C.sg; ctx.beginPath(); ctx.arc(150, 91, 12, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(150, 91, 12, 0, Math.PI*2); ctx.stroke()
  ctx.strokeStyle = C.md; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(160, 87); ctx.lineTo(168, 81); ctx.stroke()
  ctx.beginPath(); ctx.arc(144, 91, 8, -Math.PI * 0.6, Math.PI * 0.6); ctx.stroke()
  // Mug beside kettle
  ctx.fillStyle = C.lt; ctx.fillRect(172, 87, 8, 12); ctx.fillStyle = C.sg; ctx.beginPath(); ctx.arc(180, 94, 3, -Math.PI*0.5, Math.PI*0.5); ctx.stroke()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.strokeRect(172, 87, 8, 12)
  // Fridge (right, tall)
  _box3d(ctx, 262, 126, 50, 74, 10, C.md, C.lt, C.sg)
  ctx.fillStyle = C.lt; ctx.fillRect(264, 88, 46, 36); ctx.fillStyle = C.sg; ctx.fillRect(264, 124, 46, 4); ctx.fillStyle = C.lt; ctx.fillRect(264, 128, 46, 70)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8; ctx.strokeRect(264, 88, 46, 36); ctx.strokeRect(264, 128, 46, 70)
  ctx.fillStyle = C.dk; ctx.fillRect(282, 100, 4, 16); ctx.fillRect(282, 138, 4, 22)
  // Fridge magnets
  ctx.fillStyle = C.sg; ctx.fillRect(268, 92, 8, 6); ctx.fillRect(290, 94, 6, 8)
  ctx.strokeStyle = C.md; ctx.lineWidth = 0.5; ctx.strokeRect(268, 92, 8, 6); ctx.strokeRect(290, 94, 6, 8)
  // Pendant light
  ctx.strokeStyle = C.md; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(160, 0); ctx.lineTo(160, 14); ctx.stroke()
  ctx.fillStyle = C.lt; ctx.fillRect(148, 14, 24, 10)
  ctx.fillStyle = 'rgba(255,255,220,0.16)'; ctx.fillRect(150, 24, 20, 4)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(148, 14, 24, 10)
  _lampPool(ctx, 160, C)
  // Fruit bowl on counter
  ctx.fillStyle = C.sg; ctx.beginPath(); ctx.ellipse(108, 105, 12, 5, 0, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.ellipse(108, 105, 12, 5, 0, 0, Math.PI*2); ctx.stroke()
  for (let f = 0; f < 3; f++) {
    ctx.fillStyle = f % 2 === 0 ? C.md : C.lt; ctx.beginPath(); ctx.arc(100 + f*8, 100, 5, 0, Math.PI*2); ctx.fill()
    ctx.strokeStyle = C.ink; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.arc(100 + f*8, 100, 5, 0, Math.PI*2); ctx.stroke()
  }
  // Stools at counter
  _box3d(ctx, 38, 178, 20, 8, 6, C.md, C.sg, C.dk)
  _box3d(ctx, 72, 178, 20, 8, 6, C.md, C.sg, C.dk)
  ctx.fillStyle = C.sg; ctx.beginPath(); ctx.ellipse(48, 174, 10, 4, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(82, 174, 10, 4, 0, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.ellipse(48, 174, 10, 4, 0, 0, Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(82, 174, 10, 4, 0, 0, Math.PI*2); ctx.stroke()
}

function _drawArt(ctx, C) {
  _base(ctx, C)
  _floorCarpet(ctx, C)
  _lampPool(ctx, 160, C)
  // Large window (right)
  _win(ctx, 190, 6, 122, 58, C)
  // Wall frames (left)
  _poster(ctx, 12, 8, 58, 40, C); _poster(ctx, 14, 52, 34, 28, C); _poster(ctx, 52, 52, 30, 28, C)
  // Art supply table
  _box3d(ctx, 10, 150, 96, 20, 12, C.sg, C.lt, C.md)
  ctx.strokeStyle = C.md; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(20, 127); ctx.lineTo(38, 120); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(28, 128); ctx.lineTo(45, 121); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(36, 128); ctx.lineTo(52, 122); ctx.stroke()
  // Palette
  ctx.fillStyle = C.lt; ctx.beginPath(); ctx.ellipse(75, 132, 18, 12, -0.2, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(75, 132, 18, 12, -0.2, 0, Math.PI*2); ctx.stroke()
  const pDots = [[65,128,3],[72,125,3],[81,124,3],[88,128,2],[84,135,2],[70,138,3]]
  for (const [px, py, pr] of pDots) {
    const sh = 20 + ((px * 7) % 70); ctx.fillStyle = `rgb(${sh},${sh},${sh})`; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI*2); ctx.fill()
  }
  // Easel (center)
  ctx.strokeStyle = C.md; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(152, 190); ctx.lineTo(140, 86); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(168, 190); ctx.lineTo(180, 86); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(156, 170); ctx.lineTo(164, 170); ctx.stroke()
  // Canvas on easel - work in progress painting
  ctx.fillStyle = C.wHi; ctx.fillRect(130, 74, 60, 78)
  // Painting (abstract, monochrome)
  ctx.strokeStyle = C.md; ctx.globalAlpha = 0.45; ctx.lineWidth = 2
  ctx.beginPath(); ctx.ellipse(160, 102, 14, 18, 0, 0, Math.PI*2); ctx.stroke()
  ctx.globalAlpha = 0.22; ctx.fillStyle = C.sg; ctx.fillRect(135, 88, 24, 48)
  ctx.globalAlpha = 0.18; ctx.fillStyle = C.md
  ctx.beginPath(); ctx.arc(172, 118, 12, 0, Math.PI*2); ctx.fill()
  ctx.globalAlpha = 1
  ctx.strokeStyle = C.dk; ctx.lineWidth = 1.5; ctx.strokeRect(130, 74, 60, 78)
  // Chair at easel
  _box3d(ctx, 144, 192, 32, 8, 6, C.dk, C.md, '#0a0a0a')
  ctx.fillStyle = C.md; ctx.fillRect(148, 178, 24, 16); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.strokeRect(148, 178, 24, 16)
  // Tall shelving unit (right of easel)
  _box3d(ctx, 216, 154, 46, 56, 10, C.md, C.sg, C.dk)
  for (let sh = 0; sh < 4; sh++) {
    ctx.fillStyle = C.lt; ctx.fillRect(218, 100 + sh * 14, 42, 12); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.strokeRect(218, 100 + sh * 14, 42, 12)
    // Items on shelves
    const si = sh; ctx.fillStyle = C.sg; ctx.fillRect(220, 97 + si*14, 8, 8); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.3; ctx.strokeRect(220, 97 + si*14, 8, 8)
  }
  // Paint splatter on floor
  ctx.fillStyle = C.sg; ctx.globalAlpha = 0.14
  const splats = [[60,172,4],[100,182,3],[88,192,6],[70,162,2],[118,170,3],[92,202,5],[76,210,4]]
  for (const [sx, sy, sr] of splats) { ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2); ctx.fill() }
  ctx.globalAlpha = 1
  // Plant in corner
  ctx.fillStyle = C.dk; ctx.fillRect(10, 176, 14, 24)
  ctx.fillStyle = C.sg; ctx.beginPath(); ctx.arc(17, 170, 14, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = C.md; ctx.beginPath(); ctx.arc(10, 165, 8, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(24, 163, 8, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(17, 170, 14, 0, Math.PI*2); ctx.stroke()
}

function _drawBedroom(ctx, C) {
  _base(ctx, C)
  _floorPlanks(ctx, C)
  // Window (centered)
  _win(ctx, 106, 7, 108, 50, C)
  _lampPool(ctx, 160, C)
  // Wardrobe (right)
  _box3d(ctx, 240, 152, 72, 88, 10, C.sg, C.lt, C.md)
  ctx.fillStyle = C.lt; ctx.fillRect(242, 66, 32, 84); ctx.fillRect(278, 66, 30, 84)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8; ctx.strokeRect(242, 66, 32, 84); ctx.strokeRect(278, 66, 30, 84)
  ctx.fillStyle = C.md; ctx.fillRect(270, 106, 5, 10); ctx.fillRect(278, 106, 5, 10)
  // Shoe pile at base of wardrobe
  ctx.fillStyle = C.dk; ctx.fillRect(248, 190, 14, 8); ctx.fillStyle = C.md; ctx.fillRect(262, 192, 12, 6)
  // Bed base
  _box3d(ctx, 16, 164, 148, 30, 16, C.md, C.sg, C.dk)
  // Mattress
  _box3d(ctx, 18, 152, 144, 14, 14, C.lt, C.wHi, C.sg)
  // Headboard (with horizontal boards)
  ctx.fillStyle = C.md; ctx.fillRect(16, 84, 8, 66); ctx.fillStyle = C.sg; ctx.fillRect(20, 88, 4, 58)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(16, 84, 8, 66)
  // Horizontal decorative bars on headboard
  ctx.strokeStyle = C.lt; ctx.globalAlpha = 0.30; ctx.lineWidth = 0.5
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(16, 96 + i * 14); ctx.lineTo(24, 96 + i * 14); ctx.stroke() }
  ctx.globalAlpha = 1
  // Pillow + blanket
  _box3d(ctx, 22, 122, 56, 10, 12, C.lt, C.wHi, C.sg)
  ctx.fillStyle = C.sg; ctx.fillRect(18, 134, 144, 16); ctx.fillStyle = C.lt; ctx.fillRect(20, 136, 140, 12)
  ctx.strokeStyle = C.md; ctx.lineWidth = 0.5
  for (let i = 0; i < 7; i++) ctx.strokeRect(22 + i * 20, 137, 18, 10)
  // Bedside table + lamp
  _box3d(ctx, 176, 154, 50, 20, 8, C.sg, C.lt, C.md)
  ctx.strokeStyle = C.md; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(200, 135); ctx.lineTo(200, 124); ctx.stroke()
  ctx.fillStyle = C.sg; ctx.fillRect(191, 120, 18, 7)
  ctx.fillStyle = C.lt; ctx.beginPath(); ctx.arc(200, 120, 8, Math.PI, 0); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(200, 120, 8, Math.PI, 0); ctx.stroke()
  ctx.fillStyle = C.dk; ctx.fillRect(178, 132, 26, 4)
  // Phone on nightstand
  ctx.fillStyle = C.dk; ctx.fillRect(184, 151, 7, 12); ctx.fillStyle = C.screen; ctx.fillRect(185, 152, 5, 10)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.strokeRect(184, 151, 7, 12)
  // Desk (small corner desk)
  _box3d(ctx, 164, 138, 68, 18, 10, C.sg, C.lt, C.md)
  _screen(ctx, 166, 102, 44, 30, C.screen, C.dk)
  // Cup on desk
  ctx.fillStyle = C.md; ctx.fillRect(216, 128, 7, 10); ctx.fillStyle = C.lt; ctx.beginPath(); ctx.arc(219, 128, 3, Math.PI, 0); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.strokeRect(216, 128, 7, 10)
  // Throw blanket hanging off bed
  ctx.fillStyle = C.lt; ctx.globalAlpha = 0.35
  ctx.fillRect(80, 162, 60, 16)
  ctx.globalAlpha = 1
}

const ROOM_DRAW = {
  study: _drawStudy, gaming: _drawGaming, chill: _drawChill, gym: _drawGym,
  library: _drawLibrary, music: _drawMusic, kitchen: _drawKitchen,
  art: _drawArt, bedroom: _drawBedroom,
}

// ── Draw room ──────────────────────────────────────────────────────────────
function _drawRoom(ctx, room) {
  const C = MONO[room.typeId] || MONO.study
  ctx.save()
  ctx.imageSmoothingEnabled = true
  ;(ROOM_DRAW[room.typeId] || ROOM_DRAW.study)(ctx, C)
  ctx.restore()
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
    gaming:     [{ x:4,  y:28 }],
    reading:    [{ x:4,  y:28 }, { x:54, y:8 }],
    eating:     [{ x:4,  y:28 }],
    sleeping:   [{ x:18, y:22 }],
    napping:    [{ x:18, y:22 }],
    sketching:  [{ x:4,  y:28 }],
    chatting:   [{ x:36, y:8  }, { x:52, y:8  }],
    cooking:    [{ x:36, y:8  }],
    showering:  [{ x:58, y:8  }],
    _default:   [{ x:26, y:8  }, { x:46, y:8  }, { x:60, y:8  }],
  },
  gaming: {
    gaming:     [{ x:14, y:28 }],
    studying:   [{ x:14, y:28 }],
    eating:     [{ x:46, y:8  }],
    chatting:   [{ x:46, y:8  }, { x:60, y:8  }],
    sleeping:   [{ x:14, y:28 }],
    napping:    [{ x:14, y:28 }],
    sketching:  [{ x:46, y:8  }],
    _default:   [{ x:30, y:8  }, { x:50, y:8  }, { x:64, y:8  }],
  },
  chill: {
    gaming:     [{ x:9,  y:28 }, { x:34, y:28 }, { x:57, y:28 }],
    chatting:   [{ x:9,  y:28 }, { x:34, y:28 }, { x:57, y:28 }],
    reading:    [{ x:9,  y:28 }, { x:57, y:28 }],
    eating:     [{ x:34, y:28 }, { x:50, y:28 }],
    sleeping:   [{ x:18, y:28 }],
    napping:    [{ x:18, y:28 }],
    meditating: [{ x:48, y:8  }],
    dancing:    [{ x:38, y:8  }, { x:55, y:8  }],
    cooking:    [{ x:62, y:8  }],
    sketching:  [{ x:12, y:8  }],
    _default:   [{ x:22, y:8  }, { x:44, y:28 }, { x:60, y:8  }],
  },
  gym: {
    exercising: [{ x:5,  y:28 }, { x:22, y:28 }],
    walking:    [{ x:5,  y:28 }, { x:22, y:28 }],
    showering:  [{ x:60, y:8  }],
    chatting:   [{ x:42, y:8  }, { x:56, y:8  }],
    meditating: [{ x:42, y:8  }],
    dancing:    [{ x:38, y:8  }, { x:54, y:8  }],
    sleeping:   [{ x:5,  y:28 }],
    napping:    [{ x:5,  y:28 }],
    _default:   [{ x:28, y:8  }, { x:46, y:8  }, { x:60, y:8  }],
  },
  library: {
    reading:    [{ x:18, y:24 }, { x:34, y:24 }, { x:50, y:24 }],
    studying:   [{ x:18, y:24 }, { x:34, y:24 }],
    sketching:  [{ x:50, y:24 }],
    meditating: [{ x:36, y:8  }],
    chatting:   [{ x:18, y:24 }, { x:50, y:24 }],
    napping:    [{ x:36, y:24 }],
    sleeping:   [{ x:36, y:24 }],
    _default:   [{ x:22, y:8  }, { x:42, y:24 }, { x:58, y:8  }],
  },
  music: {
    jamming:    [{ x:11, y:28 }],
    dancing:    [{ x:38, y:8  }, { x:54, y:8  }],
    chatting:   [{ x:38, y:8  }, { x:54, y:8  }],
    sketching:  [{ x:26, y:8  }],
    meditating: [{ x:48, y:8  }],
    exercising: [{ x:7,  y:28 }],
    sleeping:   [{ x:11, y:28 }],
    napping:    [{ x:11, y:28 }],
    _default:   [{ x:26, y:8  }, { x:46, y:8  }, { x:60, y:8  }],
  },
  kitchen: {
    cooking:    [{ x:18, y:28 }, { x:36, y:28 }],
    eating:     [{ x:18, y:28 }, { x:36, y:28 }],
    chatting:   [{ x:44, y:8  }, { x:57, y:8  }],
    walking:    [{ x:32, y:8  }, { x:50, y:8  }],
    sleeping:   [{ x:18, y:28 }],
    napping:    [{ x:18, y:28 }],
    _default:   [{ x:20, y:8  }, { x:38, y:28 }, { x:54, y:8  }],
  },
  art: {
    sketching:  [{ x:32, y:28 }],
    studying:   [{ x:32, y:28 }],
    meditating: [{ x:18, y:8  }],
    chatting:   [{ x:18, y:8  }, { x:60, y:8  }],
    reading:    [{ x:6,  y:8  }],
    dancing:    [{ x:46, y:8  }, { x:60, y:8  }],
    sleeping:   [{ x:40, y:8  }],
    napping:    [{ x:40, y:8  }],
    _default:   [{ x:22, y:8  }, { x:42, y:28 }, { x:60, y:8  }],
  },
  bedroom: {
    sleeping:   [{ x:5,  y:28 }],
    napping:    [{ x:5,  y:28 }],
    reading:    [{ x:49, y:28 }],
    studying:   [{ x:49, y:28 }],
    gaming:     [{ x:49, y:28 }],
    sketching:  [{ x:49, y:28 }],
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
    // X is a percentage of scene width — keeps things responsive
    startX = 6 + Math.random() * 88
    startY = OUTDOOR_FEET_Y
    cvs.style.left   = startX.toFixed(1) + '%'
    cvs.style.bottom = startY + 'px'
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
    isOutdoor,
    dir: 'right',
    walkPhase: 0,
    zzzPhase: Math.random() * Math.PI * 2,
    _lastDraw: 0,
    _moveTimer: 1 + Math.random() * 2,
    _atSpot: false,
  }
  spriteState.set(normie.id, ss)

  // Point immediately toward activity spot for non-walk activities
  if (!isOutdoor && !WALK_ACTS.has(normie.activity)) {
    const spot = _getSpot(normie, ss)
    if (spot) { ss.targetX = spot.x; ss.targetY = spot.y }
  }

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
  ss.sceneEl  = newSceneEl  // must set BEFORE _getSpot
  ss.isOutdoor = newSceneEl.classList.contains('outdoor-wrap')
  ss._atSpot  = false
  ss._moveTimer = 0

  const container = ss.isOutdoor
    ? newSceneEl.querySelector('.out-objects') || newSceneEl
    : newSceneEl.querySelector('.room-scene') || newSceneEl

  if (ss.isOutdoor) {
    // Enter from left or right edge (percentages of scene width)
    ss.x = Math.random() < 0.5 ? -8 : 105
    ss.y = OUTDOOR_FEET_Y
    ss.targetX = 10 + Math.random() * 80
    ss.targetY = OUTDOOR_FEET_Y
    ss.cvs.style.left   = ss.x.toFixed(1) + '%'
    ss.cvs.style.bottom = ss.y + 'px'
    ss.cvs.style.top    = 'auto'
    ss.cvs.style.width  = ''
    ss.cvs.style.height = ''
    container.style.position = 'relative'
  } else {
    // Enter from left or right room edge
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
  ss.walkPhase = 0.1 // start walking in
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

      if (isWalk) {
        // Free wander: pick new random target on timer
        ss.walkPhase = (ss.walkPhase + dt * 3.2) % 1
        if (ss._moveTimer <= 0) {
          if (ss.isOutdoor) {
            ss.targetX = 4   + Math.random() * 92         // percent
            ss.targetY = OUTDOOR_FEET_Y                   // always on horizon
          } else {
            ss.targetX = 4   + Math.random() * (88 - SPRITE_W_PCT)
            ss.targetY = 3   + Math.random() * 10
          }
          ss._moveTimer = 3 + Math.random() * 4
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
    const spd  = ss.isOutdoor ? 32 * dt : 15 * dt
    const thresh = ss.isOutdoor ? 2 : 0.35

    if (!isSleep && dist > thresh) {
      ss.x += (dx / dist) * spd
      ss.y += (dy / dist) * spd
      if (Math.abs(dx) > 0.08) ss.dir = dx < 0 ? 'left' : 'right'
      ss._atSpot = false
      // Animate walk while navigating to spot (even for sit/stand activities)
      if (!isWalk) ss.walkPhase = (ss.walkPhase + dt * 2.6) % 1
    } else if (!isSleep && !isWalk) {
      // Settled at spot — freeze walk animation, show activity pose
      ss._atSpot  = true
      ss.walkPhase = 0
    }

    // ── CSS position ────────────────────────────────────────────────────────
    if (ss.isOutdoor) {
      ss.cvs.style.left   = ss.x.toFixed(2) + '%'
      ss.cvs.style.bottom = Math.round(ss.y) + 'px'
    } else {
      ss.cvs.style.left   = ss.x.toFixed(2) + '%'
      ss.cvs.style.bottom = ss.y.toFixed(2) + '%'
    }
    // Depth sort: higher y (further back) = lower z-index
    ss.cvs.style.zIndex = String(ss.isOutdoor
      ? Math.floor(ss.y)
      : Math.floor(100 - ss.y))

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

  const basePose    = ACTIVITY_META[normie.activity]?.pose || 'stand'
  // While walking to a spot, show walk animation regardless of target pose
  const displayPose = (!ss._atSpot && ss.walkPhase > 0.01) ? 'walk' : basePose

  drawNormieSprite(ctx, normie.id, displayPose, ss.walkPhase, { direction: ss.dir })
  ctx.restore()

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

  for (const [roomId, { canvas, ctx, room }] of sceneCanvases) {
    _drawRoom(ctx, room)
    if (night > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${(night * 0.12).toFixed(3)})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
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

export function updateOccupancy(normies) {
  const counts = {}
  for (const n of normies) counts[n.location] = (counts[n.location] || 0) + 1
  for (const [loc, count] of Object.entries(counts)) {
    const el = document.getElementById(`occ-${loc}`)
    if (!el) continue
    el.textContent = loc === 'outdoor' ? `${count} in quad` : `${count}/4`
  }
  document.querySelectorAll('[id^="occ-"]').forEach(el => {
    const loc = el.id.replace('occ-', '')
    if (!counts[loc]) el.textContent = loc === 'outdoor' ? '0 in quad' : '0/4'
  })
}
