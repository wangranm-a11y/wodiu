/* ==========================================================
   物品图标自动匹配 —— 根据物品名匹配卡通 SVG 图标
   用在：寻物卡 / 星图星点 / 封存卡
   ========================================================== */

window.ITEMICON = (function () {

  // —— 关键词到图标 ID 的映射 ——
  const KW = {
    chargebar: ['充电宝', '充电器', '数据线', '插头', '电源'],
    key:       ['钥匙', '门卡', '磁卡', '门禁', '车钥匙'],
    earphone:  ['耳机', 'AirPods', '蓝牙耳机', '蓝牙', '降噪'],
    book:      ['书', '课本', '笔记本', '日记', '本子', '杂志', '小说', '教材'],
    plush:     ['娃娃', '玩具', '公仔', '玩偶', '熊', '布偶'],
    umbrella:  ['伞', '雨伞', '阳伞', '太阳伞'],
    phone:     ['手机', 'iPhone', '安卓', 'Android', '电话'],
    wallet:    ['钱包', '卡包', '信用卡', '银行卡', '身份证', '驾照'],
    cup:       ['水杯', '保温杯', '杯子', '水壶', '马克杯'],
    glasses:   ['眼镜', '墨镜', '太阳镜', '近视镜'],
    bag:       ['包', '背包', '书包', '提包', '挎包', '手提袋'],
    watch:     ['手表', '腕表', '智能手表', 'Apple Watch'],
    pen:       ['笔', '钢笔', '签字笔', '马克笔'],
    card:      ['饭卡', '校园卡', '一卡通', '公交卡', '地铁卡'],
    headset:   ['头盔', '帽子', '围巾'],
    sock:      ['袜子', '内裤', '衣服', '外套', '裤子'],
    food:      ['饭', '便当', '咖啡', '奶茶'],
    pet:       ['猫', '狗', '宠物'],
    money:     ['钱', '现金', '红包'],
  };

  // —— SVG 图标库（卡通、线条粗、半透明发光） ——
  const SVG = {
    chargebar: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="14" y="18" width="32" height="34" rx="6" fill="#a8b0ff" opacity="0.85"/>
  <rect x="22" y="14" width="16" height="6" rx="2" fill="#7d86d6"/>
  <path d="M28 28 L36 28 L32 36 L40 36 L26 50 L30 40 L24 40 Z" fill="#fff8b8"/>
</svg>`,
    key: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <circle cx="22" cy="32" r="11" fill="none" stroke="#a8b0ff" stroke-width="4"/>
  <circle cx="22" cy="32" r="3" fill="#a8b0ff"/>
  <line x1="32" y1="32" x2="52" y2="32" stroke="#a8b0ff" stroke-width="4" stroke-linecap="round"/>
  <line x1="44" y1="32" x2="44" y2="40" stroke="#a8b0ff" stroke-width="4" stroke-linecap="round"/>
  <line x1="50" y1="32" x2="50" y2="38" stroke="#a8b0ff" stroke-width="4" stroke-linecap="round"/>
</svg>`,
    earphone: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 36 Q16 16 32 16 Q48 16 48 36" fill="none" stroke="#a8b0ff" stroke-width="4" stroke-linecap="round"/>
  <rect x="12" y="34" width="10" height="16" rx="4" fill="#a8b0ff"/>
  <rect x="42" y="34" width="10" height="16" rx="4" fill="#a8b0ff"/>
</svg>`,
    book: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="12" y="14" width="40" height="36" rx="3" fill="#a8b0ff" opacity="0.85"/>
  <rect x="12" y="14" width="6" height="36" fill="#7d86d6"/>
  <line x1="22" y1="22" x2="46" y2="22" stroke="#fff" stroke-width="1.5" opacity="0.6"/>
  <line x1="22" y1="28" x2="46" y2="28" stroke="#fff" stroke-width="1.5" opacity="0.6"/>
  <line x1="22" y1="34" x2="38" y2="34" stroke="#fff" stroke-width="1.5" opacity="0.6"/>
</svg>`,
    plush: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="36" r="18" fill="#f5b8d8"/>
  <circle cx="22" cy="20" r="6" fill="#f5b8d8"/>
  <circle cx="42" cy="20" r="6" fill="#f5b8d8"/>
  <circle cx="22" cy="20" r="2.5" fill="#e2b8ff"/>
  <circle cx="42" cy="20" r="2.5" fill="#e2b8ff"/>
  <circle cx="26" cy="34" r="2" fill="#1a1830"/>
  <circle cx="38" cy="34" r="2" fill="#1a1830"/>
  <path d="M28 42 Q32 46 36 42" stroke="#1a1830" stroke-width="1.6" stroke-linecap="round" fill="none"/>
</svg>`,
    umbrella: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 32 Q32 8 54 32 Q54 32 32 32 Q10 32 10 32 Z" fill="#a8b0ff"/>
  <path d="M10 32 L18 32 M22 32 L26 32 M32 32 L36 32 M42 32 L46 32 M50 32 L54 32" stroke="#7d86d6" stroke-width="0.8"/>
  <line x1="32" y1="32" x2="32" y2="50" stroke="#a8b0ff" stroke-width="3"/>
  <path d="M32 50 Q34 54 38 52" stroke="#a8b0ff" stroke-width="3" stroke-linecap="round" fill="none"/>
</svg>`,
    phone: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="10" width="24" height="44" rx="5" fill="#a8b0ff" opacity="0.9"/>
  <rect x="22" y="14" width="20" height="32" rx="2" fill="#1a1830" opacity="0.4"/>
  <circle cx="32" cy="50" r="1.6" fill="#fff"/>
</svg>`,
    wallet: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="20" width="44" height="28" rx="4" fill="#a8b0ff"/>
  <rect x="36" y="30" width="20" height="10" rx="2" fill="#7d86d6"/>
  <circle cx="46" cy="35" r="2" fill="#fff8b8"/>
</svg>`,
    cup: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 14 L20 50 Q20 56 26 56 L38 56 Q44 56 44 50 L44 14 Z" fill="#a8b0ff" opacity="0.9"/>
  <path d="M44 24 Q52 24 52 32 Q52 40 44 40" stroke="#a8b0ff" stroke-width="3" fill="none"/>
  <path d="M22 14 Q32 12 42 14" stroke="#7d86d6" stroke-width="2" fill="none"/>
</svg>`,
    glasses: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="34" r="10" fill="none" stroke="#a8b0ff" stroke-width="3"/>
  <circle cx="44" cy="34" r="10" fill="none" stroke="#a8b0ff" stroke-width="3"/>
  <line x1="30" y1="34" x2="34" y2="34" stroke="#a8b0ff" stroke-width="3"/>
  <path d="M10 30 Q6 26 8 22" stroke="#a8b0ff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M54 30 Q58 26 56 22" stroke="#a8b0ff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
</svg>`,
    bag: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 20 Q22 12 32 12 Q42 12 42 20" stroke="#a8b0ff" stroke-width="3" fill="none"/>
  <rect x="12" y="20" width="40" height="34" rx="4" fill="#a8b0ff"/>
  <line x1="20" y1="32" x2="44" y2="32" stroke="#7d86d6" stroke-width="1.5"/>
</svg>`,
    watch: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="22" y="22" width="20" height="20" rx="3" fill="#a8b0ff"/>
  <rect x="24" y="10" width="16" height="14" rx="3" fill="#7d86d6"/>
  <rect x="24" y="40" width="16" height="14" rx="3" fill="#7d86d6"/>
  <circle cx="32" cy="32" r="4" fill="#fff8b8"/>
</svg>`,
    pen: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 50 L46 18 L50 22 L18 54 Z" fill="#a8b0ff"/>
  <path d="M44 16 L48 12 L52 16 L48 20 Z" fill="#7d86d6"/>
  <path d="M14 50 L18 54 L12 56 Z" fill="#1a1830"/>
</svg>`,
    card: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="18" width="48" height="30" rx="4" fill="#a8b0ff"/>
  <rect x="14" y="26" width="14" height="3" fill="#fff" opacity="0.5"/>
  <rect x="14" y="34" width="20" height="3" fill="#fff" opacity="0.5"/>
  <rect x="40" y="34" width="10" height="6" fill="#fff8b8"/>
</svg>`,
    food: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 28 L50 28 Q50 50 32 50 Q14 50 14 28 Z" fill="#a8b0ff"/>
  <path d="M50 32 Q56 32 56 38 Q56 44 50 44" stroke="#a8b0ff" stroke-width="3" fill="none"/>
  <path d="M22 22 Q22 16 24 14 M30 22 Q30 16 32 14 M38 22 Q38 16 40 14" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6"/>
</svg>`,
    pet: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="32" cy="38" rx="18" ry="16" fill="#a8b0ff"/>
  <path d="M16 28 L20 18 L24 28 Z" fill="#a8b0ff"/>
  <path d="M40 28 L44 18 L48 28 Z" fill="#a8b0ff"/>
  <circle cx="26" cy="36" r="1.6" fill="#1a1830"/>
  <circle cx="38" cy="36" r="1.6" fill="#1a1830"/>
  <path d="M28 42 Q32 44 36 42" stroke="#1a1830" stroke-width="1.4" fill="none" stroke-linecap="round"/>
</svg>`,
    money: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="20" width="48" height="24" rx="3" fill="#9fc795"/>
  <circle cx="32" cy="32" r="7" fill="none" stroke="#fff" stroke-width="1.5"/>
  <text x="32" y="36" text-anchor="middle" font-family="-apple-system" font-size="11" font-weight="700" fill="#fff">¥</text>
</svg>`,
    sock: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 10 L20 36 Q20 40 16 44 L14 50 Q14 54 20 54 L40 54 Q44 54 44 50 L44 36 L44 10 Z" fill="#a8b0ff"/>
  <line x1="20" y1="14" x2="44" y2="14" stroke="#fff" stroke-width="1.5" opacity="0.7"/>
  <line x1="20" y1="20" x2="44" y2="20" stroke="#fff" stroke-width="1.5" opacity="0.7"/>
</svg>`,
    headset: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 36 Q14 12 32 12 Q50 12 50 36" fill="#a8b0ff" opacity="0.4" stroke="#a8b0ff" stroke-width="3"/>
  <ellipse cx="32" cy="40" rx="16" ry="6" fill="#a8b0ff"/>
</svg>`,

    // 兜底：星星
    _default: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M32 12 L37 27 L52 27 L40 36 L45 51 L32 42 L19 51 L24 36 L12 27 L27 27 Z"
        fill="#a8b0ff" opacity="0.9"/>
</svg>`,
  };

  // —— 主匹配函数 ——
  function match(name) {
    if (!name) return '_default';
    const n = String(name).toLowerCase();
    for (const [iconKey, kws] of Object.entries(KW)) {
      for (const kw of kws) {
        if (n.includes(kw.toLowerCase())) return iconKey;
      }
    }
    return '_default';
  }

  function svg(name) {
    const key = match(name);
    return (SVG[key] || SVG._default)();
  }

  function emoji(name) {
    return ({
      chargebar: '⚡', key: '🗝', earphone: '🎧', book: '📖', plush: '🧸',
      umbrella: '☂', phone: '📱', wallet: '👛', cup: '🥤', glasses: '👓',
      bag: '🎒', watch: '⌚', pen: '✒', card: '💳', food: '🍱',
      pet: '🐱', money: '💰', sock: '🧦', headset: '🪖',
      _default: '✨',
    })[match(name)] || '✨';
  }

  return { match, svg, emoji };
})();
