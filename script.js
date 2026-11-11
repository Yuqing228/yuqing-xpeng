const viewport = document.getElementById('viewport');
const scaleLabel = document.getElementById('scaleLabel');
const buttons = [...document.querySelectorAll('.mode-button')];
const stepButtons = [...document.querySelectorAll('.step-button')];
const demoButtons = [...document.querySelectorAll('[data-demo]')];
const failureSelect = document.getElementById('failureSelect');
const widePreviewFrame = document.getElementById('widePreviewFrame');
const operationPreviewFrame = document.getElementById('operationPreviewFrame');
const skipDialog = document.getElementById('skipDialog');
const screens = {
  s1: { wide: document.getElementById('wideS1Screen'), operation: document.getElementById('operationS1Screen') },
  s2: { wide: document.getElementById('wideS2Screen'), operation: document.getElementById('operationS2Screen') },
  s3: { wide: document.getElementById('wideS3Screen'), operation: document.getElementById('operationS3Screen') },
  h1: { wide: document.getElementById('wideH1Screen'), operation: document.getElementById('operationH1Screen') },
  h2: { wide: document.getElementById('wideH2Screen'), operation: document.getElementById('operationH2Screen') },
  h3: { wide: document.getElementById('wideH3Screen'), operation: document.getElementById('operationH3Screen') },
  h4: { wide: document.getElementById('wideH4Screen'), operation: document.getElementById('operationH4Screen') },
  h5: { wide: document.getElementById('wideH5Screen'), operation: document.getElementById('operationH5Screen') },
  ready: { wide: document.getElementById('wideReadyScreen'), operation: document.getElementById('operationReadyScreen') },
  pass: { wide: document.getElementById('widePassScreen'), operation: document.getElementById('operationPassScreen') },
  fail: { wide: document.getElementById('wideFailScreen'), operation: document.getElementById('operationFailScreen') },
  entered: { wide: document.getElementById('wideEnteredScreen'), operation: document.getElementById('operationEnteredScreen') }
};

const inspectionSteps = [
  ['s1', 'S1', '登录状态'], ['s2', 'S2', '软件与双屏'], ['s3', 'S3', '声音外放'],
  ['h1', 'H1', '操作套件连接'], ['h2', 'H2', '方向盘转向'], ['h3', 'H3', '方向盘按键与拨片'],
  ['h4', 'H4', '刹车与电门踏板'], ['h5', 'H5', '触控屏触摸']
];
const failureMessages = {
  none: 'H4 电门踏板无响应 · 需要修复', h4: 'H4 电门踏板无响应 · 需要修复',
  h2: 'H2 方向盘回正异常 · 需要修复', 'h3-key': 'H3 按键 P 无响应 · 关键按键异常',
  'h3-normal': 'H3 按键 A 无响应 · 普通按键异常', s3: 'S3 外放无声 · 可进入系统后处理'
};
const failureStepMap = { none: 'h4', h4: 'h4', h2: 'h2', 'h3-key': 'h3', 'h3-normal': 'h3', s3: 's3' };
const resultMethods = { s1: '自动检测', s2: '自动检测', s3: '手动操作', h1: '自动检测', h2: '手动操作', h3: '手动操作', h4: '手动操作', h5: '手动操作' };
const failureDetails = {
  none: '电门踏板没有响应（读数停在 12%），请检查踏板连接或联系运维',
  h4: '电门踏板没有响应（读数停在 12%），请检查踏板连接或联系运维',
  h2: '方向盘回正位置异常，请重新校准后检测',
  'h3-key': '关键按键 P 无响应，请检查方向盘按键连接',
  'h3-normal': '按键 A 无响应，请检查方向盘按键连接',
  s3: '未检测到座舱外放声音，请检查音频输出'
};
let keySequence = [
  { code: 'P', name: '挂P挡', x: 63.2, y: 43.1, size: 86, asset: 'key-p.svg' },
  { code: 'PL', name: '驻车灯', x: 36.68, y: 43.68, size: 86, asset: 'key-pl.svg' },
  { code: 'A', name: '左转向灯', x: 71.7, y: 56.5, size: 69 },
  { code: 'B', name: '右转向灯', x: 76.7, y: 52, size: 69 },
  { code: 'Y', name: '鸣笛', x: 71.7, y: 47.5, size: 69 },
  { code: 'N', name: '问题打点', x: 37.5, y: 43.1, size: 86, asset: 'key-n.svg' },
  { code: 'RADIO', name: '紧急停车', x: 34.2, y: 68.8, size: 129, asset: 'key-radio.svg' },
  { code: 'START', name: '接管确认', x: 66.5, y: 68.8, size: 129, asset: 'key-start.svg' },
  { code: 'R', name: '左拨片', x: 17.5, y: 37, size: 86, asset: 'key-r.svg' },
  { code: 'D', name: '右拨片', x: 82.5, y: 37, size: 86, asset: 'key-d.svg' }
];

const wheelOneSequence = keySequence;
const wheelTwoSequence = [
  {code:'□',name:'挂P挡',x:65,y:41.8,size:86},
  {code:'L2',name:'左转向灯',x:32.5,y:52.2,size:86},
  {code:'R2',name:'右转向灯',x:68.2,y:52.2,size:86},
  {code:'L3',name:'鸣笛',x:27.6,y:59.9,size:86},
  {code:'R3',name:'问题打点',x:73,y:59.9,size:86},
  {code:'↵',name:'紧急停车',x:64.5,y:68,size:100},
  {code:'○',name:'接管确认',x:72.3,y:41.8,size:86}
];
let wheelVariant = '1';
const wheelStates = {};
function captureWheelState() {
  return {keyIndex,steeringStage,steeringAngle,steeringMaxLeft,steeringMaxRight,steeringHitLeft,steeringHitRight,steeringCompleted};
}
function switchWheel(variant) {
  if (variant === wheelVariant) return;
  wheelStates[wheelVariant] = captureWheelState();
  steeringDrag = null;
  wheelVariant = variant;
  keySequence = variant === '2' ? wheelTwoSequence : wheelOneSequence;
  const saved = wheelStates[variant];
  if (saved) {
    ({keyIndex,steeringStage,steeringAngle,steeringMaxLeft,steeringMaxRight,steeringHitLeft,steeringHitRight,steeringCompleted} = saved);
  } else { resetKeyTargets(); resetSteeringInspection(); }
  document.querySelectorAll('[data-steering-wheel],.key-wheel>img,.op-key-wheel>img').forEach(img => img.src = `assets/images/figma/${variant === '2' ? 'steering-wheel-2.png' : 'steering-wheel-updated.png'}`);
  document.querySelectorAll('[data-wheel]').forEach(button => {
    button.classList.toggle('active', button.dataset.wheel === variant);
    button.setAttribute('aria-pressed', String(button.dataset.wheel === variant));
  });
  updateKeyTargets();
  updateSteeringUI();
}

