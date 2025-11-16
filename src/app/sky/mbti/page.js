'use client'
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import styles from './MBTIPage.module.css'

const translations = {
  ko: {
    title: '내 빛아의 성향은?',
    subtitle1: '내 빛아랑 가장 유사한 스카이 크리쳐는 무엇일까?',
    subtitle2: '8가지 분류로 보는 비공식 스카이 성향 테스트.',
    subtitle3: '공신력은 제로에 가까우니 그저 재미로만 즐겨주세요!',
    credit: '아트 - 무륵님',
    startButton: '테스트 시작하기',
    previous: '← 이전'
  },
  en: {
    title: 'What\'s Your Sky Personality?',
    subtitle1: 'Which Sky creature is most similar to your sky kid?',
    subtitle2: 'An unofficial Sky personality test with 8 categories.',
    subtitle3: 'This is just for fun - no scientific basis!',
    credit: 'Art by Mureuk',
    startButton: 'Start Test',
    previous: '← Previous'
  }
}

const questions = [
  { 
    id: 1, 
    dimension:'TF', 
    text: {
      ko: '안식처에서 친한 스친을 3달만에 만났는데 떡집 시간이라면',
      en: 'If you meet a close friend at the sanctuary after 3 months and it\'s candle run time'
    },
    options: {
      ko: ['손부터 냅다 잡고 납치해서 떡집부터 가고 얘기한다.','떡집은 후순위! 친구랑 먼저 얘기한다.'],
      en: ['Grab their hand and rush to candle run first!', 'Candle run can wait, talk with friend first!']
    }
  },
  { 
    id: 2, 
    dimension:'TF', 
    text: {
      ko: '나는 양작을',
      en: 'My candle running style is'
    },
    options: {
      ko: ['떡집/간헐천 등을 이용하여 단시간에 효율 양작을 한다.','느긋하게 즐기면서 하는게 중요하다.'],
      en: ['Efficient farming using grandma, geyser, etc.', 'Taking it slow and enjoying the process.']
    }
  },
  { 
    id: 3, 
    dimension:'EI', 
    text: {
      ko: '접속을 하면 같이 놀 친구가',
      en: 'When I log in, friends to play with'
    },
    options: {
      ko: ['항상 존재한다.','많이 없다.'],
      en: ['Are always online.', 'Are rarely online.']
    }
  },
  { 
    id: 4, 
    dimension:'JP', 
    text: {
      ko: '친구창의 빛은',
      en: 'Exchanging light with friends'
    },
    options: {
      ko: ['매일 빛반사까지 해야 일과가 끝난 기분이다.','서로 며칠씩 여유롭게 주고 받아도 상관없다.'],
      en: ['Must exchange all daily to feel complete.', 'Can casually exchange over several days.']
    }
  },
  { 
    id: 5, 
    dimension:'TF', 
    text: {
      ko: '황무지 큰 버섯을 태우는데 친구가 새우를 무서워한다면',
      en: 'If a friend is scared of krills while burning dark plant'
    },
    options: {
      ko: ['스카이는 각자도생. 강하게 키워야 한다.','새우 어그로는 내가 다 가져간다.'],
      en: ['Everyone must grow stronger in Sky.', 'I\'ll take all the krill aggro for them.']
    }
  },
  { 
    id: 6, 
    dimension:'EI', 
    text: {
      ko: '내 플레이 스타일은',
      en: 'My playstyle is'
    },
    options: {
      ko: ['많은 친구들과 다함께 노는 것이 좋다.','소수로 다니거나 솔로 플레이를 선호한다.'],
      en: ['Playing with many friends together.', 'Small groups or solo play.']
    }
  },
  { 
    id: 7, 
    dimension:'JP', 
    text: {
      ko: '위시가 없더라도 양초/하트/어센 등',
      en: 'Even without TS wishlist, candles/hearts/ascended candles'
    },
    options: {
      ko: ['항상 재화에 여유가 있도록 관리한다.','위시도 없는데 굳이 관리할 필요가 없다.'],
      en: ['I always keep a buffer of resources.', 'No need to manage if there\'s no wishlist.']
    }
  },
  { 
    id: 8, 
    dimension:'TF', 
    text: {
      ko: '양작하던 도중 잠수탄 친구의 손을 놓치게 된다면',
      en: 'If I accidentally let go of an AFK friend\'s hand while candle running'
    },
    options: {
      ko: ['언제 돌아올지 모르니 일단 두고 간다.','친구가 돌아올 때까지 최대한 옆을 지킨다.'],
      en: ['Continue on, they might not come back soon.', 'Wait beside them as long as possible.']
    }
  },
  { 
    id: 9, 
    dimension:'EI', 
    text: {
      ko: '친구의 친구로 만난 참새가 만나자마자 양초를 들이민다면',
      en: 'If a moth (new player) immediately offers a candle upon meeting'
    },
    options: {
      ko: ['쉽게 친구가 될 수 있다.','아직 내조할 단계니 거절한다.'],
      en: ['Easy to become friends.', 'Still need to know them better, decline.']
    }
  },
  { 
    id:10, 
    dimension:'JP', 
    text: {
      ko: '스카이 루틴',
      en: 'My Sky routine'
    },
    options: {
      ko: ['매일 정해진 양만큼의 일퀘/양작을 해야 한다.','일퀘만 하고 다른 컨텐츠를 즐긴다.'],
      en: ['Must complete set amount of dailies/CR everyday.', 'Just dailies, then enjoy other content.']
    }
  },
  { 
    id:11, 
    dimension:'EI', 
    text: {
      ko: '친해지고 싶은 스친이 생긴다면',
      en: 'If I want to get closer to a sky kid'
    },
    options: {
      ko: ['내가 합류하는 편이다.','상대가 합류해주길 기다린다.'],
      en: ['I initiate and join them.', 'I wait for them to approach me.']
    }
  },
  { 
    id:12, 
    dimension:'TF', 
    text: {
      ko: '내가 원하는 빛친은',
      en: 'My ideal friend relationship is'
    },
    options: {
      ko: ['빛만 주고 받는 빛지니스','간간히 대화도 하는 교류가 있는 스친.'],
      en: ['Just light exchange business.', 'Casual chat and interaction occasionally.']
    }
  },
  { 
    id:13, 
    dimension:'JP', 
    text: {
      ko: '위시템은 아니지만 얻을 수 있는 모든 아이템은',
      en: 'All obtainable items that aren\'t wishlist items'
    },
    options: {
      ko: ['꼭 수집하는 편이다.','아이템 몇 개 정도는 놓쳐도 괜찮다.'],
      en: ['I must collect everything.', 'It\'s okay to miss a few items.']
    }
  },
  { 
    id:14, 
    dimension:'EI', 
    text: {
      ko: '안식처에서 스친을 만나면',
      en: 'When I meet a friend at sanctuary'
    },
    options: {
      ko: ['적극적으로 말을 걸거나 신나게 반긴다.','가만히 있거나 간단하게 인사한다.'],
      en: ['Actively greet or excitedly welcome them.', 'Stay still or give a simple greeting.']
    }
  },
  { 
    id:15, 
    dimension:'JP', 
    text: {
      ko: '키를 바꾸고 싶다면',
      en: 'If I want to change my height'
    },
    options: {
      ko: ['물약이 충분할 때만 키도박을 시도한다.','물약이 세개만 있어도 시도해본다.'],
      en: ['Only try when I have plenty of potions.', 'I\'ll try even with just 3 potions.']
    }
  },
]

