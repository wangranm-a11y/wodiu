/* ==========================================================
   疗愈纪念卡 (Heal Memorial Card)
   • 暖蓝紫渐变底（区别于寻物卡的暖粉）
   • 丢丢 happy 姿态（已经告别了，温柔的笑）
   • 物品名 · 时间 · 地点 · 墓志铭
   • 漂亮 · 适合分享朋友圈
   ========================================================== */

window.HEALCARD = (function () {
  let cv, ctx;

  function init() {
    cv = document.getElementById('healCanvas');
    if (!cv) return false;
    ctx = cv.getContext('2d');
    return true;
  }

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

  async function render(data) {
    if (!cv && !init()) return;
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);

    // ============ 背景：温柔薰衣草 + 米白渐变（适合纪念）============
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1e1b3a');
    bg.addColorStop(0.5, '#2a2552');
    bg.addColorStop(1, '#1e1b3a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 顶部柔和金光晕
    const halo = ctx.createRadialGradient(W / 2, 100, 0, W / 2, 100, 480);
    halo.addColorStop(0, 'rgba(245,166,35,0.18)');
    halo.addColorStop(1, 'rgba(245,166,35,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    // 散落星点
    drawScatteredStars(ctx, W, H);

    // ============ 双线虚框 ============
    drawDecorFrame(ctx, 28, 28, W - 56, H - 56);

    // ============ Header ============
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#cdd0ff';
    ctx.font = 'italic 600 24px "Songti SC", "Noto Serif SC", Georgia, serif';
    ctx.fillText('✦   纪 念 卡   ✦', W / 2, 92);

    // 副标
    ctx.fillStyle = 'rgba(244,240,232,0.55)';
    ctx.font = "500 13px 'SF Mono', Menlo, monospace";
    ctx.fillText('IN  MEMORY  OF', W / 2, 122);

    // 中分线
    drawSparkleLine(ctx, 130, 152, W - 260);

    // ============ 丢丢（happy）+ 衬光 ============
    try {
      const svg = window.DIU ? window.DIU.svg('happy', 'happy', 220) : null;
      if (svg) {
        const img = await svgToImage(svg);
        // 衬底光晕
        const cx = W / 2, cy = 280;
        const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, 160);
        aura.addColorStop(0, 'rgba(245,166,35,0.30)');
        aura.addColorStop(1, 'rgba(245,166,35,0)');
        ctx.fillStyle = aura;
        ctx.fillRect(cx - 200, cy - 200, 400, 400);
        ctx.drawImage(img, cx - 110, cy - 110, 220, 220);
      }
    } catch (e) {}

    // ============ 物品名（巨大斜体）============
    let y = 460;
    ctx.fillStyle = '#f4f0e8';
    ctx.font = 'italic 700 50px "Songti SC", "Noto Serif SC", Georgia, serif';
    const name = (data.name || '它').slice(0, 18);
    ctx.fillText(`「${name}」`, W / 2, y);
    y += 60;

    // 子标
    ctx.fillStyle = 'rgba(244,240,232,0.55)';
    ctx.font = "italic 16px 'Songti SC', 'PingFang SC', serif";
    ctx.fillText('已安家在你的星图里', W / 2, y);
    y += 50;

    // ============ 时间 + 地点 (mono) ============
    if (data.lostWhen || data.lostWhere) {
      ctx.font = "500 13px 'SF Mono', Menlo, monospace";
      ctx.fillStyle = 'rgba(244,240,232,0.45)';
      const parts = [];
      if (data.lostWhen) parts.push(formatLostWhen(data.lostWhen));
      if (data.lostWhere) parts.push(data.lostWhere.slice(0, 24));
      ctx.fillText(parts.join('  ·  '), W / 2, y);
      y += 36;
    }

    // 装饰短线
    drawSparkleLine(ctx, W / 2 - 80, y + 6, 160);
    y += 28;

    // ============ 墓志铭文字（手写体感）============
    if (data.epitaph && data.epitaph.trim()) {
      ctx.fillStyle = '#f4f0e8';
      ctx.font = "italic 19px 'Songti SC', 'PingFang SC', serif";
      const lines = wrapText(ctx, data.epitaph.trim(), W - 200, 32, 6);
      lines.forEach(line => {
        ctx.fillText(line, W / 2, y);
        y += 32;
      });
      y += 12;
    } else {
      // 没写墓志铭 → 用通用告别文案
      ctx.fillStyle = 'rgba(244,240,232,0.65)';
      ctx.font = "italic 17px 'Songti SC', 'PingFang SC', serif";
      ctx.fillText('它走得轻，', W / 2, y); y += 28;
      ctx.fillText('但它在我这里有过位置。', W / 2, y); y += 40;
    }

    // 装饰星
    drawDeco(ctx, W);

    // ============ 底部：印章 + 落款 ============
    const footY = H - 130;
    ctx.save();
    ctx.translate(W - 110, footY + 30);
    ctx.rotate(-0.10);
    ctx.fillStyle = 'rgba(245,166,35,0.18)';
    ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(245,166,35,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#f5a623';
    ctx.font = 'bold 22px "Songti SC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('我丢', 0, -6);
    ctx.font = "500 9px 'SF Mono', monospace";
    const sealDate = formatSealDate(data.sealedAt || Date.now());
    ctx.fillText(sealDate, 0, 14);
    ctx.restore();

    // 左下落款
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(244,240,232,0.85)';
    ctx.font = "italic 18px 'Songti SC', 'PingFang SC', serif";
    ctx.fillText('— 由「我丢」封存', 80, footY + 12);
    ctx.fillStyle = 'rgba(244,240,232,0.42)';
    ctx.font = "400 12px 'Songti SC', 'PingFang SC', serif";
    ctx.fillText('丢失的每一件东西，都成了你的星图', 80, footY + 42);
    ctx.font = "500 11px 'SF Mono', monospace";
    ctx.fillStyle = 'rgba(244,240,232,0.40)';
    ctx.fillText('#我丢  #疗愈  #星图', 80, footY + 70);
  }

  // ====== Helpers ======
  function formatLostWhen(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }
  function formatSealDate(ts) {
    const d = new Date(ts);
    return `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }

  function drawScatteredStars(c, W, H) {
    const stars = [
      [80, 80, 1.4], [220, 130, 1], [350, 60, 1.6], [540, 110, 1],
      [620, 200, 1.4], [80, 280, 1], [110, 580, 1.4], [560, 620, 1],
      [620, 950, 1], [80, 980, 1.2],
    ];
    c.save();
    stars.forEach(([x, y, r]) => {
      c.fillStyle = `rgba(255,255,255,${0.4 + r * 0.2})`;
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    });
    c.restore();
  }

  function drawDecorFrame(c, x, y, w, h) {
    c.strokeStyle = 'rgba(244,240,232,0.30)';
    c.lineWidth = 2;
    roundedRect(c, x, y, w, h, 18);
    c.stroke();
    c.strokeStyle = 'rgba(244,240,232,0.14)';
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

  function drawSparkleLine(c, x, y, w) {
    c.save();
    c.strokeStyle = 'rgba(245,166,35,0.40)';
    c.lineWidth = 1;
    c.setLineDash([2, 4]);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke();
    c.restore();
    // 中间一颗小星
    c.save();
    c.fillStyle = '#f5a623';
    drawStar(c, x + w / 2, y, 4);
    c.restore();
  }
  function drawStar(c, cx, cy, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.45;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.closePath();
    c.fill();
  }

  function drawDeco(c, W) {
    c.save();
    c.fillStyle = 'rgba(245,166,35,0.45)';
    drawStar(c, 80, 200, 4);
    drawStar(c, W - 80, 200, 4);
    drawStar(c, 80, 880, 3);
    drawStar(c, W - 80, 880, 3);
    c.restore();
  }

  // 中文换行：按字符宽度+最大行数限制
  function wrapText(c, text, maxWidth, lineHeight, maxLines) {
    const chars = String(text).split('');
    const lines = []; let line = '';
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (c.measureText(test).width > maxWidth && line) {
        lines.push(line);
        if (lines.length >= maxLines - 1) {
          // 把剩下的全塞最后一行（带省略）
          let rest = chars.slice(i).join('');
          while (c.measureText(rest + '…').width > maxWidth && rest.length > 1) rest = rest.slice(0, -1);
          lines.push(rest + (chars.slice(i).join('').length > rest.length ? '…' : ''));
          return lines;
        }
        line = chars[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function toBlob() {
    return new Promise(resolve => cv.toBlob(b => resolve(b), 'image/png', 0.95));
  }

  async function save(filename = 'wodiu-memorial.png') {
    const blob = await toBlob(); if (!blob) return false;
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
    const file = new File([blob], `wodiu-memorial-${Date.now()}.png`, { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `「${name || ''}」的纪念卡`,
          text: `它已经在我的星图里了。— 我丢`,
          files: [file],
        });
        return { ok: true };
      }
      if (navigator.share) {
        await navigator.share({
          title: '纪念卡',
          text: `「${name || ''}」已经在我的星图里了。`,
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
