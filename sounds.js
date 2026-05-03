/* ==========================================================
   声音引擎 —— Web Audio 合成，零文件依赖
   原则：温柔、轻量、不打扰，五声音阶（中式）
   ==========================================================
   音效列表：
     pop      短促泡音（选择/点击）
     select   五声音阶 C5（确认选择）
     chime    风铃（翻篇 / 找到了 / 取回）
     bowl     铜钵长鸣（封存 / 上完香）
     whoosh   柔风过（卡片飘走 / 切换）
     fire     火苗噼啪（点火）
     smoke    持续低频嗡鸣（升烟时背景）
     match    擦火柴 短噪
     drop     小水滴（先记着 写入）
   ========================================================== */

window.SOUND = (function () {
  let ctx = null;
  let master = null;
  let enabled = true;
  let smokeNode = null;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35; // 留出余量，整体偏轻
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // 工具：包络（attack-decay-sustain-release 简化版）
  function env(g, attack, decay, sustain, release, dur) {
    const t = ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1, t + attack);
    g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + attack + decay);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  // 一次性振荡器 + 包络
  function tone({ freq, type = 'sine', dur = 0.4, vol = 0.4, attack = 0.005, decay = 0.05, sustain = 0.3 }) {
    if (!ensureCtx() || !enabled) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    o.connect(g); g.connect(master);
    g.gain.value = 0.0001;
    const t = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(Math.max(vol * sustain, 0.0001), t + attack + decay);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.05);
  }

  // 多频叠加（用于钟磬感）
  function bell({ freqs, partials, dur = 1.6, vol = 0.4 }) {
    if (!ensureCtx() || !enabled) return;
    const out = ctx.createGain();
    out.gain.value = 1;
    out.connect(master);
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      const v = (partials?.[i] ?? 1) * vol;
      o.connect(g); g.connect(out);
      const t = ctx.currentTime;
      g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(v, t + 0.01 + i * 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * (1 - i * 0.08));
      o.start(t); o.stop(t + dur + 0.1);
    });
  }

  // 滤波白噪（火苗 / 风）
  function noiseBurst({ dur = 0.3, vol = 0.25, type = 'lowpass', freq = 800, q = 1, sweep = false }) {
    if (!ensureCtx() || !enabled) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master);
    if (sweep) {
      const t = ctx.currentTime;
      f.frequency.setValueAtTime(freq, t);
      f.frequency.exponentialRampToValueAtTime(freq * 3, t + dur);
    }
    src.start();
  }

  // —— 公开音效 ——
  const SFX = {
    pop() { tone({ freq: 380, type: 'sine', dur: 0.12, vol: 0.18, attack: 0.002, decay: 0.04, sustain: 0.1 }); },

    select() {
      // 五声 C5
      tone({ freq: 523.25, type: 'sine', dur: 0.28, vol: 0.22 });
      setTimeout(() => tone({ freq: 783.99, type: 'sine', dur: 0.4, vol: 0.12 }), 30);
    },

    // 翻篇 / 取回 —— 风铃叮咚两声
    chime() {
      bell({
        freqs: [1318.5, 1975.5, 2637, 3951],
        partials: [1.0, 0.6, 0.35, 0.18],
        dur: 1.4, vol: 0.32,
      });
      setTimeout(() => bell({
        freqs: [1568, 2349, 3136],
        partials: [0.8, 0.5, 0.3],
        dur: 1.2, vol: 0.22,
      }), 180);
    },

    // 找到了 —— 上行三音
    found() {
      [659.25, 783.99, 1046.5].forEach((f, i) =>
        setTimeout(() => tone({ freq: f, type: 'triangle', dur: 0.5, vol: 0.25 }), i * 90));
    },

    // 封存 / 上完香 —— 铜钵
    bowl() {
      bell({
        freqs: [196, 392, 587.33, 783.99, 1175.5],
        partials: [1.0, 0.55, 0.35, 0.22, 0.12],
        dur: 3.6, vol: 0.45,
      });
    },

    // 切换 / 翻面 —— 纸感轻"嗒"（暖、短、不刺）
    // 一层柔噪 + 一个低沉小音 = 像把卡片轻轻翻过去
    whoosh() {
      if (!ensureCtx() || !enabled) return;
      // 1) 极短的纸摩擦声：低通滤过的窄带噪
      noiseBurst({ dur: 0.06, vol: 0.06, type: 'bandpass', freq: 1200, q: 1.4 });
      // 2) 一个小落音：280Hz → 220Hz，80ms 衰减
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.connect(g); g.connect(master);
      const t = ctx.currentTime;
      o.frequency.setValueAtTime(280, t);
      o.frequency.exponentialRampToValueAtTime(210, t + 0.08);
      g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(0.10, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.10);
      o.start(t); o.stop(t + 0.12);
    },

    // 擦火柴
    match() {
      noiseBurst({ dur: 0.18, vol: 0.35, type: 'highpass', freq: 2200, q: 0.8 });
    },

    // 火苗噼啪
    fire() {
      [0, 80, 160, 250].forEach(d => setTimeout(() => {
        noiseBurst({ dur: 0.06, vol: 0.18 + Math.random() * 0.15, type: 'bandpass', freq: 800 + Math.random() * 1500, q: 4 });
      }, d));
    },

    // 长按蓄力 —— 上行 hum
    charge() {
      if (!ensureCtx() || !enabled) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 220;
      o.connect(g); g.connect(master);
      const t = ctx.currentTime;
      g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(880, t + 3.0);
      o.start(t); o.stop(t + 3.3);
      return { stop: () => { try { o.stop(); } catch (e) {} } };
    },

    // 升烟时的低频背景嗡鸣
    smokeOn() {
      if (!ensureCtx() || !enabled) return;
      if (smokeNode) return;
      const o = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 110;
      o2.type = 'sine'; o2.frequency.value = 110.6; // 微失谐
      o.connect(g); o2.connect(g); g.connect(master);
      const t = ctx.currentTime;
      g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(0.08, t + 1.5);
      o.start(t); o2.start(t);
      smokeNode = { o, o2, g };
    },
    smokeOff() {
      if (!smokeNode) return;
      const t = ctx.currentTime;
      smokeNode.g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
      const ref = smokeNode;
      setTimeout(() => { try { ref.o.stop(); ref.o2.stop(); } catch (e) {} }, 1100);
      smokeNode = null;
    },

    // 小水滴 —— 先记着 写入
    drop() {
      if (!ensureCtx() || !enabled) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      const t = ctx.currentTime;
      o.frequency.setValueAtTime(880, t);
      o.frequency.exponentialRampToValueAtTime(440, t + 0.18);
      g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.3);
    },

    // 划掉 / 删除
    swish() {
      noiseBurst({ dur: 0.2, vol: 0.12, type: 'highpass', freq: 1200 });
    },
  };

  return {
    play(name) { if (SFX[name]) SFX[name](); },
    charge() { return SFX.charge(); },
    smokeOn() { SFX.smokeOn(); },
    smokeOff() { SFX.smokeOff(); },
    set(v) { enabled = !!v; if (!enabled) SFX.smokeOff(); },
    isOn() { return enabled; },
    init() { ensureCtx(); },
    get ctx() { return ctx; },  // 给 MUSIC 复用
  };
})();

