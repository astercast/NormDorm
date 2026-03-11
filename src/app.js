import {
  DEMO_IDS, TICK_MS, GAME_MINS_PER_TICK,
  ACTIVITY_META, CHAT_LINES, EVENT_TEMPLATES, ALL_NEEDS,
  UPGRADES, ACHIEVEMENTS,
  COINS_CLICK_BASE, COINS_PER_TICK_BASE,
  COINS_ACTIVITY_SWITCH,
  COINS_NEED_SATISFIED, COINS_CRITICAL_PENALTY,
  COINS_FEED_COST, COINS_ENERGY_DRINK_COST, COINS_STUDY_SESSION_COST, COINS_PARTY_COST,
  COMBO_WINDOW_MS, COMBO_MAX,
  buildRoomList,
} from './constants.js'
import {
  saveState, loadState, freshNeeds, buildPersonality,
  pickActivity, activityDuration, tickNormie,
  applyOfflineCatchup, buildUpgradeEffects, checkAchievements, clamp,
} from './state.js'
import {
  startWalletDiscovery, getDiscoveredWallets, connectWithProvider, fetchOwnedNormies, fetchNormiesData,
} from './wallet.js'
import { preloadNormieImage } from './pixel-renderer.js'
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
  showWalletPicker, renderHowItWorks,
  renderLoading, updateLoadProgress,
} from './ui.js'

export class App {
  constructor(root) {
    this.root    = root
    this.address = null
    this.provider = null
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
      allHappyOnce:false, allActivitiesOnce:false,
      maxCombo:0, satisfiedCount:0, feedCount:0,
    }