let viewMode = 'dual';
let step = 'h2';
let playTimer = 0;
let playIndex = 0;
let touchHit = 0;
let keyIndex = 0;
let pedalStage = 0;
let pedalPress = null;
let steeringStage = 0;
let steeringAngle = 0;
let steeringMaxLeft = 0;
let steeringMaxRight = 0;
let steeringHitLeft = false;
let steeringHitRight = false;
let steeringCompleted = false;
let steeringDrag = null;
let motionPaused = false;
let motionTimers = [];
let resumePlaybackAfterPause = false;
let dialogWasPaused = false;

function renderSidebars() {
  document.querySelectorAll('.js-flow-sidebar').forEach(sidebar => {
    const current = sidebar.dataset.current;
    const currentIndex = inspectionSteps.findIndex(item => item[0] === current);
    const wide = sidebar.closest('.wide-screen');
    const figmaWideS1 = sidebar.closest('#wideS1Screen');
    const figmaOpS3 = sidebar.closest('#operationS3Screen');
    const figmaOpH1 = sidebar.closest('#operationH1Screen');
    const labels = {
      s1: '安全员登录信息校验', s2: '软件启动与双屏显示', s3: '声音外放', h1: '操作套件连接',
      h2: '方向盘', h3: '方向盘按键与拨片', h4: '刹车/电门踏板', h5: '触控屏触摸输入'
    };
    const makeRow = (key, hardware = false) => {
      const item = inspectionSteps.find(entry => entry[0] === key);
      const index = inspectionSteps.findIndex(entry => entry[0] === key);
      const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending';
      const completeName = hardware && key === 'h1' ? 'complete-alt' : 'complete';
      const icon = figmaWideS1
        ? `figma/wide-s1/${state === 'done' ? 'complete' : state}.svg`
        : figmaOpS3
          ? `figma/op-s3/${state === 'done' ? (hardware && key === 'h1' ? 'complete-alt' : 'complete') : state}.svg`
        : figmaOpH1
          ? `figma/op-h1/${state === 'done' ? (hardware && key === 'h1' ? 'sidebar-hardware' : 'status-complete') : state === 'current' ? 'sidebar-h1-complete' : 'status-pending'}.svg`
        : wide ? `wide-sidebar-${state === 'done' ? completeName : state}.svg` : `op-${state === 'done' ? completeName : state}.svg`;
      const size = wide ? 36 : 24;
      const alt = state === 'done' ? '已完成' : state === 'current' ? '进行中' : '待点检';
      const rowClass = wide ? 'wide-v2-row' : '';
      return `<div class="${rowClass} ${state}" data-nav-step="${key}" role="button" tabindex="0" aria-label="查看 ${item[1]} ${labels[key]}"><span>${item[1]}</span><strong>${labels[key]}</strong><img src="assets/svg/${icon}" width="${size}" height="${size}" alt="${alt}"></div>`;
    };
    if (wide) {
      sidebar.className = 'wide-v2-sidebar js-flow-sidebar';
      const wideAssetRoot = figmaWideS1 ? 'assets/svg/figma/wide-s1' : 'assets/svg';
      const softwareIconSrc = 'assets/svg/figma/wide-s1/software.svg';
      const hardwareIconSrc = 'assets/svg/figma/wide-s1/hardware.svg';
      const dividerIcon = figmaWideS1 ? 'divider.svg' : 'wide-sidebar-divider.svg';
      sidebar.innerHTML = `<section class="wide-v2-group wide-v2-software"><div class="wide-v2-group-title"><img src="${softwareIconSrc}" width="66" height="66" alt=""><h2>软件点检</h2></div><div class="wide-v2-list">${['s1','s2','s3'].map(key => makeRow(key)).join('')}</div></section><img class="wide-v2-divider" src="${wideAssetRoot}/${dividerIcon}" width="1296" height="2" alt=""><section class="wide-v2-group wide-v2-hardware"><div class="wide-v2-group-title"><img src="${hardwareIconSrc}" width="66" height="66" alt=""><h2>硬件点检</h2></div><div class="wide-v2-list">${['h1','h2','h3','h4','h5'].map(key => makeRow(key, true)).join('')}</div></section>`;
    } else {
      sidebar.className = 'op-sidebar js-flow-sidebar';
      const opAssetRoot = figmaOpS3 ? 'assets/svg/figma/op-s3' : figmaOpH1 ? 'assets/svg/figma/op-h1' : 'assets/svg';
      const opSoftwareIconSrc = 'assets/svg/figma/wide-s1/software.svg';
      const opHardwareIconSrc = 'assets/svg/figma/wide-s1/hardware.svg';
      const opDividerIcon = figmaOpS3 ? 'divider.svg' : figmaOpH1 ? 'sidebar-divider.svg' : 'op-divider.svg';
      sidebar.innerHTML = `<section><div class="op-category"><img src="${opSoftwareIconSrc}" width="44" height="44" alt=""><h2>软件点检</h2></div><div class="op-list">${['s1','s2','s3'].map(key => makeRow(key)).join('')}</div></section><img class="op-divider" src="${opAssetRoot}/${opDividerIcon}" width="429" height="1" alt=""><section class="op-hardware-section"><div class="op-category"><img src="${opHardwareIconSrc}" width="44" height="44" alt=""><h2>硬件点检</h2></div><div class="op-list">${['h1','h2','h3','h4','h5'].map(key => makeRow(key, true)).join('')}</div></section>`;
    }
  });
}

