/* ==========================================================
   丢丢 v6 —— 主视觉级 chibi 萌生物
   • 圆滚滚发光 · 大头小身
   • 巨大眼睛（占脸 1/3）
   • 有舌头（可舔屏幕）
   • 半透明发光 · 适合暗色背景
   ========================================================== */

window.DIU = (function () {

  /**
   * @param pose  back / front / turn / lick / sleep / curious / sad / happy / blink / pray / surprise
   * @param size  px
   * @param mood  normal / happy / sad
   * @param scale 缩放（首屏 hero 用 1.6，floater 用 0.7）
   */
  function ghostSvg({
    pose = 'front',
    size = 200,
    mood = 'normal',
    scale = 1,
  } = {}) {

    // ============ 背对状态：只有圆背 + 2 只耳朵 + 尾巴 ============
    if (pose === 'back') {
      return `
<svg viewBox="0 0 200 200" width="${size}" height="${size}"
     xmlns="http://www.w3.org/2000/svg" class="diu diu-back">
  <defs>
    <radialGradient id="backAura" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#cdd0ff" stop-opacity="0.85"/>
      <stop offset="55%" stop-color="#a8b0ff" stop-opacity="0.50"/>
      <stop offset="100%" stop-color="#a8b0ff" stop-opacity="0"/>
    </radialGradient>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3"/>
    </filter>
  </defs>

  <!-- 外层光晕 -->
  <ellipse cx="100" cy="115" rx="90" ry="78" fill="url(#backAura)">
    <animate attributeName="rx" values="90;94;90" dur="3.8s" repeatCount="indefinite"/>
    <animate attributeName="ry" values="78;76;78" dur="3.8s" repeatCount="indefinite"/>
  </ellipse>

  <!-- 尾巴（左侧伸出） -->
  <path d="M40 130 Q20 130 18 110 Q16 92 30 90"
        stroke="#cdd0ff" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.78">
    <animate attributeName="d" dur="3s" repeatCount="indefinite"
      values="M40 130 Q20 130 18 110 Q16 92 30 90;
              M40 130 Q22 132 16 112 Q12 90 30 86;
              M40 130 Q20 130 18 110 Q16 92 30 90"/>
  </path>

  <!-- 耳朵（朝前/上） -->
  <path d="M68 60 Q60 38 82 42 L84 68 Z"
        fill="#a8b0ff" opacity="0.85" stroke="#a8b0ff" stroke-width="1"/>
  <path d="M132 60 Q140 38 118 42 L116 68 Z"
        fill="#a8b0ff" opacity="0.85" stroke="#a8b0ff" stroke-width="1"/>

  <!-- 主体（背对：椭圆 + 底部小幽灵下摆） -->
  <path d="
    M28 110
    Q28 60 100 60
    Q172 60 172 110
    Q172 158 168 175
    Q166 184 162 178
    Q158 172 152 178
    Q146 184 140 178
    Q134 172 128 178
    Q122 184 116 178
    Q110 172 104 178
    Q98 184 92 178
    Q86 172 80 178
    Q74 184 68 178
    Q62 172 56 178
    Q50 184 44 178
    Q40 184 38 175
    Q28 158 28 110 Z"
    fill="#a8b0ff" opacity="0.55"
    stroke="#a8b0ff" stroke-width="1.5"/>

  <!-- 高光（背部反光） -->
  <ellipse cx="80" cy="90" rx="22" ry="14" fill="#fff" opacity="0.18"/>
</svg>`;
    }

    // ============ 转头中：3/4 侧视图 ============
    if (pose === 'turn') {
      return `
<svg viewBox="0 0 200 200" width="${size}" height="${size}"
     xmlns="http://www.w3.org/2000/svg" class="diu diu-turn">
  <defs>
    <radialGradient id="turnAura" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#cdd0ff" stop-opacity="0.85"/>
      <stop offset="55%" stop-color="#a8b0ff" stop-opacity="0.50"/>
      <stop offset="100%" stop-color="#a8b0ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="100" cy="115" rx="90" ry="78" fill="url(#turnAura)"/>

  <!-- 尾巴 -->
  <path d="M158 130 Q178 130 180 110 Q182 90 168 86"
        stroke="#cdd0ff" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.78"/>

  <!-- 耳朵 (3/4 view) -->
  <path d="M70 56 Q62 36 86 40 L88 64 Z" fill="#a8b0ff" opacity="0.85"/>
  <path d="M126 54 Q132 36 116 38 L114 60 Z" fill="#a8b0ff" opacity="0.78"/>

  <!-- 主体 -->
  <path d="
    M28 110 Q28 60 100 60 Q172 60 172 110
    Q172 158 168 175 Q166 184 162 178 Q158 172 152 178
    Q146 184 140 178 Q134 172 128 178 Q122 184 116 178
    Q110 172 104 178 Q98 184 92 178 Q86 172 80 178
    Q74 184 68 178 Q62 172 56 178 Q50 184 44 178
    Q40 184 38 175 Q28 158 28 110 Z"
    fill="#a8b0ff" opacity="0.55" stroke="#a8b0ff" stroke-width="1.5"/>

  <!-- 半张脸：右侧一只眼 -->
  <ellipse cx="118" cy="100" rx="12" ry="14" fill="#1a1830"/>
  <ellipse cx="121" cy="95" rx="4" ry="5" fill="#fff"/>
  <circle cx="115" cy="105" r="2" fill="#fff" opacity="0.7"/>

  <!-- 一点点鼻子 -->
  <ellipse cx="138" cy="115" rx="3" ry="2" fill="#1a1830" opacity="0.6"/>

  <!-- 腮红 -->
  <ellipse cx="148" cy="118" rx="7" ry="4" fill="#ff9aaa" opacity="0.55"/>
</svg>`;
    }

    // ============ 舔屏：嘴张开 + 长舌头伸出 ============
    if (pose === 'lick') {
      return frontFace({ tongue: true, mouth: 'open', mood });
    }

    // ============ 默认正面：可参数化的多种表情 ============
    return frontFace({ pose, mood });

    // ====================================================
    // 正面脸渲染函数
    // ====================================================
    function frontFace({ pose: p = pose, tongue = false, mouth = 'normal', mood: m = mood } = {}) {
      const moodColor = m === 'happy' ? '#e2b8ff' : m === 'sad' ? '#cdd6ff' : '#a8b0ff';

      // 眼睛
      const eyes = (() => {
        const happy = p === 'happy' || mouth === 'open';
        const sad = p === 'sad' || m === 'sad';

        if (p === 'sleep') {
          return `
            <path d="M58 102 Q70 96 82 102" stroke="#1a1830" stroke-width="3" stroke-linecap="round" fill="none"/>
            <path d="M118 102 Q130 96 142 102" stroke="#1a1830" stroke-width="3" stroke-linecap="round" fill="none"/>
          `;
        }
        if (p === 'blink') {
          return `
            <path d="M58 102 Q70 105 82 102" stroke="#1a1830" stroke-width="3" stroke-linecap="round" fill="none"/>
            <path d="M118 102 Q130 105 142 102" stroke="#1a1830" stroke-width="3" stroke-linecap="round" fill="none"/>
          `;
        }
        if (p === 'happy') {
          return `
            <path d="M58 105 Q70 92 82 105" stroke="#1a1830" stroke-width="3.5" stroke-linecap="round" fill="none"/>
            <path d="M118 105 Q130 92 142 105" stroke="#1a1830" stroke-width="3.5" stroke-linecap="round" fill="none"/>
          `;
        }
        if (p === 'curious') {
          // 一大一小（PRD: 好奇时一只比另一只大）
          return `
            <ellipse cx="70" cy="102" rx="13" ry="15" fill="#1a1830"/>
            <ellipse cx="130" cy="103" rx="11" ry="13" fill="#1a1830"/>
            <ellipse cx="73" cy="97" rx="4.5" ry="5.5" fill="#fff"/>
            <ellipse cx="133" cy="98" rx="3.8" ry="4.6" fill="#fff"/>
            <circle cx="66" cy="106" r="2" fill="#fff" opacity="0.8"/>
            <circle cx="126" cy="107" r="1.7" fill="#fff" opacity="0.8"/>
          `;
        }
        if (p === 'surprise') {
          // 圆睁，竖瞳
          return `
            <ellipse cx="70" cy="102" rx="14" ry="16" fill="#fff"/>
            <ellipse cx="130" cy="102" rx="14" ry="16" fill="#fff"/>
            <ellipse cx="70" cy="102" rx="2" ry="14" fill="#1a1830"/>
            <ellipse cx="130" cy="102" rx="2" ry="14" fill="#1a1830"/>
            <circle cx="70" cy="102" r="13" fill="none" stroke="#1a1830" stroke-width="2"/>
            <circle cx="130" cy="102" r="13" fill="none" stroke="#1a1830" stroke-width="2"/>
          `;
        }
        if (sad) {
          // 大圆眼 + 双高光 + 一滴泪 + 上方柔软委屈眉
          return `
            <!-- 眼睛保留大尺寸，和默认眼一样大 -->
            <ellipse cx="70" cy="104" rx="13" ry="14.5" fill="#1a1830"/>
            <ellipse cx="130" cy="104" rx="13" ry="14.5" fill="#1a1830"/>
            <ellipse cx="73" cy="99" rx="4.5" ry="5.5" fill="#fff"/>
            <ellipse cx="133" cy="99" rx="4.5" ry="5.5" fill="#fff"/>
            <circle cx="66" cy="108" r="2" fill="#fff" opacity="0.8"/>
            <circle cx="126" cy="108" r="2" fill="#fff" opacity="0.8"/>
            <!-- 一滴小眼泪从右眼下滑 -->
            <path d="M64 122 Q62 132 66 134 Q70 132 68 122 Z"
                  fill="#a8b0ff" opacity="0.85">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>
            </path>
            <ellipse cx="66" cy="124" rx="1.2" ry="0.8" fill="#fff" opacity="0.7"/>
            <!-- 委屈眉：在眼睛上方，微微向下倾 -->
            <path d="M55 84 Q70 80 84 88" stroke="#1a1830" stroke-width="2.4" stroke-linecap="round" fill="none"/>
            <path d="M116 88 Q130 80 145 84" stroke="#1a1830" stroke-width="2.4" stroke-linecap="round" fill="none"/>
          `;
        }
        // 默认大圆眼 + 双高光
        return `
          <ellipse cx="70" cy="102" rx="13" ry="15" fill="#1a1830"/>
          <ellipse cx="130" cy="102" rx="13" ry="15" fill="#1a1830"/>
          <ellipse cx="73" cy="97" rx="4.8" ry="5.8" fill="#fff"/>
          <ellipse cx="133" cy="97" rx="4.8" ry="5.8" fill="#fff"/>
          <circle cx="66" cy="106" r="2.2" fill="#fff" opacity="0.8"/>
          <circle cx="126" cy="106" r="2.2" fill="#fff" opacity="0.8"/>
        `;
      })();

      // 嘴巴 + 舌头
      const mouthSvg = tongue ? `
        <!-- 张嘴 -->
        <path d="M88 130 Q100 144 112 130 Q100 138 88 130 Z"
              fill="#1a1830"/>
        <!-- 长舌头 (向下伸) -->
        <path d="M94 134 Q100 175 106 134 Q103 144 100 144 Q97 144 94 134 Z"
              fill="#ff7a8a">
          <animate attributeName="d" dur="0.5s" fill="freeze"
            values="M94 134 Q100 134 106 134 Q103 134 100 134 Q97 134 94 134 Z;
                    M94 134 Q100 175 106 134 Q103 144 100 144 Q97 144 94 134 Z"/>
        </path>
      ` : (p === 'happy' ? `
        <path d="M86 128 Q100 142 114 128" stroke="#1a1830" stroke-width="3" stroke-linecap="round" fill="#1a1830"/>
        <ellipse cx="100" cy="134" rx="3" ry="1.5" fill="#ff7a8a"/>
      ` : (p === 'sad' ? `
        <path d="M88 134 Q100 128 112 134" stroke="#1a1830" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      ` : `
        <!-- 默认 ω 小嘴 -->
        <path d="M92 128 Q96 132 100 128 Q104 132 108 128"
              stroke="#1a1830" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      `));

      // 鼻子 (PRD: 没有明显鼻子，但需要一个微小的暗示)
      const nose = `<ellipse cx="100" cy="118" rx="2.5" ry="1.5" fill="#1a1830" opacity="0.45"/>`;

      // 耳朵：sad 时是"焉了"的小三角（清晰可见 + 尖端朝外侧倒）
      const earL = (p === 'sad' || m === 'sad')
        ? `<path d="M48 56 Q44 48 64 50 Q70 56 64 70 Q56 72 50 64 Z"
                 fill="${moodColor}" opacity="0.85"
                 stroke="${moodColor}" stroke-width="1.5" stroke-linejoin="round"/>
           <!-- 内侧小粉边 -->
           <path d="M56 58 Q60 62 60 66" stroke="#ff9aaa" stroke-width="2"
                 stroke-linecap="round" opacity="0.55" fill="none"/>`
        : `<path d="M48 60 Q40 30 76 38 Q72 50 70 64 Z" fill="${moodColor}" opacity="0.85"/>
           <path d="M58 50 Q60 56 64 60" stroke="#ff9aaa" stroke-width="3" stroke-linecap="round" opacity="0.55" fill="none"/>`;
      const earR = (p === 'sad' || m === 'sad')
        ? `<path d="M152 56 Q156 48 136 50 Q130 56 136 70 Q144 72 150 64 Z"
                 fill="${moodColor}" opacity="0.85"
                 stroke="${moodColor}" stroke-width="1.5" stroke-linejoin="round"/>
           <path d="M144 58 Q140 62 140 66" stroke="#ff9aaa" stroke-width="2"
                 stroke-linecap="round" opacity="0.55" fill="none"/>`
        : `<path d="M152 60 Q160 30 124 38 Q128 50 130 64 Z" fill="${moodColor}" opacity="0.85"/>
           <path d="M142 50 Q140 56 136 60" stroke="#ff9aaa" stroke-width="3" stroke-linecap="round" opacity="0.55" fill="none"/>`;

      // 尾巴
      const tail = p === 'curious'
        ? `<path d="M158 130 Q178 122 178 106 Q178 90 162 90"
                 stroke="${moodColor}" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.78"/>
           <circle cx="160" cy="98" r="2.2" fill="${moodColor}" opacity="0.78"/>`
        : `<path d="M156 132 Q176 138 180 122 Q184 104 168 100"
                 stroke="${moodColor}" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.78">
             <animate attributeName="d" dur="3.5s" repeatCount="indefinite"
               values="M156 132 Q176 138 180 122 Q184 104 168 100;
                       M156 132 Q172 134 184 120 Q190 100 172 96;
                       M156 132 Q176 138 180 122 Q184 104 168 100"/>
           </path>`;

      // 主体（5 个大圆滑波浪下摆，比 7 个小波更圆润）
      const body = `
        <path d="
          M28 110
          Q28 60 100 60
          Q172 60 172 110
          Q172 162 168 178
          Q160 188 148 178
          Q132 188 116 178
          Q100 188 84 178
          Q68 188 52 178
          Q40 188 32 178
          Q28 162 28 110 Z"
          fill="${moodColor}" opacity="0.58" stroke="${moodColor}" stroke-width="1.5"/>
      `;

      // 小爪子
      const paws = p === 'pray' ? `
        <ellipse cx="92" cy="172" rx="9" ry="6" fill="${moodColor}" opacity="0.85" stroke="${moodColor}" stroke-width="1.5"/>
        <ellipse cx="108" cy="172" rx="9" ry="6" fill="${moodColor}" opacity="0.85" stroke="${moodColor}" stroke-width="1.5"/>
      ` : `
        <ellipse cx="76" cy="172" rx="6" ry="4" fill="${moodColor}" opacity="0.85" stroke="${moodColor}" stroke-width="1.2"/>
        <ellipse cx="124" cy="172" rx="6" ry="4" fill="${moodColor}" opacity="0.85" stroke="${moodColor}" stroke-width="1.2"/>
        <circle cx="74" cy="172" r="0.8" fill="#ff9aaa"/>
        <circle cx="78" cy="172" r="0.8" fill="#ff9aaa"/>
        <circle cx="122" cy="172" r="0.8" fill="#ff9aaa"/>
        <circle cx="126" cy="172" r="0.8" fill="#ff9aaa"/>
      `;

      // 腮红
      const blush = `
        <ellipse cx="50" cy="120" rx="8" ry="5" fill="#ff9aaa" opacity="0.55"/>
        <ellipse cx="150" cy="120" rx="8" ry="5" fill="#ff9aaa" opacity="0.55"/>
        <ellipse cx="48" cy="118" rx="3" ry="1.5" fill="#fff" opacity="0.5"/>
        <ellipse cx="148" cy="118" rx="3" ry="1.5" fill="#fff" opacity="0.5"/>
      `;

      // 周围闪烁
      const sparkles = `
        <g opacity="0.7">
          <path d="M14 80 L18 84 L14 88 L10 84 Z" fill="${moodColor}" opacity="0.5">
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.8s" repeatCount="indefinite"/>
          </path>
          <path d="M186 88 L190 92 L186 96 L182 92 Z" fill="${moodColor}" opacity="0.5">
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3.1s" repeatCount="indefinite" begin="0.7s"/>
          </path>
          <circle cx="100" cy="32" r="1.6" fill="#fff" opacity="0.6">
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.5s" repeatCount="indefinite" begin="1.4s"/>
          </circle>
        </g>
      `;

      const sleepZ = p === 'sleep' ? `
        <text x="158" y="60" font-size="20" fill="#cdd0ff" opacity="0.65"
              font-family="Georgia, serif" font-style="italic"
              transform="rotate(-12, 158, 60)">z</text>
        <text x="174" y="42" font-size="14" fill="#cdd0ff" opacity="0.45"
              font-family="Georgia, serif" font-style="italic"
              transform="rotate(-12, 174, 42)">z</text>
      ` : '';

      const happyHeart = p === 'happy' ? `
        <path d="M14 56 Q14 48 22 48 Q30 48 30 56 Q30 64 22 70 Q14 64 14 56 Z"
              fill="#ff7a8a" opacity="0.85">
          <animateTransform attributeName="transform" type="rotate"
                            values="-8 22 56; 8 22 56; -8 22 56" dur="1.4s" repeatCount="indefinite"/>
        </path>
      ` : '';

      const auraDef = `
        <defs>
          <radialGradient id="aura_${p}_${m}" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stop-color="#cdd0ff" stop-opacity="0.95"/>
            <stop offset="55%" stop-color="${moodColor}" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="${moodColor}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="115" rx="90" ry="80" fill="url(#aura_${p}_${m})">
          <animate attributeName="rx" values="90;94;90" dur="3.8s" repeatCount="indefinite"/>
          <animate attributeName="ry" values="80;78;80" dur="3.8s" repeatCount="indefinite"/>
        </ellipse>
      `;

      return `
<svg viewBox="0 0 200 200" width="${size}" height="${size}"
     xmlns="http://www.w3.org/2000/svg" class="diu diu-${p}" data-mood="${m}">
  ${auraDef}
  ${sparkles}
  ${tail}
  ${earL}${earR}
  ${body}
  ${paws}
  ${blush}
  ${eyes}
  ${nose}
  ${mouthSvg}
  ${sleepZ}
  ${happyHeart}
</svg>`;
    }
  }

  return {
    poses: ['front', 'back', 'turn', 'lick', 'sleep', 'curious', 'sad', 'happy', 'blink', 'pray', 'surprise'],
    svg(pose, mood, size) { return ghostSvg({ pose: pose || 'front', mood: mood || 'normal', size: size || 200 }); },
    render(target, pose = 'front', tip = '', mood = 'normal', size) {
      if (typeof target === 'string') target = document.querySelector(target);
      if (!target) return;
      target.innerHTML = `
        <div class="diu-wrap" data-pose="${pose}">
          ${tip ? `<div class="diu-bubble">${tip}</div>` : ''}
          ${ghostSvg({ pose, mood, size: size || 110 })}
        </div>`;
    },
    quiet(target, pose = 'sleep', mood = 'normal', size) {
      this.render(target, pose, '', mood, size);
    },

    /**
     * 首屏 5 秒电影感动画
     * 0-1.5s: back
     * 1.5-2.2s: 耳朵抖（保持 back）
     * 2.2-3.0s: turn
     * 3.0-3.5s: front + lick
     * 3.5+: front idle
     */
    intro(target, onDone) {
      if (typeof target === 'string') target = document.querySelector(target);
      if (!target) return;
      const r = (pose, tip = '') => {
        target.innerHTML = `
          <div class="diu-wrap" data-pose="${pose}">
            ${tip ? `<div class="diu-bubble">${tip}</div>` : ''}
            ${ghostSvg({ pose, size: 240 })}
          </div>`;
      };

      r('back');
      // 1.5s 后耳朵抖一下（同 pose，CSS 触发 wiggle）
      setTimeout(() => {
        target.querySelector('.diu-back')?.classList.add('ear-wiggle');
      }, 1500);
      // 2.2s 后转头
      setTimeout(() => r('turn'), 2200);
      // 3.0s 后正面
      setTimeout(() => r('front'), 3000);
      // 3.4s 后舔屏
      setTimeout(() => r('lick'), 3400);
      // 4.2s 后回到正面 idle
      setTimeout(() => {
        r('front');
        if (onDone) onDone();
      }, 4200);
    },
  };
})();
