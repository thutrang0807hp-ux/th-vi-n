import { mountFocusPlanner } from './planner.js';
import { showFocusPanel, mountFocusSound } from './sound.js';
import { mountFocusTimer } from './timer.js';

export function mountFocusFallback() {
  const panel = document.querySelector('#focus-panel');
  const widget = document.querySelector('#focus-widget');
  const route = document.querySelector('#route-picker');
  const focusRoute = panel.querySelector('#focus-route');
  document.body.classList.add('focus-static');
  focusRoute.replaceChildren(...Array.from(route.options, option => option.cloneNode(true)));
  focusRoute.value = route.value;
  focusRoute.addEventListener('change', () => {
    route.value = focusRoute.value;
    route.dispatchEvent(new Event('change'));
  });
  function toggle() {
    if (panel.open) panel.close();
    else {
      focusRoute.value = route.value;
      showFocusPanel(panel);
    }
  }
  document.querySelector('#focus-toggle').addEventListener('click',toggle);
  widget.querySelector('[data-widget-open]').addEventListener('click',toggle);
  window.addEventListener('keydown',event => {
    if (event.code !== 'KeyF' || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    if (!event.target.matches?.('input, select, textarea, [contenteditable]')) toggle();
  });
  mountFocusPlanner(panel);
  mountFocusTimer(panel,widget);
  mountFocusSound(panel,{moving:false,route:route.value}).setTrainMoving(false);
}
