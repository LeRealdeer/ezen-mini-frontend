// src/app/sky/travelingSprits/generalVisits/[id]/page.js
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import styles from "./detail.module.css";
import { getSeasonColor } from "../../../../constants/seasons.js";

export default function SoulDetailPage() {
  const [showCopied, setShowCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMoreWearingShots, setShowMoreWearingShots] = useState(false);
  const [soul, setSoul] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const { id } = useParams();
  const router = useRouter();

  const viewMode = searchParams.get("mode") || "card";
  const query = searchParams.get("query") || "";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch(`https://korea-sky-planner.com/api/v1/souls/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("영혼 상세 정보를 가져오는데 실패하였습니다.");
        return res.json();
      })
      .then((data) => {
        setSoul(data.data || data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!soul) return <div className={styles.error}>영혼 정보가 없습니다.</div>;

  // 이미지 분류
  const representativeImage = soul.images?.find((img) => img.imageType === "REPRESENTATIVE")?.url;
  const nodeTableImage = soul.images?.find((img) => img.imageType === "NODE_TABLE")?.url;
  const wearingShotImages = soul.images?.filter((img) => img.imageType === "WEARING_SHOT").map((img) => img.url);
  const locationImage = soul.images?.find((img) => img.imageType === "LOCATION")?.url;

  // 목록 URL(해시 포함: 방금 보던 영혼으로 복귀)
  const listParams = new URLSearchParams();
  listParams.set("mode", viewMode);
  if (query) listParams.set("query", query);
  const listUrl = `/sky/travelingSprits/generalVisits/list${
    listParams.toString() ? "?" + listParams.toString() : ""
  }#soul-${id}`;

  const handleEdit = () => router.push(`/sky/travelingSprits/generalVisits/edit/${id}`);
  const handleAdd = () => router.push(`/sky/travelingSprits/generalVisits/add/${id}`);

  const handleDelete = () => {
    const confirmation = prompt('정말 삭제하시겠습니까? 삭제를 진행하려면 "1234"를 입력하세요.');
    if (confirmation !== "1234") {
      alert("입력이 올바르지 않아 삭제가 취소되었습니다.");
      return;
    }
    fetch(`https://korea-sky-planner.com/api/v1/souls/${id}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) {
          alert("삭제가 완료되었습니다.");
          // 삭제 후에는 대상 영혼이 없으므로 해시 없이 목록으로
          const p = new URLSearchParams();
          p.set("mode", viewMode);
          if (query) p.set("query", query);
          router.push(`/sky/travelingSprits/generalVisits/list${p.toString() ? "?" + p.toString() : ""}`, { scroll: false });
        } else {
          alert("삭제에 실패하였습니다.");
        }
      })
      .catch((err) => {
        console.error(err);
        alert("삭제 도중 오류가 발생하였습니다.");
      });
  };

  return (
    <div className={styles.container}>
      {/* 제목과 시즌 뱃지 */}
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{soul.name}</h1>
        <span 
          className={styles.seasonBadge}
          style={{ backgroundColor: getSeasonColor(soul.seasonName) }}
        >
          {soul.seasonName}
        </span>
      </div>

      {!isMobile && (
        <div className={styles.topNavigation}>
          <button
            className={styles.listButton}
            onClick={() => router.push(listUrl, { scroll: false })}
          >
            목록 가기
          </button>
        </div>
      )}

      {/* 상단 레이아웃 */}
      <div className={styles.topLayout}>
        <div className={styles.representativeImageWrapper}>
          {representativeImage && (
            <img
              src={representativeImage}
              alt="대표 이미지"
              className={styles.representativeImage}
              style={{ cursor: "default" }}
            />
          )}
        </div>
        <div className={styles.infoSection}>
          <div className={styles.topInfoGrid}>
            <div className={styles.detailItem}>
              {soul.orderNum < 0 ? `${Math.abs(soul.orderNum)}번째 유랑단` : `${soul.orderNum}번째 영혼`}
            </div>
            <div className={styles.detailItem}>{soul.rerunCount}차 복각</div>
            <div className={styles.detailItem}>기간: {soul.startDate} ~ {soul.endDate}</div>
          </div>

          <div className={styles.sameSoulContainer}>
            <button
              className={styles.sameSoulButton}
              onClick={() =>
                router.push(
                  `/sky/travelingSprits/generalVisits/list?query=${encodeURIComponent(soul.name)}`,
                  { scroll: false }
                )
              }
            >
              같은 영혼 더 보기
            </button>
          </div>
        </div>
      </div>

      {nodeTableImage && (
        <div className={styles.nodeTableSection}>
          <span className={styles.nodeTableLabel}>노드표</span>
          <div className={styles.nodeTableImageWrapper}>
            <img src={nodeTableImage} alt="노드표 이미지" className={styles.nodeTableImage} />
          </div>
        </div>
      )}

      {/* 착용샷 - PC와 모바일 모두 더보기 버튼 사용 */}
      {wearingShotImages && wearingShotImages.length > 0 && (
        <div className={styles.wearingShotSection}>
          <strong className={styles.wearingShotLabel}>착용샷</strong>
          <div className={styles.wearingShotWrapper}>
            <ul className={styles.wearingShotList}>
              {(showMoreWearingShots ? wearingShotImages : [wearingShotImages[0]]).map((url, idx) => (
                <li key={idx}>
                  <img src={url} alt={`착용샷 ${idx + 1}`} className={styles.wearingShotImage} />
                </li>
              ))}
            </ul>
            {wearingShotImages.length > 1 && (
              <button 
                onClick={() => setShowMoreWearingShots((prev) => !prev)} 
                className={styles.toggleButton}
              >
                {showMoreWearingShots ? "접기" : `더보기 (${wearingShotImages.length - 1}개 더)`}
              </button>
            )}
          </div>
        </div>
      )}

      {locationImage && (
        <div className={styles.locationSection}>
          <span className={styles.locationLabel}>영혼 위치</span>
          <div className={styles.locationImageWrapper}>
            <img src={locationImage} alt="위치 이미지" className={styles.locationImage} />
          </div>
        </div>
      )}

      {soul.keywords && soul.keywords.length > 0 && (
        <div className={styles.keywordsSection}>
          <div className={styles.keywordsLeft}>
            <strong className={styles.keywordsLabel}>키워드:</strong>
            {soul.keywords.map((keyword, idx) => (
              <span key={idx} className={styles.keywordChip}>{keyword}</span>
            ))}
          </div>
        </div>
      )}
      {soul.creator && (
        <div className={styles.creatorTag} style={{ textAlign: "right" }}>
          자료 출처: {soul.creator}
        </div>
      )}

      <div className={styles.copyUrlContainer}>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
          }}
        >
          URL 복사
        </button>
        {showCopied && <span className={styles.copiedToast}>복사됨!</span>}
      </div>

      <div className={styles.centerNavigation}>
        <button
          className={styles.centerListButton}
          onClick={() => router.push(listUrl, { scroll: false })}
        >
          목록가기
        </button>
      </div>

      {/* 필요 시 편집/삭제 버튼 */}
      {/* <div className={styles.actions}>
        <button onClick={handleEdit}>수정</button>
        <button onClick={handleAdd}>추가</button>
        <button onClick={handleDelete}>삭제</button>
      </div> */}
    </div>
  );
}