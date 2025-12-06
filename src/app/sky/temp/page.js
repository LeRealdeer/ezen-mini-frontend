'use client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import styles from './NoticePage.module.css'

export default function NoticePage() {
  const router = useRouter()

  const handleBack = () => {
    // 이전 페이지로 돌아가기
    router.back()
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>양초계산기</h1>
      
      <div className={styles.imageContainer}>
        <Image 
          src="/prImage.jpg" 
          alt="공지 이미지" 
          width={400} 
          height={250}
          style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
        />
      </div>
      
      <p className={styles.description}>
        유랑대백과/오래된 유랑 점검 중입니다!
        <br />
        <br />
        곧 다시 찾아올게요!
      </p>
      <button className={styles.optionButton} onClick={handleBack}>
        뒤로가기
      </button>
    </div>
  )
}
