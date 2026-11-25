// 시작 만화: 「한남대 고양이가 학생이 되었다」 (미국 카툰 스타일, 움직이는 인터랙티브 만화)
// 그림이 아직 없어 지금 있는 사진 · 캐릭터 이미지에 만화 필터를 씌운 임시 컷
// 컷마다 그림을 새로 만들면 src 만 바꾸면 됨 (public/ 기준 경로)
//
// (아래 PAGES 형식) 페이지: layout = 컷 배치 (CSS grid-template-areas), panels = 컷 목록
// 컷: area(배치 이름) · src(배경) · tone(day / night / cctv / flash) · move(카메라 움직임)
//     layers(위에 겹치는 그림) · caption(노란 해설 상자) · sfx(효과 글자) · balloons(말풍선)
//     burst(번쩍이는 빛) · speed(집중선)
const P = (n) => `images/gallery/cat_${n}_l.webp`
const T = 'talk/'

const PAGES = [
  // 입학 서류 · 학생증 (그림이 생기면 교체 — 지금은 임시 컷)
  {
    bgm: 'tense',
    layout: '"a b"',
    panels: [
      {
        area: 'a',
        doc: true,
        tone: 'plain',
        caption: { text: '사람이 된 고양이들에게 학생 신분을!', pos: 'tl' },
        sfx: [{ t: '쾅!', x: 72, y: 70, rot: -10, size: 1.7, color: 'red', sound: 'stamp', delay: 0.9 }],
      },
      {
        area: 'b',
        src: `${T}id-siblings.png`,
        fit: 'contain',
        tone: 'plain',
        move: 'pop',
        sparkle: true,
        caption: { text: '고양이들의 학생증 완성!', pos: 'br' },
      },
    ],
  },

  // ── SCENE 04-2. 습관은 숨길 수 없다 (비둘기, 임시 컷) ──
  {
    bgm: 'play',
    layout: '"a"',
    panels: [
      {
        area: 'a',
        src: P('16'),
        tone: 'day',
        move: 'shake',
        speed: true,
        layers: [{ src: `${T}gate/ju3.webp`, style: { left: '-8%', bottom: '-40%', height: '105%' } }],
        pigeon: true,
        caption: { text: '…하지만 습관은 숨길 수 없었다.', pos: 'tl' },
        sfx: [
          { t: '구구구', x: 76, y: 46, rot: 6, size: 0.8, color: 'white' },
          { t: '!!', x: 46, y: 22, rot: -10, size: 1.5, color: 'red', delay: 0.8 },
        ],
      },
    ],
  },

  // ── SCENE 05. 평범한 척하는 고양이들 ──
  {
    bgm: 'play',
    layout: '"a b c"',
    panels: [
      {
        area: 'a',
        src: `${T}bg-insarye.webp`,
        tone: 'day',
        move: 'zoom-in',
        sun: true,
        layers: [{ src: `${T}siyu/lying3.png`, style: { left: '-10%', bottom: '8%', width: '125%' } }],
        caption: { text: '햇볕 드는 벤치에서 낮잠.', pos: 'tl' },
        sfx: [{ t: 'Zzz…', x: 72, y: 34, rot: 10, size: 1.2, color: 'blue' }],
      },
      {
        area: 'b',
        src: `${T}hall/bg.webp`,
        tone: 'day',
        move: 'zoom-in',
        layers: [
          { src: `${T}gate/ju2.webp`, style: { left: '30%', bottom: '-30%', height: '95%', translate: '-50% 0' } },
          { src: `${T}kimbap.webp`, style: { right: '-4%', bottom: '6%', width: '50%', rotate: '12deg' }, cls: 'is-glow' },
        ],
        caption: { text: '편의점 간식 앞에서는 눈이 반짝.', pos: 'tl' },
        balloons: [{ t: '참치김밥…!!', x: 34, y: 30, tail: 'b', delay: 0.5 }],
      },
      {
        area: 'c',
        src: `${T}m56/bg.webp`,
        tone: 'day',
        move: 'zoom-in',
        layers: [{ src: `${T}goeun.webp`, style: { left: '50%', bottom: '-55%', height: '130%', translate: '-50% 0' } }],
        keyring: true,
        caption: { text: '수업 시간엔 흔들리는 키링에…', pos: 'tl' },
        sfx: [{ t: '흔들 흔들', x: 66, y: 72, rot: -6, size: 0.9, color: 'yellow' }],
      },
    ],
  },

  // ── SCENE 06. 비밀스러운 대학생활의 시작 ──
  {
    bgm: 'piano',
    layout: '"a" "b"',
    panels: [
      {
        area: 'a',
        src: `${T}m56/bg.webp`,
        tone: 'day',
        move: 'pan-l',
        layers: [
          { src: `${T}siyu-side.webp`, style: { left: '30%', bottom: '-40%', height: '150%' } },
          { src: P('22'), style: { right: '12%', bottom: '6%', height: '52%' }, cls: 'is-photo' },
        ],
        caption: { text: '캠퍼스를 걷던 고양이 학생이 길고양이와 마주친다.', pos: 'tl' },
        balloons: [
          { t: '……', x: 46, y: 26, tail: 'bl', delay: 0.6 },
          { t: '……', x: 84, y: 34, tail: 'br', delay: 1.4 },
        ],
      },
      {
        area: 'b',
        title: true,
        tone: 'plain',
        caption: { text: '그렇게, 아무도 모르는 고양이들의 비밀스러운 대학생활이 시작된다!', pos: 'bc' },
      },
    ],
  },
]

