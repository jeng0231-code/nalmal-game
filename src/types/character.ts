// ─── 캐릭터 커스터마이제이션 타입 ──────────────────────────

export type SkinTone   = 'skin1' | 'skin2' | 'skin3' | 'skin4' | 'skin5';
export type FaceShape  = 'round' | 'oval' | 'angular' | 'soft';
export type EyeStyle   = 'round' | 'sharp' | 'droopy' | 'sparkle';
export type MouthStyle = 'smile' | 'grin' | 'neutral' | 'pout';
export type HairStyle  = 'short' | 'topknot' | 'long' | 'bob' | 'shaved';
export type HairColor  = 'black' | 'brown' | 'darkbrown' | 'auburn' | 'gray' | 'white';
export type OutfitStyle = 'peasant' | 'commoner' | 'scholar' | 'official' | 'king';
export type OutfitColor = 'brown' | 'navy' | 'white' | 'blue' | 'red' | 'gold' | 'green' | 'purple';
export type HatStyle   = 'none' | 'gat' | 'headband' | 'bamboohat' | 'crown';
export type AccessoryStyle = 'none' | 'fan' | 'brush' | 'sword' | 'book';
export type BgStyle    = 'gold' | 'blue' | 'green' | 'red' | 'purple' | 'dark' | 'peach';

export interface CharacterConfig {
  skinTone: SkinTone;
  faceShape: FaceShape;
  eyeStyle: EyeStyle;
  eyeColor: string;       // hex
  mouthStyle: MouthStyle;
  hairStyle: HairStyle;
  hairColor: HairColor;
  outfit: OutfitStyle;
  outfitColor: OutfitColor;
  hat: HatStyle;
  accessory: AccessoryStyle;
  bgStyle: BgStyle;
  // 사진 모드
  photoMode: boolean;
  photoData: string | null;
  photoHat: HatStyle;
  photoAccessory: AccessoryStyle;
}

// ─── 색상 팔레트 매핑 ─────────────────────────────────────

export const SKIN_COLORS: Record<SkinTone, string> = {
  skin1: '#FFEFD5',
  skin2: '#F4C49A',
  skin3: '#D4956A',
  skin4: '#A0694A',
  skin5: '#5C3A1E',
};

export const HAIR_COLORS: Record<HairColor, string> = {
  black:     '#1A0F0A',
  brown:     '#5C3317',
  darkbrown: '#3B1A0A',
  auburn:    '#8B2500',
  gray:      '#7D7D7D',
  white:     '#F0EEE6',
};

export const OUTFIT_COLORS: Record<OutfitColor, { main: string; light: string; dark: string }> = {
  brown:  { main: '#8B6544', light: '#C4956A', dark: '#5C3A1E' },
  navy:   { main: '#2C3E7A', light: '#4A6AA5', dark: '#1A2550' },
  white:  { main: '#F5F0E8', light: '#FFFFFF', dark: '#D4C9B0' },
  blue:   { main: '#3A7BD5', light: '#6FA3E0', dark: '#1A4A9A' },
  red:    { main: '#C0392B', light: '#E05A4B', dark: '#8B1A10' },
  gold:   { main: '#D4AF37', light: '#F0D060', dark: '#9A7D1A' },
  green:  { main: '#2D7D46', light: '#4CAF70', dark: '#1A4A28' },
  purple: { main: '#6A3AA5', light: '#9460D0', dark: '#3A1A6A' },
};

export const BG_COLORS: Record<BgStyle, { from: string; to: string }> = {
  gold:   { from: '#FFF8DC', to: '#F5DEB3' },
  blue:   { from: '#E8F0FF', to: '#C5D8FF' },
  green:  { from: '#E8F5E9', to: '#C8E6C9' },
  red:    { from: '#FFF0F0', to: '#FFCDD2' },
  purple: { from: '#F3E8FF', to: '#DCC5FF' },
  dark:   { from: '#2C2010', to: '#1A1208' },
  peach:  { from: '#FFF3E0', to: '#FFCCBC' },
};

// ─── 기본 캐릭터 설정 ──────────────────────────────────────

export const DEFAULT_CHARACTER: CharacterConfig = {
  skinTone: 'skin2',
  faceShape: 'round',
  eyeStyle: 'round',
  eyeColor: '#2C1810',
  mouthStyle: 'smile',
  hairStyle: 'short',
  hairColor: 'black',
  outfit: 'commoner',
  outfitColor: 'brown',
  hat: 'none',
  accessory: 'none',
  bgStyle: 'gold',
  photoMode: false,
  photoData: null,
  photoHat: 'none',
  photoAccessory: 'none',
};

// ─── 프리셋 캐릭터 ─────────────────────────────────────────

export interface PresetCharacter {
  id: string;
  name: string;
  desc: string;
  config: CharacterConfig;
}

export const PRESET_CHARACTERS: PresetCharacter[] = [
  {
    id: 'p1', name: '밝은 아이', desc: '씩씩한 초보 선비',
    config: { ...DEFAULT_CHARACTER, skinTone: 'skin2', faceShape: 'round', eyeStyle: 'sparkle', mouthStyle: 'grin', hairStyle: 'short', hairColor: 'black', outfit: 'commoner', outfitColor: 'brown', bgStyle: 'gold' },
  },
  {
    id: 'p2', name: '선비', desc: '청렴한 조선의 선비',
    config: { ...DEFAULT_CHARACTER, skinTone: 'skin1', faceShape: 'oval', eyeStyle: 'sharp', mouthStyle: 'neutral', hairStyle: 'topknot', hairColor: 'black', outfit: 'scholar', outfitColor: 'white', hat: 'gat', accessory: 'brush', bgStyle: 'blue' },
  },
  {
    id: 'p3', name: '무사', desc: '강인한 조선의 무관',
    config: { ...DEFAULT_CHARACTER, skinTone: 'skin3', faceShape: 'angular', eyeStyle: 'sharp', mouthStyle: 'neutral', hairStyle: 'topknot', hairColor: 'black', outfit: 'official', outfitColor: 'navy', hat: 'headband', accessory: 'sword', bgStyle: 'dark' },
  },
  {
    id: 'p4', name: '왕', desc: '조선의 임금',
    config: { ...DEFAULT_CHARACTER, skinTone: 'skin1', faceShape: 'round', eyeStyle: 'round', mouthStyle: 'smile', hairStyle: 'topknot', hairColor: 'black', outfit: 'king', outfitColor: 'gold', hat: 'crown', accessory: 'fan', bgStyle: 'red' },
  },
  {
    id: 'p5', name: '지혜로운 노인', desc: '경험 많은 어른 선비',
    config: { ...DEFAULT_CHARACTER, skinTone: 'skin3', faceShape: 'soft', eyeStyle: 'droopy', mouthStyle: 'smile', hairStyle: 'topknot', hairColor: 'white', outfit: 'scholar', outfitColor: 'white', hat: 'gat', accessory: 'book', bgStyle: 'green' },
  },
  {
    id: 'p6', name: '상인', desc: '활발한 저잣거리 상인',
    config: { ...DEFAULT_CHARACTER, skinTone: 'skin3', faceShape: 'round', eyeStyle: 'droopy', mouthStyle: 'grin', hairStyle: 'bob', hairColor: 'darkbrown', outfit: 'commoner', outfitColor: 'green', hat: 'bamboohat', accessory: 'fan', bgStyle: 'peach' },
  },
];
