/* ==========================================================
   AI 模块 —— 调用 pollinations.ai (免费、无需 key)
   - 文本：text.pollinations.ai/{prompt}
   - 图：image.pollinations.ai/prompt/{prompt}?width=&height=
   策略：调不通就静默回退到本地模板/插画 SVG
   ========================================================== */

window.AI = (function () {
  // —— 文本 —— 用 keywords + 物品名 织一段
  async function story(name, keywords) {
    const cleaned = (keywords || []).filter(Boolean).slice(0, 6);
    const prompt = encodeURIComponent(buildStoryPrompt(name, cleaned));
    const url = `https://text.pollinations.ai/${prompt}?model=openai&seed=${Math.floor(Math.random() * 99999)}`;
    try {
      const res = await fetchWithTimeout(url, 12000);
      if (!res.ok) throw new Error('http');
      const text = (await res.text()).trim();
      if (text.length < 30 || text.length > 600) throw new Error('len');
      return { text, source: 'ai' };
    } catch (e) {
      // 回退：本地模板
      return { text: localTemplateStory(name, cleaned), source: 'local' };
    }
  }

  function buildStoryPrompt(name, kws) {
    return `你是一个写温柔散文的中文作者。基于下面这些信息，写一段 80 到 120 字的小文，关于一件丢失的物品「${name}」。
关键词：${kws.join('、')}。
要求：
- 中文，温暖，有画面感，不煽情，不用比喻泛滥
- 用第三人称叙述这件物品和它的主人之间的关系
- 结尾留一句轻微的告别感，但不要悲伤
- 直接给段落，不要标题，不要解释
- 可以分行（用换行），每段不超过 3 行`;
  }

  function localTemplateStory(name, kws) {
    const C = window.COPY;
    const a = kws[0] || '某个时候';
    const b = kws[1] || '某种感觉';
    const c = kws[2] || '某个地方';
    const tpl = C.pick(C.storyTemplates);
    return tpl.replace('{a}', a).replace('{b}', b).replace('{c}', c);
  }

  // —— 配图 —— 用 turbo 模型 + 小尺寸，更可能在超时前返回
  async function illustration(name, keywords) {
    const sceneKw = (keywords || []).slice(0, 3).join(', ');
    // 简化 prompt（越短越快）+ turbo 模型（比 flux 快很多）
    const prompt = `watercolor ${sceneKw} ${name}, soft pastel, dreamy, no text`;
    const seed = Math.floor(Math.random() * 99999);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=320&nologo=true&model=turbo&seed=${seed}`;
    try {
      const ok = await ping(url, 14000); // 14 秒拿不到就放弃
      return ok ? { url, source: 'ai' } : { url: fallbackSVG(name, keywords), source: 'fallback' };
    } catch (e) {
      return { url: fallbackSVG(name, keywords), source: 'fallback' };
    }
  }

  // 插画兜底：风丝印水彩感 SVG（不再难看，是 intentional 的小插画）
  function fallbackSVG(name, keywords) {
    const palettes = [
      // 海边
      { sky: '#e8f1ff', mid: '#a8c8e8', deep: '#5e8ec8', warm: '#f5b88a' },
      // 森林
      { sky: '#f0ede0', mid: '#b8d8b8', deep: '#5e8e6e', warm: '#d6a576' },
      // 黄昏
      { sky: '#fde4d3', mid: '#f0a988', deep: '#9d6e7e', warm: '#fff5d8' },
      // 月夜
      { sky: '#1e2148', mid: '#3d4078', deep: '#1a1a3a', warm: '#fde4d3' },
      // 春暖
      { sky: '#fff5e8', mid: '#f5b8d8', deep: '#a883b8', warm: '#a8d8b8' },
    ];
    // 根据关键词选最相关的色板
    const kw = (keywords || []).join(' ').toLowerCase();
    let p;
    if (/海|蓝|湖|雨|水/.test(kw)) p = palettes[0];
    else if (/森林|山|树|绿/.test(kw)) p = palettes[1];
    else if (/黄昏|傍晚|夕阳|秋/.test(kw)) p = palettes[2];
    else if (/夜|月|星|宇宙/.test(kw)) p = palettes[3];
    else p = palettes[Math.floor(Math.random() * palettes.length)];

    const seed = Math.floor(Math.random() * 1000);
    const isDark = p.sky.startsWith('#1') || p.sky.startsWith('#0');
    const inkColor = isDark ? '#fff5e8' : '#1f1d1a';
    const inkOp = isDark ? 0.65 : 0.32;

    // 山丘 / 浪 / 草 — 三层叠加形成纵深
    const layer1 = `<path d="M0 320 Q120 ${280 + (seed % 30)} 240 300 T 480 290 T 720 320 L720 480 L0 480 Z"
                          fill="${p.deep}" opacity="0.85"/>`;
    const layer2 = `<path d="M0 360 Q150 ${330 + (seed % 25)} 320 350 T 600 340 L720 360 L720 480 L0 480 Z"
                          fill="${p.mid}" opacity="0.75"/>`;
    const layer3 = `<path d="M0 410 Q180 ${390 + (seed % 20)} 380 405 T 720 410 L720 480 L0 480 Z"
                          fill="${p.warm}" opacity="0.55"/>`;

    // 太阳/月亮
    const sunY = isDark ? 100 : 140;
    const sunX = 540;
    const sun = `<circle cx="${sunX}" cy="${sunY}" r="48" fill="${p.warm}" opacity="0.85"/>
                 <circle cx="${sunX}" cy="${sunY}" r="68" fill="${p.warm}" opacity="0.20"/>
                 <circle cx="${sunX}" cy="${sunY}" r="92" fill="${p.warm}" opacity="0.10"/>`;

    // 远处的小物（鸟/树）
    const tinyShape = isDark
      ? `<g opacity="0.7">
           <circle cx="120" cy="80" r="1.5" fill="#fff"/>
           <circle cx="280" cy="60" r="1" fill="#fff"/>
           <circle cx="360" cy="120" r="1.2" fill="#fff"/>
           <circle cx="640" cy="200" r="1" fill="#fff"/>
         </g>`
      : `<g stroke="${inkColor}" stroke-width="1.5" fill="none" opacity="0.45">
           <path d="M150 200 q5 -5 10 0 q5 5 10 0"/>
           <path d="M260 180 q5 -4 10 0 q5 4 10 0"/>
         </g>`;

    // 可选物品 emoji 在角落（小，不抢视觉）
    const itemEmoji = window.ITEMICON ? window.ITEMICON.emoji(name) : '✦';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 480">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.sky}"/>
      <stop offset="100%" stop-color="${p.mid}" stop-opacity="0.4"/>
    </linearGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2"/>
      <feColorMatrix values="0 0 0 0 ${isDark ? '1' : '0.12'} 0 0 0 0 ${isDark ? '1' : '0.11'} 0 0 0 0 ${isDark ? '1' : '0.10'} 0 0 0 0.18 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>
  <rect width="720" height="480" fill="url(#sky)"/>
  ${sun}
  ${tinyShape}
  ${layer1}
  ${layer2}
  ${layer3}
  <rect width="720" height="480" filter="url(#grain)" opacity="0.4"/>
  <text x="50" y="450" font-family="-apple-system,'Songti SC',serif" font-size="22" fill="${inkColor}" opacity="${inkOp}" font-style="italic">${escapeXml((name || '').slice(0, 12))} 的下一站</text>
  <text x="690" y="50" font-size="32" text-anchor="end">${itemEmoji}</text>
</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function escapeXml(s) {
    return String(s).replace(/[<>&'"]/g, c => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
    }[c]));
  }

  function fetchWithTimeout(url, ms) {
    return Promise.race([
      fetch(url, { method: 'GET' }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
    ]);
  }

  // 图片可加载？（用 Image 探活，比 HEAD 兼容）
  function ping(url, ms) {
    return new Promise(resolve => {
      const img = new Image();
      const t = setTimeout(() => { img.src = ''; resolve(false); }, ms);
      img.onload = () => { clearTimeout(t); resolve(true); };
      img.onerror = () => { clearTimeout(t); resolve(false); };
      img.src = url;
    });
  }

  return { story, illustration };
})();
