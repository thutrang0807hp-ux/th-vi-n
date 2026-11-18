const tracks = {
  lofi: ['Nhạc lofi', 36],
  piano: ['Piano nhẹ', 38],
  rail: ['Tiếng bánh tàu', 32],
  wind: ['Gió ngoài cửa', 27],
  rain: ['Mưa', 42],
  waves: ['Sóng biển', 38],
  birds: ['Chim rừng', 22],
  stream: ['Suối chảy', 27],
  cafe: ['Quán cà phê', 20],
  fire: ['Lò sưởi', 26],
  night: ['Đêm yên', 26],
};
const presets = {
  train: { rail: 33, wind: 23 },
  rain: { rain: 40, rail: 19, cafe: 12 },
  coast: { waves: 37, wind: 20, rail: 21 },
};
const storageKey = 'lofi:focus-mixer:v1';
let sharedContext;

export function focusAudioContext() {
  const Audio = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (Audio && !sharedContext) {
    try { sharedContext = new Audio(); } catch {}
  }
  return sharedContext;
}

const clampVolume = (value, fallback) => Number.isFinite(value)
  ? Math.max(0, Math.min(100, value)) : fallback;
function settings() {
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(storageKey)) ?? {}; } catch {}
  const channels = Object.fromEntries(Object.entries(tracks).map(([id, [, fallback]]) => [
    id, { on: stored.channels?.[id]?.on === true, level: clampVolume(stored.channels?.[id]?.level, fallback) },
  ]));
  const custom = {};
  for (const id of Object.keys(presets)) {
    if (!stored.presets?.[id] || typeof stored.presets[id] !== 'object') continue;
    custom[id] = Object.fromEntries(Object.entries(stored.presets[id])
      .filter(([name, level]) => Object.hasOwn(tracks,name) && Number.isFinite(level))
      .map(([name, level]) => [name,clampVolume(level,0)]));
  }
  return { master:clampVolume(stored.master,68), channels, presets:custom,
    selected:Object.hasOwn(presets,stored.selected) ? stored.selected : 'train' };
}

