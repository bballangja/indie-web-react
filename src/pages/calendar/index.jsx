// ✅ src/pages/calendar/index.jsx
import React, { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import styled from 'styled-components';
import CalendarGrid from './components/CalendarGrid';
import DailyConcertList from './components/DailyConcertList';
import RegionSelectButton from '../venue/components/RegionSelectButton'
import RegionSelectSheet from '../venue/components/RegionSelectSheet';
import IconGo from '../../assets/icons/icon_go_hyunjin.svg';
import styles from './CalendarPage.module.css';
import Header from '../../components/layout/Header';
import Divider from '../../components/common/Divider';
import { useNavigate } from 'react-router-dom';
import { fetchMonthlyPerformanceDates, fetchPerformancesByDate } from '../../api/calendarApi';

function CalendarPage() {
  const navigate = useNavigate();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRegions, setSelectedRegions] = useState(['전체']);
  const [showRegionSheet, setShowRegionSheet] = useState(false);

  const [monthConcertDates, setMonthConcertDates] = useState([]);
  const [dailyConcerts, setDailyConcerts] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const listRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const handleDateClick = (date) => {
  setSelectedDate(date);
  const formatted = format(date, 'yyyy-MM-dd');
  loadDailyConcerts(formatted);
  
  // 공연이 있는 날짜만 달력 축소 (공연 데이터 로드 후 확인)
  fetchPerformancesByDate(formatted, selectedRegions.includes('전체') ? undefined : selectedRegions)
    .then(data => {
      if (data && data.length > 0) {
        setIsCollapsed(true);
      }
    });
};

  // 터치/마우스 시작
  const handleTouchStart = (e) => {
    startY.current = e.touches ? e.touches[0].clientY : e.clientY;
    isDragging.current = true;
  };

  // 터치/마우스 이동
  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    currentY.current = e.touches ? e.touches[0].clientY : e.clientY;
  };

  // 터치/마우스 종료
  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    
    const diff = currentY.current - startY.current;
    
    // 아래로 50px 이상 드래그하면 달력 펼치기 (스크롤 위치 무관)
    if (diff > 50) {
      setIsCollapsed(false);
    }
    // 위로 50px 이상 드래그하면 달력 접기 (스크롤 없을 때도 가능)
    else if (diff < -50) {
      setIsCollapsed(true);
    }
    
    isDragging.current = false;
  };

  // 리스트 스크롤 시작 시 달력 접기
  const handleListScroll = () => {
    if (!isCollapsed && listRef.current && listRef.current.scrollTop > 30) {
      setIsCollapsed(true);
    }
  };

  // 드래그 핸들 클릭으로 토글
  const handleDragHandleClick = () => {
    setIsCollapsed(!isCollapsed);
  };

  // ✅ 월별 공연 날짜 로드
  const loadMonthlyConcertDates = async (year, month, regionParam) => {
    try {
      const data = await fetchMonthlyPerformanceDates(year, month, regionParam);
      console.log('🎯 [캘린더] 월별 공연 날짜 응답:', data);
      setMonthConcertDates(data);
    } catch (err) {
      console.error('📛 월별 공연 날짜 API 호출 실패:', err);
      setMonthConcertDates([]);
    }
  };

  // ✅ 날짜별 공연 리스트 로드
  const loadDailyConcerts = async (date) => {
    try {
      const regionParam = selectedRegions.includes('전체') ? undefined : selectedRegions;
      const data = await fetchPerformancesByDate(date, regionParam);
      console.log(`🎯 [캘린더] ${date} 공연 리스트 응답:`, data);
      setDailyConcerts(data);
    } catch (err) {
      console.error('📛 날짜별 공연 리스트 API 호출 실패:', err);
      setDailyConcerts([]);
    }
  };

  // ✅ 월 변경 시 API 호출
  useEffect(() => {
    const year = format(currentMonth, 'yyyy');
    const month = format(currentMonth, 'MM');
    const regionParam = selectedRegions.includes('전체') ? undefined : selectedRegions;
    loadMonthlyConcertDates(year, month, regionParam);
  }, [currentMonth, selectedRegions]);

  // ✅ 초기 진입 시 오늘 공연 로딩
  useEffect(() => {
    const formatted = format(selectedDate, 'yyyy-MM-dd');
    loadDailyConcerts(formatted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 지역 변경 적용 (날짜 선택도 해제)
  const handleSelectRegion = (region) => {
    let newRegions;
    
    if (region === '전체') {
      newRegions = ['전체'];
    } else {
      const alreadySelected = selectedRegions.includes(region);
      let updated = alreadySelected
        ? selectedRegions.filter((r) => r !== region)
        : selectedRegions.filter((r) => r !== '전체').concat(region);
      if (updated.length === 0) updated = ['전체'];
      newRegions = updated;
    }
    
    setSelectedRegions(newRegions);
    
    // ✅ 날짜가 선택되어 있으면 즉시 해당 날짜 공연 다시 로드
    if (selectedDate) {
      const formatted = format(selectedDate, 'yyyy-MM-dd');
      const regionParam = newRegions.includes('전체') ? undefined : newRegions;
      
      // 즉시 API 호출
      fetchPerformancesByDate(formatted, regionParam)
        .then(data => {
          console.log(`🎯 [캘린더] ${formatted} 공연 리스트 응답:`, data);
          setDailyConcerts(data);
        })
        .catch(err => {
          console.error('📛 날짜별 공연 리스트 API 호출 실패:', err);
          setDailyConcerts([]);
        });
    }
  };

  // 날짜가 선택되어 있으면 해당 날짜 공연을 다시 로드
  const handleCloseSheet = () => {
    setShowRegionSheet(false);
  };

  return (
    <>
      <Header title="공연 캘린더" />
      <div style={{ height: "16px" }} />
      <div className={styles.calendarPage}>
        {/* 월 이동 UI */}
        <div className={styles.monthLine}>
          <img
            src={IconGo}
            alt="이전"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className={styles.leftIcon}
          />
          <h2 className={styles.monthTitle}>{format(currentMonth, 'M월')}</h2>
          <img
            src={IconGo}
            alt="다음"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className={styles.rightIcon}
          />
        </div>

        {/* 지역 필터 */}
        <div style={{ marginTop: '-12px' }} />
        <RegionButtonWrapper>
          <RegionSelectButton selectedRegions={selectedRegions} onClick={() => setShowRegionSheet(true)} />
        </RegionButtonWrapper>
        {showRegionSheet && (
          <RegionSelectSheet
            selectedRegions={selectedRegions}
            onSelectRegion={handleSelectRegion}
            onClose={handleCloseSheet}
          />
        )}

        {/* 달력 */}
        <CalendarGrid
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onDateClick={handleDateClick}
          concerts={monthConcertDates}
          isCollapsed={isCollapsed}
        />

        <DividerWrapper>
          <Divider />
        </DividerWrapper>

        <DragHandle
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onClick={handleDragHandleClick}
        >
          <DragBar />
        </DragHandle>

        {/* 날짜별 공연 리스트 */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {selectedDate && (
            <>
              <h3 className={styles.dailyTitle}>{format(selectedDate, 'M월 d일')} 공연</h3>
              <ScrollableList
                ref={listRef}
                onScroll={handleListScroll}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
              >
                <DailyConcertList concerts={dailyConcerts} />
              </ScrollableList>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default CalendarPage;

const RegionButtonWrapper = styled.div`
  button {
    margin-top: 0 !important;
  }
`;

const DividerWrapper = styled.div`
  margin-top: 16px;
`;

const DragHandle = styled.div`
  padding: 12px;
  display: flex;
  justify-content: center;
  cursor: grab;
  user-select: none;
  touch-action: none;
`;

const DragBar = styled.div`
  width: 40px;
  height: 4px;
  background-color: #E4E4E4;
  border-radius: 2px;
`;

const ScrollableList = styled.div`
  margin-bottom: 140px;
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;