/**
 * 월별 시즌 이벤트 배너
 * 홈화면 상단에 표시 — 이달의 절기/기념일 소개 + 보너스 카테고리 안내
 */
import { useState } from 'react';
import { getCurrentSeasonalEvent, isTodayFestivalDay } from '../../data/seasonalEvents';

export default function SeasonalBanner() {
  const event = getCurrentSeasonalEvent();
  const isSpecialDay = isTodayFestivalDay(event);
  const [expanded, setExpanded] = useState(isSpecialDay); // 특별일엔 기본 펼침

  const categoryLabel: Record<string, string> = {
    literacy: '문해력',
    proverbs: '속담',
    idioms: '사자성어',
    history: '역사',
    etiquette: '예절',
  };

  return (
    <div
      className="rounded-2xl overflow-hidden border-2 fade-in-up"
      style={{
        borderColor: event.borderColor,
        background: event.theme,
      }}
    >
      {/* 헤더 — 항상 표시 */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* 이모지 + 이름 */}
        <span
          className="text-3xl"
          style={{
            filter: isSpecialDay ? 'drop-shadow(0 0 8px rgba(255,200,0,0.8))' : 'none',
            animation: isSpecialDay ? 'firePulse 1.5s ease-in-out infinite' : 'none',
          }}
        >
          {event.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-black text-sm"
              style={{ color: event.accentColor }}
            >
              {isSpecialDay ? '🎉 오늘은 ' : '🗓️ 이달의 절기 · '}
              {event.name}
              {isSpecialDay ? '!' : ''}
            </span>
            {event.bonusCategory && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: event.accentColor }}
              >
                {categoryLabel[event.bonusCategory] ?? event.bonusCategory} 보너스
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 truncate mt-0.5">{event.description}</p>
        </div>
        <span className="text-gray-400 text-xs ml-1 flex-shrink-0">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* 상세 — 펼쳤을 때 */}
      {expanded && (
        <div
          className="px-4 pb-4 pt-0 border-t"
          style={{ borderColor: `${event.borderColor}60` }}
        >
          {/* 교육 팁 */}
          <div className="mt-3 bg-white/60 rounded-xl p-3">
            <p className="text-xs font-bold mb-1" style={{ color: event.accentColor }}>
              💡 이달의 학습 포인트
            </p>
            <p className="text-xs text-gray-700 leading-relaxed">{event.tip}</p>
          </div>

          {/* 보너스 카테고리 안내 */}
          {event.bonusCategory && (
            <div
              className="mt-2 rounded-xl p-3 flex items-center gap-2"
              style={{ background: `${event.accentColor}18`, border: `1px solid ${event.accentColor}40` }}
            >
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-xs font-black" style={{ color: event.accentColor }}>
                  이달의 보너스 학당
                </p>
                <p className="text-[11px] text-gray-600">
                  <span className="font-bold">{categoryLabel[event.bonusCategory]}</span> 퀴즈를 풀면 XP +20% 추가!
                </p>
              </div>
            </div>
          )}

          {/* 이달의 배지 */}
          <div className="mt-2 flex items-center justify-between bg-white/50 rounded-xl px-3 py-2">
            <div>
              <p className="text-[10px] text-gray-500">이달 출석 배지</p>
              <p className="text-sm font-black" style={{ color: event.accentColor }}>{event.badge}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500">획득 조건</p>
              <p className="text-[11px] font-bold text-gray-600">이달 3일 이상 출석</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
