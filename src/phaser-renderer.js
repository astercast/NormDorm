import Phaser from 'phaser'

// Tileset info
const TILE_SIZE = 16
const SCALE = 2
const TS = TILE_SIZE * SCALE
const TILESET_KEY = 'tileset'
const TILESET_URL = '/tileset.png'

// Room dimensions
const ROOM_W = 10
const ROOM_H = 7
const CANVAS_W = ROOM_W * TS
const CANVAS_H = ROOM_H * TS

export class RoomScene extends Phaser.Scene {
  constructor(roomLayout, roomType) {
    super({ key: `room-${roomType}` })
    this.roomLayout = roomLayout
    this.roomType = roomType
  }

  preload() {
    this.load.image(TILESET_KEY, TILESET_URL)
  }

  create() {
    // Draw floor tiles
    for (let y = 0; y < ROOM_H; y++) {
      for (let x = 0; x < ROOM_W; x++) {
        this.add.rectangle(x*TS+TS/2, y*TS+TS/2, TS, TS, 0xf5f0e8)
      }
    }
    // Draw walls (top border)
    for (let x = 0; x < ROOM_W; x++) {
      this.add.rectangle(x*TS+TS/2, TS/2, TS, TS/2, 0xe8e2d8)
    }

    // Draw furniture using tileset
    const tileset = this.textures.get(TILESET_KEY).getSourceImage();
    const ctx = this.sys.game.canvas.getContext('2d');
    // TILE_MAP must be globally available
    const TILE_MAP = window.TILE_MAP || {};
    this.roomLayout.forEach(item => {
      const tile = TILE_MAP[item.sprite];
      if (!tile) return;
      // tile: [sx, sy, sw, sh]
      const [sx, sy, sw, sh] = tile;
      // Draw sprite from tileset
      ctx.drawImage(
        tileset,
        sx, sy, sw, sh,
        item.x, item.y, sw, sh
      );
      // Add shadow for depth
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#000';
      ctx.fillRect(item.x+4, item.y+sh-8, sw-8, 8);
      ctx.restore();
    });
    // Add decor: soft lighting overlay
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#ffe9b3';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }
}

export function createRoomPhaserCanvas(roomLayout, roomType, parentEl) {
  const config = {
    type: Phaser.AUTO,
    width: CANVAS_W,
    height: CANVAS_H,
    backgroundColor: '#faf8f4',
    scale: { mode: Phaser.Scale.NONE },
    scene: [new RoomScene(roomLayout, roomType)]
  }
  const game = new Phaser.Game(config)
  parentEl.appendChild(game.canvas)
  return game
}
