import { useGameStore } from '../../store/gameStore';
import { getLevelByXP, getXPProgress } from '../../data/levels';
import CharacterSVG from './CharacterSVG';

interface CharacterDisplayProps {
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;
}

export default function CharacterDisplay({ size = 'medium', showStats = true }: CharacterDisplayProps) {
  const { player, characterConfig } = useGameStore();
  const currentLevel = getLevelByXP(player.xp);
  const xpProgress = getXPProgress(player.xp);

  const sizeMap = {
    small:  { svgSize: 64,  avatarCls: 'w-16 h-16 text-4xl', name: 'text-sm',  title: 'text-xs'  },
    medium: { svgSize: 96,  avatarCls: 'w-24 h-24 text-5xl', name: 'text-base', title: 'text-sm' },
    large:  { svgSize: 128, avatarCls: 'w-32 h-32 text-6xl', name: 'text-xl',  title: 'text-base' },
  };

  const sz = sizeMap[size];
  const hasCustomChar = characterConfig && !characterConfig.photoMode;
  const hasPhotoChar  = characterConfig && characterConfig.photoMode && characterConfig.photoData;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* 아바타 */}
      <div
        className={`${sz.avatarCls} relative rounded-full border-4 border-joseon-gold overflow-hidden flex items-center justify-center`}
        style={{ background: 'linear-gradient(135deg, #FFF8DC, #F5DEB3)' }}
      >
        {hasPhotoChar ? (
          /* 사진 모드: 사진 원형 표시 */
          <img src={characterConfig.photoData!} alt="캐릭터" className="w-full h-full object-cover" />
        ) : hasCustomChar ? (
          /* SVG 캐릭터 */
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            <CharacterSVG config={characterConfig} size={sz.svgSize} />
          </div>
        ) : player.avatarPhoto ? (
          /* 기존 아바타 사진 */
          <img src={player.avatarPhoto} alt="캐릭터" className="w-full h-full object-cover" />
        ) : (
          /* 기본 레벨 이모지 */
          <span className="text-center leading-none select-none">{currentLevel.emoji}</span>
        )}

        {/* 레벨 배지 */}
        <div className="absolute -bottom-1 -right-1 bg-joseon-red text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
          {player.level > 0 ? currentLevel.level : 1}
        </div>
      </div>

      {/* 이름 & 신분 */}
      <div className="text-center">
        <div className={`font-bold text-joseon-dark ${sz.name}`}>{player.name || '이름 없음'}</div>
        <div className={`text-joseon-brown font-medium ${sz.title}`}>
          {currentLevel.hat} {currentLevel.title}
        </div>
      </div>

      {showStats && (
        <>
          {/* XP 바 */}
          <div className="w-full max-w-[160px]">
            <div className="flex justify-between text-xs text-joseon-brown mb-1">
              <span>경험치</span>
              <span>{player.xp} / {currentLevel.maxXP === Infinity ? 'MAX' : currentLevel.maxXP}</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden border border-joseon-brown/30">
              <div
                className="xp-bar h-full rounded-full"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>

          {/* 스탯 */}
          <div className="flex gap-3 text-sm">
            <span title="하트(목숨)">
              {'❤️'.repeat(player.hearts)}{'🖤'.repeat(Math.max(0, player.maxHearts - player.hearts))}
            </span>
            <span className="text-joseon-gold font-bold">🪙 {player.coins}</span>
          </div>

          {/* 연속 정답 */}
          {player.streak >= 2 && (
            <div className="text-xs bg-joseon-gold/20 border border-joseon-gold rounded-full px-3 py-1 text-joseon-dark font-bold animate-bounce">
              🔥 {player.streak}연속 정답! (XP 1.5배)
            </div>
          )}
        </>
      )}
    </div>
  );
}
