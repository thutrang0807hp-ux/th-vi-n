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

function glide(parameter, target, context, fade = 0.12) {
  const now = context.currentTime;
  if (parameter.cancelAndHoldAtTime) parameter.cancelAndHoldAtTime(now);
  else {
    const current = parameter.value;
    parameter.cancelScheduledValues(now);
    parameter.setValueAtTime(current,now);
  }
  parameter.setTargetAtTime(target,now,fade);
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
  let context;
  let master;
  let navigatingAway = false;

  function remember() {
    try { localStorage.setItem(storageKey,JSON.stringify(state)); }
    catch { saveStatus.textContent = 'Trình duyệt chưa cho phép lưu bộ âm.'; }
  }

  function activate() {
    playing = true;
    context = focusAudioContext();
    if (context && !master) {
      master = context.createGain();
      master.gain.value = state.master / 100;
      master.connect(context.destination);
    }
    if (context?.state === 'suspended') void context.resume().catch(() => {});
  }

  function setChannelStatus(channel, label) {
    if (channel.status.textContent !== label) channel.status.textContent = label;
  }

  function createTrack(channel) {
    const element = new Audio();
    element.loop = true;
    element.preload = 'none';
    const base = view.dataset.audioBase + 'focus-' + channel.id;
    let usingOgg = Boolean(element.canPlayType('audio/ogg; codecs="opus"'));
    element.src = base + (usingOgg ? '.ogg' : '.mp3');
    element.volume = 0;
    channel.element = element;
    if (context && master) {
      try {
        channel.source = context.createMediaElementSource(element);
        channel.gain = context.createGain();
        channel.gain.gain.value = 0;
        channel.source.connect(channel.gain).connect(master);
        element.volume = 1;
      } catch {}
    }
    element.addEventListener('waiting', () => {
      if (channel.wanted) setChannelStatus(channel,'Đang tải…');
    });
    element.addEventListener('playing', () => {
      if (channel.wanted) setChannelStatus(channel,'Đang phát');
    });
    element.addEventListener('error', () => {
      if (!channel.wanted || channel.element !== element) return;
      if (usingOgg) {
        usingOgg = false;
        element.src = base + '.mp3';
        apply(channel,true);
      } else {
        setChannelStatus(channel,'Lỗi tải âm thanh');
      }
    });
  }

  function setGain(channel, level) {
    if (channel.gain) {
      glide(channel.gain.gain,level,context);
      return;
    }
    if (!channel.element) return;
    clearInterval(channel.volumeTick);
    const from = channel.element.volume;
    const started = performance.now();
    channel.volumeTick = setInterval(() => {
      const t = Math.min(1,(performance.now()-started)/350);
      channel.element.volume = from + (level*state.master/100-from)*t;
      if (t === 1) clearInterval(channel.volumeTick);
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
        if (!channel.wanted || channel.attempt !== attempt || error.name === 'AbortError') return;
        setChannelStatus(channel,'Chưa phát được · thử bật lại');
      });
    }
  }

  function applyAll(retry = false) {
    toggle.textContent = playing ? 'Tạm dừng âm thanh' : 'Phát âm thanh';
    toggle.setAttribute('aria-pressed', playing);
    masterInput.value = state.master;
    if (master) glide(master.gain,state.master/100,context);
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
      if (input.checked) activate();
      remember();
      applyAll();
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
      if (!Object.values(state.channels).some(channel => channel.on)) {
        state.channels.lofi.on = true;
        remember();
      }
      activate();
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
    activate();
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
      channel.source?.disconnect();
      channel.gain?.disconnect();
      channel.element = channel.source = channel.gain = undefined;
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

function mountYouTube(view) {
  const form = view.querySelector('#focus-youtube-form');
  const input = view.querySelector('#focus-youtube-url');
  const status = view.querySelector('#focus-youtube-status');
  let dock;
  form.addEventListener('submit',event => {
    event.preventDefault();
    const link = parseYouTubeLink(input.value);
    if (!link) {
      status.textContent = 'Hãy dán link video hoặc danh sách phát YouTube hợp lệ.';
      input.focus();
      return;
    }
    status.textContent = '';
    dock?.remove();
    dock = document.createElement('section');
    dock.className = 'youtube-dock';
    dock.setAttribute('aria-label','Trình phát YouTube');
    const controls = document.createElement('div');
    const open = document.createElement('a');
    open.href = link.direct;
    open.target = '_blank';
    open.rel = 'noopener noreferrer';
    open.textContent = 'Mở trên YouTube';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Đóng';
    close.addEventListener('click',() => {
      dock.remove();
      dock = undefined;
      document.querySelector('#focus-toggle')?.focus();
    });
    const frame = document.createElement('iframe');
    frame.src = link.embed;
    frame.title = 'Trình phát YouTube';
    frame.allow = 'encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    controls.append(open,close);
    dock.append(controls,frame);
    document.querySelector('main').append(dock);
    view.closest('dialog').close();
    close.focus();
  });
  window.addEventListener('pagehide',() => {
    dock?.remove();
    dock = undefined;
  });
}
