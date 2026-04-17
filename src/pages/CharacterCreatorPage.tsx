/**
 * CharacterCreatorPage
 * ─────────────────────────────────────────────────────────────────
 * UX benchmarks applied:
 *  • Gacha Club  → 3-column option grid, persistent preview, dice Randomize
 *  • Bitmoji     → horizontal scrollable category tab row (thumb zone),
 *                  flat category access (1-tap depth), undo history
 *  • Zepeto      → gradient/swatch color cards, bottom-sheet panel feel
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import CharacterSVG from '../components/character/CharacterSVG';
import {
  DEFAULT_CHARACTER,
  PRESET_CHARACTERS,
  SKIN_COLORS,
  HAIR_COLORS,
  OUTFIT_COLORS,
  BG_COLORS,
} from '../types/character';
import type {
  CharacterConfig,
  SkinTone,
  FaceShape,
  EyeStyle,
  MouthStyle,
  HairStyle,
  HairColor,
  OutfitStyle,
  OutfitColor,
  HatStyle,
  AccessoryStyle,
  BgStyle,
} from '../types/character';

// ─── Types ────────────────────────────────────────────────────────

type ModeId     = 'preset' | 'custom' | 'photo';
type CategoryId =
  | 'bgStyle' | 'skinTone' | 'faceShape' | 'eyeStyle' | 'mouthStyle'
  | 'hairStyle' | 'hairColor' | 'outfit' | 'outfitColor' | 'hat' | 'accessory';

interface OptionItem {
  value: string;
  label: string;
  emoji?: string;
  /** Solid fill color (skin / hair / outfit palette) */
  color?: string;
  /** Gradient for backgrounds [from, to] */
  gradient?: [string, string];
}

// ─── Category definitions ─────────────────────────────────────────

const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: 'bgStyle',     label: '배경',   emoji: '🖼️' },
  { id: 'skinTone',    label: '피부',   emoji: '🌿' },
  { id: 'faceShape',   label: '얼굴형', emoji: '😊' },
  { id: 'eyeStyle',    label: '눈',     emoji: '👁️' },
  { id: 'mouthStyle',  label: '입',     emoji: '👄' },
  { id: 'hairStyle',   label: '머리',   emoji: '💇' },
  { id: 'hairColor',   label: '머리색', emoji: '🎨' },
  { id: 'outfit',      label: '의상',   emoji: '👘' },
  { id: 'outfitColor', label: '의상색', emoji: '🎨' },
  { id: 'hat',         label: '모자',   emoji: '🎩' },
  { id: 'accessory',   label: '소품',   emoji: '🏺' },
];

// ─── Options per category ─────────────────────────────────────────