    this._tick = null; this._save = null
    this._chat = null; this._raf  = null
    this._lastRaf = null
  }

  async init() {
    initTheme()
    startWalletDiscovery()
    this._renderConnect()
  }

  _renderConnect() {
    this.root.innerHTML = `
      <div class="header">
        <div class="logo">NORMDORM<span class="logo-sub">pixel dorm life</span></div>
        <div class="header-right">
          <a href="https://normies.art" target="_blank" class="header-link">normies.art ↗</a>
          <button class="btn btn-ghost btn-sm" id="hiw-btn">HOW IT WORKS</button>
          <button class="theme-toggle" id="theme-toggle">🌙</button>
        </div>
      </div>

      <div class="connect-screen">
        <div class="connect-hero">
          <div class="hero-pixel-grid" id="hero-grid"></div>
        </div>
        <h1 class="connect-title">NORMDORM</h1>
        <p class="connect-sub">
          Load your <a href="https://normies.art" target="_blank">Normies NFTs</a> into a living pixel dorm.<br>
          Watch them sleep, game, chat and vibe — idle your way to the perfect dorm.
        </p>
        <div class="connect-btns">
          <button class="btn btn-primary btn-lg" id="btn-connect">⬡ CONNECT WALLET</button>
          <button class="btn btn-lg" id="btn-demo">DEMO MODE</button>
        </div>
        <p class="connect-hint">
          🛡️ Read-only — no transactions ever •
          <button class="link-btn" id="hiw-inline">learn more</button>
        </p>
        <div class="connect-features">
          <div class="feat">🏠 Live dorm rooms</div>
          <div class="feat">💰 Idle economy</div>
          <div class="feat">🕹️ Click combos</div>
          <div class="feat">🛒 Upgrades</div>
          <div class="feat">🏆 Achievements</div>
          <div class="feat">🌙 Day/night cycle</div>
          <div class="feat">💾 Auto-save</div>
          <div class="feat">📴 Offline catchup</div>
        </div>
      </div>
      <div id="notif-stack" class="notif-stack"></div>`

    document.getElementById('btn-connect').onclick = () => this._handleConnect()
    document.getElementById('btn-demo').onclick    = () => this._handleDemo()
    document.getElementById('theme-toggle').onclick = toggleTheme
    document.getElementById('hiw-btn').onclick     = () => this._showHowItWorks()
    document.getElementById('hiw-inline').onclick  = () => this._showHowItWorks()
    this._animateHero()
  }

  _animateHero() {
    const grid = document.getElementById('hero-grid'); if (!grid) return
    for (let r = 0; r < 10; r++) for (let c = 0; c < 16; c++) {
      const cell = document.createElement('div')
      cell.className = 'hero-cell'
      if (Math.random() > 0.55) cell.classList.add('on')
      cell.style.animationDelay = `${(Math.random()*4).toFixed(2)}s`
      grid.appendChild(cell)
    }
  }

  _showHowItWorks() {
    renderHowItWorks(this.root)
    window.addEventListener('hiw-back', ()=>this._renderConnect(), { once:true })
  }

  async _handleConnect() {
    await new Promise(r=>setTimeout(r,200))
    const wallets = getDiscoveredWallets()
    if (!wallets.length && !window.ethereum) {
      notify('No wallet detected. Try demo mode or install a Web3 wallet.', 'warn', 6000); return
    }
    if (wallets.length === 1)      await this._connectWallet(wallets[0])
    else if (wallets.length > 1)   showWalletPicker(wallets, w=>this._connectWallet(w), ()=>{})
    else if (window.ethereum)      await this._connectWallet({ info:{uuid:'legacy',name:'Browser Wallet',icon:null}, provider:window.ethereum })
  }

  async _connectWallet(walletDef) {
    try {
      const { address, provider } = await connectWithProvider(walletDef.provider)
      this.address = address; this.provider = provider
      notify(`Connected: ${address.slice(0,6)}…${address.slice(-4)}`, 'info')
      const tokenIds = await fetchOwnedNormies(address, provider)
      if (!tokenIds.length) {
        notify('No Normies found — loading demo.', 'warn', 5000)
        await this._startDorm(address, DEMO_IDS, true)
      } else {
        await this._startDorm(address, tokenIds, false)
      }
    } catch(e) {
      if (e.message === 'USER_REJECTED') { notify('Wallet connection cancelled.', 'warn'); return }
      notify(`Connection failed: ${e.message}`, 'error')
    }
  }

  async _handleDemo() { await this._startDorm(null, DEMO_IDS, true) }

  async _startDorm(address, tokenIds, isDemo) {
    this.isDemo = isDemo; this.address = address
    renderLoading(this.root)

    const ids = tokenIds.slice(0, 12)
    this.rooms = buildRoomList(ids.length)

    const normieData = await fetchNormiesData(ids, (l,t)=>updateLoadProgress(l,t))
    await Promise.all(ids.map(id=>preloadNormieImage(id)))

    const saved = address ? loadState(address) : null
    let offlineMinutes = 0

    if (saved) {
      const { state, offlineMinutes:om } = applyOfflineCatchup(saved)
      offlineMinutes = om
      this.coins              = state.coins              || 0
      this.purchasedUpgrades  = state.purchasedUpgrades  || {}
      this.earnedAchievements = state.earnedAchievements || []
      this.gameStats          = { ...this.gameStats, ...state.gameStats }
      this.gameMinute         = state.gameMinute         || 0
      this.upgradeEffects     = buildUpgradeEffects(this.purchasedUpgrades)
      this.normies = normieData.map((data,idx)=>{
        const prev = saved.normies?.find(n=>n.id===data.id)
        const pers = buildPersonality(data.traits)
        if (prev) return { ...prev, ...data, personality:pers, needs:{...prev.needs} }
        return _freshNormie(data, pers, idx, this.rooms)
      })
    } else {
      this.coins = isDemo ? 500 : 0
      this.upgradeEffects = buildUpgradeEffects({})
      this.normies = normieData.map((data,idx)=>_freshNormie(data, buildPersonality(data.traits), idx, this.rooms))
    }

    this.normieMap = new Map(this.normies.map(n=>[n.id,n]))
    this._renderDorm()

    if (offlineMinutes > 5) showOfflineModal(offlineMinutes, ()=>logEvent(`Welcome back — ${offlineMinutes}m elapsed.`))
    this._startLoops()
  }

  _renderDorm() {
    const addr = this.address ? `${this.address.slice(0,6)}…${this.address.slice(-4)}` : 'DEMO'

    this.root.innerHTML = `
      <div class="header">
        <div class="logo">NORMDORM<span class="logo-sub">pixel dorm life</span></div>
        <div class="header-right">
          <div class="coin-pill" id="coin-display">
            <span class="coin-icon">🪙</span>
            <span id="stat-coins">0</span>
          </div>
          <div class="time-pill" id="stat-time">12:00 AM</div>
          <div class="addr-chip">${addr}</div>
          <a href="https://normies.art" target="_blank" class="header-link">normies.art ↗</a>
          <button class="btn btn-ghost btn-sm" id="hiw-btn">?</button>
          <button class="theme-toggle" id="theme-toggle">🌙</button>
          <button class="btn btn-ghost btn-sm" id="btn-leave">✕</button>
        </div>
      </div>
      ${this.isDemo ? '<div class="demo-banner">📡 DEMO MODE — Connect a wallet with Normies to load your own</div>' : ''}

      <div class="tab-bar">
        <button class="tab-btn active" data-tab="dorm">🏠 DORM</button>
        <button class="tab-btn" data-tab="shop">🛒 SHOP</button>
        <button class="tab-btn" data-tab="achievements">🏆 ACHIEVEMENTS</button>
      </div>

      <div class="main-layout">
        <div class="tab-content active" id="tab-dorm">
          <div class="dorm-layout">
            <div class="dorm-main">
              <div id="combo-meter" class="combo-meter" style="display:none">
                <span class="combo-label">COMBO</span>
                <span id="combo-val" class="combo-val">×1</span>
                <div class="combo-track"><div id="combo-bar" class="combo-bar"></div></div>
              </div>
              <div id="dorm-building-wrap"></div>
            </div>
            <div class="dorm-sidebar">
              <div class="sb-section">
                <div class="sb-title">STATS</div>
                <div class="stats-grid">
                  <div class="stat-block"><div class="stat-val" id="stat-outside">0</div><div class="stat-lbl">OUTSIDE</div></div>
                  <div class="stat-block"><div class="stat-val" id="stat-sleeping">0</div><div class="stat-lbl">SLEEPING</div></div>
                  <div class="stat-block"><div class="stat-val" id="stat-gaming">0</div><div class="stat-lbl">GAMING</div></div>
                  <div class="stat-block"><div class="stat-val" id="stat-happy">0</div><div class="stat-lbl">HAPPY</div></div>
                </div>
              </div>
              <div class="sb-section sb-click-hint">
                <div class="hint-text">👆 Click normies for coins!</div>
                <div class="hint-sub">Build a combo for ×${COMBO_MAX} multiplier</div>
              </div>
              <div class="sb-section">
                <div class="sb-title">RESIDENTS <span class="sb-count">${this.normies.length}</span></div>
                <div class="roster" id="roster"></div>
              </div>
              <div class="sb-section sb-log">
                <div class="sb-title">LOG</div>
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
        </div>
      </div>

      <div id="notif-stack" class="notif-stack"></div>`

    this.root.querySelectorAll('.tab-btn').forEach(btn=>btn.onclick=()=>this._tab(btn.dataset.tab))
    document.getElementById('theme-toggle').onclick = toggleTheme
    document.getElementById('btn-leave').onclick    = ()=>{ this._stopAll(); this._renderConnect() }
    document.getElementById('hiw-btn').onclick      = ()=>this._showHowItWorksInDorm()

    const { el, sceneEls } = buildDorm(this.rooms)
    this.sceneEls = sceneEls
    document.getElementById('dorm-building-wrap').appendChild(el)

    for (const normie of this.normies) {
      placeSprite(normie, this.sceneEls[normie.location] || this.sceneEls[this.rooms[0]?.id] || this.sceneEls['outdoor'])
    }

    renderRoster(this.normies)
    renderShop(this.purchasedUpgrades, this.coins, id=>this._buyUpgrade(id))
    renderAchievements(this.earnedAchievements)
    updateOccupancy(this.normies)
    this.nightAlpha = updateDayNight(this.gameMinute)
    updateStats(this.normies, this.coins, this.gameMinute)

    document.addEventListener('normie-click',  e=>this._onNormieClick(e.detail.id))
    document.addEventListener('normie-action', e=>this._onNormieAction(e.detail.action, e.detail.id))
    document.addEventListener('quick-action',  e=>this._onQuickAction(e.detail.action))

    logEvent('Welcome to NormDorm! Click your normies to earn coins.')
  }

  _tab(tab) {
    this.activeTab = tab
    this.root.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab))
    this.root.querySelectorAll('.tab-content').forEach(c=>c.classList.toggle('active',c.id===`tab-${tab}`))
    if (tab==='shop')         renderShop(this.purchasedUpgrades, this.coins, id=>this._buyUpgrade(id))
    if (tab==='achievements') renderAchievements(this.earnedAchievements)
  }

  _showHowItWorksInDorm() {
    this._stopAll()
    renderHowItWorks(this.root)
    window.addEventListener('hiw-back', ()=>{ this._renderDorm(); this._startLoops() }, { once:true })
  }

  _onNormieClick(id) {
    const normie = this.normieMap.get(id); if (!normie) return
    const now = Date.now()
    if (now - this.comboLastMs < COMBO_WINDOW_MS) {
      this.comboCount = Math.min(this.comboCount+1, this._maxCombo())
    } else {
      this.comboCount = 1
    }
    this.comboLastMs = now
    clearTimeout(this.comboTimeout)
    this.comboTimeout = setTimeout(()=>{ this.comboCount=0; updateComboMeter(0,this._maxCombo()) }, COMBO_WINDOW_MS+200)

    const base = COINS_CLICK_BASE * (this.upgradeEffects.clickMult||1)
    const amt  = Math.ceil(base * this.comboCount * (1 + (normie.level||1)*0.15))
    this.coins += amt
    this.gameStats.totalClicks++
    this.gameStats.totalCoinsEarned += amt
    this.gameStats.maxCombo = Math.max(this.gameStats.maxCombo, this.comboCount)

    normie.needs.fun    = clamp(normie.needs.fun    + 4)
    normie.needs.social = clamp(normie.needs.social + 2)

    showCoinPop(id, amt, this.comboCount)
    updateComboMeter(this.comboCount, this._maxCombo())
    logEvent(EVENT_TEMPLATES.coins(normie.name, amt, this.comboCount))
    showDetailPanel(normie, this.coins)
    this._checkAchievements()
    updateStats(this.normies, this.coins, this.gameMinute)
  }

  _maxCombo() { return COMBO_MAX + (this.upgradeEffects.comboBonus||0) }

  _onNormieAction(action, id) {
    const normie = this.normieMap.get(id); if (!normie) return
    const costs = { feed:COINS_FEED_COST, energy:COINS_ENERGY_DRINK_COST, study:COINS_STUDY_SESSION_COST }
    const cost = costs[action]
    if (this.coins < cost) { notify('Not enough coins!', 'warn'); return }
    this.coins -= cost
    if (action === 'feed')   { normie.needs.hunger = clamp(normie.needs.hunger + 20); notify(`Fed ${normie.name} 🍜`,'info'); logEvent(EVENT_TEMPLATES.feed(normie.name)); this.gameStats.feedCount++ }
    if (action === 'energy') { normie.needs.energy = clamp(normie.needs.energy + 35); notify(`⚡ Energy drink for ${normie.name}`,'info'); logEvent(EVENT_TEMPLATES.energyDrink(normie.name)) }
    if (action === 'study')  { normie.needs.study  = clamp(normie.needs.study + 30); normie.needs.fun = clamp(normie.needs.fun - 5); notify(`📖 Focus session for ${normie.name}`,'info') }
    closeDetailPanel()
    setTimeout(()=>showDetailPanel(normie, this.coins), 60)
    updateStats(this.normies, this.coins, this.gameMinute)
    this._checkAchievements()
  }

  _onQuickAction(action) {
    if (action === 'party') {
      if (this.coins < COINS_PARTY_COST) { notify('Not enough coins!','warn'); return }
      this.coins -= COINS_PARTY_COST
      for (const n of this.normies) n.needs.social = clamp(n.needs.social + 30)
      notify('🎉 Quad Party! All social +30','info',5000)
      logEvent(EVENT_TEMPLATES.party())
    }
    if (action === 'studyAll') {
      if (this.coins < COINS_STUDY_SESSION_COST) { notify('Not enough coins!','warn'); return }
      this.coins -= COINS_STUDY_SESSION_COST
      for (const n of this.normies) n.needs.study = clamp(n.needs.study + 25)
      notify('📚 Study session! All study +25','info',5000)
      logEvent(EVENT_TEMPLATES.studySession())
    }
    renderShop(this.purchasedUpgrades, this.coins, id=>this._buyUpgrade(id))
    updateStats(this.normies, this.coins, this.gameMinute)
  }

  _buyUpgrade(upgradeId) {
    const upg = UPGRADES.find(u=>u.id===upgradeId); if (!upg) return
    const lvl = this.purchasedUpgrades[upgradeId]||0
    if (lvl >= upg.maxLevel) { notify('Already maxed!','warn'); return }
    const cost = Math.floor(upg.cost * Math.pow(1.65, lvl))
    if (this.coins < cost) { notify('Not enough coins!','warn'); return }
    this.coins -= cost
    this.purchasedUpgrades[upgradeId] = lvl+1
    this.upgradeEffects = buildUpgradeEffects(this.purchasedUpgrades)
    this.gameStats.totalUpgradesBought++
    notify(`${upg.icon} ${upg.name} upgraded to Lv.${lvl+1}`,'info')
    logEvent(EVENT_TEMPLATES.upgrade(upg.name, lvl+1))
    renderShop(this.purchasedUpgrades, this.coins, id=>this._buyUpgrade(id))
    this._checkAchievements()
    updateStats(this.normies, this.coins, this.gameMinute)
  }

  _startLoops() {
    this._tick = setInterval(()=>this._gameTick(), TICK_MS)
    this._save = this.address ? setInterval(()=>this._doSave(), 20000) : null
    this._chat = setInterval(()=>this._chatTick(), 4200)
    this._startRAF()
  }

  _gameTick() {
    this.tickCount++
    this.gameMinute += GAME_MINS_PER_TICK

    const mult = this.upgradeEffects.passiveIncomeMult||1
    const flat = this.upgradeEffects.passiveIncomeFlat||0
    const passive = this.normies.length * COINS_PER_TICK_BASE * mult + flat
    this.coins += passive
    this.gameStats.totalCoinsEarned += passive

    for (const n of this.normies) {
      const satisfiedEvents = tickNormie(n, this.upgradeEffects)
      n.activityTicksLeft--
      if (n.activityTicksLeft <= 0) this._switchActivity(n)

      for (const k of satisfiedEvents) {
        const satAmt = Math.ceil(COINS_NEED_SATISFIED * (this.upgradeEffects.satisfiedMult||1))
        this.coins += satAmt
        this.gameStats.totalCoinsEarned += satAmt
        this.gameStats.satisfiedCount++
        logEvent(EVENT_TEMPLATES.satisfied(n.name, k))
      }
      for (const k of ALL_NEEDS) {
        if (n.needs[k] < 8 && !n._warned?.[k]) {
          n._warned = { ...(n._warned||{}), [k]:true }
          logEvent(EVENT_TEMPLATES.critical(n.name, k))
          notify(`⚠️ ${n.name} — ${k} is critical!`, 'warn')
          this.coins = Math.max(0, this.coins - COINS_CRITICAL_PENALTY)
        }
        if (n.needs[k] > 25 && n._warned?.[k]) n._warned[k] = false
      }
      if (n.chatCooldown > 0) n.chatCooldown--
      if (this.tickCount % 5 === 0) updateRosterItem(n)
    }

    if (this.tickCount % 8 === 0) this._checkAchievements()
    updateStats(this.normies, this.coins, this.gameMinute)
    updateOccupancy(this.normies)
    this.nightAlpha = updateDayNight(this.gameMinute)
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
      logEvent(EVENT_TEMPLATES[activity]?.(normie.name) || `${normie.name} → ${activity}`)
      this.coins += COINS_ACTIVITY_SWITCH
      onActivityChanged(normie)
    }
  }

  _startRAF() {
    const loop = ts => {
      const dt = this._lastRaf ? Math.min((ts-this._lastRaf)/1000, 0.1) : 0.016
      this._lastRaf = ts
      animateSprites(this.normieMap, this.nightAlpha, dt)
      this._raf = requestAnimationFrame(loop)
    }
    this._raf = requestAnimationFrame(loop)
  }

  _chatTick() {
    if (Math.random() > 0.45) return
    const eligible = this.normies.filter(n =>
      n.chatCooldown <= 0 &&
      ['chatting','outside','gaming','eating','walking','exercising','cooking','sketching'].includes(n.activity)
    )
    if (!eligible.length) return
    const n = eligible[Math.floor(Math.random()*eligible.length)]
    const isCrit = Object.values(n.needs).some(v=>v<12)
    const pool   = isCrit ? CHAT_LINES.critical : (CHAT_LINES[n.activity]||CHAT_LINES.chatting)
    showChatBubble(n.id, pool[Math.floor(Math.random()*pool.length)])
    n.chatCooldown = 20 + Math.floor(Math.random()*15)
  }

  _checkAchievements() {
    if (this.normies.every(n=>ALL_NEEDS.every(k=>n.needs[k]>80))) this.gameStats.allHappyOnce = true
    const acts = new Set(this.normies.map(n=>n.activity))
    if (acts.size >= 6) this.gameStats.allActivitiesOnce = true
    const newly = checkAchievements(this.gameStats, this.earnedAchievements)
    for (const id of newly) {
      this.earnedAchievements.push(id)
      const ach = ACHIEVEMENTS.find(a=>a.id===id)
      if (ach) { showAchievementToast(ach); logEvent(EVENT_TEMPLATES.achieve(ach.name)) }
    }
  }

  _doSave() {
    if (!this.address) return
    saveState(this.address, {
      normies: this.normies.map(n=>({ id:n.id, needs:n.needs, activity:n.activity, activityTicksLeft:n.activityTicksLeft, location:n.location, chatCooldown:n.chatCooldown||0, _warned:n._warned||{} })),
      coins:this.coins, purchasedUpgrades:this.purchasedUpgrades,
      earnedAchievements:this.earnedAchievements,
      gameStats:this.gameStats, gameMinute:this.gameMinute,
    })
  }

  _stopAll() {
    clearInterval(this._tick); clearInterval(this._save); clearInterval(this._chat)
    cancelAnimationFrame(this._raf)
    this._doSave()
    document.removeEventListener('normie-click',  ()=>{})
    document.removeEventListener('normie-action', ()=>{})
    document.removeEventListener('quick-action',  ()=>{})
  }
}

function _freshNormie(data, personality, idx, rooms) {
  const indoorRooms = rooms.filter(r => r.typeId !== 'outdoor')
  const defRoom = indoorRooms[idx % Math.max(indoorRooms.length, 1)]?.id || 'outdoor'
  const { activity, location } = pickActivity(freshNeeds(), personality, defRoom, rooms)
  return {
    ...data, personality, needs:freshNeeds(), activity,
    activityTicksLeft:activityDuration(activity),
    location: location || defRoom, chatCooldown:0, _warned:{},
  }
}