const mountedMixers = new WeakMap();
export function mountFocusSound(panel, { moving, route }) {
  if (mountedMixers.has(panel)) return mountedMixers.get(panel);
  const view = panel.querySelector('[data-focus-view="sound"]');
  const list = view.querySelector('#focus-audio-list');
  const masterInput = view.querySelector('#focus-audio-master');
  const toggle = view.querySelector('#focus-audio-play');
  const presetPicker = view.querySelector('#focus-audio-preset');
  const saveStatus = view.querySelector('#focus-audio-status');
  const hint = view.querySelector('#focus-sound-recommendation');
  const state = settings();
  const channels = new Map();
  let playing = false;
  let trainMoving = moving;
  let navigatingAway = false;

  function remember() {
    try { localStorage.setItem(storageKey,JSON.stringify(state)); }
    catch { saveStatus.textContent = 'Trình duyệt chưa cho phép lưu bộ âm.'; }
  }

  function setChannelStatus(channel, label) {
    if (channel.status.textContent !== label) channel.status.textContent = label;
  }

  function previewMirror(url) {
    if (!['raw.githack.com', 'rawcdn.githack.com'].includes(url.hostname)) return;
    return new URL(url.pathname, 'https://raw.githubusercontent.com');
  }

  function createTrack(channel, { mirror = false } = {}) {
    const element = new Audio();
    element.loop = true;
    element.preload = 'none';
    const base = new URL(view.dataset.audioBase + 'focus-' + channel.id, document.baseURI);
    const source = mirror ? previewMirror(base) : base;
    let usingOgg = !mirror && Boolean(element.canPlayType('audio/ogg; codecs="opus"'));
    element.src = source.href + (usingOgg ? '.ogg' : '.mp3');
    element.volume = 0;
    channel.element = element;
    element.addEventListener('waiting', () => {
      if (channel.wanted && channel.element === element) setChannelStatus(channel,'Đang tải…');
    });
    element.addEventListener('playing', () => {
      if (channel.wanted && channel.element === element) setChannelStatus(channel,'Đang phát');
    });
    element.addEventListener('error', () => {
      if (!channel.wanted || channel.element !== element) return;
      if (usingOgg) {
        usingOgg = false;
        element.src = base.href + '.mp3';
        apply(channel,true);
      } else if (!mirror && previewMirror(base)) {
        createTrack(channel, { mirror: true });
        element.pause();
        element.removeAttribute('src');
        element.load();
        apply(channel,true);
      } else {
        setChannelStatus(channel,'Lỗi tải âm thanh');
      }
    });
  }

  function setGain(channel, level) {
    if (!channel.element) return;
    clearInterval(channel.volumeTick);
    const element = channel.element;
    const target = level * state.master / 100;
    const from = element.volume;
    if (target > 0) element.muted = false;
    const started = performance.now();
    channel.volumeTick = setInterval(() => {
      const t = Math.min(1,(performance.now()-started)/350);
      element.volume = from + (target - from) * t;
      if (t === 1) {
        element.muted = target === 0;
        clearInterval(channel.volumeTick);
      }
    },35);
  }

  function apply(channel, retry = false) {
    const pref = state.channels[channel.id];
    channel.input.checked = pref.on;
    channel.slider.value = pref.level;
    const wanted = playing && pref.on && (channel.id !== 'rail' || trainMoving);
    if (!wanted) {
      const wasPlaying = channel.wanted;
      channel.wanted = false;
      if (channel.element && wasPlaying) {
        setGain(channel,0);
        clearTimeout(channel.pauseAfter);
        channel.pauseAfter = setTimeout(() => {
          if (!channel.wanted) channel.element.pause();
        },520);
      }
      setChannelStatus(channel,pref.on && channel.id === 'rail' && !trainMoving ? 'Tàu đang dừng' : '');
      return;
    }

    clearTimeout(channel.pauseAfter);
    if (!channel.element) createTrack(channel);
    const wasPlaying = channel.wanted;
    channel.wanted = true;
    setGain(channel,pref.level/100);
    const element = channel.element;
    if ((retry || !wasPlaying) && element.paused) {
      if (retry && element.error) element.load();
      setChannelStatus(channel,'Đang tải…');
      const attempt = ++channel.attempt;
      element.play().catch(error => {
        if (!channel.wanted || channel.element !== element || channel.attempt !== attempt || error.name === 'AbortError') return;
        setChannelStatus(channel,'Chưa phát được · thử bật lại');
      });
    }
  }

  function applyAll(retry = false) {
    toggle.textContent = playing ? 'Tạm dừng âm thanh' : 'Phát âm thanh';
    toggle.setAttribute('aria-pressed', playing);
    masterInput.value = state.master;
    const mutedMessage = 'Âm lượng tổng đang ở 0%. Kéo thanh âm lượng lên để nghe.';
    if (playing && state.master === 0) saveStatus.textContent = mutedMessage;
    else if (saveStatus.textContent === mutedMessage) saveStatus.textContent = '';
    for (const channel of channels.values()) apply(channel,retry);
  }

  for (const [id,[name]] of Object.entries(tracks)) {
    const row = document.createElement('div');
    row.className = 'sound-track';
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    label.append(input,document.createTextNode(' ' + name));
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.setAttribute('aria-label','Âm lượng ' + name);
    const status = document.createElement('small');
    status.setAttribute('role','status');
    row.append(label,slider,status);
    list.append(row);
    const channel = { id,input,slider,status,wanted:false,attempt:0 };
    channels.set(id,channel);

    input.addEventListener('change', () => {
      state.channels[id].on = input.checked;
      if (input.checked) playing = true;
      remember();
      applyAll(input.checked);
    });
    slider.addEventListener('input', () => {
      state.channels[id].level = Number(slider.value);
      remember();
      apply(channel);
    });
  }

  masterInput.addEventListener('input', () => {
    state.master = Number(masterInput.value);
    remember();
    applyAll();
  });
  toggle.addEventListener('click', () => {
    if (playing) playing = false;
    else {
      if (!Object.entries(state.channels).some(([id, channel]) =>
        channel.on && channel.level > 0 && (id !== 'rail' || trainMoving))) {
        state.channels.lofi.on = true;
        if (state.channels.lofi.level === 0) state.channels.lofi.level = tracks.lofi[1];
        remember();
      }
      playing = true;
    }
    applyAll(true);
  });
  function choosePreset(id) {
    const levels = state.presets[id] ?? presets[id];
    for (const [name,pref] of Object.entries(state.channels)) {
      pref.on = Object.hasOwn(levels,name);
      if (pref.on) pref.level = levels[name];
    }
    state.selected = id;
    presetPicker.value = id;
    playing = true;
    remember();
    applyAll(true);
    saveStatus.textContent = 'Đã áp dụng bộ âm.';
  }
  view.querySelector('#focus-audio-apply').addEventListener('click',() => choosePreset(presetPicker.value));
  view.querySelector('#focus-audio-save').addEventListener('click', () => {
    state.selected = presetPicker.value;
    state.presets[state.selected] = Object.fromEntries(Object.entries(state.channels)
      .filter(([,pref]) => pref.on).map(([id,pref]) => [id,pref.level]));
    saveStatus.textContent = 'Đã lưu bộ âm tùy chỉnh.';
    remember();
  });
  presetPicker.value = state.selected;
  if (route === 'ocean') {
    hint.hidden = false;
    hint.addEventListener('click',() => choosePreset('coast'));
  }
  window.addEventListener('pagehide', () => {
    navigatingAway = true;
    playing = false;
    for (const channel of channels.values()) {
      clearTimeout(channel.pauseAfter);
      clearInterval(channel.volumeTick);
      channel.wanted = false;
      if (channel.element) {
        channel.element.pause();
        channel.element.removeAttribute('src');
        channel.element.load();
      }
      channel.element = undefined;
    }
  });
  window.addEventListener('pageshow', () => {
    if (!navigatingAway) return;
    navigatingAway = false;
    applyAll();
  });
  mountYouTube(view);
  applyAll();
  const mixer = {
    setTrainMoving(value) {
      trainMoving = value;
      apply(channels.get('rail'));
    },
  };
  mountedMixers.set(panel,mixer);
  return mixer;
}

