import { focusAudioContext } from './sound.js';
const MINUTE = 60000;
const defaults = { 25: 25, 5: 5, 15: 15 };
const labels = { 25: 'Tập trung', 5: 'Nghỉ ngắn', 15: 'Nghỉ dài', up: 'Bấm giờ' };

export function initialTimer() {
  return { mode: '25', minutes: { ...defaults }, elapsed: 0, startedAt: null,
    id: null, taskId: null, completed: 0, autoBreak: false, autoFocus: false, chime: false,
    notify: false, notice: '' };
}

export function timerReading(state, now) {
  return Math.max(0, state.elapsed + (state.startedAt === null ? 0 : Math.max(0, now - state.startedAt)));
}

export function transitionTimer(previous, action, now, makeId = () => crypto.randomUUID(), selectedTask = null) {
  let state = previous;
  let record;
  const reset = (mode, notice = '') =>
    ({ ...state, mode, elapsed: 0, startedAt: null, id: null, taskId: null, notice });
  const begin = () => ({
    ...state, startedAt: now, id: state.id ?? makeId(),
    taskId: state.mode === '25' ? (state.id ? state.taskId ?? null : selectedTask) : null,
    notice: '',
  });
  const length = state.minutes[state.mode] * MINUTE;
  if (state.mode !== 'up' && state.startedAt !== null && timerReading(state, now) >= length) {
    const endedAt = state.startedAt + Math.max(0, length - state.elapsed);
    const isFocus = state.mode === '25';
    const completed = state.completed + Number(isFocus);
    record = { id: state.id, mode: state.mode, endedAt, duration: length, taskId: state.taskId ?? null };
    const next = isFocus ? (completed % 4 === 0 ? '15' : '5') : '25';
    const auto = (isFocus ? state.autoBreak : state.autoFocus) && now - endedAt < MINUTE;
    state = { ...reset(next, `Đã xong · ${labels[next]}`), completed };
    if (auto) state = { ...begin(), notice: `Đã xong · ${labels[next]}` };
    if (action.type === 'toggle' || action.type === 'skip') return { state, record };
  }

  switch (action.type) {
    case 'toggle':
      state = state.startedAt === null ? begin()
        : { ...state, elapsed: timerReading(state, now), startedAt: null, notice: '' };
      break;
    case 'mode':
      if (Object.hasOwn(labels, action.mode) && action.mode !== state.mode) state = reset(action.mode);
      break;
    case 'reset':
      state = reset(state.mode);
      break;
    case 'skip':
      if (state.mode !== 'up') {
        const isFocus = state.mode === '25';
        state = reset(isFocus ? '5' : '25', 'Đã bỏ qua phiên');
        if (isFocus ? state.autoBreak : state.autoFocus) state = begin();
      }
      break;
    case 'duration': {
      const minutes = Number(action.value);
      if (Object.hasOwn(defaults, action.mode) && Number.isInteger(minutes) && minutes >= 1 && minutes <= 180) {
        const active = state.mode === action.mode && (state.startedAt !== null || state.elapsed > 0);
        if (!active) state = { ...state, minutes: { ...state.minutes, [action.mode]: minutes } };
      }
      break;
    }
    case 'setting':
      if (['autoBreak','autoFocus','chime','notify'].includes(action.key)) {
        state = { ...state, [action.key]: Boolean(action.value) };
      }
      break;
  }
  return { state, record };
}

export function openStorage() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error('Unavailable'));
    const request = indexedDB.open('lofi-train-focus', 2);
    request.onupgradeneeded = event => {
      if (event.oldVersion < 1) {
        request.result.createObjectStore('timer');
        request.result.createObjectStore('sessions', { keyPath: 'id' });
      }
      request.result.createObjectStore('planner');
    };
    request.onsuccess = () => {
      const connection = request.result;
      connection.onversionchange = () => connection.close();
      resolve(connection);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Blocked'));
  });
}

function transact(db, action) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['timer','sessions','planner'], 'readwrite');
    const store = tx.objectStore('timer');
    const request = store.get('current');
    const planner = tx.objectStore('planner').get('current');
    let result;
    planner.onsuccess = () => {
      const previous = request.result ?? initialTimer();
      const selected = planner.result?.activeTaskId ?? null;
      result = transitionTimer(previous, action, Date.now(), undefined, selected);
      if (result.state !== previous) store.put(result.state, 'current');
      if (result.record) tx.objectStore('sessions').add(result.record);
    };
    tx.oncomplete = () => resolve(result);
    tx.onabort = () => reject(tx.error);
  });
}

