import { useState, useCallback, useRef } from 'react';

interface SpotDifferenceGameProps {
  onComplete: (score: number) => void;
  level?: number;
}

interface DiffArea {
  id: string;
  cx: number; cy: number; r: number;
  label: string;
}

interface SceneDef {
  id: number;
  title: string;
  diffs: DiffArea[];
  Orig: React.FC;
  Mod: React.FC;
}

// ─── 장면 1: 달밤 한옥 ────────────────────────────────────────
const S1_Orig: React.FC = () => (
  <svg viewBox="0 0 200 150" className="w-full h-full" style={{ display: 'block' }}>
    <rect width="200" height="150" fill="#1B2A6B" />
    {/* 달 - 원본: 노란색 */}
    <circle cx="165" cy="32" r="22" fill="#F9E44A" />
    <circle cx="157" cy="26" r="8" fill="#E8D03A" opacity="0.25" />
    {/* 별 4개 */}
    <circle cx="25" cy="18" r="2.5" fill="white" opacity="0.9" />
    <circle cx="55" cy="11" r="2" fill="white" opacity="0.8" />
    <circle cx="90" cy="8" r="2" fill="white" opacity="0.7" />
    <circle cx="40" cy="42" r="1.8" fill="white" opacity="0.7" />
    {/* 구름 - 원본: 있음 */}
    <ellipse cx="105" cy="25" rx="26" ry="11" fill="white" opacity="0.55" />
    <ellipse cx="118" cy="20" rx="16" ry="10" fill="white" opacity="0.45" />
    {/* 산 */}
    <path d="M-5 102 L48 55 L101 102Z" fill="#1E3A1E" />
    <path d="M65 102 L118 62 L171 102Z" fill="#253F25" />
    <path d="M145 102 L185 72 L225 102Z" fill="#1A351A" />
    {/* 땅 */}
    <rect y="102" width="200" height="48" fill="#3D2B1A" />
    {/* 지붕 */}
    <path d="M28 90 L100 60 L172 90Z" fill="#2C2C2C" />
    <path d="M23 92 L100 62 L177 92 L177 95 L23 95Z" fill="#3A3A3A" />
    <path d="M23 93 Q33 87 44 93" fill="none" stroke="#555" strokeWidth="1.2" />
    <path d="M156 93 Q165 87 177 93" fill="none" stroke="#555" strokeWidth="1.2" />
    {/* 벽 */}
    <rect x="38" y="93" width="124" height="37" fill="#C8A875" rx="1" />
    {/* 창문 */}
    <rect x="48" y="100" width="24" height="19" fill="#8B6914" rx="1" />
    <line x1="60" y1="100" x2="60" y2="119" stroke="#5C400A" strokeWidth="1" />
    <line x1="48" y1="109" x2="72" y2="109" stroke="#5C400A" strokeWidth="1" />
    <rect x="128" y="100" width="24" height="19" fill="#8B6914" rx="1" />
    <line x1="140" y1="100" x2="140" y2="119" stroke="#5C400A" strokeWidth="1" />
    <line x1="128" y1="109" x2="152" y2="109" stroke="#5C400A" strokeWidth="1" />
    {/* 문 */}
    <rect x="83" y="102" width="34" height="28" fill="#7A4E1F" rx="1" />
    <line x1="100" y1="102" x2="100" y2="130" stroke="#5A3A15" strokeWidth="1.5" />
    {/* 등불 - 원본: 빨강 */}
    <line x1="57" y1="80" x2="57" y2="85" stroke="#999" strokeWidth="1.5" />
    <ellipse cx="57" cy="90" rx="7" ry="9" fill="#E74C3C" />
    <ellipse cx="57" cy="89" rx="4.5" ry="3" fill="#FF7675" opacity="0.5" />
    <line x1="57" y1="99" x2="57" y2="103" stroke="#999" strokeWidth="1.5" />
    <line x1="143" y1="80" x2="143" y2="85" stroke="#999" strokeWidth="1.5" />
    <ellipse cx="143" cy="90" rx="7" ry="9" fill="#E74C3C" />
    <ellipse cx="143" cy="89" rx="4.5" ry="3" fill="#FF7675" opacity="0.5" />
    {/* 나무 - 원본: 초록 */}
    <rect x="15" y="92" width="7" height="20" fill="#5C3A1A" />
    <circle cx="18" cy="83" r="14" fill="#2D7A2D" />
    <circle cx="12" cy="89" r="9" fill="#267026" />
    <circle cx="24" cy="89" r="9" fill="#2D7A2D" />
    {/* 소나무 */}
    <rect x="178" y="92" width="5" height="20" fill="#5C3A1A" />
    <path d="M175 92 L180.5 74 L186 92Z" fill="#1A5C1A" />
    <path d="M173 84 L180.5 66 L188 84Z" fill="#236B23" />
  </svg>
);
const S1_Mod: React.FC = () => (
  <svg viewBox="0 0 200 150" className="w-full h-full" style={{ display: 'block' }}>
    <rect width="200" height="150" fill="#1B2A6B" />
    {/* 달 - 수정: 주황색 ★DIFF1 */}
    <circle cx="165" cy="32" r="22" fill="#FF8C00" />
    <circle cx="157" cy="26" r="8" fill="#E07000" opacity="0.25" />
    {/* 별 3개 (하나 없음) ★DIFF2 */}
    <circle cx="25" cy="18" r="2.5" fill="white" opacity="0.9" />
    <circle cx="55" cy="11" r="2" fill="white" opacity="0.8" />
    <circle cx="90" cy="8" r="2" fill="white" opacity="0.7" />
    {/* (40,42) 별 없음 */}
    {/* 구름 없음 ★DIFF3 */}
    <path d="M-5 102 L48 55 L101 102Z" fill="#1E3A1E" />
    <path d="M65 102 L118 62 L171 102Z" fill="#253F25" />
    <path d="M145 102 L185 72 L225 102Z" fill="#1A351A" />
    <rect y="102" width="200" height="48" fill="#3D2B1A" />
    <path d="M28 90 L100 60 L172 90Z" fill="#2C2C2C" />
    <path d="M23 92 L100 62 L177 92 L177 95 L23 95Z" fill="#3A3A3A" />
    <path d="M23 93 Q33 87 44 93" fill="none" stroke="#555" strokeWidth="1.2" />
    <path d="M156 93 Q165 87 177 93" fill="none" stroke="#555" strokeWidth="1.2" />
    <rect x="38" y="93" width="124" height="37" fill="#C8A875" rx="1" />
    <rect x="48" y="100" width="24" height="19" fill="#8B6914" rx="1" />
    <line x1="60" y1="100" x2="60" y2="119" stroke="#5C400A" strokeWidth="1" />
    <line x1="48" y1="109" x2="72" y2="109" stroke="#5C400A" strokeWidth="1" />
    <rect x="128" y="100" width="24" height="19" fill="#8B6914" rx="1" />
    <line x1="140" y1="100" x2="140" y2="119" stroke="#5C400A" strokeWidth="1" />
    <line x1="128" y1="109" x2="152" y2="109" stroke="#5C400A" strokeWidth="1" />
    <rect x="83" y="102" width="34" height="28" fill="#7A4E1F" rx="1" />
    <line x1="100" y1="102" x2="100" y2="130" stroke="#5A3A15" strokeWidth="1.5" />
    {/* 등불 - 수정: 파란색 ★DIFF4 */}
    <line x1="57" y1="80" x2="57" y2="85" stroke="#999" strokeWidth="1.5" />
    <ellipse cx="57" cy="90" rx="7" ry="9" fill="#3498DB" />
    <ellipse cx="57" cy="89" rx="4.5" ry="3" fill="#5DADE2" opacity="0.5" />
    <line x1="57" y1="99" x2="57" y2="103" stroke="#999" strokeWidth="1.5" />
    <line x1="143" y1="80" x2="143" y2="85" stroke="#999" strokeWidth="1.5" />
    <ellipse cx="143" cy="90" rx="7" ry="9" fill="#E74C3C" />
    <ellipse cx="143" cy="89" rx="4.5" ry="3" fill="#FF7675" opacity="0.5" />
    {/* 나무 - 수정: 단풍(주황) ★DIFF5 */}
    <rect x="15" y="92" width="7" height="20" fill="#5C3A1A" />
    <circle cx="18" cy="83" r="14" fill="#E67E22" />
    <circle cx="12" cy="89" r="9" fill="#D35400" />
    <circle cx="24" cy="89" r="9" fill="#E67E22" />
    <rect x="178" y="92" width="5" height="20" fill="#5C3A1A" />
    <path d="M175 92 L180.5 74 L186 92Z" fill="#1A5C1A" />
    <path d="M173 84 L180.5 66 L188 84Z" fill="#236B23" />
  </svg>
);

