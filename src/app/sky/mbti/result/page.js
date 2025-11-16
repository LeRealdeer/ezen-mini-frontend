'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import styles from './ResultPage.module.css';

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get('type') || 'etj';
  
  const [copySuccess, setCopySuccess] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const fullImageSrc = `/sky/mbti/result3/${type}.jpg`;
  const headImageSrc = `/sky/mbti/result3/${type}_head.jpg`;

  const handleDownload = (src, name) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText('https://korea-sky-planner.com/sky/mbti');
      setCopySuccess('링크가 복사되었습니다!');
    } catch (err) {
      setCopySuccess('복사에 실패했습니다.');
    }
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const handleRetry = () => {
    router.push('/sky/mbti');
  };

  const handleGallery = () => {
    router.push('/sky/mbti/gallery');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>당신의 결과는...</h1>
        
        <div className={styles.imageWrapper}>
          <Image
            src={fullImageSrc}
            alt={`${type} 결과 이미지`}
            width={500}
            height={800}
            priority
            style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
          />
        </div>

        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={() => handleDownload(headImageSrc, `${type}_head.jpg`)}
          >
            결과 이미지 다운로드
          </button>

          <div className={styles.secondaryButtons}>
            <button
              className={styles.secondaryButton}
              onClick={handleShare}
            >
              공유하기
            </button>
            <button
              className={styles.secondaryButton}
              onClick={handleRetry}
            >
              다시하기
            </button>
            <button
              className={styles.secondaryButton}
              onClick={handleGallery}
            >
              다른 유형 보기
            </button>
          </div>
        </div>

        {copySuccess && (
          <div className={styles.copyMessage}>{copySuccess}</div>
        )}
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>로딩 중...</div>}>
      <ResultContent />
    </Suspense>
  );
}