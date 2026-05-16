export const API_BASE         = 'https://api.normies.art'
export const NORMIES_CONTRACT = '0x9Eb6E2025B64f340691e424b7fe7022fFDE12438'
export const PX_DARK          = '#48494b'
export const PX_LIGHT         = '#e3e5e4'

export const ALL_NEEDS   = ['hunger','energy','fun','social','hygiene','study']
export const NEED_LABELS = { hunger:'HUNGER', energy:'ENERGY', fun:'FUN', social:'SOCIAL', hygiene:'HYGIENE', study:'STUDY' }
export const NEED_ICONS  = { hunger:'🍜', energy:'⚡', fun:'🎮', social:'💬', hygiene:'🚿', study:'📖' }
export const NEED_DECAY  = { hunger:0.36, energy:0.24, fun:0.26, social:0.18, hygiene:0.12, study:0.14 }

export const ACTIVITY_META = {
  sleeping:   { emoji:'💤', label:'Sleeping',    fills:{ energy:+4.2, hunger:-0.1 },              minDur:90,  maxDur:180, pose:'sleep'  },
  napping:    { emoji:'😴', label:'Napping',     fills:{ energy:+2.8 },                            minDur:25,  maxDur:50,  pose:'sleep'  },
  eating:     { emoji:'🍜', label:'Eating',      fills:{ hunger:+8,   energy:+0.8 },               minDur:18,  maxDur:30,  pose:'sit'    },
  cooking:    { emoji:'🍳', label:'Cooking',     fills:{ hunger:+5,   fun:+2 },                    minDur:15,  maxDur:28,  pose:'stand'  },
  gaming:     { emoji:'🕹️', label:'Gaming',      fills:{ fun:+4.5,    energy:-1.5, social:+0.5 },  minDur:35,  maxDur:80,  pose:'sit'    },
  coding:     { emoji:'💻', label:'Coding',      fills:{ study:+5,    fun:+2,      energy:-2.5 },  minDur:40,  maxDur:90,  pose:'sit'    },
  studying:   { emoji:'📖', label:'Studying',    fills:{ study:+5.5,  energy:-2,   fun:-1 },       minDur:40,  maxDur:90,  pose:'sit'    },
  reading:    { emoji:'📚', label:'Reading',     fills:{ study:+3,    fun:+1.2,    energy:-0.6 },  minDur:30,  maxDur:60,  pose:'sit'    },
  journaling: { emoji:'📝', label:'Journaling',  fills:{ study:+2.5,  fun:+2,      energy:-0.5 },  minDur:18,  maxDur:40,  pose:'sit'    },
  watching:   { emoji:'📺', label:'Watching TV', fills:{ fun:+3.5,    social:+1.5, energy:-0.3 },  minDur:30,  maxDur:65,  pose:'sit'    },
  chatting:   { emoji:'💬', label:'Chatting',    fills:{ social:+6,   fun:+2 },                    minDur:14,  maxDur:28,  pose:'stand'  },
  walking:    { emoji:'🚶', label:'Walking',     fills:{ fun:+1.2,    social:+0.5 },               minDur:8,   maxDur:18,  pose:'walk'   },
  outside:    { emoji:'🌙', label:'Outside',     fills:{ social:+3,   fun:+3,      hygiene:+1 },   minDur:25,  maxDur:55,  pose:'walk'   },
  showering:  { emoji:'🚿', label:'Showering',   fills:{ hygiene:+14, energy:+0.5 },               minDur:10,  maxDur:20,  pose:'stand'  },
  exercising: { emoji:'💪', label:'Exercising',  fills:{ energy:+1.5, hygiene:-2,  fun:+2 },       minDur:18,  maxDur:40,  pose:'walk'   },
  yoga:       { emoji:'🧘', label:'Yoga',        fills:{ energy:+3,   hygiene:+1,  fun:+1.5 },     minDur:20,  maxDur:45,  pose:'sit'    },
  sketching:  { emoji:'✏️', label:'Sketching',   fills:{ fun:+2.5,    study:+2 },                  minDur:22,  maxDur:50,  pose:'sit'    },
  jamming:    { emoji:'🎸', label:'Jamming',     fills:{ fun:+5.5,    social:+2.5, energy:-1 },    minDur:22,  maxDur:55,  pose:'stand'  },
  meditating: { emoji:'🧘', label:'Meditating',  fills:{ energy:+2.5, fun:+1.5,    hygiene:+0.5 }, minDur:18,  maxDur:40,  pose:'sit'    },
  dancing:    { emoji:'💃', label:'Dancing',     fills:{ fun:+4.5,    social:+3.5, energy:-2 },    minDur:14,  maxDur:32,  pose:'walk'   },
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
  { typeId:'study',   typeName:'Study Hall',   theme:'study',   activities:['studying','coding','reading','eating','chatting','showering','sketching','journaling'],        desc:'Books, desks, and warm lamplight.' },
  { typeId:'gaming',  typeName:'Gaming Den',   theme:'gaming',  activities:['gaming','coding','chatting','eating','studying','watching'],                                   desc:'Three monitors. Zero sleep.'       },
  { typeId:'chill',   typeName:'Chill Lounge', theme:'chill',   activities:['chatting','reading','eating','gaming','cooking','sketching','meditating','dancing','watching','napping'], desc:'Couch, fairy lights, good vibes.' },
  { typeId:'gym',     typeName:'Dorm Gym',     theme:'gym',     activities:['exercising','yoga','showering','chatting','meditating','dancing','walking'],                   desc:'Get those gains in.'               },
  { typeId:'library', typeName:'Library',      theme:'library', activities:['reading','studying','sketching','meditating','chatting','journaling','napping'],               desc:'Silence required. Mostly.'         },
  { typeId:'music',   typeName:'Music Room',   theme:'music',   activities:['jamming','dancing','chatting','sketching','meditating','exercising'],                          desc:'Loud hours: always.'               },
  { typeId:'kitchen', typeName:'Kitchen',      theme:'kitchen', activities:['cooking','eating','chatting','walking'],                                                       desc:'Communal ramen. Always ramen.'     },
  { typeId:'art',     typeName:'Art Studio',   theme:'art',     activities:['sketching','meditating','chatting','reading','dancing','studying','journaling'],               desc:'Easels. Canvas. Creative chaos.'   },
]