// ─── 장면 2: 봄 정원 ─────────────────────────────────────────
const S2_Orig: React.FC = () => (
  <svg viewBox="0 0 200 150" className="w-full h-full" style={{ display: 'block' }}>
    <rect width="200" height="150" fill="#87CEEB" />
    {/* 해 - 원본: 있음 */}
    <circle cx="170" cy="28" r="20" fill="#FFD700" />
    <line x1="170" y1="4" x2="170" y2="12" stroke="#FFD700" strokeWidth="2.5" />
    <line x1="192" y1="10" x2="186" y2="16" stroke="#FFD700" strokeWidth="2.5" />
    <line x1="194" y1="28" x2="186" y2="28" stroke="#FFD700" strokeWidth="2.5" />
    {/* 구름 */}
    <ellipse cx="60" cy="22" rx="28" ry="12" fill="white" opacity="0.85" />
    <ellipse cx="75" cy="17" rx="18" ry="11" fill="white" opacity="0.8" />
    {/* 땅 */}
    <rect y="110" width="200" height="40" fill="#5C8C3A" />
    <rect y="122" width="200" height="28" fill="#8B6914" />
    {/* 잔디 */}
    <rect y="108" width="200" height="6" fill="#6BAF42" />
    {/* 벚꽃 나무 - 원본: 분홍 */}
    <rect x="88" y="75" width="10" height="40" fill="#7A4E1F" rx="2" />
    <path d="M70 75 Q93 40 116 75Z" fill="#2D5A1E" />
    <circle cx="93" cy="58" r="28" fill="#FF9EC4" opacity="0.85" />
    <circle cx="80" cy="65" r="18" fill="#FF85B5" opacity="0.75" />
    <circle cx="107" cy="62" r="20" fill="#FFB0D0" opacity="0.8" />
    {/* 꽃잎들 */}
    {[70,78,86,94,102,110,118].map((x,i) => (
      <circle key={i} cx={x} cy={78 + (i%3)*3} r="3" fill="#FFB6C1" opacity="0.7" />
    ))}
    {/* 울타리 - 원본: 기둥 5개 */}
    {[15,38,61,84,107].map((x,i) => (
      <g key={i}>
        <rect x={x} y="98" width="6" height="22" fill="#C8A87A" rx="1" />
        <polygon points={`${x},98 ${x+3},92 ${x+6},98`} fill="#C8A87A" />
      </g>
    ))}
    <rect x="15" y="110" width="98" height="4" fill="#C8A87A" rx="1" />
    <rect x="15" y="118" width="98" height="4" fill="#C8A87A" rx="1" />
    {/* 꽃 - 빨간색 */}
    <circle cx="145" cy="107" r="8" fill="#E74C3C" />
    <circle cx="133" cy="107" r="6" fill="#E74C3C" opacity="0.8" />
    <circle cx="157" cy="107" r="6" fill="#E74C3C" opacity="0.8" />
    <circle cx="145" cy="97" r="5" fill="#E74C3C" opacity="0.7" />
    <circle cx="145" cy="117" r="5" fill="#E74C3C" opacity="0.7" />
    <circle cx="145" cy="107" r="4" fill="#FFD700" />
    {/* 나비 - 원본: 있음 */}
    <ellipse cx="162" cy="88" rx="8" ry="5" fill="#FF69B4" opacity="0.85" transform="rotate(-20,162,88)" />
    <ellipse cx="172" cy="86" rx="8" ry="5" fill="#FF69B4" opacity="0.85" transform="rotate(20,172,86)" />
    <line x1="167" y1="87" x2="167" y2="93" stroke="#333" strokeWidth="1" />
    {/* 연못 */}
    <ellipse cx="40" cy="122" rx="28" ry="10" fill="#4A90D9" opacity="0.7" />
    <ellipse cx="40" cy="122" rx="20" ry="6" fill="#5BA8F5" opacity="0.5" />
  </svg>
);
const S2_Mod: React.FC = () => (
  <svg viewBox="0 0 200 150" className="w-full h-full" style={{ display: 'block' }}>
    <rect width="200" height="150" fill="#87CEEB" />
    {/* 해 - 수정: 없음 ★DIFF1 */}
    <ellipse cx="60" cy="22" rx="28" ry="12" fill="white" opacity="0.85" />
    <ellipse cx="75" cy="17" rx="18" ry="11" fill="white" opacity="0.8" />
    <rect y="110" width="200" height="40" fill="#5C8C3A" />
    <rect y="122" width="200" height="28" fill="#8B6914" />
    <rect y="108" width="200" height="6" fill="#6BAF42" />
    {/* 벚꽃 나무 - 수정: 흰색 ★DIFF2 */}
    <rect x="88" y="75" width="10" height="40" fill="#7A4E1F" rx="2" />
    <path d="M70 75 Q93 40 116 75Z" fill="#2D5A1E" />
    <circle cx="93" cy="58" r="28" fill="#FFFFFF" opacity="0.85" />
    <circle cx="80" cy="65" r="18" fill="#F0F0F0" opacity="0.75" />
    <circle cx="107" cy="62" r="20" fill="#FAFAFA" opacity="0.8" />
    {[70,78,86,94,102,110,118].map((x,i) => (
      <circle key={i} cx={x} cy={78 + (i%3)*3} r="3" fill="#E0E0E0" opacity="0.7" />
    ))}
    {/* 울타리 - 수정: 기둥 4개 (하나 없음) ★DIFF3 */}
    {[15,44,73,102].map((x,i) => (
      <g key={i}>
        <rect x={x} y="98" width="6" height="22" fill="#C8A87A" rx="1" />
        <polygon points={`${x},98 ${x+3},92 ${x+6},98`} fill="#C8A87A" />
      </g>
    ))}
    <rect x="15" y="110" width="93" height="4" fill="#C8A87A" rx="1" />
    <rect x="15" y="118" width="93" height="4" fill="#C8A87A" rx="1" />
    {/* 꽃 - 노란색 ★DIFF4 */}
    <circle cx="145" cy="107" r="8" fill="#F1C40F" />
    <circle cx="133" cy="107" r="6" fill="#F1C40F" opacity="0.8" />
    <circle cx="157" cy="107" r="6" fill="#F1C40F" opacity="0.8" />
    <circle cx="145" cy="97" r="5" fill="#F1C40F" opacity="0.7" />
    <circle cx="145" cy="117" r="5" fill="#F1C40F" opacity="0.7" />
    <circle cx="145" cy="107" r="4" fill="#E67E22" />
    {/* 나비 - 수정: 없음 ★DIFF5 */}
    <ellipse cx="40" cy="122" rx="28" ry="10" fill="#4A90D9" opacity="0.7" />
    <ellipse cx="40" cy="122" rx="20" ry="6" fill="#5BA8F5" opacity="0.5" />
  </svg>
);

