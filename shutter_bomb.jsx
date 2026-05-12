import React, { useState, useEffect, useRef, useCallback } from 'react';

// ========== 미션 데이터베이스 ==========
// 폭탄 보유자 혼자서 즉시 수행 가능한 미션만.
// 전체 단일 풀에서 랜덤 셔플로 뽑음 (난이도 구분 없음).
const MISSIONS = [
  // ========== 색깔/모양/글자 (기본 발견) ==========
  { text: "빨간색 물건", icon: "🔴" },
  { text: "파란색 물건", icon: "🔵" },
  { text: "초록색 물건", icon: "🟢" },
  { text: "노란색 물건", icon: "🟡" },
  { text: "동그란 거", icon: "⭕" },
  { text: "네모난 거", icon: "⬜" },
  { text: "영어가 적힌 거", icon: "📝" },
  { text: "숫자가 보이는 거", icon: "🔢" },
  { text: "광고나 로고", icon: "🏷️" },
  { text: "본인 신발", icon: "👟" },
  { text: "주머니 속 아무거나", icon: "👖" },
  { text: "가방 안에 든 거 하나", icon: "🎒" },

  // ========== 셀카 (창조) ==========
  { text: "윙크 셀카", icon: "😉" },
  { text: "최대한 무표정 셀카", icon: "😐" },
  { text: "화난 표정 셀카", icon: "😠" },
  { text: "놀란 표정 셀카", icon: "😲" },
  { text: "본인 한쪽 눈만 클로즈업", icon: "👁️" },
  { text: "본인 코 클로즈업", icon: "👃" },
  { text: "양쪽 볼 부풀린 셀카", icon: "🐡" },
  { text: "본인 정수리 (위에서)", icon: "💇" },
  { text: "본인 두 눈만 (이마 위/코 아래 가리고)", icon: "👀" },
  { text: "입 모양 'ㅋ' 만들고 셀카", icon: "🐭" },

  // ========== 사람 자연 포착 ==========
  { text: "누가 웃고 있는 모습", icon: "😄" },
  // 24 (입 벌리고 있는 모습) 삭제
  { text: "누가 마시는 모습", icon: "🍵" },
  { text: "안경 쓴 사람 (가까이서)", icon: "👓" },
  { text: "다른 사람 신발", icon: "👞" },
  { text: "다른 사람 손", icon: "🤚" },
  { text: "다른 사람 코", icon: "👃" },
  { text: "다른 사람 귀", icon: "👂" },
  { text: "누가 진짜로 웃음 터진 순간 (자연 포착)", icon: "😆" },

  // ========== 단체샷 ==========
  { text: "두 사람이 한 프레임에", icon: "👥" },
  { text: "세 사람 이상 한 프레임에", icon: "👨‍👩‍👧" },

  // ========== 발견: 사람한테 붙어있는 디테일 ==========
  { text: "남의 옷 안쪽 라벨", icon: "🏷️" },
  { text: "누군가의 액세서리", icon: "💍" },
  { text: "누군가의 귀걸이", icon: "💎" },
  { text: "누군가의 목걸이", icon: "📿" },
  { text: "누군가의 팔찌", icon: "🪢" },
  { text: "누군가의 시계", icon: "⌚" },
  { text: "누군가의 머리끈/머리핀", icon: "🎀" },
  { text: "누군가의 손톱", icon: "💅" },
  { text: "누군가의 손가락 반지", icon: "💍" },
  { text: "누군가의 옷 단추", icon: "🔘" },
  { text: "점 하나 (누군가의 몸 어디든)", icon: "⚫" },

  // ========== 발견: 옷 무늬 ==========
  { text: "체크 무늬 (옷이든 물건이든)", icon: "🏁" },
  { text: "줄무늬 (옷이든 물건이든)", icon: "🦓" },
  { text: "물방울 무늬 (도트)", icon: "🔵" },
  { text: "옷에 무늬가 있는 사람 (자유)", icon: "👕" },

  // ========== 발견: 정확한 조건 매칭 ==========
  { text: "영어 알파벳 'A'가 보이는 것", icon: "🅰️" },
  { text: "숫자 '7'이 보이는 것", icon: "7️⃣" },
  { text: "빨간색이면서 동그란 것", icon: "🍎" },
  { text: "파란색이면서 글자가 있는 것", icon: "💙" },
  { text: "끝이 뾰족한 것", icon: "📍" },
  { text: "구멍이 뚫린 것", icon: "🕳️" },
  { text: "한글이면서 빨간색인 것", icon: "🇰🇷" },
  { text: "영어이면서 검은색인 것", icon: "🔤" },
  { text: "가격표나 숫자 단위 (원, ₩, $)", icon: "💰" },
  { text: "손바닥보다 작은 것", icon: "🤏" },
  { text: "손바닥보다 큰 것", icon: "🖐️" },

  // ========== 발견: 음식·음료 디테일 ==========
  { text: "마실 수 있는 거", icon: "🥤" },
  { text: "먹을 수 있는 거", icon: "🍪" },
  { text: "컵이나 잔의 손잡이", icon: "🍶" },
  // 63 (빨대), 64 (얼음) 삭제
  { text: "마시고 남은 립 자국 (컵에 묻은)", icon: "💋" },
  { text: "음식 부스러기", icon: "🍞" },

  // ========== 발견: 텍스처/재질 ==========
  { text: "반짝이는 표면 (광택)", icon: "✨" },
  { text: "투명한 것", icon: "🫧" },
  { text: "부드러워 보이는 것", icon: "🪶" },
  { text: "거친 표면", icon: "🪨" },
  { text: "푹신해 보이는 것", icon: "🛋️" },
  { text: "차가워 보이는 금속", icon: "⚙️" },
  { text: "따뜻해 보이는 천이나 가죽", icon: "🧥" },
  { text: "빛이 통과하는 반투명", icon: "🪟" },

  // ========== 발견: 역발견 (없는 것) ==========
  { text: "사람 없는 자리", icon: "💺" },
  { text: "아무것도 놓이지 않은 평면", icon: "⬜" },
  { text: "비어있는 컵이나 그릇", icon: "🥛" },
  { text: "사용 안 하는 의자", icon: "🪑" },
  { text: "사람이 손대지 않은 음식이나 물건", icon: "🍽️" },

  // ========== 발견: 자세/행동 ==========
  { text: "누군가 다리 꼬고 앉은 모습", icon: "🦵" },
  { text: "누군가 팔짱 끼고 있는 모습", icon: "🤝" },

  // ========== 발견: 손이 만드는 디테일 ==========
  { text: "누군가 무언가를 잡고 있는 손", icon: "✊" },
  { text: "머리를 만지고 있는 사람", icon: "💆" }, // 83 변경
  { text: "손등이 위로 가게 놓인 손", icon: "🫳" },
  { text: "누군가의 주먹", icon: "👊" },

  // ========== 발견: 두 개의 X (매칭) ==========
  { text: "같은 음료를 마시고 있는 두 사람", icon: "👬" },
  { text: "같은 자세를 취하고 있는 두 사람", icon: "👯" },
  // 88 (같은 액세서리 두 사람) 삭제
  { text: "색이 비슷한 두 가지 물건", icon: "🎨" },
  { text: "같은 색 옷 입은 사람 둘 이상이 한 프레임", icon: "👕" },

  // 91 (사물 위 사물) 삭제 → 위치/사물 섹션 통째로 사라짐

  // ========== 발견: 글자/그림 변주 ==========
  { text: "손글씨로 쓰인 무언가", icon: "✍️" },
  { text: "별표나 하트 모양", icon: "⭐" },
  { text: "영문 단어 하나를 통째로 읽을 수 있는 것", icon: "🔡" },
  // 95 (점선/점 무늬) 삭제

  // ========== 발견: 사람 없는 흔적 ==========
  { text: "사람 없이 놓인 가방", icon: "👜" },
  { text: "사람 없이 걸쳐진 겉옷", icon: "🧥" },

  // 98 (반사된 모습) 삭제 → 섹션 통째로 사라짐

  // ========== 청각 (소리 기반) ==========
  { text: "누가 웃음소리 낸 직후의 표정", icon: "🤣" },
  // 100 (박수 직후), 101 (음악 출처), 102 (동시 말하는 두 사람) 삭제
  { text: "한 사람이 큰 소리로 말하는 순간 (입 크게 벌어진)", icon: "📢" },

  // ========== 부정형 (~이 아닌 것) ==========
  { text: "사람이 아닌 것 중 가장 어두운 것", icon: "🌑" },
  // 105 (본인이 만지지 않고 있는 것) 삭제

  // ========== 시간성 (순간) ==========
  { text: "무언가를 내려놓는 순간", icon: "⬇️" },
  { text: "무언가를 집어 드는 순간", icon: "⬆️" },

  // ========== 시점 제약 ==========
  { text: "본인 눈높이보다 위에 있는 무언가", icon: "🔝" },

  // ========== 액션: 공간 이동 ==========
  { text: "화장실까지 가서 무엇이든 한 장", icon: "🚽" },
  { text: "입구나 현관에 가서 한 장", icon: "🚪" },
  { text: "창문 통해 건물 밖에 있는 무언가", icon: "🌳" },
  { text: "베란다나 발코니까지 가서 한 장", icon: "🪴" },
  // ----- 신규 -----
  { text: "어딘가의 문을 열고 안에서 한 장", icon: "🚪" },
  { text: "어딘가의 서랍을 열고 안에서 한 장", icon: "🗄️" },
  { text: "냉장고 안 한 장 (있으면)", icon: "🧊" },
  { text: "거울 앞까지 가서 본인 사진 한 장", icon: "🪞" },
  { text: "의자 위에 올라가서 항공샷 한 장", icon: "🛫" },

  // ========== 액션: 용품 시리즈 ==========
  { text: "부엌용품 한 장", icon: "🍳" },
  { text: "욕실용품 한 장 (칫솔/비누/수건 등)", icon: "🪥" },
  { text: "사무용품 한 장 (펜/가위/메모지 등)", icon: "✏️" },
  { text: "청소용품 한 장 (걸레/빗자루 등)", icon: "🧹" },
  { text: "미용·화장용품 한 장", icon: "💄" },
  { text: "전기·전자제품 한 장 (충전기/리모컨 등)", icon: "🔌" },
  // ----- 신규 -----
  { text: "식기류 한 장 (그릇/접시/수저)", icon: "🍽️" },
  { text: "책이나 종이 자료 한 장", icon: "📚" },
  { text: "대형가전 한 장 (TV/냉장고/세탁기 등)", icon: "📺" },

  // ========== 액션: 사람 행동 ==========
  { text: "가장 멀리 있는 사람한테 가서 악수하는 사진", icon: "🤝" },
  { text: "아무나에게 다가가 하이파이브 하는 사진", icon: "🙏" },
  // ----- 신규 -----
  { text: "내가 한쪽 손하트 내밀어 상대방이 같이 손하트 만들어주면 성공", icon: "🫶" },
  { text: "누군가와 새끼손가락 걸기", icon: "🤙" },
  { text: "누군가와 짠 하는 사진 (잔이든 컵이든 빈 손이든)", icon: "🥂" },

  // ========== 액션: 회전 ==========
  { text: "제자리에서 3바퀴 돌면서 옆 사람을 정확히 한 컷에", icon: "🌀" },

  // ========== 액션: 운빨 사진 ==========
  { text: "눈 감고 찍어서 사람이 담기면 성공", icon: "🙈" },
  { text: "휴대폰을 등 뒤로 돌려서 찍어서 사람 담기면 성공", icon: "🔄" },
  { text: "휴대폰을 머리 위로 들고 안 보고 찍어서 사람 담기면 성공", icon: "🆙" },

  // ========== 이미지 게임: 외모/매력 ==========
  { text: "제일 잘생긴 것 같은 사람", icon: "✨" },
  { text: "제일 예쁜 것 같은 사람", icon: "🌸" },
  { text: "옷을 가장 잘 입은 것 같은 사람", icon: "👗" },
  { text: "가장 분위기 있는 것 같은 사람", icon: "🌙" },
  { text: "가장 손이 예쁜 것 같은 사람", icon: "🤲" },

  // ========== 이미지 게임: 성격 추측 ==========
  { text: "제일 착할 것 같은 사람", icon: "😇" },
  { text: "제일 의리 있을 것 같은 사람", icon: "💪" },
  { text: "제일 까다로울 것 같은 사람", icon: "🤨" },
  { text: "제일 잠귀신일 것 같은 사람", icon: "😴" },
  { text: "제일 부지런할 것 같은 사람", icon: "🐝" },
  { text: "제일 화나면 무서울 것 같은 사람", icon: "😤" },
  { text: "제일 비밀 잘 지킬 것 같은 사람", icon: "🤐" },

  // ========== 이미지 게임: 취향/행동 ==========
  { text: "제일 매운 거 잘 먹을 것 같은 사람", icon: "🌶️" },
  { text: "제일 술 잘 마실 것 같은 사람", icon: "🍻" },
  { text: "제일 노래방에서 잘할 것 같은 사람", icon: "🎤" },
  { text: "제일 게임 잘할 것 같은 사람", icon: "🎮" },
  { text: "제일 운전 잘할 것 같은 사람", icon: "🚗" },
  { text: "제일 요리 잘할 것 같은 사람", icon: "🍳" },
  { text: "제일 춤 잘 출 것 같은 사람", icon: "💃" },
  { text: "제일 SNS 자주 할 것 같은 사람", icon: "📱" },
  { text: "제일 운동 잘할 것 같은 사람", icon: "🏃" },
  { text: "제일 단 거 좋아할 것 같은 사람", icon: "🍰" },

  // ========== 이미지 게임: 지금 상황 ==========
  { text: "지금 제일 졸려 보이는 사람", icon: "🥱" },
  { text: "지금 제일 행복해 보이는 사람", icon: "😊" },
  { text: "지금 제일 배고파 보이는 사람", icon: "🍽️" },
  { text: "지금 게임에서 제일 여유로워 보이는 사람", icon: "😎" },
  { text: "머리가 가장 잘 정돈된 것 같은 사람", icon: "💇" },
  { text: "자세가 가장 좋은 것 같은 사람", icon: "🧍" },

  // ========== 이미지 게임: 미래 예측 ==========
  { text: "제일 먼저 결혼할 것 같은 사람", icon: "💒" },
  { text: "제일 부자 될 것 같은 사람", icon: "💰" },
  { text: "제일 오래 살 것 같은 사람", icon: "🎂" },
  { text: "제일 먼저 잠들 것 같은 사람 (오늘)", icon: "🌙" },
  { text: "다음 라운드 폭탄 맞을 것 같은 사람", icon: "💣" },

  // ========== 이미지 게임: 동물 비유 ==========
  { text: "강아지를 제일 닮은 것 같은 사람", icon: "🐶" },
  { text: "고양이를 제일 닮은 것 같은 사람", icon: "🐱" },
  { text: "곰을 제일 닮은 것 같은 사람", icon: "🐻" },
  { text: "토끼를 제일 닮은 것 같은 사람", icon: "🐰" },
  { text: "카피바라를 제일 닮은 것 같은 사람", icon: "🦫" },
  { text: "알파카를 제일 닮은 것 같은 사람", icon: "🦙" },
  { text: "고라니를 제일 닮은 것 같은 사람", icon: "🦌" },
  { text: "너구리를 제일 닮은 것 같은 사람", icon: "🦝" },
  { text: "하마를 제일 닮은 것 같은 사람", icon: "🦛" },
  { text: "양을 제일 닮은 것 같은 사람", icon: "🐑" },

  // ========== 귀여운 부정 평가: 외모 ==========
  { text: "제일 착하게 생긴 것 같은 사람", icon: "😊" },
  { text: "제일 평범하게 생긴 것 같은 사람", icon: "🙂" },
  { text: "제일 인상이 강한 것 같은 사람", icon: "😤" },
  { text: "제일 무뚝뚝하게 생긴 것 같은 사람", icon: "😑" },
  { text: "인상이 제일 졸려 보이게 생긴 사람", icon: "😪" },

  // ========== 귀여운 부정 평가: 성격 ==========
  { text: "제일 엄마 말 안 들을 것 같은 사람", icon: "🙄" },
  { text: "제일 학교에서 떠들었을 것 같은 사람", icon: "🗣️" },
  { text: "제일 늦잠 자서 지각할 것 같은 사람", icon: "⏰" },
  { text: "제일 약속 안 지킬 것 같은 사람", icon: "🤷" },
  { text: "제일 뒤끝 있을 것 같은 사람", icon: "🌚" },
  { text: "제일 잘 울 것 같은 사람", icon: "😭" },
  { text: "제일 잔소리 많이 할 것 같은 사람", icon: "📢" },
  { text: "제일 변덕스러울 것 같은 사람", icon: "🌪️" },

  // ========== 귀여운 부정 평가: 약점 ==========
  { text: "제일 길치일 것 같은 사람", icon: "🗺️" },
  { text: "제일 기계치일 것 같은 사람", icon: "🤖" },
  { text: "제일 술 못 마실 것 같은 사람", icon: "🥴" },
  { text: "제일 매운 거 못 먹을 것 같은 사람", icon: "🥵" },
  { text: "제일 추위 많이 탈 것 같은 사람", icon: "🥶" },

  // ========== 귀여운 부정 평가: 행동 ==========
  { text: "제일 노래 못할 것 같은 사람", icon: "🎤" },
  { text: "제일 춤 못 출 것 같은 사람", icon: "🕺" },
  { text: "제일 운동 신경 없을 것 같은 사람", icon: "🤸" },
  { text: "제일 게임 못할 것 같은 사람", icon: "🎮" },
  { text: "제일 운전 못할 것 같은 사람", icon: "🚙" },
];

