import { ACTIVITY_META } from './constants.js'
import { drawNormieSprite, drawZzz, SPRITE_W, SPRITE_H } from './pixel-renderer.js'

// ── Constants ──────────────────────────────────────────────────────────────
const TILE    = 16
const SCALE   = 2
const TS      = TILE * SCALE

const ROOM_TILES_W = 10
const ROOM_TILES_H = 7
const ROOM_W = ROOM_TILES_W * TS   // 320px
const ROOM_H = ROOM_TILES_H * TS   // 224px
const WALL_H = TS * 2              // 64px

const NORMIE_SCALE  = 1.5
const SPRITE_W_PCT  = (SPRITE_W * NORMIE_SCALE) / ROOM_W * 100

// Vanishing point (1-point perspective)
const VP_X = ROOM_W / 2   // 160
const VP_Y = WALL_H        // 64

// ── Extended monochrome palettes ──────────────────────────────────────────
const MONO = {
  study: {
    wall:'#d2d0ce', wHi:'#dedcda', wLo:'#c0bebb',
    floor:'#e6e4e2', fLo:'#d6d4d2',
    ink:'#0f0f0f', dk:'#2c2a28', md:'#545250', sg:'#8e8c8a', lt:'#c2c0be',
    screen:'#424040', glass:'#cccac8',
  },
  gaming: {
    wall:'#181818', wHi:'#242424', wLo:'#0e0e0e',
    floor:'#202020', fLo:'#161616',
    ink:'#000000', dk:'#121212', md:'#3c3c3c', sg:'#686868', lt:'#989898',
    screen:'#1c3048', glass:'#2a2a2a',
  },
  chill: {
    wall:'#d6d4d2', wHi:'#e0dedc', wLo:'#c4c2c0',
    floor:'#ebebeb', fLo:'#dedcda',
    ink:'#111111', dk:'#363432', md:'#5e5c5a', sg:'#929090', lt:'#c6c4c2',
    screen:'#383636', glass:'#d0cecc',
  },
  gym: {
    wall:'#b6b4b2', wHi:'#c4c2c0', wLo:'#a4a2a0',
    floor:'#d2d0ce', fLo:'#c0bebb',
    ink:'#080808', dk:'#282624', md:'#504e4c', sg:'#828080', lt:'#b4b2b0',
    screen:'#343232', glass:'#b0aeac',
  },
  library: {
    wall:'#c6c2be', wHi:'#d4d0cc', wLo:'#b4b0ac',
    floor:'#dedad6', fLo:'#cecac6',
    ink:'#0e0c0a', dk:'#302c28', md:'#565250', sg:'#8a8680', lt:'#bcb8b4',
    screen:'#3c3830', glass:'#c4c0bc',
  },
  music: {
    wall:'#1c1c1c', wHi:'#282828', wLo:'#121212',
    floor:'#242424', fLo:'#1a1a1a',
    ink:'#000000', dk:'#161616', md:'#3e3e3e', sg:'#6c6c6c', lt:'#9c9c9c',
    screen:'#2a2a2a', glass:'#282828',
  },
  kitchen: {
    wall:'#e2e0de', wHi:'#ebebeb', wLo:'#d2d0ce',
    floor:'#f0eeec', fLo:'#e4e2e0',
    ink:'#101010', dk:'#383634', md:'#646260', sg:'#9a9896', lt:'#d0cecc',
    screen:'#484644', glass:'#e0dedc',
  },
  art: {
    wall:'#d0cece', wHi:'#dcdada', wLo:'#bebcba',
    floor:'#eceae8', fLo:'#dedad8',
    ink:'#111111', dk:'#302e2c', md:'#565452', sg:'#8c8a88', lt:'#c0bebc',
    screen:'#464442', glass:'#d4d2d0',
  },
  bedroom: {
    wall:'#d4d2d0', wHi:'#dedcda', wLo:'#c2c0be',
    floor:'#eae8e6', fLo:'#dad8d6',
    ink:'#111111', dk:'#343230', md:'#5e5c5a', sg:'#929090', lt:'#c4c2c0',
    screen:'#404040', glass:'#d2d0ce',
  },
}

