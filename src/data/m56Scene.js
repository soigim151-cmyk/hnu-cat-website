// 56주년 기념관 — 화석 선배 신전이의 졸업 (마지막 장소)
// 배경: 쪽문 → 56주년 기념관 앞 · 인물: 신전이 (표정 고정)
const T = 'talk/'
const M = `${T}m56/`

const W = (s) => ({ wait: s })
const show = (who, o = {}) => ({ show: who, pose: 'base', ...o })
const hide = (who, o = {}) => ({ hide: who, ...o })
const cam = (o) => ({ cam: o })
const sfx = (name) => ({ sfx: name })
const bg = (key, dur = 0.7) => ({ bg: key, dur })
const caption = (c, dur) => ({ caption: c, dur }) // 화면 가운데 짧은 글
const bgm = (name, o = {}) => ({ bgm: name, ...o })

// 간판(현수막) 쪽으로 카메라
const SIGN = cam({ zoom: 1.22, x: -110, y: 100, dur: 1 })
// 중간부터 다시 시작할 때 무대
const STAGE = [bg('m56', 0), show('jeon', { dur: 0 }), { walkers: true }, cam({ zoom: 1.06, on: 'jeon', dur: 0 }), bgm('bright')]

export const M56 = {
  place: '쪽문, 점심을 먹은 뒤',
  typeSpeed: 35,
  gap: 0.3,
  calm: true,
  summary: {
    name: '56주년 기념관',
    story: '수업 가는 길에 만난 엉뚱한 화석 선배 신전이. 알고 보니 오랫동안 학교를 지켜 온 고양이였고, 고양이별로 졸업하기 전 마지막 인사를 건넸다.',
    info: [
      '개교 56주년을 기념해 세운 건물이에요.',
      '수업이 열리는 건물이라, 수업 시간 전후로 학생들이 많이 오가요.',
      '건물 앞에 넓은 광장과 큰 계단이 있어요.',
    ],
  },
  main: ['jeon'], // 신전이 대사는 기본 방향, 플레이어는 반전
  bgs: {
    gate: { src: `${T}gate/bg-gate.webp` },
    m56: { src: `${M}bg.webp` },
  },
  startBg: 'gate',
  cast: {
    // 화면 오른쪽, 기념관 입구 근처에 앉아 있음
    jeon: { name: '신전이', title: '한남대학교 화석 선배 · 학번 비공개', folder: `${M}jeon/`, fallback: `${M}jeon.webp`, x: 380, bottom: 170, w: 360 },
  },
  walkers: [
    { src: `${T}hall/npc1.webp`, h: 230, bottom: 300, dur: 22, delay: -6, dir: 1 },
    { src: `${T}hall/npc2.webp`, h: 200, bottom: 330, dur: 26, delay: -15, dir: -1 },
    { src: `${T}hall/npc3.webp`, h: 250, bottom: 280, dur: 19, delay: -11, dir: -1 },
  ],

  // 앞부분은 가볍게 웃기고, 대사 곳곳에 '사실은 고양이'라는 힌트를 숨겨 둠
  // (학번 비공개 · 매일 같은 자리 · 사진과 간식 · 햇볕 자리 · 먼저 간 친구들 · 우산)
  // 마지막에 빈 자리와 쪽지로 반전 → 신전이는 오랫동안 학교를 지킨 고양이였고, 고양이별로 '졸업'한 것
  lines: [
    // ── SCENE 01. 수업 가는 길 ──
    { who: 'me', text: '아, 잘 먹었다. 이제 수업 가야지.' },
    {
      who: 'me',
      text: '...10분? 왜 벌써?',
      // 휴대폰 알림 → 수업 일정 팝업
      before: [
        { boxOff: true },
        sfx('ding'),
        caption({ phone: true, kicker: '다음 수업 알림', text: '56주년 기념관', sub: '10분 후 시작' }),
        W(1.6),
        { boxOff: false },
      ],
    },
    {
      who: 'jeon',
      text: '학생, 잠깐.',
      // 알림창이 사라지고 56주년 기념관 앞으로 → 오른쪽에 신전이
      before: [caption(null), { boxOff: true }, sfx('steps'), bg('m56', 0.9), bgm('bright'), show('jeon', { from: 'fade', dur: 0.6 }), { boxOff: false }],
      after: [W(0.5), cam({ zoom: 1.1, on: 'jeon', dur: 0.9 })],
    },
    { who: 'me', text: '네? 저요?' },
    { who: 'jeon', text: '혹시 56주년 기념관 어디 있는지 알아?' },
    { who: 'me', text: '...여기요.', after: [W(0.8)] },
    {
      who: 'jeon',
      text: '오, 아는구나. 요즘 애들은 건물 이름을 잘 모르길래 한번 물어봤어.',
      // 화면이 조금 멀어지며 뒤의 기념관 간판 강조
      after: [W(0.6), cam({ zoom: 1, x: 0, dur: 0.6 }), SIGN, W(0.6), cam({ zoom: 1.1, on: 'jeon', dur: 0.8 })],
    },
    { who: 'me', text: '(...뭐지, 이 선배님.)' },

    // ── SCENE 02. 학교의 살아 있는 역사 ──
    {
      label: 'history',
      checkpoint: 'history',
      setup: STAGE,
      who: 'me',
      text: '선배님은 이 학교 오래 다니셨어요?',
      before: [cam({ zoom: 1.16, on: 'jeon', dur: 0.8, wait: false }), { walkers: true }],
    },
    { who: 'jeon', text: '꽤 오래됐지. 너희 선배의 선배의 선배 때부터 여기 있었으니까.' },
    { who: 'me', text: '네? 그럼 몇 학번이세요?' },
    { who: 'jeon', text: '...그건 비밀로 하자.' },
    { who: 'jeon', text: '예전엔 나 보러 일부러 찾아오는 애들도 많았어. 사진도 찍어 가고, 간식도 주고.', },
    { who: 'me', text: '혹시 유명인이세요?' },
    { who: 'jeon', text: '유명했지. 학생회장 나갔으면 내가 됐을걸?' },
    { who: 'me', text: '그럼 나가 보시지….' },
    { who: 'jeon', text: '안 돼. 공약 지키기 귀찮아.' },
    { who: 'me', text: '(공약 이행률 0%…. 솔직하시네.)' },
    { who: 'jeon', text: '대신 출석률은 자신 있어. 비가 와도 눈이 와도 매일 여기 있었거든.' },
    { who: 'me', text: '...학점은요?' },
    { who: 'jeon', text: '그건 별개지.', after: [W(0.8)] },
    { who: 'me', text: '(출석률이랑 학점은 별개구나….)' },

    // ── SCENE 03. 화석 선배의 대학생활 꿀팁 ──
    {
      who: 'jeon',
      text: '수업까지 아직 시간 있지? 화석 선배가 꿀팁 하나 알려줄게.',
    },
    { who: 'jeon', text: '첫째. 햇볕 잘 드는 자리는 꼭 알아둬. 공강 때 거기만 한 데가 없어.', after: [{ sun: true, dur: 1.2, wait: false }] },
    { who: 'jeon', text: '둘째. 사람들하고 잘 지내. 그러면 간식이 생겨.', before: [{ sun: false, dur: 0.8, wait: false }], after: [W(0.5)] },
    { who: 'me', text: '...그게 목적이셨어요?' },
    { who: 'jeon', text: '결과가 좋으면 된 거지.' },
    { who: 'jeon', text: '셋째. 교수님하고 눈 마주치지 마. 괜히 일 생겨.' },
    { who: 'me', text: '선배님 대체 학교에서 뭘 하고 다니신 거예요?' },
    // 1초 정적 후 이름 공개 (NEW CHARACTER)
    { who: 'jeon', text: '학교생활 열심히 했지. 주로 낮잠.', after: [W(1), { reveal: 'jeon', dur: 2 }] },
    { who: 'jeon', text: '아, 나는 신전이야. 이름 기억해 줘.' },
    { who: 'me', text: '네, 신전이 선배님!' },

    // ── SCENE 04. 뜻밖의 졸업 소식 ──
    {
      label: 'graduate',
      checkpoint: 'graduate',
      setup: STAGE,
      who: 'jeon',
      text: '아, 그러고 보니 나 이제 졸업해.',
      after: [W(0.8)],
    },
    { who: 'me', text: '와, 드디어요? 축하드려요!' },
    { who: 'jeon', text: '드디어라니. 방금 처음 봤으면서.' },
    { who: 'me', text: '졸업하시면 뭐 하실 거예요?' },
    {
      who: 'jeon',
      text: '일단 푹 쉬려고. 따뜻하고 조용한 데서. 아프지도 않고, 배고프지도 않게.',
      before: [bgm('volume', { vol: 0.015, dur: 3 })],
    },
    { who: 'me', text: '...그런 데가 있어요?' },
    { who: 'jeon', text: '있대. 먼저 간 친구들이 다 거기 있거든.', after: [W(0.8), cam({ zoom: 1, x: 0, dur: 2.5, wait: false })] },
    { who: 'jeon', text: '그래도 막상 떠나려니까 좀 아쉽네.' },
    {
      who: 'jeon',
      text: '밥 챙겨 주던 사람, 이름 불러 주던 사람, 비 오는 날 우산 씌워 주던 사람…. 여기서 좋은 사람들을 참 많이 만났거든.',
      // 1.2초 정적 · 지나가던 학생들이 천천히 화면 밖으로
      after: [W(1.2), { walkers: false }],
    },

    // ── SCENE 05. 마지막 인사 ──
    {
      label: 'farewell',
      checkpoint: 'farewell',
      setup: [bg('m56', 0), show('jeon', { dur: 0 }), cam({ zoom: 1, x: 0, dur: 0 })],
      who: 'jeon',
      text: '근데 그 사람들한테 고맙다는 말을 한 번도 제대로 못 했어.',
      // 느리고 슬픈 피아노 · 색감을 따뜻하게
      before: [bgm('sad', { dur: 3 }), { warm: true, dur: 2, wait: false }],
    },
    { who: 'me', text: '지금이라도 하시면 되죠.' },
    { who: 'jeon', text: '그러게. 그럼… 네가 대신 들어 줄래?', after: [W(1), cam({ zoom: 1.15, on: 'jeon', dur: 1.4 })] },
    { who: 'jeon', text: '...그동안 고마웠어. 다들 덕분에, 여기서 사는 게 참 좋았어.' },
    { who: 'me', text: '선배님…?' },
    {
      who: 'jeon',
      text: '아, 너 수업 늦겠다. 얼른 가.',
      // 음악이 잠깐 작아지고 휴대폰 알림
      before: [bgm('volume', { vol: 0.02, dur: 0.6 }), sfx('ding'), W(0.6), bgm('volume', { vol: 0.065, dur: 1.2 })],
    },
    { who: 'me', text: '아! 맞다, 수업! 선배님, 졸업 축하드려요!' },
    { who: 'jeon', text: '응. 잘 가. 가끔 이 자리에 햇볕 쬐러 와 줘.' },

    // ── SCENE 06. 신전이의 졸업 (반전) ──
    {
      who: 'me',
      text: '...',
      before: [
        W(1.5),
        { boxOff: true },
        { chrome: false },
        // 플레이어가 기념관 안으로 → 화면이 어두워짐
        sfx('steps'),
        cam({ zoom: 1.3, x: 120, y: 40, dur: 1.6 }),
        { dark: 0.8, to: 1 },
        // 수업이 끝나고 다시 나와 보니, 신전이가 앉아 있던 자리에는 햇빛만
        hide('jeon', { dur: 0 }),
        { walkers: false },
        { sun: true, dur: 0 },
        cam({ zoom: 1.08, on: 'jeon', dur: 0 }),
        W(1),
        { dark: 1.6, to: 0 },
        W(1.5),
        { boxOff: false },
      ],
    },
    { who: 'me', text: '선배님? 벌써 가셨나….' },
    {
      who: 'me',
      text: '어? 여기 뭐가 놓여 있네.',
      // 그 자리에 놓여 있던 쪽지
      after: [
        sfx('rustle'),
        caption({
          note: true,
          kicker: '그 자리에 놓여 있던 쪽지',
          text: '신전아, 졸업 축하해.',
          sub: '오랫동안 56주년 기념관 앞을 지켜 줘서 고마워. 고양이별에서는 아프지 말고, 따뜻한 데서 실컷 낮잠 자. — 너를 기억하는 한남대 학생들',
        }),
      ],
    },
    { who: 'me', text: '...고양이별?' },
    { who: 'me', text: '학번은 비밀, 매일 같은 자리, 사진이랑 간식, 햇볕 잘 드는 자리…', after: [W(0.6)] },
    { who: 'me', text: '...선배님, 그런 거였어요?' },
    {
      who: 'jeon',
      text: '고마웠어, 후배.',
      // 햇빛 속에 아주 잠깐 신전이의 모습
      before: [caption(null), show('jeon', { from: 'fade', dur: 1.6, opacity: 0.45 })],
      after: [W(1.2), hide('jeon', { dur: 2.2 })],
    },
    {
      who: 'me',
      text: '...졸업 축하드려요, 신전이 선배님.',
      after: [
        W(1.5),
        { boxOff: true },
        { dark: 2, to: 1 },
        caption({
          end: true,
          kicker: 'IN MEMORY',
          text: '신전이',
          sub: '오랫동안 한남대학교를 지켜 준 터줏대감 고양이. 따뜻한 자리에서 편히 쉬기를.',
        }),
        W(4.5),
        bgm(null, { dur: 2.5 }),
        { finish: 2.5 },
      ],
    },
  ],
}
