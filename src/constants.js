export const API_BASE         = 'https://api.normies.art'
export const NORMIES_CONTRACT = '0x9Eb6E2025B64f340691e424b7fe7022fFDE12438'
export const PX_DARK          = '#48494b'
export const PX_LIGHT         = '#e3e5e4'

export const ALL_NEEDS   = ['hunger','energy','fun','social','hygiene','study']
export const NEED_LABELS = { hunger:'HUNGER', energy:'ENERGY', fun:'FUN', social:'SOCIAL', hygiene:'HYGIENE', study:'STUDY' }
export const NEED_ICONS  = { hunger:'🍜', energy:'⚡', fun:'🎮', social:'💬', hygiene:'🚿', study:'📖' }
export const NEED_DECAY  = { hunger:0.28, energy:0.18, fun:0.20, social:0.14, hygiene:0.09, study:0.11 }

export const ACTIVITY_META = {
  sleeping:   { emoji:'💤', label:'Sleeping',   fills:{ energy:+3.5, hunger:-0.1 },              minDur:80,  maxDur:160, pose:'sleep'  },
  napping:    { emoji:'😴', label:'Napping',    fills:{ energy:+2.5 },                            minDur:20,  maxDur:45,  pose:'sleep'  },
  eating:     { emoji:'🍜', label:'Eating',     fills:{ hunger:+7,   energy:+0.8 },               minDur:18,  maxDur:30,  pose:'sit'    },
  cooking:    { emoji:'🍳', label:'Cooking',    fills:{ hunger:+4,   fun:+1.5 },                  minDur:15,  maxDur:28,  pose:'stand'  },
  gaming:     { emoji:'🕹️', label:'Gaming',     fills:{ fun:+4.5,    energy:-1.2, social:+0.5 },  minDur:30,  maxDur:70,  pose:'sit'    },
  studying:   { emoji:'📖', label:'Studying',   fills:{ study:+5,    energy:-1.8, fun:-0.8 },     minDur:35,  maxDur:80,  pose:'sit'    },
  reading:    { emoji:'📚', label:'Reading',    fills:{ study:+2.5,  fun:+1,   energy:-0.5 },     minDur:25,  maxDur:55,  pose:'sit'    },
  chatting:   { emoji:'💬', label:'Chatting',   fills:{ social:+5.5, fun:+2 },                    minDur:12,  maxDur:25,  pose:'stand'  },
  walking:    { emoji:'🚶', label:'Walking',    fills:{ fun:+1,      social:+0.5 },               minDur:8,   maxDur:18,  pose:'walk'   },
  outside:    { emoji:'🌙', label:'Outside',    fills:{ social:+2.5, fun:+2.5,  hygiene:+1 },     minDur:20,  maxDur:50,  pose:'walk'   },
  showering:  { emoji:'🚿', label:'Showering',  fills:{ hygiene:+12, energy:+0.5 },               minDur:10,  maxDur:20,  pose:'stand'  },
  exercising: { emoji:'💪', label:'Exercising', fills:{ energy:+1.5, hygiene:-1.5, fun:+1.5 },   minDur:15,  maxDur:35,  pose:'walk'   },
  sketching:  { emoji:'✏️', label:'Sketching',  fills:{ fun:+2,      study:+1.5 },                minDur:20,  maxDur:45,  pose:'sit'    },
  jamming:    { emoji:'🎸', label:'Jamming',    fills:{ fun:+5,      social:+2,  energy:-0.8 },   minDur:20,  maxDur:50,  pose:'stand'  },
  meditating: { emoji:'🧘', label:'Meditating', fills:{ energy:+2,   fun:+1.5,   hygiene:+0.5 }, minDur:15,  maxDur:35,  pose:'sit'    },
  dancing:    { emoji:'💃', label:'Dancing',    fills:{ fun:+4,      social:+3,  energy:-1.5 },   minDur:12,  maxDur:30,  pose:'walk'   },
}

export const ARCHETYPES = {
  Cat:           { social:0.7,  fun:1.3,  hygiene:1.2 },
  Alien:         { study:1.4,   fun:0.8,  social:0.6  },
  Agent:         { energy:1.3,  social:0.8, study:1.1  },
  Human:         {},
  Young:         { fun:1.2,     study:0.9, energy:1.1  },
  'Middle-Aged': { study:1.2,   social:1.1, fun:0.9    },
  Old:           { social:1.3,  energy:0.8, study:1.4  },
  Friendly:      { social:1.4  },
  Serious:       { study:1.4,   fun:0.7  },
  Confident:     { social:1.2,  energy:1.1 },
  Peaceful:      { energy:0.8,  fun:1.1  },
  Content:       { fun:1.1     },
}