// Bedroom is ALWAYS added to every dorm — the only place normies can sleep
export const BEDROOM_TYPE = {
  typeId:'bedroom', typeName:'Bedroom', theme:'bedroom',
  activities:['sleeping','napping','reading','chatting','studying','gaming','watching','sketching','journaling'],
  desc:'The only place to truly rest.',
}

export const OUTDOOR_TYPE = {
  typeId:'outdoor', typeName:'The Quad', theme:'outdoor',
  activities:['walking','outside','chatting','eating','reading','exercising','meditating','dancing'],
  desc:'Fresh air. Stars at night.',
}

export function buildRoomList(normieCount) {
  const TARGET_OCC = Math.max(4, Math.ceil(normieCount / 12))
  const totalRooms = Math.max(Math.min(Math.ceil(normieCount / TARGET_OCC), 12), 3)
  const rooms = []

  // Bedroom is always room #100 — normies need somewhere to sleep
  rooms.push({
    id:'room-100', number:100, name:'ROOM 100',
    typeId:BEDROOM_TYPE.typeId, typeName:BEDROOM_TYPE.typeName,
    theme:BEDROOM_TYPE.theme, activities:[...BEDROOM_TYPE.activities],
    maxOcc:TARGET_OCC, desc:BEDROOM_TYPE.desc,
  })

  // Fill remaining slots cycling through non-bedroom room types
  const regularTypes = ROOM_TYPES.filter(t => t.typeId !== 'bedroom')
  for (let i = 0; i < totalRooms - 1; i++) {
    const type = regularTypes[i % regularTypes.length]
    const num  = 101 + i
    rooms.push({
      id:`room-${num}`, number:num, name:`ROOM ${num}`,
      typeId:type.typeId, typeName:type.typeName,
      theme:type.theme, activities:[...type.activities],
      maxOcc:TARGET_OCC, desc:type.desc,
    })
  }

  rooms.push({ id:'outdoor', number:0, name:'QUAD', typeId:'outdoor', typeName:'The Quad', theme:'outdoor', activities:[...OUTDOOR_TYPE.activities], maxOcc:99, desc:OUTDOOR_TYPE.desc })
  return rooms
}

