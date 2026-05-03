/* ==========================================================
   「我丢」 v2 主程序
   ========================================================== */

(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const C = window.COPY;
  const SND = window.SOUND;
  const HAP = window.HAPTIC;
  const DIU = window.DIU;
  const FC = window.FINDCARD;
  const AI = window.AI;
  const IN = window.INCENSE;

  // ============ 数据层 ============
  const DB_KEY = 'wodiu.db.v2';
  const db = loadDB();

  function loadDB() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
      // 兼容 v1
      const v1 = localStorage.getItem('wodiu.db.v1');
      if (v1) {
        const parsed = JSON.parse(v1);
        return Object.assign({ settings: { sound: true, haptic: true } }, parsed);
      }
    } catch (e) {}
    return { lost: [], notes: [], settings: { sound: true, haptic: true, notify: false } };
  }
  function saveDB() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {}
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function now() { return Date.now(); }
  function fmtTime(ts) {
    const d = new Date(ts);
    const Y = d.getFullYear(), M = d.getMonth() + 1, D = d.getDate();
    const h = String(d.getHours()).padStart(2, '0'), m = String(d.getMinutes()).padStart(2, '0');
    return `${Y}-${M}-${D} ${h}:${m}`;
  }
  function fmtDate(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }
  function relTime(ts) {
    const diff = now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return '刚刚';
    if (m < 60) return `${m} 分钟前`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} 小时前`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d} 天前`;
    return fmtDate(ts);
  }

  // 应用设置
  function applySettings() {
    SND?.set(db.settings.sound !== false);
    HAP?.set(db.settings.haptic !== false);
  }
  applySettings();

  // —— 数据迁移：把旧版 status='incensed' 的记录还原到原始状态 ——
  // 因为之前的 bug：上香会覆盖 'released'/'healed' 等真实状态
  // 现在: status 永远是 released/healed/found/searching；上香单独看 incenseSticks
  (function migrateIncense() {
    let changed = false;
    db.lost.forEach(r => {
      if (r.status === 'incensed') {
        // 推断原状态：有信封/故事 → healed；否则 → released
        r.status = (r.letter || r.storyText || r.epitaph) ? 'healed' : 'released';
        if (!r.incenseSticks) r.incenseSticks = 1;
        changed = true;
      }
    });
    if (changed) saveDB();
  })();

  // ============ Toast / Modal ============
  let toastTimer;
  function toast(msg, ms = 2500) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }
  window.TOAST = toast; // 给 incense.js 用

  function modal(html, actions = []) {
    const m = $('#modal');
    const card = $('#modalCard');
    card.innerHTML = html + (actions.length
      ? `<div class="modal-actions">${actions.map((a, i) =>
          `<button class="${a.primary ? 'btn-primary' : 'btn-ghost'} ${a.danger ? 'danger' : ''}" data-act="${i}">${a.label}</button>`
        ).join('')}</div>`
      : '');
    m.hidden = false;
    return new Promise(resolve => {
      const onClick = e => {
        if (e.target.dataset.close !== undefined || e.target.dataset.act !== undefined) {
          const idx = e.target.dataset.act;
          m.hidden = true;
          card.removeEventListener('click', onClick);
          $('.modal-mask').removeEventListener('click', onClick);
          if (idx !== undefined && actions[idx]?.onClick) actions[idx].onClick();
          resolve(idx !== undefined ? Number(idx) : null);
        }
      };
      card.addEventListener('click', onClick);
      $('.modal-mask').addEventListener('click', onClick);
    });
  }

  // ============ Tab 切换（v7: 4-tab） ============
  function switchTab(tab) {
    SND?.play('whoosh');
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    $$('.page').forEach(p => p.classList.toggle('active', p.id === `page-${tab}`));
    if (tab === 'lost') showLostView('lost-hero');
    if (tab === 'stillhere') renderStillhere();
    if (tab === 'museum') renderMuseum();
    if (tab === 'me') renderMe();
  }
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    HAP?.light();
    switchTab(t.dataset.tab);
  }));

  // ============ 首屏 hero 入口按钮 ============
  $('#enterLost')?.addEventListener('click', () => {
    SND?.play('select'); HAP?.confirm();
    showLostView('lost-step0');
    setTimeout(() => $('#lostInput')?.focus(), 200);
  });
  $('#enterNote')?.addEventListener('click', () => {
    SND?.play('select'); HAP?.confirm();
    switchTab('stillhere');
    setTimeout(() => $('#noteInput')?.focus(), 200);
  });

  // ============ 顶部时钟 ============
  function tickClock() {
    const el = $('#topClock'); if (!el) return;
    const d = new Date();
    el.textContent = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  }
  tickClock();
  setInterval(tickClock, 1000);

  // ============ 首屏 hero 电影动画（PRD v6 2.2） ============
  // 0-1.5s 背对 → 耳朵抖 → 转头 → 舔屏 → 正面说话 → 出按钮
  let heroPlayedThisSession = false;
  function playHeroIntro() {
    const heroEl = $('#diuHero');
    const bubble = $('#heroBubble');
    const actions = $('#heroActions');
    if (!heroEl) return;
    actions.hidden = true;
    bubble.hidden = true;

    DIU.intro(heroEl, () => {
      // 出台词气泡 + 入口按钮
      bubble.textContent = C.pick(C.diuLines.enter || ['你来啦']);
      bubble.hidden = false;
      SND?.play('chime');
      setTimeout(() => {
        actions.hidden = false;
      }, 300);
    });

    // 1.7s 时播放轻舔音
    setTimeout(() => SND?.play('drop'), 3400);
  }

  // 主页 idle ambient（hero 之后，丢丢自言自语）
  let homeMutterTimer = null;
  function startHomeIdle() {
    if (homeMutterTimer) clearTimeout(homeMutterTimer);
    function scheduleMutter() {
      const delay = 25000 + Math.random() * 35000;
      homeMutterTimer = setTimeout(() => {
        if ($('#page-lost').classList.contains('active') && $('#lost-hero').classList.contains('active')) {
          const bubble = $('#heroBubble');
          if (bubble) {
            bubble.textContent = C.pick(C.diuMutter || ['…']);
            bubble.hidden = false;
            // 也偶尔切换姿态
            if (Math.random() < 0.3) {
              const poses = ['blink', 'curious', 'sleep'];
              DIU.render('#diuHero', C.pick(poses), '', 'normal', 240);
              setTimeout(() => DIU.render('#diuHero', 'front', '', 'normal', 240), 1800);
            }
          }
        }
        scheduleMutter();
      }, delay);
    }
    scheduleMutter();
  }

  // 用户在 step0 输入时，丢丢醒过来
  $('#lostInput')?.addEventListener('focus', () => {
    DIU.render('#diu0', 'curious', C.pick(C.diuLines.enter));
  });

  // 启动首屏 intro
  if (!heroPlayedThisSession) {
    heroPlayedThisSession = true;
    setTimeout(() => {
      playHeroIntro();
      startHomeIdle();
    }, 200);
  }

  // 顶部案件抬头数据
  function refreshLostDeco() {
    // 案号：用今天的日期 + 当日序号
    const d = new Date();
    const today0 = new Date(d); today0.setHours(0,0,0,0);
    const todayCount = db.lost.filter(r => r.createdAt >= today0.getTime()).length;
    const caseNo = $('#caseNo');
    if (caseNo) {
      const ymd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      caseNo.textContent = `#${ymd}-${String(todayCount + 1).padStart(3,'0')}`;
    }
    const total = $('#caseTotal');
    if (total) total.textContent = `${db.lost.length} 件`;
    // 兼容旧 IDs
    const tag = $('#todayTag');
    if (tag) tag.textContent = `第 ${todayCount + 1} 件 / 今天`;
    const big = $('#bigStatNum');
    if (big) big.textContent = String(db.lost.length);
  }
  refreshLostDeco();

  // 第一次用户交互后初始化音频上下文（浏览器策略）
  // 音乐默认开启（除非用户手动关过），首次点击屏幕时自动启动
  document.addEventListener('pointerdown', () => {
    SND?.init();
    if (db.settings.music !== false && window.MUSIC && !window.MUSIC.isPlaying()) {
      const v = volMap(db.settings.musicVolume ?? 60);
      const t = db.settings.musicTheme || 'warm';
      window.MUSIC.start(v, t);
    }
  }, { once: true });

  // ============ 「丢了」流程 ============
  const lostState = {
    name: '', weight: 0, intent: '',
    place: '', desc: '', contact: '',
    photo: '',
    letter: '',
    storyKws: [], storyText: '', storyTail: '', storyImg: '',
    healStep: 1,
    currentId: null,
  };
  function resetLostState() {
    Object.assign(lostState, {
      name: '', weight: 0, intent: '',
      place: '', desc: '', contact: '',
      photo: '', letter: '',
      storyKws: [], storyText: '', storyTail: '', storyImg: '',
      healStep: 1, currentId: null,
    });
  }

  function showLostView(viewId) {
    $$('#page-lost > .view').forEach(v => v.classList.toggle('active', v.id === viewId));
    if (viewId === 'lost-hero') {
      // 回到 hero，恢复入口按钮
      const actions = $('#heroActions');
      if (actions) actions.hidden = false;
    }
    if (viewId === 'lost-step0') {
      resetLostState();
      $('#lostInput').value = '';
      $('#lostNext0').disabled = true;
      $('#step1Sub').textContent = C.pick(C.step1Subs);
      $$('.weight-card').forEach(b => b.classList.remove('selected'));
      $('#lostNext1').disabled = true;
      DIU.render('#diu0', 'curious', '', 'normal', 90);
      if (typeof refreshLostDeco === 'function') refreshLostDeco();
    }
  }

  // Step 0: 输入
  $('#lostInput').addEventListener('input', e => {
    const v = e.target.value.trim();
    $('#lostNext0').disabled = !v;
    lostState.name = v;
  });
  $('#lostNext0').addEventListener('click', () => {
    SND?.play('select');
    HAP?.confirm();
    showLostView('lost-step1');
  });

  // 语音输入
  $('#btnVoice').addEventListener('click', () => {
    HAP?.light();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('当前浏览器不支持语音 · 用打字也很好'); return; }
    const r = new SR();
    r.lang = 'zh-CN'; r.interimResults = false; r.maxAlternatives = 1;
    toast('在听了…', 1200);
    r.onresult = e => {
      const t = e.results[0][0].transcript.replace(/[。.，,！!？?\s]+$/, '');
      const inp = $('#lostInput');
      inp.value = t; lostState.name = t;
      $('#lostNext0').disabled = !t;
      SND?.play('drop');
    };
    r.onerror = () => toast('没听清，再说一次试试');
    r.start();
  });

  // Step 1: 重要度三档
  $$('.weight-card').forEach(b => {
    b.addEventListener('click', () => {
      $$('.weight-card').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      lostState.weight = Number(b.dataset.weight);
      $('#lostNext1').disabled = false;
      SND?.play('select');
      HAP?.select();
    });
  });
  $('#lostNext1').addEventListener('click', () => {
    SND?.play('select'); HAP?.confirm();
    showLostView('lost-step2');
  });

  // 通用「← 改一下」
  $$('[data-back]').forEach(b => {
    b.addEventListener('click', () => {
      SND?.play('whoosh'); HAP?.light();
      showLostView(b.dataset.back);
    });
  });

  // Step 2: 意愿
  $$('.choice-card').forEach(c => {
    c.addEventListener('click', () => {
      lostState.intent = c.dataset.intent;
      SND?.play('select'); HAP?.confirm();
      routeAfterStep2();
    });
  });

  function routeAfterStep2() {
    const w = lostState.weight, i = lostState.intent;
    if (w === 3 && i === 'release') {
      $('#bridgeLine').textContent = C.pick(C.heavyBridge);
      DIU.render('#diuHeavy', 'sad', C.pick(C.diuLines.heavy), 'sad');
      showLostView('path-heavy-bridge');
      return;
    }
    if (i === 'search') {
      // PRD v6: 选「还想找」后，先问「记得位置吗」
      showLostView('path-search-fork');
      return;
    }
    const id = createLostRecord('released');
    lostState.currentId = id;
    $('#releaseLineLight').textContent = C.releaseFor(w);
    DIU.render('#diuRelease', 'happy', C.pick(C.diuLines.flip), 'happy');
    showLostView('path-light-release');
    SND?.play('chime');
    HAP?.success();
  }

  // 寻物路径分叉
  $$('[data-fork]').forEach(b => {
    b.addEventListener('click', () => {
      SND?.play('select'); HAP?.confirm();
      const fork = b.dataset.fork;
      const id = createLostRecord('searching');
      lostState.currentId = id;
      if (fork === 'known') {
        enterSearchView();
      } else {
        // 极轻量路径
        showLostView('path-search-light');
      }
    });
  });

  // 极轻量路径：保存
  $('#searchLightSave')?.addEventListener('click', () => {
    if (!lostState.currentId) return;
    const remind = $('#inReminder')?.value || '';
    const ms = computeReminderMs(remind);
    updateLost(lostState.currentId, {
      remindAt: ms ? now() + ms : null,
      noLocation: true,
    });
    if (ms) scheduleReminder('search', lostState.currentId, ms);
    SND?.play('chime'); HAP?.success();
    toast('放在「还在」里了。慢慢等。', 2500);
    setTimeout(() => switchTab('stillhere'), 1200);
  });

  function computeReminderMs(when) {
    if (!when) return 0;
    if (when === '1h') return 60 * 60 * 1000;
    if (when === 'evening') {
      const t = new Date(); t.setHours(20, 0, 0, 0);
      return Math.max(t.getTime() - now(), 60 * 60 * 1000);
    }
    if (when === 'tomorrow') {
      const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(9, 0, 0, 0);
      return t.getTime() - now();
    }
    if (when === 'custom') {
      const v = $('#inReminderCustom')?.value;
      if (!v) return 0;
      const t = new Date(v).getTime();
      if (isNaN(t)) return 0;
      return Math.max(t - now(), 60 * 1000);
    }
    return 0;
  }

  function createLostRecord(status) {
    const rec = {
      id: uid(),
      name: lostState.name || '未命名',
      weight: lostState.weight,
      intent: lostState.intent,
      status,
      place: '', desc: '', contact: '',
      photo: '', letter: '',
      storyKws: [], storyText: '', storyTail: '', storyImg: '',
      incenseSticks: 0,
      createdAt: now(),
      updatedAt: now(),
      remindAt: null,
    };
    db.lost.unshift(rec);
    saveDB();
    return rec.id;
  }
  function findLost(id) { return db.lost.find(r => r.id === id); }
  function updateLost(id, patch) {
    const r = findLost(id);
    if (!r) return;
    Object.assign(r, patch, { updatedAt: now() });
    saveDB();
  }

  // 翻篇按钮
  $('#lightDone').addEventListener('click', () => {
    const card = $('#path-light-release .result-card');
    card.classList.add('float-away');
    SND?.play('whoosh');
    HAP?.success();
    setTimeout(async () => {
      card.classList.remove('float-away');
      // 给所有翻篇的物件一个上香机会（PRD 3.2）
      await offerIncenseOrSkip();
    }, 800);
  });

  // —— 通用：在任何"翻篇"之后浮一个"要不要给它上柱香"的轻提示 ——
  async function offerIncenseOrSkip() {
    const item = lostState.currentId ? findLost(lostState.currentId) : null;
    const itemName = item?.name || lostState.name || '它';
    const yes = await modal(
      `<h3>要给「${escapeHTML(itemName)}」上一柱香吗？</h3>
       <p>30 秒的小仪式，给它一个温柔的告别。<br>不上也没关系。</p>`,
      [
        { label: '不了，去星图' },
        { label: '🕯 给它上一柱', primary: true },
      ]
    );
    if (yes === 1 && item) {
      IN.open(item, ({ sticks, at }) => {
        // 上香不再覆盖原状态。原状态（released/healed/found）保留，
        // 只追加 incenseSticks 累计 + incenseAt 最近时间 + incenseHistory 历次记录
        const r = findLost(item.id) || {};
        const history = Array.isArray(r.incenseHistory) ? r.incenseHistory.slice() : [];
        history.push({ sticks, at });
        updateLost(item.id, {
          incenseSticks: (r.incenseSticks || 0) + sticks,
          incenseAt: at,
          incenseHistory: history,
        });
        switchTab('museum');
      });
    } else if (yes === 1 && !item) {
      // 没有 record（极少见），随便造一个临时对象
      IN.open({ name: itemName }, () => switchTab('museum'));
    } else {
      toast(C.pick(C.noBlame), 3000);
      switchTab('museum');
    }
  }

  // ============ 寻物卡 ============
  function enterSearchView() {
    showLostView('path-search');
    // 默认到「填表」阶段
    showSearchPhase('form');
    $('#inName').value = lostState.name;
    $('#inPlace').value = '';
    $('#inDesc').value = '';
    $('#inContact').value = '';
    // 清照片
    lostState.findPhoto = '';
    if ($('#inPhoto')) $('#inPhoto').value = '';
    if ($('#photoUploadEmpty')) $('#photoUploadEmpty').hidden = false;
    if ($('#photoUploadPreview')) $('#photoUploadPreview').hidden = true;
    setTimeout(() => $('#inPlace')?.focus(), 200);
  }

  function showSearchPhase(phase) {
    $('#searchPhaseForm').hidden = phase !== 'form';
    $('#searchPhaseCard').hidden = phase !== 'card';
    if (phase === 'card') {
      // 切到卡片阶段时才初始化 canvas + 渲染（async）
      setTimeout(async () => {
        FC.init();
        await renderFindCard();
      }, 50);
    }
  }

  async function renderFindCard() {
    await FC.render({
      name: lostState.name,
      place: $('#inPlace')?.value.trim(),
      desc: $('#inDesc')?.value.trim(),
      contact: $('#inContact')?.value.trim(),
      photo: lostState.findPhoto || '',
      createdAt: now(),
    });
  }

  // 寻物卡可选照片：上传 / 预览 / 移除
  $('#inPhoto')?.addEventListener('change', e => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast('图片太大，建议小于 8MB');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      lostState.findPhoto = ev.target.result;
      $('#photoPreviewImg').src = ev.target.result;
      $('#photoUploadEmpty').hidden = true;
      $('#photoUploadPreview').hidden = false;
      SND?.play('drop'); HAP?.light();
    };
    reader.readAsDataURL(f);
  });
  $('#photoRemove')?.addEventListener('click', e => {
    e.stopPropagation();
    e.preventDefault();
    lostState.findPhoto = '';
    $('#inPhoto').value = '';
    $('#photoUploadEmpty').hidden = false;
    $('#photoUploadPreview').hidden = true;
    HAP?.light();
  });

  // 自定义提醒时间显隐
  $('#inReminder')?.addEventListener('change', e => {
    const isCustom = e.target.value === 'custom';
    const row = $('#customReminderRow');
    if (row) row.hidden = !isCustom;
    if (isCustom) {
      // 给个合理默认值：1 小时后
      const dt = new Date(Date.now() + 60 * 60 * 1000);
      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
      const inp = $('#inReminderCustom');
      if (inp && !inp.value) inp.value = local;
    }
  });

  // 「生成寻物卡」按钮
  $('#genFindCard').addEventListener('click', () => {
    SND?.play('select'); HAP?.confirm();
    // 同步当前数据到记录
    if (lostState.currentId) {
      updateLost(lostState.currentId, {
        place: $('#inPlace').value.trim(),
        desc: $('#inDesc').value.trim(),
        contact: $('#inContact').value.trim(),
        when: $('#inWhen')?.value || 'today',
        photo: lostState.findPhoto || '',
      });
    }
    showSearchPhase('card');
    SND?.play('chime');
  });

  // 「← 改信息」回到表
  $('#cardEdit').addEventListener('click', () => {
    SND?.play('whoosh'); HAP?.light();
    showSearchPhase('form');
  });

  $('#cardSave').addEventListener('click', async () => {
    SND?.play('drop'); HAP?.light();
    const ok = await FC.save(`寻物-${lostState.name || ''}-${Date.now()}.png`);
    if (ok) { SND?.play('chime'); HAP?.confirm(); toast('已下载到本地。', 2000); }
  });

  $('#cardShare').addEventListener('click', async () => {
    HAP?.light();
    const r = await FC.share(lostState.name);
    if (r.ok) { SND?.play('chime'); HAP?.confirm(); }
    else if (r.reason === 'cancel') { /* 用户取消，不打扰 */ }
    else if (r.reason === 'unsupported') {
      toast('当前浏览器不支持系统分享 · 试试保存图片再发出去', 3000);
    } else {
      toast('分享失败，先保存到本地试试', 2500);
    }
  });

  $('#searchSave').addEventListener('click', () => {
    if (!lostState.currentId) return;
    updateLost(lostState.currentId, {
      place: $('#inPlace').value.trim(),
      desc: $('#inDesc').value.trim(),
      contact: $('#inContact').value.trim(),
      remindAt: now() + 3 * 24 * 60 * 60 * 1000,
    });
    scheduleReminder('search', lostState.currentId, 3 * 24 * 60 * 60 * 1000);
    SND?.play('chime');
    HAP?.success();
    toast(C.pick(C.searchEncourage), 3000);
    setTimeout(() => switchTab('museum'), 1200);
  });

  $('#searchToRelease').addEventListener('click', async () => {
    HAP?.light();
    await modal(
      `<h3>不想等了？</h3><p style="color:var(--ink-soft);font-size:14px;line-height:1.6">那我把它放进博物馆，按"翻篇"处理。也可以选择陪它走一段（疗愈）。</p>`,
      [
        { label: '取消' },
        { label: '直接翻篇', onClick: async () => {
          if (lostState.currentId) updateLost(lostState.currentId, { status: 'released' });
          SND?.play('whoosh'); HAP?.success();
          await offerIncenseOrSkip();
        }},
        { label: '陪它走一段', primary: true, onClick: () => {
          $('#bridgeLine').textContent = C.pick(C.heavyBridge);
          DIU.render('#diuHeavy', 'sad', C.pick(C.diuLines.heavy), 'sad');
          showLostView('path-heavy-bridge');
        }}
      ]
    );
  });

  // ============ 重丢过渡 ============
  $('#heavySkip').addEventListener('click', async () => {
    HAP?.light();
    if (!lostState.currentId) lostState.currentId = createLostRecord('released');
    else updateLost(lostState.currentId, { status: 'released' });
    await offerIncenseOrSkip();
  });

  $('#heavyEnter').addEventListener('click', () => {
    SND?.play('select'); HAP?.confirm();
    if (!lostState.currentId) lostState.currentId = createLostRecord('released');
    enterHealFlow();
  });

  // ============ 疗愈流程 ============
  function enterHealFlow() {
    showLostView('heal-flow');
    lostState.healStep = 1;
    setHealStep(1);
    $('#letterHook').textContent = C.pick(C.letterHooks);
    initStoryStep();
  }

  function setHealStep(n) {
    SND?.play('whoosh');
    HAP?.light();
    lostState.healStep = n;
    $$('#heal-flow .heal-step').forEach(s => {
      s.classList.toggle('active', Number(s.dataset.step) === n);
    });
    $$('#heal-flow .heal-progress .dot').forEach((d, i) => {
      d.classList.toggle('active', i + 1 === n);
      d.classList.toggle('done', i + 1 < n);
    });
    if (n === 2) renderShadowPoem();
    if (n === 5) renderSeal();
    if (n === 6) renderHealCard();
  }

  $$('.heal-next').forEach(b => {
    b.addEventListener('click', () => {
      const cur = lostState.healStep;
      if (cur === 3) {
        // 收下墓志铭三件套
        lostState.epitaph = $('#letterText')?.value || '';
        lostState.lostWhen = $('#lostWhenInput')?.value || '';
        lostState.lostWhere = $('#lostWhereInput')?.value || '';
      }
      if (cur < 6) setHealStep(cur + 1);
    });
  });
  $$('.heal-skip').forEach(b => {
    b.addEventListener('click', () => {
      if (lostState.healStep < 6) setHealStep(lostState.healStep + 1);
    });
  });

  // step1: 上传照片
  $('#healPhoto').addEventListener('change', e => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      lostState.photo = ev.target.result;
      const img = $('#uploadPreview');
      img.src = ev.target.result; img.hidden = false;
      $('#uploadHint').hidden = true;
      SND?.play('drop'); HAP?.light();
    };
    reader.readAsDataURL(f);
  });

  // step2: 影子诗
  function renderShadowPoem() {
    $('#shadowPoem').textContent = C.pick(C.shadowPoems);
  }

  // step4: 编故事（升级版）
  function initStoryStep() {
    lostState.storyKws = [];
    $('#kwInput').value = '';
    $('#kwChips').innerHTML = '';
    $('#storyResult').hidden = true;
    $('#storyLoading').hidden = true;
    $('#storyGen').disabled = true;
    renderKwSuggest();
  }

  function renderKwSuggest() {
    const list = $('#kwSuggest');
    list.innerHTML = '';
    C.pickN(C.storyKeywords, 14).forEach(kw => {
      const btn = document.createElement('button');
      btn.className = 'kw-sg';
      btn.textContent = kw;
      btn.addEventListener('click', () => {
        addKw(kw);
        btn.classList.add('used');
      });
      list.appendChild(btn);
    });
  }

  function addKw(text) {
    const t = (text || '').trim();
    if (!t) return;
    if (lostState.storyKws.includes(t)) return;
    if (lostState.storyKws.length >= 6) {
      toast('六个差不多了，多了反而难写。', 2000);
      return;
    }
    lostState.storyKws.push(t);
    SND?.play('pop'); HAP?.select();
    renderChips();
    $('#kwInput').value = '';
    $('#storyGen').disabled = lostState.storyKws.length === 0;
  }

  function renderChips() {
    const wrap = $('#kwChips');
    wrap.innerHTML = '';
    lostState.storyKws.forEach((kw, i) => {
      const chip = document.createElement('span');
      chip.className = 'kw-chip';
      chip.innerHTML = `${kw}<span class="kw-x" data-i="${i}">×</span>`;
      chip.querySelector('.kw-x').addEventListener('click', () => {
        lostState.storyKws.splice(i, 1);
        renderChips();
        $('#storyGen').disabled = lostState.storyKws.length === 0;
        SND?.play('swish'); HAP?.light();
        // 灵感词重新可点
        $$('#kwSuggest .kw-sg').forEach(b => {
          if (b.textContent === kw) b.classList.remove('used');
        });
      });
      wrap.appendChild(chip);
    });
  }

  $('#kwAdd').addEventListener('click', () => addKw($('#kwInput').value));
  $('#kwInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') { e.preventDefault(); addKw(e.target.value); }
  });

  $('#storyGen').addEventListener('click', () => generateStory());
  $('#storyRegen')?.addEventListener('click', () => generateStory());

  async function generateStory() {
    SND?.play('select'); HAP?.confirm();
    $('#storyResult').hidden = true;
    $('#storyLoading').hidden = false;

    // 并行调 AI（文本 + 图）
    const [storyR, imgR] = await Promise.all([
      AI.story(lostState.name, lostState.storyKws),
      AI.illustration(lostState.name, lostState.storyKws),
    ]);

    lostState.storyText = storyR.text;
    lostState.storyImg = imgR.url;

    $('#storyText').textContent = storyR.text;
    $('#storyImg').src = imgR.url;
    $('#storyImgFallback').hidden = imgR.source !== 'fallback'; // 占位文案

    $('#storyLoading').hidden = true;
    $('#storyResult').hidden = false;
    SND?.play('chime'); HAP?.success();
  }

  // step5: 封存
  function renderSeal() {
    $('#sealLine').textContent = C.pick(C.sealLines);
    $('#noBlame').textContent = C.pick(C.noBlame);
    DIU.render('#diuSeal', 'happy', C.pick(C.diuLines.healed), 'happy');
    spawnSealParticles();
    SND?.play('bowl');
    HAP?.seal();

    if (lostState.currentId) {
      updateLost(lostState.currentId, {
        status: 'healed',
        photo: lostState.photo,
        epitaph: lostState.epitaph || '',  // 墓志铭
        letter: lostState.epitaph || '',    // 兼容旧字段名
        lostWhen: lostState.lostWhen || '',
        lostWhere: lostState.lostWhere || '',
        sealedAt: now(),
        storyKws: lostState.storyKws,
        storyText: lostState.storyText,
        storyTail: $('#storyTail')?.value || '',
        storyImg: lostState.storyImg,
      });
    }
  }

  // step6: 渲染纪念分享卡
  async function renderHealCard() {
    if (!window.HEALCARD) return;
    HEALCARD.init();
    const r = lostState.currentId ? findLost(lostState.currentId) : null;
    await HEALCARD.render({
      name: r?.name || lostState.name,
      epitaph: lostState.epitaph || r?.epitaph || '',
      lostWhen: lostState.lostWhen || r?.lostWhen || '',
      lostWhere: lostState.lostWhere || r?.lostWhere || '',
      sealedAt: r?.sealedAt || now(),
    });
    SND?.play('chime');
  }

  $('#healSave')?.addEventListener('click', async () => {
    SND?.play('drop'); HAP?.light();
    const ok = await HEALCARD.save(`memorial-${lostState.name || ''}-${Date.now()}.png`);
    if (ok) { SND?.play('chime'); HAP?.confirm(); toast('已下载到本地。', 2000); }
  });
  $('#healShare')?.addEventListener('click', async () => {
    HAP?.light();
    const r = await HEALCARD.share(lostState.name);
    if (r.ok) { SND?.play('chime'); HAP?.confirm(); }
    else if (r.reason === 'unsupported') {
      toast('当前浏览器不支持系统分享 · 试试保存图片再发出去', 3000);
    }
  });
  $('#healFinish')?.addEventListener('click', () => {
    SND?.play('chime'); HAP?.confirm();
    switchTab('museum');
  });

  function spawnSealParticles() {
    const wrap = $('#heal-flow .seal-particles');
    if (!wrap) return;
    wrap.innerHTML = '';
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span');
      s.style.left = (10 + Math.random() * 80) + '%';
      s.style.bottom = '50%';
      s.style.animationDelay = (Math.random() * 2.5) + 's';
      s.style.animationDuration = (2.4 + Math.random() * 1.6) + 's';
      s.style.background = ['#b8b3d6', '#d9e0ec', '#f0d9c4'][i % 3];
      wrap.appendChild(s);
    }
  }

  $('#sealDone').addEventListener('click', () => {
    SND?.play('chime'); HAP?.confirm();
    switchTab('museum');
  });
  $('#sealIncense').addEventListener('click', () => {
    HAP?.light();
    const item = findLost(lostState.currentId);
    if (!item) return;
    IN.open(item, ({ sticks, at }) => {
      // 上香不再覆盖原状态。原状态（released/healed/found）保留，
        // 只追加 incenseSticks 累计 + incenseAt 最近时间 + incenseHistory 历次记录
        const r = findLost(item.id) || {};
        const history = Array.isArray(r.incenseHistory) ? r.incenseHistory.slice() : [];
        history.push({ sticks, at });
        updateLost(item.id, {
          incenseSticks: (r.incenseSticks || 0) + sticks,
          incenseAt: at,
          incenseHistory: history,
        });
      switchTab('museum');
    });
  });

  // ============ 「先记着」 ============
  $('#noteAdd').addEventListener('click', () => {
    const txt = $('#noteInput').value.trim();
    if (!txt) { toast('写两个字再记吧'); HAP?.error(); return; }
    const when = $('#noteWhen').value;
    const note = {
      id: uid(),
      text: txt,
      createdAt: now(),
      done: false,
      remindAt: computeRemindAt(when),
    };
    db.notes.unshift(note);
    saveDB();
    if (note.remindAt) scheduleReminder('note', note.id, note.remindAt - now());
    $('#noteInput').value = '';
    $('#noteWhen').value = '';
    SND?.play('drop'); HAP?.confirm();
    renderNotes();
    toast('记下了。', 1500);
  });

  function computeRemindAt(when) {
    if (!when) return null;
    const t = new Date();
    if (when === '2h') return now() + 2 * 60 * 60 * 1000;
    if (when === 'tonight') {
      t.setHours(20, 0, 0, 0);
      if (t.getTime() <= now()) t.setDate(t.getDate() + 1);
      return t.getTime();
    }
    if (when === 'tomorrow') {
      t.setDate(t.getDate() + 1);
      t.setHours(8, 30, 0, 0);
      return t.getTime();
    }
    return null;
  }

  // ============ 「还在」Tab：合并先记着 + 寻找中 ============
  let stillhereFilter = 'all';
  $$('[data-stillhere-filter]').forEach(b => {
    b.addEventListener('click', () => {
      $$('[data-stillhere-filter]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      stillhereFilter = b.dataset.stillhereFilter;
      SND?.play('pop'); HAP?.light();
      renderStillhere();
    });
  });

  function renderStillhere() {
    const list = $('#stillhereList');
    if (!list) return;
    // 合并 notes + searching items
    const notes = db.notes.map(n => ({
      kind: 'note',
      id: n.id,
      text: n.text,
      createdAt: n.createdAt,
      remindAt: n.remindAt,
      done: n.done,
      _src: n,
    }));
    const searching = db.lost.filter(r => r.status === 'searching').map(r => ({
      kind: 'searching',
      id: r.id,
      text: r.name + (r.place ? ` · ${r.place}` : ''),
      createdAt: r.createdAt,
      remindAt: r.remindAt,
      noLocation: r.noLocation,
      _src: r,
    }));

    let items = [...notes, ...searching];
    if (stillhereFilter === 'note') items = items.filter(x => x.kind === 'note');
    else if (stillhereFilter === 'searching') items = items.filter(x => x.kind === 'searching');
    items.sort((a, b) => b.createdAt - a.createdAt);

    if (!items.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-ghost">◐</div><p>这里还空着。<br>这是好事。</p></div>`;
      return;
    }

    list.innerHTML = items.map(it => {
      const tagIcon = it.kind === 'note' ? '🗒' : '🔍';
      const tagText = it.kind === 'note' ? '先记着' : (it.noLocation ? '无线索' : '寻找中');
      const remind = it.remindAt ? ` · ${fmtTime(it.remindAt)} 提醒` : '';
      return `
        <div class="sh-item ${it.kind} ${it.done ? 'done' : ''}" data-id="${it.id}" data-kind="${it.kind}">
          <div class="sh-tag">${tagIcon}</div>
          <div class="sh-body">
            <div class="sh-text">${escapeHTML(it.text)}</div>
            <div class="sh-meta">
              <span class="sh-status">${tagText}</span>
              <span>${relTime(it.createdAt)}${remind}</span>
            </div>
          </div>
          <button class="sh-check" data-toggle aria-label="完成">✓</button>
          <button class="sh-del" data-del aria-label="删除">×</button>
        </div>
      `;
    }).join('');

    $$('#stillhereList .sh-item').forEach(item => {
      const id = item.dataset.id, kind = item.dataset.kind;
      item.querySelector('[data-toggle]').addEventListener('click', e => {
        e.stopPropagation();
        if (kind === 'note') toggleNote(id, item);
        else markFound(id);
      });
      item.querySelector('[data-del]').addEventListener('click', e => {
        e.stopPropagation();
        if (kind === 'note') deleteNote(id);
        else releaseSearchItem(id);
      });
    });

    check24hNotes();
  }

  function markFound(id) {
    updateLost(id, { status: 'found', foundAt: now() });
    SND?.play('found'); HAP?.success();
    toast(C.pick(C.foundLines), 2500);
    setTimeout(renderStillhere, 200);
  }
  function releaseSearchItem(id) {
    SND?.play('whoosh'); HAP?.light();
    updateLost(id, { status: 'released' });
    renderStillhere();
    toast('让它走了。', 1500);
  }

  // 兼容旧名
  function renderNotes() { renderStillhere(); }
  function toggleNote(id, item) {
    const n = db.notes.find(x => x.id === id);
    if (!n) return;
    if (!n.done) {
      n.done = true; saveDB();
      item.classList.add('done');
      SND?.play('chime'); HAP?.success();
      toast(C.pick(C.noteRetrieved), 2200);
      setTimeout(() => {
        item.classList.add('removing');
        setTimeout(() => { db.notes = db.notes.filter(x => x.id !== id); saveDB(); renderNotes(); }, 350);
      }, 1500);
    } else {
      n.done = false; saveDB(); renderNotes();
    }
  }
  function deleteNote(id) {
    SND?.play('swish'); HAP?.light();
    db.notes = db.notes.filter(n => n.id !== id);
    saveDB(); renderNotes();
  }

  function check24hNotes() {
    const candidate = db.notes.find(n => !n.done && !n._asked24 && (now() - n.createdAt > 24 * 60 * 60 * 1000));
    if (!candidate) return;
    candidate._asked24 = true; saveDB();
    setTimeout(async () => {
      await modal(
        `<h3>${C.pick(C.note24h)}</h3><p style="color:var(--ink-soft);font-size:14px;">${escapeHTML(candidate.text)}</p>`,
        [
          { label: '在' },
          { label: '找不到了', primary: true, onClick: () => {
            db.notes = db.notes.filter(x => x.id !== candidate.id); saveDB();
            renderNotes();
            switchTab('lost');
            $('#lostInput').value = candidate.text;
            $('#lostInput').dispatchEvent(new Event('input'));
            toast('帮你带过来了。', 2000);
          }}
        ]
      );
    }, 600);
  }

  // ============ 星图 ============
  let museumFilter = 'all';
  $$('#page-museum .chip').forEach(c => {
    c.addEventListener('click', () => {
      $$('#page-museum .chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      museumFilter = c.dataset.filter;
      SND?.play('pop'); HAP?.light();
      renderMuseum();
    });
  });

  // 视图切换：星空 / 时间轴
  let museumView = 'starfield';
  $$('.view-btn').forEach(b => {
    b.addEventListener('click', () => {
      $$('.view-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      museumView = b.dataset.view;
      SND?.play('pop'); HAP?.light();
      renderMuseum();
    });
  });

  function renderMuseum() {
    $('#museumQuote').textContent = C.pick(C.starmapQuotes || C.museumQuotes || []);
    // PRD v6: 星图只收已结果记录，过滤掉 searching
    let items = db.lost.filter(r => r.status !== 'searching');
    if (museumFilter === 'found') items = items.filter(r => r.status === 'found');
    else if (museumFilter === 'released') items = items.filter(r => r.status === 'released');
    else if (museumFilter === 'healed') items = items.filter(r => r.status === 'healed');
    else if (museumFilter === 'incensed') items = items.filter(r => (r.incenseSticks || 0) > 0);

    // 视图切换显示
    $('#starmapFrame').hidden = museumView !== 'starfield';
    $('#timelineFrame').hidden = museumView !== 'timeline';

    if (museumView === 'starfield') {
      // 星空
      const frame = $('#starmapFrame');
      if (window.STARMAP && frame) {
        window.STARMAP.render(frame, items, (id) => {
          SND?.play('pop'); HAP?.light();
          openMuseumItem(id);
        });
      }
      if ($('#diuStarmap')) {
        const poses = ['sleep', 'front', 'curious'];
        DIU.render('#diuStarmap', C.pick(poses),
          Math.random() < 0.3 ? C.pick(C.diuLines.starmap) : '', 'normal', 80);
      }
    } else {
      // 时间轴
      renderTimeline(items);
    }

    // 星图固定 tagline（取代随机彩蛋）
    const empathy = $('#dataEmpathy');
    if (empathy) {
      empathy.textContent = C.starmapTagline || '每一件丢失的物品，都是一颗星星。';
      empathy.hidden = false;
    }

    // 上香榜单
    renderIncenseBoard();
  }

  // —— 上香榜单：累计柱数排序 ——
  function renderIncenseBoard() {
    const board = $('#incenseBoard');
    const list = $('#incenseBoardList');
    if (!board || !list) return;

    const incensed = db.lost
      .filter(r => (r.incenseSticks || 0) > 0)
      .sort((a, b) => (b.incenseSticks || 0) - (a.incenseSticks || 0)
                    || (b.incenseAt || 0) - (a.incenseAt || 0));

    if (!incensed.length) {
      board.hidden = true;
      return;
    }
    board.hidden = false;

    list.innerHTML = incensed.slice(0, 20).map((r, i) => {
      const rank = i + 1;
      const rankCls = rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : '';
      const icon = window.ITEMICON ? window.ITEMICON.svg(r.name) : '✦';
      const sticks = r.incenseSticks || 0;
      const lastTs = r.incenseAt ? relTime(r.incenseAt) : '';
      const times = (r.incenseHistory || []).length || 1;
      const meta = `上过 ${times} 次 · ${lastTs}`;
      return `
        <div class="ib-item" data-id="${r.id}">
          <div class="ib-rank ${rankCls}">${rank}</div>
          <div class="ib-icon">${icon}</div>
          <div class="ib-body">
            <div class="ib-name">${escapeHTML(r.name)}</div>
            <div class="ib-meta">${meta}</div>
          </div>
          <div class="ib-sticks">
            <span class="ib-sticks-num">${sticks}</span>
            <span class="ib-sticks-unit">柱</span>
          </div>
        </div>
      `;
    }).join('');

    // 点击跳到详情
    list.querySelectorAll('.ib-item').forEach(it => {
      it.addEventListener('click', () => {
        SND?.play('pop'); HAP?.light();
        openMuseumItem(it.dataset.id);
      });
    });
  }

  function renderTimeline(items) {
    const list = $('#timelineList');
    if (!list) return;
    if (!items.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-ghost">≡</div><p>还没有已结案的记录。</p></div>`;
      return;
    }
    // 按月分组
    const grouped = {};
    items.forEach(r => {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      (grouped[key] = grouped[key] || []).push(r);
    });
    const keys = Object.keys(grouped).sort().reverse();

    list.innerHTML = keys.map(k => {
      const monthLabel = k.replace('.', '年') + '月';
      const items = grouped[k];
      return `
        <div class="tl-month">${monthLabel}</div>
        ${items.map(r => {
          const status = ({
            released: '翻篇', healed: '封存', incensed: '已上香', found: '找到', searching: '寻找中'
          })[r.status] || r.status;
          const d = new Date(r.createdAt);
          const dateStr = `${d.getMonth() + 1}月${d.getDate()}日`;
          const icon = window.ITEMICON ? window.ITEMICON.svg(r.name) : '✦';
          return `
            <div class="tl-item" data-id="${r.id}">
              <div class="tl-icon">${icon}</div>
              <div class="tl-body">
                <div class="tl-name">${escapeHTML(r.name)}</div>
                <div class="tl-meta">
                  <span>${dateStr}</span>
                  <span class="tl-status ${r.status}">${status}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      `;
    }).join('');

    $$('#timelineList .tl-item').forEach(it => {
      it.addEventListener('click', () => {
        SND?.play('pop'); HAP?.light();
        openMuseumItem(it.dataset.id);
      });
    });
  }

  async function openMuseumItem(id) {
    const r = findLost(id); if (!r) return;
    const statusLabel = {
      searching: '寻找中', found: '找到了', released: '翻篇了',
      healed: '疗愈封存', incensed: '已上香'
    }[r.status];

    let body = `
      <h3>${escapeHTML(r.name)}</h3>
      <p style="color:var(--ink-soft);font-size:13px;margin:0 0 16px;">
        ${fmtTime(r.createdAt)} · ${statusLabel}${r.incenseSticks ? ` · ${r.incenseSticks} 柱香` : ''}
      </p>
    `;
    if (r.place) body += `<p style="font-size:14px;margin:6px 0;"><b style="color:var(--ink-soft);">最后出现：</b>${escapeHTML(r.place)}</p>`;
    if (r.desc) body += `<p style="font-size:14px;margin:6px 0;"><b style="color:var(--ink-soft);">描述：</b>${escapeHTML(r.desc)}</p>`;
    if (r.contact) body += `<p style="font-size:14px;margin:6px 0;"><b style="color:var(--ink-soft);">联系：</b>${escapeHTML(r.contact)}</p>`;
    if (r.photo) body += `<img src="${r.photo}" style="width:100%;border-radius:12px;margin:12px 0;" />`;
    if (r.storyImg) body += `<img src="${r.storyImg}" style="width:100%;border-radius:12px;margin:12px 0;" />`;
    if (r.letter) body += `<div style="background:var(--bg-soft);padding:14px;border-radius:12px;margin:12px 0;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHTML(r.letter)}</div>`;
    if (r.storyText) body += `<div style="background:linear-gradient(180deg,rgba(184,179,214,0.18),rgba(255,255,255,0.5));padding:14px;border-radius:12px;margin:12px 0;font-size:14px;line-height:1.85;white-space:pre-wrap;">${escapeHTML(r.storyText)}${r.storyTail ? '\n\n— ' + escapeHTML(r.storyTail) : ''}</div>`;

    const actions = [];
    if (r.status === 'searching') {
      actions.push({ label: '找到了', primary: true, onClick: () => {
        updateLost(id, { status: 'found' });
        SND?.play('found'); HAP?.success();
        toast(C.pick(C.foundLines), 3000);
        renderMuseum();
      }});
      actions.push({ label: '不找了', onClick: () => {
        updateLost(id, { status: 'released' });
        SND?.play('whoosh'); HAP?.light();
        toast(C.pick(C.noBlame), 3000);
        renderMuseum();
      }});
    }
    // 上香按钮始终可见（可多次上香）
    {
      const sticksLabel = r.incenseSticks ? `🕯 再上一柱（已 ${r.incenseSticks}）` : '🕯 上香';
      actions.push({ label: sticksLabel, onClick: () => {
        IN.open(r, ({ sticks, at }) => {
          const rec = findLost(r.id) || {};
          const history2 = Array.isArray(rec.incenseHistory) ? rec.incenseHistory.slice() : [];
          history2.push({ sticks, at });
          updateLost(r.id, {
            incenseSticks: (rec.incenseSticks || 0) + sticks,
            incenseAt: at,
            incenseHistory: history2,
          });
          renderMuseum();
        });
      }});
    }
    actions.push({ label: '删除', danger: true, onClick: async () => {
      const yes = await modal('<h3>从博物馆移除？</h3><p style="color:var(--ink-soft);font-size:14px;">这条记录会消失。删除后没法恢复。</p>',
        [{ label: '不了' }, { label: '删除', primary: true, danger: true }]);
      if (yes === 1) {
        db.lost = db.lost.filter(x => x.id !== id);
        saveDB(); renderMuseum();
        SND?.play('swish');
      }
    }});
    actions.push({ label: '关闭' });

    modal(body, actions);
  }

  // ============ 「自己」 ============
  function renderMe() {
    const total = db.lost.length;
    const found = db.lost.filter(r => r.status === 'found').length;
    $('#statTotal').textContent = total;
    $('#statFound').textContent = total ? Math.round(found / total * 100) + '%' : '0%';

    const counter = {};
    db.lost.forEach(r => {
      const k = (r.name || '').slice(0, 4);
      counter[k] = (counter[k] || 0) + 1;
    });
    const topEntry = Object.entries(counter).sort((a, b) => b[1] - a[1])[0];
    $('#statTop').textContent = topEntry && topEntry[1] >= 2 ? topEntry[0] : '—';

    const recent = db.lost.filter(r => now() - r.createdAt < 30 * 24 * 60 * 60 * 1000);
    if (recent.length === 0) {
      $('#blameIndex').textContent = '还没数据。等你记几条再来看。';
    } else {
      const heavy = recent.filter(r => r.weight === 3).length;
      const light = recent.filter(r => r.weight === 1).length;
      const ratio = light / recent.length;
      let line = '';
      if (ratio > 0.6) line = `这个月你大多数都是「💚 随口一提」。状态不错 👍`;
      else if (heavy > 2) line = `这个月有 ${heavy} 件比较沉的事。慢慢来，没关系。`;
      else line = `这个月一共 ${recent.length} 条记录。它们都已经在我这里了，你不用一直拎着。`;
      $('#blameIndex').textContent = line;
    }

    // 同步开关状态（音乐默认开）
    const sndOn = db.settings.sound !== false;
    const hapOn = db.settings.haptic !== false;
    const musicOn = db.settings.music !== false;
    $('#toggleSound').classList.toggle('on', sndOn);
    $('#toggleSound').dataset.on = sndOn;
    $('#toggleHaptic').classList.toggle('on', hapOn);
    $('#toggleHaptic').dataset.on = hapOn;
    const tm = $('#toggleMusic');
    if (tm) {
      tm.classList.toggle('on', musicOn);
      tm.dataset.on = musicOn;
    }
    // 同步主题选中
    const theme = db.settings.musicTheme || 'warm';
    $$('#musicThemes .theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === theme);
    });
    // 同步音量滑块
    const vol = db.settings.musicVolume ?? 60;
    const slider = $('#musicVolume');
    if (slider) slider.value = vol;
    const volNum = $('#volNum');
    if (volNum) volNum.textContent = vol;
  }

  // 开关
  $('#toggleSound').addEventListener('click', () => {
    const on = !($('#toggleSound').dataset.on === 'true');
    $('#toggleSound').classList.toggle('on', on);
    $('#toggleSound').dataset.on = on;
    db.settings.sound = on; saveDB();
    SND?.set(on);
    if (on) { SND?.init(); SND?.play('chime'); }
    HAP?.confirm();
  });
  $('#toggleHaptic').addEventListener('click', () => {
    const on = !($('#toggleHaptic').dataset.on === 'true');
    $('#toggleHaptic').classList.toggle('on', on);
    $('#toggleHaptic').dataset.on = on;
    db.settings.haptic = on; saveDB();
    HAP?.set(on);
    if (on) HAP?.success();
  });

  // —— 把音量百分比 (0-100) 映射到实际增益 (0-0.30) ——
  function volMap(pct) { return Math.pow(pct / 100, 1.4) * 0.30; } // 略指数化，低音量更精细

  // 背景音乐开关
  $('#toggleMusic')?.addEventListener('click', () => {
    const btn = $('#toggleMusic');
    const on = !(btn.dataset.on === 'true');
    btn.classList.toggle('on', on);
    btn.dataset.on = on;
    db.settings.music = on; saveDB();
    if (on) {
      window.SOUND?.init();
      const v = volMap(db.settings.musicVolume ?? 60);
      const t = db.settings.musicTheme || 'warm';
      window.MUSIC?.start(v, t);
      toast('背景音乐已开 · 安静地陪着你', 2200);
    } else {
      window.MUSIC?.stop();
      toast('音乐关了', 1500);
    }
  });

  // 音乐主题切换
  $$('#musicThemes .theme-btn').forEach(b => {
    b.addEventListener('click', () => {
      const theme = b.dataset.theme;
      $$('#musicThemes .theme-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      db.settings.musicTheme = theme; saveDB();
      SND?.play('select'); HAP?.light();
      // 如果音乐正开，立即切换主题（库内会先淡出再启动）
      if (db.settings.music !== false) {
        window.SOUND?.init();
        if (window.MUSIC?.isPlaying()) {
          window.MUSIC.setTheme(theme);
        } else {
          window.MUSIC?.start(volMap(db.settings.musicVolume ?? 60), theme);
        }
      }
    });
  });

  // 音量滑块
  $('#musicVolume')?.addEventListener('input', e => {
    const pct = parseInt(e.target.value, 10);
    db.settings.musicVolume = pct;
    $('#volNum').textContent = pct;
    const gain = volMap(pct);
    if (window.MUSIC?.isPlaying()) window.MUSIC.setVolume(gain);
    saveDB();
  });
  $('#trySound').addEventListener('click', () => {
    SND?.init(); SND?.play('bowl');
    HAP?.seal();
  });

  // 通知
  $('#permBtn').addEventListener('click', async () => {
    if (!('Notification' in window)) { toast('当前浏览器不支持通知'); return; }
    const r = await Notification.requestPermission();
    if (r === 'granted') {
      db.settings.notify = true; saveDB();
      toast('开了。我会在恰当的时候轻轻提醒你。', 2500);
      SND?.play('chime');
    } else { toast('没关系，不开也能用。'); }
  });
  $('#testNotify').addEventListener('click', () => {
    if (Notification.permission !== 'granted') { toast('先开权限'); return; }
    new Notification('我丢', { body: '只是测试。你没丢东西。', icon: 'icons/icon-192.svg' });
  });

  // 导出
  $('#exportBtn').addEventListener('click', () => {
    const data = JSON.stringify(db, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `wodiu-${fmtDate(now())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    SND?.play('drop');
  });

  // 清空
  $('#wipeBtn').addEventListener('click', async () => {
    HAP?.error();
    const yes = await modal(
      '<h3>真的全部清空？</h3><p style="color:var(--ink-soft);font-size:14px;">所有"丢了"和"先记着"的记录都会被擦掉。这件事没法撤销。</p>',
      [{ label: '算了' }, { label: '清空', primary: true, danger: true }]
    );
    if (yes === 1) {
      db.lost = []; db.notes = []; saveDB();
      SND?.play('whoosh'); HAP?.success();
      toast('一干二净。可以重新开始了。', 2500);
      renderMe();
    }
  });

  // ============ 提醒 ============
  function scheduleReminder(type, id, delay) {
    if (delay <= 0) return;
    setTimeout(() => triggerReminder(type, id), Math.min(delay, 24 * 60 * 60 * 1000));
  }
  function triggerReminder(type, id) {
    if (type === 'note') {
      const n = db.notes.find(x => x.id === id);
      if (!n || n.done) return;
      const msg = C.pick(C.remindMessages).replace('{place}', n.text);
      if (Notification.permission === 'granted') {
        new Notification('我丢 · 先记着', { body: msg, icon: 'icons/icon-192.svg' });
      } else {
        toast('提醒：' + msg, 4000);
        SND?.play('drop');
      }
    } else if (type === 'search') {
      const r = findLost(id);
      if (!r || r.status !== 'searching') return;
      const msg = `三天前丢的「${r.name}」——还在找吗？`;
      if (Notification.permission === 'granted') {
        new Notification('我丢 · 提醒一次', { body: msg, icon: 'icons/icon-192.svg' });
      } else {
        toast(msg, 4000);
      }
    }
  }
  function rehydrateReminders() {
    db.notes.forEach(n => {
      if (n.done || !n.remindAt) return;
      scheduleReminder('note', n.id, n.remindAt - now());
    });
    db.lost.forEach(r => {
      if (r.status !== 'searching' || !r.remindAt) return;
      scheduleReminder('search', r.id, r.remindAt - now());
    });
  }

  // ============ utils ============
  function escapeHTML(str) {
    return String(str || '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ============ 「关于我丢」全屏页 ============
  function openAbout() {
    SND?.play('whoosh'); HAP?.light();
    const ov = $('#aboutOverlay');
    if (!ov) return;
    const a = C.about;
    // 把 markdown ** ** 转成 <strong>，换行转 <p>
    const html = a.body
      .split(/\n\n+/)
      .map(p => '<p>' + escapeHTML(p).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') + '</p>')
      .join('');
    $('#aboutContent').innerHTML = `
      <h1>${escapeHTML(a.title)}</h1>
      <div class="about-meta">关于这个产品 · 蔡格尼克效应</div>
      ${html}
      <div class="about-sign">${escapeHTML(a.sign)}</div>
    `;
    DIU.quiet('#aboutDiu', 'sleep');
    ov.classList.add('show');
    document.body.style.overflow = 'hidden';
    // 蔡格尼克 高亮渐入
    setTimeout(() => {
      $$('#aboutContent strong').forEach(s => s.classList.add('lit'));
    }, 800);
  }
  function closeAbout() {
    SND?.play('whoosh');
    $('#aboutOverlay').classList.remove('show');
    document.body.style.overflow = '';
  }
  $('#aboutLink')?.addEventListener('click', openAbout);
  $('#aboutClose')?.addEventListener('click', closeAbout);

  // ============ init ============
  rehydrateReminders();
  switchTab('lost');
})();
