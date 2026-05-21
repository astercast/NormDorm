import {
  DEMO_IDS, TICK_MS, GAME_MINS_PER_TICK,
  ACTIVITY_META, CHAT_LINES, ROOM_CHAT, EVENT_TEMPLATES, ALL_NEEDS,
  UPGRADES, ACHIEVEMENTS, CHALLENGE_POOL,
  COINS_CLICK_BASE, COINS_PER_TICK_BASE,
  COINS_ACTIVITY_SWITCH,
  COINS_NEED_SATISFIED, COINS_CRITICAL_PENALTY,
  COINS_FEED_COST, COINS_ENERGY_DRINK_COST, COINS_STUDY_SESSION_COST, COINS_PARTY_COST,
  COMBO_WINDOW_MS, COMBO_MAX,
  buildRoomList,
  calcLevel, getXpForLevel, calcLevelBonus,
} from './constants.js'
import { checkAgenticBatch, fetchAgentPersona, getAgentChatLine } from './agentic.js'
import {
  saveState, loadState, freshNeeds, buildPersonality,
  pickActivity, activityDuration, tickNormie,
  applyOfflineCatchup, buildUpgradeEffects, checkAchievements, clamp,
  calcDormHappiness,
} from './state.js'
import { lookupNormies, fetchNormiesData } from './wallet.js'
import { preloadNormieImage } from './pixel-renderer.js'
import { submitScore } from './leaderboard.js'
import {
  buildDorm, placeSprite, removeSprite, animateSprites,
  updateOccupancy, updateDayNight, setSpriteScene, onActivityChanged,
} from './scene.js'
import {
  initTheme, toggleTheme, notify, logEvent, updateStats,
  renderRoster, updateRosterItem, showDetailPanel, closeDetailPanel,
  showChatBubble, showCoinPop, updateComboMeter,
  renderShop, renderAchievements,
  showAchievementToast, showOfflineModal,
  renderHowItWorks,
  renderLoading, updateLoadProgress,
  renderLeaderboard,
  showDailyModal, renderChallenges,
} from './ui.js'

export class App {
  constructor(root) {
    this.root    = root
    this.address = null
    this.isDemo  = false
    this.normies = []
    this.normieMap = new Map()
    this.sceneEls  = {}
    this.rooms     = []

    this.coins = 0
    this.purchasedUpgrades = {}
    this.upgradeEffects    = buildUpgradeEffects({})

    this.comboCount    = 0
    this.comboLastMs   = 0
    this.comboTimeout  = null

    this.gameMinute = 0
    this.tickCount  = 0
    this.nightAlpha = 0
    this.activeTab  = 'dorm'

    this.earnedAchievements = []
    this.gameStats = {
      totalClicks:0, totalCoinsEarned:0, totalUpgradesBought:0,
      allHappyOnce:false, allActivitiesOnce:false, peakHappinessOnce:false,
      perfectDormOnce:false,
      nightOwlOnce:false,
      maxCombo:0, satisfiedCount:0, feedCount:0, criticalRecovered:0,
      comboMaxHits:0, uniqueActivitiesSeen:0, maxUpgradeEarned:false,
    }

    this._observedActivities = new Set()

    this._tick = null; this._save = null
    this._chat = null; this._raf  = null
    this._lastRaf = null
    this._glyphRaf = null
    this._incomeHistory = []

    // Daily system
    this._daily = null          // loaded in _initDailySystem
    this._challengeProgress = {}
  }

  async init() {
    initTheme()
    this._renderConnect()
  }

  // ── Homepage ──────────────────────────────────────────────────────────────
  _renderConnect() {
    if (this._glyphRaf) { cancelAnimationFrame(this._glyphRaf); this._glyphRaf = null }

    // Pick a stable rotating set of demo Normies for the hero
    const HERO_IDS = [42, 627, 1337, 888, 3000, 1, 250, 7777]
    const heroSet  = []
    const usedIdx  = new Set()
    while (heroSet.length < 4) {
      const idx = Math.floor(Math.random() * HERO_IDS.length)
      if (usedIdx.has(idx)) continue
      usedIdx.add(idx); heroSet.push(HERO_IDS[idx])
    }

    this.root.innerHTML = `
      <div class="connect-page">

        <header class="hp-nav">
          <div class="hp-mark">NORMDORM</div>
          <div class="hp-meta">v2 · pixel life sim</div>
        </header>

        <main class="hp-hero">
          <div class="hp-copy">
            <h1 class="hp-title">A living dorm<br/>for your Normies.</h1>
            <p class="hp-sub">
              Drop in an Ethereum address. Your Normies move in,
              keep each other company, and earn while you're away.
            </p>

            <div class="hp-lookup">
              <input
                class="hp-input" id="addr-input" type="text"
                placeholder="0x…" autocomplete="off" spellcheck="false">
              <button class="hp-btn-primary" id="btn-load">Enter dorm</button>
            </div>
            <button class="hp-btn-ghost" id="btn-demo">or try the demo →</button>

            <div class="hp-trust">
              <span class="hp-dot"></span>
              read-only · no wallet connection · no transactions
            </div>
          </div>

          <div class="hp-stage">
            <div class="hp-room" id="hp-room">
              <div class="hp-window"></div>
              <div class="hp-shelf">
                <span></span><span></span><span></span><span></span><span></span>
              </div>
              <div class="hp-desk"></div>
              <div class="hp-lamp">
                <span class="hp-lamp-shade"></span>
                <span class="hp-lamp-pole"></span>
              </div>
              <div class="hp-bed"></div>
              <div class="hp-floor"></div>

              <div class="hp-normies">
                ${heroSet.map((id, i) => `
                  <div class="hp-normie hp-pos-${i}" style="animation-delay:${i * 0.25}s" data-id="${id}">
                    <div class="hp-normie-slot"></div>
                    <div class="hp-shadow"></div>
                  </div>`).join('')}
              </div>
            </div>

            <div class="hp-stage-caption">live preview · 4 of 10,000</div>
          </div>
        </main>

        <footer class="hp-footer">
          <div class="hp-footer-row">
            <a href="https://normies.art" target="_blank" rel="noopener" class="hp-link">normies.art ↗</a>
            <span class="hp-sep">·</span>
            <a href="https://github.com/astercast/NormDorm" target="_blank" rel="noopener" class="hp-link">github ↗</a>
          </div>
        </footer>
      </div>
      <div id="notif-stack" class="notif-stack"></div>`

    const input  = document.getElementById('addr-input')
    const btnLoad = document.getElementById('btn-load')

    const _submit = () => {
      const val = input.value.trim()
      if (!val) {
        input.classList.add('hp-input-err')
        notify('Enter an Ethereum address (0x…)', 'warn')
        input.focus(); return
      }
      if (!/^0x[0-9a-fA-F]{40}$/i.test(val)) {
        input.classList.add('hp-input-err')
        notify('Address must start with 0x and be 42 characters', 'warn')
        input.focus(); return
      }
      input.classList.remove('hp-input-err')
      btnLoad.disabled = true
      btnLoad.textContent = 'Loading…'
      this._handleLookup(val)
    }

    btnLoad.onclick = _submit
    input.onkeydown = e => { if (e.key === 'Enter') _submit() }
    input.oninput   = () => input.classList.remove('hp-input-err')
    document.getElementById('btn-demo').onclick = () => this._handleDemo()

    // Asynchronously load Normie SVGs, strip their backgrounds, inject inline.
    // Falls back to the raw <img> on failure so the hero is never empty.
    this._loadHeroNormies(heroSet)
  }