function fitScreen() {
  const pair = screens[step];
  if (!pair) return;
  const viewportWidth = viewport.clientWidth;
  const viewportHeight = viewport.clientHeight;
  const stageWidth = Math.min(viewportWidth, viewportHeight * 16 / 9);
  const stageHeight = stageWidth * 9 / 16;
  const stageLeft = (viewportWidth - stageWidth) / 2;
  const stageTop = (viewportHeight - stageHeight) / 2;
  const baseWideWidth = stageWidth * .88;
  const baseWideHeight = baseWideWidth * 9 / 32;
  const baseOperationWidth = stageWidth * .44;
  const baseOperationHeight = baseOperationWidth * 9 / 16;
  const gap = stageWidth * .013;
  const upwardShift = stageWidth * .014;
  let wideBox = null;
  let operationBox;

  if (viewMode === 'dual') {
    const totalHeight = baseWideHeight + gap + baseOperationHeight;
    const startTop = stageTop + (stageHeight - totalHeight) / 2 - upwardShift;
    wideBox = { left: stageLeft + (stageWidth - baseWideWidth) / 2, top: startTop, width: baseWideWidth, height: baseWideHeight };
    operationBox = { left: stageLeft + (stageWidth - baseOperationWidth) / 2, top: startTop + baseWideHeight + gap, width: baseOperationWidth, height: baseOperationHeight };
  } else {
    const focusWidth = baseOperationWidth * 2.13;
    const focusHeight = focusWidth * 9 / 16;
    operationBox = { left: stageLeft + (stageWidth - focusWidth) / 2, top: stageTop + (stageHeight - focusHeight) / 2, width: focusWidth, height: focusHeight };
  }

  function placeScreen(screen, box) {
    if (!screen || !box) return 0;
    const nativeWidth = Number(screen.dataset.width);
    const nativeHeight = Number(screen.dataset.height);
    const scale = Math.min(box.width / nativeWidth, box.height / nativeHeight);
    screen.style.left = `${box.left + (box.width - nativeWidth * scale) / 2}px`;
    screen.style.top = `${box.top + (box.height - nativeHeight * scale) / 2}px`;
    screen.style.transform = `scale(${scale})`;
    screen.style.borderRadius = `${12 / scale}px`;
    return scale;
  }

  function placeFrame(frame, box, hidden) {
    frame.classList.toggle('is-hidden', hidden);
    if (!box) return;
    frame.style.left = `${box.left}px`;
    frame.style.top = `${box.top}px`;
    frame.style.width = `${box.width}px`;
    frame.style.height = `${box.height}px`;
  }

  const wideScale = wideBox ? placeScreen(pair.wide, wideBox) : 0;
  const operationScale = placeScreen(pair.operation, operationBox);
  placeFrame(widePreviewFrame, wideBox, viewMode !== 'dual');
  placeFrame(operationPreviewFrame, operationBox, false);
  skipDialog.style.left = `${operationBox.left}px`;
  skipDialog.style.top = `${operationBox.top}px`;
  skipDialog.style.width = `${operationBox.width}px`;
  skipDialog.style.height = `${operationBox.height}px`;
  skipDialog.style.setProperty('--screen-scale', operationScale);
  scaleLabel.textContent = viewMode === 'dual'
    ? `宽 ${Math.round(wideScale * 100)}% · 触 ${Math.round(operationScale * 100)}%`
    : `触控屏 ${Math.round(operationScale * 100)}%`;
}

function updateScreenVisibility() {
  Object.entries(screens).forEach(([stepKey, pair]) => {
    pair.wide?.classList.toggle('active', stepKey === step && viewMode === 'dual');
    pair.operation?.classList.toggle('active', stepKey === step);
  });
}

