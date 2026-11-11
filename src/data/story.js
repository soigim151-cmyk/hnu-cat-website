// 스토리 진행 순서 (이 순서대로만 장소를 열 수 있음)
// - id: buildings.js 의 장소 id
// - get: 이 장소 이야기를 끝내면 보관함에 들어오는 아이템
// - use: 이 장소 이야기를 끝내면 '사용함(전달 완료)' 으로 바뀌는 아이템
// - note: 아직 대화가 없는 장소에서 대신 보여줄 짧은 안내 (대화가 생기면 대화가 나옴)
export const STORY = [
  { id: 'insarye-hall', get: ['id-card'] },
  {
    id: 'student-hall',
    get: ['kimbap'],
    note: '학생회관에서 "김시유에게 전해 달라"는 부탁과 함께 참치김밥을 받았다.',
  },
  { id: 'linton-park', use: ['kimbap'] },
  { id: 'side-gate', note: '쪽문 이야기는 곧 열려요.' },
  { id: 'memorial-56', note: '56주년 기념관 이야기는 곧 열려요.' },
]

// 보관함 아이템 (img 는 public/ 기준 경로)
export const ITEMS = {
  'id-card': {
    name: '학생증',
    img: 'talk/id-siyu-v2.png',
    desc: '11번 건물 앞 벤치에서 받은 학생증. 이제 진짜 한남대 학생이다!',
  },
  kimbap: {
    name: '참치김밥',
    img: 'talk/kimbap.webp',
    desc: '김시유에게 전해 달라고 부탁받은 참치김밥.',
    usedDesc: '린튼공원에서 김시유에게 무사히 전달했다.',
  },
}