  async _loadHeroNormies(ids) {
    for (let i = 0; i < ids.length; i++) {
      const id   = ids[i]
      const slot = document.querySelector(`.hp-normie[data-id="${id}"] .hp-normie-slot`)
      if (!slot) continue
      try {
        const r = await fetch(`https://api.normies.art/normie/${id}/image.svg`, {
          signal: AbortSignal.timeout(7000),
        })
        if (!r.ok) throw new Error('http ' + r.status)
        let svg = await r.text()
        // Strip the canonical background rect (always the first <rect> in the SVG)
        svg = svg.replace(
          /<rect\s+width="40"\s+height="40"\s+fill="#e3e5e4"\s*\/>/i,
          ''
        )
        // Make the inner SVG sized to 100% so it fills the slot
        svg = svg.replace(/width="1000"\s+height="1000"/, 'width="100%" height="100%"')
        slot.innerHTML = svg
      } catch {
        // Fallback: just embed the raw image (will show the bg rect, but visible)
        slot.innerHTML = `<img src="https://api.normies.art/normie/${id}/image.svg" alt="" draggable="false" />`
      }
    }
  }


  // ── Address lookup ────────────────────────────────────────────────────────
  async _handleLookup(raw) {
    const addr = raw.trim()
    if (this._glyphRaf) { cancelAnimationFrame(this._glyphRaf); this._glyphRaf = null }
    await this._startDorm(addr, false)
  }

  async _handleDemo() {
    if (this._glyphRaf) { cancelAnimationFrame(this._glyphRaf); this._glyphRaf = null }
    await this._startDorm(null, true)
  }

  // ── Dorm startup ──────────────────────────────────────────────────────────
  async _startDorm(address, isDemo) {
    this.isDemo = isDemo; this.address = address
    renderLoading(this.root)

    let ids
    if (isDemo) {
      ids = DEMO_IDS.slice(0, 12)
    } else {
      try {
        ids = await lookupNormies(address)
      } catch(e) {
        notify('Could not load wallet — ' + (e.message || 'network error') + '. Try demo mode.', 'error', 7000)
        this._renderConnect(); return
      }
      if (!ids.length) {
        notify('No Normies found at that address — loading demo.', 'warn', 5000)
        ids = DEMO_IDS.slice(0, 12)
        this.isDemo = true
      }
    }

    this.rooms = buildRoomList(ids.length)

    const normieData = await fetchNormiesData(ids, (l, t) => updateLoadProgress(l, t))
    await Promise.all(ids.map(id => preloadNormieImage(id)))

    const saved = address ? loadState(address) : null
    let offlineMinutes = 0

    if (saved) {
      const { state, offlineMinutes: om } = applyOfflineCatchup(saved)
      offlineMinutes = om
      this.coins              = state.coins              || 0
      this.purchasedUpgrades  = state.purchasedUpgrades  || {}
      this.earnedAchievements = state.earnedAchievements || []
      this.gameStats          = { ...this.gameStats, ...state.gameStats }
      this.gameMinute         = state.gameMinute         || 0
      this.upgradeEffects     = buildUpgradeEffects(this.purchasedUpgrades)
      this.normies = normieData.map((data, idx) => {
        const prev = saved.normies?.find(n => n.id === data.id)
        const pers = buildPersonality(data.traits)
        if (prev) return { ...prev, ...data, personality: pers, needs: { ...prev.needs } }
        return _freshNormie(data, pers, idx, this.rooms)
      })
    } else {
      this.coins = isDemo ? 500 : 0
      this.upgradeEffects = buildUpgradeEffects({})
      this.normies = normieData.map((data, idx) =>
        _freshNormie(data, buildPersonality(data.traits), idx, this.rooms)
      )
    }

    this.normieMap = new Map(this.normies.map(n => [n.id, n]))
    this._observedActivities = new Set(this.normies.map(n => n.activity))
    await this._renderDorm()

    // ── Agentic check (non-blocking, happens in background) ─────────────────
    this._initAgenticNormies(ids)

    // ── Daily system ─────────────────────────────────────────────────────────
    this._initDailySystem()

    if (offlineMinutes > 5) showOfflineModal(offlineMinutes, () =>
      logEvent(`Welcome back — ${offlineMinutes}m elapsed.`)
    )
    this._startLoops()
  }

