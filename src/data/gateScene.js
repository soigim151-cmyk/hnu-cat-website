// 쪽문 — 4남매와의 첫 만남 → 점심 메뉴 고르기
// 배경: 쪽문.png · 인물: 차주일~차주사.png · 처음 모습: 남매.png
// 음식 그림은 임시 (public/talk/gate/food-*.webp 를 바꾸면 적용)
const T = 'talk/'
const G = `${T}gate/`

const W = (s) => ({ wait: s })
const show = (who, o = {}) => ({ show: who, pose: 'base', ...o })
const hide = (who, o = {}) => ({ hide: who, ...o })
const move = (who, x, dur) => ({ move: who, x, dur })
const cam = (o) => ({ cam: o })
const sfx = (name) => ({ sfx: name })
const bg = (key, dur = 0.7) => ({ bg: key, dur })
const reveal = (who, dur) => ({ reveal: who, dur })

const SIBS = ['ju1', 'ju2', 'ju3', 'ju4']
const showAll = (dur = 0.5) => SIBS.map((w, i) => show(w, { from: 'fade', dur, wait: i === SIBS.length - 1 }))
// 처음엔 넷이 함께 있는 모습(남매.png) → 대화가 시작되면 각자 이미지로
// 처음부터 다시 들어왔을 때 쓰는 무대 (메뉴 고르기에서 다시 시작)
const ALLEY = [bg('alley', 0), cam({ zoom: 1, x: 0, dur: 0 })]

// 메뉴 선택지 (그림 카드)
const MENU = [
  { text: '쯔보', sub: '오렌지치킨', img: `${G}food-zzubo.webp`, goto: 'eat-zzubo' },
  { text: '도스마스', sub: '부리또', img: `${G}food-dosmas.webp`, goto: 'eat-dosmas' },
  { text: '면식당', sub: '면 요리', img: `${G}food-noodle.webp`, goto: 'eat-noodle' },
  { text: '진앤키노', sub: '???', img: `${G}food-jin.webp`, goto: 'eat-jin' },
]
// 밥을 먹었을 때 (점심 완료 화면)
const lunch = (img, sub, desc, lines) => ({
  itemGet: { img, title: 'LUNCH TIME!', sub, desc, monologue: lines.map((text) => ({ text })), saved: '든든하게 점심을 먹었다!' },
})

