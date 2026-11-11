// 학생회관 앞 — 선거운동 돕기 → 홍보물 미니게임 → 참치김밥 획득
// 한남이 · 한나미는 표정을 바꾸지 않음 (고정 이미지). 감정은 대사 · 위치 · 등장/퇴장 · 정적으로.
// 플레이어는 존댓말, 한남이와 한나미는 서로 반말.
const T = 'talk/'
const H = `${T}hall/`

// ── 연출 명령 (lintonScene.js 와 같은 형식) ──
const W = (s) => ({ wait: s })
const show = (who, o = {}) => ({ show: who, pose: 'base', ...o })
const hide = (who, o = {}) => ({ hide: who, ...o })
const move = (who, x, dur) => ({ move: who, x, dur })
const cam = (o) => ({ cam: o })
const sfx = (name) => ({ sfx: name })
const prop = (id, what, o = {}) => (typeof what === 'string' ? { prop: id, do: what, ...o } : { prop: id, to: what, ...o })

// 무대 준비 (중간부터 다시 시작할 때)
const STAGE = [{ walkers: true }, show('hannam', { dur: 0 }), cam({ zoom: 1, x: 0, dur: 0 })]

export const HALL = {
  place: '학생회관 정문 앞, 점심시간',
  typeSpeed: 35,
  gap: 0.3,
  calm: true, // 말할 때 인물이 커지지 않음
  main: ['hannam', 'hanami'], // 한남이 · 한나미 대사는 기본 방향, 플레이어는 반전
  bgs: { hall: { src: `${H}bg.webp` } },
  startBg: 'hall',
  cast: {
    hannam: { name: '한남이', known: true, folder: `${H}hannam/`, fallback: `${H}hannam.webp`, x: 330, bottom: -60, w: 518 },
    hanami: { name: '한나미', known: true, folder: `${H}hanami/`, fallback: `${H}hanami.webp`, x: -340, bottom: -60, w: 510 },
    // 화면 왼쪽에서 상반신만 보이는 한나미
    hanamiPeek: { name: '한나미', known: true, as: 'hanami', folder: `${H}hanami/`, fallback: `${H}hanami.webp`, x: -390, bottom: -110, w: 510 }, // 가운데 한남이 바로 왼쪽 옆
  },
  // 소품 (x · bottom · w 는 인물과 같은 단위)
  props: {
    flyers: { src: `${H}flyer.webp`, x: 0, bottom: 330, w: 240 }, // 홍보물.png
    kimbap: { src: `${T}kimbap.webp`, x: 60, bottom: 380, w: 200 }, // 한남이 손 근처에서 등장
  },
  // 배경을 좌우로 오가는 학생들 / 한남이 앞을 지나가는 학생 두 명
  walkers: [
    { src: `${H}npc1.webp`, h: 240, bottom: 250, dur: 17, delay: -4, dir: 1 },
    { src: `${H}npc2.webp`, h: 210, bottom: 290, dur: 21, delay: -13, dir: -1 },
    { src: `${H}npc3.webp`, h: 260, bottom: 220, dur: 15, delay: -9, dir: -1 },
  ],
  passersImgs: [`${H}npc2.webp`, `${H}npc3.webp`],
  // 미니게임 이미지
  game: { bg: `${H}bg.webp`, host: `${H}hannam.webp`, flyer: `${H}flyer.webp`, npcs: [`${H}npc1.webp`, `${H}npc2.webp`, `${H}npc3.webp`] },

  lines: [
    // ── SCENE 01. 다급한 한남이 ── (한남이가 먼저 말을 걺)
    {
      who: 'hannam',
      text: '안녕하세요! 학생회장 후보 한남이입니다. 공약 한번 읽어봐 주세요!',
      before: [{ walkers: true }, show('hannam', { dur: 0.6 }), cam({ zoom: 1.1, on: 'hannam', dur: 0.9 })],
      // 학생 두 명이 앞을 지나가지만 받지 않음
      after: [{ reveal: 'hannam' }, { passers: true, dur: 2.3 }],
    },
    { who: 'hannam', text: '아, 벌써 시간이 이렇게 됐네. 아직 한참 남았는데...', after: [W(1)] },
    {
      label: 'ask',
      // 다시 말을 걸었을 때는 여기서부터
      setup: [{ walkers: true }, show('hannam', { dur: 0 }), cam({ zoom: 1.1, on: 'hannam', dur: 0 })],
      who: 'me',
      text: '무슨 일 있으세요?',
    },
    { who: 'hannam', text: '아, 안녕하세요. 지금 학생회장 선거운동 중인데 점심시간 안에 홍보물을 나눠줘야 하거든요.' },
    { who: 'me', text: '많이 남았네요.' },
    {
      who: 'hannam',
      text: '네. 이따 다른 일정도 있어서요. 혹시 잠깐만 도와주실 수 있을까요?',
      choices: [
        { text: '제가 도와드릴게요.', goto: 'yes' },
        { text: '지금은 조금 바쁜데요.', goto: 'no' },
      ],
    },
    {
      label: 'yes',
      who: 'hannam',
      text: '정말요? 감사합니다! 학생들이 바빠서 홍보물을 잘 안 받아 가네요. 받으려는 학생들에게만 전달해 주시면 돼요.',
      // 홍보물 더미가 화면 가운데로 → 카메라가 조금 멀어짐
      // 홍보물이 화면 가운데에 나타났다가 사라짐 → 카메라가 조금 멀어짐
      after: [prop('flyers', 'show', { dur: 0.4 }), W(0.9), prop('flyers', 'hide'), cam({ zoom: 1, x: 0, dur: 0.8 })],
      next: 'game',
    },

    // ── SCENE 02. 미니게임 ──
    {
      label: 'game',
      checkpoint: 'game', // 그만두거나 닫으면 여기서부터 다시
      setup: STAGE,
      who: 'hannam',
      text: '홍보물을 받겠다는 학생들에게만 전달해 주세요. 이미 받은 학생도 있으니까 잘 확인해 주시고요.',
    },
    { who: 'me', text: '알겠습니다.' },
    {
      who: 'hannam',
      text: '그럼 부탁드릴게요!',
      // 대화창이 사라지고 게임 안내창 → 성공하면 다음 장면, 그만두면 지도로
      after: [W(0.3), { game: { quit: 'game' } }, { walkers: false }],
      auto: true,
    },

    // ── SCENE 03. 선거운동 종료 ──
    { label: 'after', checkpoint: 'after', setup: STAGE, who: 'me', text: '이제 다 끝난 건가요?' },
    { who: 'hannam', text: '네. 정말 큰 도움이 됐어요. 그냥 보내드리기엔 좀 그런데...', after: [W(0.8)] },
    { who: 'hannam', text: '보답은 나중에 할게요. 지금은 마땅히 드릴 게 없어서요.' },
    {
      who: 'me',
      text: '괜찮아요. 금방 끝났는데요.',
      // 왼쪽에서 한나미가 천천히 등장, 한남이는 오른쪽으로 살짝 비켜섬
      after: [move('hannam', 100, 0.9), show('hanami', { from: 'left', dur: 1.3 })],
    },
    { who: 'hanami', text: '한남아, 홍보물 다 나눠줬어?', after: [{ reveal: 'hanami' }] },
    { who: 'hannam', text: '응. 이분이 도와주셨어.' },
    { who: 'hanami', text: '벌써? 나도 아직 남았는데.' },
    { who: 'hannam', text: '너 아까 친구들이랑 이야기하고 있었잖아.' },
    { who: 'hanami', text: '그것도 선거운동이거든.' },
    { who: 'hannam', text: '알겠어. 그래서 몇 장 나눠줬는데?' },
    { who: 'hanami', text: '음, 30장?' },
    { who: 'hannam', text: '난 방금 50장 다 나눠줬어.', after: [W(0.7)] },
    { who: 'hanami', text: '...나도 좀 도와달라고 할걸.' },
    { who: 'hannam', text: '이제 와서?' },
    {
      who: 'hanami',
      text: '아직 선거 안 끝났잖아. 내일은 내가 더 많이 나눠줄 거야.',
      // 한나미 왼쪽으로 퇴장, 한남이는 다시 가운데로
      after: [hide('hanami', { to: 'left', dur: 1.1 }), move('hannam', -430, 1)],
    },

    // ── SCENE 04. 참치김밥 획득 ──
    { who: 'hannam', text: '아, 잠깐만요.' },
    { who: 'me', text: '네?', after: [W(0.5), prop('kimbap', 'show', { dur: 0.5 })] },
    {
      who: 'hannam',
      text: '이거밖에 없네. 점심시간인데 받아요.',
      // 김밥이 한남이 쪽에서 화면 가운데로 천천히
      after: [prop('kimbap', [0, 300], { scale: 1.4, dur: 1.4 })],
    },
    { who: 'me', text: '참치김밥이네요?' },
    { who: 'hannam', text: '네. 점심으로 먹으려고 챙겨왔는데, 도와주신 게 고마워서요.' },
    { who: 'me', text: '그럼 점심은 어떻게 하시려고요?', before: [prop('kimbap', 'hide', { dur: 0.4 })] },
    { who: 'hannam', text: '저는 나중에 먹으면 돼요. 학생회관 지하 1층에 멘사크리스티라는 식당도 있거든요.' },
    {
      who: 'hannam',
      text: '여기는 동아리방이나 실내체육관 같은 활동 공간뿐 아니라 장학금, 학적 관련 업무를 지원하는 부서도 있어서 학생들이 자주 이용해요.',
    },
    // 화면 밖에서 들리는 한나미 목소리 → 0.5초 뒤 왼쪽에서 상반신만
    { who: 'hanami', text: '거기 학식 맛있어!', after: [W(0.5), show('hanamiPeek', { from: 'left', dur: 0.5 })] },
    { who: 'hannam', text: '나미는 학식 얘기만 나오면 꼭 끼어드네.' },
    { who: 'hanamiPeek', text: '맛있는 건 알려줘야지.' },
    { who: 'me', text: '잘 먹겠습니다. 선거운동 힘내세요!', before: [hide('hanamiPeek', { to: 'left', dur: 0.7 })] },
    {
      who: 'hannam',
      text: '감사합니다. 투표도 꼭 참여해 주세요!',
      after: [
        W(0.3),
        { boxOff: true },
        sfx('ding'),
        {
          itemGet: {
            img: `${T}kimbap.webp`,
            title: 'ITEM GET!',
            sub: '참치김밥 × 1',
            desc: '한남이의 선거운동을 도와주고 받은 참치김밥.',
            monologue: [
              { text: '...근데 나 참치김밥 안 좋아하는데.' },
              { text: '주신 건데 버릴 수도 없고...', pause: 1 },
              { text: '아, 시유 선배 드려야겠다.', pause: 0.8 },
              { text: '참치김밥 좋아한다고 하셨지?' },
            ],
            saved: '참치김밥이 인벤토리에 보관되었습니다.',
          },
        },
      ],
    },

    // ── 선택지 B: 지금은 바빠요 → 대화 종료 (다시 누르면 도움 요청부터) ──
    {
      label: 'no',
      who: 'hannam',
      text: '아, 괜찮습니다. 그래도 관심 가져주셔서 감사해요!',
      after: [cam({ zoom: 1, x: 0, dur: 0.7 }), W(0.4), { leave: 'ask' }],
    },
  ],
}
