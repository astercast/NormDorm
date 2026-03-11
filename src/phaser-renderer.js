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
  constructor(config) {
    super({ key: `room-${config.roomType}` })
    this.roomLayout = config.roomLayout
    this.roomType = config.roomType
    this.tileMap = config.tileMap
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

    // Draw furniture using Phaser images
    this.roomLayout.forEach(item => {
      const tile = this.tileMap[item.sprite];
      if (!tile) return;
      const [sx, sy, sw, sh] = tile;
      // Create image from tileset, crop to tile
      const img = this.add.image(item.x + sw/2, item.y + sh/2, TILESET_KEY);
      img.setCrop(sx, sy, sw, sh);
      img.setDisplaySize(sw, sh);
      img.setDepth(1);
      // Add shadow
      const shadow = this.add.rectangle(item.x + sw/2, item.y + sh, sw-8, 8, 0x000000, 0.18);
      shadow.setDepth(0);
    });
    // Add decor: soft lighting overlay
    const overlay = this.add.rectangle(CANVAS_W/2, CANVAS_H/2, CANVAS_W, CANVAS_H, 0xffe9b3, 0.08);
    overlay.setDepth(2);
  }
}

export function createRoomPhaserCanvas(roomLayout, roomType, parentEl) {
  const config = {
    type: Phaser.AUTO,
    width: CANVAS_W,
    height: CANVAS_H,
    backgroundColor: '#faf8f4',
    scale: { mode: Phaser.Scale.NONE },
    scene: [new RoomScene({ roomLayout, roomType, tileMap })]
  }
  const game = new Phaser.Game(config)
  parentEl.appendChild(game.canvas)
  return game
}