// ── 세로로 이어지는 만화 (웹툰처럼 화면을 꽉 채우고 자동으로 아래로) ──
// 블록 종류
//   img  : 그림 한 장 (w: 화면 대비 너비, aspect: 그림 비율). 위에 caption · sfx · balloons (위치는 그림 기준 %)
//   row  : 그림 여러 장을 가로로 나란히
//   text : 컷 사이 여백의 해설 (tone: dark = 검은 여백의 흰 글씨)
//   space: 여백 (h: 높이, bg: 색). 색이 바뀌는 여백으로 암전을 표현
//   page : 아직 그림이 없는 장면 (임시 컷, 화면 한 장 크기)
// 블록마다 자동으로 멈췄다 넘어감 (hold 초). 화면을 누르면 다음 블록으로 바로
const PAPER = '#f0e2cf' // 그림 여백과 같은 크림색 (테두리가 티 나지 않게)
const NIGHT = '#05070f'

// 시작 만화 켜기/끄기 (지금은 꺼 둠. true 로 바꾸면 다시 나옴)
export const COMIC_ON = false

export const STRIP = [
  // SCENE 01. 한남대학교에는 전설이 있다 / 02. 캠퍼스의 고양이들 — 원래 그림 비율 그대로, 화면에 맞춰 크게
  {
    type: 'img',
    src: `images/cartoon/web/s1.webp`,
    aspect: '1536 / 932',
    fit: true,
    bg: PAPER,
    // 그림에 있던 글을 지우고, 다른 컷과 같은 해설 상자로
    caption: {
      text: '한남대학교에는\n전설이 있다.',
      big: true,
      // 원래 그림 속 글 상자가 있던 자리 그대로
      style: { left: '3.1%', top: '8.2%', width: '24.1%', height: '15.8%', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'pre-line', textAlign: 'center' },
    },
    hold: 2.4,
  },
  { type: 'text', text: '학생들은 수업을 들으러, 고양이들은 저마다의 하루를 보내러.', bg: PAPER },
  {
    type: 'img',
    src: `images/cartoon/web/s2.webp`,
    aspect: '1600 / 845',
    fit: true,
    fitH: 76, // 위의 해설과 한 화면에 같이 보이게
    bg: PAPER,
    sfx: [{ t: '터벅 터벅', x: 70, y: 40, rot: -6, size: 0.9, sound: 'steps' }],
    hold: 2,
  },
  { type: 'space', h: 14, bg: `linear-gradient(${PAPER}, ${NIGHT})` },

  // 전설: 달밤을 따라 천천히 내려감 → 바닥의 고양이 → 암전
  {
    type: 'img',
    src: `images/cartoon/web/s3.webp`,
    aspect: '941 / 1672',
    w: 100,
    bg: NIGHT,
    pan: 8, // 화면보다 긴 그림: 위에서 아래까지 8초 동안
    lines: [{ text: '학교의 고양이들이, 사람이 된다는 전설.', at: 0.72, big: true }],
    floor: { src: `images/cartoon/web/s35.webp`, style: { left: '36%', bottom: '3%', width: '26%' } },
    hold: 1.6,
  },
  { type: 'space', h: 60, bg: NIGHT, beat: true, hold: 0.6 },

  // SCENE 02. 전설이 현실이 된 날 (검은 여백 위에 한 컷씩)
  { type: 'text', text: '모두가 잠든 늦은 밤.', tone: 'dark', bg: NIGHT },
  { type: 'img', src: `images/cartoon/web/s4a.webp`, aspect: '770 / 262', w: 100, bg: NIGHT, sfx: [{ t: '!?', x: 88, y: 26, rot: 10, size: 1.2 }] },
  { type: 'space', h: 3, bg: NIGHT },
  {
    type: 'img',
    src: `images/cartoon/web/s4b.webp`,
    aspect: '770 / 265',
    w: 100,
    bg: NIGHT,
    flash: true,
    sfx: [{ t: 'FLASH!!', x: 76, y: -4, rot: -8, size: 1.5, sound: 'flash', tone: 'light' }],
  },
  { type: 'space', h: 3, bg: NIGHT },
  { type: 'img', src: `images/cartoon/web/s4c.webp`, aspect: '770 / 303', w: 100, bg: NIGHT, shake: true, sfx: [{ t: 'BZZZZT!!', x: 74, y: 104, rot: 6, size: 1.4, sound: 'zap', tone: 'light' }] },
  { type: 'space', h: 6, bg: NIGHT },
  { type: 'text', text: '빛이 사라진 자리에는…', tone: 'dark', bg: NIGHT },
  {
    type: 'img',
    src: `images/cartoon/web/s4d.webp`,
    aspect: '770 / 233',
    w: 100,
    bg: NIGHT,
    balloons: [{ t: '이, 이게… 내 손?!', x: 84, y: 112, tail: 't', delay: 0.4 }],
  },
  { type: 'space', h: 16, bg: NIGHT },

  // SCENE 03. 학교에 비상이 걸리다: CCTV 화면 속에서 빠져나오며
  {
    type: 'img',
    src: `images/cartoon/web/s5a.webp`,
    aspect: '426 / 217',
    w: 86,
    align: 'start',
    bg: NIGHT,
    fromMonitor: { origin: '68% 28%', scale: 3.4, img: `images/cartoon/web/s4d.webp` },
    sfx: [{ t: 'REC ●', x: 96, y: 7, rot: 0, size: 0.6, sound: 'alarm', tone: 'red' }],
  },
  { type: 'text', text: '그날 밤의 일이 전부 학교 CCTV에 찍혀 버렸다!', tone: 'dark', bg: NIGHT, align: 'start', after: true },
  { type: 'space', h: 4, bg: NIGHT },
  { type: 'text', text: '다음 날 아침, 긴급회의.', tone: 'dark', bg: NIGHT, align: 'end' },
  {
    type: 'img',
    src: `images/cartoon/web/s5b.webp`,
    aspect: '461 / 215',
    w: 86,
    align: 'end',
    bg: NIGHT,
    balloons: [
      { t: '이 일이 밖으로 알려지면 큰일입니다!', x: 26, y: 22, tail: 'bl', delay: 0.2 },
      { t: '…방법은 하나뿐이군요.', x: 78, y: 30, tail: 'br', delay: 1.2 },
    ],
    hold: 2.2,
  },
  { type: 'space', h: 14, bg: `linear-gradient(${NIGHT}, ${PAPER})` },

  // 아직 그림이 없는 장면 (임시 컷)
  { type: 'page', page: PAGES[0], bg: PAPER }, // 입학 서류 · 학생증 (임시)

  // SCENE 04. 고양이들의 강제 입학: 학생증을 받고 등교 준비 (직접 그린 만화)
  { type: 'text', text: '하루아침에 대학생이 된 고양이들.', bg: PAPER, bgm: 'play' },
  { type: 'img', src: `images/cartoon/web/s6a.webp`, aspect: '738 / 482', w: 100, bg: PAPER, hold: 1.8 },
  { type: 'space', h: 3, bg: PAPER },
  {
    type: 'row',
    bg: PAPER,
    items: [
      { src: `images/cartoon/web/s6b.webp`, aspect: '738 / 482', grow: 1, sfx: [{ t: '척', x: 78, y: 22, rot: 8, size: 0.9 }] },
      { src: `images/cartoon/web/s6c.webp`, aspect: '734 / 482', grow: 1 },
    ],
    hold: 1.6,
  },
  { type: 'text', text: '어색한 옷을 입고, 가방을 메고. 평범한 학생인 척, 첫 등교!', bg: PAPER },
  { type: 'img', src: `images/cartoon/web/s6d.webp`, aspect: '738 / 480', w: 100, bg: PAPER, sfx: [{ t: '저벅', x: 82, y: 70, rot: -6, size: 1, sound: 'steps' }], hold: 1.8 },
  { type: 'space', h: 6, bg: PAPER },

  // 아직 그림이 없는 장면 (임시 컷)
  ...PAGES.slice(1).map((page) => ({ type: 'page', page, bg: PAPER })),
]