  // ── Dorm view ─────────────────────────────────────────────────────────────
  async _renderDorm() {
    const addrLabel = this.isDemo
      ? 'DEMO'
      : `${this.address.slice(0, 6)}…${this.address.slice(-4)}`

    this.root.innerHTML = `
      <div class="header">
        <div class="logo" id="logo-home">
          <span class="logo-mark">ND</span>
          <span class="logo-name">NORMDORM</span>
          <span class="logo-sub">pixel dorm sim</span>
        </div>
        <div class="header-right">
          <div class="streak-chip" id="streak-chip" title="Daily login streak">
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <path d="M8 1.5c1 2.2.5 3.5-.5 4.5C6 7.5 4.5 8.5 4.5 11A3.5 3.5 0 0 0 8 14.5a3.5 3.5 0 0 0 3.5-3.5c0-1.7-.8-2.6-1.8-3.5C9 7 9 5.5 9.5 4 8.5 4.5 8 3 8 1.5Z" fill="currentColor"/>
            </svg>
            <span id="streak-num">0</span>
          </div>
          <div class="coin-pill" id="coin-display" title="Coins">
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.4"/>
              <circle cx="8" cy="8" r="3.4" fill="none" stroke="currentColor" stroke-width="1.2"/>
            </svg>
            <span id="stat-coins">0</span>
          </div>
          <div class="time-pill" id="stat-time">12:00 AM</div>
          <div class="addr-chip">${addrLabel}</div>
          <button class="icon-btn" id="theme-toggle" title="Theme" aria-label="Toggle theme">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M8 1a7 7 0 1 0 7 7 5.5 5.5 0 0 1-7-7Z" fill="currentColor"/>
            </svg>
          </button>
          <button class="icon-btn" id="btn-leave" title="Leave" aria-label="Leave">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      ${this.isDemo ? '<div class="demo-banner">DEMO MODE — enter an address on the home screen to load your own Normies</div>' : ''}

      <div class="tab-bar">
        <button class="tab-btn active" data-tab="dorm">DORM</button>
        <button class="tab-btn" data-tab="shop">SHOP</button>
        <button class="tab-btn" data-tab="achievements">CHALLENGES</button>
        <button class="tab-btn" data-tab="leaderboard">LEADERBOARD</button>
      </div>

      <div class="main-layout">
        <div class="tab-content active" id="tab-dorm">

          <!-- Mobile stat bar (hidden on desktop) -->
          <div class="mobile-stat-bar">
            <div class="msb-item">
              <span class="msb-val" id="msb-happiness">--%</span>
              <span class="msb-lbl">HAPPY</span>
            </div>
            <div class="msb-divider"></div>
            <div class="msb-item">
              <span class="msb-val" id="msb-income">—</span>
              <span class="msb-lbl">/ MIN</span>
            </div>
            <div class="msb-divider"></div>
            <div class="msb-item">
              <span class="msb-val" id="msb-outside">0</span>
              <span class="msb-lbl">IN QUAD</span>
            </div>
            <button class="msb-sidebar-toggle" id="msb-sidebar-toggle" aria-label="Toggle info panel">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="1.5" rx=".75" fill="currentColor"/><rect x="2" y="7.25" width="12" height="1.5" rx=".75" fill="currentColor"/><rect x="2" y="11.5" width="12" height="1.5" rx=".75" fill="currentColor"/></svg>
            </button>
          </div>

          <div class="dorm-layout">
            <div class="dorm-main">
              <div id="combo-meter" class="combo-meter">
                <span class="combo-label">COMBO</span>
                <span id="combo-val" class="combo-val">CLICK</span>
                <div class="combo-track"><div id="combo-bar" class="combo-bar"></div></div>
              </div>
              <div id="dorm-building-wrap"></div>
            </div>
            <div class="dorm-sidebar" id="dorm-sidebar">
              <button class="sb-close-btn" id="sb-close-btn" aria-label="Close panel">
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              </button>

              <div class="sb-card sb-progress">
                <div class="sb-progress-top">
                  <span class="sb-level-badge" id="level-num">1</span>
                  <div class="sb-progress-meta">
                    <div class="sb-progress-label">LEVEL</div>
                    <div class="sb-progress-xp"><span id="xp-current">0</span> / <span id="xp-next">800</span> XP</div>
                  </div>
                </div>
                <div class="xp-bar"><div id="xp-fill" class="xp-fill"></div></div>
              </div>

              <div class="sb-card sb-vitals">
                <div class="sb-vital">
                  <div class="sb-vital-lbl">HAPPINESS</div>
                  <div class="sb-vital-val" id="happiness-pct">--%</div>
                  <div class="happiness-bar"><div id="happiness-fill" class="happiness-fill"></div></div>
                </div>
                <div class="sb-vital">
                  <div class="sb-vital-lbl">INCOME</div>
                  <div class="sb-vital-val sb-vital-val-mono" id="stat-income">—</div>
                  <div class="sb-vital-sub">per minute</div>
                </div>
              </div>

              <div class="sb-card sb-milestone" id="sb-milestone">
                <div class="sb-card-title">NEXT MILESTONE</div>
                <div class="sb-milestone-row">
                  <span class="sb-milestone-name" id="milestone-name">—</span>
                  <span class="sb-milestone-reward" id="milestone-reward"></span>
                </div>
                <div class="milestone-bar"><div id="milestone-fill" class="milestone-fill"></div></div>
                <div class="sb-milestone-progress" id="milestone-progress">—</div>
              </div>

              <div class="sb-card sb-quickstats">
                <div class="sb-stat"><span class="sb-stat-val" id="stat-outside">0</span><span class="sb-stat-lbl">QUAD</span></div>
                <div class="sb-stat"><span class="sb-stat-val" id="stat-sleeping">0</span><span class="sb-stat-lbl">SLEEP</span></div>
                <div class="sb-stat"><span class="sb-stat-val" id="stat-gaming">0</span><span class="sb-stat-lbl">PLAY</span></div>
                <div class="sb-stat"><span class="sb-stat-val" id="stat-happy">0</span><span class="sb-stat-lbl">THRIVE</span></div>
              </div>

              <div class="sb-card sb-roster-card">
                <div class="sb-card-title">
                  <span>RESIDENTS</span>
                  <span class="sb-card-count">${this.normies.length}</span>
                </div>
                <div class="roster" id="roster"></div>
              </div>

              <div class="sb-card sb-log-card">
                <div class="sb-card-title">ACTIVITY</div>
                <div class="event-log" id="event-log"><div id="log-inner"></div></div>
              </div>
            </div>
          </div>
        </div>

        <div class="tab-content" id="tab-shop">
          <div class="shop-wrap" id="shop-panel"></div>
        </div>

        <div class="tab-content" id="tab-achievements">
          <div class="ach-wrap" id="ach-panel"></div>
          <div class="challenges-wrap" id="challenges-panel"></div>
        </div>

        <div class="tab-content" id="tab-leaderboard">
          <div class="lb-wrap" id="lb-panel"></div>
        </div>
      </div>

      <div id="notif-stack" class="notif-stack"></div>
      <div id="sidebar-backdrop" class="sidebar-backdrop"></div>`

    // ── Tab switching ─────────────────────────────────────────────────────────
    this.root.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = () => this._tab(btn.dataset.tab))
    document.getElementById('theme-toggle').onclick = toggleTheme
    document.getElementById('btn-leave').onclick    = () => { this._stopAll(); this._renderConnect() }
    document.getElementById('logo-home').onclick    = () => { this._stopAll(); this._renderConnect() }

