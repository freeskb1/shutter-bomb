// 진행자·참가자 화면 공용: API 호출, 실시간 연결, 작은 도구들
const $ = (sel, root = document) => root.querySelector(sel);

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data.error || `오류 (${res.status})`);
  return data;
}

let toastTimer;
function toast(msg) {
  let el = $('.toast');
  if (!el) { el = h('div', { class: 'toast' }); document.body.append(el); }
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
}

// 실시간 상태 받기. 끊기면 알아서 다시 붙는다.
function connectRoom(room, pid, onState, onGone) {
  let es = null;
  let closed = false;
  let retryTimer = null;
  let badge = null;
  const showBadge = (on) => {
    if (on && !badge) { badge = h('div', { class: 'conn' }, '연결 중…'); document.body.append(badge); }
    if (!on && badge) { badge.remove(); badge = null; }
  };
  const open = () => {
    if (closed) return;
    clearTimeout(retryTimer);
    if (es) es.close();
    const q = new URLSearchParams({ room });
    if (pid) q.set('pid', pid);
    es = new EventSource('/api/events?' + q);
    es.addEventListener('state', (e) => {
      showBadge(false);
      const st = JSON.parse(e.data);
      st.clockOffset = st.serverNow - Date.now();
      onState(st);
    });
    es.onerror = async () => {
      showBadge(true);
      if (es.readyState === EventSource.CLOSED) {
        // 방이 사라졌는지 확인
        try {
          const r = await fetch('/api/exists?room=' + encodeURIComponent(room));
          if (r.status === 404 && onGone) { closed = true; showBadge(false); return onGone(); }
        } catch {}
        retryTimer = setTimeout(open, 2500);
      }
    };
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && es && es.readyState === EventSource.CLOSED) open();
  });
  open();
  return { close() { closed = true; es && es.close(); }, reopen: open };
}

function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
    if (val === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(val));
  } catch { return null; }
}

function makeSnow(n = 30) {
  const s = h('div', { class: 'snow' });
  for (let i = 0; i < n; i++) {
    const size = 3 + Math.random() * 5;
    s.append(h('i', {
      style: `left:${Math.random() * 100}%;width:${size}px;height:${size}px;opacity:${0.3 + Math.random() * 0.5};animation-duration:${8 + Math.random() * 10}s;animation-delay:${-Math.random() * 18}s`,
    }));
  }
  document.body.prepend(s);
}
