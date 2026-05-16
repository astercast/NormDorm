import {
  ALL_NEEDS, NEED_LABELS, NEED_ICONS,
  ACTIVITY_META, UPGRADES, ACHIEVEMENTS, API_BASE,
  COINS_FEED_COST, COINS_ENERGY_DRINK_COST, COINS_STUDY_SESSION_COST, COINS_PARTY_COST,
} from './constants.js'
import { fetchLeaderboard, isGlobalEnabled, fmtCoins } from './leaderboard.js'

// ── Theme ─────────────────────────────────────────────────────────────────────

export function initTheme() {
  setTheme(localStorage.getItem('normdorm_theme') || 'light')
}
export function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem('normdorm_theme', t)
}
export function toggleTheme() {
  const c = document.documentElement.getAttribute('data-theme')
  const n = c === 'dark' ? 'light' : 'dark'
  setTheme(n); return n
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function notify(msg, type='info', dur=4000) {
  const s = document.getElementById('notif-stack'); if (!s) return
  const el = document.createElement('div')
  el.className = `notif notif-${type}`; el.textContent = msg
  s.appendChild(el)
  setTimeout(()=>{ el.classList.add('notif-exit'); setTimeout(()=>el.remove(),400) }, dur)
}

// ── Coin pop ──────────────────────────────────────────────────────────────────

export function showCoinPop(normieId, amount, combo) {
  const sprite = document.getElementById(`sprite-${normieId}`)
  const wrap   = document.getElementById('dorm-building-wrap')
  if (!sprite||!wrap) return

  const pop = document.createElement('div')
  pop.className = `coin-pop${combo>3?' combo-pop':''}`
  pop.textContent = combo > 1 ? `×${combo} +${amount}🪙` : `+${amount}🪙`
  const sr = sprite.getBoundingClientRect()
  const wr = wrap.getBoundingClientRect()
  pop.style.cssText = `left:${sr.left-wr.left+sr.width/2-20}px;top:${sr.top-wr.top-15}px`
  wrap.appendChild(pop)
  setTimeout(()=>pop.remove(), 1200)
}

// ── Combo meter ───────────────────────────────────────────────────────────────

export function updateComboMeter(combo, maxCombo) {
  const el = document.getElementById('combo-meter'); if (!el) return
  el.style.display = 'flex'
  el.classList.toggle('combo-active', combo > 1)
  el.classList.remove('combo-lvl1', 'combo-lvl2', 'combo-lvl3', 'combo-lvl4')
  if (combo >= 2) {
    const lvl = combo >= 8 ? 4 : combo >= 5 ? 3 : combo >= 3 ? 2 : 1
    el.classList.add(`combo-lvl${lvl}`)
  }
  el.querySelector('#combo-val').textContent = combo > 1 ? `×${combo}` : 'CLICK'
  const bar = el.querySelector('#combo-bar')
  if (bar) bar.style.width = combo > 1 ? `${(combo / maxCombo) * 100}%` : '0%'
}

// ── Chat bubbles ──────────────────────────────────────────────────────────────

const _bubbles = new Map()   // normieId → { el, raf, dismiss }

// Sprite canvas is 60×120 (after NORMIE_SCALE). Head top is at native row ~8,
// which is ~12px from canvas top. We anchor the bubble's TAIL TIP a few px
// above the head, then let the bubble extend upward from there.
const HEAD_TOP_PX = 10   // distance from sprite canvas top to head top
const TAIL_GAP    = 2    // tighter gap for closer bubble feel
const TAIL_SIZE   = 4    // matches .chat-bubble::after border-width

export function showChatBubble(normieId, text, dur = 3500) {
  // Clean up any existing bubble for this normie
  const existing = _bubbles.get(normieId)
  if (existing) existing.dismiss(true)

  const sprite = document.getElementById(`sprite-${normieId}`)
  const wrap   = document.getElementById('dorm-building-wrap')
  if (!sprite || !wrap) return

  const b = document.createElement('div')
  b.className = 'chat-bubble'
  b.textContent = text
  b.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,-100%);z-index:60;pointer-events:none'
  wrap.appendChild(b)

  // Position function — runs every frame so the bubble tracks a moving sprite.
  const position = () => {
    if (!sprite.isConnected) { dismiss(true); return }
    const sr = sprite.getBoundingClientRect()
    const wr = wrap.getBoundingClientRect()
    // X: horizontal center of the sprite canvas (head is centered in the bitmap)
    const cx = sr.left - wr.left + sr.width / 2
    // Y: bubble bottom (incl. tail) sits just above the head.
    //    tailTipY = sprite.top + HEAD_TOP_PX − TAIL_GAP
    //    bubbleBottom = tailTipY − TAIL_SIZE
    const bubbleBottom = sr.top - wr.top + HEAD_TOP_PX - TAIL_GAP - TAIL_SIZE
    b.style.left = cx + 'px'
    b.style.top  = bubbleBottom + 'px'
  }

  let raf = 0
  const loop = () => {
    position()
    raf = requestAnimationFrame(loop)
  }
  position()                             // initial frame so it doesn't flash at (0,0)
  raf = requestAnimationFrame(loop)

  let dismissed = false
  const dismiss = (immediate = false) => {
    if (dismissed) return
    dismissed = true
    cancelAnimationFrame(raf)
    _bubbles.delete(normieId)
    if (immediate) { b.remove(); return }
    b.classList.add('bubble-exit')
    setTimeout(() => b.remove(), 300)
  }
  _bubbles.set(normieId, { el: b, raf, dismiss })
  setTimeout(() => dismiss(false), dur)
}

