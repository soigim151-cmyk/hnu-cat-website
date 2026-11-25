// 린튼공원 대화 — 「김시유를 찾습니다」
//
// 여러 인물이 함께 나오는 대화 (CastScene 이 재생)
// who: 'me' | 'goeun'(이고등) | 'sihyuk'(턱시혁) | 'siyu'(김시유)
//   이름이 공개되기 전에는 이름표에 '???' 로 나옴
// 연출 명령 (before: 클릭 후 대사 전 / after: 대사 끝난 뒤 자동)
//   W(초)                              정적
//   show(인물, 자세, {from, dur})        등장 (from: 'fade' | 'bottom' | 'left' | 'right' | 'back')
//   pose(인물, 자세, 초)                 자세·표정 교체
//   hide(인물, {to, dur})               퇴장 (to: 'left' | 'right' | 'fade')
//   move(인물, x, 초)                    옆으로 이동 (u 단위, + 오른쪽)
//   shake(인물)                          고개 절레절레
//   cam({ zoom, on, x, dur, wait })     카메라 확대·이동 (on: 인물 쪽으로, wait:false 면 기다리지 않음)
//   reveal(인물)                         이름 공개 (??? → 이름) + 알림음 + NEW CHARACTER 카드
//   photo('show' | 'hide' | 'face' | 'window')   조별 과제 사진 팝업 / 시유 얼굴 확대 / 창문 확대
//   msg([...]) / msgHide()              메신저 팝업
//   bag('peek' | 'hide' | 'give')       참치김밥 봉투 (살짝 보임 / 숨김 / 시유에게 건넴)
//   bg('walk', 초)                       배경 크로스페이드
//   sfx('ding' | 'comic' | 'steps' | 'stand' | 'rustle' | 'whoosh' | 'complete')
//   dark(초)                             화면이 어두워짐
//   complete({...})                     QUEST COMPLETE 카드 (누르면 지도로)
//
// 인물 이미지: public/talk/<인물>/<자세>.png 를 올리면 바로 적용 (없으면 임시 이미지)
const T = 'talk/'

const W = (s) => ({ wait: s })
const show = (who, pose, o = {}) => ({ show: who, pose, ...o })
const pose = (who, p, dur = 0.3) => ({ pose: who, p, dur })
const hide = (who, o = {}) => ({ hide: who, ...o })
const move = (who, x, dur = 0.6) => ({ move: who, x, dur })
const shake = (who) => ({ shake: who })
const cam = (o) => ({ cam: o })
const reveal = (who) => ({ reveal: who })
const photo = (mode, side) => ({ photo: mode, side }) // side: 'left' 면 왼쪽 위 (기본 오른쪽 위)
const msg = (list) => ({ msg: list })
const msgHide = () => ({ msgHide: true })
const bag = (mode) => ({ bag: mode })
const bg = (key, dur = 0.7) => ({ bg: key, dur })
const sfx = (name) => ({ sfx: name })
const dark = (dur) => ({ dark: dur })
const black = (dur) => ({ dark: dur, to: 1 }) // 완전 암전
const unblack = (dur) => ({ dark: dur, to: 0 }) // 암전 풀기