const OPTIONS: Record<CategoryId, OptionItem[]> = {
  bgStyle: [
    { value: 'gold',   label: '금빛',   gradient: [BG_COLORS.gold.from,   BG_COLORS.gold.to]   },
    { value: 'blue',   label: '파랑',   gradient: [BG_COLORS.blue.from,   BG_COLORS.blue.to]   },
    { value: 'green',  label: '초록',   gradient: [BG_COLORS.green.from,  BG_COLORS.green.to]  },
    { value: 'red',    label: '빨강',   gradient: [BG_COLORS.red.from,    BG_COLORS.red.to]    },
    { value: 'purple', label: '보라',   gradient: [BG_COLORS.purple.from, BG_COLORS.purple.to] },
    { value: 'dark',   label: '어둠',   gradient: [BG_COLORS.dark.from,   BG_COLORS.dark.to]   },
    { value: 'peach',  label: '복숭아', gradient: [BG_COLORS.peach.from,  BG_COLORS.peach.to]  },
  ],
  skinTone: [
    { value: 'skin1', label: '밝은', color: SKIN_COLORS.skin1 },
    { value: 'skin2', label: '보통', color: SKIN_COLORS.skin2 },
    { value: 'skin3', label: '중간', color: SKIN_COLORS.skin3 },
    { value: 'skin4', label: '갈색', color: SKIN_COLORS.skin4 },
    { value: 'skin5', label: '진한', color: SKIN_COLORS.skin5 },
  ],
  faceShape: [
    { value: 'round',   label: '둥근',    emoji: '🔵' },
    { value: 'oval',    label: '긴',      emoji: '🥚' },
    { value: 'angular', label: '각진',    emoji: '🔷' },
    { value: 'soft',    label: '부드러운', emoji: '🫧' },
  ],
  eyeStyle: [
    { value: 'round',   label: '동그란',   emoji: '👀' },
    { value: 'sharp',   label: '날카로운', emoji: '⚡' },
    { value: 'droopy',  label: '처진',     emoji: '😪' },
    { value: 'sparkle', label: '빛나는',   emoji: '✨' },
  ],
  mouthStyle: [
    { value: 'smile',   label: '미소',  emoji: '🙂' },
    { value: 'grin',    label: '활짝',  emoji: '😄' },
    { value: 'neutral', label: '중립',  emoji: '😐' },
    { value: 'pout',    label: '삐침',  emoji: '😤' },
  ],
  hairStyle: [
    { value: 'short',   label: '단발',  emoji: '💆' },
    { value: 'topknot', label: '상투',  emoji: '🎎' },
    { value: 'long',    label: '긴머리', emoji: '👸' },
    { value: 'bob',     label: '단정',  emoji: '💁' },
    { value: 'shaved',  label: '삭발',  emoji: '🧑‍🦲' },
  ],
  hairColor: [
    { value: 'black',     label: '검정',  color: HAIR_COLORS.black     },
    { value: 'brown',     label: '갈색',  color: HAIR_COLORS.brown     },
    { value: 'darkbrown', label: '진갈색', color: HAIR_COLORS.darkbrown },
    { value: 'auburn',    label: '적갈색', color: HAIR_COLORS.auburn    },
    { value: 'gray',      label: '회색',  color: HAIR_COLORS.gray      },
    { value: 'white',     label: '백발',  color: HAIR_COLORS.white     },
  ],
  outfit: [
    { value: 'peasant',  label: '농민복', emoji: '👒' },
    { value: 'commoner', label: '평민복', emoji: '👗' },
    { value: 'scholar',  label: '선비복', emoji: '📜' },
    { value: 'official', label: '관리복', emoji: '🏛️' },
    { value: 'king',     label: '왕복',   emoji: '👑' },
  ],
  outfitColor: [
    { value: 'brown',  label: '갈색', color: OUTFIT_COLORS.brown.main  },
    { value: 'navy',   label: '남색', color: OUTFIT_COLORS.navy.main   },
    { value: 'white',  label: '흰색', color: OUTFIT_COLORS.white.main  },
    { value: 'blue',   label: '파랑', color: OUTFIT_COLORS.blue.main   },
    { value: 'red',    label: '빨강', color: OUTFIT_COLORS.red.main    },
    { value: 'gold',   label: '금색', color: OUTFIT_COLORS.gold.main   },
    { value: 'green',  label: '초록', color: OUTFIT_COLORS.green.main  },
    { value: 'purple', label: '보라', color: OUTFIT_COLORS.purple.main },
  ],
  hat: [
    { value: 'none',      label: '없음',  emoji: '❌' },
    { value: 'gat',       label: '갓',    emoji: '🎓' },
    { value: 'headband',  label: '머리띠', emoji: '🎀' },
    { value: 'bamboohat', label: '삿갓',  emoji: '🌂' },
    { value: 'crown',     label: '왕관',  emoji: '👑' },
  ],
  accessory: [
    { value: 'none',  label: '없음', emoji: '❌' },
    { value: 'fan',   label: '부채', emoji: '🪭' },
    { value: 'brush', label: '붓',   emoji: '🖌️' },
    { value: 'sword', label: '검',   emoji: '⚔️' },
    { value: 'book',  label: '책',   emoji: '📚' },
  ],
};

