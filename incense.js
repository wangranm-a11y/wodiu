/* ==========================================================
   赛博上香 —— 长按点火 + 升烟 + 祝词
   导出 INCENSE.open(item, onComplete)
   ========================================================== */

window.INCENSE = (function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  let currentItem = null;
  let currentSticks = 0;
  let chargeAudio = null;
  let chargeTimer = null;
  let progressTimer = null;
  let smokeInterval = null;
  let onCompleteCb = null;

  function open(item, onComplete) {
    currentItem = item;
    currentSticks = 0;
    onCompleteCb = onComplete;
    const ov = $('#incenseOverlay');
    ov.hidden = false;

    // 默认到第一步
    showStep('pick');
    $('#incenseItem').textContent = item.name || '它';
    $('#incensePromptLine').textContent = window.COPY.pick(window.COPY.incensePrompts);

    // 丢丢举香
    window.DIU.render('#diuIncense1', 'pray', window.COPY.pick(window.COPY.diuLines.incenseDone || ['帮你举着香']));

    // 关闭
    $('#incenseClose').onclick = close;
    $('.incense-mask').onclick = close;

    // 阻止页面滚动
    document.body.style.overflow = 'hidden';
  }

  function close() {
    cleanup();
    $('#incenseOverlay').hidden = true;
    document.body.style.overflow = '';
  }

  function cleanup() {
    if (chargeTimer) { clearTimeout(chargeTimer); chargeTimer = null; }
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
    if (smokeInterval) { clearInterval(smokeInterval); smokeInterval = null; }
    if (chargeAudio?.stop) { try { chargeAudio.stop(); } catch (e) {} chargeAudio = null; }
    if (window.SOUND) window.SOUND.smokeOff();
  }

  function showStep(name) {
    $$('.incense-step').forEach(s => {
      s.hidden = s.dataset.incenseStep !== name;
    });
  }

  // —— 选香柱 ——
  $$('.stick-card').forEach(c => {
    c.addEventListener('click', () => {
      const n = parseInt(c.dataset.sticks, 10);
      currentSticks = n;
      window.SOUND?.play('select');
      window.HAPTIC?.select();
      goToLight(n);
    });
  });

  function goToLight(n) {
    showStep('light');
    // 渲染香柱（未点燃）
    const row = $('#sticksRow');
    row.innerHTML = '';
    const heights = [];
    for (let i = 0; i < n; i++) {
      const h = 70 + Math.random() * 8;
      heights.push(h);
      const s = document.createElement('div');
      s.className = 'stick';
      s.style.height = h + 'px';
      s.style.animationDelay = (i * 60) + 'ms';
      row.appendChild(s);
    }
    // 把 heights 存下，第二阶段复用
    row.dataset.heights = JSON.stringify(heights);

    $('#lightHint').textContent = '长按 3 秒 · 点火上香';

    setupLightBtn();
  }

  // —— 长按点火 ——
  function setupLightBtn() {
    const btn = $('#lightBtn');
    btn.replaceWith(btn.cloneNode(true)); // 清掉旧 listener
    const fresh = $('#lightBtn');

    let pressing = false;
    let startedAt = 0;
    const HOLD_MS = 3000;

    const start = () => {
      if (pressing) return;
      pressing = true;
      startedAt = Date.now();
      fresh.classList.add('charging');
      // 音 + 触感（节奏震）
      window.SOUND?.play('match');
      chargeAudio = window.SOUND?.charge();
      window.HAPTIC?.fire();
      // 中途连续震
      progressTimer = setInterval(() => {
        if (!pressing) return;
        window.HAPTIC?.light();
      }, 350);
      chargeTimer = setTimeout(() => {
        complete();
      }, HOLD_MS);
    };

    const cancel = () => {
      if (!pressing) return;
      const elapsed = Date.now() - startedAt;
      pressing = false;
      fresh.classList.remove('charging');
      if (chargeTimer) clearTimeout(chargeTimer);
      if (progressTimer) clearInterval(progressTimer);
      if (chargeAudio?.stop) { chargeAudio.stop(); chargeAudio = null; }
      if (elapsed < HOLD_MS) {
        // 提示：不够久
        $('#lightHint').textContent = `差了一点点……再长按 3 秒`;
      }
    };

    const complete = () => {
      pressing = false;
      fresh.classList.remove('charging');
      if (progressTimer) clearInterval(progressTimer);
      if (chargeAudio?.stop) { chargeAudio.stop(); chargeAudio = null; }
      window.SOUND?.play('fire');
      window.HAPTIC?.confirm();
      goToBless();
    };

    // 鼠标 + 触摸
    fresh.addEventListener('mousedown', start);
    fresh.addEventListener('mouseup', cancel);
    fresh.addEventListener('mouseleave', cancel);
    fresh.addEventListener('touchstart', e => { e.preventDefault(); start(); }, { passive: false });
    fresh.addEventListener('touchend', e => { e.preventDefault(); cancel(); });
    fresh.addEventListener('touchcancel', cancel);
  }

  // —— 升烟 + 祝词 ——
  function goToBless() {
    showStep('bless');

    // 复制香柱（点燃版）
    const row = $('#sticksRow');
    const litRow = $('#sticksRowLit');
    const heights = JSON.parse(row.dataset.heights || '[]');
    litRow.innerHTML = '';
    heights.forEach((h, i) => {
      const s = document.createElement('div');
      s.className = 'stick lit-stick';
      s.style.height = h + 'px';
      litRow.appendChild(s);
    });

    // 升烟粒子
    const smoke = $('#smokeRow');
    smoke.innerHTML = '';
    spawnSmoke();
    smokeInterval = setInterval(spawnSmoke, 350);

    // 背景磬 + 持续低频
    setTimeout(() => window.SOUND?.play('bowl'), 80);
    setTimeout(() => window.SOUND?.smokeOn(), 600);
    window.HAPTIC?.seal();

    // 祝词
    const blessings = window.COPY.incenseBlessings[currentSticks] || window.COPY.incenseBlessings[1];
    $('#blessText').textContent = window.COPY.pick(blessings);
    $('#blessMeta').textContent = window.COPY.pick(window.COPY.incenseSmokeLines);

    $('#blessDone').onclick = () => {
      window.SOUND?.play('chime');
      cleanup();
      // 触发回调（写库）
      if (onCompleteCb) onCompleteCb({
        sticks: currentSticks,
        at: Date.now(),
      });
      $('#incenseOverlay').hidden = true;
      document.body.style.overflow = '';
      // 礼成 toast
      if (window.TOAST) window.TOAST(window.COPY.pick(window.COPY.incenseClose), 3500);
    };
  }

  function spawnSmoke() {
    const row = $('#smokeRow');
    if (!row) return;
    const n = currentSticks * 2;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'smoke';
      const cx = 50; // 居中
      const offset = (Math.random() - 0.5) * 60;
      s.style.left = `calc(${cx}% + ${offset}px)`;
      const sx = (Math.random() - 0.5) * 40;
      s.style.setProperty('--sx', sx + 'px');
      s.style.animationDelay = (Math.random() * 0.6) + 's';
      s.style.animationDuration = (3.5 + Math.random() * 1.2) + 's';
      row.appendChild(s);
      setTimeout(() => s.remove(), 5000);
    }
  }

  return { open, close };
})();