export const GATE = {
  place: '린튼공원, 점심시간',
  typeSpeed: 35,
  gap: 0.3,
  calm: true,
  main: ['ju1', 'ju2', 'ju3', 'ju4', 'shop'], // 4남매 대사는 기본 방향, 플레이어는 반전
  bgs: {
    park: { src: `${T}bg-linton.webp` },
    alley: { src: `${G}bg-gate.webp` }, // 쪽문.png
  },
  startBg: 'park',
  cast: {
    group: { name: '', nofocus: true, folder: `${G}group/`, fallback: `${G}group.webp`, x: 0, bottom: -40, w: 1150 },
    ju1: { name: '치주일', folder: `${G}ju1/`, fallback: `${G}ju1.webp`, x: -480, bottom: -40, w: 262 },
    ju2: { name: '치주이', folder: `${G}ju2/`, fallback: `${G}ju2.webp`, x: -165, bottom: -40, w: 286 },
    ju3: { name: '치주삼', folder: `${G}ju3/`, fallback: `${G}ju3.webp`, x: 150, bottom: -40, w: 276 },
    ju4: { name: '치주사', folder: `${G}ju4/`, fallback: `${G}ju4.webp`, x: 455, bottom: -40, w: 242 },
    shop: { name: '진앤키노', known: true, folder: `${G}shop/`, fallback: `${G}ju1.webp`, x: 0, bottom: -2000, w: 10 },
  },

  lines: [
    // ── SCENE 01. 린튼공원 — 점심시간 ──
    {
      who: 'me',
      text: '아, 배고프다. 쪽문 가서 밥이나 먹어야겠다.',
      // 대화창 대신 쪽문으로 가는 이동 버튼
      choices: [{ text: '쪽문으로 이동하기 →', goto: 'alley' }],
    },

    // ── SCENE 02. 쪽문 — 4남매와의 첫 만남 ──
    {
      label: 'alley',
      who: 'ju3',
      text: '와, 오늘도 청소 중이네.',
      before: [{ boxOff: true }, sfx('steps'), bg('alley', 0.8), show('group', { from: 'fade', dur: 0.6 }), { boxOff: false }],
    },
    { who: 'ju2', text: '이번 주에만 세 번째야. 이제 좀 포기해.' },
    { who: 'ju3', text: '아니, 문은 맨날 열려 있는데 왜 장사를 안 하냐고.' },
    { who: 'ju1', text: '그래서 내가 다른 데 가자고 했잖아.' },
    { who: 'ju4', text: '...배고파.' },
    {
      who: 'ju1',
      text: '알았어. 이제 진짜 가자.',
      // 각자 이미지로 바뀌고, 치주삼이 돌아서다가 플레이어와 부딪힐 뻔함
      after: [
        hide('group', { dur: 0.35, wait: false }),
        ...showAll(0.35),
        cam({ zoom: 1.14, on: 'ju3', dur: 0.35 }),
        { shake: 'ju3' },
      ],
    },
    { who: 'ju3', text: '어, 조심하세요.' },
    { who: 'me', text: '아, 네. 괜찮아요.' },
    { who: 'ju3', text: '혹시 저기 가시려고요?', after: [cam({ zoom: 1, x: 0, dur: 0.6 })] },
    { who: 'me', text: '아니요. 그냥 밥 먹으러 왔는데요.' },
    { who: 'ju3', text: '다행이네요. 저긴 오늘도 청소 중이거든요.' },
    { who: 'ju2', text: '오늘만 그런 건 아니고요.' },
    { who: 'me', text: '자주 그러는 곳인가 봐요?' },
    { who: 'ju1', text: '네. 근데 얘가 자꾸 여기서 밥 먹겠다고 해서요.' },
    { who: 'ju3', text: '대체 뭘 파는지 궁금하잖아.' },
    { who: 'ju2', text: '그래서 국정원 비밀 사무실이라는 소문도 있어요. CIA 지부라는 얘기도 있고요.' },
    { who: 'me', text: 'CIA가 왜 여기 있어요?' },
    { who: 'ju3', text: '그러니까 안 들키죠.', after: [W(0.8)] },
    { who: 'ju1', text: '...그냥 밥 먹으러 가자.' },

    // ── SCENE 03. 네 명의 점심 메뉴 ──
    { who: 'ju1', text: '우리 다음 수업까지 40분 남았어. 빨리 정하자.', before: [sfx('ding')] },
    { who: 'ju3', text: '난 도스마스. 부리또면 들고 가면서도 먹을 수 있잖아.' },
    { who: 'ju2', text: '난 쯔보. 오렌지치킨 먹고 싶은데.' },
    {
      who: 'ju1',
      text: '시간 생각하면 면식당도 괜찮고. 난 거기 가고 싶어.',
      // 세 사람이 치주사를 바라봄
      after: [cam({ zoom: 1.1, on: 'ju4', dur: 0.6 }), W(0.5)],
    },
    { who: 'ju4', text: '...아무거나.' },
    { who: 'ju2', text: '주사야, 네가 그렇게 말하면 오늘도 못 정해.' },
    { who: 'ju4', text: '그럼 몽심.' },
    { who: 'ju1', text: '거긴 디저트잖아.' },
    { who: 'ju4', text: '레몬 마들렌 먹고 싶어.' },
    { who: 'ju3', text: '밥 먹고 가면 되지.', before: [cam({ zoom: 1, x: 0, dur: 0.5 })] },
    { who: 'ju1', text: '수업까지 40분 남았다니까.' },
    {
      who: 'ju2',
      text: '저희가 좀 시끄럽죠. 네 남매가 취향이 다 달라서 메뉴 하나 정하는 데 오래 걸려요.',
      // 치주이가 플레이어 쪽으로 살짝 다가옴
      before: [move('ju2', 50, 0.5)],
    },
    { who: 'me', text: '네 분이 남매세요?' },
    {
      who: 'ju2',
      text: '네. 저쪽부터 첫째 치주일, 저는 둘째 치주이, 셋째 치주삼, 막내 치주사예요.',
      after: [reveal('ju1', 0.9), reveal('ju2', 0.9), reveal('ju3', 0.9), reveal('ju4', 0.9)],
    },
    { who: 'ju3', text: '근데 혹시 어디 가서 드실 거예요?' },
    { who: 'me', text: '아직 못 정했어요.' },
    { who: 'ju3', text: '그럼 도스마스 가세요. 부리또 괜찮아요.' },
    { who: 'ju2', text: '쯔보 오렌지치킨도 맛있어요. 좀 색다른 거 먹고 싶을 때 추천해요.' },
    { who: 'ju1', text: '면 좋아하시면 면식당도 괜찮고요. 선택지는 많으니까 천천히 골라보세요.' },
    { who: 'ju4', text: '...몽심 레몬 마들렌도요.' },
    { who: 'me', text: '네. 추천 감사합니다.' },
    { who: 'ju1', text: '야, 35분 남았어.', before: [sfx('ding'), W(0.4)] },
    { who: 'ju3', text: '그럼 도스마스 가자니까.' },
    { who: 'ju2', text: '알았어. 오늘은 네가 이겼다.' },
    { who: 'ju4', text: '...몽심은?' },
    { who: 'ju1', text: '수업 끝나고 가자.' },
    {
      who: 'ju4',
      text: '응.',
      // 네 명이 골목 안쪽으로 (치주삼만 남아 뒤돌아봄)
      after: [
        sfx('steps'),
        hide('ju1', { to: 'right', dur: 0.8, wait: false }),
        hide('ju2', { to: 'right', dur: 0.9, wait: false }),
        hide('ju4', { to: 'right', dur: 1 }),
      ],
    },
    { who: 'ju3', text: '아, 그리고 진앤키노는 혹시 영업하는 거 보시면 알려주세요!' },
    { who: 'ju1', text: '야, 빨리 와.', after: [hide('ju3', { to: 'right', dur: 0.7 })] },
    { who: 'me', text: '밥 먹으러 왔다가 이상한 가게 얘기만 잔뜩 들었네.', after: [W(0.5)] },
    {
      who: 'me',
      text: '...근데 진짜 뭐 하는 곳이지?',
      // 진앤키노 간판 잠깐 강조
      after: [cam({ zoom: 1.35, x: 0, dur: 0.8 }), W(0.9), cam({ zoom: 1, x: 0, dur: 0.6 })],
    },

    // ── 점심 메뉴 고르기 ──
    {
      label: 'menu',
      checkpoint: 'menu', // 닫았다가 다시 오면 여기서부터
      setup: ALLEY,
      who: 'me',
      text: '그래서 밥은 뭘 먹으면 좋을까?',
      choices: MENU,
    },

    // 쯔보
    {
      label: 'eat-zzubo',
      who: 'me',
      text: '오렌지치킨 하나 주세요!',
      after: [
        W(0.3),
        lunch(`${G}food-zzubo.webp`, '쯔보 · 오렌지치킨', '치주이가 추천한 쯔보의 오렌지치킨.', [
          '새콤달콤하니 맛있다.',
          '확실히 색다른 걸 먹고 싶을 때 딱이네.',
        ]),
      ],
    },
    // 도스마스
    {
      label: 'eat-dosmas',
      who: 'me',
      text: '부리또 하나 주세요!',
      after: [
        W(0.3),
        lunch(`${G}food-dosmas.webp`, '도스마스 · 부리또', '치주삼이 추천한 도스마스의 부리또.', [
          '들고 다니면서 먹기 편하다.',
          '...4남매도 지금 이거 먹고 있겠지?',
        ]),
      ],
    },
    // 면식당
    {
      label: 'eat-noodle',
      who: 'me',
      text: '여기 면 하나 주세요!',
      after: [
        W(0.3),
        lunch(`${G}food-noodle.webp`, '면식당 · 면 요리', '치주일이 추천한 면식당의 면 요리.', [
          '금방 나와서 좋다.',
          '수업 전에 먹기엔 딱이네.',
        ]),
      ],
    },
    // 진앤키노: 청소 중이라 쫓겨남 → 다시 고르기
    {
      label: 'eat-jin',
      who: 'me',
      text: '저기... 혹시 영업하세요?',
      before: [cam({ zoom: 1.3, x: 0, dur: 0.7 })],
    },
    {
      who: 'shop',
      text: '지금 청소 중입니다! 나가 주세요!',
      after: [sfx('comic'), { shake: 'world' }, sfx('whoosh'), cam({ zoom: 1, x: 0, dur: 0.35 })],
    },
    { who: 'me', text: '...쫓겨났다.', after: [W(0.6)] },
    { who: 'me', text: '진짜 청소 중이었네. 다른 데 가야겠다.', next: 'menu' },
  ],
}