export const LINTON = {
  bgm: 'play',
  listSide: 'right', // 인물이 왼쪽에 있어서 정보 목록은 오른쪽
  summary: {
    name: '린튼공원',
    story: '시유 선배를 찾다가 커플 이고등 · 턱시혁의 조별 과제 사진 소동에 휘말렸고, 선배와 함께 빠져나와 참치김밥을 건넸다.',
    info: [
      '초대 총장인 윌리엄 린튼(한국명 인돈) 선교사를 기리기 위해 그분의 이름을 딴 공원이에요.',
      '바로 옆에 오정못과 울창한 수목, 벤치, 정자가 있어 학생들의 쉼터로 사랑받고 있어요.',
      '동아리, 취업박람회, 축제 프로그램 등 학생 행사가 많이 열려요.',
      '린튼공원과 오정못 사이의 작은 다리는 인돈 선교사의 부인 인사례(샬롯)의 이름을 붙여 「사례교」라고 해요.',
    ],
    use: ['kimbap'], // 건너뛰면 참치김밥은 전달한 것으로
    likes: { siyu: 2, goeun: 1 },
  },
  place: '린튼공원 입구',
  typeSpeed: 35,
  gap: 0.3,
  bgs: {
    // 멀리서 본 공원 (린튼공원2): 고등·시혁이 멀리 앉아 있음
    far: { src: `${T}bg-linton-far.webp` }, // 린튼공원2.png + 멀리 앉은 두 사람
    park: { src: `${T}bg-linton.webp` },
    // 시유를 따라 도망쳐 온 11번 건물 앞
    walk: { src: `${T}bg-insarye.webp` },
  },
  startBg: 'far',
  main: ['sihyuk', 'goeun'], // 시혁·고등 대사는 기본 방향, 시유와 플레이어 대사는 대화창 좌우 반전
  cast: {
    // 멀리서 본 두 사람 (고등시혁대화.png) — 대화하지 않는 원경에서만
    couple: { name: '', folder: `${T}couple/`, fallback: `${T}couple.webp`, x: -140.5, bottom: -10, w: 719 }, // 고등 + 새 시혁 (개별 이미지와 같은 자리)
    // 대화 중 개별 이미지 (턱시혁.png · 이고등.png)
    sihyuk: { name: '턱시혁', folder: `${T}sihyuk/`, ext: 'webp', fallback: `${T}sihyuk.webp`, x: -210, bottom: -10, w: 580 }, // 시혁정면1 · 시혁대화
    goeun: { name: '이고등', folder: `${T}goeun/`, fallback: `${T}goeun.webp`, x: 110, bottom: -10, w: 218 },
    // 대화 중 시유: 시유전신.png (화면 오른쪽, 다리 아래는 화면 밖). 포즈 이미지가 생기면 siyu/<포즈>.png
    siyu: { name: '김시유', known: true, folder: `${T}siyu/`, fallback: `${T}siyu-full.webp`, x: 534, bottom: -429, w: 530 },
    // 걸어가며 지나가는 시유 (시유옆모습.png) — left: 왼쪽을 보고 걸음(반전), right: 오른쪽으로 걸음
    siyuSide: { name: '김시유', known: true, folder: `${T}siyu-side/`, as: 'siyu', fallback: `${T}siyu-side.webp`, x: 534, bottom: -429, w: 533, flip: ['left'] },
  },
  photo: { src: `${T}photo-group.webp`, fallback: `${T}placeholder/photo.webp`, face: [0.589, 0.629], window: [0.844, 0.312] },
  bagImg: { src: `${T}kimbap.webp` }, // 참치김밥.png

  lines: [
    // ── SCENE 01. 김시유를 찾습니다 ──
    {
      who: 'me',
      text: '시유 선배님 드리려고 오긴 했는데….',
      // 공원 입구에서 벤치 쪽으로 아주 느리게 다가감 (기다리지 않음)
      before: [cam({ zoom: 1.04, x: 0, dur: 8, wait: false })],
      after: [bag('peek')],
    },
    { who: 'me', text: '이 근처에 자주 계신다고 했는데….', after: [cam({ zoom: 1.04, x: -60, dur: 1.6 })] },
    {
      who: 'me',
      text: '어, 저기 사람 있다. 혹시 아시려나?',
      // 멀리 앉은 두 사람 쪽으로 → 암전 → 터벅터벅 발소리 → 가까이 다가간 모습
      after: [
        cam({ zoom: 1.2, x: 200, dur: 1.4 }),
        W(0.3),
        black(0.7),
        sfx('trudge'),
        bg('park', 0),
        cam({ zoom: 1.09, x: -60, dur: 0 }),
        show('couple', 'far', { from: 'fade', dur: 0 }),
        W(2.4),
        unblack(0.9),
      ],
    },
    { who: 'me', text: '저기, 실례합니다.', after: [bag('hide')] },

    // ── SCENE 02. 잘못 걸린 질문 ──
    // 대화가 시작되면 원경 → 개별 이미지로
    {
      who: 'goeun',
      text: '네?',
      before: [
        hide('couple', { to: 'fade', dur: 0.35, wait: false }),
        show('sihyuk', 'lying', { from: 'fade', dur: 0.35, wait: false }),
        show('goeun', 'look', { from: 'fade', dur: 0.35 }),
      ],
    },
    {
      who: 'me',
      text: '혹시 김시유 선배님 아세요?',
      after: [pose('sihyuk', 'open'), cam({ zoom: 1.18, on: 'sihyuk', dur: 0.5 }), W(0.8)],
    },
    { who: 'sihyuk', text: '……김시유? 걔는 왜?' },
    { who: 'me', text: '참치김밥 전해드리려고요.', after: [cam({ zoom: 1.09, x: -60, dur: 0.4 }), pose('sihyuk', 'sit', 0.25), W(1)] },
    { who: 'sihyuk', text: '하. 걔는 김밥까지 배달받네.' },
    {
      who: 'goeun',
      text: '신경 쓰지 마세요. 시혁이가 시유랑 좀 안 맞아서요.',
      before: [pose('goeun', 'side')],
      after: [pose('goeun', 'press', 0.25), pose('sihyuk', 'lean', 0.3)],
    },

    // ── SCENE 03. 조별 과제 사건 ──
    { who: 'me', text: '두 분이 무슨 일 있으셨어요?' },
    // 조별 과제 사진 등장
    { who: 'goeun', text: '저번 학기에 시유랑 조별 과제를 같이 했는데, 그때 찍은 사진 때문에요.', after: [photo('show')] },
    { who: 'sihyuk', text: '둘이 너무 붙어서 찍었길래 지워달라고 했거든요.' },
    {
      who: 'me',
      text: '그랬더니요?',
      before: [photo('hide')],
      after: [
        msg([
          { from: 'me', text: '그 사진 좀 지워줄 수 있어?' },
          { from: 'other', text: '왜? 잘 나왔는데.' },
        ]),
      ],
    },
    { who: 'sihyuk', text: '"왜? 잘 나왔는데." 이러더라고요.', after: [pose('sihyuk', 'wronged'), cam({ zoom: 1.18, on: 'sihyuk', dur: 0.4 })] },
    { who: 'me', text: '아….', after: [msgHide(), cam({ zoom: 1.09, x: -60, dur: 0.4 })] },
    {
      who: 'sihyuk',
      text: '근데 다시 보니까 고등이 옆에 딱 붙어서, 혼자 카메라 보고 웃고 있더라고요.',
      after: [photo('show'), W(0.4), photo('face'), W(1.0), photo('hide')],
    },
    { who: 'goeun', text: '자기 얼굴 잘 나왔다는 거였잖아. 너 혼자 오해한 거고.' },
    { who: 'sihyuk', text: '오해하게 말한 걔 잘못이지.', before: [pose('sihyuk', 'angry')], after: [shake('goeun'), pose('sihyuk', 'arms', 0.3)] },

    // ── SCENE 04. 통성명 ──
    {
      who: 'goeun',
      text: '아, 이름도 안 물어봤네요. 저는 이고등이에요.',
      before: [pose('goeun', 'look')],
      after: [reveal('goeun'), { reward: `${T}id-goeun.png`, label: '이고등 학생증 획득!' }, { like: 'goeun' }],
    },
    { who: 'sihyuk', text: '턱시혁.', after: [reveal('sihyuk'), { reward: `${T}id-sihyuk.png`, label: '턱시혁 학생증 획득!' }] },
    {
      who: 'goeun',
      text: '저희는 공강마다 여기 있어요. 린튼공원은 벤치도 많고 바로 옆에 오정못도 있어서, 쉬기엔 학교에서 여기가 최고거든요.',
      // 고등이 옆에 린튼공원 정보가 하나씩
      after: [
        {
          list: {
            title: '린튼공원',
            items: [
              '초대 총장 윌리엄 린튼(한국명 인돈) 선교사를 기리는 공원',
              '오정못 · 울창한 나무 · 벤치 · 정자가 있는 학생들의 쉼터',
              '동아리 행사 · 취업박람회 · 축제가 열리는 곳',
              '오정못의 작은 다리 「사례교」 — 인돈 선교사의 부인 인사례(샬롯)의 이름',
            ],
            gap: 0.7,
          },
        },
      ],
    },
    { who: 'me', text: '두 분 사이좋아 보이세요.', before: [{ list: null }] },
    { who: 'goeun', text: '얘가 나 따라다니는 거지, 뭐.', after: [pose('goeun', 'lean'), move('goeun', 25, 0.5), pose('sihyuk', 'look'), pose('goeun', 'smile')] },

    // ── SCENE 05. 하필 지금? ──
    {
      who: 'me',
      text: '어? 잠깐만요.',
      // 시유가 화면 뒤편에서 천천히 걸어옴 (우연히 지나가는 중)
      before: [cam({ zoom: 1.0, x: 30, dur: 1.0, wait: false }), show('siyuSide', 'left', { from: 'far', dur: 2.4 })],
    },
    {
      who: 'me',
      text: '저기 시유 선배님 아니에요?',
      // 걸음을 멈추고 이쪽을 봄: 옆모습 → 대화 이미지로 바뀜
      after: [show('siyu', 'look', { from: 'fade', dur: 0.4, wait: false }), hide('siyuSide', { dur: 0.4 })],
    },
    { who: 'siyu', text: '어, 안녕! 여기서 또 보네.' },
    { who: 'me', text: '선배님! 한참 찾았어요.' },
    {
      who: 'siyu',
      text: '나를? 무슨 일인데?',
      after: [pose('sihyuk', 'stand', 0.2), cam({ zoom: 1.12, on: 'sihyuk', dur: 0.4 })],
    },
    { who: 'sihyuk', text: '야, 김시유.', before: [{ bgm: 'volume', vol: 0.004, dur: 1.2 }], after: [pose('siyu', 'stop'), cam({ zoom: 1.0, x: 30, dur: 0.4 }), W(0.7), { bgm: 'tense', dur: 4 }] },
    { who: 'siyu', text: '아… 시혁이구나. 안녕.' },
    { who: 'sihyuk', text: '그때 그 사진, 왜 안 지웠어?' },
    { who: 'siyu', text: '그거 조별 과제 자료라서 지우기가 좀 그랬어. 미안.' },
    { who: 'sihyuk', text: '너랑 고등이가 너무 붙어 있었잖아!' },
    { who: 'siyu', text: '사진 찍을 땐 다 붙어 있었는데…. 그럼 다음엔 너도 같이 찍을래?', after: [W(1.5), pose('sihyuk', 'stunned')] },

    // ── SCENE 06. 사진 속의 진실 ──
    { who: 'sihyuk', text: '야, 그런 얘기가 아니라….', before: [pose('sihyuk', 'angry')] },
    { who: 'siyu', text: '아, 근데 그 사진에 너도 나왔던데?' },
    { who: 'sihyuk', text: '……뭐?' },
    { who: 'siyu', text: '뒤에 창문 봐봐.', after: [photo('show', 'left')] }, // 시유가 오른쪽에 있어서 사진은 왼쪽
    {
      who: 'siyu',
      text: '창문 밖에서 우리 몰래 보고 있었잖아. 다 찍혔어.',
      after: [photo('window'), sfx('comic'), pose('sihyuk', 'flustered', 0.2)],
    },
    { who: 'goeun', text: '너 그때 몰래 보고 있었어?', before: [pose('goeun', 'look')] },
    { who: 'sihyuk', text: '아니, 그냥… 너 기다리다가….' },
    { who: 'goeun', text: '나 기다리면서 창문으로 훔쳐본 거야? 귀엽네.', after: [pose('goeun', 'smile'), pose('sihyuk', 'flustered')] },
    { who: 'siyu', text: '둘이 사이좋네. 다행이다.', after: [photo('hide')] },
    {
      who: 'sihyuk',
      text: '야, 김시유! 아직 얘기 안 끝났어!',
      before: [pose('sihyuk', 'angry')],
      after: [move('sihyuk', 110, 0.4)],
    },
    { who: 'goeun', text: '시혁아, 그만 좀 해.' },

    // ── SCENE 07. 린튼공원 탈출 ──
    { who: 'siyu', text: '…우리 그냥 가자. 얘기 길어질 것 같아.', before: [pose('siyu', 'turn')] },
    { who: 'me', text: '네? 지금요?' },
    {
      who: 'siyu',
      text: '응, 얼른!',
      after: [
        sfx('steps'),
        // 옆모습으로 바꿔 왼쪽으로 뛰어감
        hide('siyu', { dur: 0.12, wait: false }),
        show('siyuSide', 'left', { from: 'fade', dur: 0.12 }),
        hide('siyuSide', { to: 'left', dur: 0.5, wait: false }),
        cam({ zoom: 1.06, x: 120, dur: 0.6 }), // 시유를 따라 왼쪽으로 확 이동
        sfx('whoosh'),
        // 바로 따라 나가 11번 건물 앞으로
        hide('sihyuk', { dur: 0.3, wait: false }),
        hide('goeun', { dur: 0.3, wait: false }),
        bg('walk', 0.7),
        { bgm: 'play', dur: 1.5 },
      ],
    },

    // ── SCENE 08. 11번 건물 앞 ──
    {
      who: 'me',
      text: '하…. 이제 안 쫓아오시겠죠?',
      before: [cam({ zoom: 1.0, x: 0, dur: 0 }), sfx('steps'), show('siyu', 'stand', { from: 'fade', dur: 0.5 }), pose('siyu', 'back')],
    },
    { who: 'siyu', text: '응, 아마도. 시혁이는 고등이 두고 멀리 안 가거든.', before: [pose('siyu', 'stand')] },
    { who: 'me', text: '시혁 씨가 선배님을 엄청 싫어하시는 것 같던데요.' },
    { who: 'siyu', text: '음…. 날 싫어한다기보다는 고등이를 엄청 좋아하는 거지, 뭐.', after: [bag('peek'), pose('siyu', 'down')] },
    {
      who: 'siyu',
      text: '근데 나 찾았다며. 무슨 일이야?',
      // 참치김밥을 줄지 말지 선택
      choices: [
        { text: '참치김밥을 건넨다', goto: 'give' },
        { text: '그냥 인사만 한다', goto: 'keep' },
      ],
    },

    // 참치김밥을 준다 → 시유가 맛집 잘 아는 4남매를 소개
    {
      label: 'give',
      who: 'me',
      text: '이거 드리려고요. 학생회관에서 받았는데, 저는 참치김밥을 안 좋아해서요.',
      after: [sfx('give'), bag('give'), pose('siyu', 'receive', 0.3), { like: 'siyu', n: 2 }],
    },
    { who: 'siyu', text: '와, 참치김밥! 나 이거 진짜 좋아하는데.' },
    { who: 'me', text: '아까 좋아하신다고 하셨던 게 기억나서요.' },
    { who: 'siyu', text: '기억해 줬구나. 고마워, 잘 먹을게.', after: [pose('siyu', 'eat', 0.3), W(0.8)] },
    { who: 'siyu', text: '받기만 하면 미안하니까, 나도 하나 알려줄게.', before: [pose('siyu', 'stand')] },
    { who: 'siyu', text: '쪽문 쪽에 맨날 넷이 붙어 다니는 4남매가 있거든.' },
    { who: 'siyu', text: '그 근처 밥집은 걔네가 제일 잘 알아. 뭐 먹을지 고민되면 물어봐.' },
    { who: 'me', text: '4남매요? 감사합니다, 선배님!' },
    { who: 'siyu', text: '응. 다음엔 11번 건물 쪽으로 와. 린튼공원 가면 시혁이 있으니까.', after: [pose('siyu', 'eat', 0.3)] },
    {
      who: 'me',
      text: '네, 맛있게 드세요!',
      after: [
        W(0.4),
        // 옆모습으로 바꿔 오른쪽으로 걸어감
        hide('siyu', { dur: 0.2, wait: false }),
        show('siyuSide', 'right', { from: 'fade', dur: 0.2 }),
        hide('siyuSide', { to: 'right', dur: 1.1 }),
        { complete: { sub: '시유 선배님께 참치김밥을 전해 드렸다.', items: ['id-goeun', 'id-sihyuk'], use: ['kimbap'] } },
      ],
    },

    // 주지 않는다
    {
      label: 'keep',
      who: 'me',
      text: '아, 그냥 인사드리고 싶어서요.',
      after: [bag('hide')],
    },
    { who: 'siyu', text: '그래? 덕분에 나도 빠져나왔으니까 됐다. 고마워.', before: [pose('siyu', 'stand')] },
    { who: 'siyu', text: '다음엔 11번 건물 쪽으로 와. 린튼공원 가면 시혁이 있으니까.' },
    {
      who: 'me',
      text: '네, 들어가세요!',
      after: [
        W(0.4),
        hide('siyu', { dur: 0.2, wait: false }),
        show('siyuSide', 'right', { from: 'fade', dur: 0.2 }),
        hide('siyuSide', { to: 'right', dur: 1.1 }),
        { complete: { sub: '시유 선배님과 함께 린튼공원을 빠져나왔다.', items: ['id-goeun', 'id-sihyuk'] } },
      ],
    },
  ],
}

