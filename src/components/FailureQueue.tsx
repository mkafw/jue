import React from 'react';
import { Failure } from '../types';
import { ArrowRight, Radiation, RefreshCw } from 'lucide-react';

interface FailureQueueProps {
  failures: Failure[];
  onSediment: (failureId: string) => void;
}

export const FailureQueue: React.FC<FailureQueueProps> = ({ failures, onSediment }) => {
  return (
    <div className="max-w-3xl mx-auto pb-24 space-y-6">
      {/* 卷首说明 */}
      <div className="paper-card p-5 md:p-6 border-l-2 border-l-cinnabar/40">
        <h3 className="font-serif font-extralight text-xl text-ink tracking-widest-2 mb-2 flex items-center">
          <Radiation className="mr-2 text-cinnabar" size={20} strokeWidth={1.5} />
          省思录
        </h3>
        <p className="text-sm text-ink-soft font-light">
          失败不是终点，而是新问题的种子。将执行中的挫败沉淀为认知，方能闭合循环。
        </p>
      </div>

      <div className="space-y-4">
        {failures.map((f) => (
          <div key={f.id} className="paper-card p-5 md:p-6 relative group">
            {/* 状态标记 */}
            <div className="absolute top-5 right-5">
              <span
                className={`inline-flex items-center text-[10px] tracking-wider px-2.5 py-0.5 rounded-ticket border ${
                  f.status === 'New'
                    ? 'bg-cinnabar/5 text-cinnabar border-cinnabar/20'
                    : 'bg-celadon/5 text-celadon border-celadon/20'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    f.status === 'New' ? 'bg-cinnabar' : 'bg-celadon'
                  }`}
                />
                {f.status === 'New' ? '待省思' : f.status === 'Analyzed' ? '已析' : '已沉淀'}
              </span>
            </div>

            <h4 className="font-serif font-extralight text-lg text-ink mb-4 pr-20 leading-snug">
              {f.description}
            </h4>

            {f.analysis5W2H && (
              <div className="bg-paper-card/60 border border-line/50 p-4 rounded-card mb-5">
                <div className="text-[10px] text-cinnabar tracking-widest mb-2 font-medium">
                  五W二H · 根因分析
                </div>
                <p className="text-xs text-ink-soft font-light leading-relaxed">{f.analysis5W2H}</p>
              </div>
            )}

            <div className="flex justify-end items-center">
              {f.convertedToQuestionId ? (
                <span className="flex items-center text-celadon text-xs tracking-wider">
                  <RefreshCw size={14} className="mr-2" strokeWidth={1.5} />
                  已沉淀为问题
                </span>
              ) : (
                <button
                  onClick={() => onSediment(f.id)}
                  className="flex items-center space-x-2 text-ink bg-paper-card hover:bg-ink hover:text-paper border border-line hover:border-ink px-5 py-2 rounded-card transition-all text-xs tracking-wider group/btn"
                >
                  <span>沉淀为问题</span>
                  <ArrowRight
                    size={14}
                    className="group-hover/btn:translate-x-1 transition-transform"
                    strokeWidth={1.5}
                  />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {failures.length === 0 && (
        <div className="text-center py-16 text-ink-faint font-serif text-sm tracking-widest">
          尚无失败记录，一切顺遂
        </div>
      )}
    </div>
  );
};
