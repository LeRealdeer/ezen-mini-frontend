'use client'
export const dynamic = 'force-dynamic';
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import styles from './MBTIPage.module.css'

const questions = [
  { id: 1, dimension:'TF', text:'안식처에서 친한 스친을 3달만에 만났는데 떡집 시간이라면', options:['손부터 냅다 잡고 납치해서 떡집부터 가고 얘기한다.','떡집은 후순위! 친구랑 먼저 얘기한다.'] },
  { id: 2, dimension:'TF', text:'나는 양작을', options:['떡집/간헐천 등을 이용하여 단시간에 효율 양작을 한다.','느긋하게 즐기면서 하는게 중요하다.'] },
  { id: 3, dimension:'EI', text:'접속을 하면 같이 놀 친구가', options:['항상 존재한다.','많이 없다.'] },
  { id: 4, dimension:'JP', text:'친구창의 빛은', options:['매일 빛반사까지 해야 일과가 끝난 기분이다.','서로 며칠씩 여유롭게 주고 받아도 상관없다.'] },
  { id: 5, dimension:'TF', text:'황무지 큰 버섯을 태우는데 친구가 새우를 무서워한다면', options:['스카이는 각자도생. 강하게 키워야 한다.','새우 어그로는 내가 다 가져간다.'] },
  { id: 6, dimension:'EI', text:'내 플레이 스타일은', options:['많은 친구들과 다함께 노는 것이 좋다.','소수로 다니거나 솔로 플레이를 선호한다.'] },
  { id: 7, dimension:'JP', text:'위시가 없더라도 양초/하트/어센 등', options:['항상 재화에 여유가 있도록 관리한다.','위시도 없는데 굳이 관리할 필요가 없다.'] },
  { id: 8, dimension:'TF', text:'양작하던 도중 잠수탄 친구의 손을 놓치게 된다면', options:['언제 돌아올지 모르니 일단 두고 간다.','친구가 돌아올 때까지 최대한 옆을 지킨다.'] },
  { id: 9, dimension:'EI', text:'친구의 친구로 만난 참새가 만나자마자 양초를 들이민다면', options:['쉽게 친구가 될 수 있다.','아직 내조할 단계니 거절한다.'] },
  { id:10, dimension:'JP', text:'스카이 루틴', options:['매일 정해진 양만큼의 일퀘/양작을 해야 한다.','일퀘만 하고 다른 컨텐츠를 즐긴다.'] },
  { id:11, dimension:'EI', text:'친해지고 싶은 스친이 생긴다면', options:['내가 합류하는 편이다.','상대가 합류해주길 기다린다.'] },
  { id:12, dimension:'TF', text:'내가 원하는 빛친은', options:['빛만 주고 받는 빛지니스','간간히 대화도 하는 교류가 있는 스친.'] },
  { id:13, dimension:'JP', text:'위시템은 아니지만 얻을 수 있는 모든 아이템은', options:['꼭 수집하는 편이다.','아이템 몇 개 정도는 놓쳐도 괜찮다.'] },
  { id:14, dimension:'EI', text:'안식처에서 스친을 만나면', options:['적극적으로 말을 걸거나 신나게 반긴다.','가만히 있거나 간단하게 인사한다.'] },
  { id:15, dimension:'JP', text:'키를 바꾸고 싶다면', options:['물약이 충분할 때만 키도박을 시도한다.','물약이 세개만 있어도 시도해본다.'] },
]

export default function MBTIPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState('intro') // 'intro', 'quiz', 'result'
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})

  const handleStart = () => {
    setCurrentStep('quiz')
    setCurrentQuestion(0)
    setAnswers({})
  }

  const handleAnswer = (optionIndex) => {
    const question = questions[currentQuestion]
    const newAnswers = {
      ...answers,
      [question.id]: optionIndex
    }
    setAnswers(newAnswers)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // 결과 계산
      calculateAndShowResult(newAnswers)
    }
  }

  const calculateAndShowResult = (finalAnswers) => {
    const scores = { E: 0, I: 0, T: 0, F: 0, J: 0, P: 0 }
    
    Object.entries(finalAnswers).forEach(([questionId, answerIndex]) => {
      const question = questions.find(q => q.id === parseInt(questionId))
      if (!question) return
      
      const dimension = question.dimension
      if (dimension === 'EI') {
        answerIndex === 0 ? scores.E++ : scores.I++
      } else if (dimension === 'TF') {
        answerIndex === 0 ? scores.T++ : scores.F++
      } else if (dimension === 'JP') {
        answerIndex === 0 ? scores.J++ : scores.P++
      }
    })

    const result = 
      (scores.E >= scores.I ? 'e' : 'i') +
      (scores.T >= scores.F ? 't' : 'f') +
      (scores.J >= scores.P ? 'j' : 'p')

    // 결과 페이지로 이동
    router.push(`/sky/mbti/result?type=${result}`)
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleRestart = () => {
    setCurrentStep('intro')
    setCurrentQuestion(0)
    setAnswers({})
  }

  // 인트로 화면
  if (currentStep === 'intro') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>내 빛아의 성향은?</h1>
          
          <div className={styles.imageContainer}>
            <Image 
              src="/sky/mbti/shadow.png" 
              alt="Shadow 이미지" 
              width={400} 
              height={250}
              style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
            />
          </div>

          <p className={styles.description}>
            내 빛아랑 가장 유사한 스카이 크리쳐는 무엇일까?
            <br />
            <br />
            8가지 분류로 보는 비공식 스카이 성향 테스트.
            <br />
            <br />        
            공신력은 제로에 가까우니 그저 재미로만 즐겨주세요!
            <br />
            <br />
            아트 - 무륵님
          </p>
          
          <button className={styles.startButton} onClick={handleStart}>
            테스트 시작하기
          </button>
        </div>
      </div>
    )
  }

  // 퀴즈 화면
  if (currentStep === 'quiz') {
    const question = questions[currentQuestion]
    const progress = ((currentQuestion + 1) / questions.length) * 100

    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.questionHeader}>
            <span className={styles.questionNumber}>Q{currentQuestion + 1}</span>
            <span className={styles.questionCount}>
              {currentQuestion + 1} / {questions.length}
            </span>
          </div>
          
          <h2 className={styles.questionText}>
            {question.text}
          </h2>

          <div className={styles.optionsContainer}>
            <button 
              className={styles.optionButton} 
              onClick={() => handleAnswer(0)}
            >
              <span className={styles.optionLabel}>A</span>
              {question.options[0]}
            </button>

            <button 
              className={styles.optionButton} 
              onClick={() => handleAnswer(1)}
            >
              <span className={styles.optionLabel}>B</span>
              {question.options[1]}
            </button>
          </div>

          <div className={styles.progressBarContainer}>
            <div 
              className={styles.progressBar} 
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className={styles.navigation}>
            {currentQuestion > 0 && (
              <button className={styles.backButton} onClick={handlePrevious}>
                ← 이전
              </button>
            )}
            
          </div>
        </div>
      </div>
    )
  }

  return null
}