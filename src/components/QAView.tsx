import React, { useState, useRef, useEffect } from 'react';
import { Question, LearningLevel, EntityType } from '../types';
import { Link as LinkIcon, Target, Image as ImageIcon, Send, Lock, Unlock, Zap } from 'lucide-react';
import { DomainRules } from '../services/DomainRules';

interface QAViewProps {
  questions: Question[];
  highlightedId?: string | null;
  onAddQuestion?: (q: Question) => Promise<boolean>;
  onNavigateToGraph?: () => void;
}

const levelLabels: Record<LearningLevel, string> = {
  [LearningLevel.L0_TOOL]: '器',
  [LearningLevel.L1_PATTERN]: '法',
  [LearningLevel.L2_SELF]: '道',
};

export const QAView: React.FC<QAViewProps> = ({ questions, highlightedId, onAddQuestion }) => {
  const [activeLevel, setActiveLevel] = useState<LearningLevel | 'ALL'>('ALL');
  const [inputContent, setInputContent] = useState('');
  const [showAssetMenu, setShowAssetMenu] = useState(false);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (highlightedId && cardRefs.current.has(highlightedId)) {
      const el = cardRefs.current.get(highlightedId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedId]);

  const hasPaidCost = DomainRules.validateCognitiveCost(inputContent);
  const canSubmit = inputContent.trim().length > 0 && hasPaidCost;

  const filtered = activeLevel === 'ALL' ? questions : questions.filter((q) => q.level === activeLevel);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputContent(val);
    if (val.endsWith('@')) {
      setShowAssetMenu(true);
      setShowLinkMenu(false);
    } else if (val.endsWith('[[')) {
      setShowLinkMenu(true);
      setShowAssetMenu(false);
    } else {
      if (!val.includes('@')) setShowAssetMenu(false);
      if (!val.includes('[[')) setShowLinkMenu(false);
    }
  };

  const insertToken = (token: string, type: 'asset' | 'link') => {
    if (type === 'asset') {
      setInputContent((prev) => prev.replace(/@$/, '') + `@${token} `);
      setShowAssetMenu(false);
    } else {
      setInputContent((prev) => prev.replace(/\[\[$/, '') + `[[${token}]] `);
      setShowLinkMenu(false);
    }
    inputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!canSubmit || !onAddQuestion) return;
    setIsSubmitting(true);

    const title =
      inputContent.split('\n')[0].substring(0, 50) + (inputContent.length > 50 ? '…' : '');

    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type: EntityType.QUESTION,
      title,
      content: inputContent,
      level: LearningLevel.L0_TOOL,
      tags: ['Quick'],
      linkedQuestionIds: [],
      linkedOKRIds: [],
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const success = await onAddQuestion(newQuestion);
    if (success) {
      setInputContent('');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="relative min-h-full flex flex-col pb-40">
      {/* 层级筛选 */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-paper-card border border-line rounded-input p-0.5">
          {(['ALL', LearningLevel.L0_TOOL, LearningLevel.L1_PATTERN, LearningLevel.L2_SELF] as const).map(
            (lvl) => (
              <button
                key={String(lvl)}
                onClick={() => setActiveLevel(lvl)}
                className={`px-4 py-1.5 text-[10px] font-medium tracking-widest rounded-ticket transition-all ${
                  activeLevel === lvl ? 'bg-ink text-paper' : 'text-ink-faint hover:text-ink'
                }`}
              >
                {lvl === 'ALL' ? '全部' : levelLabels[lvl]}
              </button>
            )
          )}
        </div>
      </div>

      {/* 问题卡片瀑布流 */}
      <div className="columns-1 md:columns-2 xl:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6 mx-auto max-w-7xl">
        {filtered.map((q) => {
          const isCrystallized = q.linkedOKRIds.length > 0;
          const isHighlighted = highlightedId === q.id;

          return (
            <div
              key={q.id}
              ref={(el) => {
                if (el) cardRefs.current.set(q.id, el);
              }}
              className={`break-inside-avoid group transition-all duration-500 ${
                isHighlighted ? 'scale-[1.02] z-10' : ''
              }`}
            >
              <div
                className={`paper-card overflow-hidden relative ${
                  isHighlighted ? 'border-gold/60' : isCrystallized ? 'border-gold/30' : ''
                }`}
              >
                {/* 页码装饰 */}
                <span className="page-corner">{q.id.slice(-4)}</span>

                {q.assets && q.assets.length > 0 && (
                  <div className="relative h-40 w-full overflow-hidden border-b border-line">
                    <img
                      src={q.assets[0]}
                      alt="Asset"
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-2 right-2 bg-paper/90 border border-line px-2 py-0.5 rounded-ticket text-[9px] text-ink-soft flex items-center">
                      <ImageIcon size={10} className="mr-1" /> 图
                    </div>
                  </div>
                )}

                <div className="p-5 relative">
                  <div className="flex justify-between items-start mb-3">
                    <span className="ticket-label">{levelLabels[q.level]} · {q.status}</span>
                  </div>

                  <h3
                    className={`font-serif font-extralight text-base md:text-lg mb-2 leading-snug tracking-wide ${
                      isCrystallized ? 'text-gold' : 'text-ink'
                    }`}
                  >
                    {q.title}
                  </h3>

                  <div className="text-xs text-ink-soft mb-4 leading-relaxed font-light whitespace-pre-wrap">
                    {q.content}
                  </div>

                  <div className="flex items-center justify-between border-t border-line/60 pt-3">
                    <div className="flex space-x-2">
                      {q.linkedOKRIds.length > 0 && (
                        <Target size={13} className="text-wisteria" strokeWidth={1.5} />
                      )}
                      {q.linkedQuestionIds.length > 0 && (
                        <LinkIcon size={13} className="text-gold" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="flex gap-1">
                      {q.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 bg-paper-deep rounded-ticket text-[9px] text-ink-faint border border-line/50"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-ink-faint font-serif text-sm tracking-widest">
          此卷尚空，待君落笔
        </div>
      )}

      {/* 底部输入区 */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 flex justify-center pointer-events-none z-40">
        <div className="pointer-events-auto w-full max-w-2xl mx-4">
          <div className="relative">
            <div className="bg-paper border border-line rounded-input shadow-paper overflow-hidden flex flex-col">
              <textarea
                ref={inputRef}
                value={inputContent}
                onChange={handleInput}
                className="w-full bg-transparent text-ink px-5 py-3.5 focus:outline-none text-sm placeholder:text-ink-ghost resize-none font-light"
                placeholder="输入 [[ 关联节点，或 @ 添加附件…"
                rows={canSubmit ? 3 : 1}
              />

              <div className="flex justify-between items-center px-4 py-2 border-t border-line/60 bg-paper-card/50">
                <div className="flex space-x-3 text-[10px] text-ink-faint font-medium tracking-wider">
                  <span className={inputContent.includes('[[') ? 'text-gold' : ''}>[[ 关联 ]]</span>
                  <span className={inputContent.includes('@') ? 'text-wisteria' : ''}>@ 附件</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex items-center space-x-1 text-[10px] tracking-wider transition-colors ${
                      hasPaidCost ? 'text-celadon' : 'text-cinnabar'
                    }`}
                  >
                    {hasPaidCost ? <Unlock size={10} /> : <Lock size={10} />}
                    <span>{hasPaidCost ? '已锚定' : '需关联'}</span>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className={`w-8 h-8 rounded-ticket flex items-center justify-center transition-all ${
                      canSubmit ? 'bg-ink text-paper hover:bg-ink-soft' : 'bg-paper-deep text-ink-ghost'
                    }`}
                  >
                    <Send size={13} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>

            {showLinkMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-paper border border-line rounded-input overflow-hidden shadow-paper">
                <div className="px-3 py-2 text-[10px] text-ink-faint tracking-widest border-b border-line/60 font-medium">
                  可关联节点
                </div>
                {questions.slice(0, 3).map((q) => (
                  <div
                    key={q.id}
                    onClick={() => insertToken(q.id, 'link')}
                    className="px-3 py-2.5 hover:bg-paper-deep cursor-pointer flex items-center space-x-2 text-ink-soft text-xs"
                  >
                    <Zap size={12} className="text-gold" />
                    <span className="truncate">{q.title}</span>
                  </div>
                ))}
              </div>
            )}

            {showAssetMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-paper border border-line rounded-input overflow-hidden shadow-paper">
                <div className="px-3 py-2 text-[10px] text-ink-faint tracking-widest border-b border-line/60 font-medium">
                  可用附件
                </div>
                <div
                  onClick={() => insertToken('https://placehold.co/600x400', 'asset')}
                  className="px-3 py-2.5 hover:bg-paper-deep cursor-pointer flex items-center space-x-2 text-ink-soft text-xs"
                >
                  <ImageIcon size={12} className="text-wisteria" />
                  <span className="truncate">arch_diagram_v1.png</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
