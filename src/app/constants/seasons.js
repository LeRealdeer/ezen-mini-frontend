// constants/seasons.js
export const SEASON_LIST = [
  { name: "감사", color: "#FFD700" },
  { name: "빛추", color: "#FF6347" },
  { name: "친밀", color: "#4CAF50" },
  { name: "리듬", color: "#3F51B5" },
  { name: "마법", color: "#9C27B0" },
  { name: "낙원", color: "#FF5722" },
  { name: "예언", color: "#9E9E9E" },
  { name: "꿈", color: "#00BCD4" },
  { name: "협력", color: "#8BC34A" },
  { name: "어린왕자", color: "#FFC107" },
  { name: "비행", color: "#03A9F4" },
  { name: "심해", color: "#2196F3" },
  { name: "공연", color: "#FF4081" },
  { name: "파편", color: "#607D8B" },
  { name: "오로라", color: "#673AB7" },
  { name: "기억", color: "#009688" },
  { name: "성장", color: "#8BC34A" },
  { name: "순간", color: "#FF9800" },
  { name: "재생", color: "#3F51B5" },
  { name: "사슴", color: "#A1887F" },
  { name: "보금자리", color: "#795548" },
  { name: "듀엣", color: "#FFEB3B" },
  { name: "무민", color: "#CDDC39" },
  { name: "광채", color: "#FF1493" },
  { name: "파랑새", color: "#1E90FF" },
  { name: "불씨", color: "#FF4500" },
];

// 시즌 이름으로 색상 찾기 헬퍼 함수
export const getSeasonColor = (seasonName) => {
  const season = SEASON_LIST.find(s => s.name === seasonName);
  return season ? season.color : "#888888";
};