// ─── 장면 3: 마을 풍경 ────────────────────────────────────────
const S3_Orig: React.FC = () => (
  <svg viewBox="0 0 200 150" className="w-full h-full" style={{ display: 'block' }}>
    <rect width="200" height="150" fill="#E8F4F8" />
    {/* 하늘 구름 */}
    <ellipse cx="40" cy="25" rx="25" ry="11" fill="white" opacity="0.9" />
    <ellipse cx="55" cy="20" rx="18" ry="10" fill="white" opacity="0.85" />
    <ellipse cx="150" cy="30" rx="22" ry="9" fill="white" opacity="0.8" />
    {/* 땅 */}
    <rect y="120" width="200" height="30" fill="#8B7355" />
    <rect y="118" width="200" height="5" fill="#9C8B5E" />
    {/* 큰 건물(상점) */}
    <rect x="10" y="55" width="85" height="70" fill="#C8A875" rx="2" />
    {/* 지붕 - 원본: 붉은 갈색 */}
    <path d="M5 58 L52 35 L100 58Z" fill="#8B3A3A" />
    <path d="M3 60 L52 37 L102 60 L102 63 L3 63Z" fill="#A04040" />
    {/* 굴뚝 + 연기 - 원본: 연기 있음 */}
    <rect x="62" y="30" width="10" height="18" fill="#666" rx="1" />
    <ellipse cx="67" cy="27" rx="6" ry="8" fill="#AAAAAA" opacity="0.6" />
    <ellipse cx="70" cy="20" rx="5" ry="7" fill="#CCCCCC" opacity="0.4" />
    <ellipse cx="65" cy="13" rx="4" ry="6" fill="#DDDDDD" opacity="0.3" />
    {/* 상점 창문 */}
    <rect x="18" y="68" width="28" height="22" fill="#7AB8E8" rx="1" />
    <line x1="32" y1="68" x2="32" y2="90" stroke="#5090C0" strokeWidth="1" />
    <line x1="18" y1="79" x2="46" y2="79" stroke="#5090C0" strokeWidth="1" />
    {/* 문 */}
    <rect x="55" y="88" width="28" height="37" fill="#7A4E1F" rx="1" />
    <circle cx="61" cy="107" r="2.5" fill="#FFD700" />
    {/* 간판 - 원본: 빨간색 */}
    <rect x="15" y="57" width="65" height="14" fill="#E74C3C" rx="2" />
    <text x="47" y="68" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">시장</text>
    {/* 새 - 원본: 3마리 */}
    <path d="M115 28 Q118 24 121 28" fill="none" stroke="#555" strokeWidth="1.5" />
    <path d="M128 22 Q131 18 134 22" fill="none" stroke="#555" strokeWidth="1.5" />
    <path d="M140 30 Q143 26 146 30" fill="none" stroke="#555" strokeWidth="1.5" />
    {/* 작은 건물 */}
    <rect x="110" y="75" width="80" height="50" fill="#D4B896" rx="2" />
    <path d="M105 78 L150 55 L195 78Z" fill="#6B8E6B" />
    <path d="M103 80 L150 57 L197 80 L197 83 L103 83Z" fill="#7DA07D" />
    {/* 작은 건물 창문 */}
    <rect x="118" y="88" width="20" height="18" fill="#7AB8E8" rx="1" />
    <rect x="152" y="88" width="20" height="18" fill="#7AB8E8" rx="1" />
    <line x1="128" y1="88" x2="128" y2="106" stroke="#5090C0" strokeWidth="1" />
    <line x1="162" y1="88" x2="162" y2="106" stroke="#5090C0" strokeWidth="1" />
    {/* 나무 */}
    <rect x="96" y="95" width="6" height="28" fill="#5C3A1A" />
    <circle cx="99" cy="87" r="14" fill="#3A7A3A" />
  </svg>
);
const S3_Mod: React.FC = () => (
  <svg viewBox="0 0 200 150" className="w-full h-full" style={{ display: 'block' }}>
    <rect width="200" height="150" fill="#E8F4F8" />
    <ellipse cx="40" cy="25" rx="25" ry="11" fill="white" opacity="0.9" />
    <ellipse cx="55" cy="20" rx="18" ry="10" fill="white" opacity="0.85" />
    <ellipse cx="150" cy="30" rx="22" ry="9" fill="white" opacity="0.8" />
    <rect y="120" width="200" height="30" fill="#8B7355" />
    <rect y="118" width="200" height="5" fill="#9C8B5E" />
    <rect x="10" y="55" width="85" height="70" fill="#C8A875" rx="2" />
    {/* 지붕 - 수정: 초록색 ★DIFF1 */}
    <path d="M5 58 L52 35 L100 58Z" fill="#3A6B3A" />
    <path d="M3 60 L52 37 L102 60 L102 63 L3 63Z" fill="#4A804A" />
    {/* 굴뚝 연기 없음 ★DIFF2 */}
    <rect x="62" y="30" width="10" height="18" fill="#666" rx="1" />
    <rect x="18" y="68" width="28" height="22" fill="#7AB8E8" rx="1" />
    <line x1="32" y1="68" x2="32" y2="90" stroke="#5090C0" strokeWidth="1" />
    <line x1="18" y1="79" x2="46" y2="79" stroke="#5090C0" strokeWidth="1" />
    <rect x="55" y="88" width="28" height="37" fill="#7A4E1F" rx="1" />
    <circle cx="61" cy="107" r="2.5" fill="#FFD700" />
    {/* 간판 - 수정: 파란색 ★DIFF3 */}
    <rect x="15" y="57" width="65" height="14" fill="#2980B9" rx="2" />
    <text x="47" y="68" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">시장</text>
    {/* 새 - 수정: 2마리 ★DIFF4 */}
    <path d="M115 28 Q118 24 121 28" fill="none" stroke="#555" strokeWidth="1.5" />
    <path d="M128 22 Q131 18 134 22" fill="none" stroke="#555" strokeWidth="1.5" />
    {/* 세번째 새 없음 */}
    <rect x="110" y="75" width="80" height="50" fill="#D4B896" rx="2" />
    {/* 지붕 - 수정: 파란색 ★DIFF5 */}
    <path d="M105 78 L150 55 L195 78Z" fill="#4A5E8E" />
    <path d="M103 80 L150 57 L197 80 L197 83 L103 83Z" fill="#5A6EA0" />
    <rect x="118" y="88" width="20" height="18" fill="#7AB8E8" rx="1" />
    <rect x="152" y="88" width="20" height="18" fill="#7AB8E8" rx="1" />
    <line x1="128" y1="88" x2="128" y2="106" stroke="#5090C0" strokeWidth="1" />
    <line x1="162" y1="88" x2="162" y2="106" stroke="#5090C0" strokeWidth="1" />
    <rect x="96" y="95" width="6" height="28" fill="#5C3A1A" />
    <circle cx="99" cy="87" r="14" fill="#3A7A3A" />
  </svg>
);