export const DEMO_IDS = [1, 44, 112, 388, 627, 1001, 1777, 2500, 3142, 4096, 6666, 8888]
export const ROOMS    = buildRoomList(12)

export const TICK_MS             = 1000
export const GAME_MINS_PER_TICK  = 1
export const MAX_OFFLINE_MINS    = 20160

export const COINS_CLICK_BASE           = 6
export const COINS_PER_TICK_BASE        = 0.22
export const COINS_NEED_SATISFIED       = 18
export const COINS_CRITICAL_PENALTY     = 7
export const COINS_FEED_COST            = 40
export const COINS_ENERGY_DRINK_COST    = 60
export const COINS_STUDY_SESSION_COST   = 55
export const COINS_PARTY_COST           = 90
export const COINS_ACTIVITY_SWITCH      = 2
export const COMBO_WINDOW_MS            = 2000
export const COMBO_MAX                  = 8

// ── XP & Leveling ──────────────────────────────────────────────────────────
// XP = lifetime coins earned. Each level requires more XP than the last.
export const XP_BASE = 800            // coins needed to reach level 2
export const XP_RATE = 1.72           // multiplier per level

export function getXpForLevel(level) {
  if (level <= 1) return 0
  let total = 0
  for (let l = 2; l <= level; l++) total += Math.floor(XP_BASE * Math.pow(XP_RATE, l - 2))
  return total
}

export function calcLevel(totalXP) {
  if (!totalXP || totalXP <= 0) return 1
  let level = 1
  while (level < 100 && getXpForLevel(level + 1) <= totalXP) level++
  return level
}

// Passive income ×(1 + 0.8% per level), click ×(1 + 5% per 5 levels), combo bonus per 10 levels
export function calcLevelBonus(level) {
  const l = Math.max(1, level)
  return {
    passiveMult: 1 + (l - 1) * 0.008,
    clickMult:   1 + Math.floor((l - 1) / 5) * 0.05,
    comboBonus:  Math.floor((l - 1) / 10),
  }
}