// ── Drawing primitives ─────────────────────────────────────────────────────

function _base(ctx, C) {
  ctx.fillStyle = C.wall
  ctx.fillRect(0, 0, ROOM_W, WALL_H)
  const wGrad = ctx.createLinearGradient(0, 0, 0, WALL_H)
  wGrad.addColorStop(0, 'rgba(255,255,255,0.06)')
  wGrad.addColorStop(1, 'rgba(0,0,0,0.10)')
  ctx.fillStyle = wGrad; ctx.fillRect(0, 0, ROOM_W, WALL_H)

  ctx.fillStyle = C.floor
  ctx.fillRect(0, WALL_H, ROOM_W, ROOM_H - WALL_H)
  const fGrad = ctx.createLinearGradient(0, WALL_H, 0, ROOM_H)
  fGrad.addColorStop(0, 'rgba(255,255,255,0.07)')
  fGrad.addColorStop(1, 'rgba(0,0,0,0.10)')
  ctx.fillStyle = fGrad; ctx.fillRect(0, WALL_H, ROOM_W, ROOM_H - WALL_H)

  // 1-point perspective grid
  const FH = ROOM_H - WALL_H
  ctx.strokeStyle = C.sg; ctx.globalAlpha = 0.16; ctx.lineWidth = 0.5
  const hStops = [0.10, 0.21, 0.34, 0.48, 0.62, 0.76, 0.88, 1.00]
  for (const t of hStops) {
    const y = WALL_H + t * FH
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ROOM_W, y); ctx.stroke()
  }
  for (let i = 0; i <= 10; i++) {
    const xB = (i / 10) * ROOM_W
    ctx.beginPath(); ctx.moveTo(VP_X, VP_Y); ctx.lineTo(xB, ROOM_H); ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Left / right wall edge shadows
  const lSh = ctx.createLinearGradient(0, 0, 26, 0)
  lSh.addColorStop(0, 'rgba(0,0,0,0.24)'); lSh.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = lSh; ctx.fillRect(0, 0, 26, ROOM_H)
  const rSh = ctx.createLinearGradient(ROOM_W - 26, 0, ROOM_W, 0)
  rSh.addColorStop(0, 'rgba(0,0,0,0)'); rSh.addColorStop(1, 'rgba(0,0,0,0.18)')
  ctx.fillStyle = rSh; ctx.fillRect(ROOM_W - 26, 0, 26, ROOM_H)

  // Ceiling shadow
  const cSh = ctx.createLinearGradient(0, WALL_H, 0, WALL_H + 20)
  cSh.addColorStop(0, 'rgba(0,0,0,0.16)'); cSh.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = cSh; ctx.fillRect(0, WALL_H, ROOM_W, 20)

  // Baseboard + ceiling trim
  ctx.fillStyle = C.lt; ctx.fillRect(0, WALL_H - 6, ROOM_W, 4)
  ctx.fillStyle = C.ink
  ctx.fillRect(0, WALL_H - 2, ROOM_W, 2)
  ctx.fillRect(0, 0, ROOM_W, 2)
  ctx.fillRect(0, ROOM_H - 2, ROOM_W, 2)
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
  // Desk (left side)
  _box3d(ctx, 12, 118, 120, 22, 14, C.sg, C.lt, C.md)
  ctx.fillStyle = C.dk; ctx.fillRect(22, 90, 52, 8); ctx.fillStyle = C.sg; ctx.fillRect(24, 91, 48, 6)
  // Monitor
  _screen(ctx, 28, 58, 54, 34, C.screen, C.dk)
  // Chair
  _box3d(ctx, 20, 150, 44, 12, 8, C.md, C.sg, C.dk)
  ctx.fillStyle = C.sg; ctx.fillRect(28, 122, 28, 26); ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(28, 122, 28, 26)
  // Stack of books (right floor)
  _box3d(ctx, 198, 102, 40, 14, 6, C.md, C.sg, C.dk)
  _box3d(ctx, 201, 88, 34, 14, 5, C.lt, C.wHi, C.sg)
}