    // ── Mobile sidebar open/close ─────────────────────────────────────────────
    const _openSidebar = () => {
      document.getElementById('dorm-sidebar')?.classList.add('sidebar-open')
      document.getElementById('sidebar-backdrop')?.classList.add('active')
    }
    const _closeSidebar = () => {
      document.getElementById('dorm-sidebar')?.classList.remove('sidebar-open')
      document.getElementById('sidebar-backdrop')?.classList.remove('active')
    }
    document.getElementById('msb-sidebar-toggle')?.addEventListener('click', () => {
      const isOpen = document.getElementById('dorm-sidebar')?.classList.contains('sidebar-open')
      isOpen ? _closeSidebar() : _openSidebar()
    })
    document.getElementById('sb-close-btn')?.addEventListener('click', _closeSidebar)
    document.getElementById('sidebar-backdrop')?.addEventListener('click', _closeSidebar)

    // ── Global keyboard shortcuts ─────────────────────────────────────────────
    this._keyHandler = e => {
      if (e.key === 'Escape') _closeSidebar()
    }
    document.addEventListener('keydown', this._keyHandler)

    // ── Game event listeners (stored for proper cleanup in _stopAll) ──────────
    this._evNormieClick  = e => this._onNormieClick(e.detail.id)
    this._evNormieAction = e => this._onNormieAction(e.detail.action, e.detail.id)
    this._evQuickAction  = e => this._onQuickAction(e.detail.action)
    this._evNormieDrop   = e => this._onNormieDrop(e.detail.id, e.detail.roomId)
    document.addEventListener('normie-click',  this._evNormieClick)
    document.addEventListener('normie-action', this._evNormieAction)
    document.addEventListener('quick-action',  this._evQuickAction)
    document.addEventListener('normie-drop',   this._evNormieDrop)

    renderRoster(this.normies)
    renderShop(this.purchasedUpgrades, this.coins, id => this._buyUpgrade(id))
    renderAchievements(this.earnedAchievements)
    updateStats(this.normies, this.coins, this.gameMinute, calcDormHappiness(this.normies), 0,
      calcLevel(this.gameStats.totalCoinsEarned), this.gameStats.totalCoinsEarned)
    renderLeaderboard(this.address, this.isDemo)

    const buildWrap = document.getElementById('dorm-building-wrap')
    const { el: dormEl, sceneEls } = await buildDorm(this.rooms)
    dormEl.id = 'dorm-building'
    buildWrap.appendChild(dormEl)
    this.sceneEls = sceneEls

    for (const normie of this.normies) {
      const sceneEl = this.sceneEls[normie.location]
        || this.sceneEls[this.rooms[0]?.id]
        || Object.values(this.sceneEls)[0]
      placeSprite(normie, sceneEl)
    }

    updateOccupancy(this.normies, this.rooms)
    this.nightAlpha = updateDayNight(this.gameMinute)
    this._updateMilestone()