export const ROOM_TYPES = [
  { typeId:'study',   typeName:'Study Hall',   theme:'study',   activities:['sleeping','napping','studying','reading','eating','chatting','showering','sketching','gaming','cooking'],        desc:'Books, desks, and warm lamplight.' },
  { typeId:'gaming',  typeName:'Gaming Den',   theme:'gaming',  activities:['sleeping','napping','gaming','chatting','eating','studying','sketching'],                                        desc:'Three monitors. Zero sleep.'       },
  { typeId:'chill',   typeName:'Chill Lounge', theme:'chill',   activities:['sleeping','napping','chatting','reading','eating','gaming','cooking','sketching','meditating','dancing'],       desc:'Couch, fairy lights, good vibes.'  },
  { typeId:'gym',     typeName:'Dorm Gym',     theme:'gym',     activities:['exercising','showering','chatting','meditating','dancing','walking'],                                           desc:'Get those gains in.'               },
  { typeId:'library', typeName:'Library',      theme:'library', activities:['reading','studying','sketching','meditating','chatting','napping'],                                             desc:'Silence required. Mostly.'         },
  { typeId:'music',   typeName:'Music Room',   theme:'music',   activities:['jamming','dancing','chatting','sketching','meditating','exercising'],                                           desc:'Loud hours: always.'               },
  { typeId:'kitchen', typeName:'Kitchen',      theme:'kitchen', activities:['cooking','eating','chatting','walking'],                                                                        desc:'Communal ramen. Always ramen.'     },
  { typeId:'art',     typeName:'Art Studio',   theme:'art',     activities:['sketching','meditating','chatting','reading','dancing','studying'],                                             desc:'Easels. Canvas. Creative chaos.'   },
]

export const OUTDOOR_TYPE = {
  typeId:'outdoor', typeName:'The Quad', theme:'outdoor',
  activities:['walking','outside','chatting','eating','reading','exercising','meditating','dancing'],
  desc:'Fresh air. Stars at night.',
}

export function buildRoomList(normieCount) {
  const roomCount = Math.ceil(Math.max(normieCount, 1) / 4)
  const rooms = []
  for (let i = 0; i < roomCount; i++) {
    const type = ROOM_TYPES[i % ROOM_TYPES.length]
    const num  = 100 + i + 1
    rooms.push({ id:`room-${num}`, number:num, name:`ROOM ${num}`, typeId:type.typeId, typeName:type.typeName, theme:type.theme, activities:[...type.activities], maxOcc:4, desc:type.desc })
  }
  rooms.push({ id:'outdoor', number:0, name:'QUAD', typeId:'outdoor', typeName:'The Quad', theme:'outdoor', activities:[...OUTDOOR_TYPE.activities], maxOcc:99, desc:OUTDOOR_TYPE.desc })
  return rooms
}

export const DEMO_IDS = [1, 44, 112, 388, 627, 1001, 1777, 2500, 3142, 4096, 6666, 8888]
export const ROOMS    = buildRoomList(12)

export const TICK_MS             = 1000
export const GAME_MINS_PER_TICK  = 1
export const MAX_OFFLINE_MINS    = 20160

export const COINS_CLICK_BASE           = 8
export const COINS_PER_TICK_BASE        = 0.6
export const COINS_NEED_SATISFIED       = 15
export const COINS_CRITICAL_PENALTY     = 8
export const COINS_FEED_COST            = 35
export const COINS_ENERGY_DRINK_COST    = 50
export const COINS_STUDY_SESSION_COST   = 45
export const COINS_PARTY_COST           = 80
export const COINS_ACTIVITY_SWITCH      = 2
export const COMBO_WINDOW_MS            = 2500
export const COMBO_MAX                  = 8

export const UPGRADES = [
  { id:'better_food',   icon:'🍜', name:'Better Meals',  desc:'Hunger decays 25% slower',     cost:120, maxLevel:3, effect:{ decayMult:{hunger:0.75} } },
  { id:'comfy_beds',    icon:'🛏️', name:'Comfy Beds',    desc:'Energy restores 25% faster',   cost:160, maxLevel:3, effect:{ fillMult:{energy:1.25}  } },
  { id:'fast_wifi',     icon:'📶', name:'Fast WiFi',     desc:'Passive coins +60%',            cost:250, maxLevel:3, effect:{ passiveIncomeMult:1.6   } },
  { id:'gaming_setup',  icon:'🕹️', name:'Gaming Setup',  desc:'Fun restores 30% faster',      cost:200, maxLevel:2, effect:{ fillMult:{fun:1.3}       } },
  { id:'study_lamp',    icon:'💡', name:'Study Lamp',    desc:'Study restores 35% faster',    cost:150, maxLevel:2, effect:{ fillMult:{study:1.35}    } },
  { id:'social_lounge', icon:'🛋️', name:'Social Lounge', desc:'Social decays 35% slower',     cost:180, maxLevel:2, effect:{ decayMult:{social:0.65}  } },
  { id:'click_boost',   icon:'⚡', name:'Hype Machine',  desc:'Click rewards ×2',              cost:350, maxLevel:3, effect:{ clickMult:2              } },
  { id:'dorm_fund',     icon:'🏦', name:'Dorm Fund',     desc:'+3 passive/normie/tick',        cost:450, maxLevel:5, effect:{ passiveIncomeFlat:3      } },
  { id:'shower_gel',    icon:'🚿', name:'Shower Gel',    desc:'Hygiene decays 40% slower',    cost:130, maxLevel:2, effect:{ decayMult:{hygiene:0.6}   } },
  { id:'mood_ring',     icon:'💍', name:'Mood Ring',     desc:'Satisfied bonuses +50%',       cost:500, maxLevel:2, effect:{ satisfiedMult:1.5         } },
  { id:'combo_gloves',  icon:'🥊', name:'Combo Gloves',  desc:'Max click combo +3',           cost:400, maxLevel:2, effect:{ comboBonus:3              } },
  { id:'gym_pass',      icon:'💪', name:'Gym Pass',      desc:'Exercise energy fill ×2',      cost:220, maxLevel:2, effect:{ fillMult:{energy:1.5}     } },
  { id:'sound_system',  icon:'🎸', name:'Sound System',  desc:'Jamming fun fill ×2',          cost:280, maxLevel:2, effect:{ fillMult:{fun:1.6}         } },
  { id:'art_supplies',  icon:'✏️', name:'Art Supplies',  desc:'Sketching study fill ×2',      cost:190, maxLevel:2, effect:{ fillMult:{study:1.4}      } },
]