function _drawGaming(ctx, C) {
  _base(ctx, C)
  // LED strip glow at floor level
  const led = ctx.createLinearGradient(0, ROOM_H - 4, 0, ROOM_H - 16)
  led.addColorStop(0, 'rgba(100,160,255,0.24)'); led.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = led; ctx.fillRect(40, ROOM_H - 16, 240, 16)
  // Desk
  _box3d(ctx, 28, 118, 264, 20, 12, C.md, C.sg, C.dk)
  // Ultrawide monitor
  _screen(ctx, 66, 44, 188, 66, C.screen, C.dk)
  // Second monitor (right, tilted slightly)
  _screen(ctx, 218, 54, 68, 52, C.screen, '#141414')
  // Keyboard + mousepad
  ctx.fillStyle = '#181818'; ctx.fillRect(82, 93, 80, 11); ctx.fillStyle = '#262626'; ctx.fillRect(84, 94, 76, 9)
  ctx.fillStyle = '#222222'; ctx.fillRect(178, 90, 56, 16); ctx.strokeStyle = '#444'; ctx.lineWidth = 0.5; ctx.strokeRect(178, 90, 56, 16)
  // Gaming chair
  _box3d(ctx, 46, 162, 58, 44, 12, C.md, C.sg, C.dk)
  ctx.fillStyle = C.sg; ctx.fillRect(50, 106, 50, 52); ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(50, 106, 50, 52)
  ctx.fillStyle = C.md; ctx.fillRect(58, 102, 34, 10); ctx.strokeStyle = C.ink; ctx.strokeRect(58, 102, 34, 10)
  // Poster (left wall)
  _poster(ctx, 14, 9, 48, 46, { md:C.md, lt:C.sg, dk:C.dk, sg:C.md, ink:C.ink, wHi:C.lt })
  // Speaker (left desk)
  _box3d(ctx, 30, 116, 28, 38, 8, C.dk, C.md, '#0e0e0e')
  // Controller
  ctx.fillStyle = C.md; ctx.fillRect(136, 94, 24, 14); ctx.fillStyle = C.dk; ctx.fillRect(138, 96, 20, 10)
  ctx.fillStyle = C.sg; ctx.beginPath(); ctx.arc(143, 100, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(152, 100, 3, 0, Math.PI*2); ctx.fill()
}

function _drawChill(ctx, C) {
  _base(ctx, C)
  // TV on back wall
  _screen(ctx, 90, 8, 140, 54, C.screen, C.dk)
  // Rug
  ctx.fillStyle = C.sg; ctx.globalAlpha = 0.18
  ctx.fillRect(58, 130, 204, 72); ctx.globalAlpha = 1
  ctx.strokeStyle = C.md; ctx.lineWidth = 1; ctx.globalAlpha = 0.25; ctx.strokeRect(62, 134, 196, 64); ctx.globalAlpha = 1
  // Sofa
  _box3d(ctx, 42, 136, 236, 14, 10, C.sg, C.lt, C.md)
  ctx.fillStyle = C.md; ctx.fillRect(42, 120, 236, 18); ctx.fillStyle = C.sg; ctx.fillRect(46, 122, 228, 14)
  ctx.strokeStyle = C.dk; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(118, 120); ctx.lineTo(118, 138); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(194, 120); ctx.lineTo(194, 138); ctx.stroke()
  _box3d(ctx, 30, 140, 14, 20, 8, C.md, C.sg, C.dk)
  _box3d(ctx, 276, 140, 14, 20, 8, C.md, C.sg, C.dk)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(42, 120, 236, 18)
  // Coffee table
  _box3d(ctx, 90, 182, 140, 10, 12, C.sg, C.lt, C.md)
  ctx.fillStyle = C.dk; ctx.fillRect(100, 169, 28, 4)
  ctx.beginPath(); ctx.arc(168, 171, 6, 0, Math.PI*2); ctx.fill()
  // Plant (left corner)
  ctx.fillStyle = C.dk; ctx.fillRect(16, 168, 10, 12)
  ctx.fillStyle = C.sg; ctx.beginPath(); ctx.arc(21, 162, 14, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = C.md; ctx.beginPath(); ctx.arc(14, 157, 9, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(28, 155, 9, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(21, 162, 14, 0, Math.PI*2); ctx.stroke()
}

function _drawGym(ctx, C) {
  _base(ctx, C)
  // Rubber floor diagonal stripes
  ctx.strokeStyle = C.md; ctx.globalAlpha = 0.10; ctx.lineWidth = 1
  for (let x = -ROOM_H; x < ROOM_W + ROOM_H; x += 18) {
    ctx.beginPath(); ctx.moveTo(x, WALL_H); ctx.lineTo(x + ROOM_H, ROOM_H); ctx.stroke()
  }
  ctx.globalAlpha = 1
  // Motivational poster (back wall center)
  _poster(ctx, 116, 8, 88, 46, C)
  ctx.fillStyle = C.sg; ctx.fillRect(126, 28, 68, 3); ctx.fillRect(130, 34, 58, 3)
  // Windows
  _win(ctx, 10, 8, 70, 48, C); _win(ctx, 240, 8, 70, 48, C)
  // Pull-up bar
  ctx.fillStyle = C.dk; ctx.fillRect(74, 12, 172, 6)
  ctx.fillStyle = C.md; ctx.fillRect(68, 8, 10, 16); ctx.fillRect(242, 8, 10, 16)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(74, 12, 172, 6)
  // Treadmill (left)
  _box3d(ctx, 14, 154, 104, 28, 18, C.md, C.sg, C.dk)
  ctx.fillStyle = C.dk; ctx.fillRect(24, 115, 84, 8); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.strokeRect(24, 115, 84, 8)
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
}

function _drawLibrary(ctx, C) {
  _base(ctx, C)
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
  // Desk lamp
  ctx.strokeStyle = C.md; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(164, 147); ctx.lineTo(164, 128); ctx.lineTo(180, 121); ctx.stroke()
  ctx.fillStyle = C.sg; ctx.fillRect(175, 118, 24, 6)
  ctx.fillStyle = C.lt; ctx.beginPath(); ctx.arc(187, 118, 8, Math.PI, 0); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(187, 118, 8, Math.PI, 0); ctx.stroke()
  // Globe
  ctx.fillStyle = C.md; ctx.beginPath(); ctx.arc(108, 143, 11, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(108, 143, 11, 0, Math.PI*2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(97, 143); ctx.lineTo(119, 143); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(108, 143, 5, 11, 0, 0, Math.PI*2); ctx.stroke()
  ctx.fillStyle = C.dk; ctx.fillRect(105, 154, 6, 5); ctx.fillRect(102, 158, 12, 3)
  // Rug
  ctx.fillStyle = C.sg; ctx.globalAlpha = 0.16; ctx.fillRect(78, 144, 164, 68); ctx.globalAlpha = 1
  ctx.strokeStyle = C.md; ctx.lineWidth = 1; ctx.globalAlpha = 0.28; ctx.strokeRect(82, 148, 156, 60); ctx.globalAlpha = 1
}

function _drawMusic(ctx, C) {
  _base(ctx, C)
  // Soundproof foam diamond pattern on wall
  ctx.fillStyle = C.wHi; ctx.globalAlpha = 0.20
  const fs = 12
  for (let fx = 0; fx < ROOM_W; fx += fs)
    for (let fy = 0; fy < WALL_H; fy += fs)
      if ((Math.floor(fx/fs) + Math.floor(fy/fs)) % 2 === 0)
        ctx.fillRect(fx + 2, fy + 2, fs - 4, fs - 4)
  ctx.globalAlpha = 1
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
  // Guitar silhouette (left wall)
  ctx.fillStyle = C.sg
  ctx.beginPath(); ctx.ellipse(22, 32, 12, 16, 0, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(22, 55, 9, 12, 0, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = C.md; ctx.fillRect(20, 32, 4, 26); ctx.fillRect(21, 16, 2, 20)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8
  ctx.beginPath(); ctx.ellipse(22, 32, 12, 16, 0, 0, Math.PI*2); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(22, 55, 9, 12, 0, 0, Math.PI*2); ctx.stroke()
  // Amp (left floor)
  _box3d(ctx, 16, 190, 60, 52, 10, C.md, C.sg, C.dk)
  ctx.fillStyle = C.sg; ctx.beginPath(); ctx.arc(46, 156, 18, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = C.dk; ctx.beginPath(); ctx.arc(46, 156, 10, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(46, 156, 18, 0, Math.PI*2); ctx.stroke()
  // Mic stand (center)
  ctx.strokeStyle = C.sg; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(248, 194); ctx.lineTo(248, 122); ctx.stroke()
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(248, 194); ctx.lineTo(232, 206); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(248, 194); ctx.lineTo(264, 206); ctx.stroke()
  ctx.fillStyle = C.lt; ctx.beginPath(); ctx.ellipse(248, 114, 8, 14, 0, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(248, 114, 8, 14, 0, 0, Math.PI*2); ctx.stroke()
  ctx.strokeStyle = C.dk; ctx.lineWidth = 0.5
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(241, 102 + i * 6); ctx.lineTo(255, 102 + i * 6); ctx.stroke() }
  // Speaker stack (right)
  _box3d(ctx, 258, 190, 54, 58, 8, C.md, C.sg, C.dk)
  _box3d(ctx, 261, 133, 48, 22, 6, C.dk, C.md, '#0a0a0a')
  ctx.fillStyle = C.sg; ctx.beginPath(); ctx.arc(285, 144, 14, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = C.dk; ctx.beginPath(); ctx.arc(285, 144, 7, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(285, 144, 14, 0, Math.PI*2); ctx.stroke()
}

function _drawKitchen(ctx, C) {
  _base(ctx, C)
  // Back-wall tile pattern
  ctx.strokeStyle = C.md; ctx.globalAlpha = 0.22; ctx.lineWidth = 0.5
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
  ctx.fillStyle = C.screen; ctx.fillRect(20, 85, 20, 10); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.5; ctx.strokeRect(20, 85, 20, 10)
  // Toaster
  _box3d(ctx, 84, 100, 36, 16, 6, C.md, C.sg, C.dk)
  ctx.fillStyle = C.dk; ctx.fillRect(88, 84, 10, 4); ctx.fillRect(102, 84, 10, 4)
  // Kettle
  ctx.fillStyle = C.sg; ctx.beginPath(); ctx.arc(150, 91, 12, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(150, 91, 12, 0, Math.PI*2); ctx.stroke()
  ctx.strokeStyle = C.md; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(160, 87); ctx.lineTo(168, 81); ctx.stroke()
  ctx.beginPath(); ctx.arc(144, 91, 8, -Math.PI * 0.6, Math.PI * 0.6); ctx.stroke()
  // Fridge (right, tall)
  _box3d(ctx, 262, 126, 50, 74, 10, C.md, C.lt, C.sg)
  ctx.fillStyle = C.lt; ctx.fillRect(264, 88, 46, 36); ctx.fillStyle = C.sg; ctx.fillRect(264, 124, 46, 4); ctx.fillStyle = C.lt; ctx.fillRect(264, 128, 46, 70)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8; ctx.strokeRect(264, 88, 46, 36); ctx.strokeRect(264, 128, 46, 70)
  ctx.fillStyle = C.dk; ctx.fillRect(282, 100, 4, 16); ctx.fillRect(282, 138, 4, 22)
  // Pendant light
  ctx.strokeStyle = C.md; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(160, 0); ctx.lineTo(160, 14); ctx.stroke()
  ctx.fillStyle = C.lt; ctx.fillRect(148, 14, 24, 10)
  ctx.fillStyle = 'rgba(255,255,220,0.14)'; ctx.fillRect(150, 24, 20, 4)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(148, 14, 24, 10)
}

function _drawArt(ctx, C) {
  _base(ctx, C)
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
  ctx.fillStyle = C.wHi; ctx.fillRect(130, 74, 60, 78)
  ctx.strokeStyle = C.sg; ctx.lineWidth = 1; ctx.globalAlpha = 0.55
  ctx.beginPath(); ctx.ellipse(160, 102, 14, 18, 0, 0, Math.PI*2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(148, 122); ctx.lineTo(148, 150); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(148, 130); ctx.lineTo(136, 140); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(148, 130); ctx.lineTo(160, 140); ctx.stroke()
  ctx.globalAlpha = 1
  ctx.strokeStyle = C.dk; ctx.lineWidth = 1.5; ctx.strokeRect(130, 74, 60, 78)
  // Paint splatter
  ctx.fillStyle = C.sg; ctx.globalAlpha = 0.18
  const splats = [[60,172,4],[100,182,3],[88,192,6],[70,162,2],[118,170,3],[92,202,5]]
  for (const [sx, sy, sr] of splats) { ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2); ctx.fill() }
  ctx.globalAlpha = 1
}

function _drawBedroom(ctx, C) {
  _base(ctx, C)
  _win(ctx, 106, 7, 108, 50, C)
  // Wardrobe (right)
  _box3d(ctx, 240, 152, 72, 88, 10, C.sg, C.lt, C.md)
  ctx.fillStyle = C.lt; ctx.fillRect(242, 66, 32, 84); ctx.fillRect(278, 66, 30, 84)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8; ctx.strokeRect(242, 66, 32, 84); ctx.strokeRect(278, 66, 30, 84)
  ctx.fillStyle = C.md; ctx.fillRect(270, 106, 5, 10); ctx.fillRect(278, 106, 5, 10)
  // Bed base
  _box3d(ctx, 16, 164, 148, 30, 16, C.md, C.sg, C.dk)
  // Mattress
  _box3d(ctx, 18, 152, 144, 14, 14, C.lt, C.wHi, C.sg)
  // Headboard
  ctx.fillStyle = C.md; ctx.fillRect(16, 84, 8, 66); ctx.fillStyle = C.sg; ctx.fillRect(20, 88, 4, 58)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(16, 84, 8, 66)
  // Pillow
  _box3d(ctx, 22, 122, 56, 10, 12, C.lt, C.wHi, C.sg)
  // Blanket
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
  // Desk
  _box3d(ctx, 164, 138, 68, 18, 10, C.sg, C.lt, C.md)
  _screen(ctx, 166, 102, 44, 30, C.screen, C.dk)
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
    startY = 1 + Math.random() * 14
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
  drawNormieSprite(ctx, normie.id, pose, ss.walkPhase, { direction: ss.dir })
  ctx.restore()

  const tint = ss.isOutdoor ? nightAlpha : nightAlpha * 0.15
  if (tint > 0) {
    ctx.fillStyle = `rgba(0,0,0,${(tint * 0.4).toFixed(3)})`
    ctx.fillRect(0, 0, ss.cvs.width, ss.cvs.height)
  }

  if (pose === 'sleep') drawZzz(ctx, ss.zzzPhase || 0, ss.cvs.width)
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
  document.querySelectorAll('[id^="occ-"]').forEach(el => {
    const loc = el.id.replace('occ-', '')
    if (!counts[loc]) el.textContent = loc === 'outdoor' ? '0 outside' : '0/4'
  })
}