export function parseYouTubeLink(value) {
  let url;
  try { url = new URL(value.trim()); } catch { return null; }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return null;
  const [path, segment] = url.pathname.split('/').filter(Boolean);
  let id;
  if (url.hostname === 'youtu.be') id = path;
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(url.hostname)) {
    if (path === 'watch') id = url.searchParams.get('v');
    else if (['shorts', 'live', 'embed'].includes(path)) id = segment;
  } else return null;
  const playlist = url.searchParams.get('list');
  const video = /^[A-Za-z0-9_-]{11}$/.test(id ?? '') ? id : null;
  const list = /^[A-Za-z0-9_-]{10,80}$/.test(playlist ?? '') ? playlist : null;
  if (!video && !list) return null;
  const embed = new URL('https://www.youtube.com/embed/' + (video ?? 'videoseries'));
  const direct = new URL('https://www.youtube.com/' + (video ? 'watch' : 'playlist'));
  if (video) direct.searchParams.set('v',video);
  if (list) {
    embed.searchParams.set('list',list);
    direct.searchParams.set('list',list);
  }
  embed.searchParams.set('playsinline','1');
  return { embed:embed.href, direct:direct.href };
}

function enableDockMovement(dock, handle, signal) {
  const margin = 8;
  let drag;

  function place(x, y) {
    const { width, height } = dock.getBoundingClientRect();
    dock.style.left = Math.max(margin, Math.min(x, innerWidth - width - margin)) + 'px';
    dock.style.top = Math.max(margin, Math.min(y, innerHeight - height - margin)) + 'px';
    dock.style.bottom = 'auto';
  }

  function fit() {
    const { left, top } = dock.getBoundingClientRect();
    place(left, top);
  }

  handle.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    const { left, top } = dock.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX - left, y: event.clientY - top };
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', event => {
    if (drag?.id === event.pointerId) place(event.clientX - drag.x, event.clientY - drag.y);
  });
  handle.addEventListener('lostpointercapture', () => { drag = undefined; });
  handle.addEventListener('keydown', event => {
    const offset = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[event.key];
    if (!offset) return;
    event.preventDefault();
    event.stopPropagation();
    const { left, top } = dock.getBoundingClientRect();
    place(left + offset[0], top + offset[1]);
  });
  window.addEventListener('resize', fit, { signal });
  return fit;
}

