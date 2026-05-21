import {
  ALL_NEEDS, NEED_DECAY, ACTIVITY_META, ARCHETYPES,
  UPGRADES, ACHIEVEMENTS,
  MAX_OFFLINE_MINS, TICK_MS, GAME_MINS_PER_TICK, COMBO_MAX,
  calcLevel, getXpForLevel,
} from './constants.js'

// ── Needs ──────────────────────────────────────────────────────────────────

export function freshNeeds() {
  return { hunger:75+Math.random()*20, energy:70+Math.random()*25, fun:65+Math.random()*30, social:60+Math.random()*35, hygiene:80+Math.random()*18, study:50+Math.random()*40 }
}

export function clamp(v, lo=0, hi=100) { return Math.max(lo, Math.min(hi, v)) }

// ── Personality ────────────────────────────────────────────────────────────

export function buildPersonality(traits) {
  const mults = { hunger:1, energy:1, fun:1, social:1, hygiene:1, study:1 }
  if (!traits) return mults
  for (const t of traits) {
    const arch = ARCHETYPES[t]
    if (!arch) continue
    for (const [k,v] of Object.entries(arch)) if (k in mults) mults[k] *= v
  }
  return mults
}

// ── Activity logic ─────────────────────────────────────────────────────────

export function pickActivity(needs, personality, currentLocation, rooms) {
  // Determine available rooms
  const roomList = rooms || []
  const allLocations = roomList.map(r => r.id)
  if (!allLocations.includes(currentLocation)) {
    // Default to first indoor room or outdoor
    const fallback = roomList.find(r => r.typeId !== 'outdoor') || roomList[0]
    if (fallback) currentLocation = fallback.id
  }

  // Find what activities are available based on location room type
  let availableActivities = null
  const room = roomList.find(r => r.id === currentLocation)
  if (room) availableActivities = room.activities

  // Critical need overrides
  if (needs.hunger  < 15) return { activity:'eating',    location: _roomWithActivity('eating',    roomList, currentLocation) }
  if (needs.energy  < 12) return { activity:'sleeping',  location: _roomWithActivity('sleeping',  roomList, currentLocation) }
  if (needs.hygiene < 10) return { activity:'showering', location: _roomWithActivity('showering', roomList, currentLocation) }

  // Weighted pick based on lowest needs
  const candidates = []
  const acts = Object.entries(ACTIVITY_META)
  for (const [act, meta] of acts) {
    if (!meta.fills) continue
    // Check if this activity is available somewhere
    const targetLoc = _roomWithActivity(act, roomList, currentLocation)
    if (!targetLoc) continue

    let score = 10
    for (const [need, fill] of Object.entries(meta.fills)) {
      if (fill > 0 && needs[need] < 60) score += (60 - needs[need]) * fill * (personality[need] || 1) * 0.1
    }
    // Slight preference for current room's activities
    if (availableActivities?.includes(act)) score += 5
    // No outdoor bias - normies should start and stay in rooms naturally
    candidates.push({ activity:act, location:targetLoc, score: score * (0.7 + Math.random() * 0.6) })
  }

  candidates.sort((a,b) => b.score - a.score)
  const pick = candidates[0] || { activity:'walking', location: currentLocation }
  return { activity: pick.activity, location: pick.location }
}

function _roomWithActivity(activity, rooms, currentLocation) {
  if (!rooms || rooms.length === 0) return currentLocation

  // sleeping is strictly bedroom-only - normies must go to bed, not sleep at desk
  if (activity === 'sleeping') {
    const bedrooms = rooms.filter(r => r.typeId === 'bedroom')
    if (bedrooms.length > 0) return bedrooms[Math.floor(Math.random() * bedrooms.length)].id
    // fallback if somehow no bedroom exists
    const anywhere = rooms.filter(r => r.activities?.includes(activity))
    return anywhere.length > 0 ? anywhere[Math.floor(Math.random() * anywhere.length)].id : currentLocation
  }

  // Check if current room supports this activity
  const current = rooms.find(r => r.id === currentLocation)
  if (current?.activities?.includes(activity)) return currentLocation
  // Find a room that does
  const options = rooms.filter(r => r.activities?.includes(activity))
  if (options.length === 0) return null
  return options[Math.floor(Math.random() * options.length)].id
}

export function activityDuration(activity) {
  const m = ACTIVITY_META[activity]
  if (!m) return 20 + Math.floor(Math.random() * 20)
  return m.minDur + Math.floor(Math.random() * (m.maxDur - m.minDur))
}

// ── Tick ───────────────────────────────────────────────────────────────────

export function tickNormie(normie, upgradeEffects = {}) {
  const satisfied = []
  const dm = upgradeEffects.decayMult || {}
  const fm = upgradeEffects.fillMult  || {}
  const meta = ACTIVITY_META[normie.activity]

  for (const need of ALL_NEEDS) {
    const prevVal = normie.needs[need]

    // Decay
    const decayRate = NEED_DECAY[need] * (dm[need] || 1)
    normie.needs[need] = clamp(normie.needs[need] - decayRate)

    // Fill from activity
    if (meta?.fills?.[need]) {
      const fill = meta.fills[need] * (fm[need] || 1)
      normie.needs[need] = clamp(normie.needs[need] + fill)
    }

    // Satisfied event (crossed 90)
    if (prevVal < 90 && normie.needs[need] >= 90) satisfied.push(need)
  }
  return satisfied
}

