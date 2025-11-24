import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { clampPosition, distance } from './heightUtils';

const html2canvas = dynamic(
  () => import('html2canvas').then((m) => m.default),
  { ssr: false }
);

const STEP_DESKTOP_PX = 0.5;
const STEP_MOBILE_PX  = 0.3;
const MIN_SCALE       = 0.05;   // 최저 줌 배율

export default function useHeightMeter(canvasRef) {
  const [uploaded, setUploaded] = useState(null);
  const [scale, setScale]       = useState(0.3);
  const [pos, setPos]           = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize]   = useState({ width: 0, height: 0 });
  const [touch, setTouch]       = useState(null);

  const [arrowStep, setArrowStep] = useState(STEP_DESKTOP_PX);
  const [zoomStep,  setZoomStep]  = useState(0.01);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mobile = window.innerWidth < 768;
    setArrowStep(mobile ? STEP_MOBILE_PX : STEP_DESKTOP_PX);
    setZoomStep (mobile ? 0.0002 : 0.0003);
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
  useEffect(() => {
    if (!imgSize.width || !imgSize.height) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasRatio = rect.width / rect.height;
    const imageRatio = imgSize.width / imgSize.height;

    let newScale;
    if (imageRatio > canvasRatio) {
      // 이미지가 더 가로로 긴 경우 - 너비에 맞춤
      newScale = rect.width / imgSize.width;
    } else {
      // 이미지가 더 세로로 긴 경우 - 높이에 맞춤
      newScale = rect.height / imgSize.height;
    }

    // 중앙 정렬
    const newX = (rect.width - imgSize.width * newScale) / 2;
    const newY = (rect.height - imgSize.height * newScale) / 2;

    setScale(newScale);
    setPos({ x: newX, y: newY });
  }, [imgSize, canvasRef]);

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

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const newS    = Math.max(MIN_SCALE, scale + (e.deltaY < 0 ? 0.003 : -0.003));

    const newX = pos.x + offsetX * (1 - newS / scale);
    const newY = pos.y + offsetY * (1 - newS / scale);

    setScale(newS);
    setPos(clamp(newX, newY, newS));
  }, [scale, pos, clamp]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    cvs.addEventListener('wheel', onWheel, { passive: false });
    return () => cvs.removeEventListener('wheel', onWheel);
  }, [onWheel, canvasRef]);

  const onTouchStart = (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const { pageX, pageY } = e.touches[0];
      setTouch({ type:'drag', sx:pageX, sy:pageY, ix:pos.x, iy:pos.y });
    } else if (e.touches.length === 2) {
      const [t1, t2] = e.touches;
      setTouch({
        type:'pinch',
        sd: distance(t1, t2),
        is: scale,
        ip: { ...pos },
        c:  { x:(t1.pageX+t2.pageX)/2, y:(t1.pageY+t2.pageY)/2 },
      });
    }
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    if (!touch) return;

    if (touch.type === 'drag' && e.touches.length === 1) {
      const { pageX, pageY } = e.touches[0];
      setPos(clamp(
        touch.ix + (pageX - touch.sx),
        touch.iy + (pageY - touch.sy)
      ));
    } else if (touch.type === 'pinch' && e.touches.length === 2) {
      const [t1, t2] = e.touches;
      let newS = touch.is * (1 + (distance(t1, t2) / touch.sd - 1) * 0.5);
      newS = Math.max(MIN_SCALE, newS);

      const newX = touch.ip.x + touch.c.x * (1 - newS / touch.is);
      const newY = touch.ip.y + touch.c.y * (1 - newS / touch.is);

      setScale(newS);
      setPos(clamp(newX, newY, newS));
    }
  };

  const move = (dx, dy) => setPos((p) => clamp(p.x + dx, p.y + dy));

  const zoom = (delta) => {
    const s = Math.max(MIN_SCALE, scale + delta);
    setScale(s);
    setPos(clamp(pos.x, pos.y, s));
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
    move,
    zoom,
    arrowStep,
    zoomStep,
    download,
  };
}