export default function MBTIPage() {
  const router = useRouter()
  const [language, setLanguage] = useState('en')
  const [currentStep, setCurrentStep] = useState('intro')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})

  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator) {
      const userLocale = window.navigator.language
      if (userLocale.toLowerCase().includes('ko')) {
        setLanguage('ko')
      } else {
        setLanguage('en')
      }
    }
  }, [])

  const t = translations[language]

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
          {/* 언어 전환 버튼 */}
          {/* <div className={styles.languageSwitch}>
            <button
              onClick={() => setLanguage('ko')}
              className={language === 'ko' ? styles.langActive : styles.langButton}
            >
              한국어
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={language === 'en' ? styles.langActive : styles.langButton}
            >
              English
            </button>
          </div> */}

          <h1 className={styles.title}>{t.title}</h1>
          
          <div className={styles.imageContainer}>
            <Image 
              src="/sky/mbti/shadow.png" 
              alt="Shadow" 
              width={400} 
              height={250}
              style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
            />
          </div>

          <p className={styles.description}>
            {t.subtitle1}
            <br />
            <br />
            {t.subtitle2}
            <br />
            <br />        
            {t.subtitle3}
            <br />
            <br />
            {t.credit}
          </p>
          
          <button className={styles.startButton} onClick={handleStart}>
            {t.startButton}
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
          {/* 언어 전환 버튼 */}
          {/* <div className={styles.languageSwitch}>
            <button
              onClick={() => setLanguage('ko')}
              className={language === 'ko' ? styles.langActive : styles.langButton}
            >
              한국어
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={language === 'en' ? styles.langActive : styles.langButton}
            >
              English
            </button>
          </div> */}

          <div className={styles.questionHeader}>
            <span className={styles.questionNumber}>Q{currentQuestion + 1}</span>
            <span className={styles.questionCount}>
              {currentQuestion + 1} / {questions.length}
            </span>
          </div>
          
          <h2 className={styles.questionText}>
            {question.text[language]}
          </h2>

          <div className={styles.optionsContainer}>
            <button 
              className={styles.optionButton} 
              onClick={() => handleAnswer(0)}
            >
              <span className={styles.optionLabel}>A</span>
              {question.options[language][0]}
            </button>

            <button 
              className={styles.optionButton} 
              onClick={() => handleAnswer(1)}
            >
              <span className={styles.optionLabel}>B</span>
              {question.options[language][1]}
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
                {t.previous}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}