// ─── 장면 정의 ──────────────────────────────────────────────
const SCENES: SceneDef[] = [
  {
    id: 1, title: '달밤 한옥',
    diffs: [
      { id: 'moon',    cx: 165, cy: 32,  r: 28, label: '달 색깔' },
      { id: 'star',    cx: 40,  cy: 42,  r: 20, label: '별 하나' },
      { id: 'cloud',   cx: 107, cy: 23,  r: 32, label: '구름' },
      { id: 'lantern', cx: 57,  cy: 90,  r: 20, label: '등불 색깔' },
      { id: 'tree',    cx: 18,  cy: 84,  r: 22, label: '나뭇잎 색깔' },
    ],
    Orig: S1_Orig, Mod: S1_Mod,
  },
  {
    id: 2, title: '봄날 정원',
    diffs: [
      { id: 'sun',      cx: 170, cy: 28,  r: 28, label: '해' },
      { id: 'blossom',  cx: 93,  cy: 62,  r: 34, label: '꽃 색깔' },
      { id: 'fence',    cx: 63,  cy: 108, r: 30, label: '울타리 기둥 수' },
      { id: 'flower',   cx: 145, cy: 107, r: 22, label: '꽃 색깔' },
      { id: 'butterfly',cx: 167, cy: 87,  r: 22, label: '나비' },
    ],
    Orig: S2_Orig, Mod: S2_Mod,
  },
  {
    id: 3, title: '마을 풍경',
    diffs: [
      { id: 'roof1',  cx: 52,  cy: 50,  r: 32, label: '큰 건물 지붕 색' },
      { id: 'smoke',  cx: 67,  cy: 22,  r: 22, label: '굴뚝 연기' },
      { id: 'sign',   cx: 47,  cy: 64,  r: 22, label: '간판 색깔' },
      { id: 'birds',  cx: 143, cy: 28,  r: 22, label: '새 수' },
      { id: 'roof2',  cx: 150, cy: 68,  r: 32, label: '작은 건물 지붕 색' },
    ],
    Orig: S3_Orig, Mod: S3_Mod,
  },
];

