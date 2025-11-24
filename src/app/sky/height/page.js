'use client';

import { useRef, useState } from 'react';
import styles from './HeightMeter.module.css';
import useHeightMeter from '@/app/sky/utils/useHeightMeter';

export default function HeightMeterPage() {
  const canvasRef = useRef(null);

  /* 커스텀 훅 : 이동 · 줌 · 다운로드 */
  const {
    uploaded, setImgSize, pos, scale,
    onUpload, onDrag, onTouchStart, onTouchMove,
    move, zoom, arrowStep, zoomStep, download,
  } = useHeightMeter(canvasRef);

  /* 모바일 가이드 토글 상태 */
  const [open, setOpen] = useState(false);

  return (
    <main className={styles.workspace}>

      {/* 모바일 첫 번째 : 토글 가이드 (데스크톱에서는 CSS로 display:none) */}
      <div className={styles.guideToggle}>
        <button className={styles.toggleBtn} onClick={()=>setOpen(o=>!o)}>
          키재기 가이드 {open ? '▲' : '▼'}
        </button>
        {open && (
          <img src="/guide.png" alt="guide" className={styles.guideMobile}/>
        )}
      </div>

      {/* 왼쪽 : 캔버스 */}
      <div className={styles.left}>
        <div
          ref={canvasRef}
          className={styles.canvas}
          onMouseMove={onDrag}
          onMouseDown={e=>e.preventDefault()}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={()=>null}
        >
          {uploaded && (
            <img
              src={uploaded}
              alt="uploaded"
              className={styles.uploaded}
              onLoad={e=>{
                const { naturalWidth, naturalHeight } = e.currentTarget;
                setImgSize({ width:naturalWidth, height:naturalHeight });
              }}
              style={{ transform:`translate(${pos.x}px,${pos.y}px) scale(${scale})` }}
            />
          )}
          <img src="/sky/height/guideline.png" alt="guideline" className={styles.overlay}/>
          <span className={styles.watermark}>&lt;korea-sky-planner.com&gt;</span>
        </div>

        <input type="file" accept="image/*" onChange={onUpload} className={styles.file}/>
      </div>

      {/**/}
      <div className={styles.center}>
        <div className={styles.arrows}>
          <button className={styles.ctrl} onClick={()=>move(0, arrowStep)}>↑</button>
          <button className={styles.ctrl} onClick={()=>move(arrowStep, 0)}>←</button>
          <button className={styles.ctrl} onClick={()=>move(-arrowStep, 0)}>→</button>
          <button className={styles.ctrl} onClick={()=>move(0,  -arrowStep)}>↓</button>
        </div>

        <div className={styles.zoomRow}>
          <button className={styles.ctrl} onClick={()=>zoom( zoomStep)}>＋</button>
          <button className={styles.ctrl} onClick={()=>zoom(-zoomStep)}>－</button>
        </div>

        <button className={styles.download} onClick={download}>다운로드</button>
      </div>

      {/* 데스크톱 가이드 이미지 (모바일에서는 CSS로 숨김) */}
      <img src="/guide.png" alt="guide" className={styles.guide}/>
    </main>
  );
}