const mountedTimers = new WeakSet();
export function mountFocusTimer(panel, widget) {
  if (mountedTimers.has(panel)) return;
  mountedTimers.add(panel);
  let state = initialTimer();
  let db = openStorage().catch(() => null);
  let queue = Promise.resolve();
  let expiryQueued = false;
  let context;
  const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('lofi-train-focus');
  const clock = panel.querySelector('#focus-clock');
  const status = panel.querySelector('#focus-status');
  const start = panel.querySelector('#timer-start');
  const skip = panel.querySelector('#timer-skip');
  const modes = [...panel.querySelectorAll('[data-focus-mode]')];
  const settings = [...panel.querySelectorAll('[data-focus-setting]')];
  const durations = [...panel.querySelectorAll('[data-focus-duration]')];
  const smallClock = widget.querySelector('time');
  const smallLabel = widget.querySelector('.focus-widget-label');
  const smallAction = widget.querySelector('[data-widget-start]');
  const storageNote = panel.querySelector('#focus-storage-note');
  const alert = widget.querySelector('.focus-widget-notice');

  function text(element, value) {
    if (element.textContent !== value) element.textContent = value;
  }
  function sound() {
    if (!context || context.state !== 'running') return;
    const now = context.currentTime;
    for (const [offset, pitch] of [[0, 523.25], [0.12, 659.25]]) {
      const voice = context.createOscillator();
      const volume = context.createGain();
      voice.type = 'sine';
      voice.frequency.value = pitch;
      volume.gain.setValueAtTime(0, now + offset);
      volume.gain.linearRampToValueAtTime(0.055, now + offset + 0.025);
      volume.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.3);
      voice.connect(volume).connect(context.destination);
      voice.start(now + offset);
      voice.stop(now + offset + 0.32);
    }
  }
  function armChime() {
    context = focusAudioContext();
    if (context) void context.resume().catch(() => {});
  }
  function completion(record) {
    if (state.chime) sound();
    if (state.notify && document.hidden && globalThis.Notification?.permission === 'granted') {
      try { new Notification(record.mode === '25' ? 'Đã xong phiên tập trung' : 'Đã hết giờ nghỉ'); } catch {}
    }
    panel.dispatchEvent(new CustomEvent(record.mode === '25' ? 'focus:completed' : 'break:completed',
      { detail: record, bubbles: true }));
  }
  function draw() {
    const now = Date.now();
    const elapsed = timerReading(state, now);
    const up = state.mode === 'up';
    const length = state.minutes[state.mode] * MINUTE;
    const seconds = up ? Math.floor(elapsed / 1000) : Math.ceil(Math.max(0,length-elapsed) / 1000);
    const digits = value => String(value).padStart(2,'0');
    const value = `${digits(Math.floor(seconds/60))}:${digits(seconds%60)}`;
    const progress = up ? (seconds % 60) / 60 : 1 - seconds * 1000 / length;
    const button = state.startedAt !== null ? 'Tạm dừng' : state.elapsed ? 'Tiếp tục' : 'Bắt đầu';
    text(clock,value);
    text(smallClock,value);
    text(smallLabel, labels[state.mode]);
    text(start,button);
    text(smallAction,button);
    text(alert,state.notice);
    text(status,state.notice || (state.startedAt !== null ? 'Đang chạy' : state.elapsed ? 'Đang tạm dừng' : 'Sẵn sàng'));
    const progressValue = Math.min(100,Math.max(0,progress*100)).toFixed(2)+'%';
    if (panel.style.getPropertyValue('--focus-progress') !== progressValue) {
      panel.style.setProperty('--focus-progress',progressValue);
      widget.style.setProperty('--focus-progress',progressValue);
    }
    if (!up && !seconds && state.startedAt !== null && !expiryQueued) {
      expiryQueued = true;
      dispatch({ type: 'tick' }).finally(() => { expiryQueued = false; });
    }
  }
  function syncControls() {
    for (const mode of modes) {
      const id = mode.dataset.focusMode;
      mode.setAttribute('aria-pressed', id === state.mode);
      if (id !== 'up') text(mode.querySelector('small'), `${state.minutes[id]} phút`);
    }
    for (const input of settings) input.checked = state[input.dataset.focusSetting];
    for (const input of durations) {
      input.value = state.minutes[input.dataset.focusDuration];
      input.disabled = input.dataset.focusDuration === state.mode &&
        (state.startedAt !== null || state.elapsed > 0);
    }
    skip.disabled = state.mode === 'up';
  }
  function dispatch(action) {
    const run = async () => {
      const connection = await db;
      let result;
      if (connection) {
        try { result = await transact(connection, action); }
        catch { db = Promise.resolve(null); }
      }
      storageNote.hidden = Boolean(result);
      result ??= transitionTimer(state,action,Date.now());
      state = result.state;
      syncControls();
      panel.dispatchEvent(new CustomEvent('focus:session', { detail: {
        active: state.id !== null && state.mode === '25', taskId: state.taskId ?? null,
        mode: state.mode, running: state.startedAt !== null, sessionId: state.id,
        elapsed: state.elapsed, startedAt: state.startedAt,
      } }));
      if (result.record) completion(result.record);
      if (result.record || action.type !== 'tick') channel?.postMessage('sync');
      draw();
    };
    queue = queue.then(run, run);
    return queue;
  }
  const toggle = () => {
    if (state.chime) armChime();
    void dispatch({type:'toggle'});
  };
  start.addEventListener('click',toggle);
  smallAction.addEventListener('click',toggle);
  panel.querySelector('#timer-reset').addEventListener('click',() => dispatch({type:'reset'}));
  skip.addEventListener('click',() => dispatch({type:'skip'}));
  for (const mode of modes) mode.addEventListener('click',() => dispatch({type:'mode',mode:mode.dataset.focusMode}));
  for (const input of durations) input.addEventListener('change',() =>
    dispatch({type:'duration',mode:input.dataset.focusDuration,value:input.value}));
  for (const input of settings) input.addEventListener('change',async () => {
    const key = input.dataset.focusSetting;
    let value = input.checked;
    if (key === 'chime' && value) armChime();
    if (key === 'notify' && value) {
      try { value = await globalThis.Notification?.requestPermission() === 'granted'; }
      catch { value = false; }
    }
    void dispatch({type:'setting',key,value});
  });
  const refresh = () => dispatch({type:'tick'});
  channel?.addEventListener('message',refresh);
  window.addEventListener('pageshow',refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void refresh(); });
  window.setInterval(draw,500);
  void refresh();
}
