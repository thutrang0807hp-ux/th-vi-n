const preferenceKey = 'lofi:focus-companion:v1';
const phases = {
  idle: 'Đang thư giãn',
  focus: 'Đồng hành trong phiên tập trung',
  short: 'Đang nghỉ ngắn',
  long: 'Đang nghỉ dài',
  paused: 'Đang nghỉ cùng bạn',
};
const silent = { activity:'idle', weight:0, phase:'idle', time:0, strength:0, smile:false };

export function mountFocusCompanion(panel, { reduced, celebrate }) {
  const enabledInput = panel.querySelector('#focus-companion-enabled');
  const intensityInput = panel.querySelector('#focus-companion-intensity');
  const label = panel.querySelector('#focus-companion-state');
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(preferenceKey)) ?? {}; } catch {}
  enabledInput.checked = saved.enabled !== false;
  intensityInput.value = Number.isFinite(saved.intensity) ? saved.intensity : 45;
  let session;
  let phase = 'idle';
  let phaseTime = 0;
  let activity = 'idle';
  let weight = 0;
  let smileUntil = 0;
  let lastReaction = -Infinity;
  const listeners = new AbortController();
  const eventOptions = { signal:listeners.signal };

  function preferences() {
    return { enabled:enabledInput.checked && !reduced, strength:Number(intensityInput.value)/100 };
  }
  function onPreference() {
    const value = Number(intensityInput.value);
    try { localStorage.setItem(preferenceKey,JSON.stringify({enabled:enabledInput.checked,intensity:value})); } catch {}
    if (!enabledInput.checked || !value) smileUntil = 0;
    updateLabel();
  }
  function updateLabel() {
    const { enabled, strength } = preferences();
    const value = reduced ? 'Giảm chuyển động đang bật'
      : enabled && strength ? phases[phase] : 'Phản ứng đang tắt';
    if (label.textContent !== value) label.textContent = value;
  }
  function receive(event) {
    session = event.detail;
    const next = session.running
      ? ({'25':'focus','5':'short','15':'long'}[session.mode] ?? 'idle')
      : session.sessionId && session.mode !== 'up' ? 'paused' : 'idle';
    if (next !== phase) {
      phase = next;
      phaseTime = 0;
      updateLabel();
    }
  }
  function react() {
    const now = performance.now();
    const { enabled, strength } = preferences();
    if (!enabled || !strength || now-lastReaction < 14000) return;
    if (!celebrate(strength)) return;
    lastReaction = now;
    smileUntil = now + (900+strength*550);
  }
  for (const [name, handler] of [['focus:session',receive],['focus:completed',react],['task:completed',react]]) {
    panel.addEventListener(name,handler,eventOptions);
  }
  enabledInput.addEventListener('change',onPreference,eventOptions);
  intensityInput.addEventListener('input',onPreference,eventOptions);
  window.addEventListener('pagehide',event => {
    if (!event.persisted) listeners.abort();
  },eventOptions);
  updateLabel();

  function reset() { activity = 'idle'; weight = 0; }

  function frame(dt, { seated, manual }) {
    const { enabled, strength } = preferences();
    phaseTime += dt;
    if ((!seated || manual) && !weight) {
      return { ...silent, smile:enabled && performance.now()<smileUntil };
    }
    const inFocus = enabled && strength > 0 && seated && !manual && phase === 'focus';
    const elapsed = (session?.elapsed ?? 0) +
      (session?.startedAt == null ? 0 : Math.max(0,Date.now()-session.startedAt));
    const teaWindow = elapsed % 150000;
    const desired = !inFocus ? 'idle'
      : strength >= .35 && elapsed >= 150000 && teaWindow < 5200 ? 'tea'
      : session?.taskId ? 'write' : 'read';
    if (desired !== activity) {
      weight = Math.max(0,weight - dt*3.8);
      if (!weight) activity = desired;
    } else {
      weight = activity === 'idle' ? 0 : Math.min(1,weight + dt*3.0);
    }
    const blended = weight*weight*(3-2*weight);
    return { activity, weight:blended, phase, time:phaseTime,
      strength:enabled && seated && !manual ? strength : 0, smile:enabled && performance.now()<smileUntil };
  }
  return { frame, reset };
}
