// 통했다! 파티 — 실시간 서버 (외부 패키지 없음, Node 18+)
// 실행: node server.js   (PORT 환경변수로 포트 지정, 기본 3000)
// 통신: 상태는 SSE(EventSource)로 내려보내고, 조작은 POST /api/* 로 받는다.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'rooms.json');
const MAX_PLAYERS = 300;
const NAME_MAX = 12;
const ANSWER_MAX = 30;
const ROOM_TTL_MS = 1000 * 60 * 60 * 12; // 12시간 지난 방은 정리

/** @type {Map<string, any>} */
const rooms = new Map();

// ---------- 유틸 ----------
const rid = (n = 8) => crypto.randomBytes(n).toString('hex');

function newRoomCode() {
  for (let i = 0; i < 1000; i++) {
    const c = String(Math.floor(1000 + Math.random() * 9000));
    if (!rooms.has(c)) return c;
  }
  throw new Error('no room code');
}

function clean(s, max) {
  return String(s ?? '')
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

// 같은 답으로 칠 기준: 대소문자·띄어쓰기·문장부호 무시
function normalize(s) {
  return String(s)
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]/gu, '');
}

// ---------- 점수 계산 ----------
// 라운드마다: 답을 정규화 → 진행자가 합친 그룹(merges) 반영 → 그룹 크기가 곧 점수 (혼자면 0점)
function resolveKey(round, key) {
  let k = key;
  const seen = new Set();
  while (round.merges[k] && !seen.has(k)) {
    seen.add(k);
    k = round.merges[k];
  }
  return k;
}

function computeGroups(room, round) {
  const map = new Map();
  for (const [pid, raw] of Object.entries(round.answers)) {
    const key = resolveKey(round, normalize(raw) || '(빈칸)');
    if (!map.has(key)) map.set(key, { key, members: [], raws: {} });
    const g = map.get(key);
    g.members.push(pid);
    g.raws[raw] = (g.raws[raw] || 0) + 1;
  }
  const groups = [...map.values()].map((g) => {
    const label = Object.entries(g.raws).sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0];
    const size = g.members.length;
    return {
      key: g.key,
      label,
      variants: Object.keys(g.raws),
      merged: Object.values(round.merges).includes(g.key),
      members: g.members.map((id) => ({ id, name: room.players.get(id)?.name ?? '?' })),
      size,
      points: size >= 2 ? size : 0,
    };
  });
  groups.sort((a, b) => b.size - a.size || a.label.localeCompare(b.label, 'ko'));
  return groups;
}

function computeScores(room) {
  const scores = new Map();
  for (const id of room.players.keys()) scores.set(id, 0);
  room.rounds.forEach((round) => {
    if (!round.revealed) return;
    round.lastPoints = {};
    for (const g of computeGroups(room, round)) {
      for (const m of g.members) {
        round.lastPoints[m.id] = g.points;
        scores.set(m.id, (scores.get(m.id) || 0) + g.points);
      }
    }
  });
  return scores;
}

// ---------- 상태 (모든 접속자에게 같은 공개 상태) ----------
function publicState(room) {
  const scores = computeScores(room);
  const round = room.rounds[room.rounds.length - 1];
  const players = [...room.players.values()].map((p) => ({
    id: p.id,
    name: p.name,
    score: scores.get(p.id) || 0,
    online: p.conns > 0,
  }));
  // 순위(동점은 같은 순위)
  const sorted = [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ko'));
  let rank = 0;
  let prev = null;
  sorted.forEach((p, i) => {
    if (p.score !== prev) { rank = i + 1; prev = p.score; }
    p.rank = rank;
  });

  const st = {
    code: room.code,
    title: room.title,
    phase: room.phase, // lobby | asking | closed | revealed | final
    roundNo: room.rounds.length,
    serverNow: Date.now(),
    players: sorted,
  };
  if (round && room.phase !== 'lobby') {
    st.question = round.question;
    st.deadline = round.deadline;
    st.submitted = Object.keys(round.answers);
    if (round.revealed) {
      st.groups = computeGroups(room, round);
      st.roundPoints = round.lastPoints;
    }
  }
  return st;
}

// ---------- SSE 브로드캐스트 (짧게 묶어서 보냄) ----------
function broadcast(room) {
  if (room.flushTimer) return;
  room.flushTimer = setTimeout(() => {
    room.flushTimer = null;
    const data = `event: state\ndata: ${JSON.stringify(publicState(room))}\n\n`;
    for (const res of room.clients) res.write(data);
    saveSoon();
  }, 60);
}

// ---------- 저장 (서버 재시작 대비) ----------
let saveTimer = null;
function saveSoon() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      const out = [...rooms.values()].map((r) => ({
        code: r.code, hostKey: r.hostKey, title: r.title, phase: r.phase, createdAt: r.createdAt,
        touchedAt: r.touchedAt,
        players: [...r.players.values()].map((p) => ({ id: p.id, name: p.name, joinedAt: p.joinedAt })),
        rounds: r.rounds.map(({ timer, lastPoints, ...rest }) => rest),
      }));
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE + '.tmp', JSON.stringify(out));
      fs.renameSync(DATA_FILE + '.tmp', DATA_FILE);
    } catch (e) {
      console.error('save failed', e.message);
    }
  }, 1000);
}