// ─── 메인 컴포넌트 ───────────────────────────────────────────
export default function SpotDifferenceGame({ onComplete, level = 1 }: SpotDifferenceGameProps) {
  const DIFF_COUNT = Math.min(3 + Math.floor(level / 3), 5);
  const TIME_LIMIT = Math.max(45, 90 - level * 4);
  const HINT_COST = 15;

  const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready');
  const [scene, setScene]  = useState<SceneDef>(SCENES[0]);
  const [activeDiffs, setActiveDiffs] = useState<DiffArea[]>([]);
  const [foundIds, setFoundIds]       = useState<Set<string>>(new Set());
  const [wrongFlash, setWrongFlash]   = useState<{ x: number; y: number } | null>(null);
  const [wrongCount, setWrongCount]   = useState(0);
  const [timeLeft, setTimeLeft]       = useState(TIME_LIMIT);
  const [cleared, setCleared]         = useState(false);
  const [elapsed, setElapsed]         = useState(0);
  const [hintActive, setHintActive]   = useState<DiffArea | null>(null);
  const [hintCount, setHintCount]     = useState(0);
  const [coins, setCoins]             = useState(40);
  const startRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startGame = useCallback(() => {
    const picked = SCENES[Math.floor(Math.random() * SCENES.length)];
    // 레벨에 맞게 diff 선택 (앞에서부터 DIFF_COUNT개)
    const diffs = picked.diffs.slice(0, DIFF_COUNT);
    setScene(picked);
    setActiveDiffs(diffs);
    setFoundIds(new Set());
    setWrongFlash(null);
    setWrongCount(0);
    setTimeLeft(TIME_LIMIT);
    setCleared(false);
    setElapsed(0);
    setHintActive(null);
    setHintCount(0);
    setCoins(40);
    startRef.current = Date.now();
    setPhase('playing');

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          stopTimer();
          setElapsed(Math.round((Date.now() - startRef.current) / 1000));
          setPhase('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [DIFF_COUNT, TIME_LIMIT, stopTimer]);

  // 오른쪽 SVG 클릭 처리
  const handleModClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (phase !== 'playing' || cleared) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width)  * 200;
    const svgY = ((e.clientY - rect.top)  / rect.height) * 150;

    // 미발견 diff 히트 체크
    for (const d of activeDiffs) {
      if (foundIds.has(d.id)) continue;
      const dx = svgX - d.cx;
      const dy = svgY - d.cy;
      if (Math.sqrt(dx * dx + dy * dy) <= d.r) {
        const next = new Set(foundIds);
        next.add(d.id);
        setFoundIds(next);
        if (next.size === activeDiffs.length) {
          stopTimer();
          setCleared(true);
          setElapsed(Math.round((Date.now() - startRef.current) / 1000));
          setTimeout(() => setPhase('result'), 800);
        }
        return;
      }
    }
    // 오답
    setWrongCount(w => w + 1);
    setWrongFlash({ x: svgX, y: svgY });
    setTimeout(() => setWrongFlash(null), 600);
  }, [phase, cleared, foundIds, activeDiffs, stopTimer]);

  // 힌트 버튼
  const handleHint = useCallback(() => {
    if (coins < HINT_COST) return;
    const unfound = activeDiffs.filter(d => !foundIds.has(d.id));
    if (unfound.length === 0) return;
    const pick = unfound[Math.floor(Math.random() * unfound.length)];
    setCoins(c => c - HINT_COST);
    setHintCount(h => h + 1);
    setHintActive(pick);
    setTimeout(() => setHintActive(null), 2500);
  }, [coins, activeDiffs, foundIds, HINT_COST]);

  // 결과 점수
  const calcScore = () => {
    const found = foundIds.size;
    const base  = found * 18;
    const tBonus = Math.max(0, timeLeft) * 0.5;
    const wPen   = wrongCount * 3;
    const hPen   = hintCount * 5;
    return Math.max(0, Math.round(base + tBonus - wPen - hPen));
  };

  // ── 준비 화면 ─────────────────────────────────────────────
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-5 p-4 text-center">
        <div className="text-6xl">🔍</div>
        <h2 className="text-2xl font-black text-joseon-dark">틀린그림 찾기</h2>
        <div className="card-joseon p-4 text-sm text-joseon-brown max-w-xs space-y-2">
          <p className="font-bold">두 그림을 비교해서 다른 부분을 찾아 클릭!</p>
          <div className="flex justify-center gap-4 text-xs pt-1">
            <span>🎯 차이 {DIFF_COUNT}개</span>
            <span>⏱ {TIME_LIMIT}초</span>
            <span>💡 힌트 {HINT_COST}🪙</span>
          </div>
        </div>
        <button onClick={startGame} className="btn-joseon px-10 py-4 text-lg">
          시작! 🔍
        </button>
      </div>
    );
  }

  // ── 결과 화면 ─────────────────────────────────────────────
  if (phase === 'result') {
    const found  = foundIds.size;
    const total  = activeDiffs.length;
    const score  = calcScore();
    const reward = Math.max(5, Math.round(score / 5));
    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <div className="text-6xl">
          {found === total ? '🏆' : found >= total / 2 ? '🎉' : '😅'}
        </div>
        <h2 className="text-2xl font-black text-joseon-dark">완료!</h2>
        <div className="text-joseon-brown text-base font-bold">
          🖼 {scene.title}
        </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="text-2xl font-black text-green-600">{found}/{total}</div>
            <div className="text-xs text-green-700">찾은 개수</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-2xl font-black text-blue-600">{elapsed}초</div>
            <div className="text-xs text-blue-700">소요 시간</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="text-2xl font-black text-red-500">{wrongCount}회</div>
            <div className="text-xs text-red-700">오답 클릭</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
            <div className="text-2xl font-black text-purple-600">{hintCount}회</div>
            <div className="text-xs text-purple-700">힌트 사용</div>
          </div>
        </div>
        <div className="card-joseon p-3 font-bold text-joseon-dark">
          획득 엽전: 🪙 {reward}개
        </div>
        <button onClick={() => onComplete(reward)} className="btn-joseon px-10 py-4">
          계속하기 →
        </button>
      </div>
    );
  }

  // ── 게임 화면 ─────────────────────────────────────────────
  const found = foundIds.size;
  const { Orig, Mod } = scene;
  const timerPct   = (timeLeft / TIME_LIMIT) * 100;
  const timerColor = timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 20 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="flex flex-col items-center gap-2 p-2 w-full select-none">

      {/* HUD */}
      <div className="w-full space-y-1">
        <div className="flex justify-between items-center text-xs font-bold text-joseon-brown px-1">
          <span>🔍 {found}/{activeDiffs.length}</span>
          <span className="font-black text-joseon-dark">{scene.title}</span>
          <span className={timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''}>⏱ {timeLeft}초</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className={`${timerColor} h-1.5 rounded-full transition-all duration-1000`}
            style={{ width: `${timerPct}%` }} />
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-joseon-gold h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(found / activeDiffs.length) * 100}%` }} />
        </div>
      </div>

      {/* 힌트 + 오답 */}
      <div className="flex justify-between items-center w-full px-1">
        <button
          onClick={handleHint}
          disabled={coins < HINT_COST || activeDiffs.every(d => foundIds.has(d.id))}
          className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
            coins >= HINT_COST
              ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 active:scale-95'
              : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          💡 힌트 ({HINT_COST}🪙)
        </button>
        <span className="text-xs text-joseon-brown">🪙 {coins}</span>
        <span className="text-xs text-red-500 font-bold">❌ 오답 {wrongCount}회</span>
      </div>

      {/* 이미지 두 장 나란히 */}
      <div className="flex gap-1.5 w-full items-start">

        {/* 원본 (왼쪽) */}
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-[10px] font-black text-joseon-brown bg-joseon-gold/20 px-2 py-0.5 rounded-full">
            원본
          </span>
          <div className="w-full rounded-xl overflow-hidden border-2 border-joseon-brown/30 shadow-sm">
            <Orig />
          </div>
        </div>

        {/* 구분선 */}
        <div className="flex flex-col items-center justify-center shrink-0 pt-5">
          <div className="h-24 w-px bg-joseon-brown/20" />
          <span className="text-[9px] text-joseon-brown/40 py-1">vs</span>
          <div className="h-24 w-px bg-joseon-brown/20" />
        </div>

        {/* 찾기 (오른쪽, 클릭 가능) */}
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-[10px] font-black text-joseon-red bg-joseon-red/10 px-2 py-0.5 rounded-full">
            찾기 (클릭!)
          </span>
          <div className="w-full rounded-xl overflow-hidden border-2 border-joseon-red/40 shadow-sm relative">
            <svg
              viewBox="0 0 200 150"
              className="w-full h-full cursor-crosshair"
              style={{ display: 'block' }}
              onClick={handleModClick}
            >
              <Mod />

              {/* 찾은 위치 표시 */}
              {activeDiffs.filter(d => foundIds.has(d.id)).map(d => (
                <g key={d.id}>
                  <circle cx={d.cx} cy={d.cy} r={d.r} fill="rgba(34,197,94,0.25)"
                    stroke="#16a34a" strokeWidth="2" />
                  <text x={d.cx} y={d.cy + 4} textAnchor="middle"
                    fontSize="12" fill="#16a34a" fontWeight="bold">✓</text>
                </g>
              ))}

              {/* 오답 클릭 표시 */}
              {wrongFlash && (
                <circle cx={wrongFlash.x} cy={wrongFlash.y} r="14"
                  fill="rgba(239,68,68,0.3)" stroke="#ef4444" strokeWidth="2" />
              )}

              {/* 힌트 표시 (맥박 효과) */}
              {hintActive && !foundIds.has(hintActive.id) && (
                <g>
                  <circle cx={hintActive.cx} cy={hintActive.cy} r={hintActive.r}
                    fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth="2.5"
                    strokeDasharray="5,3">
                    <animate attributeName="r" values={`${hintActive.r};${hintActive.r + 6};${hintActive.r}`}
                      dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.4;0.8"
                      dur="0.8s" repeatCount="indefinite" />
                  </circle>
                  <text x={hintActive.cx} y={hintActive.cy + 4} textAnchor="middle"
                    fontSize="11" fill="#3b82f6" fontWeight="bold">?</text>
                </g>
              )}
            </svg>

            {/* 클리어 오버레이 */}
            {cleared && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center rounded-xl">
                <span className="text-2xl font-black text-green-700">✨ 완료!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 차이 목록 */}
      <div className="flex flex-wrap gap-1 justify-center w-full px-1">
        {activeDiffs.map(d => (
          <span key={d.id} className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
            foundIds.has(d.id)
              ? 'bg-green-100 border-green-400 text-green-700 line-through'
              : 'bg-gray-100 border-gray-300 text-gray-500'
          }`}>
            {foundIds.has(d.id) ? '✓ ' : ''}{d.label}
          </span>
        ))}
      </div>

    </div>
  );
}
