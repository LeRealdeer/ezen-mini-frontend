import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { clampPosition, distance } from './heightUtils';

const html2canvas = dynamic(
  () => import('html2canvas').then((m) => m.default),
  { ssr: false }
);

const STEP_DESKTOP_PX = 0.5;
const STEP_MOBILE_PX  = 0.3;
const MIN_SCALE       = 0.05;
const MAX_SCALE       = 5.0;

export default function useHeightMeter(canvasRef) {
  const [uploaded, setUploaded] = useState(null);
  const [scale, setScale]       = useState(0.3);
  const [pos, setPos]           = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize]   = useState({ width: 0, height: 0 });
  
  // 터치 상태 및 렌더링 최적화를 위한 Ref
  const touchRef = useRef(null); 
  const lastTouchTimeRef = useRef(0); // 더블탭 시간
  const animationFrameRef = useRef(null); // 애니메이션 프레임 관리

  const [arrowStep, setArrowStep] = useState(STEP_DESKTOP_PX);
  const [zoomStep,  setZoomStep]  = useState(0.01);

  // 현재 pos와 scale을 동기화하기 위한 Ref
  const posRef = useRef(pos);
  const scaleRef = useRef(scale);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mobile = window.innerWidth < 768;
    setArrowStep(mobile ? STEP_MOBILE_PX : STEP_DESKTOP_PX);
    setZoomStep(0.01);
  }, []);

  const clamp = useCallback(
    (x, y, s = scale) => {
      const rect = canvasRef.current?.getBoundingClientRect() ?? { width: 0, height: 0 };
      return clampPosition({
        posX: x, posY: y, newScale: s,
        containerRect: rect, imageSize: imgSize,
      });
    },
    [canvasRef, imgSize, scale] // scale은 useClamp 밖에서 useEffect로 관리됨
  );
  
  // 이미지가 로드되면 자동으로 캔버스에 맞추기
  const fitImageToCanvas = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !imgSize.width || !imgSize.height) return;

    const canvasRatio = rect.width / rect.height;
    const imageRatio = imgSize.width / imgSize.height;

    let newScale;
    if (imageRatio > canvasRatio) {
      newScale = rect.width / imgSize.width;
    } else {
      newScale = rect.height / imgSize.height;
    }

    const newX = (rect.width - imgSize.width * newScale) / 2;
    const newY = (rect.height - imgSize.height * newScale) / 2;

    setScale(newScale);
    setPos({ x: newX, y: newY });
  }, [canvasRef, imgSize]);

  useEffect(() => {
    if (imgSize.width && imgSize.height) {
      fitImageToCanvas();
    }
  }, [imgSize, fitImageToCanvas]);

  const onUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploaded(ev.target.result);
    reader.readAsDataURL(file);
  };

  const onDrag = (e) => {
    if (e.buttons !== 1) return;
    setPos((p) => clamp(p.x + e.movementX, p.y + e.movementY));
  };

  const onWheel = useCallback((e) => {
    if (e.cancelable) e.preventDefault();
    const currentScale = scaleRef.current; // Ref 사용
    const currentPos = posRef.current; // Ref 사용
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale + delta));
    
    if (newScale === currentScale) return;

    const ratio = newScale / currentScale;
    const newX = mouseX - (mouseX - currentPos.x) * ratio;
    const newY = mouseY - (mouseY - currentPos.y) * ratio;

    setScale(newScale);
    setPos(clamp(newX, newY, newScale));
  }, [clamp, canvasRef]); // pos, scale 의존성 제거

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    cvs.addEventListener('wheel', onWheel, { passive: false });
    return () => cvs.removeEventListener('wheel', onWheel);
  }, [onWheel, canvasRef]);

  const onTouchStart = (e) => {
    e.preventDefault();
    
    // 더블탭 감지를 위해 시간을 기록 (onEnd에서 처리)
    const now = Date.now();
    lastTouchTimeRef.current = now; 
    
    if (e.touches.length === 1) {
      const { pageX, pageY } = e.touches[0];
      touchRef.current = { 
        type: 'drag', 
        sx: pageX, 
        sy: pageY, 
        ix: posRef.current.x, // 현재 위치 Ref 사용
        iy: posRef.current.y,
      };
    } else if (e.touches.length === 2) {
      const [t1, t2] = e.touches;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const startCenterX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const startCenterY = (t1.clientY + t2.clientY) / 2 - rect.top;

      touchRef.current = {
        type: 'pinch',
        startDist: distance(t1, t2),
        startScale: scaleRef.current, // 현재 스케일 Ref 사용
        startPos: { x: posRef.current.x, y: posRef.current.y },
        startCenterX,
        startCenterY,
      };
    }
  };

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    const currentTouch = touchRef.current;
    if (!currentTouch) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // requestAnimationFrame을 사용하여 부드럽게 렌더링
    animationFrameRef.current = requestAnimationFrame(() => {
      if (currentTouch.type === 'drag' && e.touches.length === 1) {
        const { pageX, pageY } = e.touches[0];
        const newX = currentTouch.ix + (pageX - currentTouch.sx);
        const newY = currentTouch.iy + (pageY - currentTouch.sy);
        
        const clampedPos = clamp(newX, newY, scaleRef.current); // Ref 사용
        setPos(clampedPos);
        
      } else if (currentTouch.type === 'pinch' && e.touches.length === 2) {
        const [t1, t2] = e.touches;
        
        // 현재 거리로 스케일 계산
        const currentDist = distance(t1, t2);
        let newScale = currentTouch.startScale * (currentDist / currentTouch.startDist);
        newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

        // 스케일 변화 비율 (startScale 대신 현재 scaleRef.current를 기준으로 계산해야 안정적)
        const scaleRatio = newScale / currentTouch.startScale;
        
        // 중심점을 기준으로 위치 조정
        const newX = currentTouch.startCenterX - (currentTouch.startCenterX - currentTouch.startPos.x) * scaleRatio;
        const newY = currentTouch.startCenterY - (currentTouch.startCenterY - currentTouch.startPos.y) * scaleRatio;
        
        const clampedPos = clamp(newX, newY, newScale);
        
        setScale(newScale);
        setPos(clampedPos);
      }
    });
  }, [clamp]); // pos, scale 의존성 제거 (Ref 사용)

  const onTouchEnd = (e) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    touchRef.current = null;
    
    // 더블탭 감지 (300ms 이내)
    const now = Date.now();
    const lastTime = lastTouchTimeRef.current;
    lastTouchTimeRef.current = 0; // 초기화
    
    if (now - lastTime < 300 && e.changedTouches.length === 1) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !e.changedTouches[0]) return;
      
      const tapX = e.changedTouches[0].clientX - rect.left;
      const tapY = e.changedTouches[0].clientY - rect.top;
      const currentScale = scaleRef.current;

      // 확대되어 있으면 원래대로 (fit), 아니면 확대 (zoom in)
      if (currentScale > 1.0) { // 1.0 이상이면 확대된 것으로 간주
        fitImageToCanvas();
      } else {
        const targetScale = 1.8; // 더블탭 시 목표 줌 레벨
        const ratio = targetScale / currentScale;
        const newX = tapX - (tapX - posRef.current.x) * ratio;
        const newY = tapY - (tapY - posRef.current.y) * ratio;
        
        setScale(targetScale);
        setPos(clamp(newX, newY, targetScale));
      }
    }
  };

  const move = (dx, dy) => setPos((p) => clamp(p.x + dx, p.y + dy));

  const zoom = (delta) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentScale = scaleRef.current;
    const currentPos = posRef.current;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale + delta));
    if (newScale === currentScale) return;
    
    const ratio = newScale / currentScale;
    const newX = centerX - (centerX - currentPos.x) * ratio;
    const newY = centerY - (centerY - currentPos.y) * ratio;
    
    setScale(newScale);
    setPos(clamp(newX, newY, newScale));
  };

  const download = async () => {
    const el = canvasRef.current;
    if (!el) return;
    const html2canvasFn = (await import('html2canvas')).default;
    const canvas = await html2canvasFn(el, { useCORS:true, scale:3 });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'heightmeter.png';
    link.click();
  };

  return {
    uploaded,
    setImgSize,
    imgSize,
    pos,
    scale,
    onUpload,
    onDrag,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    move,
    zoom,
    arrowStep,
    zoomStep,
    download,
  };
}