// ========== 헬퍼 ==========
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Fisher-Yates 셔플
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// 인원수 기반 라운드 전체 시간 계산 (초)
// 평균 한 사람당 15~20초 미션 + 패스 시간 고려
// 최소 25초는 무조건 안전 (점화 직후 첫 사람 보호)
// 인원수별 안전 시간(s) + 최대 폭탄 시간(s).
// 안전 시간 = "이 시간 안에는 절대 안 터짐"
// 최대 시간 = "이 시간 안에는 무조건 터짐"
// 실제 폭발 시점: safe ~ max 사이 랜덤
// 미션 당 평균 ~8초 가정. 사용자 의도: 안전=한바퀴의 60~80%, 최대=한바퀴~두바퀴
const TIME_BY_PLAYERS = {
  3:  { safe: 40, max: 72 },
  4:  { safe: 40, max: 72 },
  5:  { safe: 40, max: 72 },
  6:  { safe: 32, max: 88 },
  7:  { safe: 40, max: 104 },
  8:  { safe: 40, max: 112 },
  9:  { safe: 48, max: 144 },
  10: { safe: 48, max: 160 },
};

// 폭발 전 경고 모션이 시작되는 시점 (폭발 N초 전, 라운드마다 랜덤)
const DANGER_WARNING_MIN = 10;
const DANGER_WARNING_MAX = 25;