// ── Log ───────────────────────────────────────────────────────────────────────

const _logQ = []
export function logEvent(msg) {
  const log = document.getElementById('log-inner')
  if (!log) { _logQ.push(msg); return }
  while (_logQ.length) _logLine(log, _logQ.shift())
  _logLine(log, msg)
  while (log.children.length > 60) log.removeChild(log.firstChild)
  const w = document.getElementById('event-log')
  if (w) requestAnimationFrame(()=>{ w.scrollTop = w.scrollHeight })
}

function _logLine(parent, msg) {
  const el = document.createElement('div'); el.className = 'log-line'
  const d  = new Date()
  const ts = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  el.innerHTML = `<span class="log-ts">${ts}</span><span class="log-msg">${msg}</span>`
  parent.appendChild(el)
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function updateStats(normies, coins, gameMinute, dormHappiness, incomePerMin) {
  const h  = Math.floor((gameMinute/60)%24)
  const m  = gameMinute % 60
  const h12 = ((h%12)||12).toString().padStart(2,'0')
  const mm  = m.toString().padStart(2,'0')
  const ap  = h < 12 ? 'AM' : 'PM'
  _v('stat-time',    `${h12}:${mm} ${ap}`)
  _v('stat-coins',   Math.floor(coins))
  _v('stat-outside', normies.filter(n=>n.location==='outdoor').length)
  _v('stat-sleeping',normies.filter(n=>['sleeping','napping'].includes(n.activity)).length)
  _v('stat-gaming',  normies.filter(n=>n.activity==='gaming').length)
  _v('stat-happy',   normies.filter(n=>ALL_NEEDS.every(k=>n.needs[k]>70)).length)

  if (dormHappiness !== undefined) {
    const fill = document.getElementById('happiness-fill')
    const pct  = document.getElementById('happiness-pct')
    if (fill) fill.style.width = `${dormHappiness}%`
    if (pct)  pct.textContent  = `${dormHappiness}%`
    const hClass = dormHappiness >= 80 ? 'hap-great' : dormHappiness >= 55 ? 'hap-ok' : 'hap-low'
    fill?.classList.remove('hap-great','hap-ok','hap-low')
    fill?.classList.add(hClass)
  }
  if (incomePerMin !== undefined) {
    _v('stat-income', `+${incomePerMin.toFixed(1)}/min`)
  }

  // Mirror key stats to the mobile stat bar
  if (dormHappiness !== undefined) {
    _v('msb-happiness', `${dormHappiness}%`)
  }
  if (incomePerMin !== undefined) {
    _v('msb-income', `+${incomePerMin.toFixed(1)}`)
  }
  _v('msb-outside', normies.filter(n => n.location === 'outdoor').length)
}
function _v(id,v) { const e=document.getElementById(id); if(e) e.textContent=v }

// ── Roster ────────────────────────────────────────────────────────────────────

export function renderRoster(normies) {
  const el = document.getElementById('roster'); if (!el) return
  el.innerHTML = ''
  for (const n of normies) {
    const item = document.createElement('div')
    item.className = 'roster-item'; item.id = `roster-${n.id}`
    item.dataset.normieId = n.id

    const avgNeed = ALL_NEEDS.reduce((s,k)=>s+n.needs[k],0)/ALL_NEEDS.length
    const mood    = avgNeed > 70 ? '😊' : avgNeed > 40 ? '😐' : '😟'
    item.innerHTML = `
      <img class="roster-portrait" src="${n.imageUrl}" loading="lazy" />
      <div class="roster-info">
        <div class="roster-name">#${n.id} <span class="roster-lvl">LV${n.level}</span></div>
        <div class="roster-act">${ACTIVITY_META[n.activity]?.emoji||''} ${ACTIVITY_META[n.activity]?.label||n.activity}</div>
      </div>
      <span class="roster-mood">${mood}</span>`
    item.addEventListener('click', ()=>document.dispatchEvent(new CustomEvent('normie-click',{detail:{id:n.id}})))
    el.appendChild(item)
  }
}

export function updateRosterItem(normie) {
  const item = document.getElementById(`roster-${normie.id}`); if (!item) return
  const actEl = item.querySelector('.roster-act')
  if (actEl) actEl.textContent = `${ACTIVITY_META[normie.activity]?.emoji||''} ${ACTIVITY_META[normie.activity]?.label||normie.activity}`
  const avg  = ALL_NEEDS.reduce((s,k)=>s+normie.needs[k],0)/ALL_NEEDS.length
  const mood = avg > 70 ? '😊' : avg > 40 ? '😐' : '😟'
  const mEl = item.querySelector('.roster-mood'); if (mEl) mEl.textContent = mood
}

// ── Detail panel ──────────────────────────────────────────────────────────────

export function showDetailPanel(normie, coins) {
  closeDetailPanel()
  const panel = document.createElement('div')
  panel.id = 'detail-panel'; panel.className = 'detail-panel'
  const act = ACTIVITY_META[normie.activity]

  // Agentic section (shown when persona is loaded)
  const agenticSection = normie.isAgentic ? `
    <div class="dp-agentic ${normie.agentPersona ? '' : 'loading'}">
      ${normie.agentPersona ? `
        <div class="dp-agentic-header">
          <span class="dp-agentic-badge">✦ AGENTIC</span>
          <span class="dp-agentic-name">${normie.agentPersona.name}</span>
        </div>
        <div class="dp-agentic-tagline">${normie.agentPersona.tagline || ''}</div>
        ${normie.agentPersona.greeting ? `<div class="dp-agentic-greeting">"${normie.agentPersona.greeting}"</div>` : ''}
        ${normie.agentPersona.personalityTraits?.length ? `
          <div class="dp-agentic-traits">
            ${normie.agentPersona.personalityTraits.slice(0,4).map(t=>`<span class="dp-agentic-trait">${t}</span>`).join('')}
          </div>` : ''}
      ` : '<div class="dp-agentic-pending">✦ Loading agent persona…</div>'}
    </div>` : ''

  panel.innerHTML = `
    <div class="dp-header">
      <div class="dp-name-row">
        <span class="dp-name">${normie.name}</span>
        ${normie.isAgentic ? '<span class="dp-chip agentic">✦ AGENT</span>' : ''}
        ${normie.customized ? '<span class="dp-chip custom">✦ CUSTOM</span>' : ''}
        <span class="dp-chip level">LV ${normie.level}</span>
        ${normie.actionPoints > 0 ? `<span class="dp-chip ap">AP ${normie.actionPoints}</span>` : ''}
      </div>
      <button class="btn-x" id="close-dp">✕</button>
    </div>
    <div class="dp-body">
      <div class="dp-portrait-col">
        <img class="dp-img" src="${API_BASE}/normie/${normie.id}/image.png" />
        <div class="dp-activity-badge">
          <span>${act?.emoji||'?'}</span>
          <span>${act?.label||normie.activity}</span>
        </div>
        <div class="dp-location">📍 ${normie.location.replace('room-','Room ').replace('outdoor','Quad')}</div>
      </div>
      <div class="dp-needs-col">
        <div class="dp-needs-title">NEEDS</div>
        ${ALL_NEEDS.map(k=>{
          const v=normie.needs[k]
          const cls=v<20?'crit':v<50?'low':v<75?'mid':'ok'
          return `<div class="dp-need-row">
            <span class="dp-ni">${NEED_ICONS[k]}</span>
            <span class="dp-nl">${NEED_LABELS[k]}</span>
            <div class="dp-bar"><div class="dp-fill ${cls}" style="width:${v.toFixed(0)}%"></div></div>
            <span class="dp-nv">${v.toFixed(0)}</span>
          </div>`
        }).join('')}
      </div>
    </div>
    ${agenticSection}
    <div class="dp-traits">
      ${(normie.traits||[]).slice(0,6).map(t=>`
        <div class="trait-chip">
          <span class="tc-type">${t.trait_type}</span>
          <span class="tc-val">${t.value}</span>
        </div>`).join('')}
    </div>
    <div class="dp-actions">
      <button class="dp-action-btn" data-action="feed" data-id="${normie.id}">
        🍜 Feed <span class="cost">${COINS_FEED_COST}🪙</span>
      </button>
      <button class="dp-action-btn" data-action="energy" data-id="${normie.id}">
        ⚡ Energy Drink <span class="cost">${COINS_ENERGY_DRINK_COST}🪙</span>
      </button>
      <button class="dp-action-btn" data-action="study" data-id="${normie.id}">
        📖 Focus Session <span class="cost">${COINS_STUDY_SESSION_COST}🪙</span>
      </button>
    </div>`

  document.body.appendChild(panel)

  document.getElementById('close-dp').onclick = closeDetailPanel
  panel.querySelectorAll('.dp-action-btn').forEach(btn=>{
    btn.onclick = ()=>document.dispatchEvent(new CustomEvent('normie-action',{detail:{action:btn.dataset.action, id:normie.id}}))
  })

  setTimeout(()=>{
    function outside(e){ if(!panel.contains(e.target)){ closeDetailPanel(); document.removeEventListener('click',outside) } }
    document.addEventListener('click', outside)
  }, 80)
}
export function closeDetailPanel() { document.getElementById('detail-panel')?.remove() }

// ── Shop ──────────────────────────────────────────────────────────────────────

const SHOP_CATEGORIES = [
  { label:'🛏 Comfort',  ids:['better_food','comfy_beds','social_lounge','shower_gel','gym_pass'] },
  { label:'💰 Income',   ids:['fast_wifi','dorm_fund','click_boost','mood_ring','combo_gloves']   },
  { label:'🎯 Activities', ids:['gaming_setup','study_lamp','sound_system','art_supplies']        },
]

export function renderShop(purchased, coins, onBuy) {
  const panel = document.getElementById('shop-panel'); if (!panel) return

  const cardHTML = (upg) => {
    const lvl   = purchased[upg.id]||0
    const maxed = lvl >= upg.maxLevel
    const cost  = Math.floor(upg.cost * Math.pow(1.65, lvl))
    const can   = coins >= cost && !maxed
    return `<div class="shop-card ${maxed?'maxed':''} ${can&&!maxed?'can-afford':''}">
      <div class="sc-top">
        <span class="sc-icon">${upg.icon}</span>
        <div class="sc-progress">${'◆'.repeat(lvl)}${'◇'.repeat(upg.maxLevel-lvl)}</div>
      </div>
      <div class="sc-name">${upg.name}</div>
      <div class="sc-desc">${upg.desc}</div>
      <button class="btn sc-btn ${can?'can-buy':''}" data-upg="${upg.id}" ${!can?'disabled':''}>
        ${maxed ? 'MAX ✓' : `${cost.toLocaleString()} 🪙`}
      </button>
    </div>`
  }

  const categoriesHTML = SHOP_CATEGORIES.map(cat => {
    const upgrades = UPGRADES.filter(u => cat.ids.includes(u.id))
    if (!upgrades.length) return ''
    return `<div class="shop-category">
      <div class="shop-cat-label">${cat.label}</div>
      <div class="shop-grid">${upgrades.map(cardHTML).join('')}</div>
    </div>`
  }).join('')

  panel.innerHTML = `
    <div class="panel-heading">
      <span class="panel-title">🏪 UPGRADE SHOP</span>
      <span class="panel-sub">Coins: <strong id="shop-coins-display">${Math.floor(coins).toLocaleString()} 🪙</strong></span>
    </div>
    ${categoriesHTML}
    <div class="panel-heading" style="margin-top:24px">
      <span class="panel-title">⚡ QUICK ACTIONS</span>
      <span class="panel-sub">Instant effects for all normies</span>
    </div>
    <div class="actions-grid">
      <div class="action-card">
        <span class="ac-icon">🎉</span>
        <span class="ac-name">Quad Party</span>
        <span class="ac-desc">All normies: social +30</span>
        <button class="btn ac-btn ${coins>=COINS_PARTY_COST?'can-buy':''}" data-qa="party" ${coins<COINS_PARTY_COST?'disabled':''}>
          ${COINS_PARTY_COST}🪙
        </button>
      </div>
      <div class="action-card">
        <span class="ac-icon">📚</span>
        <span class="ac-name">Study Session</span>
        <span class="ac-desc">All normies: study +25</span>
        <button class="btn ac-btn ${coins>=COINS_STUDY_SESSION_COST?'can-buy':''}" data-qa="studyAll" ${coins<COINS_STUDY_SESSION_COST?'disabled':''}>
          ${COINS_STUDY_SESSION_COST}🪙
        </button>
      </div>
    </div>`

  panel.querySelectorAll('.sc-btn:not([disabled])').forEach(btn=>btn.onclick=()=>onBuy(btn.dataset.upg))
  panel.querySelectorAll('.ac-btn:not([disabled])').forEach(btn=>{
    btn.onclick=()=>document.dispatchEvent(new CustomEvent('quick-action',{detail:{action:btn.dataset.qa}}))
  })
}

// ── Achievements ──────────────────────────────────────────────────────────────

export function renderAchievements(earnedIds) {
  const panel = document.getElementById('ach-panel'); if (!panel) return
  const count = earnedIds.length
  panel.innerHTML = `
    <div class="panel-heading">
      <span class="panel-title">🏆 ACHIEVEMENTS</span>
      <span class="panel-sub">${count}/${ACHIEVEMENTS.length} unlocked</span>
    </div>
    <div class="ach-progress-bar">
      <div class="ach-progress-fill" style="width:${(count/ACHIEVEMENTS.length*100).toFixed(0)}%"></div>
    </div>
    <div class="ach-grid">
      ${ACHIEVEMENTS.map(a=>{
        const earned = earnedIds.includes(a.id)
        return `<div class="ach-item ${earned?'earned':'locked'}">
          <span class="ach-icon">${a.icon}</span>
          <div class="ach-info">
            <div class="ach-name">${a.name}</div>
            <div class="ach-desc">${earned ? a.desc : '???'}</div>
          </div>
          ${earned ? '<span class="ach-check">✓</span>' : ''}
        </div>`
      }).join('')}
    </div>`
}

// ── Achievement toast ─────────────────────────────────────────────────────────

export function showAchievementToast(ach) {
  const el = document.createElement('div')
  el.className = 'ach-toast'
  el.innerHTML = `
    <div class="at-glow"></div>
    <span class="at-icon">${ach.icon}</span>
    <div>
      <div class="at-sup">Achievement Unlocked!</div>
      <div class="at-name">${ach.name}</div>
      <div class="at-desc">${ach.desc}${ach.reward ? ` <span class="at-reward">+${ach.reward}🪙</span>` : ''}</div>
    </div>`
  document.body.appendChild(el)
  setTimeout(()=>{ el.classList.add('at-exit'); setTimeout(()=>el.remove(),600) }, 4500)
}

// ── Offline modal ─────────────────────────────────────────────────────────────

export function showOfflineModal(mins, cb) {
  const h = Math.floor(mins/60), m = mins%60
  const t = h>0 ? `${h}h ${m}m` : `${m} minutes`
  const overlay = document.createElement('div'); overlay.className='modal-overlay'
  overlay.innerHTML=`<div class="modal">
    <div class="modal-icon">👋</div>
    <div class="modal-title">WELCOME BACK</div>
    <div class="modal-body">Your normies were on their own for <strong>${t}</strong>.<br>Needs have been decaying — time to check on them!</div>
    <button class="btn btn-primary" id="offline-ok">CHECK ON THEM →</button>
  </div>`
  document.body.appendChild(overlay)
  document.getElementById('offline-ok').onclick=()=>{ overlay.remove(); cb?.() }
}

// ── Wallet picker modal ───────────────────────────────────────────────────────

export function showWalletPicker(wallets, onSelect, onCancel) {
  const overlay = document.createElement('div'); overlay.className='modal-overlay'

  const walletItems = wallets.length
    ? wallets.map((w,i)=>`
        <button class="wallet-option" data-idx="${i}">
          ${w.info.icon ? `<img class="wallet-icon" src="${w.info.icon}" />` : '<span class="wallet-icon-fallback">⬡</span>'}
          <span class="wallet-name">${w.info.name}</span>
          <span class="wallet-arrow">→</span>
        </button>`).join('')
    : `<div class="no-wallets">
        <p>No wallet extension detected.</p>
        <p>Install <a href="https://metamask.io" target="_blank">MetaMask</a>, <a href="https://www.coinbase.com/wallet" target="_blank">Coinbase Wallet</a>, or any other Web3 wallet to connect.</p>
       </div>`

  overlay.innerHTML = `
    <div class="modal wallet-modal">
      <div class="modal-icon">🔑</div>
      <div class="modal-title">CONNECT WALLET</div>
      <div class="wallet-safety-note">
        <span class="safety-icon">🛡️</span>
        <span>Read-only — we never request transactions or signatures</span>
      </div>
      <div class="wallet-list">${walletItems}</div>
      <button class="btn btn-ghost" id="wallet-cancel">Cancel</button>
    </div>`

  document.body.appendChild(overlay)

  overlay.querySelectorAll('.wallet-option').forEach(btn=>{
    btn.onclick = ()=>{ overlay.remove(); onSelect(wallets[+btn.dataset.idx]) }
  })
  document.getElementById('wallet-cancel').onclick = ()=>{ overlay.remove(); onCancel?.() }
}

// ── How It Works page ─────────────────────────────────────────────────────────

export function renderHowItWorks(root) {
  root.innerHTML = `
    <div class="hiw-page">
      <div class="hiw-header">
        <button class="btn btn-ghost hiw-back" id="hiw-back">← BACK</button>
        <span class="hiw-title">HOW IT WORKS</span>
      </div>

      <div class="hiw-content">

        <section class="hiw-section">
          <div class="hiw-section-icon">🏠</div>
          <h2>What is NormDorm?</h2>
          <p>NormDorm is an idle life simulator for <a href="https://normies.art" target="_blank">Normies NFTs</a> — a 10,000-piece generative pixel art collection on Ethereum.</p>
          <p>Enter your Ethereum address to load your Normies into a pixel dorm. They live their own lives — sleeping, gaming, studying, chatting — while you earn coins, upgrade the dorm, and keep them happy.</p>
          <p>No wallet connection required. No fees, no transactions. Just vibes.</p>
        </section>

        <section class="hiw-section hiw-safety">
          <div class="hiw-section-icon">🛡️</div>
          <h2>Is it safe?</h2>
          <div class="safety-grid">
            <div class="safety-item good">
              <span class="si-icon">✅</span>
              <div>
                <strong>No wallet connection</strong>
                <p>Just type any Ethereum address. No extension required, no approval pop-ups, nothing to sign.</p>
              </div>
            </div>
            <div class="safety-item good">
              <span class="si-icon">✅</span>
              <div>
                <strong>Read-only blockchain queries</strong>
                <p>We read public Transfer event logs to determine which Normies an address holds. Zero gas, zero risk.</p>
              </div>
            </div>
            <div class="safety-item good">
              <span class="si-icon">✅</span>
              <div>
                <strong>No backend / no server</strong>
                <p>NormDorm is a static frontend. Game state saves to your own browser's localStorage only.</p>
              </div>
            </div>
            <div class="safety-item bad">
              <span class="si-icon">❌</span>
              <div>
                <strong>We never do this</strong>
                <p>Request signatures, approvals, or transactions of any kind.</p>
              </div>
            </div>
          </div>
        </section>

        <section class="hiw-section">
          <div class="hiw-section-icon">🎮</div>
          <h2>How does the game work?</h2>

          <h3>Your Normies have 6 needs:</h3>
          <div class="hiw-needs">
            <div class="hiw-need">🍜 <strong>Hunger</strong> — fill by eating or cooking</div>
            <div class="hiw-need">⚡ <strong>Energy</strong> — fill by sleeping or napping</div>
            <div class="hiw-need">🎮 <strong>Fun</strong> — fill by gaming, exercising, or going outside</div>
            <div class="hiw-need">💬 <strong>Social</strong> — fill by chatting or hanging in the quad</div>
            <div class="hiw-need">🚿 <strong>Hygiene</strong> — fill by showering</div>
            <div class="hiw-need">📖 <strong>Study</strong> — fill by studying or reading</div>
          </div>
          <p>Needs decay over time automatically. Your normies pick activities on their own to fill them — but you can intervene with coins.</p>
        </section>

        <section class="hiw-section">
          <div class="hiw-section-icon">💰</div>
          <h2>Earning coins</h2>
          <div class="hiw-coins-list">
            <div class="hc-item"><span class="hc-icon">👆</span><div><strong>Click normies</strong> — instant coin pop. Build a click combo for multiplied rewards!</div></div>
            <div class="hc-item"><span class="hc-icon">⏱️</span><div><strong>Passive income</strong> — every tick your normies passively earn coins just by being here</div></div>
            <div class="hc-item"><span class="hc-icon">✨</span><div><strong>Need satisfaction</strong> — when a need hits 90+, you get a coin bonus</div></div>
            <div class="hc-item"><span class="hc-icon">🔄</span><div><strong>Activity switches</strong> — small bonus every time a normie changes what they're doing</div></div>
            <div class="hc-item"><span class="hc-icon">🏆</span><div><strong>Achievements</strong> — unlock rewards by hitting milestones</div></div>
          </div>
        </section>

        <section class="hiw-section">
          <div class="hiw-section-icon">🛒</div>
          <h2>Spending coins</h2>
          <p>Use the <strong>Shop tab</strong> to buy upgrades that improve your dorm permanently — better food, faster WiFi, cozy beds, gaming setups, and more.</p>
          <p>You can also spend coins on <strong>Quick Actions</strong> (throw a quad party, run a study session) or <strong>direct interventions</strong> (feed a specific normie, give them an energy drink).</p>
        </section>

        <section class="hiw-section">
          <div class="hiw-section-icon">💡</div>
          <h2>Tips</h2>
          <div class="hiw-tips">
            <div class="hiw-tip-item">🖱️ <strong>Click fast</strong> on normies to build a combo multiplier — your coins multiply up to ×8!</div>
            <div class="hiw-tip-item">💤 <strong>Check back often</strong> — needs decay while you're away, but NormDorm does offline catchup when you return</div>
            <div class="hiw-tip-item">📶 <strong>Invest in WiFi early</strong> — passive income upgrades compound over time</div>
            <div class="hiw-tip-item">😊 <strong>Happy normies earn more</strong> — keep average dorm happiness above 85% for the Peak Dorm achievement</div>
            <div class="hiw-tip-item">🎯 <strong>Traits matter</strong> — your normie's on-chain traits affect their personality and which activities they prefer</div>
            <div class="hiw-tip-item">🏆 <strong>Achievements pay</strong> — every achievement unlocked gives you a coin bonus</div>
          </div>
        </section>

        <section class="hiw-section">
          <div class="hiw-section-icon">🎨</div>
          <h2>About Normies</h2>
          <p><a href="https://normies.art" target="_blank">Normies</a> is a 10,000-piece customizable pixel art NFT collection on Ethereum. Each Normie has a 40×40 pixel canvas that holders can edit on-chain.</p>
          <p>NormDorm uses the official Normies API to load your NFT's pixel data and render them as live sprites in the dorm.</p>
        </section>

      </div>
    </div>`

  document.getElementById('hiw-back').onclick = () => window.dispatchEvent(new Event('hiw-back'))
}

// ── Loading screen ────────────────────────────────────────────────────────────

export function renderLoading(root) {
  root.innerHTML = `
    <div class="header">
      <div class="logo">NORMDORM<span class="logo-sub">pixel dorm life</span></div>
      <div class="header-right">
        <button class="theme-toggle" id="theme-toggle">🌙</button>
      </div>
    </div>
    <div class="connect-screen">
      <div class="loading-art">
        <div class="load-normie"></div>
        <div class="load-pulse"></div>
      </div>
      <div class="load-text">LOADING NORMIES</div>
      <div class="load-wrap">
        <div class="load-bar"><div class="load-fill" id="load-fill" style="width:0%"></div></div>
        <div class="load-label" id="load-label">Fetching data…</div>
      </div>
    </div>
    <div id="notif-stack" class="notif-stack"></div>`
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme)
}

