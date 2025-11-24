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

// ⚡️ 줌 버튼 변화량 상수 정의 (미세 조절을 위해 줄임)
const BUTTON_ZOOM_DELTA = 0.01; 

export default function useHeightMeter(canvasRef) {
  const [uploaded, setUploaded] = useState(null);
  const [scale, setScale]       = useState(0.3);
  const [pos, setPos]           = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize]   = useState({ width: 0, height: 0 });
  
  const touchRef = useRef(null); 
  const animationFrameRef = useRef(null); 
  const posRef = useRef(pos); 
  const scaleRef = useRef(scale); 

  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  const [arrowStep, setArrowStep] = useState(STEP_DESKTOP_PX);
  const [zoomStep,  setZoomStep]  = useState(BUTTON_ZOOM_DELTA); // 줌 스텝도 동일하게 설정

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mobile = window.innerWidth < 768;
    setArrowStep(mobile ? STEP_MOBILE_PX : STEP_DESKTOP_PX);
    setZoomStep(BUTTON_ZOOM_DELTA);
  }, []);

  const clamp = useCallback(
    (x, y, s) => {
      const rect = canvasRef.current?.getBoundingClientRect() ?? { width: 0, height: 0 };
      return clampPosition({
        posX: x, posY: y, newScale: s,
        containerRect: rect, imageSize: imgSize,
      });
    },
    [canvasRef, imgSize]
  );

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
    const currentScale = scaleRef.current;
    setPos((p) => clamp(p.x + e.movementX, p.y + e.movementY, currentScale));
  };

  const onWheel = useCallback((e) => {
    if (e.cancelable) e.preventDefault();
    const currentScale = scaleRef.current;
    const currentPos = posRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 휠 줌은 비교적 큰 폭(0.05)을 유지
    const delta = e.deltaY < 0 ? 0.05 : -0.05; 
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale + delta));
    
    if (newScale === currentScale) return;

    const ratio = newScale / currentScale;
    const newX = mouseX - (mouseX - currentPos.x) * ratio;
    const newY = mouseY - (mouseY - currentPos.y) * ratio;

    setScale(newScale);
    setPos(clamp(newX, newY, newScale));
  }, [clamp, canvasRef]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    cvs.addEventListener('wheel', onWheel, { passive: false });
    return () => cvs.removeEventListener('wheel', onWheel);
  }, [onWheel, canvasRef]);
  
  const onTouchStart = (e) => {
    const currentPos = posRef.current;
    const currentScale = scaleRef.current;
    
    if (e.touches.length === 1) {
      const { pageX, pageY } = e.touches[0];
      touchRef.current = { 
        type: 'drag', 
        sx: pageX, sy: pageY, 
        ix: currentPos.x, iy: currentPos.y,
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
        startScale: currentScale,
        startPos: { x: currentPos.x, y: currentPos.y },
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
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const currentScale = scaleRef.current;
      
      if (currentTouch.type === 'drag' && e.touches.length === 1) {
        const { pageX, pageY } = e.touches[0];
        const newX = currentTouch.ix + (pageX - currentTouch.sx);
        const newY = currentTouch.iy + (pageY - currentTouch.sy);
        
        setPos(clamp(newX, newY, currentScale));
        
      } else if (currentTouch.type === 'pinch' && e.touches.length === 2) {
        const [t1, t2] = e.touches;
        
        const currentDist = distance(t1, t2);
        let newScale = currentTouch.startScale * (currentDist / currentTouch.startDist);
        newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

        const scaleRatio = newScale / currentTouch.startScale;
        
        const newX = currentTouch.startCenterX - (currentTouch.startCenterX - currentTouch.startPos.x) * scaleRatio;
        const newY = currentTouch.startCenterY - (currentTouch.startCenterY - currentTouch.startPos.y) * scaleRatio;
        
        setScale(newScale);
        setPos(clamp(newX, newY, newScale));
      }
    });
  }, [clamp]);

  const onTouchEnd = (e) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    touchRef.current = null;
  };

  const move = (dx, dy) => setPos((p) => clamp(p.x + dx, p.y + dy, scaleRef.current));

  const zoom = (delta) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentScale = scaleRef.current;
    const currentPos = posRef.current;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // ⚡️ 버튼 줌 변화량은 BUTTON_ZOOM_DELTA (0.01) 사용
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale + delta * BUTTON_ZOOM_DELTA / 0.01)); 
    // delta는 +1 또는 -1로 들어오므로, 0.01을 곱하여 미세 조절
    
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
    zoomStep: BUTTON_ZOOM_DELTA, // 반환하는 zoomStep도 0.01로 고정
    download,
  };
}