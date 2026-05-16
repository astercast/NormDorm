// Tileset: Interiors_free_16x16.png (used as tileset.jpg)
// All coords [sx, sy, sw, sh] in source pixels (16px tile grid)
// Tileset width ≈ 176px (11 tiles), tall vertical strip

export const TILE_MAP = {
  // ── BEDS ─────────────────────────────────────────────────────────
  bed_single_left:       [0,   0,   16,  32],  // single bed, green/teal, left half
  bed_single_right:      [16,  0,   16,  32],  // single bed right half
  bed_double_h:          [32,  0,   48,  32],  // wide double bed (3 tiles)
  bed_bunk_left:         [0,   32,  16,  48],  // bunk bed left
  bed_bunk_right:        [16,  32,  16,  48],  // bunk bed right
  pillow:                [80,  0,   16,  16],
  nightstand:            [96,  0,   16,  16],
  alarm_clock:           [112, 0,   16,  16],

  // ── SEATING ──────────────────────────────────────────────────────
  chair_wood:            [0,   96,  16,  16],
  chair_padded:          [16,  96,  16,  16],
  sofa_2seat_left:       [32,  96,  16,  16],
  sofa_2seat_right:      [48,  96,  16,  16],
  sofa_3seat_left:       [64,  96,  16,  16],
  sofa_3seat_mid:        [80,  96,  16,  16],
  sofa_3seat_right:      [96,  96,  16,  16],
  armchair:              [112, 96,  16,  16],

  // ── DESKS / TABLES ────────────────────────────────────────────────
  desk_small:            [0,   112, 32,  16],
  desk_wide:             [0,   128, 48,  16],
  desk_corner:           [48,  112, 32,  32],
  table_round:           [80,  112, 32,  32],
  table_dining_2:        [112, 112, 32,  16],
  table_dining_4:        [112, 128, 32,  32],
  kitchen_counter:       [0,   144, 48,  16],
  kitchen_counter_end:   [48,  144, 16,  16],
  sink:                  [64,  144, 16,  16],
  stove:                 [80,  144, 32,  16],

  // ── STORAGE ──────────────────────────────────────────────────────
  bookshelf_short:       [0,   160, 32,  32],
  bookshelf_tall:        [32,  160, 16,  48],
  dresser:               [48,  160, 32,  32],
  wardrobe:              [80,  160, 32,  48],
  fridge:                [112, 160, 16,  32],
  cabinet_low:           [128, 160, 32,  16],

  // ── ELECTRONICS ───────────────────────────────────────────────────
  tv_small:              [0,   208, 32,  16],
  tv_large:              [32,  208, 48,  16],
  monitor:               [80,  208, 16,  16],
  monitor_wide:          [96,  208, 32,  16],
  game_console:          [128, 208, 16,  16],
  speaker:               [144, 208, 16,  16],

  // ── DECOR ─────────────────────────────────────────────────────────
  plant_small:           [0,   224, 16,  16],
  plant_medium:          [16,  224, 16,  32],
  plant_large:           [32,  224, 16,  32],
  lamp_table:            [48,  224, 16,  16],
  lamp_floor:            [64,  224, 16,  32],
  rug_small:             [80,  224, 32,  32],
  rug_large:             [112, 224, 48,  32],
  picture_small:         [0,   256, 16,  16],
  picture_wide:          [16,  256, 32,  16],
  clock_wall:            [48,  256, 16,  16],
  mirror:                [64,  256, 16,  32],

  // ── WINDOWS / DOORS ───────────────────────────────────────────────
  window_small:          [0,   288, 16,  32],
  window_large:          [16,  288, 32,  32],
  window_curtain:        [48,  288, 32,  32],
  door_wood:             [80,  288, 16,  32],
  door_glass:            [96,  288, 16,  32],
}

// Room furniture layouts — x/y in scaled canvas pixels (SCALE=2, so 1 source tile = 32px on canvas)
// Canvas is 320×224px (10×7 tiles × 32px each)
// Wall area = top 64px (2 tile rows). Floor starts at y=64.
// Keep furniture within: x: 0–288, y: 32–192