// 인물별 자세 이미지 목록 (public/talk/<인물>/<자세>.png)
export const LINTON_POSES = {
  goeun: {
    lean: '턱시혁에게 기대어 앉음, 무표정',
    look: '고개를 들어 나를 봄',
    side: '턱시혁을 옆눈으로 봄',
    press: '턱시혁 어깨를 가볍게 누름',
    smile: '작게 웃음',
    pat: '옆자리를 손으로 두드림',
  },
  sihyuk: {
    lying: '눈 감고 편하게 누움',
    open: '누운 채 눈 뜸',
    sit: '상체를 일으켜 앉음',
    lean: '벤치에 기대앉음',
    shut: '입을 다문 표정',
    look: '이고등을 바라봄',
    flustered: '당황한 표정',
    wronged: '억울한 표정',
    angry: '화난 표정',
    arms: '팔짱 끼고 시선 돌림',
    stand: '벌떡 일어선 모습',
    stunned: '말문이 막힌 표정',
    slump: '어깨가 축 처짐',
  },
  siyuSide: {
    left: '왼쪽으로 걷는 옆모습 (반전)',
    right: '오른쪽으로 걷는 옆모습',
  },
  siyu: {
    look: '나를 보며 멈춤',
    stop: '턱시혁을 보고 멈춤',
    blank: '무표정',
    turn: '나 쪽으로 몸을 돌림',
    back: '걸음을 멈추고 뒤돌아봄',
    stand: '서 있음',
    down: '봉투를 내려다봄',
    receive: '김밥을 받는 자세',
    eat: '김밥을 먹음',
  },
}
