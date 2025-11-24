import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { clampPosition, distance } from './heightUtils';

const html2canvas = dynamic(
  () => import('html2canvas').then((m) => m.default),
  { ssr: false }
);

const STEP_DESKTOP_PX = 0.5;
const STEP_MOBILE_PX  = 0.3;
const MIN_SCALE       = 0.05;
const MAX_SCALE       = 5.0;

export default function useHeightMeter(canvasRef) {
  const [uploaded, setUploaded] = useState(null);
  const [scale, setScale]       = useState(0.3);
  const [pos, setPos]           = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize]   = useState({ width: 0, height: 0 });
  const [touch, setTouch]       = useState(null);
  const lastTouchRef = useRef(null);

  const [arrowStep, setArrowStep] = useState(STEP_DESKTOP_PX);
  const [zoomStep,  setZoomStep]  = useState(0.01);

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
    [canvasRef, imgSize, scale]
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
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
    
    if (newScale === scale) return;

    const ratio = newScale / scale;
    const newX = mouseX - (mouseX - pos.x) * ratio;
    const newY = mouseY - (mouseY - pos.y) * ratio;

    setScale(newScale);
    setPos(clamp(newX, newY, newScale));
  }, [scale, pos, clamp, canvasRef]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    cvs.addEventListener('wheel', onWheel, { passive: false });
    return () => cvs.removeEventListener('wheel', onWheel);
  }, [onWheel, canvasRef]);

  const onTouchStart = (e) => {
    e.preventDefault();
    lastTouchRef.current = Date.now();
    
    if (e.touches.length === 1) {
      const { pageX, pageY } = e.touches[0];
      setTouch({ 
        type: 'drag', 
        sx: pageX, 
        sy: pageY, 
        ix: pos.x, 
        iy: pos.y,
      });
    } else if (e.touches.length === 2) {
      const [t1, t2] = e.touches;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      // 시작 시점의 중심점 (화면 좌표)
      const startCenterX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const startCenterY = (t1.clientY + t2.clientY) / 2 - rect.top;

      setTouch({
        type: 'pinch',
        startDist: distance(t1, t2),
        startScale: scale,
        startPos: { x: pos.x, y: pos.y },
        startCenterX,
        startCenterY,
      });
    }
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    if (!touch) return;

    if (touch.type === 'drag' && e.touches.length === 1) {
      const { pageX, pageY } = e.touches[0];
      const newX = touch.ix + (pageX - touch.sx);
      const newY = touch.iy + (pageY - touch.sy);
      setPos(clamp(newX, newY));
      
    } else if (touch.type === 'pinch' && e.touches.length === 2) {
      const [t1, t2] = e.touches;
      
      // 현재 거리로 스케일 계산
      const currentDist = distance(t1, t2);
      let newScale = touch.startScale * (currentDist / touch.startDist);
      newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

      // 스케일 변화 비율
      const scaleRatio = newScale / touch.startScale;
      
      // 시작 중심점을 기준으로 위치 조정
      const newX = touch.startCenterX - (touch.startCenterX - touch.startPos.x) * scaleRatio;
      const newY = touch.startCenterY - (touch.startCenterY - touch.startPos.y) * scaleRatio;

      setScale(newScale);
      setPos(clamp(newX, newY, newScale));
    }
  };

  const onTouchEnd = (e) => {
    setTouch(null);
    
    // 더블탭 감지
    const now = Date.now();
    if (lastTouchRef.current && now - lastTouchRef.current < 300) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !e.changedTouches[0]) return;
      
      const tapX = e.changedTouches[0].clientX - rect.left;
      const tapY = e.changedTouches[0].clientY - rect.top;
      
      // 확대되어 있으면 원래대로, 아니면 확대
      if (scale > 0.8) {
        fitImageToCanvas();
      } else {
        const targetScale = 1.2;
        const ratio = targetScale / scale;
        const newX = tapX - (tapX - pos.x) * ratio;
        const newY = tapY - (tapY - pos.y) * ratio;
        
        setScale(targetScale);
        setPos(clamp(newX, newY, targetScale));
      }
    }
    
    lastTouchRef.current = now;
  };

  const move = (dx, dy) => setPos((p) => clamp(p.x + dx, p.y + dy));

  const zoom = (delta) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
    if (newScale === scale) return;
    
    const ratio = newScale / scale;
    const newX = centerX - (centerX - pos.x) * ratio;
    const newY = centerY - (centerY - pos.y) * ratio;
    
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