function makeRoom(o) {
  const room = {
    code: o.code, hostKey: o.hostKey, title: o.title || '통했다! 파티', phase: o.phase || 'lobby',
    createdAt: o.createdAt || Date.now(), touchedAt: o.touchedAt || Date.now(),
    players: new Map(), rounds: o.rounds || [], clients: new Set(), flushTimer: null,
  };
  for (const p of o.players || []) room.players.set(p.id, { ...p, conns: 0 });
  rooms.set(room.code, room);
  return room;
}

function load() {
  try {
    const arr = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    for (const o of arr) {
      if (Date.now() - (o.touchedAt || 0) > ROOM_TTL_MS) continue;
      const room = makeRoom(o);
      if (room.phase === 'asking') {
        const round = room.rounds[room.rounds.length - 1];
        if (round?.deadline && round.deadline > Date.now()) armTimer(room, round);
        else room.phase = 'closed';
      }
    }
    console.log(`복구한 방 ${rooms.size}개`);
  } catch { /* 처음 실행 */ }
}

function armTimer(room, round) {
  clearTimeout(round.timer);
  if (!round.deadline) return;
  round.timer = setTimeout(() => {
    if (room.phase === 'asking' && room.rounds[room.rounds.length - 1] === round) {
      room.phase = 'closed';
      broadcast(room);
    }
  }, Math.max(0, round.deadline - Date.now()) + 800); // 네트워크 지연 감안 약간의 여유
}

// ---------- HTTP ----------
function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 64 * 1024) { reject(new Error('too big')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch { reject(new Error('bad json')); }
    });
    req.on('error', reject);
  });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

