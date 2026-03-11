import {
  ALL_NEEDS, NEED_DECAY, ACTIVITY_META, ARCHETYPES,
  UPGRADES, ACHIEVEMENTS,
  MAX_OFFLINE_MINS, TICK_MS, GAME_MINS_PER_TICK,
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
    // Outdoor bias during "daytime" (just random bonus)
    if (act === 'outside') score += 8
    candidates.push({ activity:act, location:targetLoc, score: score * (0.7 + Math.random() * 0.6) })
  }

  candidates.sort((a,b) => b.score - a.score)
  const pick = candidates[0] || { activity:'walking', location: currentLocation }
  return { activity: pick.activity, location: pick.location }
}

function _roomWithActivity(activity, rooms, currentLocation) {
  if (!rooms || rooms.length === 0) return currentLocation
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
  const ticks = Math.floor(elapsed * (60 / (TICK_MS / 1000)) / GAME_MINS_PER_TICK)
  // Just return state with time elapsed, ticks applied externally for simplicity
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

// ── Achievements ───────────────────────────────────────────────────────────

export function checkAchievements(stats, earned) {
  const newOnes = []
  const check = (id, cond) => { if (cond && !earned.includes(id)) newOnes.push(id) }
  check('first_click',    stats.totalClicks      >= 1)
  check('combo_5',        stats.maxCombo         >= 5)
  check('coins_1000',     stats.totalCoinsEarned >= 1000)
  check('coins_10000',    stats.totalCoinsEarned >= 10000)
  check('all_happy',      stats.allHappyOnce)
  check('first_upgrade',  stats.totalUpgradesBought >= 1)
  check('six_activities', stats.allActivitiesOnce)
  check('feed_5',         stats.feedCount        >= 5)
  return newOnes
}