// Arrays for randomize
const SKIN_TONES:     SkinTone[]    = ['skin1','skin2','skin3','skin4','skin5'];
const FACE_SHAPES:    FaceShape[]   = ['round','oval','angular','soft'];
const EYE_STYLES:     EyeStyle[]    = ['round','sharp','droopy','sparkle'];
const MOUTH_STYLES:   MouthStyle[]  = ['smile','grin','neutral','pout'];
const HAIR_STYLES:    HairStyle[]   = ['short','topknot','long','bob','shaved'];
const HAIR_COLORS_L:  HairColor[]   = ['black','brown','darkbrown','auburn','gray','white'];
const OUTFIT_STYLES:  OutfitStyle[] = ['peasant','commoner','scholar','official','king'];
const OUTFIT_COLORS_L:OutfitColor[] = ['brown','navy','white','blue','red','gold','green','purple'];
const HAT_STYLES:     HatStyle[]    = ['none','gat','headband','bamboohat','crown'];
const ACCESS_STYLES:  AccessoryStyle[] = ['none','fan','brush','sword','book'];
const BG_STYLES:      BgStyle[]     = ['gold','blue','green','red','purple','dark','peach'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Sub-components ───────────────────────────────────────────────

/** Gradient card for background options */
function GradientCard({
  item, selected, onClick,
}: { item: OptionItem; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-end rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${
        selected
          ? 'border-yellow-500 shadow-lg shadow-yellow-200'
          : 'border-gray-200 shadow-sm'
      }`}
      style={{ aspectRatio: '1' }}
    >
      {/* gradient fill */}
      <div
        className="absolute inset-0"
        style={{
          background: item.gradient
            ? `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})`
            : item.color,
        }}
      />
      {/* label chip */}
      <span className="relative z-10 mb-1.5 px-2 py-0.5 rounded-full bg-black/20 text-white text-[11px] font-bold backdrop-blur-sm">
        {item.label}
      </span>
      {selected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center shadow">
          <span className="text-white text-[10px] font-black">✓</span>
        </div>
      )}
    </button>
  );
}

/** Color circle card for skin / hair / outfit color */
function ColorCard({
  item, selected, onClick,
}: { item: OptionItem; selected: boolean; onClick: () => void }) {
  const isLight = item.color === SKIN_COLORS.skin1 || item.color === HAIR_COLORS.white || item.color === OUTFIT_COLORS.white.main;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2 transition-all active:scale-95 ${
        selected
          ? 'border-yellow-500 bg-yellow-50 shadow-lg shadow-yellow-200'
          : 'border-gray-200 bg-white shadow-sm'
      }`}
      style={{ aspectRatio: '1' }}
    >
      <div
        className="rounded-full flex-shrink-0 border"
        style={{
          width: '52%',
          aspectRatio: '1',
          backgroundColor: item.color,
          borderColor: isLight ? '#D1D5DB' : 'transparent',
          boxShadow: selected ? `0 0 0 3px #EAB308` : undefined,
        }}
      />
      <span className="text-[11px] font-bold text-gray-600 leading-tight text-center">
        {item.label}
      </span>
    </button>
  );
}

