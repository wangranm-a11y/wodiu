/* ==========================================================
   星图 —— 把记录散布到深色宇宙里
   每条记录 = 一颗星 = 物品图标 + 状态光晕
   ========================================================== */

window.STARMAP = (function () {

  // 用伪随机生成稳定坐标（按 id hash），保证每次渲染位置一致
  function pseudo(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = ((h << 5) - h) + seed.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function pos(id, idx, total) {
    const h = pseudo(id);
    // 用 id 哈希 + 索引混合，避免重叠
    const x = ((h % 1000) / 1000) * 76 + 12;       // 12% - 88%
    const y = (((h >> 10) % 1000) / 1000) * 70 + 14; // 14% - 84%
    return { x, y };
  }

  function sizeFor(weight) {
    return weight === 3 ? 56 : weight === 2 ? 44 : 34;
  }

  function statusClass(r) {
    if (r.status === 'incensed') return 'incensed';
    if (r.status === 'healed') return 'healed';
    if (r.status === 'found') return 'found';
    if (r.status === 'searching') return 'searching';
    return 'released';
  }

  function render(frame, records, onTap) {
    if (!frame) return;
    // 清掉旧星点（保留 bg / floater）
    Array.from(frame.querySelectorAll('.star')).forEach(s => s.remove());

    if (!records.length) {
      // 空态：在中央放一句话
      const empty = document.createElement('div');
      empty.className = 'star empty-hint';
      empty.style.cssText = 'left:50%;top:50%;width:auto;height:auto;color:rgba(240,238,248,0.4);font-size:13px;text-align:center;cursor:default;letter-spacing:0.5px;';
      empty.innerHTML = '这里还没有星星<br><span style="opacity:0.6;font-size:11px">这是好事</span>';
      frame.appendChild(empty);
      return;
    }

    records.forEach((r, i) => {
      const p = pos(r.id, i, records.length);
      const s = sizeFor(r.weight);
      const star = document.createElement('div');
      star.className = `star ${statusClass(r)}`;
      star.style.left = p.x + '%';
      star.style.top = p.y + '%';
      star.style.width = s + 'px';
      star.style.height = s + 'px';
      star.dataset.id = r.id;
      star.title = r.name;

      const glow = document.createElement('div');
      glow.className = 'star-glow';
      // 错峰 pulse
      glow.style.animationDelay = ((i % 5) * 0.4) + 's';

      const icon = document.createElement('div');
      icon.className = 'star-icon';
      icon.innerHTML = window.ITEMICON ? window.ITEMICON.svg(r.name) : '✨';

      star.appendChild(glow);
      star.appendChild(icon);
      star.addEventListener('click', () => onTap?.(r.id));
      frame.appendChild(star);
    });
  }

  return { render };
})();