function serveStatic(req, res, pathname) {
  let file = pathname;
  if (file === '/' || file === '/join') file = '/play.html';
  else if (file === '/host') file = '/host.html';
  const full = path.normalize(path.join(PUBLIC_DIR, file));
  if (!full.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
  fs.readFile(full, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('없는 페이지예요'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}

function getRoom(code) {
  const room = rooms.get(String(code || ''));
  if (room) room.touchedAt = Date.now();
  return room;
}

const api = {
  // 진행자: 방 만들기
  async 'POST /api/room'(body) {
    const room = makeRoom({ code: newRoomCode(), hostKey: rid(12), title: clean(body.title, 30) || undefined });
    saveSoon();
    return [200, { code: room.code, hostKey: room.hostKey }];
  },

  // 참가자: 이름 넣고 입장 (pid가 있으면 재접속)
  async 'POST /api/join'(body) {
    const room = getRoom(body.room);
    if (!room) return [404, { error: '방 번호를 다시 확인해 주세요' }];
    const pid = String(body.pid || '');
    if (pid && room.players.has(pid)) {
      const p = room.players.get(pid);
      const round = room.rounds[room.rounds.length - 1];
      return [200, { pid, name: p.name, myAnswer: round?.answers[pid] ?? null }];
    }
    let name = clean(body.name, NAME_MAX);
    if (!name) return [400, { error: '이름을 입력해 주세요' }];
    if (room.players.size >= MAX_PLAYERS) return [409, { error: '방이 꽉 찼어요' }];
    const taken = new Set([...room.players.values()].map((p) => p.name));
    if (taken.has(name)) {
      let i = 2;
      while (taken.has(`${name}${i}`)) i++;
      name = `${name}${i}`;
    }
    const p = { id: rid(8), name, joinedAt: Date.now(), conns: 0 };
    room.players.set(p.id, p);
    broadcast(room);
    return [200, { pid: p.id, name: p.name, myAnswer: null }];
  },

  // 참가자: 답 제출 (마감 전에는 수정 가능)
  async 'POST /api/answer'(body) {
    const room = getRoom(body.room);
    if (!room) return [404, { error: '방이 없어요' }];
    const p = room.players.get(String(body.pid || ''));
    if (!p) return [403, { error: '다시 입장해 주세요' }];
    const round = room.rounds[room.rounds.length - 1];
    if (room.phase !== 'asking' || !round) return [409, { error: '지금은 답을 받지 않아요' }];
    const text = clean(body.text, ANSWER_MAX);
    if (!text) return [400, { error: '답을 입력해 주세요' }];
    round.answers[p.id] = text;
    broadcast(room);
    return [200, { ok: true, myAnswer: text }];
  },

  // 진행자 조작
  async 'POST /api/host'(body) {
    const room = getRoom(body.room);
    if (!room) return [404, { error: '방이 없어요' }];
    if (body.hostKey !== room.hostKey) return [403, { error: '진행자 권한이 없어요' }];
    const round = room.rounds[room.rounds.length - 1];

    switch (body.action) {
      case 'ask': {
        const question = clean(body.question, 120);
        if (!question) return [400, { error: '질문이 비었어요' }];
        if (round) clearTimeout(round.timer);
        const secs = Math.max(0, Math.min(600, Number(body.seconds) || 0));
        const r = { question, answers: {}, merges: {}, revealed: false, deadline: secs ? Date.now() + secs * 1000 : null };
        room.rounds.push(r);
        room.phase = 'asking';
        armTimer(room, r);
        break;
      }
      case 'close':
        if (room.phase !== 'asking') return [409, { error: '진행 중인 질문이 없어요' }];
        clearTimeout(round.timer);
        room.phase = 'closed';
        break;
      case 'addTime': {
        if (room.phase !== 'asking') return [409, { error: '진행 중인 질문이 없어요' }];
        round.deadline = Math.max(round.deadline || Date.now(), Date.now()) + (Number(body.seconds) || 15) * 1000;
        armTimer(room, round);
        break;
      }
      case 'reveal':
        if (!round || !['asking', 'closed', 'revealed'].includes(room.phase)) return [409, { error: '공개할 질문이 없어요' }];
        clearTimeout(round.timer);
        round.revealed = true;
        room.phase = 'revealed';
        break;
      case 'merge': {
        // from 그룹을 into 그룹에 합친다 (같은 답으로 인정)
        if (room.phase !== 'revealed' || !round) return [409, { error: '공개 후에 합칠 수 있어요' }];
        const from = resolveKey(round, String(body.from || ''));
        const into = resolveKey(round, String(body.into || ''));
        if (!from || !into || from === into) return [400, { error: '합칠 그룹을 다시 골라 주세요' }];
        round.merges[from] = into;
        break;
      }
      case 'unmerge': {
        if (room.phase !== 'revealed' || !round) return [409, { error: '공개 후에만 가능해요' }];
        const key = String(body.key || '');
        for (const [k, v] of Object.entries(round.merges)) if (v === key) delete round.merges[k];
        break;
      }
      case 'cancelRound':
        // 이번 질문 무효 (점수 반영 안 함)
        if (!round) return [409, { error: '취소할 질문이 없어요' }];
        clearTimeout(round.timer);
        room.rounds.pop();
        room.phase = room.rounds.length ? 'revealed' : 'lobby';
        if (room.rounds.length) room.rounds[room.rounds.length - 1].revealed = true;
        break;
      case 'final':
        if (round) clearTimeout(round.timer);
        if (round && room.phase !== 'revealed') round.revealed = true;
        room.phase = 'final';
        break;
      case 'lobby':
        room.phase = room.rounds.length ? 'revealed' : 'lobby';
        break;
      case 'kick': {
        const pid = String(body.pid || '');
        if (!room.players.has(pid)) return [404, { error: '없는 참가자예요' }];
        room.players.delete(pid);
        for (const r of room.rounds) delete r.answers[pid];
        break;
      }
      case 'title':
        room.title = clean(body.title, 30) || room.title;
        break;
      default:
        return [400, { error: '모르는 동작이에요' }];
    }
    broadcast(room);
    return [200, { ok: true }];
  },
};

function handleEvents(req, res, url) {
  const room = getRoom(url.searchParams.get('room'));
  if (!room) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('no room'); }
  const pid = url.searchParams.get('pid');
  const player = pid ? room.players.get(pid) : null;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 2000\n\n');
  res.write(`event: state\ndata: ${JSON.stringify(publicState(room))}\n\n`);
  room.clients.add(res);
  if (player) { player.conns++; if (player.conns === 1) broadcast(room); }

  req.on('close', () => {
    room.clients.delete(res);
    const p = pid ? room.players.get(pid) : null;
    if (p) { p.conns = Math.max(0, p.conns - 1); if (p.conns === 0) broadcast(room); }
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET' && url.pathname === '/api/events') return handleEvents(req, res, url);
    if (req.method === 'GET' && url.pathname === '/api/exists') return sendJSON(res, rooms.has(url.searchParams.get('room') || '') ? 200 : 404, {});
    if (req.method === 'GET' && url.pathname === '/healthz') return sendJSON(res, 200, { ok: true, rooms: rooms.size });
    const handler = api[`${req.method} ${url.pathname}`];
    if (handler) {
      const body = await readBody(req);
      const [code, obj] = await handler(body);
      return sendJSON(res, code, obj);
    }
    if (req.method === 'GET') return serveStatic(req, res, url.pathname);
    res.writeHead(405); res.end();
  } catch (e) {
    console.error(e);
    sendJSON(res, 500, { error: '서버 오류가 났어요' });
  }
});

// 프록시가 연결을 끊지 않게 15초마다 핑, 오래된 방 정리
setInterval(() => {
  for (const room of rooms.values()) {
    for (const res of room.clients) res.write(': ping\n\n');
    if (room.clients.size === 0 && Date.now() - room.touchedAt > ROOM_TTL_MS) rooms.delete(room.code);
  }
}, 15000);

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.requestTimeout = 0; // SSE는 오래 열려 있어야 함

load();
server.listen(PORT, () => {
  console.log(`통했다! 파티 서버: http://localhost:${PORT}  (진행자 화면: /host)`);
});