export function updateLoadProgress(loaded, total) {
  const f = document.getElementById('load-fill')
  const l = document.getElementById('load-label')
  if (f) f.style.width = `${Math.round((loaded/total)*100)}%`
  if (l) l.textContent = `${loaded} / ${total} normies loaded`
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export async function renderLeaderboard(currentAddress, isDemo) {
  const panel = document.getElementById('lb-panel')
  if (!panel) return

  const isGlobal = isGlobalEnabled()
  const addr     = (currentAddress || '').toLowerCase()

  panel.innerHTML = `<div class="lb-loading">Loading scores…</div>`

  let entries = []
  try { entries = await fetchLeaderboard() } catch {}

  const myRank = entries.findIndex(e => e.address === addr)

  panel.innerHTML = `
    <div class="lb-wrap-inner">
      <div class="lb-head">
        <div>
          <div class="lb-title">LEADERBOARD</div>
          <div class="lb-mode">${isGlobal
            ? '🌐 Global rankings — live data'
            : '📱 Device rankings — <a href="https://supabase.com" target="_blank">connect Supabase</a> for global'
          }</div>
        </div>
        <button class="btn btn-sm btn-ghost" id="lb-refresh-btn">↻ Refresh</button>
      </div>

      ${!isDemo && addr && myRank >= 0 ? `
        <div class="lb-my-rank">
          <span class="lb-rank-badge">#${myRank + 1}</span>
          <span class="lb-rank-addr">Your ranking</span>
          <span class="lb-rank-coins">🪙 ${fmtCoins(entries[myRank].coins)}</span>
        </div>` : ''}

      ${entries.length === 0
        ? `<div class="lb-empty">No scores yet — play to appear here!</div>`
        : `<div class="lb-list">
            <div class="lb-row lb-row-header">
              <div class="lb-col-rank">RANK</div>
              <div class="lb-col-addr">ADDRESS</div>
              <div class="lb-col-normies">NORMIES</div>
              <div class="lb-col-hap">HAP</div>
              <div class="lb-col-coins">COINS</div>
            </div>
            ${entries.slice(0, 50).map((e, i) => {
              const isMe = e.address === addr
              const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`
              return `
                <div class="lb-row${isMe ? ' lb-row-me' : ''}">
                  <div class="lb-col-rank">${rankIcon}</div>
                  <div class="lb-col-addr" title="${e.address}">${e.address.slice(0,6)}…${e.address.slice(-4)}</div>
                  <div class="lb-col-normies">${e.normie_count}</div>
                  <div class="lb-col-hap">${Math.floor(e.happiness)}%</div>
                  <div class="lb-col-coins">🪙 ${fmtCoins(e.coins)}</div>
                </div>`
            }).join('')}
          </div>`
      }

      ${isGlobal ? '' : `
        <div class="lb-setup-hint">
          <strong>Enable global leaderboard:</strong> Create a free
          <a href="https://supabase.com" target="_blank">Supabase</a> project,
          add the table (SQL in <code>src/leaderboard.js</code>), then set
          <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON</code> in <code>.env</code>.
        </div>`}
    </div>`

  document.getElementById('lb-refresh-btn')?.addEventListener('click', () => {
    renderLeaderboard(currentAddress, isDemo)
  })
}

// ── Daily Login Modal ─────────────────────────────────────────────────────────
export function showDailyModal(streak, reward, challenges) {
  const existing = document.getElementById('daily-modal')
  if (existing) existing.remove()

  const streakEmoji = streak >= 7 ? '🔥' : streak >= 3 ? '✨' : '⭐'
  const streakMsg   = streak === 1
    ? 'First login!'
    : streak >= 7
    ? `${streak}-day streak! You're on fire!`
    : `${streak} days in a row!`

  const el = document.createElement('div')
  el.id = 'daily-modal'
  el.className = 'daily-modal'
  el.innerHTML = `
    <div class="daily-card">
      <button class="btn-x daily-close" id="daily-close">✕</button>
      <div class="daily-streak">${streakEmoji}</div>
      <div class="daily-title">DAILY CHECK-IN</div>
      <div class="daily-streak-text">${streakMsg}</div>
      <div class="daily-reward">
        <span class="daily-reward-label">Today's reward</span>
        <span class="daily-reward-coins">+${reward} 🪙</span>
      </div>
      <div class="daily-challenges-title">TODAY'S CHALLENGES</div>
      <div class="daily-challenge-list">
        ${challenges.map(ch => `
          <div class="daily-ch-item">
            <span class="daily-ch-icon">${ch.icon}</span>
            <span class="daily-ch-desc">${ch.desc}</span>
            <span class="daily-ch-reward">+${ch.reward}🪙</span>
          </div>`).join('')}
      </div>
      <button class="btn btn-primary daily-btn" id="daily-ok">LET'S GO</button>
    </div>`

  document.body.appendChild(el)

  const close = () => { el.classList.add('daily-exit'); setTimeout(() => el.remove(), 300) }
  document.getElementById('daily-close').onclick = close
  document.getElementById('daily-ok').onclick    = close
  // Show with animation
  requestAnimationFrame(() => el.classList.add('daily-visible'))
}

// ── Daily Challenges Panel ─────────────────────────────────────────────────────
export function renderChallenges(challenges, progress) {
  const panel = document.getElementById('challenges-panel')
  if (!panel) return

  if (!challenges.length) {
    panel.innerHTML = `<div class="ch-empty">Check back tomorrow for daily challenges!</div>`
    return
  }

  panel.innerHTML = `
    <div class="ch-list">
      ${challenges.map(ch => {
        const prog = progress[ch.id] || 0
        const done = prog >= ch.target
        const pct  = Math.min((prog / ch.target) * 100, 100)
        return `
          <div class="ch-row${done ? ' ch-done' : ''}">
            <div class="ch-top">
              <span class="ch-icon">${ch.icon}</span>
              <span class="ch-desc">${ch.desc}</span>
              <span class="ch-reward${done ? ' done' : ''}">+${ch.reward}🪙</span>
            </div>
            <div class="ch-bar-wrap">
              <div class="ch-bar-fill" style="width:${pct}%"></div>
            </div>
            <div class="ch-progress">${done ? '✓ Complete' : `${prog} / ${ch.target}`}</div>
          </div>`
      }).join('')}
    </div>`
}

