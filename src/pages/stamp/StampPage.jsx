// src/pages/stamp/StampPage.jsx
import styled from "styled-components";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/layout/Header";
import StampLogin from "../../components/stamp/StampLogin";
import { fetchUserInfo } from "../../api/userApi";
import PeriodModal from "../../components/modals/PeriodModal";
import StampButtonIcon from "../../assets/icons/icon_s_stamp.svg";
import FilterButtonNone from "../../components/common/FilterButtonNone";
import StampPopup from "../../components/stamp/StampPopup";
import StampPopupSmall from "../../components/stamp/StampPopupSmall";
import StampPopupSmall2 from "../../components/stamp/StampPopupSmall2";
import StampDetailPopup from "../../components/stamp/StampDetailPopup";

import {
  fetchCollectedStamps,
  fetchAvailableStamps,
  collectStamp,
  fetchStampDetail,
} from "../../api/stampApi";

export default function StampPage() {

  const navigate = useNavigate();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState(currentYear);
  const [endYear, setEndYear] = useState(currentYear);
  const [startMonth, setStartMonth] = useState(1);
  const [endMonth, setEndMonth] = useState(12);

  const [isStampPopupOpen, setIsStampPopupOpen] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState(null);

  const [isConfirmPopupOpen, setIsConfirmPopupOpen] = useState(false);
  const [selectedStampDetail, setSelectedStampDetail] = useState(null);
  const [isStampSmall2Open, setIsStampSmall2Open] = useState(false);

  // ✅ API 연결 관련 상태
  const [collectedStamps, setCollectedStamps] = useState([]);
  const [availableStamps, setAvailableStamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await fetchUserInfo();
        if (!mounted) return;
        setIsLoggedIn(!!me?.id);
      } catch {
        if (!mounted) return;
        setIsLoggedIn(false);
      }
    })();
    // 다른 탭/화면에서 로그인 상태가 바뀐 경우 대비
    const sync = async () => {
      try {
        const me = await fetchUserInfo();
        setIsLoggedIn(!!me?.id);
      } catch {
        setIsLoggedIn(false);
      }
    };
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    return () => { mounted = false; window.removeEventListener("focus", sync); window.removeEventListener("storage", sync); };
  }, []);

  // ✅ 수집한 스탬프 목록 로드
  useEffect(() => {
     if (!isLoggedIn) return;  
    const loadCollectedStamps = async () => {
      try {
        setLoading(true);
        const stamps = await fetchCollectedStamps(startMonth, endMonth);
        setCollectedStamps(stamps);
      } catch (e) {
        console.error("📛 수집한 스탬프 로딩 실패:", e);
        if (e?.response?.status === 401) { // 토큰 만료 등
          setIsLoggedIn(false);
          return;
        }
        setError("스탬프를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadCollectedStamps();
  }, [isLoggedIn, startMonth, endMonth, startYear, endYear]); 

  // ✅ 사용 가능한 스탬프 목록 로드 (팝업 열렸을 때)
  useEffect(() => {
    if (!isLoggedIn || !isStampPopupOpen) return;

    (async () => {
      try {
        const list = await fetchAvailableStamps({ days: 30 });
        console.log("🎯 available stamps:", list);
        setAvailableStamps(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("❌ available 오류", e?.response?.data || e.message);
        if (e?.response?.status === 401) {
          setIsLoggedIn(false);
          return;
        }
        setAvailableStamps([]);
      }
    })();
  }, [isLoggedIn, isStampPopupOpen]);

  // ✅ 스탬프 수집 처리
  const handleStampCollect = async (stampData) => {
    
      if (!isLoggedIn) return;
      try {
      await collectStamp(stampData.id);
      // 성공 후 수집한 스탬프 목록 새로고침
      const updatedStamps = await fetchCollectedStamps(startMonth, endMonth);
      setCollectedStamps(updatedStamps);

      setIsConfirmPopupOpen(false);
      setIsStampPopupOpen(false);
      setSelectedStamp(null);
    } catch (e) {
      if (e?.response?.status === 401) { setIsLoggedIn(false); return; }
      console.error("📛 스탬프 수집 실패:", e);
      alert("스탬프 수집에 실패했습니다.");
    }
  };

  return (
    <PageWrapper>
      <Header title="스탬프" />
      <div style={{ height: "16px" }} />

       <main className="app-scroll">

      <FilterBar>
        <FilterGroup>
          <FilterButtonNone onClick={() => setIsPeriodModalOpen(true)}>
            기간 설정
          </FilterButtonNone>
        </FilterGroup>
      </FilterBar>

      {/* ✅ 메인 스탬프판 */}
      <StampBoard>
        <ScrollArea>
          <StampPageContainer>
            {collectedStamps
              .slice()
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((stamp) => (
                <StampItem
                  key={stamp.id}
                  onClick={() => setSelectedStampDetail(stamp)}
                >
                  <StampImage src={stamp.venueImageUrl} alt={stamp.place} />
                  <StampDate>{stamp.date}</StampDate>
                </StampItem>
              ))}
          </StampPageContainer>
        </ScrollArea>
      </StampBoard>

      {/* ✅ 하단 버튼 */}
      <StampButton onClick={() => setIsStampPopupOpen(true)}>
        <img src={StampButtonIcon} alt="스탬프 찍기" />
      </StampButton>

      {/* ✅ 스탬프 팝업 */}
      {isStampPopupOpen && (
        <StampPopup
          onClose={() => setIsStampPopupOpen(false)}
          stamps={availableStamps}
          onStampSelect={(stamp) => {
            if (stamp.is_collected) {
              setIsStampSmall2Open(true);
            } else {
              setSelectedStamp(stamp);
              setIsConfirmPopupOpen(true);
            }
          }}
        />
      )}

      {/* ✅ 수집 확인 팝업 */}
      {isConfirmPopupOpen && (
        <StampPopupSmall
          onConfirm={() => handleStampCollect(selectedStamp)}
          onCancel={() => setIsConfirmPopupOpen(false)}
        />
      )}

      {/* ✅ 이미 수집된 스탬프 팝업 */}
      {isStampSmall2Open && (
        <StampPopupSmall2 onClose={() => setIsStampSmall2Open(false)} />
      )}

      {/* ✅ 스탬프 상세 팝업 */}
      {selectedStampDetail && (
        <StampDetailPopup
          concert={selectedStampDetail}
          onClose={() => setSelectedStampDetail(null)}
          onPosterClick={(pid) => {
             if (!pid) return;
             setSelectedStampDetail(null);         // 팝업 닫고
             navigate(`/performance/${pid}`);      // 상세로 이동
   }}
        />
      )}

      {/* ✅ 기간 설정 모달 */}
      {isPeriodModalOpen && (
        <PeriodModal
          startYear={startYear}
          startMonth={startMonth}
          endYear={endYear}
          endMonth={endMonth}
          onChange={({ startYear, startMonth, endYear, endMonth }) => {
            setStartYear(startYear);
            setStartMonth(startMonth);
            setEndYear(endYear);
            setEndMonth(endMonth);
          }}
          onClose={() => setIsPeriodModalOpen(false)}
        />
      )}
      {!isLoggedIn && <StampLogin />}
      </main>
    </PageWrapper>
  );
}

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PageWrapper = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  height: 100dvh; 
  position: fixed;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.bgWhite};
  overflow: hidden;   
`;

const StampButton = styled.button`
  position: fixed; 
  background: none;
  border: none;
  cursor: pointer;
  right: 0px;
  bottom: 100px;

  img {
    width: 72px;
    height: 72px;
    display: block;
  }

  @media (min-width: ${({ theme }) => theme.layout.maxWidth}) {
    right: calc((100vw - ${({ theme }) => theme.layout.maxWidth}) / 2);
  }
`;

const StampBoard = styled.div`
  position: absolute;
  top: 78.5px;
  bottom: 108px;
  left: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
`;

const StampPageContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  row-gap: 24px;
  width: 100%;
  box-sizing: border-box;
  justify-items: center; 
`;

const StampItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  &:nth-child(3n + 1) {
    justify-self: start;
  }
  &:nth-child(3n + 2) {
    justify-self: center;
  }
  &:nth-child(3n + 3) {
    justify-self: end;
  }
`;

const StampImage = styled.img`
  width: 20vw;
  max-width: 100px;
  height: 20vw;
  max-height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.6px solid ${({ theme }) => theme.colors.outlineGray};
`;

const StampDate = styled.div`
  margin-top: 12px;
  margin-bottom: 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.stampGray};
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;

  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;