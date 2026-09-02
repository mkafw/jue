import React, { useEffect, useRef } from 'react';
import { Objective, KeyResult } from '../types';
import { CheckCircle2, Circle, Target, ArrowRight } from 'lucide-react';

interface OKRViewProps {
  objectives: Objective[];
  highlightedId?: string | null;
  onToggleKR?: (objId: string, krId: string, currentStatus: KeyResult['status']) => void;
}

export const OKRView: React.FC<OKRViewProps> = ({ objectives, highlightedId, onToggleKR }) => {
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (highlightedId && cardRefs.current.has(highlightedId)) {
      const el = cardRefs.current.get(highlightedId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedId]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {objectives.map((obj, idx) => {
        const isHighlighted = highlightedId === obj.id;
        const completedKRs = obj.keyResults.filter((kr) => kr.status === 'Completed').length;

        return (
          <div
            key={obj.id}
            ref={(el) => {
              if (el) cardRefs.current.set(obj.id, el);
            }}
            className={`relative transition-all duration-500 ${isHighlighted ? 'scale-[1.01]' : ''}`}
          >
            {/* 连接线 */}
            {idx !== objectives.length - 1 && (
              <div className="absolute left-6 top-full h-8 w-px bg-line/60" />
            )}

            <div className={`paper-card overflow-hidden ${isHighlighted ? 'border-gold/50' : ''}`}>
              {/* 头部 */}
              <div className="p-5 md:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-card border border-wisteria/30 bg-wisteria/5 flex items-center justify-center">
                      <Target size={20} className="text-wisteria" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-[10px] text-gold tracking-widest uppercase mb-1 font-medium">
                        目标 · {String(idx + 1).padStart(2, '0')}
                      </div>
                      <h2 className="font-serif font-extralight text-xl text-ink tracking-wide">
                        {obj.title}
                      </h2>
                    </div>
                  </div>
                  <span className="ticket-label shrink-0">{obj.linkedQuestionIds.length} 关联</span>
                </div>

                <p className="text-sm text-ink-soft font-light leading-relaxed pl-1">{obj.description}</p>
              </div>

              {/* 关键结果列表 */}
              <div className="border-t border-line/60 bg-paper-card/40 p-4 md:p-5 space-y-2">
                {obj.keyResults.map((kr) => (
                  <div
                    key={kr.id}
                    onClick={() => onToggleKR && onToggleKR(obj.id, kr.id, kr.status)}
                    className={`flex items-center justify-between p-3 rounded-card transition-all border cursor-pointer group ${
                      kr.status === 'Completed'
                        ? 'bg-celadon/5 border-celadon/20'
                        : 'bg-transparent border-transparent hover:bg-paper-deep hover:border-line/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="transition-transform duration-200 group-hover:scale-110">
                        {kr.status === 'Completed' ? (
                          <CheckCircle2 className="text-celadon" size={20} strokeWidth={1.5} />
                        ) : (
                          <Circle className="text-ink-ghost group-hover:text-ink-faint" size={20} strokeWidth={1.5} />
                        )}
                      </div>
                      <div>
                        <span
                          className={`text-sm block transition-colors ${
                            kr.status === 'Completed' ? 'text-ink-faint line-through' : 'text-ink-soft'
                          }`}
                        >
                          {kr.title}
                        </span>
                        <span className="text-[10px] text-ink-faint font-mono mt-0.5 block">
                          {kr.metric}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {kr.status !== 'Completed' && (
                        <ArrowRight
                          size={14}
                          className="text-ink-ghost group-hover:text-ink-faint -translate-x-1 group-hover:translate-x-0 transition-all"
                        />
                      )}
                      <span
                        className={`text-[10px] tracking-wider px-2.5 py-0.5 rounded-ticket border ${
                          kr.status === 'Completed'
                            ? 'bg-celadon/10 text-celadon border-celadon/20'
                            : kr.status === 'In Progress'
                            ? 'bg-gold/10 text-gold border-gold/20'
                            : 'bg-paper-deep text-ink-faint border-line/50'
                        }`}
                      >
                        {kr.status === 'In Progress' ? '进行中' : kr.status === 'Completed' ? '已达成' : '待启'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 进度脚注 */}
              <div className="px-5 md:px-6 py-3 border-t border-line/60 flex items-center justify-between">
                <span className="text-[10px] text-ink-faint tracking-wider">
                  {completedKRs} / {obj.keyResults.length} 关键结果已达成
                </span>
                <div className="w-24 h-1 bg-paper-deep rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold/60 transition-all duration-500"
                    style={{
                      width: `${obj.keyResults.length > 0 ? (completedKRs / obj.keyResults.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {objectives.length === 0 && (
        <div className="text-center py-16 text-ink-faint font-serif text-sm tracking-widest">
          尚未设立目标，点击右上角 + 开始践行
        </div>
      )}
    </div>
  );
};
