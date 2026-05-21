// ── Agentic Normie System - ERC-8004 ──────────────────────────────────────
//
// 1.  Batch-check which of the user's Normies are bound as ERC-8004 agents
// 2.  Fetch their live persona (name, tagline, greeting, quirks, personality)
// 3.  Generate in-character, room-contextual dialogue from that persona
//
// API: https://api.normies.art/agents/*

const API = 'https://api.normies.art'

const _personaCache  = new Map()   // id → full persona JSON
const _bindingCache  = new Map()   // id → binding object | null  (null = checked, not agentic)

// ── Batch binding check ────────────────────────────────────────────────────
export async function checkAgenticBatch(ids) {
  if (!ids.length) return new Set()
  try {
    const r = await fetch(`${API}/agents/binding/batch`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ tokenIds: ids.map(String) }),
      signal:  AbortSignal.timeout(8000),
    })
    if (!r.ok) return new Set()
    const { bindings } = await r.json()
    const agenticIds = new Set()
    for (const [tokenId, binding] of Object.entries(bindings)) {
      const id = Number(tokenId)
      _bindingCache.set(id, binding)
      agenticIds.add(id)
    }
    // Mark unchecked ids as non-agentic so we don't re-query
    for (const id of ids) if (!_bindingCache.has(id)) _bindingCache.set(id, null)
    return agenticIds
  } catch {
    return new Set()
  }
}

// ── Fetch full persona ─────────────────────────────────────────────────────
export async function fetchAgentPersona(id) {
  if (_personaCache.has(id)) return _personaCache.get(id)
  try {
    const r = await fetch(`${API}/agents/info/${id}`, {
      signal: AbortSignal.timeout(7000),
    })
    if (!r.ok) return null
    const data = await r.json()
    _personaCache.set(id, data)
    return data
  } catch {
    return null
  }
}

