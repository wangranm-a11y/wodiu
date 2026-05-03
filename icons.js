/* ==========================================================
   物品图标自动匹配 v2 —— 更精致 + 更多分类
   用在：星图星点 / 寻物卡 / 上香榜 / 详情
   ========================================================== */

window.ITEMICON = (function () {

  // —— 关键词到图标 ID 的映射（中英都识别） ——
  const KW = {
    chargebar: ['充电宝', '充电器', '数据线', '插头', '电源', 'charger', 'cable', 'powerbank', 'power bank', 'usb'],
    key:       ['钥匙', '门卡', '磁卡', '门禁', '车钥匙', 'key', 'keys', 'keychain'],
    earphone:  ['耳机', 'AirPods', '蓝牙耳机', '蓝牙', '降噪', 'earphone', 'earbud', 'headphone', 'airpods'],
    book:      ['书', '课本', '笔记本', '日记', '本子', '杂志', '小说', '教材', 'book', 'textbook', 'notebook', 'journal', 'diary'],
    plush:     ['娃娃', '玩具', '公仔', '玩偶', '熊', '布偶', '毛绒', 'doll', 'plush', 'plushie', 'teddy', 'stuffed', 'toy'],
    umbrella:  ['伞', '雨伞', '阳伞', '太阳伞', 'umbrella', 'parasol'],
    phone:     ['手机', 'iPhone', '安卓', 'Android', '电话', 'phone', 'mobile', 'cellphone'],
    wallet:    ['钱包', '卡包', '信用卡', '银行卡', '身份证', '驾照', 'wallet', 'purse', 'card holder', 'license'],
    cup:       ['水杯', '保温杯', '杯子', '水壶', '马克杯', '水瓶', 'cup', 'mug', 'bottle', 'thermos', 'flask'],
    glasses:   ['眼镜', '墨镜', '太阳镜', '近视镜', 'glasses', 'sunglasses', 'spectacles'],
    bag:       ['包', '背包', '书包', '提包', '挎包', '手提袋', 'bag', 'backpack', 'tote', 'handbag', 'satchel'],
    watch:     ['手表', '腕表', '智能手表', 'Apple Watch', 'watch', 'wristwatch', 'smartwatch'],
    pen:       ['笔', '钢笔', '签字笔', '马克笔', '铅笔', 'pen', 'pencil', 'marker', 'highlighter'],
    card:      ['饭卡', '校园卡', '学子卡', '一卡通', '公交卡', '地铁卡', 'transit card', 'metro card', 'student card', 'meal card'],
    food:      ['饭', '便当', '咖啡', '奶茶', '零食', 'lunch', 'food', 'coffee', 'tea', 'snack'],
    pet:       ['猫', '狗', '宠物', 'cat', 'dog', 'pet', 'kitten', 'puppy'],
    money:     ['钱', '现金', '红包', 'money', 'cash', 'bill'],
    clothes:   ['衣服', '外套', '裤子', 'T恤', 'tshirt', 't-shirt', 'shirt', 'jacket', 'coat', 'pants', 'sweater'],
    sock:      ['袜子', '内裤', 'sock', 'socks', 'underwear'],
    hat:       ['帽子', '头盔', 'hat', 'cap', 'helmet', 'beanie'],
    scarf:     ['围巾', '丝巾', 'scarf'],
    camera:    ['相机', '摄像机', 'camera', 'gopro', 'lens'],
    music:     ['音箱', '音响', 'speaker', '吉他', 'guitar', 'piano'],
    ring:      ['戒指', '项链', '手链', '首饰', 'ring', 'necklace', 'bracelet', 'jewelry'],
    laptop:    ['电脑', '笔记本电脑', 'mac', 'macbook', 'laptop', 'computer'],
    document:  ['文件', '合同', '证件', 'document', 'paper', 'file', 'contract'],
    medicine:  ['药', '药盒', 'medicine', 'pill', 'medication'],
    plant:     ['植物', '花', '盆栽', 'plant', 'flower', 'pot'],
  };

  // —— SVG 图标库 v2：更精致、更萌、更协调 ——
  // 统一调色板：
  //   主色 #a8b0ff 紫雾（与丢丢同系）
  //   暗色 #7d86d6 / #5e6abf
  //   亮点 #fff8b8
  //   粉点缀 #ff9aaa
  const SVG = {
    chargebar: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="cb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8b0ff"/><stop offset="1" stop-color="#7d86d6"/></linearGradient></defs>
  <rect x="14" y="20" width="32" height="34" rx="6" fill="url(#cb)"/>
  <rect x="22" y="14" width="16" height="6" rx="2" fill="#5e6abf"/>
  <rect x="20" y="48" width="24" height="3" rx="1.5" fill="#5e6abf" opacity="0.5"/>
  <path d="M28 28 L36 28 L31 38 L40 38 L26 50 L31 40 L24 40 Z" fill="#fff8b8" stroke="#5e6abf" stroke-width="0.8" stroke-linejoin="round"/>
</svg>`,

    key: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <circle cx="22" cy="32" r="11" fill="none" stroke="#a8b0ff" stroke-width="4.5"/>
  <circle cx="22" cy="32" r="3.5" fill="#a8b0ff"/>
  <circle cx="22" cy="32" r="1.4" fill="#1a1830"/>
  <line x1="32" y1="32" x2="54" y2="32" stroke="#a8b0ff" stroke-width="4.5" stroke-linecap="round"/>
  <line x1="44" y1="32" x2="44" y2="40" stroke="#a8b0ff" stroke-width="4.5" stroke-linecap="round"/>
  <line x1="50" y1="32" x2="50" y2="38" stroke="#a8b0ff" stroke-width="4.5" stroke-linecap="round"/>
</svg>`,

    earphone: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 36 Q12 14 32 14 Q52 14 52 36" fill="none" stroke="#a8b0ff" stroke-width="4" stroke-linecap="round"/>
  <rect x="8" y="32" width="14" height="20" rx="6" fill="#a8b0ff"/>
  <rect x="42" y="32" width="14" height="20" rx="6" fill="#a8b0ff"/>
  <ellipse cx="15" cy="42" rx="3" ry="4" fill="#fff8b8" opacity="0.4"/>
  <ellipse cx="49" cy="42" rx="3" ry="4" fill="#fff8b8" opacity="0.4"/>
</svg>`,

    book: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 12 Q32 8 54 12 L54 50 Q32 46 10 50 Z" fill="#a8b0ff"/>
  <path d="M32 11 L32 47" stroke="#5e6abf" stroke-width="1.2"/>
  <path d="M14 18 L28 17" stroke="#fff" stroke-width="1.2" opacity="0.6"/>
  <path d="M14 24 L28 23" stroke="#fff" stroke-width="1.2" opacity="0.6"/>
  <path d="M14 30 L26 29" stroke="#fff" stroke-width="1.2" opacity="0.5"/>
  <path d="M36 17 L50 18" stroke="#fff" stroke-width="1.2" opacity="0.6"/>
  <path d="M36 23 L50 24" stroke="#fff" stroke-width="1.2" opacity="0.6"/>
  <path d="M36 29 L48 30" stroke="#fff" stroke-width="1.2" opacity="0.5"/>
</svg>`,

    plush: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="38" r="20" fill="#f5b8d8"/>
  <circle cx="20" cy="20" r="7" fill="#f5b8d8"/>
  <circle cx="44" cy="20" r="7" fill="#f5b8d8"/>
  <circle cx="20" cy="20" r="3" fill="#e2b8ff"/>
  <circle cx="44" cy="20" r="3" fill="#e2b8ff"/>
  <ellipse cx="25" cy="36" rx="2.5" ry="3" fill="#1a1830"/>
  <ellipse cx="39" cy="36" rx="2.5" ry="3" fill="#1a1830"/>
  <circle cx="26" cy="35" r="0.8" fill="#fff"/>
  <circle cx="40" cy="35" r="0.8" fill="#fff"/>
  <ellipse cx="32" cy="42" rx="3" ry="2" fill="#1a1830" opacity="0.7"/>
  <path d="M28 46 Q32 50 36 46" stroke="#1a1830" stroke-width="1.4" stroke-linecap="round" fill="none"/>
  <ellipse cx="14" cy="42" rx="2.5" ry="2" fill="#ff9aaa" opacity="0.55"/>
  <ellipse cx="50" cy="42" rx="2.5" ry="2" fill="#ff9aaa" opacity="0.55"/>
</svg>`,

    umbrella: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 32 Q32 6 56 32 Z" fill="#a8b0ff"/>
  <path d="M8 32 Q14 28 20 32" fill="#7d86d6" opacity="0.55"/>
  <path d="M20 32 Q26 28 32 32" fill="#7d86d6" opacity="0.4"/>
  <path d="M32 32 Q38 28 44 32" fill="#7d86d6" opacity="0.55"/>
  <path d="M44 32 Q50 28 56 32" fill="#7d86d6" opacity="0.4"/>
  <line x1="32" y1="32" x2="32" y2="50" stroke="#a8b0ff" stroke-width="3.5"/>
  <path d="M32 50 Q32 56 38 56" stroke="#a8b0ff" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <circle cx="32" cy="32" r="2" fill="#5e6abf"/>
</svg>`,

    phone: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="8" width="24" height="48" rx="6" fill="#a8b0ff"/>
  <rect x="22" y="14" width="20" height="32" rx="2" fill="#1a1830" opacity="0.55"/>
  <rect x="26" y="18" width="12" height="3" fill="#fff8b8" opacity="0.65"/>
  <circle cx="32" cy="51" r="2.2" fill="#fff" opacity="0.85"/>
  <rect x="28" y="11" width="8" height="1.4" rx="0.7" fill="#5e6abf"/>
</svg>`,

    wallet: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 18 Q10 14 14 14 L50 14 Q54 14 54 18 L54 48 Q54 52 50 52 L14 52 Q10 52 10 48 Z" fill="#a8b0ff"/>
  <rect x="36" y="28" width="20" height="12" rx="2" fill="#7d86d6"/>
  <circle cx="46" cy="34" r="2.5" fill="#fff8b8"/>
  <line x1="14" y1="22" x2="32" y2="22" stroke="#fff" stroke-width="1" opacity="0.5"/>
</svg>`,

    cup: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 12 L18 50 Q18 56 24 56 L36 56 Q42 56 42 50 L42 12 Z" fill="#a8b0ff"/>
  <path d="M42 22 Q52 22 52 32 Q52 42 42 42" stroke="#a8b0ff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="30" cy="14" rx="12" ry="3" fill="#7d86d6"/>
  <ellipse cx="30" cy="14" rx="11" ry="2.4" fill="#5e6abf"/>
  <path d="M22 24 Q22 18 24 16" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
</svg>`,

    glasses: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="34" r="11" fill="rgba(168,176,255,0.30)" stroke="#a8b0ff" stroke-width="3"/>
  <circle cx="44" cy="34" r="11" fill="rgba(168,176,255,0.30)" stroke="#a8b0ff" stroke-width="3"/>
  <line x1="30" y1="34" x2="34" y2="34" stroke="#a8b0ff" stroke-width="3" stroke-linecap="round"/>
  <path d="M9 32 Q5 28 6 22" stroke="#a8b0ff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M55 32 Q59 28 58 22" stroke="#a8b0ff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M14 30 Q18 28 22 30" stroke="#fff" stroke-width="1.4" opacity="0.5" fill="none"/>
  <path d="M38 30 Q42 28 46 30" stroke="#fff" stroke-width="1.4" opacity="0.5" fill="none"/>
</svg>`,

    bag: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 18 Q22 8 32 8 Q42 8 42 18" stroke="#a8b0ff" stroke-width="3.5" fill="none"/>
  <path d="M10 18 L54 18 Q54 18 56 22 L52 54 Q52 58 48 58 L16 58 Q12 58 12 54 L8 22 Q10 18 10 18 Z" fill="#a8b0ff"/>
  <rect x="28" y="26" width="8" height="14" rx="2" fill="#5e6abf" opacity="0.55"/>
  <rect x="29" y="32" width="6" height="2" fill="#fff8b8"/>
</svg>`,

    watch: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="22" y="22" width="20" height="20" rx="4" fill="#a8b0ff"/>
  <rect x="24" y="8" width="16" height="14" rx="3" fill="#7d86d6"/>
  <rect x="24" y="42" width="16" height="14" rx="3" fill="#7d86d6"/>
  <circle cx="32" cy="32" r="6" fill="#1a1830"/>
  <line x1="32" y1="32" x2="32" y2="27" stroke="#fff8b8" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="32" y1="32" x2="36" y2="32" stroke="#fff8b8" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="32" cy="32" r="1.2" fill="#fff"/>
</svg>`,

    pen: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 50 L46 18 L52 24 L20 56 Z" fill="#a8b0ff"/>
  <path d="M44 16 L50 10 L54 14 L48 20 Z" fill="#5e6abf"/>
  <path d="M14 50 L20 56 L11 58 Z" fill="#1a1830"/>
  <line x1="20" y1="44" x2="42" y2="22" stroke="#fff" stroke-width="0.8" opacity="0.4"/>
</svg>`,

    card: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="16" width="52" height="32" rx="4" fill="#a8b0ff"/>
  <rect x="6" y="22" width="52" height="6" fill="#7d86d6"/>
  <rect x="12" y="36" width="14" height="3" rx="1" fill="#fff" opacity="0.65"/>
  <rect x="12" y="41" width="22" height="2" rx="1" fill="#fff" opacity="0.45"/>
  <rect x="42" y="34" width="12" height="9" rx="1.5" fill="#fff8b8"/>
  <line x1="44" y1="37" x2="52" y2="37" stroke="#5e6abf" stroke-width="0.8"/>
  <line x1="44" y1="40" x2="52" y2="40" stroke="#5e6abf" stroke-width="0.8"/>
</svg>`,

    food: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 30 L50 30 Q50 50 32 50 Q14 50 14 30 Z" fill="#a8b0ff"/>
  <path d="M50 32 Q56 32 56 38 Q56 44 50 44" stroke="#a8b0ff" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="32" cy="30" rx="18" ry="3" fill="#7d86d6"/>
  <path d="M22 20 Q22 14 24 12" stroke="#fff8b8" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.85"/>
  <path d="M30 20 Q30 14 32 12" stroke="#fff8b8" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.85"/>
  <path d="M38 20 Q38 14 40 12" stroke="#fff8b8" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.85"/>
</svg>`,

    pet: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="32" cy="38" rx="20" ry="18" fill="#a8b0ff"/>
  <path d="M14 26 L18 14 L22 26 Z" fill="#a8b0ff"/>
  <path d="M42 26 L46 14 L50 26 Z" fill="#a8b0ff"/>
  <path d="M16 22 L18 16 L20 22 Z" fill="#ff9aaa"/>
  <path d="M44 22 L46 16 L48 22 Z" fill="#ff9aaa"/>
  <ellipse cx="25" cy="36" rx="2.5" ry="3" fill="#1a1830"/>
  <ellipse cx="39" cy="36" rx="2.5" ry="3" fill="#1a1830"/>
  <circle cx="26" cy="35" r="0.8" fill="#fff"/>
  <circle cx="40" cy="35" r="0.8" fill="#fff"/>
  <path d="M30 42 L34 42 L32 45 Z" fill="#1a1830" opacity="0.85"/>
  <path d="M28 47 Q32 50 36 47" stroke="#1a1830" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <ellipse cx="16" cy="42" rx="2.5" ry="2" fill="#ff9aaa" opacity="0.55"/>
  <ellipse cx="48" cy="42" rx="2.5" ry="2" fill="#ff9aaa" opacity="0.55"/>
</svg>`,

    money: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="20" width="52" height="24" rx="3" fill="#9fc795"/>
  <rect x="6" y="20" width="52" height="24" rx="3" fill="none" stroke="#5a8b6b" stroke-width="1" stroke-dasharray="2 2" opacity="0.45"/>
  <circle cx="32" cy="32" r="9" fill="none" stroke="#fff" stroke-width="1.5"/>
  <text x="32" y="36.5" text-anchor="middle" font-family="-apple-system,Helvetica" font-size="13" font-weight="700" fill="#fff">¥</text>
  <circle cx="14" cy="28" r="1.2" fill="#5a8b6b" opacity="0.5"/>
  <circle cx="50" cy="36" r="1.2" fill="#5a8b6b" opacity="0.5"/>
</svg>`,

    clothes: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 12 L18 6 Q14 8 8 12 L4 22 L14 26 L14 54 Q14 56 16 56 L48 56 Q50 56 50 54 L50 26 L60 22 L56 12 Q50 8 46 6 L42 12 Q36 18 32 18 Q28 18 22 12 Z"
        fill="#a8b0ff"/>
  <path d="M32 18 L32 26" stroke="#7d86d6" stroke-width="1.5"/>
  <line x1="14" y1="34" x2="50" y2="34" stroke="#7d86d6" stroke-width="0.8" opacity="0.4"/>
</svg>`,

    sock: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 8 L22 36 Q22 42 18 46 L14 50 Q12 54 16 56 L42 56 Q46 56 46 52 L46 36 L46 8 Z" fill="#a8b0ff"/>
  <line x1="22" y1="14" x2="46" y2="14" stroke="#fff" stroke-width="1.2" opacity="0.6"/>
  <line x1="22" y1="20" x2="46" y2="20" stroke="#fff" stroke-width="1.2" opacity="0.55"/>
  <line x1="22" y1="26" x2="46" y2="26" stroke="#fff" stroke-width="1.2" opacity="0.5"/>
  <ellipse cx="42" cy="50" rx="6" ry="2.5" fill="#7d86d6" opacity="0.4"/>
</svg>`,

    hat: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 38 Q14 18 32 18 Q50 18 50 38 Z" fill="#a8b0ff"/>
  <ellipse cx="32" cy="42" rx="26" ry="6" fill="#7d86d6"/>
  <path d="M16 36 Q32 32 48 36" stroke="#5e6abf" stroke-width="1.5" fill="none" opacity="0.55"/>
  <circle cx="32" cy="22" r="2" fill="#ff9aaa"/>
</svg>`,

    scarf: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 12 Q16 8 22 8 L42 8 Q48 8 48 12 L48 28 Q48 32 44 32 L34 32 L34 56 L24 56 L24 32 L20 32 Q16 32 16 28 Z" fill="#a8b0ff"/>
  <line x1="20" y1="14" x2="44" y2="14" stroke="#fff" stroke-width="1.5" opacity="0.5"/>
  <line x1="20" y1="20" x2="44" y2="20" stroke="#fff" stroke-width="1.5" opacity="0.45"/>
  <path d="M24 32 L24 38 L20 42 Z" fill="#7d86d6"/>
  <path d="M34 32 L34 38 L30 42 Z" fill="#7d86d6"/>
</svg>`,

    camera: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="20" width="52" height="34" rx="4" fill="#a8b0ff"/>
  <path d="M22 20 L24 14 L40 14 L42 20 Z" fill="#7d86d6"/>
  <circle cx="32" cy="36" r="11" fill="#5e6abf"/>
  <circle cx="32" cy="36" r="7" fill="#1a1830"/>
  <circle cx="34" cy="34" r="2.5" fill="#fff8b8" opacity="0.7"/>
  <circle cx="48" cy="26" r="1.5" fill="#fff8b8"/>
</svg>`,

    music: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="32" cy="40" rx="18" ry="8" fill="#a8b0ff"/>
  <ellipse cx="32" cy="38" rx="18" ry="8" fill="#7d86d6"/>
  <path d="M40 14 L40 36 Q40 40 36 40 Q32 40 32 36 Q32 32 36 32 Q38 32 40 33" fill="none" stroke="#a8b0ff" stroke-width="3" stroke-linecap="round"/>
  <path d="M40 14 L52 12" stroke="#a8b0ff" stroke-width="3" stroke-linecap="round"/>
</svg>`,

    ring: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="32" cy="42" rx="16" ry="14" fill="none" stroke="#a8b0ff" stroke-width="4"/>
  <path d="M22 22 L32 8 L42 22 L37 28 L27 28 Z" fill="#fff8b8"/>
  <path d="M22 22 L37 28 M42 22 L27 28" stroke="#5e6abf" stroke-width="0.8"/>
  <circle cx="32" cy="22" r="2" fill="#fff"/>
</svg>`,

    laptop: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="14" width="44" height="30" rx="3" fill="#a8b0ff"/>
  <rect x="13" y="17" width="38" height="24" rx="1" fill="#1a1830"/>
  <rect x="6" y="44" width="52" height="6" rx="2" fill="#7d86d6"/>
  <rect x="26" y="46" width="12" height="2" rx="1" fill="#5e6abf"/>
  <circle cx="20" cy="29" r="2.5" fill="#fff8b8" opacity="0.6"/>
</svg>`,

    document: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 8 L40 8 L52 20 L52 56 L14 56 Z" fill="#a8b0ff"/>
  <path d="M40 8 L40 20 L52 20" fill="#7d86d6" stroke="#5e6abf" stroke-width="1"/>
  <line x1="20" y1="30" x2="44" y2="30" stroke="#fff" stroke-width="1.2" opacity="0.6"/>
  <line x1="20" y1="36" x2="44" y2="36" stroke="#fff" stroke-width="1.2" opacity="0.55"/>
  <line x1="20" y1="42" x2="38" y2="42" stroke="#fff" stroke-width="1.2" opacity="0.5"/>
  <line x1="20" y1="48" x2="42" y2="48" stroke="#fff" stroke-width="1.2" opacity="0.45"/>
</svg>`,

    medicine: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="32" cy="32" rx="22" ry="14" fill="#a8b0ff" transform="rotate(-30, 32, 32)"/>
  <path d="M22 22 L42 42" stroke="#5e6abf" stroke-width="1" transform="rotate(-30, 32, 32)"/>
  <ellipse cx="32" cy="32" rx="22" ry="14" fill="#ff9aaa" clip-path="inset(0 0 50% 0)" transform="rotate(-30, 32, 32)"/>
  <ellipse cx="32" cy="32" rx="22" ry="14" fill="none" stroke="#5e6abf" stroke-width="1" transform="rotate(-30, 32, 32)"/>
</svg>`,

    plant: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 44 L20 56 L44 56 L48 44 Z" fill="#a8b0ff"/>
  <rect x="14" y="42" width="36" height="4" rx="1" fill="#7d86d6"/>
  <path d="M32 42 Q24 32 18 28 Q24 28 28 32 Q26 24 30 18 Q32 24 32 30 Q36 24 40 22 Q40 30 36 32 Q44 30 48 28 Q42 34 32 42 Z" fill="#7fc5a0"/>
  <circle cx="30" cy="22" r="2" fill="#ff9aaa"/>
</svg>`,

    // 兜底：可爱的小问号气泡
    _default: () => `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="30" r="22" fill="#a8b0ff" opacity="0.85"/>
  <path d="M52 46 L46 50 L42 44 Z" fill="#a8b0ff" opacity="0.85"/>
  <text x="32" y="38" text-anchor="middle" font-family="-apple-system,Helvetica" font-size="22" font-weight="700" fill="#fff">?</text>
  <circle cx="22" cy="22" r="3" fill="#fff8b8" opacity="0.65"/>
</svg>`,
  };

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
      pet: '🐱', money: '💰', sock: '🧦', hat: '🧢', scarf: '🧣',
      camera: '📷', music: '🎵', ring: '💍', laptop: '💻',
      document: '📄', medicine: '💊', plant: '🪴', clothes: '👕',
      _default: '✨',
    })[match(name)] || '✨';
  }

  return { match, svg, emoji };
})();
