/* ==========================================================
   寻物卡 v2 —— 漂亮 · 暖心 · 易分享
   • 丢丢 + 用户照片（可选）
   • 大字物品名 + 丢丢的求助语
   • 暖奶油底 + 珊瑚粉点缀，朋友圈友好
   ========================================================== */

window.FINDCARD = (function () {
  let cv, ctx;
  let mascotImg = null;     // 缓存 mascot SVG image

  function init() {
    cv = document.getElementById('findCanvas');
    if (!cv) return false;
    ctx = cv.getContext('2d');
    return true;
  }

  // —— 把 SVG 字符串转成 HTMLImageElement ——
  function svgToImage(svgString) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
  }

  // —— dataURL/URL 转 image ——
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // —— 主渲染（async） ——
  async function render(data) {
    if (!cv && !init()) return;
    const W = cv.width, H = cv.height; // 720 × 1080
    ctx.clearRect(0, 0, W, H);

    // ============ 背景：暖奶油渐变 + 顶部柔粉光晕 ============
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#fff5ee');
    bg.addColorStop(0.6, '#ffeee4');
    bg.addColorStop(1, '#ffe0d0');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 左上柔粉光
    const halo1 = ctx.createRadialGradient(120, 80, 0, 120, 80, 380);
    halo1.addColorStop(0, 'rgba(255,138,156,0.32)');
    halo1.addColorStop(1, 'rgba(255,138,156,0)');
    ctx.fillStyle = halo1;
    ctx.fillRect(0, 0, W, H);

    // 右下柔薰衣草光
    const halo2 = ctx.createRadialGradient(W - 100, H - 100, 0, W - 100, H - 100, 360);
    halo2.addColorStop(0, 'rgba(168,176,255,0.20)');
    halo2.addColorStop(1, 'rgba(168,176,255,0)');
    ctx.fillStyle = halo2;
    ctx.fillRect(0, 0, W, H);

    // ============ 外框：双线虚框 ============
    drawDecorFrame(ctx, 28, 28, W - 56, H - 56);

    // ============ 装饰星 ============
    ctx.fillStyle = 'rgba(255,138,156,0.5)';
    drawStar(ctx, 80, 110, 5);
    drawStar(ctx, W - 80, 110, 4);
    drawStar(ctx, 80, H - 200, 4);
    drawStar(ctx, W - 80, H - 240, 5);

    // ============ Header ============
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1f1d1a';
    ctx.font = 'italic 600 28px "Songti SC", "Noto Serif SC", Georgia, serif';
    ctx.fillText('✦   寻 物 启 事   ✦', W / 2, 100);

    // 日期 (mono)
    const d = new Date(data.createdAt || Date.now());
    const ts = `${d.getFullYear()} · ${pad(d.getMonth() + 1)} · ${pad(d.getDate())}`;
    ctx.fillStyle = '#a89e8a';
    ctx.font = '500 16px "SF Mono", Menlo, monospace';
    ctx.fillText(ts, W / 2, 138);

    // 顶部细线
    drawDottedLine(ctx, 100, 168, W - 200, '#b8a896');

    // ============ 视觉区：丢丢始终在场 ============
    const visualY = 195;
    const visualH = 340;

    if (data.photo) {
      // —— 有照片：宝丽来风照片 + 丢丢在角落举着 + 小气泡 ——
      try {
        const photoImg = await loadImage(data.photo);
        await drawPolaroidWithMascot(ctx, photoImg, W / 2 - 30, visualY + 30, 320, 240);
      } catch (e) {
        await drawMascot(ctx, W / 2 - 130, visualY + 20, 260);
      }
    } else {
      // —— 无照片：丢丢居中 ——
      await drawMascot(ctx, W / 2 - 130, visualY + 20, 260);
    }

    // ============ 「我丢了」小标签 + 巨大物品名 ============
    // 小标签紧贴视觉区下方
    const labelY = visualY + visualH + 36;
    ctx.font = '300 18px "Songti SC", "PingFang SC", serif';
    ctx.fillStyle = '#b8a896';
    ctx.textAlign = 'center';
    ctx.fillText('我丢了', W / 2, labelY);

    // 巨大物品名
    let y = labelY + 56;
    ctx.fillStyle = '#1f1d1a';
    ctx.font = 'bold italic 52px "Songti SC", "Noto Serif SC", Georgia, serif';
    const name = (data.name || '一件不知名的小东西').slice(0, 20);
    ctx.fillText(`「${name}」`, W / 2, y);
    y += 56;

    // ============ 丢丢的求助语（手写感斜体） ============
    ctx.font = 'italic 22px "Songti SC", "PingFang SC", serif';
    ctx.fillStyle = '#5a4f44';
    ctx.fillText('如果有好心人看到，', W / 2, y);
    y += 32;
    ctx.fillText('能把它还回来吗？', W / 2, y);
    y += 26;

    // 落款：— 圆滚滚的丢丢说
    ctx.font = '14px "Songti SC", "PingFang SC", serif';
    ctx.fillStyle = '#ff8a9c';
    ctx.fillText('— 圆滚滚的丢丢说', W / 2, y);
    y += 40;

    // 中部细线
    drawDottedLine(ctx, 140, y, W - 280, '#d8c8b6');
    y += 28;

    // ============ 字段（左对齐，标签在左 → 值在右） ============
    const drawField = (label, val) => {
      if (!val || val.trim() === '') return;
      const labelW = 80;
      ctx.textAlign = 'left';
      ctx.font = '500 13px "SF Mono", Menlo, monospace';
      ctx.fillStyle = '#a89e8a';
      ctx.fillText(label, 110, y);
      ctx.font = '400 19px "Songti SC", "PingFang SC", serif';
      ctx.fillStyle = '#1f1d1a';
      const lines = wrapText(ctx, val, 110 + labelW + 12, y, W - 250 - labelW, 28, true);
      const used = Math.max(28, lines.length * 28);
      y += used + 12;
    };
    drawField('地点 / WHERE', data.place);
    drawField('特征 / DESC',  data.desc);
    drawField('联系 / CONTACT', data.contact);

    // ============ 底部：印章 + 落款 ============
    const footY = H - 130;
    // 红印章圆
    ctx.save();
    ctx.translate(W - 110, footY + 30);
    ctx.rotate(-0.10);
    ctx.fillStyle = 'rgba(255,138,156,0.14)';
    ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(238,106,130,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ee6a82';
    ctx.font = 'bold 22px "Songti SC", "Noto Serif SC", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('我丢', 0, -6);
    ctx.font = '500 9px "SF Mono", monospace';
    ctx.fillText('CASE No.' + caseNoOf(d), 0, 14);
    ctx.restore();

    // 左侧落款
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#5a4f44';
    ctx.font = 'italic 20px "Songti SC", "PingFang SC", serif';
    ctx.fillText('— 由「我丢」生成', 80, footY + 12);
    ctx.fillStyle = '#a89e8a';
    ctx.font = '400 13px "Songti SC", "PingFang SC", serif';
    ctx.fillText('转发到朋友圈 · 多一双眼睛多一份希望', 80, footY + 42);
    // 极小 hashtag
    ctx.font = '500 11px "SF Mono", monospace';
    ctx.fillStyle = '#b8a896';
    ctx.fillText('#我丢  #寻物启事', 80, footY + 70);
  }

  // ====== Helpers ======

  function pad(n) { return String(n).padStart(2, '0'); }
  function caseNoOf(d) {
    return `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  }

  // 装饰外框：双线
  function drawDecorFrame(c, x, y, w, h) {
    c.strokeStyle = 'rgba(31,29,26,0.32)';
    c.lineWidth = 2;
    roundedRect(c, x, y, w, h, 18);
    c.stroke();
    c.strokeStyle = 'rgba(31,29,26,0.16)';
    c.lineWidth = 1;
    roundedRect(c, x + 8, y + 8, w - 16, h - 16, 14);
    c.stroke();
  }
  function roundedRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  // 五角星（装饰用）
  function drawStar(c, cx, cy, r) {
    c.save();
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.45;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.closePath();
    c.fill();
    c.restore();
  }

  // 虚线
  function drawDottedLine(c, x, y, w, color) {
    c.save();
    c.strokeStyle = color;
    c.lineWidth = 1;
    c.setLineDash([3, 5]);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + w, y);
    c.stroke();
    c.restore();
  }

  // —— 宝丽来风照片 + 丢丢举在角落 + 小说话框 ——
  async function drawPolaroidWithMascot(c, photoImg, cx, cy, photoW, photoH) {
    const tilt = -0.045;
    // 1) 画宝丽来（白色边框 + 倾斜 + 柔阴影）
    c.save();
    c.translate(cx, cy);
    c.rotate(tilt);

    const padX = 18, padTop = 18, padBottom = 56;
    const frameW = photoW + padX * 2;
    const frameH = photoH + padTop + padBottom;

    c.shadowColor = 'rgba(31,29,26,0.28)';
    c.shadowBlur = 26;
    c.shadowOffsetY = 12;
    c.fillStyle = '#fff';
    roundedRect(c, -frameW / 2, -frameH / 2, frameW, frameH, 6);
    c.fill();
    c.shadowColor = 'transparent';

    // 照片本体（裁切到圆角矩形）
    c.save();
    c.beginPath();
    c.rect(-photoW / 2, -frameH / 2 + padTop, photoW, photoH);
    c.clip();
    const ratio = Math.max(photoW / photoImg.width, photoH / photoImg.height);
    const dw = photoImg.width * ratio, dh = photoImg.height * ratio;
    c.drawImage(photoImg,
      -dw / 2,
      -frameH / 2 + padTop + (photoH - dh) / 2,
      dw, dh);
    c.restore();

    // 宝丽来底部手写"丢失之前"
    c.fillStyle = '#5a4f44';
    c.font = 'italic 18px "Songti SC","PingFang SC",serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('· 丢失之前 ·', 0, -frameH / 2 + padTop + photoH + padBottom / 2);

    // 加一段"胶带"在顶部（米色，半透明）
    c.fillStyle = 'rgba(245,200,138,0.85)';
    c.fillRect(-40, -frameH / 2 - 6, 80, 18);
    c.strokeStyle = 'rgba(0,0,0,0.05)';
    c.strokeRect(-40, -frameH / 2 - 6, 80, 18);

    c.restore();

    // 2) 丢丢从右下方探出来（sad 姿态，蓝白光晕）
    const mSize = 140;
    const mx = cx + frameW / 2 - mSize * 0.45;
    const my = cy + frameH / 2 - mSize * 0.55;
    await drawMascot(c, mx, my, mSize);

    // 3) 小说话框：从丢丢指向照片
    drawCanvasBubble(c, mx + mSize * 0.5, my - 18, '看，是这个');
  }

  // —— 在 canvas 上画一个圆角说话框 + 小三角箭头 ——
  function drawCanvasBubble(c, x, y, text) {
    c.save();
    c.font = 'italic 16px "LXGW WenKai Screen","Songti SC","PingFang SC",serif';
    const padX = 14, padY = 8;
    const tw = c.measureText(text).width;
    const w = tw + padX * 2;
    const h = 16 + padY * 2;
    const r = 14;
    const bx = x - w / 2, by = y - h;

    // 背景白底
    c.shadowColor = 'rgba(31,29,26,0.18)';
    c.shadowBlur = 10;
    c.shadowOffsetY = 4;
    c.fillStyle = '#fff';
    roundedRect(c, bx, by, w, h, r);
    c.fill();
    c.shadowColor = 'transparent';

    // 细边
    c.strokeStyle = 'rgba(31,29,26,0.18)';
    c.lineWidth = 1;
    roundedRect(c, bx, by, w, h, r);
    c.stroke();

    // 小尾巴（向下指）
    const tx = x - w * 0.18;
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(tx - 7, by + h - 1);
    c.lineTo(tx, by + h + 9);
    c.lineTo(tx + 7, by + h - 1);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(31,29,26,0.18)';
    c.beginPath();
    c.moveTo(tx - 7, by + h);
    c.lineTo(tx, by + h + 9);
    c.lineTo(tx + 7, by + h);
    c.stroke();

    // 文字
    c.fillStyle = '#1f1d1a';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, x, by + h / 2);

    c.restore();
  }

  // 渲染丢丢到 canvas（sad 姿态：眼睛半闭 + 委屈眉 + 耳朵塌下）
  async function drawMascot(c, x, y, size) {
    try {
      const svg = window.DIU ? window.DIU.svg('sad', 'sad', size) : null;
      if (!svg) { drawMascotFallback(c, x, y, size); return; }
      const img = await svgToImage(svg);
      // 衬底改用偏冷的蓝白光（心疼感）
      const gx = x + size / 2, gy = y + size * 0.55;
      const halo = c.createRadialGradient(gx, gy, 0, gx, gy, size * 0.6);
      halo.addColorStop(0, 'rgba(205,214,255,0.45)');
      halo.addColorStop(1, 'rgba(205,214,255,0)');
      c.fillStyle = halo;
      c.fillRect(x - 40, y - 40, size + 80, size + 80);
      c.drawImage(img, x, y, size, size);
    } catch (e) {
      drawMascotFallback(c, x, y, size);
    }
  }
  function drawMascotFallback(c, x, y, size) {
    // 简易版：粉色圆形 + 两个眼
    const cx = x + size / 2, cy = y + size / 2;
    c.fillStyle = '#a8b0ff';
    c.beginPath(); c.arc(cx, cy, size * 0.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1f1d1a';
    c.beginPath(); c.arc(cx - size * 0.15, cy - size * 0.05, size * 0.04, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + size * 0.15, cy - size * 0.05, size * 0.04, 0, Math.PI * 2); c.fill();
  }

  // 渲染照片（圆角 + 边框）
  function drawPhotoFramed(c, img, x, y, w, h) {
    c.save();
    // 阴影
    c.shadowColor = 'rgba(31,29,26,0.20)';
    c.shadowBlur = 16; c.shadowOffsetY = 6;
    // 裁切圆角
    roundedRect(c, x, y, w, h, 16);
    c.clip();
    // cover 模式适配
    const ratio = Math.max(w / img.width, h / img.height);
    const dw = img.width * ratio, dh = img.height * ratio;
    const dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;
    c.drawImage(img, dx, dy, dw, dh);
    c.restore();
    // 重画白色边框（在 clip 之外）
    c.save();
    c.shadowColor = 'transparent';
    c.strokeStyle = '#fff';
    c.lineWidth = 4;
    roundedRect(c, x, y, w, h, 16);
    c.stroke();
    c.strokeStyle = 'rgba(31,29,26,0.18)';
    c.lineWidth = 1;
    roundedRect(c, x, y, w, h, 16);
    c.stroke();
    c.restore();
  }

  function wrapText(c, text, x, y, maxWidth, lineHeight, returnLines) {
    const chars = String(text || '').split('');
    let line = ''; let yy = y;
    const lines = [];
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (c.measureText(test).width > maxWidth && line) {
        c.fillText(line, x, yy);
        lines.push(line);
        line = chars[i]; yy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) { c.fillText(line, x, yy); lines.push(line); }
    if (returnLines) return lines;
  }

  function toBlob() {
    return new Promise((resolve) => {
      cv.toBlob(b => resolve(b), 'image/png', 0.95);
    });
  }

  async function save(filename = 'wodiu-find.png') {
    const blob = await toBlob();
    if (!blob) return false;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    return true;
  }

  async function share(name) {
    const blob = await toBlob();
    if (!blob) return { ok: false, reason: 'noblob' };
    const file = new File([blob], `wodiu-find-${Date.now()}.png`, { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `寻物：${name || ''}`,
          text: `我丢了「${name || ''}」，如果有好心人看到，能把它还回来吗？`,
          files: [file],
        });
        return { ok: true };
      }
      if (navigator.share) {
        await navigator.share({
          title: '寻物启事',
          text: `我丢了「${name || ''}」，如果有好心人看到，能把它还回来吗？`,
        });
        return { ok: true, fallback: 'text' };
      }
    } catch (e) {
      if (e?.name === 'AbortError') return { ok: false, reason: 'cancel' };
      return { ok: false, reason: e?.message || 'error' };
    }
    return { ok: false, reason: 'unsupported' };
  }

  return { init, render, save, share, toBlob };
})();