// ── Generate a contextual chat line from the persona ──────────────────────
//
// Combines three sources, weighted by situation:
//   40%  → direct persona lines (greeting, tagline, quirks)
//   60%  → tone-adapted room+activity lines from templates
//
export function getAgentChatLine(persona, roomType, activity) {
  if (!persona) return null
  const { greeting, tagline, quirks = [], personalityTraits = [], communicationStyle = '' } = persona

  const direct = [greeting, tagline, ...quirks].filter(Boolean)
  const tone   = _detectTone(personalityTraits, communicationStyle)
  const ctx    = _contextLines(roomType, activity, tone)

  const all    = [...direct, ...ctx]
  if (!all.length) return null

  const usePersona = Math.random() < 0.40 && direct.length
  const pool = usePersona ? direct : (ctx.length ? ctx : direct)
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── Tone detection ─────────────────────────────────────────────────────────
function _detectTone(traits, style) {
  const s = [...traits, style].join(' ').toLowerCase()
  if (/measur|archiv|precis|methodical|careful|deliberate/.test(s)) return 'measured'
  if (/witty|playful|humor|fun|joke|sarcas|ironic/.test(s))         return 'witty'
  if (/passion|enthusiast|energet|vibrant|excit/.test(s))           return 'passionate'
  if (/reserv|quiet|minimal|understated|introv/.test(s))            return 'reserved'
  if (/mystic|cryptic|philosoph|deep|exist|abstract/.test(s))       return 'mystical'
  if (/analyt|logic|rational|data|system|pattern|optim/.test(s))    return 'analytical'
  return 'neutral'
}

// ── Room+activity contextual line bank, by tone ────────────────────────────
const _LINES = {
  measured: {
    study:   ["The work continues, methodically.","Each page indexed, each thought catalogued.","Progress, if measured carefully.","The outline clarifies."],
    gaming:  ["Patterns emerge on closer inspection.","The game state approaches equilibrium.","Every system has exploitable logic."],
    chill:   ["A pause in the sequence. Necessary.","Stillness has its own data.","Downtime logged."],
    gym:     ["Optimizing the physical parameters.","Consistency over intensity.","Recovery is part of the protocol."],
    library: ["This archive is well-maintained.","I note the classification system here.","Quiet efficiency."],
    music:   ["The notation is precise here.","Timing is everything. As always.","Intervals observed."],
    kitchen: ["Preparation is half the process.","The recipe is a kind of algorithm.","Measured portions only."],
    art:     ["Each mark is deliberate.","The composition reveals its logic slowly.","Process over product."],
    bedroom: ["Rest is a scheduled operation.","Processing offline. Do not interrupt.","Recharge protocol."],
    outdoor: ["The quad has its own topology.","Interesting data points out here.","Mapping the space."],
  },
  witty: {
    study:   ["Big brain energy? Don't @ me.","My GPA called - it said it misses me.","Technically learning if you squint."],
    gaming:  ["I play to lose with style.","The only skill issue is everyone else's.","Carrying the team by existing."],
    chill:   ["Professionally doing nothing.","My hobby is not having hobbies.","Peak performance unlocked."],
    gym:     ["Every step is technically cardio.","The mirror and I have an understanding.","Arriving counts, right?"],
    library: ["Shhh I'm loud inside my own head.","Plot twist: actually reading.","The books judged me first."],
    music:   ["Unintentional jazz is still jazz.","Wrong notes are just avant-garde.","The instrument was asking for this."],
    kitchen: ["I add water to things and call it cooking.","The smoke alarm is just encouragement.","Technically a recipe."],
    art:     ["It's not abstract, you're just not enlightened.","The mess is intentional (it isn't).","Calling it finished."],
    bedroom: ["Sleep speedrun, any%.","My alarm and I have a complicated relationship.","Dreams: loading..."],
    outdoor: ["Found outside. Rare spawn.","Touching grass: confirmed.","The quad lied, it's cold."],
  },
  passionate: {
    study:   ["This subject is FASCINATING.","I could do this for hours honestly.","EUREKA (maybe)."],
    gaming:  ["That combo was INSANE let's go!","I am so in the zone right now.","Carried. Again."],
    chill:   ["This is the best day actually.","Vibes are immaculate tonight.","Everything is perfect right now."],
    gym:     ["This is what I'm built for!","Energy unlocked, let's GET IT.","One more set I promise (I won't stop)."],
    library: ["This book changed my life and I mean it.","I need everyone to read this RIGHT NOW.","Knowledge is power and I am powerful."],
    music:   ["This part! THIS PART RIGHT HERE!","Music is literally everything.","I can't stop playing this."],
    kitchen: ["I made this and it's incredible.","Food is love, change my mind.","Best meal this floor has ever seen."],
    art:     ["This piece is speaking to me!!","Three hours passed and I barely noticed.","I love what this is becoming."],
    bedroom: ["Dreams were wild tonight no cap.","I woke up with SO many ideas.","Ready to conquer everything."],
    outdoor: ["The stars are insane tonight!!!","I love it out here honestly.","This is what life is about."],
  },
  reserved: {
    study:   ["...","working","hmm"],
    gaming:  ["...","ok","sure"],
    chill:   ["...","nice","..."],
    gym:     ["...","...","ok"],
    library: ["quiet","...","..."],
    music:   ["...","good","playing"],
    kitchen: ["hungry","...","cooking"],
    art:     ["...","it's something","making"],
    bedroom: ["tired","sleep","..."],
    outdoor: ["out here","...","..."],
  },
  mystical: {
    study:   ["What does it mean to know something?","Every answer births three questions.","Knowledge is a spiral, not a line."],
    gaming:  ["The game plays us as much as we play it.","Every move is already written.","Victory is just a state change."],
    chill:   ["In the stillness, everything speaks.","Rest is not absence. It's presence.","The quiet between notes is still music."],
    gym:     ["The body is the first temple.","Motion is the closest thing to thought.","What you train, trains you back."],
    library: ["Every book is a portal.","Knowledge is a spiral, not a line.","The pages hold more than words."],
    music:   ["Sound is memory. What does this remind you of?","Vibration is the universe talking.","Some songs exist before they're written."],
    kitchen: ["Sustenance from nothing. There's a metaphor here.","Hunger is just the body asking questions.","Feeding the self is an act of faith."],
    art:     ["What you see is not what I made.","The canvas knows before I do.","Creation is a conversation."],
    bedroom: ["Sleep is a rehearsal for something.","Dreams are data from somewhere else.","What are we when we're not awake?"],
    outdoor: ["The quad breathes. Can you feel it?","Every path leads somewhere. Or nowhere. Same thing.","The night air remembers."],
  },
  analytical: {
    study:   ["Cross-referencing sources. 3 citations so far.","Running calculations. This tracks.","Efficiency: 73%. Improving."],
    gaming:  ["Win rate improving. Pattern identified.","Suboptimal strategy detected. Adjusting.","Data collected. Hypothesis forming."],
    chill:   ["Dopamine levels normalizing. Optimal.","Recovery phase initiated. ETA: unknown.","Rest metrics within acceptable range."],
    gym:     ["Rep count logged. Progress consistent.","Performance metrics within expected range.","Calculating optimal rest interval."],
    library: ["Cataloguing. Efficiency: 72%.","Data acquisition in progress.","Cross-referencing index entries."],
    music:   ["Harmonic intervals calculated.","The waveform is unusually clean.","Time signature analysis complete."],
    kitchen: ["Nutritional intake logged.","Process optimization potential: high.","Caloric estimate: acceptable."],
    art:     ["Composition ratio: 1.618.","Contrast values in optimal range.","Each element serves a function."],
    bedroom: ["Entering low-power mode.","Sleep debt: -2.3h. Recalibrating.","Systems offline. Maintenance mode."],
    outdoor: ["Environmental scan complete.","Social density: medium-low.","Weather conditions logged."],
  },
  neutral: {
    study:   ["making progress, slowly","this takes longer than expected","getting there"],
    gaming:  ["just one more match","getting better, I think","enjoying this"],
    chill:   ["good vibes in here","needed this","taking a break"],
    gym:     ["keeping at it","progress is progress","showing up counts"],
    library: ["good book so far","learning something new","quiet in here"],
    music:   ["this is coming together","almost got it","finding the rhythm"],
    kitchen: ["cooking up something","this might actually taste good","smells decent"],
    art:     ["it's taking shape","not sure where this is going","making something"],
    bedroom: ["tired today","need the rest","peaceful in here"],
    outdoor: ["nice to be outside","fresh air helps","good evening"],
  },
}

function _contextLines(roomType, activity, tone) {
  const toneMap = _LINES[tone] || _LINES.neutral
  return toneMap[roomType] || _LINES.neutral[roomType] || _LINES.neutral.outdoor
}
