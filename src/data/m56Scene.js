// 56주년 기념관 — 화석 선배 신전이의 졸업 (마지막 장소)
// 배경: 쪽문 → 56주년 기념관 앞 · 인물: 신전이 (표정 고정)
const T = 'talk/'
const M = `${T}m56/`

const W = (s) => ({ wait: s })
const pose = (who, p, dur = 0.3) => ({ pose: who, p, dur })
const show = (who, o = {}) => ({ show: who, pose: 'base', ...o })
const hide = (who, o = {}) => ({ hide: who, ...o })
const cam = (o) => ({ cam: o })
const sfx = (name) => ({ sfx: name })
const bg = (key, dur = 0.7) => ({ bg: key, dur })
const caption = (c, dur) => ({ caption: c, dur }) // 화면 가운데 짧은 글
const bgm = (name, o = {}) => ({ bgm: name, ...o })

// 간판(현수막) 쪽으로 카메라
const SIGN = cam({ zoom: 1.22, x: -110, y: 100, dur: 1 })
// 회상 장면 사진 (public/talk/m56/flash1~3.webp 를 올리면 교체, 지금은 갤러리 고양이 사진으로 임시)
const FLASH = [
  { src: `${M}flash1.webp`, fallback: 'images/gallery/cat_05_l.webp', caption: '밥 챙겨 주던 사람' },
  { src: `${M}flash2.webp`, fallback: 'images/gallery/cat_19_l.webp', caption: '찾아와서 걱정해 주던 사람' },
  { src: `${M}flash3.webp`, fallback: 'images/gallery/cat_23_l.webp', caption: '우산 씌워 주던 사람' },
]
// 중간부터 다시 시작할 때 무대
const STAGE = [bg('m56', 0), show('jeon', { dur: 0 }), cam({ zoom: 1.06, on: 'jeon', dur: 0 }), bgm('bright')]

