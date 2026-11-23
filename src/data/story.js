// 스토리 진행 순서 (이 순서대로만 장소를 열 수 있음)
// - id: buildings.js 의 장소 id
// - get: 이 장소 이야기를 끝내면 보관함에 들어오는 아이템
// - use: 이 장소 이야기를 끝내면 '사용함(전달 완료)' 으로 바뀌는 아이템
// - note: 아직 대화가 없는 장소에서 대신 보여줄 짧은 안내 (대화가 생기면 대화가 나옴)
export const STORY = [
  { id: 'insarye-hall', get: ['id-card'] },
  { id: 'student-hall', get: ['kimbap'] },
  { id: 'linton-park', get: ['id-goeun', 'id-sihyuk'] }, // 참치김밥은 시유에게 줬을 때만 '전달 완료'
  { id: 'side-gate', get: ['id-siblings'] },
  { id: 'memorial-56' },
]

// 보관함 아이템 (img 는 public/ 기준 경로)
export const ITEMS = {
  'id-card': {
    name: '김시유 학생증',
    img: 'talk/id-siyu-v2.png',
    desc: '김시유의 학생증이다.',
  },
  'id-goeun': {
    name: '이고등 학생증',
    img: 'talk/id-goeun.png',
    desc: '린튼공원에서 통성명하며 받은 이고등의 학생증.',
  },
  'id-sihyuk': {
    name: '턱시혁 학생증',
    img: 'talk/id-sihyuk.png',
    desc: '린튼공원에서 통성명하며 받은 턱시혁의 학생증.',
  },
  'id-siblings': {
    name: '4남매 학생증',
    img: 'talk/id-siblings.png',
    desc: '쪽문에서 만난 치주일 · 치주이 · 치주삼 · 치주사의 학생증. 메뉴 하나 정하는 데도 진심인 4남매.',
  },
  kimbap: {
    name: '참치김밥',
    img: 'talk/kimbap.webp',
    desc: '한남이의 선거운동을 도와주고 받은 참치김밥. 시유 선배에게 드려야겠다.',
    usedDesc: '린튼공원에서 김시유에게 무사히 전달했다.',
  },
}

// 호감도 기능 (보류 중: true 로 바꾸면 다시 켜짐)
export const LIKES_ON = false

// 호감도를 쌓을 수 있는 인물 (이름표에 쓰는 이름)
export const CHARACTERS = {
  siyu: '김시유',
  hannam: '한남이',
  hanami: '한나미',
  goeun: '이고등',
  sihyuk: '턱시혁',
  ju1: '치주일',
  ju2: '치주이',
  ju3: '치주삼',
  ju4: '치주사',
  jeon: '신전이',
}
