// 스토리 진행 순서 (이 순서대로만 장소를 열 수 있음)
// - id: buildings.js 의 장소 id
// - get: 이 장소 이야기를 끝내면 보관함에 들어오는 아이템
// - use: 이 장소 이야기를 끝내면 '사용함(전달 완료)' 으로 바뀌는 아이템
// - note: 아직 대화가 없는 장소에서 대신 보여줄 짧은 안내 (대화가 생기면 대화가 나옴)
export const STORY = [
  { id: 'insarye-hall', get: ['id-card'] },
  { id: 'student-hall', get: ['kimbap'] },
  { id: 'linton-park', get: ['id-goeun', 'id-sihyuk'], use: ['kimbap'] },
  { id: 'side-gate' },
  { id: 'memorial-56', note: '56주년 기념관 이야기는 곧 열려요.' },
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
  kimbap: {
    name: '참치김밥',
    img: 'talk/kimbap.webp',
    desc: '한남이의 선거운동을 도와주고 받은 참치김밥. 시유 선배에게 드려야겠다.',
    usedDesc: '린튼공원에서 김시유에게 무사히 전달했다.',
  },
}