export const UPGRADES = [
  { id:'better_food',   icon:'🍜', name:'Better Meals',    desc:'Hunger decays 25% slower',        cost:180,  maxLevel:3, effect:{ decayMult:{hunger:0.75} } },
  { id:'comfy_beds',    icon:'🛏️', name:'Comfy Beds',      desc:'Sleep energy fill +30%',          cost:220,  maxLevel:3, effect:{ fillMult:{energy:1.30}  } },
  { id:'fast_wifi',     icon:'📶', name:'Fast WiFi',       desc:'Passive coins +60%',              cost:380,  maxLevel:3, effect:{ passiveIncomeMult:1.6   } },
  { id:'gaming_setup',  icon:'🕹️', name:'Gaming Setup',    desc:'Fun restores 30% faster',         cost:300,  maxLevel:2, effect:{ fillMult:{fun:1.3}       } },
  { id:'study_lamp',    icon:'💡', name:'Study Lamp',      desc:'Study restores 35% faster',       cost:220,  maxLevel:2, effect:{ fillMult:{study:1.35}    } },
  { id:'social_lounge', icon:'🛋️', name:'Social Lounge',   desc:'Social decays 35% slower',        cost:260,  maxLevel:2, effect:{ decayMult:{social:0.65}  } },
  { id:'click_boost',   icon:'⚡', name:'Hype Machine',    desc:'Click rewards ×2',                cost:550,  maxLevel:3, effect:{ clickMult:2              } },
  { id:'dorm_fund',     icon:'🏦', name:'Dorm Fund',       desc:'+3 passive/normie/tick',          cost:700,  maxLevel:5, effect:{ passiveIncomeFlat:3      } },
  { id:'shower_gel',    icon:'🚿', name:'Shower Gel',      desc:'Hygiene decays 40% slower',       cost:190,  maxLevel:2, effect:{ decayMult:{hygiene:0.6}   } },
  { id:'mood_ring',     icon:'💍', name:'Mood Ring',       desc:'Satisfied bonuses +50%',          cost:750,  maxLevel:2, effect:{ satisfiedMult:1.5         } },
  { id:'combo_gloves',  icon:'🥊', name:'Combo Gloves',    desc:'Max click combo +3',              cost:600,  maxLevel:2, effect:{ comboBonus:3              } },
  { id:'gym_pass',      icon:'💪', name:'Gym Pass',        desc:'Exercise energy fill ×2',         cost:320,  maxLevel:2, effect:{ fillMult:{energy:1.5}     } },
  { id:'sound_system',  icon:'🎸', name:'Sound System',    desc:'Jamming fun fill ×2',             cost:420,  maxLevel:2, effect:{ fillMult:{fun:1.6}         } },
  { id:'art_supplies',  icon:'✏️', name:'Art Supplies',    desc:'Sketching study fill ×2',         cost:280,  maxLevel:2, effect:{ fillMult:{study:1.4}      } },
  { id:'meditation_mat',icon:'🧘', name:'Meditation Mat',  desc:'Energy decays 20% slower',        cost:350,  maxLevel:2, effect:{ decayMult:{energy:0.8}    } },
  { id:'laptop_stand',  icon:'💻', name:'Laptop Stand',    desc:'Coding/study fill +25%',          cost:400,  maxLevel:2, effect:{ fillMult:{study:1.25}     } },
]

