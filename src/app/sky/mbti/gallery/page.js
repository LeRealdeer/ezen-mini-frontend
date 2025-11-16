// src/app/sky/mbti/gallery/page.js
'use client'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './GalleryPage.module.css'

export default function GalleryPage() {
  const router = useRouter()
  const thumbnails = Array.from({ length: 8 }, (_, i) => `/sky/mbti/image/${i + 1}.png`)
  const results = [
    'etj.jpg',
    'etp.jpg',
    'efj.jpg',
    'efp.jpg',
    'itj.jpg',
    'itp.jpg',
    'ifj.jpg',
    'ifp.jpg'
  ]

  const [selectedIndex, setSelectedIndex] = useState(null)
  const [copySuccess, setCopySuccess] = useState('')

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText("https://korea-sky-planner.com/sky/mbti")
      setCopySuccess('링크가 복사되었습니다!')
    } catch (err) {
      setCopySuccess('복사에 실패했습니다.')
    }
    setTimeout(() => setCopySuccess(''), 2000)
  }

  const handleGoHome = () => router.push('/')
  const handleRetry = () => router.push('/sky/mbti')
  const openModal = index => setSelectedIndex(index)
  const closeModal = () => setSelectedIndex(null)

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>모든 유형 보기</h1>
        <p className={styles.subtitle}>클릭하면 상세 결과를 볼 수 있어요</p>
        
        <div className={styles.gallery}>
          {thumbnails.map((src, index) => (
            <div key={index} className={styles.imageWrapper} onClick={() => openModal(index)}>
              <Image
                src={src}
                alt={`유형 ${index + 1}`}
                width={300}
                height={300}
                style={{ objectFit: 'contain', width: '100%', height: 'auto', cursor: 'pointer' }}
              />
            </div>
          ))}
        </div>

        {selectedIndex !== null && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={closeModal}>✕</button>
              <h2 className={styles.modalTitle}>결과 상세</h2>
              <Image
                src={`/sky/mbti/result3/${results[selectedIndex]}`}
                alt={`결과 ${results[selectedIndex]}`}
                width={500}
                height={500}
                style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
              />
              <button className={styles.modalCloseBottom} onClick={closeModal}>닫기</button>
            </div>
          </div>
        )}

        <div className={styles.buttonRow}>
          <button className={styles.button} onClick={handleRetry}>다시 하기</button>
          <button className={styles.button} onClick={handleShare}>공유하기</button>
          <button className={styles.button} onClick={handleGoHome}>홈으로</button>
        </div>
        
        {copySuccess && <div className={styles.copyMessage}>{copySuccess}</div>}
      </div>
    </div>
  )
}