export const M56 = {
  place: '쪽문, 점심을 먹은 뒤',
  typeSpeed: 35,
  gap: 0.3,
  calm: true,
  summary: {
    name: '56주년 기념관',
    story: '수업 가는 길에 만난 뻔뻔한 대선배 신전이. 졸업을 앞둔 그는 학교에서 만난 사람들에게 대신 고맙다고 전해 달라는 부탁을 남겼다.',
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
    // 새 신전이 (정면 · 미소 · 씁쓸 — 파일 이름은 '시유…'로 올라온 이미지)
    jeon: { name: '신전이', title: '56주년 기념관 앞 대선배 · 학번 비공개', folder: `${M}jeon/`, ext: 'webp', fallback: `${M}jeon.webp`, x: 400, bottom: 120, w: 520 },
  },
  walkers: [
    { src: `${T}hall/npc1.webp`, h: 230, bottom: 300, dur: 22, delay: -6, dir: 1 },
    { src: `${T}hall/npc2.webp`, h: 200, bottom: 330, dur: 26, delay: -15, dir: -1 },
    { src: `${T}hall/npc3.webp`, h: 250, bottom: 280, dur: 19, delay: -11, dir: -1 },
  ],

  // 앞부분은 뻔뻔하고 유쾌하게, 곳곳에 '사실은 고양이'라는 힌트 (대선배 · 매일 같은 자리 · 사진과 간식 · 리클라이너 · 교수님들이 예뻐해 줌)
  // 끝에서 회상 → 대신 고맙다고 전해 달라는 부탁 → 수업에 늦어 급히 인사하고 떠남 → 신전이가 바라보다 천천히 암전
  // 이어서 지도 화면의 마지막 퀘스트(신전이가 전해 달라던 말 적기)에서 진짜 이야기가 드러남
  lines: [
    // ── SCENE 01. 수업 가는 길 ──
    { who: 'me', text: '아, 잘 먹었다. 이제 수업 가야지.' },
    {
      who: 'me',
      text: '…10분? 왜 벌써?',
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
      text: '저기, 잠깐.',
      // 알림창이 사라지고 56주년 기념관 앞으로 → 오른쪽에 신전이
      before: [caption(null), { boxOff: true }, sfx('steps'), bg('m56', 0.9), bgm('bright'), show('jeon', { from: 'fade', dur: 0.6 }), { boxOff: false }],
      after: [W(0.5), cam({ zoom: 1.1, on: 'jeon', dur: 0.9 })],
    },
    { who: 'me', text: '네? 저요?' },
    { who: 'jeon', text: '혹시 56주년 기념관 어디 있는지 알아?' },
    { who: 'me', text: '…여기요.', after: [W(0.8)] },
    {
      who: 'jeon',
      text: '오, 아는구나. 요즘 애들은 건물 이름을 잘 모르길래 한번 물어봤어.',
      // 화면이 조금 멀어지며 뒤의 기념관 간판 강조
      after: [W(0.6), cam({ zoom: 1, x: 0, dur: 0.6 }), SIGN, W(0.6), cam({ zoom: 1.1, on: 'jeon', dur: 0.8 })],
    },
    { who: 'me', text: '(…뭐지, 이 사람.)' },

    // ── SCENE 02. 학교의 살아 있는 역사 ──
    {
      label: 'history',
      checkpoint: 'history',
      setup: STAGE,
      who: 'jeon',
      text: '아…. 이 학교도 참 오래 다녔네.',
      before: [cam({ zoom: 1.16, on: 'jeon', dur: 0.8, wait: false })],
    },
    { who: 'me', text: '혹시… 선배님이세요?' },
    { who: 'jeon', text: '대선배지.', before: [pose('jeon', 'smile')] },
    { who: 'jeon', text: '예전엔 나 보러 일부러 찾아오는 애들도 많았어. 사진도 찍어 가고, 간식도 주고.' },
    { who: 'me', text: '네? 왜요?' },
    { who: 'jeon', text: '내가 인기가 좀 많아.', before: [pose('jeon', 'smile')] },
    { who: 'me', text: '(…스스로 저렇게 말하는 사람은 처음 봐.)' },
    { who: 'jeon', text: '출석률은 또 얼마나 좋은데. 비가 와도 눈이 와도 매일 여기 있었어.' },
    { who: 'me', text: '…학점은요?' },
    { who: 'jeon', text: '그건 별개지.', before: [pose('jeon', 'smile')], after: [W(0.8)] },
    { who: 'me', text: '(출석률이랑 학점은 별개구나….)' },

    // ── SCENE 03. 대선배의 대학생활 꿀팁 ──
    { who: 'jeon', text: '수업까지 아직 시간 있지? 대선배가 꿀팁 하나 알려 줄게.' },
    {
      who: 'jeon',
      text: '첫째, 56주년 기념관에는 리클라이너가 있어서 잠도 잘 수 있어. 학교에 몇 안 되는 수면 시설이니까 알아 둬.',
      after: [{ list: { title: '56주년 기념관', items: ['리클라이너가 있는 휴게 공간 (학교에 몇 안 되는 수면 시설)'] } }],
    },
    {
      who: 'jeon',
      text: '둘째, 여기는 생각보다 행사가 많아서, 운만 좋으면 가끔 맛있는 것도 줘.',
      after: [{ list: { title: '56주년 기념관', items: ['리클라이너가 있는 휴게 공간 (학교에 몇 안 되는 수면 시설)', '행사가 자주 열리는 곳'] } }, W(0.5)],
    },
    { who: 'me', text: '(출석률이 좋으신 이유가 이것 때문이었구나….)' },
    { who: 'jeon', text: '셋째, 교수님들 생각보다 다정하셔. 모르는 거 있으면 그냥 여쭤봐. 나도 교수님들이 많이 예뻐해 주셨거든.' },
    { who: 'me', text: '선배님은 대체 학교에서 뭘 하고 다니신 거예요?', before: [{ list: null }] },
    // 1초 정적 후 이름 공개 (NEW CHARACTER)
    { who: 'jeon', text: '학교생활 열심히 했지. 주로 낮잠.', before: [pose('jeon', 'smile')], after: [W(1), { reveal: 'jeon', dur: 2 }] },
    { who: 'jeon', text: '아, 나는 신전이야. 이름 기억해 줘.', before: [pose('jeon', 'front')] },
    { who: 'me', text: '네, 신전이 선배님!' },

    // ── SCENE 04. 뜻밖의 졸업 소식 ──
    {
      label: 'graduate',
      checkpoint: 'graduate',
      setup: STAGE,
      who: 'jeon',
      text: '아, 근데 나 이제 졸업한다.',
      after: [W(0.8)],
    },
    { who: 'me', text: '예? 방금 알았는데요?' },
    { who: 'jeon', text: '내가 이 학교를 너무 오래 다녀서, 이제는 진짜 졸업해야 돼. 이러다 교수님들이랑 친구 하게 생겼어….' },
    { who: 'me', text: '졸업하시면 뭐 하시려고요?' },
    {
      who: 'jeon',
      text: '일단 푹 쉬려고. 따뜻하고 조용한 데서. 아프지도 않고, 배고프지도 않게.',
      before: [bgm('volume', { vol: 0.015, dur: 3 })],
    },
    { who: 'me', text: '…그런 데가 있어요?' },
    { who: 'jeon', text: '흠, 글쎄. 있지 않을까?', before: [pose('jeon', 'bitter')], after: [W(0.8), cam({ zoom: 1, x: 0, dur: 2.5, wait: false })] },
    { who: 'jeon', text: '그래도 막상 떠나려니까 좀 아쉽네.', before: [pose('jeon', 'bitter')] },
    // 1.2초 정적 · 지나가던 학생들이 천천히 화면 밖으로
    { who: 'jeon', text: '여기서 좋은 사람들을 참 많이 만났거든.', after: [W(1.2)] },

    // ── SCENE 05. 회상 · 마지막 인사 ──
    {
      label: 'farewell',
      checkpoint: 'farewell',
      setup: [bg('m56', 0), show('jeon', { dur: 0 }), cam({ zoom: 1, x: 0, dur: 0 })],
      who: 'jeon',
      text: '밥 챙겨 주던 사람,',
      // 느리고 슬픈 피아노 · 색감을 따뜻하게 · 회상 장면 하나씩
      before: [bgm('sad', { dur: 3 }), { warm: true, dur: 2, wait: false }, { flash: FLASH[0], dur: 1.2 }],
    },
    { who: 'jeon', text: '한참을 찾아와서 걱정해 주던 사람,', before: [{ flash: FLASH[1], dur: 1 }] },
    { who: 'jeon', text: '비 오는 날 우산 씌워 주던 사람….', before: [{ flash: FLASH[2], dur: 1 }] },
    { who: 'jeon', text: '근데 그 사람들한테 고맙다는 말을 한 번도 제대로 못 했어.', before: [pose('jeon', 'bitter'), { flash: null, dur: 1.2 }] },
    { who: 'me', text: '지금이라도 하시면 되죠.' },
    { who: 'jeon', text: '그러게. 그럼… 네가 대신 전해 줄래?', before: [pose('jeon', 'smile')], after: [W(1), cam({ zoom: 1.15, on: 'jeon', dur: 1.4 })] },
    { who: 'jeon', text: '지금까지 나와 함께해 줘서 고마웠다고. 다들 덕분에, 여기서 지내는 게 참 좋았다고.' },
    { who: 'me', text: '선배님…?', after: [W(0.8)] },
    {
      who: 'jeon',
      text: '아, 너 수업 늦겠다. 얼른 가.', before: [pose('jeon', 'smile')],
      // 음악이 잠깐 작아지고 휴대폰 알림
      before: [bgm('volume', { vol: 0.02, dur: 0.6 }), sfx('ding'), W(0.6), bgm('volume', { vol: 0.065, dur: 1.2 })],
    },
    {
      who: 'me',
      text: '아! 맞다, 수업! 선배님, 졸업 축하드려요!',
      after: [
        W(1.2),
        { boxOff: true },
        { chrome: false },
        // 급히 뛰어가는 우리를 신전이가 바라봄 → 천천히 멀어지며 암전
        sfx('steps'),
        cam({ zoom: 1.08, on: 'jeon', dur: 0.8 }),
        W(1.2),
        cam({ zoom: 1, x: 0, dur: 3.5, wait: false }),
        W(1.5),
        { dark: 3.5, to: 1 },
        W(1),
        bgm(null, { dur: 2 }),
        // 지도로 돌아가면 마지막 퀘스트가 이어짐
        { finish: 1.5 },
      ],
    },
  ],
}
