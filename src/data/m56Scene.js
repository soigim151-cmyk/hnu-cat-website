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
const icon = (text, dur) => ({ icon: 'jeon', text, dur }) // 신전이 옆 작은 아이콘
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
      before: [
        caption(null),
        { boxOff: true },
        sfx('steps'),
        bg('m56', 0.9),
        bgm('bright'),
        show('jeon', { from: 'fade', dur: 0.6 }),
        { boxOff: false },
      ],
      // 화면이 멈추고 ? 아이콘 → 0.5초 뒤 카메라가 신전이 쪽으로 약하게
      after: [icon('?'), W(0.5), cam({ zoom: 1.1, on: 'jeon', dur: 0.9 })],
    },
    { who: 'me', text: '네? 저요?' },
    { who: 'jeon', text: '혹시 56주년 기념관 어디 있는지 알아?' },
    { who: 'me', text: '...여기요.', after: [W(0.8), icon('…', 1)] },
    { who: 'jeon', text: '아, 그렇구나.', before: [icon('?')] },
    { who: 'me', text: '선배님도 수업 들으러 오셨어요?' },
    {
      who: 'jeon',
      text: '아니, 그냥 네가 아는지 궁금해서.',
      // 1초 정적 → 화면이 조금 멀어지며 뒤의 기념관 간판 강조
      after: [W(1), cam({ zoom: 1, x: 0, dur: 0.6 }), SIGN, W(0.6)],
    },
    { who: 'me', text: '...네?', after: [cam({ zoom: 1.1, on: 'jeon', dur: 0.8 })] },
    { who: 'jeon', text: '요즘 학생들은 건물 이름 잘 모르더라고. 한번 물어봤어.' },
    { who: 'me', text: '뭐지, 이 선배님.', after: [icon(null)] },

    // ── SCENE 02. 학교의 살아 있는 역사 ──
    {
      label: 'history',
      checkpoint: 'history',
      setup: STAGE,
      who: 'me',
      text: '선배님은 이 학교 오래 다니셨어요?',
      before: [cam({ zoom: 1.16, on: 'jeon', dur: 0.8, wait: false }), { walkers: true }],
    },
    { who: 'jeon', text: '꽤 오래됐지. 여기 웬만한 건물은 다 알아.' },
    { who: 'me', text: '그럼 56주년 기념관은 왜 물어보셨어요?' },
    { who: 'jeon', text: '아까 말했잖아. 네가 아는지 궁금했다고.' },
    { who: 'me', text: '아...', after: [W(0.5)] },
    { who: 'jeon', text: '예전에는 나 보러 일부러 찾아오는 학생들도 많았어.' },
    { who: 'me', text: '선배님이요?' },
    {
      who: 'jeon',
      text: '응. 사진도 찍고, 간식도 주고. 학교에서 나 모르는 사람이 별로 없었거든.',
      after: [icon('📷', 0.9), icon('🍪', 0.9)],
    },
    { who: 'me', text: '혹시 유명인이세요?' },
    { who: 'jeon', text: '유명했지. 한때는 내가 이 학교에서 제일 인기 많았을걸?' },
    { who: 'me', text: '연예인처럼요?' },
    { who: 'jeon', text: '연예인은 아니고. 그냥 지나가면 사람들이 좋아했어.' },
    { who: 'me', text: '...그 정도면 학생회장 출마하셔도 되겠는데요?' },
    { who: 'jeon', text: '안 돼. 공약 지키기 귀찮아.', after: [caption({ text: '공약 이행률: 0%' }, 1)] },
    { who: 'me', text: '엄청 솔직하시네요.' },
    { who: 'jeon', text: '대신 출석률은 자신 있어.' },
    { who: 'me', text: '아, 성실하게 학교 다니셨나 봐요.' },
    { who: 'jeon', text: '거의 매일 있었거든.' },
    { who: 'me', text: '그럼 학점도 좋으시겠네요?' },
    { who: 'jeon', text: '그건 별개지.', after: [W(0.8), caption({ text: '출석률 100% / 학점 비공개' })] },
    { who: 'me', text: '...그렇군요.', after: [caption(null)] },

    // ── SCENE 03. 화석 선배의 대학생활 꿀팁 ──
    { who: 'jeon', text: '근데 너 지금 수업 가는 길 아니야?' },
    { who: 'me', text: '네. 10분 뒤에 시작해요.' },
    { who: 'jeon', text: '그럼 아직 여유 있네. 내가 대학생활 꿀팁 하나 알려줄까?' },
    { who: 'me', text: '어떤 건데요?', after: [caption({ text: '화석 선배의 대학생활 꿀팁' }, 0.9)] },
    {
      who: 'jeon',
      text: '첫 번째. 학교에서 햇볕 잘 드는 자리는 미리 알아둬.',
      after: [{ sun: true, dur: 1.2, wait: false }],
    },
    { who: 'me', text: '...왜요?' },
    { who: 'jeon', text: '공강 때 거기만 한 데가 없거든.' },
    { who: 'me', text: '아, 공강 때 쉬기 좋은 장소요?', after: [{ sun: false, dur: 0.8, wait: false }] },
    { who: 'jeon', text: '그렇지. 그리고 두 번째. 학교에 오래 있고 싶으면 사람들하고 잘 지내.' },
    { who: 'me', text: '그건 좋은 조언이네요.' },
    { who: 'jeon', text: '간식도 얻어먹을 수 있어.', after: [icon('🍪'), W(0.5)] },
    { who: 'me', text: '...그게 목적이셨어요?', after: [icon(null)] },
    { who: 'jeon', text: '결과가 좋으면 된 거지.' },
    { who: 'me', text: '세 번째도 있나요?' },
    { who: 'jeon', text: '세 번째는... 교수님하고 눈 마주치지 마.', after: [icon('⚠️')] },
    { who: 'me', text: '네?' },
    { who: 'jeon', text: '괜히 일 생겨.', after: [icon(null)] },
    { who: 'me', text: '선배님 대체 학교에서 뭘 하고 다니신 거예요?' },
    // 1초 정적 후 이름 공개 (NEW CHARACTER)
    { who: 'jeon', text: '학교생활 열심히 했지.', after: [W(1), { reveal: 'jeon', dur: 2 }] },
    { who: 'me', text: '아, 선배님 성함이 신전이세요?' },
    { who: 'jeon', text: '응. 이름도 이제 알았으니까 다음에 보면 인사해.' },
    { who: 'me', text: '네. 근데 몇 학번이세요?' },
    { who: 'jeon', text: '...그건 비밀로 하자.', after: [icon('🔒', 1)] },

    // ── SCENE 04. 뜻밖의 졸업 소식 ──
    {
      label: 'graduate',
      checkpoint: 'graduate',
      setup: STAGE,
      who: 'jeon',
      text: '아, 그러고 보니 나 이제 졸업해.',
      after: [{ boxOff: true }, W(0.8), caption({ text: '🎓' }, 1.2), { boxOff: false }],
    },
    { who: 'me', text: '네? 선배님 드디어 졸업하세요?' },
    { who: 'jeon', text: '드디어라니. 방금 처음 봤으면서.' },
    { who: 'me', text: '아, 워낙 오래 다니셨다고 하셔서...' },
    { who: 'jeon', text: '뭐, 틀린 말은 아니네.' },
    { who: 'me', text: '졸업하시면 뭐 하실 거예요? 취업이요?' },
    { who: 'jeon', text: '아니. 일단 푹 쉬려고.' },
    { who: 'me', text: '여행 같은 거요?' },
    { who: 'jeon', text: '그것도 좋지. 따뜻한 데 가서 낮잠이나 자고 싶네.' },
    { who: 'me', text: '선배님은 원래도 잘 쉬시는 것 같은데요.' },
    { who: 'jeon', text: '그러니까 잘하는 걸 더 해보려고.' },
    { who: 'me', text: '...멋진 계획이네요.' },
    { who: 'jeon', text: '그렇지?' },
    {
      who: 'jeon',
      text: '그래도 막상 떠나려니까 좀 아쉽긴 해.',
      // 음악이 서서히 작아지고, 카메라가 천천히 멀어지며 신전이와 학교 건물이 함께
      before: [bgm('volume', { vol: 0.015, dur: 3 })],
      after: [cam({ zoom: 1, x: 0, dur: 2.5, wait: false })],
    },
    { who: 'me', text: '오래 다니셨으니까요.' },
    { who: 'jeon', text: '응. 여기서 좋은 사람들을 참 많이 만났거든.' },
    { who: 'me', text: '선배님 인기 많으셨다면서요.' },
    { who: 'jeon', text: '그랬지. 날 보러 와주던 학생들도 있고, 매일 인사해 주던 사람들도 있고.' },
    // 1.2초 정적 · 지나가던 학생들이 천천히 화면 밖으로
    { who: 'jeon', text: '다들 나한테 참 잘해줬어.', after: [W(1.2), { walkers: false }] },

    // ── SCENE 05. 마지막 인사 ──
    {
      label: 'farewell',
      checkpoint: 'farewell',
      setup: [bg('m56', 0), show('jeon', { dur: 0 }), cam({ zoom: 1, x: 0, dur: 0 })],
      who: 'me',
      text: '졸업하시면 학교가 많이 그리우시겠네요.',
      // 잔잔한 피아노 · 색감을 따뜻하게
      before: [bgm('piano', { dur: 2.5 }), { warm: true, dur: 2, wait: false }],
    },
    { who: 'jeon', text: '그렇겠지. 오래 있었으니까.' },
    { who: 'me', text: '그래도 새로운 곳에서도 좋은 사람들 많이 만나실 거예요.' },
    { who: 'jeon', text: '그러면 좋겠네.' },
    { who: 'me', text: '졸업 축하드려요, 선배님.' },
    { who: 'jeon', text: '고마워. 너도 학교생활 잘하고.' },
    {
      who: 'me',
      text: '네. 선배님도 앞으로 행복한 일만 가득하셨으면 좋겠어요.',
      // 1초 정적 · 신전이가 조금 더 크게
      after: [W(1), cam({ zoom: 1.15, on: 'jeon', dur: 1.4 })],
    },
    {
      who: 'jeon',
      text: '...고맙다.',
      // 음악이 잠깐 작아지고 휴대폰 알림
      after: [W(0.6), bgm('volume', { vol: 0.02, dur: 0.6 }), sfx('ding'), W(0.6), bgm('volume', { vol: 0.07, dur: 1.2 })],
    },
    { who: 'jeon', text: '아, 그리고 너 수업 늦겠다.' },
    { who: 'me', text: '아! 맞다, 수업!' },
    { who: 'jeon', text: '마지막까지 후배 하나 지각시킬 뻔했네.' },
    { who: 'me', text: '선배님이 자꾸 말을 거셨잖아요.' },
    { who: 'jeon', text: '그러게. 얼른 가.' },
    { who: 'me', text: '네! 안녕히 계세요!' },
    {
      who: 'jeon',
      text: '잘 가. 남은 학교생활 재밌게 보내.',
      after: [
        W(1.5),
        { boxOff: true },
        { chrome: false },
        // ── SCENE 06. 신전이의 졸업 (자동 진행) ──
        // 플레이어가 기념관 입구로 → 화면이 잠시 어두워짐
        sfx('steps'),
        cam({ zoom: 1.3, x: 120, y: 40, dur: 1.6 }),
        { dark: 0.8, to: 1 },
        // 다시 밝아지면 신전이가 앉아 있던 자리만 (햇빛만 내려앉음)
        hide('jeon', { dur: 0 }),
        { walkers: false },
        { warm: true, dur: 0 },
        { sun: true, dur: 0 },
        cam({ zoom: 1.08, on: 'jeon', dur: 0 }),
        W(0.6),
        { dark: 1.6, to: 0 },
        W(2),
        bgm(null, { dur: 2.5 }),
        { finish: 2.5 },
      ],
    },
  ],
}
