import React from 'react';
import { Question, Objective, Failure } from '../types';
import { LayoutGrid, Target, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardViewProps {
  questions: Question[];
  objectives: Objective[];
  failures: Failure[];
  onNavigateToView: (view: 'QA' | 'OKR' | 'GRAPH' | 'FAILURE') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  questions,
  objectives,
  failures,
  onNavigateToView,
}) => {
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter((q) => q.status === 'Answered').length;
  const verifiedQuestions = questions.filter((q) => q.status === 'Verified').length;

  const totalObjectives = objectives.length;
  const completedObjectives = objectives.filter((o) =>
    o.keyResults.some((kr) => kr.status === 'Completed')
  ).length;

  const totalKRs = objectives.reduce((acc, o) => acc + o.keyResults.length, 0);
  const completedKRs = objectives.reduce(
    (acc, o) => acc + o.keyResults.filter((kr) => kr.status === 'Completed').length,
    0
  );

  const totalFailures = failures.length;
  const sedimentedFailures = failures.filter((f) => f.status === 'Sedimented').length;
  const pendingFailures = failures.filter((f) => f.status === 'New').length;

  const StatCard = ({
    title,
    value,
    subValue,
    icon: Icon,
    accent,
    onClick,
  }: {
    title: string;
    value: number;
    subValue?: string;
    icon: any;
    accent: string;
    onClick?: () => void;
  }) => (
    <div
      onClick={onClick}
      className={`paper-card p-5 md:p-6 ${onClick ? 'cursor-pointer hover:border-gold/50' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-ticket border ${accent}`}>
          <Icon size={18} strokeWidth={1.5} />
        </div>
        <span className="page-corner">{String(value).padStart(2, '0')}</span>
      </div>
      <div className="font-serif font-extralight text-3xl md:text-4xl text-ink mb-1 tracking-wide">
        {value}
      </div>
      <div className="text-xs text-ink-soft tracking-wider">{title}</div>
      {subValue && <div className="text-[10px] text-ink-faint mt-1.5 font-mono">{subValue}</div>}
    </div>
  );

  const ProgressBar = ({ value, max }: { value: number; max: number }) => {
    const percent = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="h-1 bg-paper-deep rounded-full overflow-hidden">
        <div
          className="h-full bg-gold/70 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* 卷首语 */}
      <div className="mb-8 md:mb-10">
        <h2 className="font-serif font-extralight text-2xl md:text-3xl text-ink tracking-shoujin mb-2">
          知识生态
        </h2>
        <p className="text-sm text-ink-soft font-light">
          以问题为种子，以践行为土壤，以失败为养分。
        </p>
        <div className="pencil-line w-24" />
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard
          title="问题"
          value={totalQuestions}
          subValue={`${answeredQuestions} 已答 · ${verifiedQuestions} 已证`}
          icon={LayoutGrid}
          accent="border-gold/30 text-gold bg-gold/5"
          onClick={() => onNavigateToView('QA')}
        />
        <StatCard
          title="目标"
          value={totalObjectives}
          subValue={`${completedObjectives} 推进中`}
          icon={Target}
          accent="border-wisteria/30 text-wisteria bg-wisteria/5"
          onClick={() => onNavigateToView('OKR')}
        />
        <StatCard
          title="关键结果"
          value={completedKRs}
          subValue={`/ ${totalKRs} 总计`}
          icon={TrendingUp}
          accent="border-celadon/30 text-celadon bg-celadon/5"
        />
        <StatCard
          title="待省思"
          value={pendingFailures}
          subValue={`${sedimentedFailures} 已沉淀`}
          icon={AlertTriangle}
          accent="border-cinnabar/30 text-cinnabar bg-cinnabar/5"
          onClick={() => onNavigateToView('FAILURE')}
        />
      </div>

      {/* 下方两栏 */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* OKR 进度 */}
        <div className="paper-card p-5 md:p-6">
          <h3 className="font-serif font-extralight text-lg text-ink tracking-widest-2 mb-5 flex items-center gap-2">
            <Target size={16} className="text-wisteria" strokeWidth={1.5} />
            目标进度
          </h3>
          <div className="space-y-4">
            {objectives.slice(0, 5).map((obj) => {
              const completed = obj.keyResults.filter((kr) => kr.status === 'Completed').length;
              const total = obj.keyResults.length;
              return (
                <div key={obj.id}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-ink-soft truncate flex-1 mr-2">{obj.title}</span>
                    <span className="text-ink-faint font-mono shrink-0">
                      {completed}/{total}
                    </span>
                  </div>
                  <ProgressBar value={completed} max={total} />
                </div>
              );
            })}
            {objectives.length === 0 && (
              <p className="text-ink-faint text-center py-4 text-xs">尚未设立目标</p>
            )}
          </div>
        </div>

        {/* 最近活动 */}
        <div className="paper-card p-5 md:p-6">
          <h3 className="font-serif font-extralight text-lg text-ink tracking-widest-2 mb-5 flex items-center gap-2">
            <LayoutGrid size={16} className="text-gold" strokeWidth={1.5} />
            新近问学
          </h3>
          <div className="space-y-1">
            {questions.slice(0, 5).map((q) => (
              <div
                key={q.id}
                className="flex items-center gap-3 py-2 px-2 rounded-ticket hover:bg-paper-deep transition-colors"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    q.status === 'Verified'
                      ? 'bg-celadon'
                      : q.status === 'Answered'
                      ? 'bg-gold'
                      : 'bg-ink-ghost'
                  }`}
                />
                <span className="text-xs text-ink-soft truncate flex-1">{q.title}</span>
                <span className="text-[10px] text-ink-faint font-mono shrink-0">
                  {new Date(q.updatedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="text-ink-faint text-center py-4 text-xs">尚未记录问题</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