    logEvent('Welcome to NormDorm! Click your normies to earn coins.')
  }

  _tab(tab) {
    this.activeTab = tab
    this.root.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))
    this.root.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tab}`))
    if (tab === 'shop')         renderShop(this.purchasedUpgrades, this.coins, id => this._buyUpgrade(id))
    if (tab === 'achievements') { renderAchievements(this.earnedAchievements); renderChallenges(this._daily?.challenges || [], this._challengeProgress) }
    if (tab === 'leaderboard')  renderLeaderboard(this.address, this.isDemo)
  }

  _onNormieClick(id) {
    const normie = this.normieMap.get(id); if (!normie) return
    const now = Date.now()
    if (now - this.comboLastMs < COMBO_WINDOW_MS) {
      this.comboCount = Math.min(this.comboCount + 1, this._maxCombo())
    } else {
      this.comboCount = 1
    }
    this.comboLastMs = now
    clearTimeout(this.comboTimeout)
    this.comboTimeout = setTimeout(() => { this.comboCount = 0; updateComboMeter(0, this._maxCombo()) }, COMBO_WINDOW_MS + 200)

    const lvlBonus = calcLevelBonus(calcLevel(this.gameStats.totalCoinsEarned))
    const base = COINS_CLICK_BASE * (this.upgradeEffects.clickMult || 1) * lvlBonus.clickMult
    const amt  = Math.ceil(base * this.comboCount)
    this.coins += amt
    this.gameStats.totalClicks++
    this.gameStats.totalCoinsEarned += amt
    this.gameStats.maxCombo = Math.max(this.gameStats.maxCombo, this.comboCount)
    if (this.comboCount === this._maxCombo()) this.gameStats.comboMaxHits++

    normie.needs.fun    = clamp(normie.needs.fun    + 4)
    normie.needs.social = clamp(normie.needs.social + 2)

    showCoinPop(id, amt, this.comboCount)
    updateComboMeter(this.comboCount, this._maxCombo())
    logEvent(EVENT_TEMPLATES.coins(normie.name, amt, this.comboCount))
    showDetailPanel(normie, this.coins)
    this._checkAchievements()
    updateStats(this.normies, this.coins, this.gameMinute, calcDormHappiness(this.normies), this._incomePerMin())

    // Challenge tracking
    this._trackChallenge('clicks', 1)
    this._trackChallenge('clickCoins', amt)
    this._trackChallenge('maxCombo', this.comboCount)
    if (this.comboCount === this._maxCombo()) this._trackChallenge('maxComboHit', 1)
  }

  _maxCombo() {
    const lvlBonus = calcLevelBonus(calcLevel(this.gameStats.totalCoinsEarned))
    return COMBO_MAX + (this.upgradeEffects.comboBonus || 0) + lvlBonus.comboBonus
  }

  _onNormieAction(action, id) {
    const normie = this.normieMap.get(id); if (!normie) return
    const costs = { feed: COINS_FEED_COST, energy: COINS_ENERGY_DRINK_COST, study: COINS_STUDY_SESSION_COST }
    const cost = costs[action]
    if (this.coins < cost) { notify('Not enough coins!', 'warn'); return }
    this.coins -= cost
    if (action === 'feed')   {
      normie.needs.hunger = clamp(normie.needs.hunger + 20)
      notify(`Fed ${normie.name}`,'info')
      logEvent(EVENT_TEMPLATES.feed(normie.name))
      this.gameStats.feedCount++
      this._trackChallenge('feed', 1)
    }
    if (action === 'energy') { normie.needs.energy = clamp(normie.needs.energy + 35); notify(`Energy drink for ${normie.name}`,'info'); logEvent(EVENT_TEMPLATES.energyDrink(normie.name)) }
    if (action === 'study')  { normie.needs.study  = clamp(normie.needs.study + 30); normie.needs.fun = clamp(normie.needs.fun - 5); notify(`Focus session for ${normie.name}`,'info') }
    closeDetailPanel()
    setTimeout(() => showDetailPanel(normie, this.coins), 60)
    updateStats(this.normies, this.coins, this.gameMinute, calcDormHappiness(this.normies), this._incomePerMin())
    this._checkAchievements()
  }

  _onNormieDrop(normieId, targetRoomId) {
    const normie = this.normies.find(n => n.id === normieId)
    if (!normie || normie.location === targetRoomId) return
    const targetSceneEl = this.sceneEls?.[targetRoomId]
    if (!targetSceneEl) return
    // Capacity check for indoor rooms
    if (targetRoomId !== 'outdoor') {
      const targetRoom = this.rooms.find(r => r.id === targetRoomId)
      const occupants  = this.normies.filter(n => n.location === targetRoomId).length
      if (targetRoom && occupants >= targetRoom.maxOcc) {
        notify(`${targetRoom.typeName || 'Room'} is full!`, 'warn', 2500)
        return
      }
    }
    normie.location = targetRoomId
    const { activity } = pickActivity(normie.needs, normie.personality, targetRoomId, this.rooms)
    normie.activity          = activity
    normie.activityTicksLeft = activityDuration(activity)
    setSpriteScene(normie, targetSceneEl)
    updateOccupancy(this.normies, this.rooms)
    const roomName = targetRoomId === 'outdoor'
      ? 'the quad'
      : (this.rooms.find(r => r.id === targetRoomId)?.typeName || targetRoomId)
    logEvent(`Normie #${normie.id} moved to ${roomName}`)
  }

  _onQuickAction(action) {
    if (action === 'party') {
      if (this.coins < COINS_PARTY_COST) { notify('Not enough coins!', 'warn'); return }
      this.coins -= COINS_PARTY_COST
      for (const n of this.normies) n.needs.social = clamp(n.needs.social + 30)
      notify('Quad Party! All social +30', 'info', 5000)
      logEvent(EVENT_TEMPLATES.party())
    }
    if (action === 'studyAll') {
      if (this.coins < COINS_STUDY_SESSION_COST) { notify('Not enough coins!', 'warn'); return }
      this.coins -= COINS_STUDY_SESSION_COST
      for (const n of this.normies) n.needs.study = clamp(n.needs.study + 25)
      notify('Study session! All study +25', 'info', 5000)
      logEvent(EVENT_TEMPLATES.studySession())
    }
    renderShop(this.purchasedUpgrades, this.coins, id => this._buyUpgrade(id))
    updateStats(this.normies, this.coins, this.gameMinute, calcDormHappiness(this.normies), this._incomePerMin())
  }

  _buyUpgrade(upgradeId) {
    const upg = UPGRADES.find(u => u.id === upgradeId); if (!upg) return
    const lvl = this.purchasedUpgrades[upgradeId] || 0
    if (lvl >= upg.maxLevel) { notify('Already maxed!', 'warn'); return }
    const cost = Math.floor(upg.cost * Math.pow(1.9, lvl))
    if (this.coins < cost) { notify('Not enough coins!', 'warn'); return }
    this.coins -= cost
    this.purchasedUpgrades[upgradeId] = lvl + 1
    this.upgradeEffects = buildUpgradeEffects(this.purchasedUpgrades)
    this.gameStats.totalUpgradesBought++
    if (lvl + 1 >= upg.maxLevel) this.gameStats.maxUpgradeEarned = true
    notify(`${upg.icon} ${upg.name} upgraded to Lv.${lvl + 1}`, 'info')
    logEvent(EVENT_TEMPLATES.upgrade(upg.name, lvl + 1))
    this._trackChallenge('upgrades', 1)
    renderShop(this.purchasedUpgrades, this.coins, id => this._buyUpgrade(id))
    this._checkAchievements()
    updateStats(this.normies, this.coins, this.gameMinute, calcDormHappiness(this.normies), this._incomePerMin())
  }

  _startLoops() {
    this._tick = setInterval(() => this._gameTick(), TICK_MS)
    this._save = this.address ? setInterval(() => this._doSave(), 20000) : null
    this._chat = setInterval(() => this._chatTick(), 4200)
    this._startRAF()
  }

  _gameTick() {
    this.tickCount++
    this.gameMinute += GAME_MINS_PER_TICK

    // Level bonuses scale passive + click income
    const lvl      = calcLevel(this.gameStats.totalCoinsEarned)
    const lvlBonus = calcLevelBonus(lvl)

    const mult    = (this.upgradeEffects.passiveIncomeMult || 1) * lvlBonus.passiveMult
    const flat    = this.upgradeEffects.passiveIncomeFlat || 0
    const passive = this.normies.length * COINS_PER_TICK_BASE * mult + flat
    this.coins += passive
    this.gameStats.totalCoinsEarned += passive

    // Level-up detection
    if (lvl > (this._lastLevel || 1)) {
      this._lastLevel = lvl
      notify(`🎖️ Level ${lvl}! Income +${((lvlBonus.passiveMult - 1) * 100).toFixed(0)}%`, 'success', 5500)
      logEvent(`Level ${lvl} reached!`)
    }

    this._incomeHistory.push(passive)
    if (this._incomeHistory.length > 60) this._incomeHistory.shift()

    for (const n of this.normies) {
      const satisfiedEvents = tickNormie(n, this.upgradeEffects)
      n.activityTicksLeft--
      if (n.activityTicksLeft <= 0) this._switchActivity(n)

      for (const k of satisfiedEvents) {
        const satAmt = Math.ceil(COINS_NEED_SATISFIED * (this.upgradeEffects.satisfiedMult || 1))
        this.coins += satAmt
        this.gameStats.totalCoinsEarned += satAmt
        this.gameStats.satisfiedCount++
        // Track well-rested achievement: normie woke from sleep with 95+ energy
        if (k === 'energy' && n.activity === 'sleeping') this.gameStats.wellRestedOnce = true
        logEvent(EVENT_TEMPLATES.satisfied(n.name, k))
      }
      for (const k of ALL_NEEDS) {
        if (n.needs[k] < 8 && !n._warned?.[k]) {
          n._warned = { ...(n._warned || {}), [k]: true }
          logEvent(EVENT_TEMPLATES.critical(n.name, k))
          if (!n._lastCritWarn || this.tickCount - n._lastCritWarn > 90) {
            notify(`${n.name} — ${k} is critical!`, 'warn')
            n._lastCritWarn = this.tickCount
          }
          this.coins = Math.max(0, this.coins - COINS_CRITICAL_PENALTY)
        }
        if (n.needs[k] > 25 && n._warned?.[k]) {
          n._warned[k] = false
          this.gameStats.criticalRecovered++
        }
      }
      if (n.chatCooldown > 0) n.chatCooldown--
      if (this.tickCount % 5 === 0) updateRosterItem(n)
    }

    // Sleep system stats
    const sleepCount = this.normies.filter(n => n.activity === 'sleeping').length
    this.gameStats.simultaneousSleepers = Math.max(this.gameStats.simultaneousSleepers || 0, sleepCount)
    if (!this.gameStats.allSleptOnce) {
      this._hasSlept = this._hasSlept || new Set()
      this.normies.filter(n => n.activity === 'sleeping').forEach(n => this._hasSlept.add(n.id))
      if (this._hasSlept.size >= this.normies.length) this.gameStats.allSleptOnce = true
    }

    // Achievement stat tracking
    const dormHappiness = calcDormHappiness(this.normies)
    if (dormHappiness >= 90) this.gameStats.peakHappinessOnce = true
    if (this.normies.every(n => ALL_NEEDS.every(k => n.needs[k] > 75))) this.gameStats.allHappyOnce = true
    if (this.normies.every(n => ALL_NEEDS.every(k => n.needs[k] > 90))) this.gameStats.perfectDormOnce = true
    const gameHour = Math.floor((this.gameMinute / 60) % 24)
    if (gameHour >= 23 || gameHour === 0) this.gameStats.nightOwlOnce = true

    for (const n of this.normies) this._observedActivities.add(n.activity)
    this.gameStats.uniqueActivitiesSeen = this._observedActivities.size

    if (this.tickCount % 10 === 0) {
      const outsideCount = this.normies.filter(n => n.location === 'outdoor').length
      if (outsideCount >= 1) this._trackChallenge('outsideCount', outsideCount)
      if (this.normies.every(n => calcDormHappiness([n]) >= 70)) this._trackChallenge('allHappy', 1)
      if (this.normies.every(n => calcDormHappiness([n]) >= 85)) this._trackChallenge('allGreat', 1)
      const recovered = this.gameStats.criticalRecovered
      if (recovered > (this._prevRecovered || 0)) {
        this._trackChallenge('recovered', recovered - (this._prevRecovered || 0))
        this._prevRecovered = recovered
      }
    }

    if (this.tickCount % 20 === 0) this._checkAchievements()
    updateStats(this.normies, this.coins, this.gameMinute, dormHappiness, this._incomePerMin(), lvl, this.gameStats.totalCoinsEarned)
    updateOccupancy(this.normies, this.rooms)
    this.nightAlpha = updateDayNight(this.gameMinute)
    if (this.tickCount % 4 === 0) this._updateMilestone()
  }

  _incomePerMin() {
    if (!this._incomeHistory.length) return 0
    return (this._incomeHistory.reduce((a, b) => a + b, 0) / this._incomeHistory.length) * 60
  }

  _switchActivity(normie) {
    const { activity, location } = pickActivity(normie.needs, normie.personality, normie.location, this.rooms)
    const changed = activity !== normie.activity
    normie.activity = activity
    normie.activityTicksLeft = activityDuration(activity)
    if (location && location !== normie.location) {
      normie.location = location
      const targetScene = this.sceneEls[location] || this.sceneEls[this.rooms[0]?.id] || this.sceneEls['outdoor']
      setSpriteScene(normie, targetScene)
    }
    if (changed) {
      // Only log notable activity transitions to keep the log readable
      const notable = new Set(['sleeping', 'outside', 'exercising', 'jamming', 'dancing', 'meditating'])
      if (notable.has(activity)) {
        logEvent(EVENT_TEMPLATES[activity]?.(normie.name) || `${normie.name} → ${activity}`)
      }
      this.coins += COINS_ACTIVITY_SWITCH
      onActivityChanged(normie)
    }
  }

  _startRAF() {
    const loop = ts => {
      const dt = this._lastRaf ? Math.min((ts - this._lastRaf) / 1000, 0.1) : 0.016
      this._lastRaf = ts
      animateSprites(this.normieMap, this.nightAlpha, dt)
      this._raf = requestAnimationFrame(loop)
    }
    this._raf = requestAnimationFrame(loop)
  }

  _chatTick() {
    if (Math.random() > 0.22) return
    const eligible = this.normies.filter(n =>
      n.chatCooldown <= 0 &&
      ['chatting','outside','gaming','eating','walking','exercising','cooking','sketching',
       'jamming','dancing','meditating','reading','studying','sleeping','napping'].includes(n.activity)
    )
    if (!eligible.length) return
    const n      = eligible[Math.floor(Math.random() * eligible.length)]
    const isCrit = Object.values(n.needs).some(v => v < 12)

    let line
    if (isCrit) {
      const pool = ROOM_CHAT.critical
      line = pool[Math.floor(Math.random() * pool.length)]
    } else if (n.isAgentic && n.agentPersona) {
      // Agentic normie: personality-driven in-character line
      const roomType = this._getRoomType(n.location)
      line = getAgentChatLine(n.agentPersona, roomType, n.activity)
           || this._pickRoomLine(n)
    } else {
      line = this._pickRoomLine(n)
    }
    if (line) showChatBubble(n.id, line)
    n.chatCooldown = 40 + Math.floor(Math.random() * 30)
  }

  _pickRoomLine(n) {
    const roomType = this._getRoomType(n.location)
    const roomBank = ROOM_CHAT[roomType]
    // Try room+activity first, then room general, then fallback to CHAT_LINES
    const actPool  = roomBank?.[n.activity]
    const roomPool = roomBank?._room
    const fallback = CHAT_LINES[n.activity] || CHAT_LINES.chatting
    const combined = [
      ...(actPool  ? [...actPool,  ...actPool]  : []),   // weight activity-specific higher
      ...(roomPool ? roomPool : []),
      ...fallback,
    ]
    return combined[Math.floor(Math.random() * combined.length)]
  }

  _getRoomType(locationId) {
    if (locationId === 'outdoor') return 'outdoor'
    const room = this.rooms.find(r => r.id === locationId)
    return room?.typeId || 'outdoor'
  }

  // ── Agentic normie initialization (runs in background) ──────────────────
  async _initAgenticNormies(ids) {
    try {
      const agenticIds = await checkAgenticBatch(ids)
      if (!agenticIds.size) return

      // Mark agentic normies visually
      for (const id of agenticIds) {
        const n = this.normieMap.get(id)
        if (!n) continue
        n.isAgentic = true
        // Add CSS class to the sprite canvas
        const canvas = document.getElementById(`sprite-${id}`)
        if (canvas) canvas.classList.add('is-agentic')
      }

      // Fetch personas for agentic normies (staggered to avoid rate limits)
      let delay = 0
      for (const id of agenticIds) {
        const n = this.normieMap.get(id)
        if (!n) continue
        setTimeout(async () => {
          const persona = await fetchAgentPersona(id)
          if (persona && n) {
            n.agentPersona = persona
            n.agentName    = persona.name
            // Show a toast for the first agentic normie discovered
            if (!this._agentToastShown) {
              this._agentToastShown = true
              notify(`${persona.name} is an Agentic Normie (ERC-8004) ✦`, 'info', 5000)
            }
          }
        }, delay)
        delay += 600  // stagger requests to respect rate limits
      }
    } catch {
      // Silently ignore — agentic features are additive
    }
  }

  // ── Daily system ─────────────────────────────────────────────────────────
  _initDailySystem() {
    const key    = `nd_daily_${this.address || 'demo'}`
    const stored = JSON.parse(localStorage.getItem(key) || '{}')
    const today  = new Date().toDateString()
    const prev   = stored.lastLoginDate

    if (prev === today) {
      // Same day — restore challenges only
      this._daily           = stored
      this._challengeProgress = stored.challengeProgress || {}
      renderChallenges(stored.challenges || [], this._challengeProgress)
      this._updateStreakChip(stored.streak || 1)
      return
    }

    // New day!
    const yesterday   = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    const consecutive = prev === yesterday.toDateString()
    const streak      = consecutive ? (stored.streak || 0) + 1 : 1
    const baseReward  = 100 + streak * 50
    const capReward   = Math.min(baseReward, 800)

    // Pick 3 random non-duplicate challenges
    const pool      = [...CHALLENGE_POOL].sort(() => Math.random() - 0.5)
    const challenges = pool.slice(0, 3)

    const daily = { lastLoginDate: today, streak, challenges, challengeProgress: {} }
    localStorage.setItem(key, JSON.stringify(daily))

    this._daily             = daily
    this._challengeProgress = {}

    // Grant reward coins
    this.coins += capReward
    this.gameStats.totalCoinsEarned += capReward

    // Show the daily login modal
    showDailyModal(streak, capReward, challenges)

    // Normies miss you after 12+ hours away
    if (prev) {
      const hoursAway = (Date.now() - (stored.lastLoginTs || 0)) / 3600000
      if (hoursAway >= 8) {
        setTimeout(() => {
          const lines = [
            'missed you!', 'finally you showed up', 'we were worried',
            'you were gone so long', 'the dorm needed you',
          ]
          const n = this.normies[Math.floor(Math.random() * this.normies.length)]
          if (n) showChatBubble(n.id, lines[Math.floor(Math.random() * lines.length)])
        }, 3000)
      }
    }

    renderChallenges(challenges, {})
    this._updateStreakChip(streak)
    setTimeout(() => {
      stored.lastLoginTs = Date.now()
      localStorage.setItem(key, JSON.stringify({ ...daily, lastLoginTs: Date.now() }))
    }, 0)
  }

  _updateStreakChip(streak) {
    const el = document.getElementById('streak-num')
    if (el) el.textContent = String(streak)
    const chip = document.getElementById('streak-chip')
    if (chip) chip.dataset.streak = streak >= 30 ? 'gold' : streak >= 7 ? 'hot' : 'warm'
  }

  _updateMilestone() {
    const name     = document.getElementById('milestone-name')
    const reward   = document.getElementById('milestone-reward')
    const fill     = document.getElementById('milestone-fill')
    const progress = document.getElementById('milestone-progress')
    if (!name) return
    const remaining = ACHIEVEMENTS.filter(a => !this.earnedAchievements.includes(a.id))
    if (!remaining.length) {
      name.textContent = 'All achievements unlocked'
      if (reward)   reward.textContent = ''
      if (fill)     fill.style.width = '100%'
      if (progress) progress.textContent = 'Legendary'
      return
    }
    // Pick the closest milestone using rough heuristic on achievement id thresholds
    const lvl     = calcLevel(this.gameStats.totalCoinsEarned)
    const clicks  = this.gameStats.totalClicks || 0
    const coins   = this.gameStats.totalCoinsEarned || 0
    const targets = remaining.map(a => {
      let cur = 0, max = 1
      if (a.id.startsWith('coins_'))   { max = parseInt(a.id.slice(6)); cur = coins }
      else if (a.id.startsWith('click_')) { max = parseInt(a.id.slice(6)); cur = clicks }
      else if (a.id.startsWith('level_')) { max = parseInt(a.id.slice(6)); cur = lvl }
      else return null
      return { a, cur, max, pct: Math.min(1, cur / max) }
    }).filter(Boolean).filter(t => t.pct < 1)
    targets.sort((a, b) => b.pct - a.pct)
    const next = targets[0] || { a: remaining[0], cur: 0, max: 1, pct: 0 }
    name.textContent = next.a.name
    if (reward)   reward.textContent = next.a.reward ? `+${next.a.reward}` : ''
    if (fill)     fill.style.width = `${(next.pct * 100).toFixed(1)}%`
    if (progress) {
      const fmt = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(Math.floor(n))
      progress.textContent = `${fmt(next.cur)} / ${fmt(next.max)}`
    }
  }

  _trackChallenge(type, amount = 1) {
    if (!this._daily?.challenges) return
    let updated = false
    for (const ch of this._daily.challenges) {
      if (ch.type !== type) continue
      const prev = this._challengeProgress[ch.id] || 0
      if (prev >= ch.target) continue
      const next = Math.min(prev + amount, ch.target)
      this._challengeProgress[ch.id] = next
      updated = true
      // Complete!
      if (next >= ch.target && prev < ch.target) {
        this.coins += ch.reward
        this.gameStats.totalCoinsEarned += ch.reward
        notify(`${ch.icon} Challenge complete: "${ch.desc}" +${ch.reward} coins!`, 'success', 5000)
        logEvent(`Challenge completed: ${ch.desc}`)
      }
    }
    if (updated) {
      // Persist progress
      const key = `nd_daily_${this.address || 'demo'}`
      const stored = JSON.parse(localStorage.getItem(key) || '{}')
      stored.challengeProgress = this._challengeProgress
      localStorage.setItem(key, JSON.stringify(stored))
      if (this.activeTab === 'achievements') renderChallenges(this._daily.challenges, this._challengeProgress)
    }
  }

  _checkAchievements() {
    const acts = new Set(this.normies.map(n => n.activity))
    if (acts.size >= 6) this.gameStats.allActivitiesOnce = true
    const newly = checkAchievements(this.gameStats, this.earnedAchievements)
    for (const id of newly) {
      this.earnedAchievements.push(id)
      const ach = ACHIEVEMENTS.find(a => a.id === id)
      if (ach) {
        showAchievementToast(ach)
        logEvent(EVENT_TEMPLATES.achieve(ach.name))
        if (ach.reward) {
          this.coins += ach.reward
          this.gameStats.totalCoinsEarned += ach.reward
        }
      }
    }
    if (newly.length && this.activeTab === 'achievements') renderAchievements(this.earnedAchievements)
  }

  _doSave() {
    if (!this.address) return
    saveState(this.address, {
      normies: this.normies.map(n => ({
        id: n.id, needs: n.needs, activity: n.activity,
        activityTicksLeft: n.activityTicksLeft, location: n.location,
        chatCooldown: n.chatCooldown || 0, _warned: n._warned || {},
      })),
      coins: this.coins, purchasedUpgrades: this.purchasedUpgrades,
      earnedAchievements: this.earnedAchievements,
      gameStats: this.gameStats, gameMinute: this.gameMinute,
    })
    // Submit score to leaderboard
    const happiness = calcDormHappiness(this.normies)
    submitScore({ address: this.address, coins: this.coins, normieCount: this.normies.length, happiness })
  }

  _stopAll() {
    clearInterval(this._tick); clearInterval(this._save); clearInterval(this._chat)
    cancelAnimationFrame(this._raf)
    if (this._glyphRaf) { cancelAnimationFrame(this._glyphRaf); this._glyphRaf = null }
    this._doSave()
    // Remove stored listeners by reference so they don't leak across sessions
    if (this._evNormieClick)  document.removeEventListener('normie-click',  this._evNormieClick)
    if (this._evNormieAction) document.removeEventListener('normie-action', this._evNormieAction)
    if (this._evQuickAction)  document.removeEventListener('quick-action',  this._evQuickAction)
    if (this._evNormieDrop)   document.removeEventListener('normie-drop',   this._evNormieDrop)
    if (this._keyHandler)     document.removeEventListener('keydown',       this._keyHandler)
    this._evNormieClick = this._evNormieAction = this._evQuickAction = this._evNormieDrop = this._keyHandler = null
  }
}

function _freshNormie(data, personality, idx, rooms) {
  const indoorRooms = rooms.filter(r => r.typeId !== 'outdoor')
  const defRoom     = indoorRooms[idx % Math.max(indoorRooms.length, 1)]?.id
                      || rooms[0]?.id || 'outdoor'
  // Always start in an indoor room — pick an activity valid there
  const { activity, location } = pickActivity(freshNeeds(), personality, defRoom, rooms)
  // Guard: if pickActivity still resolves to outdoor, override it
  const startLocation = (location === 'outdoor') ? defRoom : (location || defRoom)
  return {
    ...data, personality, needs: freshNeeds(), activity,
    activityTicksLeft: activityDuration(activity),
    location: startLocation, chatCooldown: 0, _warned: {},
  }
}