/* ==========================================================
   背景音乐 v2 —— 真治愈系
   • 温暖 F 大调中高音域（不再是低沉的 C2 大字调）
   • 双层 pad：F-A-C 三和弦 + 高八度气声 + 下八度三角波厚度
   • 频繁但极柔的 bell ping（5-9 秒一颗）+ 三和声泛音
   • 明亮一些的滤波（1500Hz）让高音透出来
   • Pad 整体音量呼吸（极慢 0.06Hz LFO）
   • 像 Brian Eno《Music for Airports》的呼吸感
   ========================================================== */

window.MUSIC = (function () {
  let ctx, master, padNodes = [], lfos = [], panner, filter, noiseNode = null;
  let bellTimer = null;
  let isOn = false;
  let currentTheme = 'warm';
  let currentVolume = 0.16;

  // 三种主题：温暖 / 月光 / 海风
  const THEMES = {
    warm: {
      // F 大调中高音域 —— 温暖明亮
      pad: [
        { f: 174.61, vol: 0.18 }, // F3
        { f: 220.00, vol: 0.16 }, // A3
        { f: 261.63, vol: 0.14 }, // C4
      ],
      air: [{ f: 349.23, vol: 0.05 }, { f: 523.25, vol: 0.04 }],
      pent: [349.23, 392.00, 440.00, 523.25, 587.33, 698.46, 783.99, 880.00, 1046.50],
      filterFreq: 1500,
      filterLfoRange: 400,
      bellInterval: [5000, 9000],
      bellMain: 0.12, bellOct: 0.06, bellFifth: 0.025,
    },
    moon: {
      // D 多利亚 中低音域 —— 安静月夜
      pad: [
        { f: 146.83, vol: 0.16 }, // D3
        { f: 174.61, vol: 0.14 }, // F3
        { f: 220.00, vol: 0.12 }, // A3
      ],
      air: [{ f: 293.66, vol: 0.04 }],   // D4 一点 sparkle
      pent: [293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 698.46], // D F G A C D F
      filterFreq: 900,                   // 偏暗
      filterLfoRange: 300,
      bellInterval: [9000, 14000],       // 更稀疏
      bellMain: 0.14, bellOct: 0.05, bellFifth: 0.018,
    },
    sea: {
      // A 五声 + 海浪噪声 —— 海风轻拂
      pad: [
        { f: 110.00, vol: 0.10 },    // A2 低底音
        { f: 220.00, vol: 0.08 },    // A3
        { f: 329.63, vol: 0.07 },    // E4 五度
      ],
      air: [{ f: 440.00, vol: 0.04 }],
      pent: [440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1318.50],
      filterFreq: 1800,                  // 明亮（像浪花上的反光）
      filterLfoRange: 600,
      bellInterval: [3500, 6500],        // 频繁的小水滴
      bellMain: 0.10, bellOct: 0.04, bellFifth: 0.018,
      addWaves: true,                    // 加海浪噪声
    },
  };

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    // 复用 SOUND 的 context（如果已 init）
    if (window.SOUND && window.SOUND.ctx) ctx = window.SOUND.ctx;
    else ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }

  function start(targetVolume = 0.16, theme = 'warm') {
    init();
    if (!ctx || isOn) return;
    if (ctx.state === 'suspended') ctx.resume();
    isOn = true;
    currentTheme = theme;
    currentVolume = targetVolume;
    const cfg = THEMES[theme] || THEMES.warm;

    // —— 滤波器（按主题决定明暗） ——
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cfg.filterFreq;
    filter.Q.value = 0.6;

    // —— 立体声慢摇 ——
    panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) panner.pan.value = 0;

    // —— Pad 主层（来自主题配置） ——
    padNodes = cfg.pad.map(({ f, vol }) => {
      const v1 = ctx.createOscillator();
      const v2 = ctx.createOscillator();
      const v3 = ctx.createOscillator();
      const g = ctx.createGain();
      v1.type = 'sine'; v1.frequency.value = f;
      v2.type = 'sine'; v2.frequency.value = f * 1.004; // 微失谐合唱感
      v3.type = 'triangle'; v3.frequency.value = f * 0.502; // 下八度三角波 添厚度
      g.gain.value = vol;
      v1.connect(g); v2.connect(g); v3.connect(g);
      g.connect(filter);
      v1.start(); v2.start(); v3.start();
      return { v1, v2, v3, g };
    });

    // —— 高八度气声层 ——
    cfg.air.forEach(({ f, vol }) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.value = vol;
      o.connect(g); g.connect(filter);
      o.start();
      padNodes.push({ v1: o, g });
    });

    // —— 海浪噪声（仅 sea 主题） ——
    if (cfg.addWaves) {
      const len = ctx.sampleRate * 4; // 4 秒循环
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buf; noiseNode.loop = true;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 600;
      noiseFilter.Q.value = 0.6;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.0;
      noiseNode.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(filter);
      noiseNode.start();
      // 海浪音量缓慢起伏（4 秒一波）
      const waveLfo = ctx.createOscillator();
      const waveLfoGain = ctx.createGain();
      waveLfo.type = 'sine';
      waveLfo.frequency.value = 0.2; // 5 秒一波
      waveLfoGain.gain.value = 0.05;
      waveLfo.connect(waveLfoGain);
      waveLfoGain.connect(noiseGain.gain);
      // 偏置使噪声基础音量为 0.04
      noiseGain.gain.value = 0.04;
      waveLfo.start();
      lfos.push(waveLfo);
      padNodes.push({ v1: noiseNode, g: noiseGain });
    }

    // 滤波器接 panner 接 master
    if (panner) { filter.connect(panner); panner.connect(master); }
    else filter.connect(master);

    // —— 滤波器 LFO：20 秒一次的呼吸 ——
    const fLfo = ctx.createOscillator();
    const fLfoGain = ctx.createGain();
    fLfo.type = 'sine';
    fLfo.frequency.value = 0.05;
    fLfoGain.gain.value = cfg.filterLfoRange;
    fLfo.connect(fLfoGain);
    fLfoGain.connect(filter.frequency);
    fLfo.start();
    lfos.push(fLfo);

    // —— Pan LFO：30 秒一次的左右摇 ——
    if (panner) {
      const pLfo = ctx.createOscillator();
      const pLfoGain = ctx.createGain();
      pLfo.type = 'sine';
      pLfo.frequency.value = 0.033;
      pLfoGain.gain.value = 0.30;
      pLfo.connect(pLfoGain);
      pLfoGain.connect(panner.pan);
      pLfo.start();
      lfos.push(pLfo);
    }

    // —— Pad 整体音量呼吸：极慢 inhale/exhale ——
    const padBreath = ctx.createOscillator();
    const padBreathGain = ctx.createGain();
    padBreath.type = 'sine';
    padBreath.frequency.value = 0.06;
    padBreathGain.gain.value = 0.04;
    padBreath.connect(padBreathGain);
    padNodes.forEach(n => padBreathGain.connect(n.g.gain));
    padBreath.start();
    lfos.push(padBreath);

    // —— 淡入 ——
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(targetVolume, t + 2);

    // —— Bell ping：按主题间隔 ——
    const [bMin, bMax] = cfg.bellInterval;
    function scheduleBell() {
      const delay = bMin + Math.random() * (bMax - bMin);
      bellTimer = setTimeout(() => {
        if (isOn) playBell();
        scheduleBell();
      }, delay);
    }
    scheduleBell();
  }

  let lastPentIdx = 2;

  function playBell() {
    if (!ctx || !isOn) return;
    const cfg = THEMES[currentTheme] || THEMES.warm;
    const pent = cfg.pent;

    // 优先邻近音
    const range = 3;
    lastPentIdx = Math.min(lastPentIdx, pent.length - 1);
    const lo = Math.max(0, lastPentIdx - range);
    const hi = Math.min(pent.length - 1, lastPentIdx + range);
    const idx = lo + Math.floor(Math.random() * (hi - lo + 1));
    lastPentIdx = idx;
    const f = pent[idx];

    const t = ctx.currentTime;
    const decay = 4.0;

    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    o.connect(g); g.connect(master);
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(cfg.bellMain, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.start(t); o.stop(t + decay + 0.1);

    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = 'sine'; o2.frequency.value = f * 2;
    o2.connect(g2); g2.connect(master);
    g2.gain.value = 0.0001;
    g2.gain.exponentialRampToValueAtTime(cfg.bellOct, t + 0.04);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + decay * 0.7);
    o2.start(t); o2.stop(t + decay * 0.7 + 0.1);

    const o3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    o3.type = 'sine'; o3.frequency.value = f * 3;
    o3.connect(g3); g3.connect(master);
    g3.gain.value = 0.0001;
    g3.gain.exponentialRampToValueAtTime(cfg.bellFifth, t + 0.04);
    g3.gain.exponentialRampToValueAtTime(0.0001, t + decay * 0.5);
    o3.start(t); o3.stop(t + decay * 0.5 + 0.1);
  }

  function stop() {
    if (!ctx || !isOn) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    setTimeout(() => {
      try {
        padNodes.forEach(n => {
          try { n.v1?.stop(); } catch (e) {}
          try { n.v2?.stop(); } catch (e) {}
          try { n.v3?.stop(); } catch (e) {}
        });
        lfos.forEach(l => { try { l.stop(); } catch (e) {} });
        if (noiseNode) { try { noiseNode.stop(); } catch (e) {} noiseNode = null; }
      } catch (e) {}
      padNodes = []; lfos = [];
      isOn = false;
    }, 1700);
    if (bellTimer) { clearTimeout(bellTimer); bellTimer = null; }
  }

  function setVolume(v) {
    currentVolume = v;
    if (!ctx || !master) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.exponentialRampToValueAtTime(Math.max(v, 0.0001), t + 0.4);
  }

  // 切换主题：先停再用新主题启动
  function setTheme(name) {
    if (!THEMES[name]) return;
    if (currentTheme === name && isOn) return;
    currentTheme = name;
    if (isOn) {
      const v = currentVolume;
      stop();
      setTimeout(() => start(v, name), 1800); // 等淡出完成
    }
  }

  // 噪声节点也要 stop
  function stopNoise() {
    if (noiseNode) {
      try { noiseNode.stop(); } catch (e) {}
      noiseNode = null;
    }
  }

  return {
    start, stop, setVolume, setTheme,
    isPlaying() { return isOn; },
    currentTheme: () => currentTheme,
    init,
  };
})();

/* ==========================================================
   触感反馈 —— Vibration API
   ========================================================== */
window.HAPTIC = (function () {
  let enabled = true;
  function buzz(pattern) {
    if (!enabled) return;
    if (!('vibrate' in navigator)) return;
    try { navigator.vibrate(pattern); } catch (e) {}
  }
  return {
    light() { buzz(8); },
    select() { buzz(12); },
    confirm() { buzz([15, 40, 15]); },
    success() { buzz([10, 50, 10, 50, 10]); },
    seal() { buzz([60, 80, 60, 80, 100]); },
    fire() { buzz([20, 30, 20, 30, 50]); },
    error() { buzz([60, 40, 60]); },
    custom(p) { buzz(p); },
    set(v) { enabled = !!v; },
    isOn() { return enabled; },
  };
})();