export const ACHIEVEMENTS = [
  // ── Tutorial (first 5 min) ─────────────────────────────────────────────
  { id:'first_click',    icon:'👆', name:'First Tap',       desc:'Click a Normie for the first time',               reward:10   },
  { id:'first_upgrade',  icon:'⬆️', name:'Renovator',       desc:'Buy your first upgrade',                          reward:50   },
  { id:'combo_5',        icon:'🔥', name:'On Fire',         desc:'Build a ×5 click combo',                          reward:100  },
  { id:'survivor',       icon:'⚠️', name:'Crisis Averted', desc:'Rescue a Normie from a critical need',             reward:75   },

  // ── Engagement (30 min) ────────────────────────────────────────────────
  { id:'coins_1000',     icon:'🪙', name:'First Paycheck',  desc:'Earn 1,000 coins total',                          reward:50   },
  { id:'click_100',      icon:'🤙', name:'Tap Addict',      desc:'Click Normies 100 times',                         reward:150  },
  { id:'feed_5',         icon:'🍜', name:'Mess Hall',       desc:'Feed Normies 5 times',                            reward:50   },
  { id:'five_upgrades',  icon:'🛠️', name:'Handyman',       desc:'Buy 5 upgrades total',                            reward:150  },
  { id:'night_owl',      icon:'🌙', name:'Night Owl',       desc:'Have Normies active at game midnight',             reward:100  },
  { id:'six_activities', icon:'🎯', name:'Variety Pack',    desc:'6 different activities running at once',           reward:100  },

  // ── Skill (active play) ────────────────────────────────────────────────
  { id:'combo_max',      icon:'🚀', name:'Full Send',       desc:`Hit the maximum ×${COMBO_MAX} combo`,             reward:250  },
  { id:'coins_5000',     icon:'💰', name:'Getting Paid',    desc:'Earn 5,000 coins total',                          reward:100  },
  { id:'coins_25000',    icon:'💎', name:'Dorm Rich',       desc:'Earn 25,000 coins total',                         reward:350  },
  { id:'all_happy',      icon:'😊', name:'Dorm Bliss',      desc:'Every Normie above 75 in all needs at once',      reward:300  },
  { id:'click_500',      icon:'⚡', name:'Combo Machine',   desc:'Click Normies 500 times',                         reward:400  },
  { id:'feed_20',        icon:'🧑‍🍳', name:'Head Chef',     desc:'Feed Normies 20 times',                           reward:200  },
  { id:'survivor_x5',    icon:'🏥', name:'Dorm Medic',      desc:'Rescue Normies from critical need 5 times',       reward:250  },

  // ── Mastery (dedicated play) ───────────────────────────────────────────
  { id:'combo_god',      icon:'💥', name:'Combo God',       desc:`Hit max combo 5 times in one session`,            reward:750  },
  { id:'coins_100000',   icon:'🏦', name:'Mogul',           desc:'Earn 100,000 coins total',                        reward:1000 },
  { id:'peak_dorm',      icon:'✨', name:'Peak Dorm',       desc:'Average dorm happiness above 90%',                reward:500  },
  { id:'all_activities', icon:'🌈', name:'Full Roster',     desc:'Observe 12 different activity types in a session', reward:500 },
  { id:'max_upgrade',    icon:'⭐', name:'Maxed Out',        desc:'Max-level any single upgrade',                    reward:400  },

  // ── Legend (hardcore) ──────────────────────────────────────────────────
  { id:'click_2000',     icon:'🌊', name:'Unstoppable',     desc:'Click Normies 2,000 times',                       reward:1500 },
  { id:'coins_500000',   icon:'👑', name:'Legend',          desc:'Earn 500,000 coins total',                        reward:5000 },
  { id:'perfect_dorm',   icon:'💫', name:'Perfect Dorm',    desc:'All Normies above 90 in every need at once',      reward:2000 },

  // ── Leveling ─────────────────────────────────────────────────────────────
  { id:'level_5',        icon:'🎖️', name:'Sophomore',       desc:'Reach Level 5',                                   reward:500  },
  { id:'level_10',       icon:'🎓', name:'Junior',          desc:'Reach Level 10',                                  reward:1500 },
  { id:'level_20',       icon:'🏆', name:'Senior',          desc:'Reach Level 20',                                  reward:5000 },
  { id:'level_50',       icon:'👑', name:'Dean',            desc:'Reach Level 50',                                  reward:25000},

  // ── Sleep system ─────────────────────────────────────────────────────────
  { id:'good_night',     icon:'🌙', name:'Lights Out',      desc:'Have 3+ Normies sleeping at the same time',       reward:200  },
  { id:'well_rested',    icon:'☀️', name:'Well Rested',      desc:'A Normie wakes up with 95+ energy',              reward:150  },
  { id:'sleep_master',   icon:'💤', name:'Dormitory',       desc:'Have every Normie sleep at least once',           reward:800  },
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

// ── Room-contextual chat lines ─────────────────────────────────────────────
// Two-tier lookup: ROOM_CHAT[roomType][activity] → string[]
// Fallback chain: room+activity → room only → activity only → critical
export const ROOM_CHAT = {
  study: {
    studying:   ["this proof is actually killing me","3 more chapters i promise","someone explain integration by parts","brain.exe has stopped","office hours were useless","my notes make no sense from last week","ok i actually get it now","pulling another all-nighter apparently"],
    reading:    ["this book is insane btw","one more chapter i swear","annotating everything","author really said that huh"],
    gaming:     ["just one match then i'll study","ok NOW i'll study","the desk is for gaming too","productivity speedrun any%"],
    eating:     ["studying burns calories right","snack break mandatory","caffeine status: critical","can't think on an empty stomach"],
    chatting:   ["did you get the notes from tuesday","what's on the exam exactly","how are you not panicking rn","collab session?","waiting for someone to start studying first"],
    _room:      ["lamp life","the quiet hour","desk hours","academia","study szn"],
  },
  gaming: {
    gaming:     ["one more match","they literally just hacked me","gg ez","this ping tho","carried the whole lobby","uninstalling and reinstalling","new meta just dropped","top diff no cap","stream worthy honestly"],
    chatting:   ["ranked grind season","who's queuing","1v1 me","you're so bad at this game i love you","clutch city","spec me"],
    studying:   ["studying between games counts","dual screen productivity","just kidding i'm watching a stream","ok but listen"],
    eating:     ["dinner at the setup","eating between queues","hydration check","gamer fuel only"],
    sleeping:   ["i'll sleep after this game","5am it is","worth it though","last game i promise"],
    _room:      ["no sleep gang","ranked szn","the setup goes hard","monitor bright hours","gaming lounge"],
  },
  chill: {
    chatting:   ["what are we watching","nobody agreed to this show","I'm not getting up for snacks","vibes are immaculate","this couch has a gravitational pull","hours passed somehow","this is genuinely relaxing","not moving, ever"],
    reading:    ["found a good book on the shelf","couch reading is elite","this is better than the movie","page 200 already what"],
    eating:     ["someone order something","snack situation is dire","who made this and why is it good","communal fridge raid"],
    dancing:    ["no one was supposed to see that","accidental dance party","ok but this song though","the floor is mine apparently"],
    gaming:     ["couch gaming hits different","casual mode only","we're all losing together","take turns or?"],
    meditating: ["peace and quiet finally","vibe check: passing","clearing the backlog of thoughts","doing nothing professionally"],
    _room:      ["good vibes only","chill hours","the lounge claims another victim","couch szn","energy: low, vibe: high"],
  },
  gym: {
    exercising: ["leg day never ends","spotter?","almost didn't come","no pain no gain or whatever","last set i promise","form check?","PR incoming","motivation found in the parking lot","this is what I trained for","the gym is my therapy"],
    chatting:   ["rest day socials","gym talk only","split advice needed","who's skipping today","accountability check"],
    dancing:    ["cardio but make it fun","interpretive workout","the gym plays WHAT now","this is technically stretching"],
    meditating: ["cool down mode","breathing exercises count","mindful gains","muscle recovery arc"],
    showering:  ["post-workout clarity hits different","shower thought incoming","everything is solved in here","the best ideas happen now"],
    _room:      ["getting gains","sweat session","iron therapy","no days off","this gym is undefeated"],
  },
  library: {
    studying:   ["shh","finals energy in here","3 hours til close","this book is underrated btw","citations only","the silence is the feature","deep work mode activated","haven't blinked in an hour"],
    reading:    ["found this gem","annotating extensively","the lore is insane","author is a genius or a maniac","re-reading this for the third time"],
    meditating: ["libraries are sacred","the quiet is loud somehow","thinking thoughts","processing..."],
    chatting:   ["notes comparison","whisper session","library gossip is the best gossip","post-study debrief"],
    napping:    ["don't tell anyone","the chair is surprisingly comfortable","study nap is still a nap","recovery mode"],
    sketching:  ["drawing what I'm reading","character illustrations","marginalia art","the books inspired this"],
    _room:      ["silence is golden","archive mode","the stacks know","books over everything","reading hours"],
  },
  music: {
    jamming:    ["this chord progression hits","can you play that again","the acoustics in here are fire","almost got it","this riff is living rent free","key change unlocked","session mode","we recorded something actually","i've been on this song for 2 hours"],
    dancing:    ["can't not move to this","the room has good energy","freestyle only","the beat demands it"],
    chatting:   ["collab energy","we should record this","what key is this in","you hear that progression","studio talk"],
    sketching:  ["drawing to the music","synesthesia hours","the song looks like this"],
    exercising: ["music room cardio","practice has footwork","rhythm is movement"],
    _room:      ["studio mode","sound therapy","the music room never misses","vibrations only","one take wonder"],
  },
  kitchen: {
    cooking:    ["who ate my leftovers","dining hall was closed so","ramen at 2am hits different","who used the last hot sauce","making enough for everyone","secret ingredient is spite","recipe from memory","this is either genius or terrible","the smoke alarm is shy today"],
    eating:     ["finally something that isn't sad","communal kitchen W","tastes better at this hour","sharing is optional","this took 20 minutes or forever"],
    chatting:   ["kitchen talk is the realest talk","everyone ends up in here","3am kitchen conversations","overheard something wild","kitchen counter council"],
    walking:    ["just passing through","looking for snacks","assessing the situation","kitchen audit"],
    _room:      ["fridge light hours","communal chaos","the kitchen lives","ramen republic","midnight snack arc"],
  },
  art: {
    sketching:  ["the light in here","this brush is perfect","I've been staring at this canvas for an hour","it's abstract okay","the piece is telling me things","I just keep adding layers","is this done? I don't know","three hours passed somehow","the mess is the art","happy accident"],
    meditating: ["art is meditation anyway","blank canvas energy","open mind open canvas","breathing before I begin"],
    chatting:   ["art talk only","what do you see in this","destructive feedback welcome","comparing techniques","we should collab"],
    reading:    ["art history deep dive","reference material","theory time","the masters knew something"],
    dancing:    ["movement as art","embodied expression","the room as canvas","performance piece?"],
    _room:      ["creative hours","the studio claims me","paint on everything","art is the point","chaos as method"],
  },
  bedroom: {
    sleeping:   ["do not disturb","5 more minutes","processing the day","in another dimension rn","out cold","dream arc initiated","finally","crashed immediately"],
    napping:    ["needed this","20 minutes max (it's been 3 hours)","recovery nap","the pillow wins","just resting my eyes"],
    watching:   ["what are we watching","who picked this","ok this is actually good","been watching for 3 hours somehow","comfort episode again"],
    chatting:   ["can you please be quiet","what was that noise at 3am","who's leaving at 6am","dorm life check","this room has seen things"],
    studying:   ["desk to bed pipeline","studying horizontal","last minute mode","I work better here actually"],
    gaming:     ["bed gaming is a lifestyle","playing until I fall asleep","comfort slot","one more level then I'll sleep"],
    journaling: ["getting thoughts out","today was something","writing before sleep clears my head","documented"],
    _room:      ["cozy hours","bedroom arc","the bed is calling","nap o'clock","recharge mode","pillow thoughts"],
  },
  outdoor: {
    outside:    ["campus looks different at this hour","did you see that squirrel","it's not even that cold","the quad is actually beautiful","stars are insane tonight","air is different out here","I came out here to think","everyone's here or no one is","bench claims me","sitting outside for no reason but it helps"],
    walking:    ["just walking around","clearing my head","spontaneous lap around campus","found a new path","the long way back"],
    chatting:   ["quad talk hits different","accidental outdoor meeting","caught up with someone","the bench council convenes","impromptu hangout"],
    exercising: ["outdoor workout unlocked","campus run time","track is empty at this hour","running towards nothing"],
    eating:     ["outside eating is elite","dining al fresco","grass snacking","the picnic that wasn't planned"],
    meditating: ["outdoor breathing","stars and thoughts","just being here","the sky is enormous actually"],
    dancing:    ["empty quad dance party","someone saw me and I don't care","music in my head","freestyle in the open air"],
    _room:      ["in the quad","touching grass","outdoor mode","fresh air arc","campus hours"],
  },
  critical:   ['someone help','low hp','empty everything','send food immediately','I need sleep NOW','everything is empty','cannot go on like this','critical condition','SOS','running on fumes'],
}

export const CHAT_LINES = {
  chatting:   ['sup','done the hw?','wifi is down AGAIN','ordered pizza','who ate my ramen','gm','good vibes only','late night grind','still up?','based'],
  outside:    ['nice out here','stargazing','moon looking fire','touching grass rn','this bench slaps'],
  gaming:     ['gg no re','trash lobby','clutch','griefed','skill diff','let me cook','L + ratio'],
  eating:     ['finally eating','ramen again','whose turn to cook','empty pantry','this slaps'],
  studying:   ['not now','one more hour...','send help','brain full','do not disturb'],
  coding:     ['debugging this nightmare','almost got it','why does this work','coffee number three','the code is lying to me'],
  exercising: ['getting gains','no days off','sweat session','lets gooo'],
  yoga:       ['namaste','finding balance','breathing','center mode','this is harder than it looks'],
  cooking:    ['making ramen again','secret recipe','smells good in here'],
  sketching:  ['art is therapy','making something','dont look yet'],
  jamming:    ['drop the beat','vibes rn','this riff goes hard','studio mode'],
  dancing:    ['got moves','the floor is mine','dance battle?'],
  meditating: ['inner peace','quiet hours','om...','not right now'],
  reading:    ['one more chapter','this is actually good','shh'],
  journaling: ['getting it all down','processing','writing helps','documentation of life'],
  watching:   ['this show is so good','one more episode','we should watch together','ok I did not expect that'],
  sleeping:   ['zzz','out cold','do not disturb','dreaming','finally'],
  critical:   ['im dying','send food','need sleep NOW','LOW HP','cant go on'],
}

// ── Daily challenge pool ────────────────────────────────────────────────────
export const CHALLENGE_POOL = [
  { id:'combo4',    icon:'🔥', desc:'Build a ×4 combo',              type:'maxCombo',    target:4,   reward:200 },
  { id:'combo6',    icon:'💥', desc:'Build a ×6 combo',              type:'maxCombo',    target:6,   reward:350 },
  { id:'feed3',     icon:'🍜', desc:'Feed a Normie 3 times',          type:'feed',        target:3,   reward:175 },
  { id:'feed8',     icon:'🍽️', desc:'Feed Normies 8 times today',     type:'feed',        target:8,   reward:400 },
  { id:'click50',   icon:'👆', desc:'Click 50 times',                 type:'clicks',      target:50,  reward:150 },
  { id:'click200',  icon:'🤙', desc:'Click 200 times',                type:'clicks',      target:200, reward:600 },
  { id:'coins300',  icon:'🪙', desc:'Earn 300 coins clicking',        type:'clickCoins',  target:300, reward:250 },
  { id:'coins1000', icon:'💰', desc:'Earn 1,000 coins clicking',      type:'clickCoins',  target:1000,reward:750 },
  { id:'allhappy',  icon:'😊', desc:'All Normies above 70% happy',    type:'allHappy',    target:1,   reward:300 },
  { id:'allgreat',  icon:'🌟', desc:'All Normies above 85% happy',    type:'allGreat',    target:1,   reward:600 },
  { id:'upgrade1',  icon:'⬆️', desc:'Buy an upgrade',                 type:'upgrades',    target:1,   reward:200 },
  { id:'upgrade3',  icon:'🏗️', desc:'Buy 3 upgrades today',           type:'upgrades',    target:3,   reward:550 },
  { id:'outside3',  icon:'🌳', desc:'Have 3 Normies outside at once', type:'outsideCount',target:3,   reward:300 },
  { id:'maxcombo',  icon:'👑', desc:'Hit the maximum combo',          type:'maxCombo',    target:8,   reward:800 },
  { id:'survive',   icon:'💪', desc:'Recover a Normie from critical', type:'recovered',   target:1,   reward:250 },
]
