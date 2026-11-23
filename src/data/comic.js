// 시작 만화: 「한남대 고양이가 학생이 되었다」 (미국 카툰 스타일, 움직이는 인터랙티브 만화)
// 그림이 아직 없어 지금 있는 사진 · 캐릭터 이미지에 만화 필터를 씌운 임시 컷
// 컷마다 그림을 새로 만들면 src 만 바꾸면 됨 (public/ 기준 경로)
//
// 페이지: layout = 컷 배치 (CSS grid-template-areas), panels = 컷 목록
// 컷: area(배치 이름) · src(배경) · tone(day / night / cctv / flash) · move(카메라 움직임)
//     layers(위에 겹치는 그림) · caption(노란 해설 상자) · sfx(효과 글자) · balloons(말풍선)
//     burst(번쩍이는 빛) · speed(집중선)
const P = (n) => `images/gallery/cat_${n}_l.webp`
const T = 'talk/'

export const COMIC = [
  // ── SCENE 01. 평화로운 캠퍼스 ──
  {
    bgm: 'map',
    layout: '"a a b" "a a c"',
    panels: [
      {
        area: 'a',
        src: P('14'),
        tone: 'day',
        move: 'pan-r',
        caption: { text: '평화로운 한남대학교 캠퍼스.', pos: 'tl' },
        layers: [
          { src: `${T}hall/npc1.webp`, style: { left: '2%', bottom: '-8%', height: '40%' }, cls: 'is-sil' },
          { src: `${T}hall/npc3.webp`, style: { left: '14%', bottom: '-10%', height: '44%' }, cls: 'is-sil' },
        ],
        sfx: [{ t: '터벅 터벅', x: 30, y: 62, rot: -8, size: 1, color: 'white' }],
      },
      {
        area: 'b',
        src: P('15'),
        tone: 'day',
        move: 'zoom-in',
        caption: { text: '고양이들은 벤치와 화단 사이에서…', pos: 'tl' },
      },
      {
        area: 'c',
        src: P('18'),
        tone: 'day',
        move: 'zoom-out',
        caption: { text: '…여유로운 하루를 보낸다.', pos: 'br' },
        sfx: [{ t: 'Zzz…', x: 70, y: 22, rot: 10, size: 1.1, color: 'blue' }],
      },
    ],
  },

  // ── 전설 ──
  {
    bgm: 'tense',
    layout: '"a"',
    panels: [
      {
        area: 'a',
        src: P('21'),
        tone: 'night',
        move: 'zoom-in-slow',
        moon: true,
        caption: { text: '한남대학교에는 오래전부터 전해 내려오는 전설이 있다.', pos: 'tl' },
        caption2: { text: '학교의 고양이들이 사람이 된다는 전설!', pos: 'br', big: true },
      },
    ],
  },

  // ── SCENE 02. 전설이 현실이 된 날 ──
  {
    bgm: 'tense',
    layout: '"a b" "c c"',
    panels: [
      {
        area: 'a',
        src: `${T}bg-insarye.webp`,
        tone: 'night',
        move: 'pan-l',
        caption: { text: '학생들이 모두 떠난 늦은 밤.', pos: 'tl' },
        sfx: [{ t: '스윽…', x: 70, y: 70, rot: -6, size: 0.9, color: 'white' }],
      },
      {
        area: 'b',
        src: P('22'),
        tone: 'night',
        move: 'shake',
        burst: true,
        speed: true,
        caption: { text: '정체불명의 빛이 나타났다!', pos: 'bl' },
        sfx: [{ t: 'FLASH!!', x: 52, y: 28, rot: -12, size: 1.8, color: 'yellow', sound: 'flash' }],
      },
      {
        area: 'c',
        src: P('01'),
        tone: 'flash',
        move: 'zoom-in',
        burst: true,
        speed: true,
        morph: { to: `${T}siyu-full.webp`, style: { left: '50%', bottom: '-30%', height: '150%' } },
        sfx: [{ t: 'BZZZZT!!', x: 18, y: 30, rot: 8, size: 1.6, color: 'yellow', sound: 'zap' }],
        balloons: [{ t: '이, 이게… 내 손?!', x: 76, y: 16, tail: 'bl', delay: 1.6 }],
      },
    ],
  },

  // ── SCENE 03. 학교에 비상이 걸리다 ──
  {
    bgm: 'tense',
    layout: '"a b" "c d"',
    panels: [
      {
        area: 'a',
        cctv: [P('14'), P('22'), P('15'), P('17')],
        tone: 'cctv',
        caption: { text: '이상 현상이 CCTV에 포착되었다.', pos: 'bl' },
        sfx: [{ t: '!!', x: 82, y: 22, rot: 10, size: 1.8, color: 'red', sound: 'alarm' }],
      },
      {
        area: 'b',
        src: `${T}m56/bg.webp`,
        tone: 'night',
        move: 'zoom-in',
        layers: [
          { src: `${T}hall/npc1.webp`, style: { left: '2%', bottom: '-20%', height: '82%' }, cls: 'is-sil' },
          { src: `${T}hall/npc2.webp`, style: { left: '36%', bottom: '-16%', height: '70%' }, cls: 'is-sil' },
          { src: `${T}hall/npc3.webp`, style: { right: '0%', bottom: '-20%', height: '82%' }, cls: 'is-sil' },
        ],
        caption: { text: '긴급회의 소집.', pos: 'tl' },
        balloons: [
          { t: '외부에 알려지면 큰일입니다!', x: 30, y: 26, tail: 'bl', delay: 0.4 },
          { t: '…방법은 하나뿐이군요.', x: 72, y: 50, tail: 'br', delay: 1.4 },
        ],
      },
      {
        area: 'c',
        doc: true,
        tone: 'plain',
        caption: { text: '사람이 된 고양이들에게 학생 신분을!', pos: 'tl' },
        sfx: [{ t: '쾅!', x: 72, y: 70, rot: -10, size: 1.7, color: 'red', sound: 'stamp', delay: 0.9 }],
      },
      {
        area: 'd',
        src: `${T}id-siblings.png`,
        fit: 'contain',
        tone: 'plain',
        move: 'pop',
        sparkle: true,
        caption: { text: '고양이들의 학생증 완성!', pos: 'br' },
      },
    ],
  },

  // ── SCENE 04. 고양이들의 강제 입학 ──
  {
    bgm: 'play',
    layout: '"a b c"',
    panels: [
      {
        area: 'a',
        src: `${T}bg-insarye.webp`,
        tone: 'day',
        move: 'zoom-in',
        layers: [
          { src: `${T}siyu-full.webp`, style: { left: '50%', bottom: '-55%', height: '150%', translate: '-50% 0' } },
          { src: `${T}id-siyu-v2.png`, style: { left: '18%', bottom: '8%', width: '64%', rotate: '-6deg' }, cls: 'is-card' },
        ],
        caption: { text: '하루아침에 대학생이 된 고양이들.', pos: 'tl' },
      },
      {
        area: 'b',
        src: `${T}bg-linton.webp`,
        tone: 'day',
        move: 'pan-r',
        layers: [{ src: `${T}gate/ju1.webp`, style: { left: '50%', bottom: '-18%', height: '96%', translate: '-50% 0' } }],
        caption: { text: '평범한 학생인 척, 첫 등교!', pos: 'tl' },
        balloons: [{ t: '(태연하게… 태연하게…)', x: 50, y: 14, tail: 'b', thought: true, delay: 0.6 }],
      },
      {
        area: 'c',
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
