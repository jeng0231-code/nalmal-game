import type { CharacterConfig } from '../../types/character';
import { SKIN_COLORS, HAIR_COLORS, OUTFIT_COLORS, BG_COLORS } from '../../types/character';

// ─── 색상 헬퍼 ────────────────────────────────────────────
function hex2rgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function darken(hex: string, amt = 30): string {
  const { r, g, b } = hex2rgb(hex);
  const c = (v: number) => Math.max(0, v - amt).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
function lighten(hex: string, amt = 30): string {
  const { r, g, b } = hex2rgb(hex);
  const c = (v: number) => Math.min(255, v + amt).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

interface Props {
  config: CharacterConfig;
  size?: number;
}

// ─── 얼굴 형태 ────────────────────────────────────────────
function Face({ shape, skin }: { shape: CharacterConfig['faceShape']; skin: string }) {
  const shadow = darken(skin, 18);
  if (shape === 'round') return (
    <g>
      <circle cx="80" cy="74" r="39" fill={shadow} />
      <circle cx="80" cy="72" r="38" fill={skin} />
      <circle cx="43" cy="76" r="11" fill={skin} />
      <circle cx="117" cy="76" r="11" fill={skin} />
      <circle cx="43" cy="77" r="7"  fill={shadow} opacity="0.35" />
      <circle cx="117" cy="77" r="7" fill={shadow} opacity="0.35" />
    </g>
  );
  if (shape === 'oval') return (
    <g>
      <ellipse cx="80" cy="75" rx="34" ry="44" fill={shadow} />
      <ellipse cx="80" cy="73" rx="33" ry="43" fill={skin} />
      <circle cx="48" cy="76" r="9"  fill={skin} />
      <circle cx="112" cy="76" r="9" fill={skin} />
      <circle cx="48" cy="77" r="6"  fill={shadow} opacity="0.35" />
      <circle cx="112" cy="77" r="6" fill={shadow} opacity="0.35" />
    </g>
  );
  if (shape === 'angular') return (
    <g>
      <path d="M44,44 Q80,34 116,44 L120,90 Q108,114 80,116 Q52,114 40,90 Z" fill={shadow} />
      <path d="M44,42 Q80,32 116,42 L120,88 Q108,112 80,114 Q52,112 40,88 Z" fill={skin} />
      <path d="M40,76 Q36,80 40,88" fill={skin} />
      <path d="M120,76 Q124,80 120,88" fill={skin} />
    </g>
  );
  // soft
  return (
    <g>
      <ellipse cx="80" cy="73" rx="37" ry="40" fill={shadow} />
      <ellipse cx="80" cy="71" rx="36" ry="39" fill={skin} />
      <ellipse cx="44" cy="74" rx="10" ry="11" fill={skin} />
      <ellipse cx="116" cy="74" rx="10" ry="11" fill={skin} />
      <ellipse cx="44" cy="75" rx="7" ry="7" fill={shadow} opacity="0.3" />
      <ellipse cx="116" cy="75" rx="7" ry="7" fill={shadow} opacity="0.3" />
    </g>
  );
}

// ─── 눈 ──────────────────────────────────────────────────
function Eyes({ style, eyeColor }: { style: CharacterConfig['eyeStyle']; eyeColor: string }) {
  const lx = 62; const rx = 98; const ey = 68;
  const pupil = darken(eyeColor, 40);

  if (style === 'round') return (
    <g>
      {[lx, rx].map((cx, i) => (
        <g key={i}>
          <ellipse cx={cx} cy={ey} rx="9" ry="10" fill="white" />
          <circle  cx={cx} cy={ey} r="6"  fill={eyeColor} />
          <circle  cx={cx} cy={ey} r="3"  fill={pupil} />
          <circle  cx={cx + 3} cy={ey - 3} r="2.5" fill="white" />
          <circle  cx={cx - 2} cy={ey - 1} r="1.2" fill="white" opacity="0.5" />
        </g>
      ))}
    </g>
  );
  if (style === 'sharp') return (
    <g>
      {[lx, rx].map((cx, i) => (
        <g key={i}>
          <path d={`M${cx - 9},${ey} Q${cx},${ey - 9} ${cx + 9},${ey} Q${cx},${ey + 5} ${cx - 9},${ey} Z`} fill="white" />
          <ellipse cx={cx} cy={ey} rx="5" ry="5" fill={eyeColor} />
          <ellipse cx={cx} cy={ey} rx="2.5" ry="2.5" fill={pupil} />
          <circle  cx={cx + 2} cy={ey - 2} r="2" fill="white" />
        </g>
      ))}
    </g>
  );
  if (style === 'droopy') return (
    <g>
      {[lx, rx].map((cx, i) => (
        <g key={i}>
          <ellipse cx={cx} cy={ey + 1} rx="9" ry="8" fill="white" />
          <path d={`M${cx - 9},${ey} Q${cx - 4},${ey - 3} ${cx + 9},${ey + 2}`} fill="none" stroke="#333" strokeWidth="1.5" />
          <circle cx={cx} cy={ey + 1} r="5" fill={eyeColor} />
          <circle cx={cx} cy={ey + 1} r="2.5" fill={pupil} />
          <circle cx={cx + 2} cy={ey - 1} r="2" fill="white" />
        </g>
      ))}
    </g>
  );
  // sparkle
  return (
    <g>
      {[lx, rx].map((cx, i) => (
        <g key={i}>
          <ellipse cx={cx} cy={ey} rx="10" ry="11" fill="white" />
          <circle  cx={cx} cy={ey} r="6.5" fill={eyeColor} />
          <circle  cx={cx} cy={ey} r="3.5" fill={pupil} />
          <circle  cx={cx + 3} cy={ey - 4} r="3"   fill="white" />
          <circle  cx={cx - 3} cy={ey + 3} r="1.5" fill="white" opacity="0.7" />
          {/* 별 하이라이트 */}
          <path d={`M${cx},${ey - 8} L${cx + 1},${ey - 5} L${cx + 4},${ey - 5} L${cx + 2},${ey - 3} L${cx + 3},${ey} L${cx},${ey - 2} L${cx - 3},${ey} L${cx - 2},${ey - 3} L${cx - 4},${ey - 5} L${cx - 1},${ey - 5} Z`}
            fill="white" opacity="0.4" transform={`scale(0.5) translate(${cx},${ey - 8})`} />
        </g>
      ))}
    </g>
  );
}

// ─── 눈썹 ─────────────────────────────────────────────────
function Eyebrows({ eyeStyle, hairColor }: { eyeStyle: CharacterConfig['eyeStyle']; hairColor: string }) {
  const lx = 62; const rx = 98; const by = 57;
  const c = lighten(hairColor, -10);

  if (eyeStyle === 'sharp') return (
    <g>
      <path d={`M${lx - 9},${by} L${lx + 9},${by - 4}`} stroke={c} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d={`M${rx - 9},${by - 4} L${rx + 9},${by}`} stroke={c} strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  );
  if (eyeStyle === 'droopy') return (
    <g>
      <path d={`M${lx - 9},${by - 3} Q${lx},${by} ${lx + 9},${by + 1}`} stroke={c} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d={`M${rx - 9},${by + 1} Q${rx},${by} ${rx + 9},${by - 3}`} stroke={c} strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  );
  return (
    <g>
      <path d={`M${lx - 9},${by} Q${lx},${by - 5} ${lx + 9},${by}`} stroke={c} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d={`M${rx - 9},${by} Q${rx},${by - 5} ${rx + 9},${by}`} stroke={c} strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  );
}

// ─── 입 ──────────────────────────────────────────────────
function Mouth({ style }: { style: CharacterConfig['mouthStyle'] }) {
  const my = 90;
  if (style === 'smile') return (
    <g>
      <path d="M67,90 Q80,100 93,90" stroke="#FF6B8A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  );
  if (style === 'grin') return (
    <g>
      <path d="M65,89 Q80,102 95,89" fill="#FF4466" />
      <path d="M67,89 Q80,99 93,89" fill="white" />
      <path d="M65,89 Q80,102 95,89" stroke="#FF4466" strokeWidth="1" fill="none" />
    </g>
  );
  if (style === 'neutral') return (
    <line x1="68" y1={my} x2="92" y2={my} stroke="#CC6688" strokeWidth="2.5" strokeLinecap="round" />
  );
  // pout
  return (
    <path d="M68,92 Q80,85 92,92" stroke="#FF6B8A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  );
}

// ─── 볼터치 ───────────────────────────────────────────────
function Cheeks() {
  return (
    <g>
      <ellipse cx="54" cy="83" rx="11" ry="7" fill="#FF9999" opacity="0.32" />
      <ellipse cx="106" cy="83" rx="11" ry="7" fill="#FF9999" opacity="0.32" />
    </g>
  );
}

// ─── 머리카락 ─────────────────────────────────────────────
function Hair({ style, color }: { style: CharacterConfig['hairStyle']; color: string }) {
  const dark = darken(color, 20);

  // 공통: 이마 가림 레이어 (모든 스타일에 적용)
  const FrontCap = () => (
    <path d="M42,72 Q44,25 80,22 Q116,25 118,72 Q100,50 80,48 Q60,50 42,72 Z" fill={color} />
  );

  if (style === 'short') return (
    <g>
      {/* 뒤쪽 (얼굴 뒤로) */}
      <ellipse cx="80" cy="50" rx="40" ry="30" fill={dark} />
      <FrontCap />
      {/* 사이드 라인 디테일 */}
      <path d="M42,65 Q42,72 48,78" stroke={dark} strokeWidth="2" fill="none" />
      <path d="M118,65 Q118,72 112,78" stroke={dark} strokeWidth="2" fill="none" />
    </g>
  );

  if (style === 'topknot') return (
    <g>
      <ellipse cx="80" cy="50" rx="38" ry="28" fill={dark} />
      <FrontCap />
      {/* 상투(머리 묶음) */}
      <ellipse cx="80" cy="20" rx="10" ry="7" fill={color} />
      <line x1="72" y1="20" x2="88" y2="20" stroke="#8B6544" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="80" cy="19" rx="8" ry="5" fill={dark} />
    </g>
  );

  if (style === 'long') return (
    <g>
      {/* 긴 옆머리 */}
      <path d="M42,72 Q28,110 25,165 L38,168 Q42,125 50,90 Z" fill={dark} />
      <path d="M118,72 Q132,110 135,165 L122,168 Q118,125 110,90 Z" fill={dark} />
      <ellipse cx="80" cy="50" rx="40" ry="30" fill={dark} />
      <FrontCap />
      {/* 긴 앞머리 옆라인 */}
      <path d="M42,68 Q33,108 30,160" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M118,68 Q127,108 130,160" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  );

  if (style === 'bob') return (
    <g>
      {/* 귀 덮는 단발 */}
      <path d="M42,72 Q32,95 36,115 L48,112 Q44,96 50,84 Z" fill={dark} />
      <path d="M118,72 Q128,95 124,115 L112,112 Q116,96 110,84 Z" fill={dark} />
      <ellipse cx="80" cy="50" rx="40" ry="30" fill={dark} />
      <FrontCap />
      <path d="M42,70 Q34,95 38,112" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M118,70 Q126,95 122,112" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  );

  // shaved
  return (
    <g>
      <ellipse cx="80" cy="52" rx="39" ry="22" fill={color} opacity="0.8" />
      <FrontCap />
    </g>
  );
}

// ─── 목 & 의상 ────────────────────────────────────────────
function Outfit({ style, outfitColor, skin }: { style: CharacterConfig['outfit']; outfitColor: CharacterConfig['outfitColor']; skin: string }) {
  const oc = OUTFIT_COLORS[outfitColor];
  const { main, light, dark } = oc;

  // 목
  const Neck = () => (
    <rect x="68" y="108" width="24" height="20" rx="4" fill={skin} />
  );

  if (style === 'peasant') return (
    <g>
      <Neck />
      <path d="M28,128 L28,198 L132,198 L132,128 L110,115 L80,126 L50,115 Z" fill={main} />
      <path d="M28,128 L8,175 L22,180 L44,146" fill={main} stroke={dark} strokeWidth="1" />
      <path d="M132,128 L152,175 L138,180 L116,146" fill={main} stroke={dark} strokeWidth="1" />
      <path d="M50,115 L80,126 L80,148" stroke={light} strokeWidth="2" fill="none" />
      <path d="M110,115 L80,126 L80,148" stroke={light} strokeWidth="2" fill="none" />
    </g>
  );

  if (style === 'commoner') return (
    <g>
      <Neck />
      {/* 흰 속옷 */}
      <path d="M50,115 L80,128 L110,115 L115,198 L45,198 Z" fill="#F5F0E8" />
      {/* 겉옷 */}
      <path d="M28,132 L28,198 L52,198 L52,128 L30,132 Z" fill={main} />
      <path d="M108,128 L108,198 L132,198 L132,132 Z" fill={main} />
      {/* 깃(옷깃) */}
      <path d="M52,120 L80,128 L80,150 L66,140 Z" fill={main} />
      <path d="M108,120 L80,128 L80,150 L94,140 Z" fill={dark} />
      {/* 소매 */}
      <path d="M28,132 L5,172 L18,178 L44,148" fill={main} stroke={dark} strokeWidth="0.5" />
      <path d="M132,132 L155,172 L142,178 L116,148" fill={main} stroke={dark} strokeWidth="0.5" />
      {/* 허리띠 */}
      <rect x="42" y="158" width="76" height="8" rx="3" fill={dark} />
    </g>
  );

  if (style === 'scholar') return (
    <g>
      <Neck />
      {/* 도포(흰 넓은 소매 도포) */}
      <path d="M80,118 L35,135 L-5,185 L10,192 L48,152 L48,198 L112,198 L112,152 L150,192 L165,185 L125,135 Z" fill={main} />
      {/* 깃 */}
      <path d="M80,118 L56,148 L56,160" stroke="#C8A060" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M80,118 L104,148 L104,160" stroke="#C8A060" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* 안감색 */}
      <path d="M80,118 L56,148 L72,148 Z" fill={light} opacity="0.6" />
      <path d="M80,118 L104,148 L88,148 Z" fill={light} opacity="0.6" />
      {/* 넓은 소매 */}
      <path d="M35,135 L-5,185 L10,192 L48,152" stroke={dark} strokeWidth="1" fill="none" />
      <path d="M125,135 L165,185 L150,192 L112,152" stroke={dark} strokeWidth="1" fill="none" />
      {/* 도련(밑단) 선 */}
      <line x1="48" y1="198" x2="112" y2="198" stroke={dark} strokeWidth="2" />
    </g>
  );

  if (style === 'official') return (
    <g>
      <Neck />
      {/* 단령(관복) */}
      <path d="M28,130 L28,198 L132,198 L132,130 L108,116 L80,124 L52,116 Z" fill={main} />
      {/* 둥근 깃 */}
      <path d="M52,116 Q80,110 108,116 Q100,128 80,130 Q60,128 52,116 Z" fill={light} />
      {/* 흉배(가슴 문양) 패치 */}
      <rect x="63" y="145" width="34" height="28" rx="3" fill={dark} />
      <rect x="66" y="148" width="28" height="22" rx="2" fill={main} opacity="0.7" />
      <text x="80" y="162" textAnchor="middle" fontSize="12" fill={light}>鶴</text>
      {/* 소매 */}
      <path d="M28,130 L8,172 L22,178 L44,148" fill={main} stroke={dark} strokeWidth="1" />
      <path d="M132,130 L152,172 L138,178 L116,148" fill={main} stroke={dark} strokeWidth="1" />
      {/* 허리띠 */}
      <rect x="38" y="155" width="84" height="9" rx="4" fill={dark} />
    </g>
  );

  // king (곤룡포)
  return (
    <g>
      <Neck />
      {/* 곤룡포 - 황금/붉은 왕 의상 */}
      <path d="M22,128 L22,198 L138,198 L138,128 L112,114 L80,122 L48,114 Z" fill={main} />
      {/* 소매 */}
      <path d="M22,128 L0,170 L14,177 L40,148" fill={main} stroke={dark} strokeWidth="1" />
      <path d="M138,128 L160,170 L146,177 L120,148" fill={main} stroke={dark} strokeWidth="1" />
      {/* 깃 */}
      <path d="M48,114 L80,122 L80,142 L64,135 Z" fill={light} />
      <path d="M112,114 L80,122 L80,142 L96,135 Z" fill={light} opacity="0.8" />
      {/* 용 문양 */}
      <text x="80" y="172" textAnchor="middle" fontSize="20" fill={light} opacity="0.9">龍</text>
      {/* 옥대(허리띠) */}
      <rect x="32" y="155" width="96" height="10" rx="5" fill="#8B6914" />
      <circle cx="80" cy="160" r="5" fill="#FFD700" />
      <circle cx="65" cy="160" r="3" fill="#FFD700" />
      <circle cx="95" cy="160" r="3" fill="#FFD700" />
      {/* 금 테두리 */}
      <path d="M22,128 L22,198 L138,198 L138,128" stroke={dark} strokeWidth="1.5" fill="none" />
    </g>
  );
}

// ─── 모자 ────────────────────────────────────────────────
function Hat({ style, hairColor }: { style: CharacterConfig['hat']; hairColor: string }) {
  if (style === 'none') return null;

  if (style === 'gat') return (
    <g>
      {/* 갓 - 챙(넓은 검은 챙) */}
      <ellipse cx="80" cy="22" rx="56" ry="9" fill="#111" />
      {/* 대우(위 몸통) */}
      <path d="M64,4 L64,22 L96,22 L96,4 Q80,-4 64,4 Z" fill="#222" />
      <ellipse cx="80" cy="4" rx="16" ry="5" fill="#333" />
      {/* 갓끈(턱끈) */}
      <path d="M56,23 Q80,35 104,23" stroke="#C8A060" strokeWidth="1.5" fill="none" />
    </g>
  );

  if (style === 'headband') return (
    <g>
      <path d="M42,55 Q80,48 118,55 L118,64 Q80,57 42,64 Z" fill={hairColor} />
      <path d="M42,55 Q80,48 118,55" stroke={darken(hairColor, 20)} strokeWidth="1.5" fill="none" />
    </g>
  );

  if (style === 'bamboohat') return (
    <g>
      {/* 삿갓(대나무 원추형 모자) */}
      <path d="M80,-2 L10,30 L150,30 Z" fill="#C8A060" stroke="#8B6944" strokeWidth="1.5" />
      <path d="M80,-2 L10,30" stroke="#8B6944" strokeWidth="0.8" />
      <path d="M80,-2 L90,30" stroke="#8B6944" strokeWidth="0.8" />
      <path d="M80,-2 L70,30" stroke="#8B6944" strokeWidth="0.8" />
      <path d="M80,-2 L50,30" stroke="#8B6944" strokeWidth="0.8" />
      <path d="M80,-2 L110,30" stroke="#8B6944" strokeWidth="0.8" />
      <path d="M80,-2 L130,30" stroke="#8B6944" strokeWidth="0.8" />
      <path d="M80,-2 L150,30" stroke="#8B6944" strokeWidth="0.8" />
      <ellipse cx="80" cy="30" rx="70" ry="7" fill="#B8943E" stroke="#8B6944" strokeWidth="1" />
    </g>
  );

  // crown (왕관)
  return (
    <g>
      <path d="M50,28 L50,14 L63,25 L80,6 L97,25 L110,14 L110,28 Z" fill="#FFD700" stroke="#8B6914" strokeWidth="1" />
      <rect x="50" y="28" width="60" height="9" rx="2" fill="#FFD700" stroke="#8B6914" strokeWidth="1" />
      <circle cx="80" cy="17" r="5"  fill="#CC0000" />
      <circle cx="62" cy="25" r="3"  fill="#00AA44" />
      <circle cx="98" cy="25" r="3"  fill="#0044CC" />
    </g>
  );
}

// ─── 악세사리 ─────────────────────────────────────────────
function Accessory({ style }: { style: CharacterConfig['accessory'] }) {
  if (style === 'none') return null;

  if (style === 'fan') return (
    <g transform="translate(130, 140) rotate(-30)">
      {/* 부채 */}
      <path d="M0,0 L-30,-50 L-10,-55 L0,-5 Z" fill="#C8A060" />
      <path d="M0,0 L-10,-55 L10,-55 L0,-5 Z" fill="#E8C880" />
      <path d="M0,0 L10,-55 L30,-50 L0,-5 Z" fill="#C8A060" />
      <path d="M0,0 L-30,-50 L30,-50" fill="none" stroke="#8B6914" strokeWidth="1.5" />
      <line x1="0" y1="0" x2="0" y2="-5" stroke="#8B6914" strokeWidth="3" strokeLinecap="round" />
    </g>
  );

  if (style === 'brush') return (
    <g transform="translate(128, 108)">
      {/* 붓 */}
      <rect x="-3" y="-5" width="6" height="80" rx="3" fill="#5C3317" />
      <path d="M-3,75 Q0,90 3,75 Z" fill="#111" />
      <rect x="-5" y="-10" width="10" height="8" rx="2" fill="#8B6944" />
    </g>
  );

  if (style === 'sword') return (
    <g transform="translate(130, 115) rotate(15)">
      {/* 검 */}
      <rect x="-2" y="-80" width="4" height="80" rx="1" fill="#C0C0C0" />
      <rect x="-2" y="-82" width="4" height="5" rx="1" fill="#888" />
      {/* 손잡이 */}
      <rect x="-4" y="-10" width="8" height="24" rx="2" fill="#5C3317" />
      <rect x="-8" y="-2"  width="16" height="5" rx="2" fill="#8B6914" />
    </g>
  );

  // book
  return (
    <g transform="translate(120, 148)">
      <rect x="-2" y="-30" width="28" height="36" rx="2" fill="#2C5AA0" />
      <rect x="0"  y="-28" width="24" height="32" rx="1" fill="#F5F0E8" />
      <line x1="4" y1="-22" x2="20" y2="-22" stroke="#888" strokeWidth="1" />
      <line x1="4" y1="-16" x2="20" y2="-16" stroke="#888" strokeWidth="1" />
      <line x1="4" y1="-10" x2="16" y2="-10" stroke="#888" strokeWidth="1" />
      <rect x="-2" y="-30" width="4" height="36" rx="1" fill="#1A3A70" />
    </g>
  );
}

// ─── 메인 CharacterSVG 컴포넌트 ────────────────────────────
export default function CharacterSVG({ config, size = 160 }: Props) {
  const {
    skinTone, faceShape, eyeStyle, eyeColor, mouthStyle,
    hairStyle, hairColor, outfit, outfitColor, hat, accessory,
    bgStyle, photoMode, photoData, photoHat, photoAccessory,
  } = config;

  const skin = SKIN_COLORS[skinTone];
  const hair = HAIR_COLORS[hairColor];
  const bg   = BG_COLORS[bgStyle];
  const svgH = Math.round(size * 1.25);
  const uid  = Math.random().toString(36).slice(2, 8); // clipPath id용

  // 사진 모드
  if (photoMode && photoData) {
    const hatEmoji: Record<CharacterConfig['hat'], string> = {
      none: '', gat: '🎩', headband: '🎗️', bamboohat: '🪖', crown: '👑',
    };
    const accEmoji: Record<CharacterConfig['accessory'], string> = {
      none: '', fan: '🪭', brush: '✒️', sword: '⚔️', book: '📖',
    };
    const hw = size;
    return (
      <svg width={hw} height={hw} viewBox={`0 0 ${hw} ${hw}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id={`circle-${uid}`}>
            <circle cx={hw / 2} cy={hw / 2} r={hw / 2 - 4} />
          </clipPath>
        </defs>
        <circle cx={hw / 2} cy={hw / 2} r={hw / 2} fill={`url(#bg-${uid})`} />
        <image href={photoData} x="0" y="0" width={hw} height={hw} clipPath={`url(#circle-${uid})`} preserveAspectRatio="xMidYMid slice" />
        {photoHat !== 'none' && (
          <text x={hw / 2} y={hw * 0.18} textAnchor="middle" fontSize={hw * 0.28}>{hatEmoji[photoHat]}</text>
        )}
        {photoAccessory !== 'none' && (
          <text x={hw * 0.85} y={hw * 0.78} textAnchor="middle" fontSize={hw * 0.22}>{accEmoji[photoAccessory]}</text>
        )}
      </svg>
    );
  }

  return (
    <svg width={size} height={svgH} viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bg.from} />
          <stop offset="100%" stopColor={bg.to} />
        </linearGradient>
      </defs>

      {/* 배경 */}
      <rect x="0" y="0" width="160" height="200" rx="12" fill={`url(#bg-${uid})`} />

      {/* === 레이어 순서: 의상→목→귀+얼굴→머리뒤→눈썹/눈/코/입/볼→머리앞→모자 === */}

      {/* 의상 (얼굴 뒤) */}
      <Outfit style={outfit} outfitColor={outfitColor} skin={skin} />

      {/* 얼굴 */}
      <Face shape={faceShape} skin={skin} />

      {/* 머리카락 뒤 레이어 → Face 보다 나중에 그려서 앞에 오게 */}
      <Hair style={hairStyle} color={hair} />

      {/* 눈썹 */}
      <Eyebrows eyeStyle={eyeStyle} hairColor={hair} />

      {/* 눈 */}
      <Eyes style={eyeStyle} eyeColor={eyeColor} />

      {/* 코 */}
      <circle cx="80" cy="80" r="2.5" fill={darken(skin, 22)} />

      {/* 입 */}
      <Mouth style={mouthStyle} />

      {/* 볼터치 */}
      <Cheeks />

      {/* 모자 */}
      <Hat style={hat} hairColor={hair} />

      {/* 악세사리 */}
      <Accessory style={accessory} />
    </svg>
  );
}
