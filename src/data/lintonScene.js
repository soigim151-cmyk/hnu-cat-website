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
    couple: { name: '', folder: `${T}couple/`, fallback: `${T}couple.webp`, x: -40, bottom: 5, w: 810 },
    // 대화 중 개별 이미지 (턱시혁.png · 이고등.png)
    sihyuk: { name: '턱시혁', folder: `${T}sihyuk/`, fallback: `${T}sihyuk.webp`, x: -160, bottom: -10, w: 288 },
    goeun: { name: '이고등', folder: `${T}goeun/`, fallback: `${T}goeun.webp`, x: 110, bottom: -10, w: 218 },
    // 대화 중 시유: 시유전신.png (화면 오른쪽, 다리 아래는 화면 밖). 포즈 이미지가 생기면 siyu/<포즈>.png
    siyu: { name: '김시유', known: true, folder: `${T}siyu/`, fallback: `${T}siyu-full.webp`, x: 534, bottom: -429, w: 530 },
    // 걸어가며 지나가는 시유 (시유옆모습.png) — left: 왼쪽을 보고 걸음(반전), right: 오른쪽으로 걸음
    siyuSide: { name: '김시유', known: true, folder: `${T}siyu-side/`, as: 'siyu', fallback: `${T}siyu-side.webp`, x: 534, bottom: -429, w: 533, flip: ['left'] },
  },
  photo: { src: `${T}photo-group.webp`, fallback: `${T}placeholder/photo.webp`, face: [0.567, 0.7], window: [0.89, 0.33] },
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
    { who: 'me', text: '정작 어디 계신지를 모르네.', after: [W(0.5)] },
    { who: 'me', text: '이 근처에 자주 있다고 했는데….', after: [cam({ zoom: 1.04, x: -60, dur: 1.6 })] },
    {
      who: 'me',
      text: '어, 저기 사람 있다.',
      // 멀리 앉아 있는 두 사람 쪽으로 시선이 감
      after: [cam({ zoom: 1.2, x: 200, dur: 1.4 })],
    },
    {
      who: 'me',
      text: '혹시 시유 선배님 어디 계신지 아시려나?',
      // 암전 → 터벅터벅 발소리 → 가까이 다가간 모습
      after: [
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
      text: '혹시 김시유라는 학생 아세요?',
      after: [pose('sihyuk', 'open'), cam({ zoom: 1.18, on: 'sihyuk', dur: 0.5 }), W(0.8)],
    },
    { who: 'sihyuk', text: '……누구?' },
    { who: 'me', text: '김시유요.' },
    { who: 'sihyuk', text: '걔는 왜?' },
    { who: 'me', text: '전해줄 게 있어서요.' },
    { who: 'sihyuk', text: '뭔데?' },
    { who: 'me', text: '참치김밥이요.', after: [cam({ zoom: 1.09, x: -60, dur: 0.4 }), sfx('stand'), pose('sihyuk', 'sit', 0.25), W(1)] },
    { who: 'sihyuk', text: '걔는 좋겠다. 김밥도 갖다주고.' },
    { who: 'goeun', text: '왜 또 그래.' },
    { who: 'me', text: '아, 제가 받은 건데 저는 참치김밥을 안 좋아해서요.' },
    { who: 'sihyuk', text: '근데 왜 하필 걔한테?' },
    { who: 'me', text: '아까 시유 선배님이 참치김밥 좋아한다고 하셨던 게 기억나서요.' },
    { who: 'sihyuk', text: '하. 걔 진짜 뭐 있나?', after: [pose('goeun', 'side')] },
    { who: 'goeun', text: '그냥 김밥 받는 거잖아.' },
    { who: 'sihyuk', text: '그러니까 왜 하필 걔냐고.', after: [pose('goeun', 'press', 0.25), pose('sihyuk', 'lean', 0.3)] },
    { who: 'goeun', text: '신경 쓰지 마세요. 원래 좀 예민해요.' },
    { who: 'sihyuk', text: '나 안 예민하거든?' },
    { who: 'goeun', text: '지금도 예민하잖아.', after: [pose('sihyuk', 'shut'), pose('goeun', 'lean')] },

    // ── SCENE 03. 조별 과제 사건 ──
    { who: 'me', text: '혹시 시유 선배님이랑 무슨 일 있으셨어요?' },
    { who: 'sihyuk', text: '있었죠. 아주 어이없는 일이.' },
    { who: 'goeun', text: '별일 아니에요.' },
    { who: 'sihyuk', text: '네가 당사자니까 그렇지.' },
    { who: 'goeun', text: '나도 당사자거든?' },
    { who: 'me', text: '무슨 일이었는데요?' },
    // 사진 등장 (창문 속 턱시혁은 이때 강조하지 않음)
    { who: 'goeun', text: '저번 학기에 시유랑 같은 교양 수업을 들었어요. 조별 과제도 같이 했고요.', after: [photo('show')] },
    { who: 'sihyuk', text: '그때부터 이상했어.' },
    { who: 'me', text: '뭐가요?' },
    { who: 'sihyuk', text: '발표 전날 둘이 밤늦게까지 학교에 남아 있더라고.' },
    { who: 'goeun', text: 'PPT가 안 끝났으니까.' },
    { who: 'sihyuk', text: '그래서 내가 데리러 갔잖아.' },
    { who: 'goeun', text: '응. 고마웠어.', after: [pose('sihyuk', 'look'), W(0.8)] },
    { who: 'sihyuk', text: '……뭐?' },
    { who: 'goeun', text: '고마웠다고.' },
    { who: 'sihyuk', text: '아, 어.', after: [pose('sihyuk', 'flustered'), pose('goeun', 'lean')] },
    { who: 'me', text: '그래서 무슨 일이 있었어요?', before: [photo('hide')] },
    { who: 'goeun', text: '발표 끝나고 단체 채팅방에 사진을 올렸거든요.' },
    { who: 'me', text: '네.' },
    { who: 'sihyuk', text: '근데 둘이 너무 붙어서 찍은 거야.' },
    { who: 'goeun', text: '그거 그냥 발표 준비 사진이잖아.' },
    { who: 'sihyuk', text: '그래서 내가 지워달라고 했지.' },
    { who: 'me', text: '시유 선배님한테요?' },
    { who: 'sihyuk', text: '네. 근데 걔가 뭐라고 했는지 알아요?' },
    {
      who: 'me',
      text: '뭐라고 했는데요?',
      after: [
        msg([
          { from: 'me', text: '그 사진 좀 지워줄 수 있어?' },
          { from: 'other', text: '왜? 잘 나왔는데.' },
        ]),
      ],
    },
    { who: 'sihyuk', text: '"왜? 잘 나왔는데."', after: [pose('sihyuk', 'wronged'), cam({ zoom: 1.18, on: 'sihyuk', dur: 0.4 })] },
    { who: 'me', text: '아….', after: [msgHide(), cam({ zoom: 1.09, x: -60, dur: 0.4 })] },
    { who: 'sihyuk', text: '그래서 내가 사진을 다시 봤거든?' },
    { who: 'me', text: '네.' },
    {
      who: 'sihyuk',
      text: '근데 걔 혼자 카메라 정면 보고 웃고 있더라.',
      after: [photo('show'), W(0.4), photo('face'), W(1.0), photo('hide')],
    },
    { who: 'goeun', text: '자기 얼굴 잘 나왔다고 한 거잖아.' },
    { who: 'sihyuk', text: '아니, 그걸 왜 그렇게 말하냐고!', before: [pose('sihyuk', 'angry')] },
    { who: 'me', text: '…….' },
    { who: 'goeun', text: '너 혼자 오해한 거잖아.' },
    { who: 'sihyuk', text: '오해하게 말한 걔 잘못이지.', after: [shake('goeun'), pose('sihyuk', 'arms', 0.3)] },

    // ── SCENE 04. 통성명 ──
    { who: 'goeun', text: '아, 그러고 보니 이름도 안 물어봤네요.', before: [pose('goeun', 'look')] },
    { who: 'me', text: '아, 저는 이 학교 학생이에요.' },
    { who: 'goeun', text: '저는 이고등이에요.', after: [reveal('goeun'), { reward: `${T}id-goeun.png`, label: '이고등 학생증 획득!' }] },
    { who: 'me', text: '반갑습니다.' },
    { who: 'sihyuk', text: '턱시혁.', after: [reveal('sihyuk'), { reward: `${T}id-sihyuk.png`, label: '턱시혁 학생증 획득!' }] },
    { who: 'me', text: '네, 반갑습니다.' },
    { who: 'goeun', text: '저희는 거의 맨날 여기 있어요.' },
    { who: 'me', text: '두 분이 커플이신 거죠?' },
    { who: 'sihyuk', text: '보면 몰라?' },
    { who: 'goeun', text: '말 좀 예쁘게 해.' },
    { who: 'sihyuk', text: '아니, 딱 보면 알잖아.' },
    { who: 'me', text: '아, 네. 엄청 붙어 계셔서….' },
    { who: 'goeun', text: '얘가 자꾸 따라다녀서요.' },
    { who: 'sihyuk', text: '네가 먼저 따라왔잖아.' },
    { who: 'goeun', text: '그건 어제고.' },
    { who: 'sihyuk', text: '오늘도 네가 먼저 여기 오자고 했거든?' },
    { who: 'goeun', text: '그랬나?' },
    { who: 'sihyuk', text: '어.' },
    { who: 'goeun', text: '그럼 둘 다 좋아서 온 걸로 하자.', after: [pose('goeun', 'lean'), move('goeun', 25, 0.5), pose('sihyuk', 'look')] },
    { who: 'sihyuk', text: '……그래.' },
    { who: 'me', text: '두 분 되게 사이좋으시네요.' },
    { who: 'goeun', text: '그럭저럭요.' },
    { who: 'sihyuk', text: '그럭저럭?' },
    { who: 'goeun', text: '왜, 불만 있어?' },
    { who: 'sihyuk', text: '아니….', after: [pose('goeun', 'smile'), pose('sihyuk', 'lean')] },

    // ── SCENE 05. 하필 지금? ──
    {
      who: 'me',
      text: '어? 잠깐만요.',
      // 시유가 화면 뒤편에서 천천히 걸어옴 (우연히 지나가는 중)
      before: [cam({ zoom: 1.0, x: 30, dur: 1.0, wait: false }), show('siyuSide', 'left', { from: 'back', dur: 1.4 })],
    },
    {
      who: 'me',
      text: '저기 시유 선배님 아니에요?',
      // 걸음을 멈추고 이쪽을 봄: 옆모습 → 대화 이미지로 바뀜
      after: [show('siyu', 'look', { from: 'fade', dur: 0.4, wait: false }), hide('siyuSide', { dur: 0.4 })],
    },
    { who: 'siyu', text: '어. 안녕.' },
    { who: 'me', text: '시유 선배님! 한참 찾았어요.' },
    {
      who: 'siyu',
      text: '나를 왜?',
      after: [sfx('stand'), pose('sihyuk', 'stand', 0.2), cam({ zoom: 1.12, on: 'sihyuk', dur: 0.4 })],
    },
    { who: 'sihyuk', text: '야, 김시유.', after: [pose('siyu', 'stop'), cam({ zoom: 1.0, x: 30, dur: 0.4 }), W(0.7)] },
    { who: 'siyu', text: '…….' },
    { who: 'siyu', text: '아.' },
    { who: 'sihyuk', text: '아?' },
    { who: 'siyu', text: '또 너네.' },
    { who: 'sihyuk', text: '너 나한테 할 말 없냐?' },
    { who: 'siyu', text: '없는데.' },
    { who: 'sihyuk', text: '너 그때 사진 기억하지?' },
    { who: 'siyu', text: '무슨 사진?' },
    { who: 'sihyuk', text: '고등이랑 찍은 사진!' },
    { who: 'siyu', text: '아, 그거.' },
    { who: 'sihyuk', text: '왜 안 지웠어?' },
    { who: 'siyu', text: '조별 과제 자료인데 왜 지워?' },
    { who: 'sihyuk', text: '내가 지워달라고 했잖아!' },
    { who: 'siyu', text: '너 우리 조 아니었잖아.' },
    { who: 'sihyuk', text: '……', after: [W(1.2), pose('goeun', 'smile')] },
    { who: 'sihyuk', text: '그게 무슨 상관인데?' },
    { who: 'siyu', text: '상관없으면 왜 지우래?' },
    { who: 'sihyuk', text: '아니, 너랑 고등이가 너무 붙어서 찍혔다고!' },
    { who: 'siyu', text: '사진 찍는데 떨어져 있으면 이상하잖아.' },
    { who: 'sihyuk', text: '적당히 떨어질 수 있잖아!' },
    { who: 'siyu', text: '그럼 다음엔 네가 가운데 서.' },
    { who: 'sihyuk', text: '내가 왜 남의 조별 과제 사진에 들어가!' },
    { who: 'siyu', text: '그러게. 왜 자꾸 끼어들어?', after: [W(1.5), pose('sihyuk', 'stunned')] },

    // ── SCENE 06. 사진 속의 진실 ──
    { who: 'sihyuk', text: '야, 너 진짜….', before: [pose('sihyuk', 'angry')] },
    { who: 'siyu', text: '아, 그리고.' },
    { who: 'sihyuk', text: '뭐!' },
    { who: 'siyu', text: '그 사진 너도 있잖아.' },
    { who: 'sihyuk', text: '……뭐?' },
    { who: 'siyu', text: '뒤에.', after: [photo('show', 'left')] }, // 시유가 오른쪽에 있어서 사진은 왼쪽
    { who: 'sihyuk', text: '무슨 소리야?' },
    {
      who: 'siyu',
      text: '창문에 비쳐서 나왔어. 네가 우리 찍고 있더라.',
      after: [photo('window'), sfx('comic'), pose('sihyuk', 'flustered', 0.2)],
    },
    { who: 'goeun', text: '너 그때 사진 찍었어?', before: [pose('goeun', 'look')] },
    { who: 'sihyuk', text: '아니, 그냥….' },
    { who: 'goeun', text: '뭐가 그냥이야?' },
    { who: 'sihyuk', text: '너 기다리다가….' },
    { who: 'siyu', text: '근데 왜 나를 찍어?' },
    { who: 'sihyuk', text: '너 찍은 거 아니거든?!' },
    { who: 'siyu', text: '그럼 나한테 보내지 마.', after: [W(1)] },
    { who: 'me', text: '…….' },
    { who: 'goeun', text: '나 기다리면서 사진까지 찍었어?' },
    { who: 'sihyuk', text: '아니, 그게 아니라….' },
    { who: 'goeun', text: '귀엽네.', after: [pose('goeun', 'smile'), pose('sihyuk', 'flustered')] },
    { who: 'sihyuk', text: '야, 지금 그 얘기가 아니잖아!' },
    { who: 'goeun', text: '왜. 난 좋은데.' },
    { who: 'siyu', text: '쟤네 또 시작이네.', after: [photo('hide')] },

    // ── SCENE 07. 끝나지 않는 말싸움 ──
    { who: 'sihyuk', text: '야, 김시유. 아직 안 끝났어.', before: [pose('sihyuk', 'angry')] },
    { who: 'siyu', text: '뭐가 또 남았는데?' },
    { who: 'sihyuk', text: '너 고등이한테 왜 자꾸 말 걸어?' },
    { who: 'siyu', text: '같은 수업이니까.' },
    { who: 'sihyuk', text: '수업 끝나고도 말 걸었잖아!' },
    { who: 'siyu', text: '과제 제출했냐고 물어봤지.' },
    { who: 'sihyuk', text: '그걸 왜 개인적으로 물어봐?' },
    { who: 'siyu', text: '단톡방에 물어봤는데.', after: [W(0.5), pose('siyu', 'blank')] },
    { who: 'siyu', text: '너도 읽었잖아.' },
    { who: 'sihyuk', text: '그건 진행 상황 확인한 거거든?' },
    { who: 'siyu', text: '너 우리 조도 아니었잖아.', after: [cam({ zoom: 1.18, on: 'sihyuk', dur: 0.4 }), W(1.2)] },
    { who: 'sihyuk', text: '너 진짜 말하는 거 봐라.', before: [cam({ zoom: 1.0, x: 30, dur: 0.4 })] },
    { who: 'siyu', text: '틀린 말은 아니잖아.' },
    { who: 'sihyuk', text: '야, 너 일로 와 봐.' },
    { who: 'siyu', text: '싫은데.' },
    { who: 'sihyuk', text: '아, 진짜!', after: [move('sihyuk', 110, 0.4)] },
    { who: 'goeun', text: '시혁아, 그만 좀 해.' },
    { who: 'sihyuk', text: '잠깐만. 쟤랑 얘기 좀 하고.' },
    { who: 'goeun', text: '아까부터 계속 그 얘기잖아.' },
    { who: 'siyu', text: '그러니까. 나 이제 가도 되냐?' },
    { who: 'sihyuk', text: '누가 가래?' },
    { who: 'siyu', text: '그럼 너희끼리 얘기해.' },

    // ── SCENE 08. 린튼공원 탈출 ──
    { who: 'siyu', text: '야, 가자.', before: [pose('siyu', 'turn')] },
    { who: 'me', text: '네? 지금요?' },
    { who: 'siyu', text: '응. 쟤랑 있으면 끝이 없어.' },
    {
      who: 'me',
      text: '아, 네!',
      after: [
        sfx('steps'),
        // 옆모습으로 바꿔 왼쪽으로 뛰어감
        hide('siyu', { dur: 0.12, wait: false }),
        show('siyuSide', 'left', { from: 'fade', dur: 0.12 }),
        hide('siyuSide', { to: 'left', dur: 0.5, wait: false }),
        cam({ zoom: 1.06, x: 120, dur: 0.6 }), // 시유를 따라 왼쪽으로 확 이동
        sfx('whoosh'),
        cam({ zoom: 1.0, x: 0, dur: 0.35 }), // 뒤를 돌아보는 시점
      ],
    },
    { who: 'sihyuk', text: '야! 김시유!' },
    { who: 'siyu', text: '간다!' },
    { who: 'sihyuk', text: '누가 보내준대? 거기 서!', after: [move('sihyuk', -60, 0.35), pose('sihyuk', 'look'), cam({ zoom: 1.08, x: 0, dur: 0.5 }), W(1)] },
    { who: 'goeun', text: '뭐 해? 안 쫓아가?' },
    { who: 'sihyuk', text: '……잠깐만.' },
    { who: 'goeun', text: '가. 잡고 싶다며.' },
    { who: 'sihyuk', text: '아니, 너 혼자 있잖아.' },
    { who: 'goeun', text: '나 혼자 잘 있는데?' },
    { who: 'sihyuk', text: '그래도….' },
    { who: 'goeun', text: '그럼 같이 가?' },
    { who: 'sihyuk', text: '아니, 됐어.', after: [pose('sihyuk', 'slump', 0.4)] },
    { who: 'sihyuk', text: '하, 놓쳤네.' },
    { who: 'goeun', text: '네가 안 간 거잖아.' },
    { who: 'sihyuk', text: '너 두고 어떻게 가.' },
    { who: 'goeun', text: '누가 보면 내가 붙잡은 줄 알겠다.' },
    { who: 'sihyuk', text: '…….', after: [pose('goeun', 'pat')] },
    { who: 'goeun', text: '됐고, 앉아.' },
    { who: 'sihyuk', text: '아, 진짜 다음엔 안 봐준다.' },
    {
      who: 'goeun',
      text: '응. 다음에 잡아.',
      // 다시 나란히 앉음 → 원경(두 사람 이미지)으로 바꾸고 카메라가 멀어짐
      after: [
        move('sihyuk', -50, 0.4),
        hide('sihyuk', { to: 'fade', dur: 0.4, wait: false }),
        hide('goeun', { to: 'fade', dur: 0.4, wait: false }),
        show('couple', 'far', { from: 'fade', dur: 0.4 }),
        cam({ zoom: 1.0, x: 0, dur: 2.2 }),
      ],
    },
    { who: 'sihyuk', text: '근데 쟤 진짜 짜증 나지 않냐?' },
    { who: 'goeun', text: '응. 이제 조용히 해.' },
    {
      who: 'sihyuk',
      text: '…….',
      after: [hide('couple', { to: 'fade', dur: 0.7, wait: false }), bg('walk', 0.7)],
    },

    // ── SCENE 09. 참치김밥 전달 완료 (11번 건물 앞) ──
    {
      who: 'me',
      text: '하…. 이제 안 쫓아오시겠죠?',
      before: [cam({ zoom: 1.0, x: 0, dur: 0 }), sfx('steps'), show('siyu', 'stand', { from: 'fade', dur: 0.5 }), pose('siyu', 'back')],
    },
    { who: 'siyu', text: '응. 걔 멀리 못 와.', before: [pose('siyu', 'stand')] },
    { who: 'me', text: '어떻게 아세요?' },
    { who: 'siyu', text: '고등이 두고 안 움직이거든.' },
    { who: 'me', text: '아, 그래서 아까도….' },
    { who: 'siyu', text: '맨날 저래.' },
    { who: 'me', text: '시혁 씨는 시유 선배님을 진짜 싫어하시는 것 같아요.' },
    { who: 'siyu', text: '그런가?' },
    { who: 'me', text: '네. 엄청 화내시던데요.' },
    { who: 'siyu', text: '난 쟤한테 관심 없는데.', after: [bag('peek'), pose('siyu', 'down')] },
    { who: 'siyu', text: '근데 나한테 전해줄 게 뭐야?' },
    { who: 'me', text: '아, 맞다. 이거요!' },
    {
      who: 'me',
      text: '학생회관에서 받은 건데, 저는 참치김밥을 안 좋아해서요.',
      after: [sfx('rustle'), bag('give'), pose('siyu', 'receive', 0.3)],
    },
    { who: 'siyu', text: '오, 참치김밥.' },
    { who: 'me', text: '아까 좋아하신다고 하셨던 게 기억나서 가져왔어요.' },
    { who: 'siyu', text: '어. 이거 좋아해.', after: [pose('siyu', 'eat', 0.3), W(0.8)] },
    { who: 'siyu', text: '맛있네.' },
    { who: 'me', text: '다행이에요. 그럼 저는 가볼게요.' },
    { who: 'siyu', text: '어. 고생했어.' },
    { who: 'siyu', text: '아, 잠깐.', before: [pose('siyu', 'stand')] },
    { who: 'me', text: '네?' },
    { who: 'siyu', text: '다음엔 그냥 여기로 와.' },
    { who: 'me', text: '왜요?' },
    { who: 'siyu', text: '린튼공원 가면 쟤 있잖아.' },
    { who: 'me', text: '아….', after: [pose('siyu', 'eat', 0.3)] },
    {
      who: 'siyu',
      text: '김밥 하나 먹기 힘드네.',
      after: [
        W(0.4),
        // 옆모습으로 바꿔 오른쪽으로 걸어감
        hide('siyu', { dur: 0.2, wait: false }),
        show('siyuSide', 'right', { from: 'fade', dur: 0.2 }),
        hide('siyuSide', { to: 'right', dur: 1.1 }),
        dark(0.8),
        sfx('complete'),
        { complete: { title: 'QUEST COMPLETE!', sub: '참치김밥 전달 완료', foot: 'HNU CAT MAP · LINTON PARK' } },
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
