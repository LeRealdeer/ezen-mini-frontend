// Credit.tsx
"use client";
import React from "react";
import Link from "next/link";
import styles from "./Credit.module.css";

// 아이콘을 위한 간단한 컴포넌트 (SVG 또는 FontAwesome 사용 가능)
const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

export default function Credit() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.creditCard}>
        <h1 className={styles.title}>Credit</h1>
        
        <div className={styles.section}>
          <div className={styles.item}>
            <span className={styles.role}>사이트 제작자</span>
            <span className={styles.name}>진사슴</span>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>도움 주신 분들</h2>
          <div className={styles.item}>
            <span className={styles.role}>유랑 대백과 자료 제작</span>
            <span className={styles.name}>무륵, 망고, 엔, 진사슴</span>
          </div>
          <div className={styles.item}>
            <span className={styles.role}>성향 테스트 그림</span>
            <span className={styles.name}>무륵</span>
          </div>
          <div className={styles.item}>
            <span className={styles.role}>양초 계산기 아이콘</span>
            <span className={styles.name}>Sky Wiki, 햇비</span>
          </div>
          <div className={styles.item}>
            <span className={styles.role}>악보 만들기</span>
            <span className={styles.name}>단풍잎</span>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>관련 링크</h2>
          <div className={styles.linksGrid}>
            <Link href="https://cafe.naver.com/blacknbiqa/483061" className={styles.linkButton} target="_blank">
              사이트 가이드 보러가기 <LinkIcon />
            </Link>
            <Link href="https://sky-children-of-the-light.fandom.com/wiki/Sky:_Children_of_the_Light_Wiki" className={styles.linkButton} target="_blank">
              스카이 위키 보러가기 <LinkIcon />
            </Link>
          </div>
        </div>
        
        <div className={styles.footer}>
          <p>관련 문의: i3295h@naver.com</p>
        </div>
      </div>
    </div>
  );
}