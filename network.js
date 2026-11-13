/* Local HTML preview: negotiated receive-link speed is supplied, never a browser speed test. */
window.NetworkInspection = (() => {
  const colors = { poor: '#F55B64', medium: '#E8A233', good: '#19C660', scanning: '#FFE1AC' };
  let run = 0;
  let result = null;
  function classify(mbps) {
    if (!Number.isFinite(mbps) || mbps <= 0) return { tier: 'poor', label: '网络较差' };
    if (mbps <= 10) return { tier: 'poor', label: '网络较差' };
    if (mbps >= 1000) return { tier: 'good', label: '网络较好' };
    return { tier: 'medium', label: '网络中等' };
  }
  function mount() {
    for (const wide of [true, false]) {
      const source = document.getElementById(wide ? 'wideS2Screen' : 'operationS2Screen');
      const screen = source.cloneNode(true);
      screen.id = wide ? 'wideNetworkScreen' : 'operationNetworkScreen';
      screen.classList.remove('active');
      screen.classList.add('network-screen');
      screen.setAttribute('aria-label', 'S3 网络检测');
      screen.querySelector('.js-flow-sidebar').dataset.current = 'net';
      const main = screen.querySelector('main');
      const heading = main.querySelector('.flow-heading,.flow-op-heading');
      const progress = main.querySelector('.flow-wide-progress');
      main.replaceChildren(heading);
      heading.querySelector('b').textContent = 'S3';
      heading.querySelector('span').textContent = '网络检测';
      if (wide) {
        const title = document.createElement('h2');
        title.textContent = '正在检查有线链路';
        main.append(title);
      }
      const art = document.createElement('div');
      art.className = 'network-art';
      art.innerHTML = `<img class="network-base" src="assets/svg/network/${wide ? 'wide' : 'op'}-base.svg" width="${wide ? 685 : 603}" height="${wide ? 592 : 525}" alt="环形链路检测仪表盘"><svg class="network-overlay" viewBox="0 0 685 592" aria-hidden="true"><path class="network-arc" fill="none" stroke="#FFE1AC" stroke-width="7" stroke-linecap="round"/><g class="network-pointer"><path d="M-34 0 L25 -5 Q36 0 25 5 Z" fill="#f5f4ef"/></g></svg><div class="network-reading"><strong data-network-value>0</strong><span>有线链路 Mbps</span></div>`;
      main.append(art);
      const center = document.createElement('img');
      center.className = 'network-center';
      center.src = `assets/svg/network/${wide ? 'wide' : 'op'}-center.svg`;
      center.alt = '';
      art.querySelector('.network-reading').before(center);
      const status = document.createElement('p');
      status.className = 'network-status';
      status.setAttribute('data-network-status', '');
      status.setAttribute('aria-live', 'polite');
      status.textContent = '检测中…';
      main.append(status);
      if (progress) main.append(progress);
      source.after(screen);
    }
    const label = document.createElement('label');
    label.textContent = '模拟链路';
    label.innerHTML += '<select id="networkLinkSelect" aria-label="模拟本地接收链路速率"><option value="1000">好 · 1 Gbps</option><option value="100">中等 · 100 Mbps</option><option value="10">差 · 10 Mbps</option></select>';
    document.querySelector('.demo-switch').append(label);
    const previewLink = new URLSearchParams(location.search).get('network');
    if (['10', '100', '1000'].includes(previewLink)) label.querySelector('select').value = previewLink;
    const grid = document.querySelector('.ready-task-grid');
    if (grid) {
      const tile = grid.children[1].cloneNode(true);
      tile.querySelector('strong').textContent = '网络检测';
      grid.children[1].after(tile);
    }
    document.querySelectorAll('.ready-intro p').forEach(node => node.textContent = node.textContent.replace('8 项', '9 项'));
    document.querySelectorAll('.wide-v2-progress-total,.flow-wide-progress>em').forEach(node => node.textContent = '/ 9');
    document.querySelectorAll('#operationPassScreen .result-op-summary p').forEach(node => node.textContent = '9/9 项通过 · 可以进入系统');
    document.querySelectorAll('#operationPassScreen .pass-badge').forEach(node => node.textContent = '点检完成');
    for (const id of ['wideS3Screen', 'operationS3Screen']) {
      const sound = document.getElementById(id);
      sound.querySelector('.flow-heading b,.flow-op-heading b').textContent = 'S4';
      sound.setAttribute('aria-label', sound.getAttribute('aria-label').replace('S3', 'S4'));
    }
  }
  function geometry(progress) {
    // Angle is a radius direction: always perpendicular to the circle tangent.
    const angle = 135 + 270 * progress;
    const rad = angle * Math.PI / 180;
    const cx = 347.356, cy = 319.602, radius = 287.895;
    const x = cx + radius * Math.cos(rad), y = cy + radius * Math.sin(rad);
    const sx = cx + radius * Math.cos(135 * Math.PI / 180);
    const sy = cy + radius * Math.sin(135 * Math.PI / 180);
    return { angle, x: cx + (radius - 48) * Math.cos(rad), y: cy + (radius - 48) * Math.sin(rad),
      path: `M${sx} ${sy} A${radius} ${radius} 0 ${270 * progress > 180 ? 1 : 0} 1 ${x} ${y}` };
  }
  // Logarithmic speed scale keeps 10 / 100 / 1000 Mbps visually distinguishable.
  function speedFraction(mbps) {
    return Math.min(1, Math.max(0, Math.log1p(Math.max(0, mbps)) / Math.log1p(1000)));
  }
  function paint(progress, speed, outcome) {
    const geom = geometry(Math.max(.0001, Math.min(1, progress)));
    document.querySelectorAll('.network-screen').forEach(screen => {
      screen.style.setProperty('--network-color', outcome ? colors[outcome.tier] : colors.scanning);
      screen.querySelector('.network-arc').setAttribute('d', geom.path);
      screen.querySelector('.network-pointer').setAttribute('transform', `translate(${geom.x} ${geom.y}) rotate(${geom.angle})`);
      screen.querySelector('[data-network-value]').textContent = String(Math.round(speed));
      screen.querySelector('[data-network-status]').textContent = outcome ? outcome.label : '检测中…';
      screen.querySelector('[data-network-value]').style.color = outcome ? colors[outcome.tier] : '#f5f5f5';
      screen.classList.toggle('network-done', !!outcome);
    });
  }
  function start({ schedule, isCurrent, complete }) {
    const token = ++run;
    result = null;
    const mbps = Number(document.getElementById('networkLinkSelect').value);
    let elapsed = 0;
    paint(0, 0);
    const tick = () => {
      if (token !== run || !isCurrent()) return;
      elapsed += 40;
      const p = Math.min(1, elapsed / 4800);
      paint(speedFraction(mbps * p), mbps * p);
      if (p < 1) schedule(tick, 40);
      else {
        result = { mbps, ...classify(mbps) };
        paint(speedFraction(mbps), mbps, result);
        schedule(() => { if (token === run && isCurrent()) complete(result); }, 1200);
      }
    };
    schedule(tick, 40);
  }
  return { mount, start, classify, geometry, speedFraction, reset: () => { run += 1; result = null; }, getResult: () => result };
})();