export const ROOM_LAYOUTS = {
  study: [
    { sprite: 'window_curtain',  x: 112, y: 0   },
    { sprite: 'desk_wide',       x: 8,   y: 64  },
    { sprite: 'chair_wood',      x: 24,  y: 96  },
    { sprite: 'monitor_wide',    x: 32,  y: 48  },
    { sprite: 'desk_small',      x: 160, y: 64  },
    { sprite: 'chair_padded',    x: 168, y: 96  },
    { sprite: 'bookshelf_tall',  x: 256, y: 32  },
    { sprite: 'plant_small',     x: 256, y: 160 },
    { sprite: 'lamp_table',      x: 80,  y: 64  },
    { sprite: 'rug_small',       x: 96,  y: 128 },
  ],

  gaming: [
    { sprite: 'window_small',    x: 64,  y: 0   },
    { sprite: 'tv_large',        x: 80,  y: 48  },
    { sprite: 'sofa_3seat_left', x: 48,  y: 128 },
    { sprite: 'sofa_3seat_mid',  x: 64,  y: 128 },
    { sprite: 'sofa_3seat_right',x: 80,  y: 128 },
    { sprite: 'game_console',    x: 96,  y: 64  },
    { sprite: 'speaker',         x: 64,  y: 64  },
    { sprite: 'rug_large',       x: 48,  y: 96  },
    { sprite: 'plant_large',     x: 256, y: 96  },
    { sprite: 'table_round',     x: 8,   y: 128 },
  ],

  chill: [
    { sprite: 'window_curtain',  x: 80,  y: 0   },
    { sprite: 'sofa_3seat_left', x: 32,  y: 112 },
    { sprite: 'sofa_3seat_mid',  x: 48,  y: 112 },
    { sprite: 'sofa_3seat_right',x: 64,  y: 112 },
    { sprite: 'table_round',     x: 96,  y: 112 },
    { sprite: 'tv_small',        x: 64,  y: 48  },
    { sprite: 'lamp_floor',      x: 8,   y: 80  },
    { sprite: 'lamp_floor',      x: 272, y: 80  },
    { sprite: 'rug_large',       x: 32,  y: 80  },
    { sprite: 'plant_medium',    x: 256, y: 112 },
    { sprite: 'plant_small',     x: 16,  y: 160 },
  ],

  gym: [
    { sprite: 'window_large',    x: 48,  y: 0   },
    { sprite: 'window_large',    x: 160, y: 0   },
    { sprite: 'rug_large',       x: 48,  y: 80  },
    { sprite: 'rug_small',       x: 160, y: 128 },
    { sprite: 'lamp_floor',      x: 8,   y: 64  },
    { sprite: 'lamp_floor',      x: 272, y: 64  },
    { sprite: 'plant_large',     x: 256, y: 128 },
    { sprite: 'plant_large',     x: 8,   y: 128 },
    { sprite: 'mirror',          x: 128, y: 32  },
  ],

  library: [
    { sprite: 'window_curtain',  x: 112, y: 0   },
    { sprite: 'bookshelf_tall',  x: 0,   y: 32  },
    { sprite: 'bookshelf_tall',  x: 32,  y: 32  },
    { sprite: 'bookshelf_tall',  x: 240, y: 32  },
    { sprite: 'bookshelf_short', x: 64,  y: 32  },
    { sprite: 'desk_wide',       x: 96,  y: 80  },
    { sprite: 'chair_padded',    x: 112, y: 112 },
    { sprite: 'lamp_table',      x: 96,  y: 64  },
    { sprite: 'rug_large',       x: 80,  y: 112 },
    { sprite: 'table_round',     x: 8,   y: 128 },
    { sprite: 'chair_wood',      x: 8,   y: 160 },
    { sprite: 'plant_small',     x: 256, y: 160 },
  ],

  music: [
    { sprite: 'window_large',    x: 80,  y: 0   },
    { sprite: 'speaker',         x: 48,  y: 48  },
    { sprite: 'speaker',         x: 208, y: 48  },
    { sprite: 'sofa_2seat_left', x: 80,  y: 144 },
    { sprite: 'sofa_2seat_right',x: 96,  y: 144 },
    { sprite: 'table_round',     x: 144, y: 128 },
    { sprite: 'rug_large',       x: 64,  y: 112 },
    { sprite: 'lamp_floor',      x: 8,   y: 96  },
    { sprite: 'lamp_floor',      x: 272, y: 96  },
    { sprite: 'plant_medium',    x: 256, y: 128 },
    { sprite: 'plant_medium',    x: 8,   y: 128 },
    { sprite: 'picture_wide',    x: 112, y: 32  },
  ],

  kitchen: [
    { sprite: 'window_small',    x: 128, y: 0   },
    { sprite: 'kitchen_counter', x: 0,   y: 48  },
    { sprite: 'kitchen_counter', x: 64,  y: 48  },
    { sprite: 'kitchen_counter_end', x: 128, y: 48 },
    { sprite: 'stove',           x: 96,  y: 48  },
    { sprite: 'sink',            x: 48,  y: 48  },
    { sprite: 'fridge',          x: 256, y: 32  },
    { sprite: 'table_dining_4',  x: 96,  y: 112 },
    { sprite: 'chair_wood',      x: 80,  y: 144 },
    { sprite: 'chair_wood',      x: 144, y: 144 },
    { sprite: 'chair_wood',      x: 80,  y: 96  },
    { sprite: 'chair_wood',      x: 144, y: 96  },
    { sprite: 'plant_small',     x: 8,   y: 160 },
  ],

  art: [
    { sprite: 'window_curtain',  x: 96,  y: 0   },
    { sprite: 'desk_wide',       x: 8,   y: 64  },
    { sprite: 'chair_padded',    x: 24,  y: 96  },
    { sprite: 'desk_small',      x: 176, y: 64  },
    { sprite: 'chair_wood',      x: 184, y: 96  },
    { sprite: 'rug_large',       x: 64,  y: 112 },
    { sprite: 'plant_large',     x: 256, y: 96  },
    { sprite: 'plant_medium',    x: 8,   y: 128 },
    { sprite: 'lamp_table',      x: 8,   y: 48  },
    { sprite: 'picture_wide',    x: 112, y: 32  },
    { sprite: 'picture_small',   x: 160, y: 32  },
    { sprite: 'lamp_floor',      x: 240, y: 80  },
  ],

  bedroom: [
    { sprite: 'window_curtain',  x: 96,  y: 0   },
    { sprite: 'bed_double_h',    x: 16,  y: 48  },
    { sprite: 'nightstand',      x: 80,  y: 64  },
    { sprite: 'alarm_clock',     x: 80,  y: 48  },
    { sprite: 'dresser',         x: 192, y: 48  },
    { sprite: 'wardrobe',        x: 240, y: 32  },
    { sprite: 'rug_small',       x: 80,  y: 128 },
    { sprite: 'lamp_table',      x: 8,   y: 64  },
    { sprite: 'plant_small',     x: 160, y: 160 },
    { sprite: 'picture_wide',    x: 128, y: 32  },
  ],
}