// 안전 시간부터 최대 시간 사이 랜덤 폭발 시점 반환
const getRoundDuration = (playerCount) => {
  const cfg = TIME_BY_PLAYERS[playerCount] || TIME_BY_PLAYERS[10];
  return randomInt(cfg.safe, cfg.max);
};

// ========== 컴포넌트 ==========
export default function ShutterBomb() {
  const [phase, setPhase] = useState('setup'); // setup, ready, mission, photo, explode, gameover
  const [playerCount, setPlayerCount] = useState(5);
  const [round, setRound] = useState(0); // 0, 1, 2 (총 3바퀴)
  const [turnInRound, setTurnInRound] = useState(0); // 라운드 안 패스 횟수 (라운드 시간 계산용)
  const [mission, setMission] = useState(null);
  // 폭탄 타이머: 라운드 시작 시점에 한 번만 정해지고, 패스해도 리셋 안 됨
  const [bombFuseTotal, setBombFuseTotal] = useState(0); // 이번 라운드 폭탄 전체 시간(초)
  const [bombIgnitedAt, setBombIgnitedAt] = useState(null); // 점화 시각 (Date.now())
  const [bombRemainingTick, setBombRemainingTick] = useState(0); // 매 100ms 갱신, 위험 단계 판정용
  const [dangerThreshold, setDangerThreshold] = useState(15); // 폭발 N초 전부터 경고 (라운드마다 랜덤)
  const [photo, setPhoto] = useState(null);
  const [photoGallery, setPhotoGallery] = useState([]);
  const [skipsLeft, setSkipsLeft] = useState(0); // 휴대폰 든 사람 스킵 권 (받을 때마다 1로 충전)
  const [missionQueue, setMissionQueue] = useState([]); // 셔플된 미션 큐. 한 판 동안 안 본 거 우선

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const tickRef = useRef(null);
  const explodeFiredRef = useRef(false); // 폭발 중복 발화 방지

  // 폭탄 위험 단계 (마지막 dangerThreshold 초 이하)
  const isDanger = bombRemainingTick > 0 && bombRemainingTick <= dangerThreshold;

  // 미션 큐에서 다음 미션 뽑기. 큐가 비면 재셔플.
  // 함수형 업데이트로 stale closure 방지 (연속 호출에도 안전).
  const drawNextMission = useCallback(() => {
    setMissionQueue((q) => {
      let queue = q;
      if (queue.length === 0) queue = shuffle(MISSIONS);
      const head = queue[0];
      const rest = queue.slice(1);
      setMission(head);
      return rest;
    });
  }, []);

  // ========== 카메라 ==========
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      // 후면 카메라 실패 시 아무 카메라
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err2) {
        console.error('Camera failed', err2);
        alert('카메라 권한이 필요합니다. 브라우저 설정에서 허용해주세요.');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    setPhoto(dataUrl);
    stopCamera();

    // 갤러리에 추가 (라운드 정보만 기록)
    setPhotoGallery((g) => [
      ...g,
      {
        photo: dataUrl,
        mission: mission?.text || '',
        round: round + 1,
      },
    ]);
  }, [stopCamera, mission, round]);

  // ========== 폭탄 타이머 (라운드 동안 단 하나) ==========
  // bombIgnitedAt이 세팅된 동안 계속 돌면서 남은 시간 계산.
  // 패스/사진찍기 등으로 phase 바뀌어도 폭탄은 안 멈춤.
  useEffect(() => {
    // 폭탄 활성화 조건: 점화 시각이 있고, 폭탄이 굴러가는 단계
    const bombRunning =
      bombIgnitedAt !== null &&
      (phase === 'mission' || phase === 'photo');

    if (!bombRunning) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }

    tickRef.current = setInterval(() => {
      const elapsed = (Date.now() - bombIgnitedAt) / 1000;
      const remaining = Math.max(0, bombFuseTotal - elapsed);
      setBombRemainingTick(remaining);

      // 진동: 위험 단계 동안 매초 부르르
      if (remaining > 0 && remaining <= dangerThreshold) {
        const justSec = Math.ceil(remaining);
        const prevSec = Math.ceil(remaining + 0.1);
        if (justSec !== prevSec && navigator.vibrate) {
          navigator.vibrate(150);
        }
      }

      if (remaining <= 0 && !explodeFiredRef.current) {
        explodeFiredRef.current = true;
        clearInterval(tickRef.current);
        tickRef.current = null;
        // 폭발!
        if (navigator.vibrate) navigator.vibrate([300, 100, 500]);
        handleExplode();
      }
    }, 100);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line
  }, [phase, bombIgnitedAt, bombFuseTotal, dangerThreshold]);

  const handleExplode = useCallback(() => {
    stopCamera();
    setPhase('explode');
  }, [stopCamera]);

  // ========== 게임 로직 ==========
  const startGame = () => {
    setRound(0);
    setTurnInRound(0);
    setPhotoGallery([]);
    setMissionQueue(shuffle(MISSIONS)); // 한 판 시작 시 미션 셔플
    setPhase('ready');
  };

  const startRound = () => {
    // 라운드 전체 폭탄 점화: 인원수 기반으로 시간 결정
    const dur = getRoundDuration(playerCount);
    // 경고 시작 시점: 폭발 10~25초 전 랜덤. 단 폭탄 시간 자체보다는 짧게.
    const warningWindow = Math.min(
      randomInt(DANGER_WARNING_MIN, DANGER_WARNING_MAX),
      Math.max(5, Math.floor(dur / 2)) // 폭탄 시간의 절반 이하로 제한 (최소 5초)
    );
    drawNextMission();
    setBombFuseTotal(dur);
    setBombIgnitedAt(Date.now());
    setBombRemainingTick(dur);
    setDangerThreshold(warningWindow);
    setSkipsLeft(1); // 휴대폰을 든 사람은 스킵 1회 가능
    explodeFiredRef.current = false;
    setPhoto(null);
    setPhase('mission');
    setTimeout(() => startCamera(), 100);
  };

  const handlePhotoTaken = () => {
    setPhase('photo');
  };

  const handleRetake = () => {
    setPhoto(null);
    // 갤러리에서 마지막 거 제거
    setPhotoGallery((g) => g.slice(0, -1));
    setPhase('mission');
    setTimeout(() => startCamera(), 100);
  };

  const handleSkipMission = () => {
    // 미션 스킵: 사진 안 찍고 다른 미션 받음. 폭탄은 그대로 굴러감.
    // 이 휴대폰을 들고 있는 동안 1번만 가능. 사진 찍고 옆 사람에게 넘기면 다음 사람이 다시 1번.
    if (skipsLeft <= 0) return;
    if (!mission) return;
    setSkipsLeft(0);

    // 스킵된 미션은 누구도 도전 안 한 거니까 큐에 다시 넣음.
    // 큐 중간 (3~10번째 위치) 어딘가에 랜덤하게 끼워서 곧 다시 나올 수도 있게.
    setMissionQueue((q) => {
      let queue = q;
      if (queue.length === 0) queue = shuffle(MISSIONS);
      // 새 미션 뽑기
      const head = queue[0];
      let rest = queue.slice(1);
      // 스킵된 미션을 rest의 랜덤 위치(3~10번째)에 끼워넣기
      const insertAt = Math.min(rest.length, randomInt(3, 10));
      rest = [...rest.slice(0, insertAt), mission, ...rest.slice(insertAt)];
      // 새 미션을 화면에 표시
      setMission(head);
      return rest;
    });
    // 카메라는 이미 켜져 있으니 그대로 둠
  };

  const handlePass = () => {
    // 통과 누르면 바로 다음 미션. 옆 사람한테 휴대폰 넘기는 건 사용자가 알아서.
    // 폭탄은 리셋 안 됨, 계속 굴러간다.
    // 새로 받는 사람은 스킵 1번 다시 충전.
    setTurnInRound((t) => t + 1);
    setSkipsLeft(1);
    drawNextMission();
    setPhoto(null);
    setPhase('mission');
    setTimeout(() => startCamera(), 100);
  };

  const handleAfterExplode = () => {
    // 폭탄 상태 초기화
    setBombIgnitedAt(null);
    setBombFuseTotal(0);
    setBombRemainingTick(0);
    explodeFiredRef.current = false;

    // 한 라운드 종료 → 다음 라운드 또는 게임 종료
    const nextRound = round + 1;
    if (nextRound >= 3) {
      setPhase('gameover');
      return;
    }
    setRound(nextRound);
    setTurnInRound(0);
    setPhase('ready');
  };

  const resetGame = () => {
    stopCamera();
    setPhase('setup');
    setRound(0);
    setTurnInRound(0);
    setPhotoGallery([]);
    setBombIgnitedAt(null);
    setBombFuseTotal(0);
    setBombRemainingTick(0);
    setSkipsLeft(0);
    setMissionQueue([]);
    explodeFiredRef.current = false;
  };

  // ========== 정리 ==========
  useEffect(() => {
    return () => {
      stopCamera();
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [stopCamera]);

  // ========== 스타일 ==========
  const styles = {
    root: {
      minHeight: '100vh',
      background: '#0a0a08',
      color: '#f5f1e8',
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      padding: '16px',
      position: 'relative',
      overflow: 'hidden',
    },
    grain: {
      position: 'fixed',
      inset: 0,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.95 0 0 0 0 0.9 0 0 0 0 0.8 0 0 0 0.08 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      pointerEvents: 'none',
      opacity: 0.5,
      zIndex: 100,
      mixBlendMode: 'overlay',
    },
    container: {
      maxWidth: '440px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 1,
    },
    header: {
      textAlign: 'center',
      padding: '16px 0 8px',
      borderBottom: '2px dashed #2a2620',
      marginBottom: '16px',
    },
    logo: {
      fontSize: '28px',
      fontWeight: 900,
      letterSpacing: '-0.02em',
      color: '#fff21f',
      textShadow: '3px 3px 0 #d6181a',
      transform: 'rotate(-2deg)',
      display: 'inline-block',
    },
    subtitle: {
      fontSize: '11px',
      color: '#888',
      marginTop: '6px',
      letterSpacing: '0.2em',
    },
    card: {
      background: '#15130f',
      border: '1px solid #2a2620',
      borderRadius: '4px',
      padding: '20px',
      marginBottom: '12px',
    },
    label: {
      fontSize: '10px',
      letterSpacing: '0.25em',
      color: '#fff21f',
      fontWeight: 700,
      marginBottom: '4px',
    },
    input: {
      width: '100%',
      background: '#0a0a08',
      border: '1px solid #2a2620',
      borderRadius: '2px',
      padding: '10px 12px',
      color: '#f5f1e8',
      fontFamily: 'inherit',
      fontSize: '14px',
      boxSizing: 'border-box',
    },
    btn: {
      width: '100%',
      background: '#fff21f',
      color: '#0a0a08',
      border: 'none',
      padding: '16px',
      fontSize: '14px',
      fontWeight: 900,
      letterSpacing: '0.15em',
      fontFamily: 'inherit',
      borderRadius: '2px',
      cursor: 'pointer',
      textTransform: 'uppercase',
      boxShadow: '4px 4px 0 #d6181a',
      transition: 'all 0.05s',
    },
    btnDanger: {
      background: '#d6181a',
      color: '#fff',
      boxShadow: '4px 4px 0 #fff21f',
    },
    btnGhost: {
      background: 'transparent',
      color: '#f5f1e8',
      border: '1px solid #2a2620',
      boxShadow: 'none',
    },
    fuseTrack: {
      width: '100%',
      height: '6px',
      background: '#1a1815',
      borderRadius: '3px',
      overflow: 'hidden',
      position: 'relative',
    },
    fuseFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #d6181a 0%, #ff6b00 50%, #fff21f 100%)',
      transition: 'width 0.1s linear',
    },
    stamp: {
      display: 'inline-block',
      padding: '4px 8px',
      border: '2px solid currentColor',
      fontSize: '10px',
      fontWeight: 900,
      letterSpacing: '0.2em',
      transform: 'rotate(-3deg)',
    },
  };

  // ========== 화면 분기 ==========
  // 폭탄 진행 중인 phase일 때만 위험 효과 표시
  const bombActive = phase === 'mission' || phase === 'photo';
  const showDangerOverlay = bombActive && isDanger;

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Bowlby+One&display=swap');
        @keyframes pulse-bomb {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2px, 1px); }
          20% { transform: translate(3px, -1px); }
          30% { transform: translate(-1px, 2px); }
          40% { transform: translate(2px, 1px); }
          50% { transform: translate(-3px, -2px); }
          60% { transform: translate(1px, 2px); }
          70% { transform: translate(-2px, 1px); }
          80% { transform: translate(2px, -2px); }
          90% { transform: translate(-1px, 1px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes flash-red {
          0% { background: #0a0a08; }
          50% { background: #d6181a; }
          100% { background: #0a0a08; }
        }
        @keyframes danger-pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.55; }
        }
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.3; }
        }
        button:active { transform: translate(2px, 2px); }
        .yellow-btn:active { box-shadow: 2px 2px 0 #d6181a !important; }
        .red-btn:active { box-shadow: 2px 2px 0 #fff21f !important; }
      `}</style>

      <div style={styles.grain} />

      {/* 위험 단계 붉은 비네트 오버레이 */}
      {showDangerOverlay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(214, 24, 26, 0.6) 100%)',
            pointerEvents: 'none',
            zIndex: 50,
            animation: 'danger-pulse 0.6s ease-in-out infinite',
          }}
        />
      )}

      <div style={styles.container}>
        {phase === 'setup' && (
          <SetupScreen
            playerCount={playerCount}
            setPlayerCount={setPlayerCount}
            startGame={startGame}
            styles={styles}
          />
        )}

        {phase === 'ready' && (
          <ReadyScreen
            round={round}
            isAfterExplode={turnInRound === 0 && round > 0}
            startRound={startRound}
            styles={styles}
          />
        )}

        {phase === 'mission' && (
          <MissionScreen
            mission={mission}
            isDanger={isDanger}
            skipsLeft={skipsLeft}
            handleSkipMission={handleSkipMission}
            videoRef={videoRef}
            canvasRef={canvasRef}
            takePhoto={takePhoto}
            handlePhotoTaken={handlePhotoTaken}
            photo={photo}
            styles={styles}
          />
        )}

        {phase === 'photo' && (
          <PhotoConfirmScreen
            photo={photo}
            mission={mission}
            isDanger={isDanger}
            handleRetake={handleRetake}
            handlePass={handlePass}
            styles={styles}
          />
        )}

        {phase === 'explode' && (
          <ExplodeScreen
            round={round}
            handleAfterExplode={handleAfterExplode}
            styles={styles}
          />
        )}

        {phase === 'gameover' && (
          <GameOverScreen
            photoGallery={photoGallery}
            resetGame={resetGame}
            styles={styles}
          />
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}

// ========== 셋업 화면 ==========
function SetupScreen({ playerCount, setPlayerCount, startGame, styles }) {
  const dec = () => setPlayerCount((n) => Math.max(3, n - 1));
  const inc = () => setPlayerCount((n) => Math.min(10, n + 1));

  return (
    <div style={{ animation: 'fade-in 0.4s' }}>
      <div style={styles.header}>
        <div style={styles.logo}>SHUTTER BOMB</div>
        <div style={styles.subtitle}>찰칵 못 하면 터진다</div>
      </div>

      <div style={styles.card}>
        <div style={{ ...styles.label, marginBottom: '12px' }}>⚠ 게임 방법</div>
        <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#c5bfb0' }}>
          1. 휴대폰 한 대를 폭탄처럼 돌립니다<br />
          2. 화면에 뜬 미션 사진을 빨리 찍으세요<br />
          3. 다 같이 "통과!" 외치고 다음 사람에게 패스<br />
          4. 한 라운드 동안 폭탄이 <span style={{ color: '#d6181a' }}>계속 타들어감</span><br />
          5. 언제 터질지 모름. 들고 있는 순간 터지면 폭탄 +1<br />
          6. 도저히 못 깰 미션이면 <span style={{ color: '#fff21f' }}>스킵</span> 1번 사용 가능 (휴대폰 받을 때마다 1회 충전)<br />
          <span style={{ color: '#fff21f' }}>━ 점수는 알아서 세기. 3라운드 후 폭탄 최소 승!</span>
        </div>
        <div
          style={{
            fontSize: '10px',
            color: '#666',
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px dashed #2a2620',
            letterSpacing: '0.05em',
          }}
        >
          ※ 시작 시 카메라 권한을 허용해야 미션 촬영이 됩니다
        </div>
      </div>

      <div style={styles.card}>
        <div
          style={{
            ...styles.label,
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          몇 명이서 할까?
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
          }}
        >
          <button
            onClick={dec}
            disabled={playerCount <= 3}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: playerCount <= 3 ? '#1a1813' : '#fff21f',
              color: playerCount <= 3 ? '#444' : '#0a0a08',
              border: 'none',
              fontSize: '28px',
              fontWeight: 900,
              cursor: playerCount <= 3 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: playerCount <= 3 ? 'none' : '3px 3px 0 #d6181a',
            }}
          >
            −
          </button>
          <div
            style={{
              fontFamily: "'Bowlby One', serif",
              fontSize: '64px',
              color: '#fff21f',
              textShadow: '4px 4px 0 #d6181a',
              minWidth: '80px',
              textAlign: 'center',
              lineHeight: 1,
            }}
          >
            {playerCount}
          </div>
          <button
            onClick={inc}
            disabled={playerCount >= 10}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: playerCount >= 10 ? '#1a1813' : '#fff21f',
              color: playerCount >= 10 ? '#444' : '#0a0a08',
              border: 'none',
              fontSize: '28px',
              fontWeight: 900,
              cursor: playerCount >= 10 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: playerCount >= 10 ? 'none' : '3px 3px 0 #d6181a',
            }}
          >
            +
          </button>
        </div>
        <div
          style={{
            fontSize: '10px',
            color: '#666',
            textAlign: 'center',
            marginTop: '12px',
            letterSpacing: '0.2em',
          }}
        >
          3 ~ 10명
        </div>
      </div>

      <button onClick={startGame} className="yellow-btn" style={styles.btn}>
        ▶ 게임 시작
      </button>
    </div>
  );
}

// ========== 준비 화면 ==========
function ReadyScreen({ round, isAfterExplode, startRound, styles }) {
  return (
    <div style={{ animation: 'fade-in 0.4s', textAlign: 'center', paddingTop: '40px' }}>
      <div
        style={{
          fontSize: '11px',
          letterSpacing: '0.3em',
          color: '#666',
          marginBottom: '24px',
        }}
      >
        ROUND {round + 1} / 3
      </div>

      <div
        style={{
          fontSize: '96px',
          marginTop: '32px',
          marginBottom: '16px',
          animation: 'pulse-bomb 1.5s ease-in-out infinite',
        }}
      >
        💣
      </div>
      <div
        style={{
          fontFamily: "'Bowlby One', serif",
          fontSize: '32px',
          color: '#fff21f',
          textShadow: '3px 3px 0 #d6181a',
          marginBottom: '32px',
        }}
      >
        준비됐나?
      </div>

      <div style={{ ...styles.card, textAlign: 'left', marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', lineHeight: '1.8', color: '#c5bfb0' }}>
          {isAfterExplode && (
            <div style={{ color: '#d6181a', marginBottom: '8px' }}>
              ◆ 이전 라운드에 터졌습니다. 새 라운드 시작
            </div>
          )}
          ◆ 처음 시작할 사람이 휴대폰을 들고 [점화]<br />
          ◆ 시작 누르면 <span style={{ color: '#d6181a' }}>폭탄 점화</span> — 라운드 동안 계속 타들어감<br />
          ◆ 미션 사진 찍고 → "통과!" 외치고 → 옆 사람에게 패스<br />
          ◆ 언제 터질지 <span style={{ color: '#d6181a' }}>아무도 모름</span>
        </div>
      </div>

      <button onClick={startRound} className="red-btn" style={{ ...styles.btn, ...styles.btnDanger }}>
        💣 폭탄 점화
      </button>
    </div>
  );
}

// ========== 미션 화면 (카메라) ==========
function MissionScreen({
  mission,
  isDanger,
  skipsLeft,
  handleSkipMission,
  videoRef,
  canvasRef,
  takePhoto,
  handlePhotoTaken,
  photo,
  styles,
}) {
  const handleShutter = () => {
    takePhoto();
    setTimeout(() => handlePhotoTaken(), 50);
  };

  const canSkip = skipsLeft > 0;

  return (
    <div
      style={{
        animation: isDanger ? 'shake 0.4s infinite' : 'fade-in 0.3s',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: '#888',
            letterSpacing: '0.2em',
          }}
        >
          💣 BOMB HOLDER
        </div>
        <div
          style={{
            fontSize: '10px',
            color: canSkip ? '#fff21f' : '#444',
            letterSpacing: '0.15em',
            fontWeight: 700,
          }}
        >
          {canSkip ? '⤴ SKIP ×1' : '⤴ SKIP 사용됨'}
        </div>
      </div>

      {/* 미션 카드 */}
      <div
        style={{
          ...styles.card,
          background: '#1a1813',
          borderColor: '#fff21f',
          borderWidth: '2px',
          marginBottom: '12px',
        }}
      >
        <div style={{ ...styles.label, marginBottom: '8px' }}>현재 미션</div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 900,
            color: '#fff21f',
            lineHeight: '1.2',
            fontFamily: "'Bowlby One', serif",
            letterSpacing: '-0.01em',
          }}
        >
          <span style={{ marginRight: '8px' }}>{mission?.icon}</span>
          {mission?.text}
        </div>
      </div>

      {/* 카메라 뷰 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/3',
          background: '#000',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '12px',
          border: '1px solid #2a2620',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* 카메라 코너 마커 */}
        <CornerMark style={{ top: 8, left: 8, borderTop: '2px solid #fff21f', borderLeft: '2px solid #fff21f' }} />
        <CornerMark style={{ top: 8, right: 8, borderTop: '2px solid #fff21f', borderRight: '2px solid #fff21f' }} />
        <CornerMark style={{ bottom: 8, left: 8, borderBottom: '2px solid #fff21f', borderLeft: '2px solid #fff21f' }} />
        <CornerMark style={{ bottom: 8, right: 8, borderBottom: '2px solid #fff21f', borderRight: '2px solid #fff21f' }} />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSkipMission}
          disabled={!canSkip}
          style={{
            ...styles.btn,
            ...styles.btnGhost,
            flex: 1,
            opacity: canSkip ? 1 : 0.35,
            cursor: canSkip ? 'pointer' : 'not-allowed',
          }}
        >
          ⤴ 스킵
        </button>
        <button
          onClick={handleShutter}
          className="yellow-btn"
          style={{ ...styles.btn, flex: 2 }}
        >
          📸 찰칵
        </button>
      </div>
    </div>
  );
}

function CornerMark({ style }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: '20px',
        height: '20px',
        ...style,
      }}
    />
  );
}

// ========== 사진 확인 화면 ==========
function PhotoConfirmScreen({
  photo,
  mission,
  isDanger,
  handleRetake,
  handlePass,
  styles,
}) {
  return (
    <div
      style={{
        animation: isDanger ? 'shake 0.4s infinite' : 'fade-in 0.3s',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: '#888',
          letterSpacing: '0.2em',
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        💣 BOMB HOLDER
      </div>

      <div
        style={{
          ...styles.card,
          textAlign: 'center',
          background: '#1a1813',
          marginBottom: '12px',
        }}
      >
        <div style={{ ...styles.label, marginBottom: '4px' }}>이 사진, 미션 OK?</div>
        <div style={{ fontSize: '14px', color: '#fff21f', marginBottom: '12px' }}>
          {mission?.icon} {mission?.text}
        </div>
        <img
          src={photo}
          alt="taken"
          style={{
            width: '100%',
            borderRadius: '2px',
            border: '2px solid #fff21f',
            display: 'block',
          }}
        />
        <div
          style={{
            fontSize: '11px',
            color: '#c5bfb0',
            marginTop: '10px',
            letterSpacing: '0.05em',
          }}
        >
          다 같이 보고 <span style={{ color: '#fff21f', fontWeight: 700 }}>"통과!"</span> 외치고 옆 사람에게 패스
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleRetake}
          style={{
            ...styles.btn,
            ...styles.btnGhost,
            flex: 1,
          }}
        >
          ↻ 다시
        </button>
        <button
          onClick={handlePass}
          className="yellow-btn"
          style={{ ...styles.btn, flex: 2 }}
        >
          ✓ 통과! 옆 사람에게
        </button>
      </div>
    </div>
  );
}

// ========== 폭탄 터짐 화면 ==========
function ExplodeScreen({ round, handleAfterExplode, styles }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        textAlign: 'center',
        paddingTop: '60px',
        animation: 'flash-red 0.4s 3',
      }}
    >
      <div
        style={{
          fontSize: '120px',
          animation: 'shake 0.3s infinite',
          marginBottom: '8px',
        }}
      >
        💥
      </div>
      <div
        style={{
          fontFamily: "'Bowlby One', serif",
          fontSize: '56px',
          color: '#d6181a',
          textShadow: '4px 4px 0 #fff21f',
          marginBottom: '24px',
          letterSpacing: '-0.02em',
        }}
      >
        BOOM!
      </div>

      {show && (
        <>
          <div
            style={{
              ...styles.card,
              animation: 'fade-in 0.4s',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '14px', color: '#fff21f', lineHeight: '1.6', fontWeight: 700 }}>
              지금 들고 있던 사람<br />
              <span style={{ fontSize: '20px', color: '#d6181a' }}>폭탄 +1</span>
            </div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '12px' }}>
              점수는 알아서 카운트 ✊
            </div>
          </div>

          <button
            onClick={handleAfterExplode}
            className="yellow-btn"
            style={{ ...styles.btn, marginTop: '16px', animation: 'fade-in 0.5s 0.2s both' }}
          >
            {round + 1 < 3 ? `▶ 라운드 ${round + 2} 시작` : '▶ 최종 결과 보기'}
          </button>
        </>
      )}
    </div>
  );
}

// ========== 게임오버 화면 ==========
function GameOverScreen({ photoGallery, resetGame, styles }) {
  return (
    <div style={{ animation: 'fade-in 0.5s', paddingBottom: '32px' }}>
      <div style={styles.header}>
        <div style={{ ...styles.logo, fontSize: '24px' }}>FINAL REPORT</div>
        <div style={styles.subtitle}>━ 폭발 사고 조사 보고서 ━</div>
      </div>

      <div style={{ ...styles.card, textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏆</div>
        <div
          style={{
            fontFamily: "'Bowlby One', serif",
            fontSize: '32px',
            color: '#fff21f',
            textShadow: '3px 3px 0 #d6181a',
            marginBottom: '8px',
            letterSpacing: '-0.02em',
          }}
        >
          누가 우승?
        </div>
        <div style={{ fontSize: '13px', color: '#c5bfb0', lineHeight: '1.7' }}>
          3라운드 동안 폭탄 <span style={{ color: '#d6181a' }}>가장 적게 맞은 사람</span>이 승!<br />
          <span style={{ color: '#888', fontSize: '11px' }}>
            (각자 몇 번 맞았는지 셌죠? 안 셌으면... 다시 해야지 🙃)
          </span>
        </div>
      </div>

      {photoGallery.length > 0 && (
        <div style={styles.card}>
          <div style={{ ...styles.label, marginBottom: '12px' }}>
            📸 폭소 갤러리 ({photoGallery.length})
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            {photoGallery.map((g, i) => (
              <div key={i}>
                <img
                  src={g.photo}
                  alt=""
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    objectFit: 'cover',
                    borderRadius: '2px',
                    border: '1px solid #2a2620',
                  }}
                />
                <div style={{ fontSize: '9px', color: '#888', marginTop: '4px' }}>
                  R{g.round} · {g.mission}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={resetGame} className="yellow-btn" style={styles.btn}>
        ↻ 다시 시작
      </button>
    </div>
  );
}