function setViewMode(nextMode) {
  viewMode = nextMode;
  updateScreenVisibility();
  buttons.forEach(button => {
    const active = button.dataset.view === viewMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  fitScreen();
}

function scheduleMotion(fn, delay) {
  const timer = { fn, remaining: delay, started: 0, id: 0 };
  timer.arm = () => {
    timer.started = performance.now();
    timer.id = window.setTimeout(() => {
      motionTimers = motionTimers.filter(item => item !== timer);
      fn();
    }, timer.remaining);
  };
  motionTimers.push(timer);
  if (!motionPaused) timer.arm();
  return timer;
}

function clearMotionTimers() {
  motionTimers.forEach(timer => window.clearTimeout(timer.id));
  motionTimers = [];
}

function setMotionPaused(paused) {
  if (motionPaused === paused) return;
  motionPaused = paused;
  document.body.classList.toggle('motion-paused', paused);
  const pauseButton = document.querySelector('[data-demo="pause"]');
  if (pauseButton) pauseButton.textContent = paused ? '继续点检' : '暂停';
  if (paused) {
    motionTimers.forEach(timer => {
      window.clearTimeout(timer.id);
      timer.remaining = Math.max(0, timer.remaining - (performance.now() - timer.started));
    });
    window.clearTimeout(playTimer);
    playTimer = 0;
  } else {
    motionTimers.forEach(timer => timer.arm());
    if (document.querySelector('[data-demo="play"]')?.classList.contains('active')) schedulePlayback();
  }
}

function updateAutoSequence(stepName, doneCount, total) {
  Object.values(screens[stepName]).forEach(screen => {
    if (stepName === 's2') {
      screen.querySelector('.dual-monitor-visual')?.classList.toggle('is-done', doneCount >= total);
    }
    screen.querySelectorAll('[data-auto-index]').forEach(node => {
      const index = Number(node.dataset.autoIndex);
      const state = index < doneCount ? 'done' : index === doneCount && doneCount < total ? 'current' : 'pending';
      node.classList.remove('done', 'current', 'pending');
      node.classList.add(state);
      const image = node.querySelector('[data-status-icon]') || (node.matches('.dual-check-row') ? node.querySelector('img') : null);
      if (image) {
        image.src = stepName === 'h1'
          ? `assets/svg/figma/op-h1/${state === 'done' ? 'status-complete' : state === 'current' ? 'sidebar-h1-complete' : 'status-pending'}.svg`
          : `assets/svg/op-${state === 'done' ? 'complete' : state}.svg`;
        image.alt = state === 'done' ? '已完成' : state === 'current' ? '检测中' : '待检测';
      }
    });
    if (stepName === 's2') {
      const status = screen.querySelector('.dual-wide-status strong');
      if (status) status.textContent = doneCount >= total ? '检测完成' : '检测中…';
    }
    if (stepName === 'h1') {
      const names = ['正在发现方向盘基座', '正在建立操作套件连接', '正在确认数据接收'];
      const status = screen.querySelector('[data-h1-status]');
      const current = screen.querySelector('[data-h1-current]');
      if (status) status.textContent = doneCount >= total ? '检测完成' : '检测中…';
      if (current) current.textContent = doneCount >= total ? '方向盘、踏板与键盘连接正常' : names[doneCount];
    }
  });
}

function startAutoSequence(stepName, total) {
  let doneCount = 0;
  updateAutoSequence(stepName, doneCount, total);
  const advance = () => {
    doneCount += 1;
    updateAutoSequence(stepName, doneCount, total);
    if (doneCount < total) scheduleMotion(advance, 380);
  };
  scheduleMotion(advance, 320);
}

function startSoundPreview() {
  Object.values(screens.s3).forEach(screen => {
    screen.classList.add('sound-playing');
    const main = screen.querySelector('main');
    main.querySelector('h2').textContent = '正在播放提示音…';
    if (!main.querySelector('.sound-wave')) {
      const wave = document.createElement('div');
      wave.className = 'sound-wave';
      wave.setAttribute('aria-label', '提示音播放中');
      [22,36,48,62,24,36,50,68,24,34,48,62,24,32].forEach((height, index) => {
        const bar = document.createElement('i');
        bar.style.height = `${height}px`;
        bar.style.animationDelay = `${index * -.09}s`;
        wave.appendChild(bar);
      });
      main.appendChild(wave);
    }
  });
  scheduleMotion(() => {
    Object.entries(screens.s3).forEach(([type, screen]) => {
      screen.classList.remove('sound-playing');
      screen.querySelector('main h2').textContent = type === 'wide' ? '听到提示音了吗？' : '请问是否听到提示音？';
    });
  }, 3000);
}

function setStep(nextStep) {
  if (!screens[nextStep]) return;
  clearMotionTimers();
  setMotionPaused(false);
  step = nextStep;
  inspectionSteps.forEach(([stepId], index) => {
    Object.values(screens[stepId]).forEach(screen => {
      screen?.querySelectorAll('header .wide-v2-title b, header .op-title b, header .ready-brand b').forEach(badge => {
        badge.textContent = `点检中 ${index + 1}/8`;
      });
      screen?.querySelectorAll('.flow-wide-progress > strong, .wide-v2-progress-current').forEach(label => {
        label.textContent = String(index + 1);
      });
      screen?.querySelectorAll('.flow-wide-progress > div > b, .wide-v2-progress-track > b').forEach(bar => {
        bar.style.width = `${(index + 1) / 8 * 100}%`;
      });
    });
  });
  stepButtons.forEach(button => {
    const active = button.dataset.step === step;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    if (active) button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
  if (step === 's2') startAutoSequence('s2', 4);
  if (step === 's3') startSoundPreview();
  if (step === 'h1') startAutoSequence('h1', 3);
  if (step === 'h2') updateSteeringUI();
  if (step === 'h3') updateKeyTargets();
  if (step === 'h4') resetPedals();
  if (step === 'h5') resetTouchTargets();
  updateScreenVisibility();
  fitScreen();
}

function setDemoState(name) {
  demoButtons.forEach(button => button.classList.toggle('active', button.dataset.demo === name));
}

function stopPlayback() {
  window.clearTimeout(playTimer);
  playTimer = 0;
}

function playbackDelay() {
  if (step === 's2') return 2080;
  if (step === 'h1') return 1700;
  return 1800;
}

function schedulePlayback() {
  stopPlayback();
  playTimer = window.setTimeout(advancePlayback, playbackDelay());
}

function finishPlayback() {
  const selectedFailure = failureSelect.value;
  const result = selectedFailure === 'none' ? 'pass' : 'fail';
  updateFailureMessage();
  setStep(result);
  setDemoState(result);
  stopPlayback();
}

function advancePlayback() {
  if (playIndex >= inspectionSteps.length) return finishPlayback();
  setStep(inspectionSteps[playIndex][0]);
  playIndex += 1;
  setDemoState('play');
  if (step === 'h2') return;
  schedulePlayback();
}

function startPlayback() {
  closeSkipDialog(false);
  stopPlayback();
  setMotionPaused(false);
  playIndex = 0;
  resetInteractiveStates();
  setDemoState('play');
  advancePlayback();
}

function updateFailureMessage() {
  const message = failureMessages[failureSelect.value] || failureMessages.h4;
  document.querySelectorAll('[data-failure-message]').forEach((node, index) => {
    node.textContent = index === 0 ? message : `请修复异常项后重新点检 · ${message.split(' · ')[0]}`;
  });
  renderResultLists();
}

function renderResultLists() {
  const failedStep = failureStepMap[failureSelect.value] || 'h4';
  const detail = failureDetails[failureSelect.value] || failureDetails.h4;
  document.querySelectorAll('[data-result-sidebar]').forEach(sidebar => {
    const failing = sidebar.dataset.resultSidebar === 'fail';
    if (failing) {
      const buildWideRows = (steps, passIcon) => steps.map(([key, code, label]) => {
        const failed = key === failedStep;
        const icon = failed ? 'assets/svg/figma/fail-wide/fail-status.svg' : passIcon;
        return `<div class="result-side-row${failed ? ' fail' : ''}"><span>${code}</span><strong>${label}</strong><img src="${icon}" width="36" height="36" alt="${failed ? '需修复' : '通过'}"></div>`;
      }).join('');
      sidebar.innerHTML = `<section class="result-wide-group result-wide-software"><div class="result-wide-group-title"><img src="assets/svg/figma/wide-s1/software.svg" width="66" height="66" alt=""><h2>软件点检</h2></div><div class="result-wide-list">${buildWideRows(inspectionSteps.slice(0, 3), 'assets/svg/figma/fail-wide/complete.svg')}</div></section><img class="result-wide-divider" src="assets/svg/figma/fail-wide/sidebar-divider.svg" width="1296" height="2" alt=""><section class="result-wide-group result-wide-hardware"><div class="result-wide-group-title"><img src="assets/svg/figma/wide-s1/hardware.svg" width="66" height="66" alt=""><h2>硬件点检</h2></div><div class="result-wide-list">${buildWideRows(inspectionSteps.slice(3), 'assets/svg/figma/fail-wide/complete-alt.svg')}</div></section>`;
      return;
    }
    const buildPassWideRows = (steps, passIcon) => steps.map(([, code, label]) => `<div class="result-side-row"><span>${code}</span><strong>${label}</strong><img src="${passIcon}" width="36" height="36" alt="通过"></div>`).join('');
    sidebar.innerHTML = `<section class="result-wide-group result-wide-software"><div class="result-wide-group-title"><img src="assets/svg/figma/wide-s1/software.svg" width="66" height="66" alt=""><h2>软件点检</h2></div><div class="result-wide-list">${buildPassWideRows(inspectionSteps.slice(0, 3), 'assets/svg/figma/pass-wide/complete.svg')}</div></section><img class="result-wide-divider" src="assets/svg/figma/pass-wide/sidebar-divider.svg" width="1296" height="2" alt=""><section class="result-wide-group result-wide-hardware"><div class="result-wide-group-title"><img src="assets/svg/figma/wide-s1/hardware.svg" width="66" height="66" alt=""><h2>硬件点检</h2></div><div class="result-wide-list">${buildPassWideRows(inspectionSteps.slice(3), 'assets/svg/figma/pass-wide/complete-alt.svg')}</div></section>`;
  });
  document.querySelectorAll('[data-result-list]').forEach(list => {
    const failing = list.dataset.resultList === 'fail';
    list.innerHTML = inspectionSteps.map(([key, code, label]) => {
      const failed = failing && key === failedStep;
      const note = failed ? `<small>${detail}</small>` : '';
      const exactFailAsset = failed ? 'assets/svg/figma/fail-operation/fail-status.svg' : (key === 'h5' ? 'assets/svg/figma/fail-operation/pass-status-large.svg' : 'assets/svg/figma/fail-operation/pass-status.svg');
      const icon = failing ? exactFailAsset : 'assets/svg/figma/pass-operation/pass-status.svg';
      return `<div class="result-row${failed ? ' fail' : ''}"><span>${code}</span><strong>${label}${note}</strong><em>${resultMethods[key]}</em><b>${failed ? '需修复' : '通过'}</b><img src="${icon}" width="24" height="24" alt="${failed ? '需修复' : '通过'}"></div>`;
    }).join('');
  });
}

function resetTouchTargets() { touchHit = 0; updateTouchBoards(); }

function updateTouchBoards() {
  document.querySelectorAll('[data-touch-board]').forEach(board => {
    board.querySelectorAll('button').forEach((button, index) => {
      button.disabled = index > touchHit;
      button.classList.toggle('hit', index < touchHit);
      button.classList.toggle('active', index === touchHit && touchHit < 5);
    });
    const count = board.querySelector('[data-hit-count]');
    if (count) count.textContent = String(touchHit);
  });
}

function hitTouchTarget(index) {
  if (index !== touchHit || touchHit >= 5) return;
  touchHit += 1;
  updateTouchBoards();
}

function resetKeyTargets() { keyIndex = 0; updateKeyTargets(); }

function updateKeyTargets() {
  const current = keySequence[keyIndex];
  document.querySelectorAll('[data-key-target]').forEach(button => {
    const image = button.querySelector('[data-key-target-image]');
    const text = button.querySelector('[data-key-target-text]');
    button.dataset.keyCode = current?.code || '';
    button.classList.toggle('square-key', ['□', '○', '↵'].includes(current?.code));
    button.classList.toggle('rounded-square-key', current?.code === '□');
    button.setAttribute('aria-label', current ? `按下 ${current.code} 按键` : '按键检测完成');
    button.classList.toggle('active', Boolean(current));
    button.hidden = !current;
    button.classList.toggle('has-cutout', Boolean(current?.asset));
    button.classList.toggle('fallback-key', Boolean(current && !current.asset));
    button.style.setProperty('--target-x', `${current?.x ?? 50}%`);
    button.style.setProperty('--target-y', `${current?.y ?? 50}%`);
    button.style.setProperty('--target-size', `${current?.size ?? 128}px`);
    if (image) {
      image.hidden = !current?.asset;
      if (current?.asset) image.src = `assets/svg/figma/h3-buttons/${current.asset}`;
    }
    if (text) {
      text.hidden = Boolean(current?.asset);
      text.textContent = current?.code === '□' ? '' : current?.code || '';
      text.classList.toggle('key-complete-mark', !current);
    }
  });
  document.querySelectorAll('.key-prompt,.op-key-prompt').forEach(prompt => {
    prompt.querySelector('.key-progress').hidden = !current;
    const kind = prompt.querySelector('[data-key-kind]');
    const progress = prompt.querySelector('[data-key-progress]');
    const total = prompt.querySelector('[data-key-total]');
    const code = prompt.querySelector('[data-key-code]');
    const name = prompt.querySelector('[data-key-name]');
    const isPaddle = wheelVariant === '1' && keyIndex >= 8 && keyIndex < keySequence.length;
    if (kind) kind.textContent = current ? (isPaddle ? '拨片' : '按键') : '检测';
    if (progress) progress.textContent = current ? String(isPaddle ? keyIndex - 7 : keyIndex + 1) : '';
    if (progress) progress.classList.toggle('key-complete-mark', !current);
    if (total) total.textContent = current ? (isPaddle ? '/ 2' : wheelVariant === '2' ? '/ 7' : '/ 8') : '完成';
    if (code) code.textContent = current?.code === '□' ? '' : current?.code || '';
    if (code) code.classList.toggle('key-complete-mark', !current);
    if (code) code.classList.toggle('square-key', ['□', '○', '↵'].includes(current?.code));
    if (code) code.classList.toggle('rounded-square-key', current?.code === '□');
    if (name) name.textContent = current?.name || '检测完成';
  });
}

function hitKeyTarget(key) {
  const current = keySequence[keyIndex];
  if (!current || key.toUpperCase() !== current.code) return false;
  keyIndex += 1;
  updateKeyTargets();
  return true;
}

function resetPedals() {
  pedalStage = 0;
  pedalPress = null;
  document.querySelectorAll('.wide-pedals,.op-pedals').forEach(group => {
    if (!group.querySelector('.pedal-status')) {
      const status = document.createElement('p');
      status.className = 'pedal-status';
      status.setAttribute('aria-live', 'polite');
      group.appendChild(status);
    }
    group.querySelector('.pedal-status').textContent = '请踩下刹车踏板';
  });
  document.querySelectorAll('.pedal-card').forEach(card => {
    if (!card.querySelector('.pedal-instruction')) {
      const instruction = document.createElement('small');
      instruction.className = 'pedal-instruction';
      instruction.textContent = '踩到底 · 保持 1 秒';
      card.appendChild(instruction);
    }
    card.classList.toggle('current', card.dataset.pedal === 'brake');
    card.querySelector('[data-value]').textContent = '0%';
    card.querySelector('i b').style.setProperty('--pedal-value', '0%');
  });
}

function formatSteeringAngle(value) {
  const rounded = Math.round(Math.abs(value));
  if (rounded < 1) return '正中0°';
  return `${value < 0 ? '左' : '右'} ${rounded}°`;
}

function resetSteeringInspection() {
  steeringStage = 0;
  steeringAngle = 0;
  steeringMaxLeft = 0;
  steeringMaxRight = 0;
  steeringHitLeft = false;
  steeringHitRight = false;
  steeringCompleted = false;
  steeringDrag = null;
  document.body.classList.remove('steering-damping-error');
  updateSteeringUI();
}

function updateSteeringGauge(gauge, progress) {
  const arc = gauge.querySelector('.steering-progress-arc');
  const pointer = gauge.querySelector('.steering-pointer');
  if (!arc || !pointer || typeof arc.getTotalLength !== 'function') return;

  const totalLength = arc.getTotalLength();
  const drawnLength = Math.max(0.01, Math.min(totalLength, totalLength * progress));
  arc.style.strokeDasharray = `${drawnLength} ${totalLength}`;
  arc.style.strokeDashoffset = '0';

  const sampleDistance = Math.min(2, totalLength / 100);
  const before = arc.getPointAtLength(Math.max(0, drawnLength - sampleDistance));
  const after = arc.getPointAtLength(Math.min(totalLength, drawnLength + sampleDistance));
  const end = arc.getPointAtLength(drawnLength);
  const tangentAngle = Math.atan2(after.y - before.y, after.x - before.x);
  const normalX = -Math.sin(tangentAngle);
  const normalY = Math.cos(tangentAngle);
  const pointerGap = 48;
  const pointerX = end.x + normalX * pointerGap;
  const pointerY = end.y + normalY * pointerGap;
  const tangentDegrees = tangentAngle * 180 / Math.PI;

  pointer.setAttribute('transform', `translate(${pointerX} ${pointerY}) rotate(${tangentDegrees})`);
}

function updateSteeringUI() {
  const visualAngle = Math.max(-75, Math.min(75, steeringAngle / 6));
  const arcProgress = Math.max(0, Math.min(1, (visualAngle + 75) / 150));
  const angleText = formatSteeringAngle(steeringAngle);
  const maxText = `最大左 ${Math.round(steeringMaxLeft)}° / 右 ${Math.round(steeringMaxRight)}°`;
  let status = '请转动方向盘，开始检测';
  if (steeringStage === 1) {
    if (steeringHitLeft && !steeringHitRight) status = '左侧已打死，请向右打死';
    else if (!steeringHitLeft && steeringHitRight) status = '右侧已打死，请向左打死';
    else status = '拖动方向盘，左右打死';
  }
  if (steeringStage === 2) status = Math.abs(steeringAngle) <= 8 ? '请确认方向盘阻尼' : '请将方向盘回正';
  if (steeringCompleted) status = '方向盘转向点检完成';
  if (document.body.classList.contains('steering-damping-error')) status = '阻尼异常，请检查后重新确认';

  document.querySelectorAll('[data-steering-wheel]').forEach(wheel => {
    wheel.style.transform = `rotate(${steeringAngle}deg)`;
    wheel.setAttribute('aria-valuenow', String(Math.round(steeringAngle)));
    wheel.setAttribute('aria-valuetext', angleText);
  });
  document.querySelectorAll('.steering-dynamic-gauge').forEach(gauge => updateSteeringGauge(gauge, arcProgress));
  document.querySelectorAll('[data-steering-angle]').forEach(node => { node.textContent = angleText; });
  document.querySelectorAll('[data-steering-maximum]').forEach(node => { node.textContent = maxText; });
  document.querySelectorAll('[data-steering-status]').forEach(node => { node.textContent = status; });
  document.querySelectorAll('[data-steering-steps]').forEach(group => {
    [...group.children].forEach((pill, index) => {
      pill.classList.toggle('done', steeringCompleted || index < steeringStage);
      pill.classList.toggle('selected', !steeringCompleted && index === steeringStage);
    });
  });
  document.querySelectorAll('[data-steering-damping]').forEach(actions => {
    actions.hidden = steeringCompleted || steeringStage !== 2 || Math.abs(steeringAngle) > 8;
  });
}

function completeSteeringInspection() {
  if (steeringCompleted) return;
  steeringCompleted = true;
  document.body.classList.remove('steering-damping-error');
  updateSteeringUI();
  if (document.querySelector('[data-demo="play"]')?.classList.contains('active')) scheduleMotion(advancePlayback, 650);
}

function setSteeringAngle(nextAngle) {
  if (steeringCompleted || motionPaused || step !== 'h2') return;
  steeringAngle = Math.max(-450, Math.min(450, nextAngle));
  steeringMaxLeft = Math.max(steeringMaxLeft, -Math.min(0, steeringAngle));
  steeringMaxRight = Math.max(steeringMaxRight, Math.max(0, steeringAngle));

  if (steeringStage === 0 && Math.abs(steeringAngle) >= 60) steeringStage = 1;
  if (steeringStage === 1) {
    if (steeringAngle <= -420) steeringHitLeft = true;
    if (steeringAngle >= 420) steeringHitRight = true;
    if (steeringHitLeft && steeringHitRight) steeringStage = 2;
  }
  updateSteeringUI();
}

function steeringPointerAngle(event, wheel) {
  const rect = wheel.getBoundingClientRect();
  return Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) * 180 / Math.PI;
}

function startSteeringDrag(event) {
  const wheel = event.currentTarget;
  if (motionPaused || steeringCompleted || step !== 'h2') return;
  steeringDrag = { wheel, pointerId: event.pointerId, last: steeringPointerAngle(event, wheel) };
  wheel.classList.add('dragging');
  wheel.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function moveSteeringDrag(event) {
  if (!steeringDrag || event.pointerId !== steeringDrag.pointerId) return;
  const current = steeringPointerAngle(event, steeringDrag.wheel);
  let delta = current - steeringDrag.last;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  steeringDrag.last = current;
  setSteeringAngle(steeringAngle + delta * 2.6);
  event.preventDefault();
}

function endSteeringDrag(event) {
  if (!steeringDrag || event.pointerId !== steeringDrag.pointerId) return;
  steeringDrag.wheel.classList.remove('dragging');
  steeringDrag = null;
}

function pressPedal(pedal) {
  const expected = pedalStage === 0 ? 'brake' : pedalStage === 1 ? 'throttle' : '';
  if (pedal !== expected || pedalPress || motionPaused) return;
  const press = { pedal, value: 0, passed: false };
  pedalPress = press;
  const name = pedal === 'brake' ? '刹车' : '电门';
  const status = text => document.querySelectorAll('.pedal-status').forEach(label => label.textContent = text);
  status(`正在踩下${name}踏板`);
  const grow = () => {
    if (pedalPress !== press) return;
    press.value = Math.min(100, press.value + 5);
    document.querySelectorAll(`.pedal-card[data-pedal="${pedal}"]`).forEach(card => {
      card.querySelector('[data-value]').textContent = `${press.value}%`;
      card.querySelector('i b').style.setProperty('--pedal-value', `${press.value}%`);
    });
    if (press.value < 100) scheduleMotion(grow, 40);
    else {
      status('踩到底 · 保持 1 秒');
      scheduleMotion(() => {
        if (pedalPress !== press) return;
        press.passed = true;
        status(`${name}检测通过 · 保持踩下`);
      }, 1000);
    }
  };
  scheduleMotion(grow, 40);
}

function releasePedal() {
  if (!pedalPress) return;
  const { pedal, passed } = pedalPress;
  pedalPress = null;
  if (passed) pedalStage += 1;
  document.querySelectorAll(`.pedal-card[data-pedal="${pedal}"]`).forEach(card => {
    card.querySelector('[data-value]').textContent = '0%';
    card.querySelector('i b').style.setProperty('--pedal-value', '0%');
  });
  document.querySelectorAll('.pedal-card').forEach(card => card.classList.toggle('current', card.dataset.pedal === (pedalStage === 0 ? 'brake' : pedalStage === 1 ? 'throttle' : '')));
  document.querySelectorAll('.pedal-status').forEach(label => label.textContent = pedalStage === 2 ? '踏板检测完成' : `请踩下${pedalStage === 0 ? '刹车' : '电门'}踏板`);
}

function resetInteractiveStates() { delete wheelStates['1']; delete wheelStates['2']; resetTouchTargets(); resetKeyTargets(); resetPedals(); resetSteeringInspection(); }

function prepareNavigation() {
  const rowSelectors = '.wide-v2-row,.flow-wide-row,.flow-op-row,.op-list>div,.wide-list>div';
  document.querySelectorAll(rowSelectors).forEach(row => {
    const code = row.querySelector('span')?.textContent.trim().toLowerCase();
    if (!screens[code] || !inspectionSteps.some(item => item[0] === code)) return;
    row.dataset.navStep = code;
    row.setAttribute('role', 'button');
    row.tabIndex = 0;
    row.setAttribute('aria-label', `查看 ${code.toUpperCase()} ${inspectionSteps.find(item => item[0] === code)[2]}`);
  });
  document.querySelectorAll('.op-footer b').forEach(button => {
    button.dataset.skipInspection = '';
    button.setAttribute('role', 'button');
    button.tabIndex = 0;
  });
}

function navigateToStep(nextStep) {
  stopPlayback();
  setDemoState('');
  closeSkipDialog(false);
  setStep(nextStep);
}

function openSkipDialog() {
  if (!inspectionSteps.some(item => item[0] === step)) return;
  dialogWasPaused = motionPaused;
  if (!motionPaused) setMotionPaused(true);
  skipDialog.hidden = false;
  fitScreen();
  skipDialog.querySelector('[data-skip-cancel]')?.focus();
}

function closeSkipDialog(restoreMotion = true) {
  if (skipDialog.hidden) return;
  skipDialog.hidden = true;
  if (restoreMotion && !dialogWasPaused) setMotionPaused(false);
}

function enterSystem() {
  closeSkipDialog(false);
  stopPlayback();
  clearMotionTimers();
  setMotionPaused(false);
  setDemoState('');
  setStep('entered');
}

function retryFailureStep() {
  resetInteractiveStates();
  setDemoState('');
  setStep(failureStepMap[failureSelect.value] || 'h4');
}

buttons.forEach(button => button.addEventListener('click', () => setViewMode(button.dataset.view)));
stepButtons.forEach(button => button.addEventListener('click', () => { stopPlayback(); setDemoState(''); setStep(button.dataset.step); }));
demoButtons.forEach(button => button.addEventListener('click', () => {
  const action = button.dataset.demo;
  if (action === 'play') return startPlayback();
  if (action === 'pause') {
    const nextPaused = !motionPaused;
    if (nextPaused) resumePlaybackAfterPause = Boolean(playTimer) || document.querySelector('[data-demo="play"]')?.classList.contains('active');
    setDemoState(nextPaused ? 'pause' : resumePlaybackAfterPause ? 'play' : '');
    setMotionPaused(nextPaused);
    if (!nextPaused) resumePlaybackAfterPause = false;
    return;
  }
  closeSkipDialog(false);
  stopPlayback();
  setMotionPaused(false);
  if (action === 'ready') { resetInteractiveStates(); setStep('ready'); }
  if (action === 'pass') setStep('pass');
  if (action === 'fail') { updateFailureMessage(); setStep('fail'); }
  setDemoState(action);
}));

document.querySelectorAll('[data-start-inspection]').forEach(button => button.addEventListener('click', startPlayback));
document.querySelectorAll('[data-restart-inspection]').forEach(button => button.addEventListener('click', retryFailureStep));
document.querySelectorAll('[data-enter-system]').forEach(button => button.addEventListener('click', enterSystem));
document.querySelectorAll('[data-return-ready]').forEach(button => button.addEventListener('click', () => { resetInteractiveStates(); setStep('ready'); setDemoState('ready'); }));
document.querySelectorAll('[data-touch-board] button').forEach(button => button.addEventListener('click', () => hitTouchTarget(Number(button.dataset.index) - 1)));
document.querySelectorAll('[data-key-target]').forEach(button => button.addEventListener('click', () => hitKeyTarget(button.dataset.keyCode || '')));
document.querySelectorAll('.pedal-card').forEach(card => {
  card.addEventListener('pointerdown', event => {
    event.preventDefault();
    card.setPointerCapture(event.pointerId);
    pressPedal(card.dataset.pedal);
  });
  card.addEventListener('pointerup', releasePedal);
  card.addEventListener('pointercancel', releasePedal);
  card.addEventListener('keydown', event => {
    if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); event.stopPropagation(); pressPedal(card.dataset.pedal); }
  });
  card.addEventListener('keyup', event => {
    if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); event.stopPropagation(); releasePedal(); }
  });
});
document.querySelectorAll('[data-steering-wheel]').forEach(wheel => {
  wheel.addEventListener('pointerdown', startSteeringDrag);
  wheel.addEventListener('pointermove', moveSteeringDrag);
  wheel.addEventListener('pointerup', endSteeringDrag);
  wheel.addEventListener('pointercancel', endSteeringDrag);
  wheel.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    setSteeringAngle(steeringAngle + (event.key === 'ArrowLeft' ? -20 : 20));
    event.preventDefault();
  });
});
document.querySelectorAll('[data-damping]').forEach(button => button.addEventListener('click', () => {
  if (steeringStage !== 2 || Math.abs(steeringAngle) > 8) return;
  if (button.dataset.damping === 'normal') return completeSteeringInspection();
  document.body.classList.add('steering-damping-error');
  updateSteeringUI();
}));
failureSelect.addEventListener('change', updateFailureMessage);
skipDialog.querySelector('[data-skip-cancel]').addEventListener('click', () => closeSkipDialog(true));
skipDialog.querySelector('[data-skip-confirm]').addEventListener('click', enterSystem);