export function showFocusPanel(panel) {
  if (document.querySelector('.youtube-dock')) panel.show();
  else panel.showModal();
}

function mountYouTube(view) {
  const form = view.querySelector('#focus-youtube-form');
  const input = view.querySelector('#focus-youtube-url');
  const status = view.querySelector('#focus-youtube-status');
  const panel = view.closest('dialog');
  let dock;
  let movement;
  function removeDock() {
    movement?.abort();
    dock?.remove();
    dock = undefined;
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel.open && !panel.matches(':modal')) panel.close();
  });
  form.addEventListener('submit',event => {
    event.preventDefault();
    const link = parseYouTubeLink(input.value);
    if (!link) {
      status.textContent = 'Hãy dán link video hoặc danh sách phát YouTube hợp lệ.';
      input.focus();
      return;
    }
    status.textContent = '';
    removeDock();
    movement = new AbortController();
    dock = document.createElement('section');
    dock.className = 'youtube-dock';
    dock.setAttribute('aria-label','Trình phát YouTube');
    const controls = document.createElement('div');
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'youtube-drag';
    const record = document.createElement('span');
    record.className = 'youtube-vinyl';
    record.setAttribute('aria-hidden', 'true');
    const grip = document.createElement('span');
    grip.className = 'youtube-grip';
    grip.textContent = '⠿';
    grip.setAttribute('aria-hidden', 'true');
    handle.append(record, grip);
    handle.setAttribute('aria-label', 'Di chuyển trình phát YouTube');
    handle.title = 'Kéo hoặc dùng phím mũi tên';
    const fit = enableDockMovement(dock, handle, movement.signal);
    const open = document.createElement('a');
    open.href = link.direct;
    open.target = '_blank';
    open.rel = 'noopener noreferrer';
    open.textContent = '↗';
    open.title = 'Mở trên YouTube';
    open.setAttribute('aria-label', open.title);
    const collapse = document.createElement('button');
    collapse.type = 'button';
    collapse.textContent = 'Thu gọn';
    collapse.setAttribute('aria-expanded', 'true');
    collapse.title = 'Thu gọn và dừng video trong toa';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '×';
    close.title = 'Đóng';
    close.setAttribute('aria-label', close.title);
    close.addEventListener('click',() => {
      removeDock();
      (panel.open ? input : document.querySelector('#focus-toggle'))?.focus();
    });
    const frame = document.createElement('iframe');
    frame.src = link.embed;
    frame.title = 'Trình phát YouTube';
    frame.allow = 'encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    collapse.addEventListener('click', () => {
      const expanded = frame.isConnected;
      if (expanded) frame.remove();
      else dock.append(frame);
      dock.classList.toggle('youtube-dock--compact', expanded);
      heading.hidden = !expanded;
      collapse.textContent = expanded ? 'Hiện video' : 'Thu gọn';
      collapse.setAttribute('aria-expanded', String(!expanded));
      fit();
    });
    const heading = document.createElement('div');
    heading.className = 'youtube-mini-heading';
    heading.hidden = true;
    const name = document.createElement('strong');
    name.textContent = 'YouTube';
    const playbackStatus = document.createElement('small');
    playbackStatus.textContent = 'Video đã dừng';
    heading.append(name, playbackStatus);
    controls.append(handle,heading,collapse,open,close);
    dock.append(controls,frame);
    document.querySelector('main').append(dock);
    if (dock.getBoundingClientRect().top < 8) fit();
    panel.close();
    close.focus();
  });
  window.addEventListener('pagehide', removeDock);
}
