// src/app/sky/travelingSprits/oldestSprits/page.js
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const BASE_URL = "https://korea-sky-planner.com";

export default function OldestSpiritsPage() {
  const [spirits, setSpirits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const router = useRouter();
  
  // 무한 스크롤을 위한 ref
  const observer = useRef();
  const lastSpiritElementRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreSpirits();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);

  // 초기 데이터 가져오기
  const fetchInitialSpirits = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/v1/souls/oldest-spirits?page=0&size=20`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const pageData = data.data;
      
      setSpirits(pageData.content || []);
      setTotalElements(pageData.totalElements || 0);
      setHasMore(!pageData.last);
      setPage(0);
    } catch (err) {
      setError(err.message);
      setSpirits([]);
    } finally {
      setLoading(false);
    }
  };

  // 추가 데이터 로드 (무한 스크롤)
  const loadMoreSpirits = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(`${BASE_URL}/api/v1/souls/oldest-spirits?page=${nextPage}&size=20`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const pageData = data.data;
      
      setSpirits(prev => [...prev, ...(pageData.content || [])]);
      setHasMore(!pageData.last);
      setPage(nextPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchInitialSpirits();
  }, []);

  // 날짜 포맷팅
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // 기간 포맷팅 (며칠 전) - 더 강조된 버전
  const formatDaysSince = (days) => {
    if (days === 0) return "🔥 현재 진행중";
    if (days === 1) return "어제 떠남";
    if (days < 7) return `${days}일째`;
    if (days < 30) return `${days}일째`;
    if (days < 90) return `${Math.floor(days / 7)}주째`;
    if (days < 365) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return remainingDays > 7 ? 
        `${months}개월 ${Math.floor(remainingDays / 7)}주째` : 
        `${months}개월째`;
    } else {
      const years = Math.floor(days / 365);
      const remainingMonths = Math.floor((days % 365) / 30);
      if (remainingMonths > 0) {
        return `${years}년 ${remainingMonths}개월째`;
      } else {
        return `${years}년째`;
      }
    }
  };

  // 상태별 스타일 클래스 결정
  const getStatusClass = (days, isActive) => {
    if (isActive) return styles.statusActive;
    if (days < 30) return styles.statusRecent;
    if (days < 180) return styles.statusModerate;
    if (days < 365) return styles.statusOld;
    return styles.statusVeryOld;
  };

  // 시즌 색상 매핑
  const seasonColors = {
    "감사": "#FFD700",
    "빛추": "#FF6347", 
    "친밀": "#4CAF50",
    "리듬": "#3F51B5",
    "마법": "#9C27B0",
    "낙원": "#FF5722",
    "예언": "#9E9E9E",
    "꿈": "#00BCD4",
    "협력": "#8BC34A",
    "어린왕자": "#FFC107",
    "비행": "#03A9F4",
    "심해": "#2196F3",
    "공연": "#FF4081",
    "파편": "#607D8B",
    "오로라": "#673AB7",
    "기억": "#009688",
    "성장": "#8BC34A",
    "순간": "#FF9800",
    "재생": "#3F51B5",
    "사슴": "#A1887F",
    "보금자리": "#795548",
    "듀엣": "#FFEB3B",
    "무민": "#CDDC39",
    "광채": "#FF1493",
    "파랑새": "#1E90FF",
    "불씨": "#FF4500",
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>오류: {error}</div>
        <button onClick={fetchInitialSpirits} className={styles.retryButton}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🕰️ 오래된 영혼들</h1>
        <p className={styles.subtitle}>
          가장 오랫동안 만나지 못한 영혼들을 순서대로 정리하였습니다.
        </p>
        <div className={styles.navigation}>
          <button 
            onClick={() => router.push("/sky/travelingSprits/generalVisits/list")}
            className={styles.navButton}
          >
            전체 유랑 목록
          </button>
        </div>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{totalElements}</span>
          <span className={styles.statLabel}>등록된 영혼</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>
            {spirits.filter(s => s.daysSinceLastVisit > 730).length}
          </span>
          <span className={styles.statLabel}>2년 이상</span>
        </div>
      </div>

      <div className={styles.spiritsList}>
        {spirits.map((item, index) => {
          const { soul, daysSinceLastVisit, lastVisitDate, isActive } = item;
          const representativeImage = soul.images?.find(
            img => img.imageType === "REPRESENTATIVE"
          );
          
          const isLast = index === spirits.length - 1;

          // 동일한 daysSinceLastVisit 값에 대해 같은 순위 부여
          let rank = 1;
          if (index === 0) {
            rank = 1;
          } else {
            // 이전 항목들을 확인하여 같은 daysSinceLastVisit를 가진 가장 첫 인덱스 찾기
            let sameRankStartIndex = index;
            for (let i = index - 1; i >= 0; i--) {
              if (spirits[i].daysSinceLastVisit === daysSinceLastVisit) {
                sameRankStartIndex = i;
              } else {
                break;
              }
            }
            rank = sameRankStartIndex + 1;
          }

          return (
            <Link
              key={`${soul.id}-${soul.name}`}
              href={`/sky/travelingSprits/generalVisits/${soul.id}`}
              className={styles.spiritCard}
              ref={isLast ? lastSpiritElementRef : null}
            >
              <div className={styles.rankBadge}>#{rank}</div>
              
              <div className={styles.imageSection}>
                {representativeImage?.url ? (
                  <img
                    src={representativeImage.url}
                    alt={soul.name}
                    className={styles.spiritImage}
                  />
                ) : (
                  <div className={styles.noImage}>이미지 없음</div>
                )}
              </div>

              <div className={styles.infoSection}>
                <div className={styles.nameRow}>
                  <span 
                    className={styles.seasonBadge}
                    style={{ 
                      backgroundColor: seasonColors[soul.seasonName] || "#888" 
                    }}
                  >
                    {soul.seasonName}
                  </span>
                  <h3 className={styles.spiritName}>{soul.name}</h3>
                </div>

                <div className={styles.detailsRow}>
                  <span className={styles.orderNumber}>
                    {soul.orderNum < 0 ? `#${Math.abs(soul.orderNum)} 유랑단` : `${soul.orderNum}번째`}
                  </span>
                  <span className={styles.rerunCount}>
                    {soul.rerunCount}차 복각
                  </span>
                </div>

                <div className={styles.dateInfo}>
                  <span>마지막 방문: {formatDate(lastVisitDate)}</span>
                  <span>({formatDate(soul.startDate)} ~ {formatDate(soul.endDate)})</span>
                </div>
              </div>

              <div className={styles.statusSection}>
                <div className={`${styles.statusBadge} ${getStatusClass(daysSinceLastVisit, isActive)}`}>
                  {formatDaysSince(daysSinceLastVisit)}
                </div>
                <div className={styles.daysCount}>
                  {!isActive && (
                    <>
                      <strong>{daysSinceLastVisit.toLocaleString()}</strong>일
                      {daysSinceLastVisit > 1000 && " 💔"}
                      {daysSinceLastVisit > 500 && daysSinceLastVisit <= 1000 && " 😢"}
                      {daysSinceLastVisit > 100 && daysSinceLastVisit <= 500 && " 🥺"}
                    </>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 로딩 더 보기 표시 */}
      {loadingMore && (
        <div className={styles.loadingMore}>
          <div className={styles.spinner}></div>
          <span>더 많은 영혼들을 불러오는 중...</span>
        </div>
      )}

      {/* 더 이상 불러올 데이터가 없을 때 */}
      {!hasMore && spirits.length > 0 && (
        <div className={styles.endMessage}>
          모든 영혼을 다 보았습니다. 총 {spirits.length}개의 영혼이 있습니다.
        </div>
      )}

      {spirits.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <h3>영혼 데이터가 없습니다</h3>
          <p>아직 등록된 영혼이 없거나 데이터를 불러오지 못했습니다.</p>
        </div>
      )}
    </div>
  );
}