export const ACHIEVEMENTS = [
  { id:'first_click',    icon:'👆', name:'First Click',       desc:'Click your first normie'         },
  { id:'combo_5',        icon:'🔥', name:'Combo ×5',          desc:'Hit a ×5 click combo'            },
  { id:'coins_1000',     icon:'🪙', name:'Bag Secured',       desc:'Earn 1,000 coins total'          },
  { id:'all_happy',      icon:'😊', name:'Dorm Bliss',        desc:'All needs above 80 at once'      },
  { id:'first_upgrade',  icon:'⬆️', name:'Upgrade Time',      desc:'Buy your first upgrade'          },
  { id:'six_activities', icon:'🎯', name:'Variety Pack',      desc:'6 different activities at once'  },
  { id:'feed_5',         icon:'🍜', name:'Mess Hall',         desc:'Feed normies 5 times'            },
  { id:'coins_10000',    icon:'💰', name:'Dorm Millionaire',  desc:'Earn 10,000 coins total'         },
]

export const EVENT_TEMPLATES = {
  coins:        (n, amt, combo) => combo > 1 ? `${n} tapped ×${combo} → +${amt}🪙` : `${n} tapped → +${amt}🪙`,
  feed:         (n)             => `${n} chowed down 🍜`,
  energyDrink:  (n)             => `${n} slammed an energy drink ⚡`,
  party:        ()              => `🎉 Quad party! All social +30`,
  studySession: ()              => `📚 Group study session! All study +25`,
  upgrade:      (name, lvl)     => `Upgraded ${name} to Lv.${lvl}`,
  achieve:      (name)          => `🏆 Achievement: ${name}`,
  satisfied:    (n, k)          => `${n}'s ${k} fully restored!`,
  critical:     (n, k)          => `⚠️ ${n} — ${k} critically low!`,
  sleeping:     (n)             => `${n} went to sleep 💤`,
  gaming:       (n)             => `${n} started gaming 🕹️`,
  studying:     (n)             => `${n} hit the books 📖`,
  chatting:     (n)             => `${n} is chatting 💬`,
  outside:      (n)             => `${n} went outside 🌙`,
  eating:       (n)             => `${n} is eating 🍜`,
  exercising:   (n)             => `${n} is working out 💪`,
  jamming:      (n)             => `${n} is jamming 🎸`,
  dancing:      (n)             => `${n} is dancing 💃`,
  meditating:   (n)             => `${n} is meditating 🧘`,
}

export const CHAT_LINES = {
  chatting:   ['sup','done the hw?','wifi is down AGAIN','ordered pizza','who ate my ramen','gm ser','wen mint','good vibes only','touch grass','late night grind','normie behavior tbh','still up?','based','anon pls'],
  outside:    ['nice out here','stargazing','moon looking fire','touching grass rn','this bench slaps'],
  gaming:     ['gg no re','trash lobby','clutch','griefed','skill diff','let me cook','L + ratio'],
  eating:     ['finally eating','ramen again','whose turn to cook','empty pantry','this slaps'],
  studying:   ['not now','one more hour...','send help','brain full','do not disturb'],
  exercising: ['getting gains','no days off','sweat session','lets gooo'],
  cooking:    ['making ramen again','secret recipe','smells good in here'],
  sketching:  ['art is therapy','making something','dont look yet'],
  jamming:    ['drop the beat','vibes rn','this riff goes hard','studio mode'],
  dancing:    ['got moves','the floor is mine','dance battle?'],
  meditating: ['inner peace','quiet hours','om...','not right now'],
  reading:    ['one more chapter','this is actually good','shh'],
  critical:   ['im dying','send food','need sleep NOW','LOW HP','cant go on'],
}