// ── Save / Load ────────────────────────────────────────────────────────────

export function saveState(address, data) {
  try { localStorage.setItem(`nd_${address.toLowerCase()}`, JSON.stringify({ ...data, savedAt: Date.now() })) } catch {}
}

export function loadState(address) {
  try {
    const raw = localStorage.getItem(`nd_${address.toLowerCase()}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function applyOfflineCatchup(saved) {
  const now = Date.now()
  const elapsed = Math.min((now - (saved.savedAt || now)) / 1000 / 60, MAX_OFFLINE_MINS)
  const ticks = Math.floor(elapsed * 60 / (TICK_MS / 1000))

  if (ticks > 0 && saved.normies?.length) {
    // Apply need decay (no activity fills - normies went idle)
    for (const n of saved.normies) {
      for (const need of ALL_NEEDS) {
        n.needs[need] = clamp((n.needs[need] ?? 50) - NEED_DECAY[need] * ticks * 0.4)
      }
    }
    // Award reduced passive income for offline time
    const passivePerTick = (saved.normies.length * 0.6)
    saved.coins = (saved.coins || 0) + passivePerTick * ticks * 0.3
  }

  return { state: saved, offlineMinutes: Math.floor(elapsed) }
}

// ── Upgrade effects ────────────────────────────────────────────────────────

export function buildUpgradeEffects(purchased) {
  const effects = { decayMult:{}, fillMult:{}, passiveIncomeMult:1, passiveIncomeFlat:0, clickMult:1, satisfiedMult:1, comboBonus:0 }
  for (const upg of UPGRADES) {
    const lvl = purchased[upg.id] || 0
    if (!lvl) continue
    for (let l = 0; l < lvl; l++) {
      const e = upg.effect
      if (e.passiveIncomeMult)              effects.passiveIncomeMult *= e.passiveIncomeMult
      if (e.passiveIncomeFlat !== undefined) effects.passiveIncomeFlat += e.passiveIncomeFlat
      if (e.clickMult)                      effects.clickMult         *= e.clickMult
      if (e.satisfiedMult)                  effects.satisfiedMult     *= e.satisfiedMult
      if (e.comboBonus)                     effects.comboBonus        += e.comboBonus
      if (e.decayMult) for (const [k,v] of Object.entries(e.decayMult)) effects.decayMult[k] = (effects.decayMult[k]||1) * v
      if (e.fillMult)  for (const [k,v] of Object.entries(e.fillMult))  effects.fillMult[k]  = (effects.fillMult[k]||1)  * v
    }
  }
  return effects
}

// ── Dorm happiness ─────────────────────────────────────────────────────────

export function calcDormHappiness(normies) {
  if (!normies?.length) return 0
  let total = 0
  for (const n of normies) {
    total += ALL_NEEDS.reduce((s, k) => s + (n.needs[k] || 0), 0) / ALL_NEEDS.length
  }
  return Math.round(total / normies.length)
}

// ── Achievements ───────────────────────────────────────────────────────────

export function checkAchievements(stats, earned) {
  const newOnes = []
  const check = (id, cond) => { if (cond && !earned.includes(id)) newOnes.push(id) }

  // Tutorial
  check('first_click',    stats.totalClicks           >= 1)
  check('first_upgrade',  stats.totalUpgradesBought   >= 1)
  check('combo_5',        stats.maxCombo               >= 5)
  check('survivor',       stats.criticalRecovered      >= 1)

  // Engagement
  check('coins_1000',     stats.totalCoinsEarned       >= 1000)
  check('click_100',      stats.totalClicks            >= 100)
  check('feed_5',         stats.feedCount              >= 5)
  check('five_upgrades',  stats.totalUpgradesBought    >= 5)
  check('night_owl',      stats.nightOwlOnce)
  check('six_activities', stats.allActivitiesOnce)

  // Skill
  check('combo_max',      stats.maxCombo               >= COMBO_MAX)
  check('coins_5000',     stats.totalCoinsEarned       >= 5000)
  check('coins_25000',    stats.totalCoinsEarned       >= 25000)
  check('all_happy',      stats.allHappyOnce)
  check('click_500',      stats.totalClicks            >= 500)
  check('feed_20',        stats.feedCount              >= 20)
  check('survivor_x5',    stats.criticalRecovered      >= 5)

  // Mastery
  check('combo_god',      stats.comboMaxHits           >= 5)
  check('coins_100000',   stats.totalCoinsEarned       >= 100000)
  check('peak_dorm',      stats.peakHappinessOnce)
  check('all_activities', stats.uniqueActivitiesSeen   >= 14)  // 14 with new acts
  check('max_upgrade',    stats.maxUpgradeEarned)

  // Legend
  check('click_2000',     stats.totalClicks            >= 2000)
  check('coins_500000',   stats.totalCoinsEarned       >= 500000)
  check('perfect_dorm',   stats.perfectDormOnce)

  // Leveling
  const currentLevel = calcLevel(stats.totalCoinsEarned)
  check('level_5',        currentLevel >= 5)
  check('level_10',       currentLevel >= 10)
  check('level_20',       currentLevel >= 20)
  check('level_50',       currentLevel >= 50)

  // Sleep system
  check('good_night',     stats.simultaneousSleepers   >= 3)
  check('well_rested',    stats.wellRestedOnce)
  check('sleep_master',   stats.allSleptOnce)

  return newOnes
}
