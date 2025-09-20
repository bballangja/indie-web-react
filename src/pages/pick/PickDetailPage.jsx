// ✅ src/pages/pick/PickDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import styles from './pickDetail.module.css';

// ✅ 매거진 API 연결
import { fetchMagazineDetail } from '../../api/magazineApi';

// ───────────────────────────────────────────────────────────────
// [FAKE] 홈에서 넘어온 state가 없을 때를 대비한 폴백 데이터
//  - 추후 API 붙이면 이 부분 삭제하고 id로 fetch하면 됨.
// ───────────────────────────────────────────────────────────────
const FAKE_PICK_BY_ID = {
  '1': {
    id: 1,
    title: 'Wow, Rich한 자신감으로 돌아온 aespa의 [Rich Man]',
    author: '김삼문관리자',
    createdAt: '2025-09-10T14:36:00+09:00',
    imageUrl: 'https://image.inews24.com/v1/dd35d151442f69.jpg',
    content: [
      'aespa가 거침없는 에너지와 ‘싹 맏’ 밴드 사운드를 담은 미니 6집 [Rich Man]으로 돌아왔어요! 다들 들어보셨나요? 😊',
      '타이틀곡은 ‘Rich Man’. 멤버의 단단하고 톡톡 튀는 톤에서 느껴지는 자신감이 인상적이고, 후렴 처음 등장할 때는 터치 트레몰로를 활용한 딜레이 사운드 같은 느낌이 있었습니다.',
      '…',
      '그래서 제가 가져온 이번 주의 추천 공연 첫 번째는요… 바로 이번주 금요일, 언클잭드 홍대에서 열리는 공연입니다.',
      '권진아밴드, 델마늘, 시오.\n여름밤에 핏덩어리로 오신다면, 어쿠스틱만 봐도 저는 벌써부터 가슴이 뛰어요. 저는 마지막 사운지 ‘신의 무지갯샘’을 편답니다. 사운지 보컬은 ‘주식’인데…',
      '이번 주의 추천 공연,\n마음 속에서 곡과 곡 사이를 연결해 함께 바라요! 인디붐온다!'
    ].join('\n\n'),
  },
};

const PickDetailPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { state } = useLocation();
  const { id } = useParams();

  // ✅ API에서 가져온 실제 데이터
  const [pick, setPick] = useState(
    state ?? FAKE_PICK_BY_ID[String(id)] ?? {
      id,
      title: '제목이 없습니다',
      author: '김삼문관리자',
      createdAt: new Date().toISOString(),
      imageUrl: '',
      content: '내용이 없습니다.',
    }
  );

  useEffect(() => {
    // state가 없으면 id로 서버에서 재조회
    if (!state && id) {
      (async () => {
        try {
          const data = await fetchMagazineDetail(id);
          setPick({
            id: data.id,
            title: data.title ?? '',
            author: data.author ?? '관리자',
            createdAt: data.createdAt ?? data.created_at ?? '',
            imageUrl:
              data.coverImageUrl ??
              data.cover_image_url ??
              data.image_url ??
              '',
            // 블록 데이터를 단순 텍스트로 합쳐 임시 렌더 (블록 렌더는 추후 확장)
            content: Array.isArray(data.blocks)
              ? data.blocks
                  .map((b) => {
                    if (b.type === 'text') return b.text;
                    if (b.type === 'quote') return `“${b.text}”`;
                    // image/embed/divider는 여기서는 단순히 무시하거나 필요 시 처리
                    return '';
                  })
                  .filter(Boolean)
                  .join('\n\n')
              : data.content ?? '',
          });
        } catch (err) {
          console.error('📛 매거진 상세 조회 실패:', err);
        }
      })();
    }
  }, [id, state]);

  const formatKST = (d) => {
    try {
      const date = typeof d === 'string' ? new Date(d) : d;
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '';
    }
  };

  return (
    <>
      <Header title="김삼문 pick !" onMenuClick={() => setIsSidebarOpen(true)} />
      {isSidebarOpen && <Sidebar onClose={() => setIsSidebarOpen(false)} />}

      <main className={styles.page}>
        {/* 제목 */}
        <h1 className={styles.title}>{pick.title}</h1>

        {/* 메타 + 구분선 */}
        <div className={styles.meta}>
          {formatKST(pick.createdAt)} {pick.author}
        </div>
        <div className={styles.hr} />

        {/* 본문 (이미지 + 텍스트) */}
        {pick.imageUrl ? (
          <img className={styles.hero} src={pick.imageUrl} alt={pick.title} />
        ) : null}

        <article className={styles.content}>
          {String(pick.content)
            .split('\n')
            .map((para, i) =>
              para.trim() ? (
                <p key={i}>{para}</p>
              ) : (
                <div key={i} className={styles.spacer} />
              )
            )}
        </article>
      </main>
    </>
  );
};

export default PickDetailPage;
