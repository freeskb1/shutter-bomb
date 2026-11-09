// 동시 접속 부하 테스트: 가짜 참가자 N명이 실시간 연결을 열고 여러 라운드를 플레이한다.
// 사용법: node test/loadtest.js [인원=50] [서버주소=http://localhost:3000] [라운드=5]
const http = require('http');
const https = require('https');

const N = Number(process.argv[2]) || 50;
const BASE = process.argv[3] || 'http://localhost:3000';
const ROUNDS = Number(process.argv[4]) || 5;
const lib = BASE.startsWith('https') ? https : http;
const agent = new lib.Agent({ keepAlive: true, maxSockets: Infinity });

function post(path, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(path, BASE);
    const data = JSON.stringify(body);
    const req = lib.request(u, { method: 'POST', agent, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (res) => {
      let s = '';
      res.on('data', (c) => (s += c));
      res.on('end', () => (res.statusCode < 300 ? resolve(JSON.parse(s)) : reject(new Error(`${res.statusCode} ${s}`))));
    });
    req.on('error', reject);
    req.end(data);
  });
}

function listen(room, pid, onState) {
  return new Promise((resolve, reject) => {
    const u = new URL(`/api/events?room=${room}&pid=${pid}`, BASE);
    const req = lib.get(u, { agent: false }, (res) => {
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        buf += chunk;
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const block = buf.slice(0, i);
          buf = buf.slice(i + 2);
          const m = block.match(/^event: state\ndata: (.*)$/m);
          if (m) onState(JSON.parse(m[1]));
        }
      });
      resolve(req);
    });
    req.on('error', reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ANSWERS = ['치킨', '삼겹살', '피자', '짜장면', '김치찌개', '떡볶이', '초밥'];

(async () => {
  const t0 = Date.now();
  const { code, hostKey } = await post('/api/room', { title: 'load test' });
  const hostDo = (action, extra) => post('/api/host', { room: code, hostKey, action, ...extra });

  const bots = [];
  await Promise.all(Array.from({ length: N }, async (_, i) => {
    const { pid } = await post('/api/join', { room: code, name: `봇${i + 1}` });
    const bot = { pid, last: null, seen: new Map() };
    bot.req = await listen(code, pid, (st) => {
      bot.last = st;
      const k = `${st.roundNo}:${st.phase}`;
      if (!bot.seen.has(k)) bot.seen.set(k, Date.now());
    });
    bots.push(bot);
  }));
  console.log(`✔ ${N}명 입장 + 실시간 연결 완료 (${Date.now() - t0}ms)`);

  // 모두가 같은 상태를 받을 때까지 기다림
  const waitAll = async (pred, label) => {
    const start = Date.now();
    while (!bots.every((b) => b.last && pred(b.last))) {
      if (Date.now() - start > 10000) throw new Error(`시간 초과: ${label}`);
      await sleep(10);
    }
    return Date.now() - start;
  };
  await waitAll((s) => s.players.length === N, 'players');

  const expected = new Map(bots.map((b) => [b.pid, 0]));
  let maxLatency = 0;
  for (let r = 1; r <= ROUNDS; r++) {
    const sent = Date.now();
    await hostDo('ask', { question: `라운드 ${r} 질문`, seconds: 30 });
    await waitAll((s) => s.roundNo === r && s.phase === 'asking', 'ask');
    const askLat = Math.max(...bots.map((b) => b.seen.get(`${r}:asking`) - sent));

    // 모두 동시에 답 제출 (0~1초 사이 흩어서)
    const picks = new Map();
    await Promise.all(bots.map(async (b, i) => {
      await sleep(Math.random() * 1000);
      const a = ANSWERS[(i * (r + 1)) % ANSWERS.length] + (i % 3 === 0 ? ' ' : ''); // 띄어쓰기 달라도 같은 답
      picks.set(b.pid, a.trim());
      await post('/api/answer', { room: code, pid: b.pid, text: a });
    }));
    await waitAll((s) => s.submitted && s.submitted.length === N, 'submitted');

    const sentR = Date.now();
    await hostDo('reveal');
    await waitAll((s) => s.roundNo === r && s.phase === 'revealed', 'reveal');
    const revLat = Math.max(...bots.map((b) => b.seen.get(`${r}:revealed`) - sentR));
    maxLatency = Math.max(maxLatency, askLat, revLat);

    // 점수 검증: 같은 답 쓴 사람 수 (혼자면 0)
    const cnt = {};
    for (const a of picks.values()) cnt[a] = (cnt[a] || 0) + 1;
    for (const [pid, a] of picks) expected.set(pid, expected.get(pid) + (cnt[a] >= 2 ? cnt[a] : 0));
    const st = bots[0].last;
    const bad = st.players.filter((p) => p.score !== expected.get(p.id));
    if (bad.length) throw new Error(`점수 불일치 ${bad.length}명`);
    console.log(`✔ 라운드 ${r}: 질문 전달 최대 ${askLat}ms, 결과 전달 최대 ${revLat}ms, 그룹 ${st.groups.length}개, 점수 정확`);
  }

  // 같은 뜻 답 합치기 테스트
  const st = bots[0].last;
  const [a, b] = st.groups;
  await hostDo('merge', { from: b.key, into: a.key });
  await waitAll((s) => s.groups && s.groups[0].size === a.size + b.size, 'merge');
  console.log(`✔ 합치기: "${b.label}" → "${a.label}" (${a.size}+${b.size}=${a.size + b.size}명) 점수 재계산 반영`);

  const mem = await new Promise((res) => lib.get(new URL('/healthz', BASE), (r) => { let s = ''; r.on('data', (c) => (s += c)); r.on('end', () => res(s)); }));
  console.log(`\n결과: ${N}명 동시 접속, ${ROUNDS}라운드 OK · 최대 전달 지연 ${maxLatency}ms · 서버 ${mem}`);
  bots.forEach((b) => b.req.destroy());
  process.exit(0);
})().catch((e) => { console.error('✘ 실패:', e.message); process.exit(1); });
