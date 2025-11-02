"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { spiritsData } from './data/spiritsData';
import { theme, translations } from './styles/theme';
import { SpiritCard } from './components/SpiritCard';
import { SettingsPanel } from './components/SettingsPanel';
import { CalculationResult } from './components/CalculationResult';
import { SimpleCandleCalculator } from './components/SimpleCandleCalculator';

export default function CandleCalculator() {
  const router = useRouter();
// ----------------------------------------------------
  const [language, setLanguage] = useState('en'); // 초기 기본값은 'en'으로 설정

  useEffect(() => {
    // 클라이언트 사이드에서만 navigator 객체에 접근
    if (typeof window !== 'undefined' && window.navigator) {
      // 브라우저의 기본 언어 설정을 가져옴 (예: 'ko-KR', 'en-US')
      const userLocale = window.navigator.language;
      
      // 한국어(ko)를 포함하는 경우 'ko'로 설정, 그렇지 않으면 'en' 유지
      if (userLocale.toLowerCase().includes('ko')) {
        setLanguage('ko');
      } else {
        setLanguage('en');
      }
    }
  }, []);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [currentCandles, setCurrentCandles] = useState(0);
  const [ownsSeasonPass, setOwnsSeasonPass] = useState("yes");
  const [buySeasonPass, setBuySeasonPass] = useState(false);
  const [calcResult, setCalcResult] = useState("");

  const BONUS_CANDLES = 31;
  const seasonEnd = new Date("2026-01-05T17:00:00+09:00");
  
  const t = translations[language];

  const [remainingDays, setRemainingDays] = useState(() => {
    const now = new Date();
    const diffMs = seasonEnd.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diffMs = seasonEnd.getTime() - now.getTime();
      setRemainingDays(Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24))));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleNode = (nodeId) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const selectAllForSpirit = (spirit) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      spirit.levels.forEach(level => {
        level.leftNodes.forEach(node => newSet.add(node.id));
        level.rightNodes.forEach(node => newSet.add(node.id));
      });
      return newSet;
    });
  };

  const clearAllForSpirit = (spirit) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      spirit.levels.forEach(level => {
        level.leftNodes.forEach(node => newSet.delete(node.id));
        level.rightNodes.forEach(node => newSet.delete(node.id));
      });
      return newSet;
    });
  };

  const totalRequired = spiritsData.reduce((sum, spirit) => {
    return sum + spirit.levels.reduce((levelSum, level) => {
      const leftSum = level.leftNodes.reduce((nodeSum, node) => {
        return nodeSum + (selectedNodes.has(node.id) ? node.cost : 0);
      }, 0);
      const rightSum = level.rightNodes.reduce((nodeSum, node) => {
        return nodeSum + (selectedNodes.has(node.id) ? node.cost : 0);
      }, 0);
      return levelSum + leftSum + rightSum;
    }, 0);
  }, 0);

const handleCalculate = () => {
  const dailyCandleCount = 
    ownsSeasonPass === "yes" || (ownsSeasonPass === "no" && buySeasonPass) ? 6 : 5;
  
  const BONUS_CANDLES = 31;
  const seasonCandlesFromDays = remainingDays * dailyCandleCount;
  const extraCandles = ownsSeasonPass === "no" && buySeasonPass ? BONUS_CANDLES : 0;
  
  const totalSeasonCandles = currentCandles + seasonCandlesFromDays + extraCandles;
  const difference = totalSeasonCandles - totalRequired;
  const neededCandles = totalRequired - currentCandles - extraCandles;
  const finalDays = Math.ceil((totalRequired - currentCandles - extraCandles) / dailyCandleCount);

  const bonusText = extraCandles > 0 
    ? ` + ${t.seasonPassBonus} ${BONUS_CANDLES}${t.bonusCandles}` 
    : '';
  
  const resultData = {
    remainingDays,
    dailyCandleCount,
    currentCandles,
    seasonCandlesFromDays,
    bonusText,
    totalSeasonCandles,
    totalRequired,
    difference,
    neededCandles,
    finalDays,
    hasBonus: extraCandles > 0
  };

  setCalcResult(resultData);
};

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'sans-serif',
      background: theme.colors.background,
      minHeight: '100vh'
    }}>
      {/* 언어 전환 버튼 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '20px',
        gap: '12px'
      }}>
        <button
          onClick={() => setLanguage('ko')}
          style={{
            padding: '8px 16px',
            background: language === 'ko' ? theme.colors.primary : theme.colors.white,
            color: language === 'ko' ? theme.colors.white : theme.colors.text,
            border: `2px solid ${theme.colors.primary}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          한국어
        </button>
        <button
          onClick={() => setLanguage('en')}
          style={{
            padding: '8px 16px',
            background: language === 'en' ? theme.colors.primary : theme.colors.white,
            color: language === 'en' ? theme.colors.white : theme.colors.text,
            border: `2px solid ${theme.colors.primary}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          English
        </button>
      </div>

      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        color: theme.colors.text
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: theme.colors.primary,
          marginBottom: '8px'
        }}>
          {t.title}
        </h1>
        <p style={{ color: theme.colors.textLight, fontSize: '14px' }}>
          {t.subtitle}
        </p>
      </div>

      <SettingsPanel
        currentCandles={currentCandles}
        setCurrentCandles={setCurrentCandles}
        ownsSeasonPass={ownsSeasonPass}
        setOwnsSeasonPass={setOwnsSeasonPass}
        buySeasonPass={buySeasonPass}
        setBuySeasonPass={setBuySeasonPass}
        remainingDays={remainingDays}
        totalRequired={totalRequired}
        language={language}
      />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {spiritsData.slice(0, 3).map(spirit => (
            <SpiritCard
              key={spirit.id}
              spirit={spirit}
              selectedNodes={selectedNodes}
              onToggleNode={toggleNode}
              onSelectAll={selectAllForSpirit}
              onClearAll={clearAllForSpirit}
              language={language}
            />
          ))}
        </div>
        
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {spiritsData.slice(3, 5).map(spirit => (
            <SpiritCard
              key={spirit.id}
              spirit={spirit}
              selectedNodes={selectedNodes}
              onToggleNode={toggleNode}
              onSelectAll={selectAllForSpirit}
              onClearAll={clearAllForSpirit}
              language={language}
            />
          ))}
        </div>
      </div>

      <CalculationResult
        currentCandles={currentCandles}
        totalRequired={totalRequired}
        ownsSeasonPass={ownsSeasonPass}
        buySeasonPass={buySeasonPass}
        remainingDays={remainingDays}
        onCalculate={handleCalculate}
        calcResult={calcResult}
        language={language}
      />

      {language === 'ko' && <SimpleCandleCalculator />}

      {/* 메인화면 버튼 */}
      <div style={{
        textAlign: 'center',
        marginTop: '40px',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '12px 32px',
            background: theme.colors.white,
            color: theme.colors.primary,
            border: `2px solid ${theme.colors.primary}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = theme.colors.primary;
            e.target.style.color = theme.colors.white;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = theme.colors.white;
            e.target.style.color = theme.colors.primary;
          }}
        >
          {t.backToMain}
        </button>
      </div>
    </div>
  );
}
