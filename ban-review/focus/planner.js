import { openStorage } from './timer.js';

const taskStates = { todo: 'Chưa làm', doing: 'Đang làm', done: 'Hoàn thành' };
const draftPrefix = 'lofi:focus-note:';
const blank = () => ({ tasks: [], notes: [], activeTaskId: null });

function readPlanner(db, edit) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(edit ? ['planner'] : ['planner', 'sessions'], edit ? 'readwrite' : 'readonly');
    const store = tx.objectStore('planner');
    const request = store.get('current');
    const history = edit ? null : tx.objectStore('sessions').getAll();
    let planner;
    request.onsuccess = () => {
      planner = request.result ?? blank();
      if (edit) {
        planner = edit(planner);
        store.put(planner, 'current');
      }
    };
    tx.oncomplete = () => resolve({ planner, history: history?.result ?? [] });
    tx.onabort = () => reject(tx.error);
  });
}

const mountedPlanners = new WeakSet();
export function mountFocusPlanner(panel) {
  if (mountedPlanners.has(panel)) return;
  mountedPlanners.add(panel);
  const get = id => panel.querySelector('#' + id);
  const tabs = [...panel.querySelectorAll('[data-focus-tab]')];
  const views = [...panel.querySelectorAll('[data-focus-view]')];
  const taskList = get('focus-task-list');
  const taskFilter = get('focus-task-filter');
  const taskForm = get('focus-task-form');
  const taskActive = get('focus-active-task');
  const taskCount = get('focus-task-count');
  const noteList = get('focus-note-list');
  const noteSearch = get('focus-note-search');
  const noteEditor = get('focus-note-editor');
  const noteTask = get('focus-note-task');
  const noteStatus = get('focus-note-status');
  const storageStatus = get('focus-planner-status');
  const chapter = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('lofi-focus-planner');
  const clock = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('lofi-train-focus');
  const connection = openStorage().catch(() => null);
  let data = blank();
  let counts = new Map();
  let taskId;
  let noteId;
  let session;
  let pending = new Map();
  let queue = Promise.resolve();
  let saveHandle;
  let storageAvailable = true;

  function selectTab(name) {
    for (const tab of tabs) tab.setAttribute('aria-pressed', tab.dataset.focusTab === name);
    for (const view of views) view.hidden = view.dataset.focusView !== name;
    if (name !== 'timer') void refresh();
  }
  for (const tab of tabs) tab.addEventListener('click', () => selectTab(tab.dataset.focusTab));
  function reportStorage() {
    storageStatus.hidden = storageAvailable;
  }
  function refresh(render = true) {
    const load = async () => {
      const db = await connection;
      if (db) {
        try {
          const result = await readPlanner(db);
          data = result.planner;
          counts = new Map();
          for (const item of result.history) {
            if (item.mode === '25' && item.taskId) counts.set(item.taskId, (counts.get(item.taskId) ?? 0) + 1);
          }
        } catch { storageAvailable = false; }
      } else {
        storageAvailable = false;
      }
      reportStorage();
      if (render) draw();
    };
    queue = queue.then(load, load);
    return queue;
  }
  function change(edit, final = true) {
    const save = async () => {
      const db = await connection;
      try {
        if (!db) throw new Error('Storage unavailable');
        const result = await readPlanner(db, edit);
        data = result.planner;
        chapter?.postMessage('changed');
        return true;
      } catch {
        if (storageAvailable) storageAvailable = false;
        data = edit(data);
        reportStorage();
        return false;
      } finally {
        if (final) draw();
      }
    };
    queue = queue.then(save, save);
    return queue;
  }

  function button(label, handle, selected = false) {
    const el = document.createElement('button');
    el.type = 'button';
    el.textContent = label;
    if (selected) el.setAttribute('aria-pressed', 'true');
    el.addEventListener('click', handle);
    return el;
  }
  function taskName(id) { return data.tasks.find(item => item.id === id)?.title; }
  function restoreNoteOptions() {
    const value = noteTask.value;
    noteTask.replaceChildren(new Option('Không gắn với công việc',''),
      ...data.tasks.map(item => new Option(item.title,item.id)));
    noteTask.value = data.tasks.some(item=>item.id===value) ? value : '';
  }
  function draw() {
    const activeTask = session?.active ? session.taskId : data.activeTaskId;
    const active = taskName(activeTask);
    taskActive.textContent = active ? (session?.active ? 'Việc trong phiên · ' : 'Việc cho phiên tới · ') + active : '';
    taskActive.hidden = !active;
    const showing = data.tasks.filter(item => taskFilter.value === 'all' ||
      (taskFilter.value === 'done' ? item.status === 'done' : item.status !== 'done'));
    taskList.replaceChildren(...showing.map(item => {
      const row = document.createElement('li');
      const copy = document.createElement('div');
      const name = document.createElement('strong');
      const meta = document.createElement('small');
      const progress = counts.get(item.id) ?? 0;
      name.textContent = item.title;
      meta.textContent = `${taskStates[item.status]} · ${progress}${item.estimate ? '/' + item.estimate : ''} phiên`;
      copy.append(name,meta);
      row.append(copy);
      if (item.status !== 'done') {
        row.append(button(data.activeTaskId===item.id ? 'Đã chọn' : 'Chọn', () => {
          void change(state => ({ ...state, activeTaskId: state.activeTaskId === item.id ? null : item.id }));
        }, data.activeTaskId===item.id));
      }
      row.append(button('Sửa', () => editTask(item.id)));
      return row;
    }));
    taskCount.textContent = showing.length ? '' : 'Chưa có công việc trong mục này.';
    const search = noteSearch.value.trim().toLocaleLowerCase('vi');
    const notes = data.notes.map(note => pending.get(note.id) ?? note)
      .filter(note => !search || (note.title+' '+note.body).toLocaleLowerCase('vi').includes(search))
      .sort((a,b) => b.updatedAt-a.updatedAt);
    noteList.replaceChildren(...notes.map(note => {
      const row = document.createElement('li');
      row.append(button(note.title || 'Ghi chú chưa đặt tên',() => openNote(note.id),note.id===noteId));
      return row;
    }));
    restoreNoteOptions();
  }
  function editTask(id) {
    taskId = id;
    taskForm.hidden = false;
    const item = data.tasks.find(task => task.id===id);
    get('task-title').value = item?.title ?? '';
    get('task-description').value = item?.description ?? '';
    get('task-priority').value = item?.priority ?? 'normal';
    get('task-estimate').value = item?.estimate ?? '';
    get('task-state').value = item?.status ?? 'todo';
    get('task-delete').hidden = !item;
    get('task-up').hidden = !item;
    get('task-down').hidden = !item;
    get('task-title').focus();
  }

  get('task-new').addEventListener('click', () => editTask());
  get('task-cancel').addEventListener('click', () => { taskForm.hidden = true; });
  taskFilter.addEventListener('change',draw);
  taskForm.addEventListener('submit',event => {
    event.preventDefault();
    const title = get('task-title').value.trim();
    if (!title) return;
    const id = taskId ?? crypto.randomUUID();
    const fields = {
      id,title, description: get('task-description').value.trim(), priority: get('task-priority').value,
      status: get('task-state').value, estimate: Number(get('task-estimate').value) || null,
    };
    let completed = false;
    void change(state => {
      const previous = state.tasks.find(item => item.id===id);
      completed = fields.status === 'done' && previous?.status !== 'done';
      const item = { ...fields, createdAt: previous?.createdAt ?? Date.now(),
        completedAt: fields.status==='done' ? previous?.completedAt ?? Date.now() : null };
      const tasks = previous ? state.tasks.map(task => task.id===id ? item : task) : [...state.tasks,item];
      return { ...state, tasks,
        activeTaskId: fields.status==='done' && state.activeTaskId===id ? null : state.activeTaskId };
    }).then(saved => {
      if (saved && completed) panel.dispatchEvent(new CustomEvent('task:completed',
        { detail:{ taskId:id }, bubbles:true }));
    });
    taskForm.hidden = true;
  });
  get('task-delete').addEventListener('click',() => {
    const id = taskId;
    if (!id || !confirm('Xóa công việc này?')) return;
    void change(state => ({ ...state, tasks: state.tasks.filter(item=>item.id!==id),
      notes: state.notes.map(note=>note.taskId===id ? {...note,taskId:null} : note),
      activeTaskId: state.activeTaskId===id ? null : state.activeTaskId }));
    taskForm.hidden = true;
  });
  function reorder(direction) {
    const id = taskId;
    void change(state => {
      const tasks = [...state.tasks];
      const index = tasks.findIndex(item=>item.id===id);
      const next = index + direction;
      if (index<0 || next<0 || next>=tasks.length) return state;
      [tasks[index],tasks[next]] = [tasks[next],tasks[index]];
      return {...state,tasks};
    });
  }
  get('task-up').addEventListener('click',() => reorder(-1));
  get('task-down').addEventListener('click',() => reorder(1));

  function flushNotes() {
    clearTimeout(saveHandle);
    if (!pending.size) return Promise.resolve();
    const snapshots = [...pending.entries()];
    return change(state => ({ ...state, notes: state.notes.map(note => {
      const update = snapshots.find(([id])=>id===note.id)?.[1];
      if (!update || update.updatedAt < note.updatedAt) return note;
      return { ...update, taskId: state.tasks.some(task => task.id===update.taskId) ? update.taskId : null };
    }) }), false).then(saved => {
      for (const [id,note] of snapshots) {
        if (pending.get(id)!==note) continue;
        if (saved) {
          pending.delete(id);
          try {
            const key = draftPrefix+id;
            if (localStorage.getItem(key) === JSON.stringify(note)) localStorage.removeItem(key);
          } catch {}
        }
      }
      noteStatus.textContent = saved ? 'Đã lưu' : 'Đã giữ bản nháp trong trang';
      draw();
    });
  }
  function openNote(id) {
    void flushNotes();
    noteId = id;
    const note = pending.get(id) ?? data.notes.find(item=>item.id===id);
    noteEditor.hidden = !note;
    if (!note) return;
    get('note-title').value = note.title;
    get('note-body').value = note.body;
    noteTask.value = note.taskId ?? '';
    noteStatus.textContent = '';
    draw();
  }
  get('note-new').addEventListener('click', async () => {
    await flushNotes();
    const id = crypto.randomUUID();
    const now = Date.now();
    await change(state => ({ ...state, notes: [...state.notes,{id,title:'',body:'',taskId:null,createdAt:now,updatedAt:now}] }));
    openNote(id);
    get('note-title').focus();
  });
  for (const input of [get('note-title'),get('note-body'),noteTask]) {
    input.addEventListener('input', () => {
      const previous = pending.get(noteId) ?? data.notes.find(item=>item.id===noteId);
      if (!previous) return;
      const note = { ...previous, title:get('note-title').value, body:get('note-body').value,
        taskId:noteTask.value||null, updatedAt:Date.now() };
      pending.set(note.id,note);
      try { localStorage.setItem(draftPrefix+note.id,JSON.stringify(note)); } catch {}
      noteStatus.textContent = 'Đang lưu…';
      clearTimeout(saveHandle);
      saveHandle = setTimeout(flushNotes,220);
    });
  }
  get('note-delete').addEventListener('click',() => {
    const id = noteId;
    if (!id || !confirm('Xóa ghi chú này?')) return;
    pending.delete(id);
    try { localStorage.removeItem(draftPrefix+id); } catch {}
    openNote();
    void change(state=>({...state,notes:state.notes.filter(item=>item.id!==id)}));
  });
  noteSearch.addEventListener('input',draw);
  panel.addEventListener('focus:session', event => { session=event.detail; draw(); });
  panel.addEventListener('focus:completed', () => refresh());
  panel.addEventListener('close', () => { void flushNotes(); });
  window.addEventListener('pagehide', () => { void flushNotes(); });
  chapter?.addEventListener('message', () => refresh());
  clock?.addEventListener('message', () => refresh());
  void refresh().then(() => {
    for (const note of data.notes) {
      try {
        const draft = JSON.parse(localStorage.getItem(draftPrefix+note.id));
        if (draft?.id===note.id && draft.updatedAt>note.updatedAt &&
            typeof draft.title==='string' && typeof draft.body==='string') pending.set(note.id,draft);
      } catch {}
    }
    void flushNotes();
  });
}