viewport.addEventListener('click', event => {
  const nav = event.target.closest('[data-nav-step]');
  if (nav) return navigateToStep(nav.dataset.navStep);
  if (event.target.closest('[data-skip-inspection]')) openSkipDialog();
});

viewport.addEventListener('keydown', event => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const nav = event.target.closest('[data-nav-step]');
  if (nav) {
    event.preventDefault();
    navigateToStep(nav.dataset.navStep);
    return;
  }
  if (event.target.closest('[data-skip-inspection]')) {
    event.preventDefault();
    openSkipDialog();
  }
});

document.getElementById('hideControls').addEventListener('click', () => {
  document.body.classList.add('controls-hidden');
  fitScreen();
});

document.addEventListener('keydown', event => {
  const key = event.key.toUpperCase();
  if (event.key === 'Escape' && !skipDialog.hidden) {
    closeSkipDialog(true);
    return;
  }
  if (step === 'h3' && hitKeyTarget(key)) return;
  if (key === 'H') { document.body.classList.toggle('controls-hidden'); fitScreen(); }
  if (event.key === '1') setViewMode('dual');
  if (event.key === '2') setViewMode('touch-focus');
  const keyMap = { Q: 's1', W: 's2', E: 's3', R: 'h1', T: 'h2', Y: 'h3', U: 'h4', I: 'h5' };
  if (keyMap[key]) { stopPlayback(); setDemoState(''); setStep(keyMap[key]); }
  if (event.code === 'Space') {
    if (!skipDialog.hidden) return;
    event.preventDefault();
    const nextPaused = !motionPaused;
    if (nextPaused) resumePlaybackAfterPause = Boolean(playTimer) || document.querySelector('[data-demo="play"]')?.classList.contains('active');
    setDemoState(nextPaused ? 'pause' : resumePlaybackAfterPause ? 'play' : '');
    setMotionPaused(nextPaused);
    if (!nextPaused) resumePlaybackAfterPause = false;
  }
});

window.addEventListener('resize', fitScreen);
document.querySelectorAll('[data-wheel]').forEach(button => button.addEventListener('click', () => switchWheel(button.dataset.wheel)));
const h1KeyboardIcon = document.querySelector('.h1-node-keyboard img');
if (h1KeyboardIcon) {
  h1KeyboardIcon.src = 'assets/svg/h1-keyboard.svg';
  h1KeyboardIcon.alt = '按键模块';
}
renderSidebars();
prepareNavigation();
resetInteractiveStates();
updateFailureMessage();
document.fonts.ready.then(fitScreen);
setViewMode('dual');
setStep('h2');
