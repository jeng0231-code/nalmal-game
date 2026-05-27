import type Anthropic from '@anthropic-ai/sdk';
import type {
  AccessoryStyle,
  BgStyle,
  CharacterConfig,
  EyeStyle,
  FaceShape,
  HairColor,
  HairStyle,
  HatStyle,
  MouthStyle,
  OutfitColor,
  OutfitStyle,
  SkinTone,
} from '../types/character';
import { isClaudeFeaturesEnabled } from './claudeFeatureFlag';

const RAW_KEY = import.meta.env.VITE_CLAUDE_API_KEY ?? '';
const CLAUDE_FEATURES_ENABLED = isClaudeFeaturesEnabled();

const isValidKey = (key: string) =>
  key.startsWith('sk-ant-') && /^[\u0021-\u007E]+$/.test(key);

const API_KEY = isValidKey(RAW_KEY) ? RAW_KEY : '';

let clientPromise: Promise<Anthropic | null> | null = null;

const SKINS = ['skin1', 'skin2', 'skin3', 'skin4', 'skin5'] as const;
const FACES = ['round', 'oval', 'angular', 'soft'] as const;
const EYES = ['round', 'sharp', 'droopy', 'sparkle'] as const;
const MOUTHS = ['smile', 'grin', 'neutral', 'pout'] as const;
const HAIRS = ['short', 'topknot', 'long', 'bob', 'shaved'] as const;
const HCLRS = ['black', 'brown', 'darkbrown', 'auburn', 'gray', 'white'] as const;
const OUTFITS = ['peasant', 'commoner', 'scholar', 'official', 'king'] as const;
const OCLRS = ['brown', 'navy', 'white', 'blue', 'red', 'gold', 'green', 'purple'] as const;
const HATS = ['none', 'gat', 'headband', 'bamboohat', 'crown'] as const;
const ACCS = ['none', 'fan', 'brush', 'sword', 'book'] as const;
const BGS = ['gold', 'blue', 'green', 'red', 'purple', 'dark', 'peach'] as const;

const PHOTO_TO_CHARACTER_PROMPT = `이 사진을 보고 조선시대 캐릭터 설정을 JSON으로만 응답하세요. 마크다운 없이 순수 JSON만.

사진의 피부톤, 눈 모양, 헤어스타일 등을 참고해서 아래 타입 중 하나씩 고르세요:

{
  "skinTone": "skin1"|"skin2"|"skin3"|"skin4"|"skin5",
  "faceShape": "round"|"oval"|"angular"|"soft",
  "eyeStyle": "round"|"sharp"|"droopy"|"sparkle",
  "eyeColor": "#2C1810",
  "mouthStyle": "smile"|"grin"|"neutral"|"pout",
  "hairStyle": "short"|"topknot"|"long"|"bob"|"shaved",
  "hairColor": "black"|"brown"|"darkbrown"|"auburn"|"gray"|"white",
  "outfit": "peasant"|"commoner"|"scholar"|"official"|"king",
  "outfitColor": "brown"|"navy"|"white"|"blue"|"red"|"gold"|"green"|"purple",
  "hat": "none"|"gat"|"headband"|"bamboohat"|"crown",
  "accessory": "none"|"fan"|"brush"|"sword"|"book",
  "bgStyle": "gold"|"blue"|"green"|"red"|"purple"|"dark"|"peach",
  "photoMode": false,
  "photoData": null,
  "photoHat": "none",
  "photoAccessory": "none"
}

사진 특징에 맞는 값을 골라주세요. 밝은 피부=skin1~2, 중간=skin3, 어두운=skin4~5. 반드시 JSON만 응답.`;

const pick = <T extends string>(val: unknown, list: readonly T[], fallback: T): T =>
  list.includes(val as T) ? (val as T) : fallback;

export async function analyzePhotoToCharacter(base64Data: string): Promise<CharacterConfig | null> {
  if (!CLAUDE_FEATURES_ENABLED || !API_KEY) return null;

  if (!clientPromise) {
    clientPromise = import('@anthropic-ai/sdk')
      .then(({ default: AnthropicClient }) => (
        new AnthropicClient({ apiKey: API_KEY, dangerouslyAllowBrowser: true })
      ))
      .catch((error: unknown) => {
        console.warn('AI 사진 분석 SDK 로딩 실패:', error);
        clientPromise = null;
        return null;
      });
  }

  const client = await clientPromise;
  if (!client) return null;

  const pureBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const mediaType = base64Data.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as 'image/jpeg' | 'image/png',
              data: pureBase64,
            },
          },
          { type: 'text', text: PHOTO_TO_CHARACTER_PROMPT },
        ],
      }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const raw = JSON.parse(jsonMatch[0]);

    const config: CharacterConfig = {
      skinTone: pick<SkinTone>(raw.skinTone, SKINS, 'skin2'),
      faceShape: pick<FaceShape>(raw.faceShape, FACES, 'round'),
      eyeStyle: pick<EyeStyle>(raw.eyeStyle, EYES, 'round'),
      eyeColor: typeof raw.eyeColor === 'string' && raw.eyeColor.startsWith('#') ? raw.eyeColor : '#2C1810',
      mouthStyle: pick<MouthStyle>(raw.mouthStyle, MOUTHS, 'smile'),
      hairStyle: pick<HairStyle>(raw.hairStyle, HAIRS, 'short'),
      hairColor: pick<HairColor>(raw.hairColor, HCLRS, 'black'),
      outfit: pick<OutfitStyle>(raw.outfit, OUTFITS, 'commoner'),
      outfitColor: pick<OutfitColor>(raw.outfitColor, OCLRS, 'brown'),
      hat: pick<HatStyle>(raw.hat, HATS, 'none'),
      accessory: pick<AccessoryStyle>(raw.accessory, ACCS, 'none'),
      bgStyle: pick<BgStyle>(raw.bgStyle, BGS, 'gold'),
      photoMode: false,
      photoData: null,
      photoHat: 'none',
      photoAccessory: 'none',
    };

    return config;
  } catch (error) {
    console.error('사진 분석 실패:', error);
    return null;
  }
}
