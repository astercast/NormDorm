import {
  ALL_NEEDS, NEED_LABELS, NEED_ICONS,
  ACTIVITY_META, UPGRADES, ACHIEVEMENTS, API_BASE,
  COINS_FEED_COST, COINS_ENERGY_DRINK_COST, COINS_STUDY_SESSION_COST, COINS_PARTY_COST,
} from './constants.js'

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
  el.style.display = combo > 1 ? 'flex' : 'none'
  el.querySelector('#combo-val').textContent = `×${combo}`
  const bar = el.querySelector('#combo-bar')
  if (bar) bar.style.width = `${(combo/maxCombo)*100}%`
}

// ── Chat bubbles ──────────────────────────────────────────────────────────────

const _bubbles = new Map()

export function showChatBubble(normieId, text, dur=3500) {
  _bubbles.get(normieId)?.remove()
  const sprite = document.getElementById(`sprite-${normieId}`)
  const wrap   = document.getElementById('dorm-building-wrap')
  if (!sprite||!wrap) return

  const b = document.createElement('div')
  b.className = 'chat-bubble'
  b.textContent = text
  const sr = sprite.getBoundingClientRect()
  const wr = wrap.getBoundingClientRect()
  b.style.cssText = `position:absolute;left:${sr.left-wr.left+sr.width/2}px;top:${sr.top-wr.top-52}px;transform:translateX(-50%);z-index:60;pointer-events:none`
  wrap.appendChild(b)
  _bubbles.set(normieId, b)
  setTimeout(()=>{
    b.classList.add('bubble-exit')
    setTimeout(()=>{ b.remove(); _bubbles.delete(normieId) }, 300)
  }, dur)
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

export function updateStats(normies, coins, gameMinute) {
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

  panel.innerHTML = `
    <div class="dp-header">
      <div class="dp-name-row">
        <span class="dp-name">${normie.name}</span>
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

export function renderShop(purchased, coins, onBuy) {
  const panel = document.getElementById('shop-panel'); if (!panel) return
  panel.innerHTML = `
    <div class="panel-heading">
      <span class="panel-title">🏪 UPGRADE SHOP</span>
      <span class="panel-sub">Spend coins to improve your dorm</span>
    </div>
    <div class="shop-grid">
      ${UPGRADES.map(upg=>{
        const lvl   = purchased[upg.id]||0
        const maxed = lvl >= upg.maxLevel
        const cost  = Math.floor(upg.cost * Math.pow(1.65, lvl))
        const can   = coins >= cost && !maxed
        return `<div class="shop-card ${maxed?'maxed':''}">
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
      }).join('')}
    </div>
    <div class="panel-heading" style="margin-top:24px">
      <span class="panel-title">⚡ QUICK ACTIONS</span>
      <span class="panel-sub">Instant effects for all normies</span>
    </div>
    <div class="actions-grid">
      <div class="action-card" data-qa="party">
        <span class="ac-icon">🎉</span>
        <span class="ac-name">Quad Party</span>
        <span class="ac-desc">All normies: social +30</span>
        <button class="btn ac-btn ${coins>=COINS_PARTY_COST?'can-buy':''}" data-qa="party" ${coins<COINS_PARTY_COST?'disabled':''}>
          ${COINS_PARTY_COST}🪙
        </button>
      </div>
      <div class="action-card" data-qa="study">
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
      <div class="at-desc">${ach.desc}</div>
    </div>`
  document.body.appendChild(el)
  setTimeout(()=>{ el.classList.add('at-exit'); setTimeout(()=>el.remove(),600) }, 4000)
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
          <p>Connect your wallet to load your Normies into a pixel dorm. They live their own lives — sleeping, gaming, studying, chatting — while you earn coins, upgrade the dorm, and keep them happy.</p>
          <p>No play-to-earn, no fees, no transactions. Just vibes.</p>
        </section>

        <section class="hiw-section hiw-safety">
          <div class="hiw-section-icon">🛡️</div>
          <h2>Is it safe to connect my wallet?</h2>
          <div class="safety-grid">
            <div class="safety-item good">
              <span class="si-icon">✅</span>
              <div>
                <strong>Read-only access</strong>
                <p>We only read your wallet address and which Normies you own. Nothing more.</p>
              </div>
            </div>
            <div class="safety-item good">
              <span class="si-icon">✅</span>
              <div>
                <strong>No transaction requests</strong>
                <p>We never ask you to approve, sign, or send anything. Your wallet will never show a transaction popup from us.</p>
              </div>
            </div>
            <div class="safety-item good">
              <span class="si-icon">✅</span>
              <div>
                <strong>No private key access</strong>
                <p>Your private keys never leave your wallet. We only see your public address.</p>
              </div>
            </div>
            <div class="safety-item good">
              <span class="si-icon">✅</span>
              <div>
                <strong>No backend / no server</strong>
                <p>NormDorm is a static frontend app. Your game state saves to your own browser (localStorage). Nothing is sent to any server.</p>
              </div>
            </div>
            <div class="safety-item good">
              <span class="si-icon">✅</span>
              <div>
                <strong>Open code</strong>
                <p>The only two contract calls we make are <code>balanceOf</code> and <code>tokenOfOwnerByIndex</code> — standard ERC-721 read functions with zero gas cost.</p>
              </div>
            </div>
            <div class="safety-item bad">
              <span class="si-icon">❌</span>
              <div>
                <strong>We never do this</strong>
                <p>Request token approvals, ask for signatures, initiate transactions, access DeFi protocols, or touch any other contracts.</p>
              </div>
            </div>
          </div>
          <div class="hiw-tip">
            💡 Tip: For maximum safety you can use a view-only wallet like <a href="https://rabby.io" target="_blank">Rabby</a> in watch mode, which cannot sign transactions at all.
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
            <div class="hiw-tip-item">🖱️ <strong>Click fast</strong> on normies to build a combo multiplier — your coins multiply up to 8x!</div>
            <div class="hiw-tip-item">💤 <strong>Check back often</strong> — needs decay while you're away, but NormDorm does offline catchup when you return</div>
            <div class="hiw-tip-item">📶 <strong>Invest in WiFi early</strong> — passive income upgrades compound over time</div>
            <div class="hiw-tip-item">😊 <strong>Happy normies earn more</strong> — keeping all needs above 70 unlocks the "Happy Dorm" achievement and bonus coins</div>
            <div class="hiw-tip-item">🎯 <strong>Traits matter</strong> — your normie's on-chain traits affect their personality and which activities they prefer</div>
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