/** Generic emoji + label card */
function EmojiCard({
  item, selected, onClick,
}: { item: OptionItem; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-2 transition-all active:scale-95 ${
        selected
          ? 'border-yellow-500 bg-yellow-50 shadow-lg shadow-yellow-100'
          : 'border-gray-200 bg-white shadow-sm'
      }`}
      style={{ aspectRatio: '1' }}
    >
      <span className="text-2xl leading-none">{item.emoji}</span>
      <span className={`text-[11px] font-bold leading-tight text-center ${selected ? 'text-yellow-700' : 'text-gray-600'}`}>
        {item.label}
      </span>
      {selected && (
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
      )}
    </button>
  );
}

/** Renders the right card type per category */
function OptionCard({
  item, selected, onClick,
}: {
  catId?: CategoryId; item: OptionItem; selected: boolean; onClick: () => void;
}) {
  if (item.gradient) return <GradientCard item={item} selected={selected} onClick={onClick} />;
  if (item.color)    return <ColorCard    item={item} selected={selected} onClick={onClick} />;
  return                    <EmojiCard    item={item} selected={selected} onClick={onClick} />;
}

// ─── Main Component ───────────────────────────────────────────────

export default function CharacterCreatorPage() {
  const navigate = useNavigate();
  const { characterConfig, setCharacterConfig } = useGameStore();

  // ── History for Undo (Bitmoji pattern) ──
  const initialConfig: CharacterConfig = characterConfig ?? DEFAULT_CHARACTER;
  const [history, setHistory] = useState<CharacterConfig[]>([initialConfig]);
  const [histIdx,  setHistIdx]  = useState(0);
  const draft = history[histIdx];

  const pushHistory = useCallback((patch: Partial<CharacterConfig>) => {
    setHistory(prev => {
      const next = [...prev.slice(0, histIdx + 1), { ...draft, ...patch }];
      return next;
    });
    setHistIdx(i => i + 1);
  }, [draft, histIdx]);

  const undo = () => { if (histIdx > 0) setHistIdx(i => i - 1); };

  // ── Mode & category state ──
  const [mode, setMode]     = useState<ModeId>('preset');
  const [catId, setCatId]   = useState<CategoryId>('bgStyle');
  const catScrollRef        = useRef<HTMLDivElement>(null);

  // ── Randomize (Gacha Club pattern) ──
  const randomize = () => {
    pushHistory({
      skinTone:    pickRandom(SKIN_TONES),
      faceShape:   pickRandom(FACE_SHAPES),
      eyeStyle:    pickRandom(EYE_STYLES),
      mouthStyle:  pickRandom(MOUTH_STYLES),
      hairStyle:   pickRandom(HAIR_STYLES),
      hairColor:   pickRandom(HAIR_COLORS_L),
      outfit:      pickRandom(OUTFIT_STYLES),
      outfitColor: pickRandom(OUTFIT_COLORS_L),
      hat:         pickRandom(HAT_STYLES),
      accessory:   pickRandom(ACCESS_STYLES),
      bgStyle:     pickRandom(BG_STYLES),
      photoMode:   false,
      photoData:   null,
    });
  };

  // ── Save ──
  const handleSave = () => {
    setCharacterConfig(draft);
    navigate(-1);
  };

  // ── Photo file inputs ──
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef  = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      pushHistory({ photoData: ev.target?.result as string, photoMode: true });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Current option value for a category ──
  const currentVal = (id: CategoryId): string => (draft as unknown as Record<string, string>)[id];

  // ── Detect active preset ──
  const activePreset = PRESET_CHARACTERS.find(
    p => !draft.photoMode &&
      p.config.skinTone    === draft.skinTone  &&
      p.config.hairStyle   === draft.hairStyle &&
      p.config.outfit      === draft.outfit    &&
      p.config.hat         === draft.hat       &&
      p.config.accessory   === draft.accessory &&
      p.config.bgStyle     === draft.bgStyle,
  );

  const previewLabel =
    draft.photoMode ? '사진 캐릭터'
    : activePreset  ? activePreset.name
    : '나만의 캐릭터';

  const previewDesc =
    draft.photoMode ? ''
    : activePreset  ? activePreset.desc
    : '직접 꾸민 캐릭터';

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen max-h-screen bg-gray-50 overflow-hidden">
      <div className="max-w-md mx-auto w-full flex flex-col h-screen">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-3 py-2 bg-joseon-dark flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-joseon-gold text-xl hover:bg-white/10 transition-colors"
          >
            ←
          </button>

          <h1 className="text-joseon-gold font-black text-base tracking-wide">
            🎨 내 캐릭터 꾸미기
          </h1>

          <div className="flex items-center gap-1">
            {/* Undo (Bitmoji pattern) */}
            <button
              type="button"
              onClick={undo}
              disabled={histIdx === 0}
              className="w-9 h-9 flex items-center justify-center rounded-full text-joseon-gold/80 text-lg hover:bg-white/10 transition-colors disabled:opacity-30"
              title="되돌리기"
            >
              ↩️
            </button>
            {/* Randomize (Gacha Club pattern) */}
            <button
              type="button"
              onClick={randomize}
              className="w-9 h-9 flex items-center justify-center rounded-full text-joseon-gold text-lg hover:bg-white/10 transition-colors"
              title="랜덤 생성"
            >
              🎲
            </button>
            {/* Save */}
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1.5 bg-joseon-gold text-joseon-dark rounded-lg text-sm font-black shadow active:opacity-80 transition-opacity"
            >
              저장
            </button>
          </div>
        </header>

        {/* ── PREVIEW (persistent, always visible — Gacha Club / Zepeto pattern) ── */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-joseon-brown/20"
          style={{ background: `linear-gradient(135deg, ${BG_COLORS[draft.bgStyle].from}, ${BG_COLORS[draft.bgStyle].to})` }}
        >
          {/* Character SVG */}
          <div className="flex-shrink-0 rounded-2xl overflow-hidden border-2 border-white/60 shadow-lg">
            <CharacterSVG config={draft} size={120} />
          </div>

          {/* Info + quick stats */}
          <div className="flex-1 ml-4 flex flex-col gap-1.5">
            <div className="text-lg font-black text-joseon-dark leading-tight">{previewLabel}</div>
            <div className="text-xs text-joseon-brown font-medium">{previewDesc}</div>

            {/* Quick attribute badges */}
            <div className="flex flex-wrap gap-1 mt-1">
              {[
                { label: draft.outfit === 'king' ? '왕' : draft.outfit === 'scholar' ? '선비' : draft.outfit === 'official' ? '관리' : draft.outfit === 'commoner' ? '평민' : '농민' },
                { label: draft.hat !== 'none' ? (draft.hat === 'gat' ? '갓' : draft.hat === 'crown' ? '왕관' : draft.hat === 'headband' ? '머리띠' : draft.hat === 'bamboohat' ? '삿갓' : '') : '' },
                { label: draft.accessory !== 'none' ? (draft.accessory === 'fan' ? '부채' : draft.accessory === 'brush' ? '붓' : draft.accessory === 'sword' ? '검' : draft.accessory === 'book' ? '책' : '') : '' },
              ].filter(b => b.label).map((b, i) => (
                <span key={i} className="px-2 py-0.5 bg-joseon-dark/10 rounded-full text-[10px] font-bold text-joseon-dark">
                  {b.label}
                </span>
              ))}
            </div>

            {/* Undo indicator */}
            {histIdx > 0 && (
              <div className="text-[10px] text-joseon-brown/50 mt-1">
                변경 {histIdx}회 · ↩️ 으로 되돌리기 가능
              </div>
            )}
          </div>
        </div>

        {/* ── MODE BAR ───────────────────────────────────────────── */}
        <div className="flex flex-shrink-0 bg-white border-b border-gray-200">
          {([
            { id: 'preset' as ModeId, label: '샘플',  emoji: '🎭' },
            { id: 'custom' as ModeId, label: '꾸미기', emoji: '✏️' },
            { id: 'photo'  as ModeId, label: '사진',  emoji: '📷' },
          ] as const).map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-bold border-b-2 transition-colors ${
                mode === m.id
                  ? 'border-yellow-500 text-yellow-600 bg-yellow-50'
                  : 'border-transparent text-gray-400'
              }`}
            >
              <span className="text-base">{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* ── CATEGORY ROW (Bitmoji flat-access pattern — only in custom mode) ── */}
        {mode === 'custom' && (
          <div
            ref={catScrollRef}
            className="flex gap-1.5 px-2 py-2 overflow-x-auto flex-shrink-0 bg-white border-b border-gray-100 scrollbar-hide"
            style={{ scrollbarWidth: 'none' }}
          >
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCatId(cat.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  catId === cat.id
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-100 bg-gray-50 text-gray-500'
                }`}
              >
                <span className="text-base leading-none">{cat.emoji}</span>
                <span className="leading-tight whitespace-nowrap">{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── TAB CONTENT (scrollable) ────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* ──── PRESET MODE ──────────────────────────────────── */}
          {mode === 'preset' && (
            <div className="p-3 grid grid-cols-2 gap-3">
              {PRESET_CHARACTERS.map(preset => {
                const sel = activePreset?.id === preset.id && !draft.photoMode;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => pushHistory({ ...preset.config, photoMode: false, photoData: null })}
                    className={`flex flex-col items-center rounded-2xl border-2 overflow-hidden transition-all active:scale-95 ${
                      sel
                        ? 'border-yellow-500 shadow-lg shadow-yellow-200'
                        : 'border-gray-200 bg-white shadow-sm'
                    }`}
                  >
                    {/* Gradient background strip */}
                    <div
                      className="w-full flex items-center justify-center pt-2"
                      style={{ background: `linear-gradient(135deg, ${BG_COLORS[preset.config.bgStyle].from}, ${BG_COLORS[preset.config.bgStyle].to})` }}
                    >
                      <CharacterSVG config={preset.config} size={84} />
                    </div>
                    <div className="w-full px-3 py-2 bg-white text-left">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-gray-800">{preset.name}</p>
                        {sel && <span className="text-yellow-500 text-sm">✓</span>}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{preset.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ──── CUSTOM MODE — 3-column grid (Gacha Club pattern) ─ */}
          {mode === 'custom' && (
            <div className="p-3">
              {/* Section label */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{CATEGORIES.find(c => c.id === catId)?.emoji}</span>
                <span className="text-sm font-black text-joseon-dark">
                  {CATEGORIES.find(c => c.id === catId)?.label} 선택
                </span>
                <div className="flex-1 h-px bg-gray-200 ml-1" />
              </div>

              {/* 3-column grid */}
              <div className="grid grid-cols-3 gap-2">
                {OPTIONS[catId].map(item => (
                  <OptionCard
                    key={item.value}
                    catId={catId}
                    item={item}
                    selected={currentVal(catId) === item.value}
                    onClick={() => pushHistory({ [catId]: item.value } as Partial<CharacterConfig>)}
                  />
                ))}
              </div>

              {/* Tip */}
              <p className="text-center text-[11px] text-gray-400 mt-4">
                위 카테고리에서 다른 항목을 탭해 변경하세요
              </p>
            </div>
          )}

          {/* ──── PHOTO MODE ────────────────────────────────────── */}
          {mode === 'photo' && (
            <div className="p-4 flex flex-col gap-4">
              {draft.photoMode && draft.photoData ? (
                /* Photo uploaded */
                <>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-yellow-400 shadow-xl flex-shrink-0">
                      <img src={draft.photoData} alt="사진" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      사진에 모자와 소품을 추가해보세요!
                    </p>
                  </div>

                  {/* Hat select */}
                  <div>
                    <p className="text-xs font-black text-yellow-700 mb-2">🎩 모자 고르기</p>
                    <div className="grid grid-cols-3 gap-2">
                      {OPTIONS.hat.map(item => (
                        <EmojiCard
                          key={item.value}
                          item={item}
                          selected={draft.photoHat === item.value}
                          onClick={() => pushHistory({ photoHat: item.value as HatStyle })}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Accessory select */}
                  <div>
                    <p className="text-xs font-black text-yellow-700 mb-2">🏺 소품 고르기</p>
                    <div className="grid grid-cols-3 gap-2">
                      {OPTIONS.accessory.map(item => (
                        <EmojiCard
                          key={item.value}
                          item={item}
                          selected={draft.photoAccessory === item.value}
                          onClick={() => pushHistory({ photoAccessory: item.value as AccessoryStyle })}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Change / Remove */}
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => albumRef.current?.click()}
                      className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-white font-bold text-sm active:bg-yellow-600 transition-colors"
                    >
                      🖼️ 사진 변경
                    </button>
                    <button
                      type="button"
                      onClick={() => pushHistory({ photoMode: false, photoData: null })}
                      className="flex-1 py-2.5 rounded-xl border-2 border-red-300 text-red-600 font-bold text-sm bg-red-50 active:bg-red-100 transition-colors"
                    >
                      🗑️ 사진 제거
                    </button>
                  </div>
                </>
              ) : (
                /* No photo yet */
                <div className="flex flex-col items-center gap-5 py-4">
                  <div className="w-24 h-24 rounded-full bg-yellow-50 border-4 border-yellow-200 flex items-center justify-center text-5xl shadow-inner">
                    📷
                  </div>
                  <div className="text-center">
                    <p className="text-base font-black text-gray-800 mb-1">사진으로 캐릭터 만들기</p>
                    <p className="text-xs text-gray-500">셀카를 찍거나 앨범 사진을 골라<br />나만의 조선 캐릭터를 완성해요!</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="w-full max-w-xs py-3.5 rounded-2xl bg-yellow-500 text-white font-black text-base shadow-lg shadow-yellow-200 active:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                  >
                    📸 카메라로 찍기
                  </button>
                  <button
                    type="button"
                    onClick={() => albumRef.current?.click()}
                    className="w-full max-w-xs py-3.5 rounded-2xl border-2 border-yellow-400 text-yellow-700 font-black text-base bg-white shadow-sm active:bg-yellow-50 transition-colors flex items-center justify-center gap-2"
                  >
                    🖼️ 앨범에서 선택
                  </button>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span>또는</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setMode('custom'); }}
                    className="text-sm text-yellow-600 font-bold underline underline-offset-2"
                  >
                    SVG 캐릭터로 직접 꾸미기 →
                  </button>
                </div>
              )}

              {/* Hidden file inputs */}
              <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFile} />
              <input ref={albumRef}  type="file" accept="image/*"               className="hidden" onChange={handleFile} />
            </div>
          )}

        </div>{/* end scrollable content */}

        {/* ── BOTTOM ACTION BAR ──────────────────────────────────── */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 shadow-lg">
          <button
            type="button"
            onClick={undo}
            disabled={histIdx === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-500 text-sm font-bold disabled:opacity-30 active:bg-gray-50 transition-colors"
          >
            ↩️ 되돌리기
          </button>

          <button
            type="button"
            onClick={randomize}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-yellow-300 text-yellow-700 text-sm font-bold bg-yellow-50 active:bg-yellow-100 transition-colors"
          >
            🎲 랜덤
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-joseon-dark text-joseon-gold text-sm font-black shadow-md active:opacity-80 transition-opacity"
          >
            💾 저장하기
          </button>
        </div>

      </div>
    </div>
  );
}
