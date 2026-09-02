import React, { useState, useMemo } from 'react';
import { Question, Objective, Failure } from '../types';
import { Search, X, FileQuestion, Target, AlertTriangle } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  objectives: Objective[];
  failures: Failure[];
  onSelectResult: (type: 'QUESTION' | 'OBJECTIVE' | 'FAILURE', id: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  questions,
  objectives,
  failures,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return { questions: [], objectives: [], failures: [] };

    const q = query.toLowerCase();

    return {
      questions: questions
        .filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            i.content.toLowerCase().includes(q) ||
            i.tags.some((t) => t.toLowerCase().includes(q))
        )
        .slice(0, 5),
      objectives: objectives
        .filter((i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
        .slice(0, 5),
      failures: failures
        .filter(
          (i) =>
            i.description.toLowerCase().includes(q) || i.analysis5W2H?.toLowerCase().includes(q)
        )
        .slice(0, 5),
    };
  }, [query, questions, objectives, failures]);

  const total = results.questions.length + results.objectives.length + results.failures.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-paper border border-line rounded-input overflow-hidden shadow-paper">
        <div className="flex items-center gap-3 p-4 border-b border-line">
          <Search className="text-ink-faint" size={18} strokeWidth={1.5} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="检索问题、目标、省思…"
            className="flex-1 bg-transparent text-ink placeholder:text-ink-ghost outline-none text-sm font-light"
            autoFocus
          />
          <button onClick={onClose} className="text-ink-faint hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {query && total === 0 && (
            <div className="p-8 text-center text-ink-faint text-sm">未寻得相关卷轴</div>
          )}

          {!query && (
            <div className="p-8 text-center text-ink-faint text-sm">输入关键词以检索知识网络</div>
          )}

          {results.questions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-[10px] text-ink-faint tracking-widest flex items-center gap-2 font-medium">
                <FileQuestion size={13} className="text-gold" /> 问题
              </div>
              {results.questions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectResult('QUESTION', item.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-card hover:bg-paper-deep flex items-center gap-3 transition-colors"
                >
                  <FileQuestion className="text-gold shrink-0" size={15} strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink truncate">{item.title}</div>
                    <div className="text-xs text-ink-faint truncate">
                      {item.content.substring(0, 50)}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-ticket border shrink-0 ${
                      item.status === 'Verified'
                        ? 'bg-celadon/5 text-celadon border-celadon/20'
                        : item.status === 'Answered'
                        ? 'bg-gold/5 text-gold border-gold/20'
                        : 'bg-paper-deep text-ink-faint border-line/50'
                    }`}
                  >
                    {item.status === 'Verified' ? '已证' : item.status === 'Answered' ? '已答' : '草稿'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {results.objectives.length > 0 && (
            <div className="p-2 border-t border-line/40">
              <div className="px-3 py-2 text-[10px] text-ink-faint tracking-widest flex items-center gap-2 font-medium">
                <Target size={13} className="text-wisteria" /> 目标
              </div>
              {results.objectives.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectResult('OBJECTIVE', item.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-card hover:bg-paper-deep flex items-center gap-3 transition-colors"
                >
                  <Target className="text-wisteria shrink-0" size={15} strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink truncate">{item.title}</div>
                    <div className="text-xs text-ink-faint truncate">
                      {item.description.substring(0, 50)}
                    </div>
                  </div>
                  <span className="text-xs text-ink-faint shrink-0">{item.keyResults.length} KR</span>
                </button>
              ))}
            </div>
          )}

          {results.failures.length > 0 && (
            <div className="p-2 border-t border-line/40">
              <div className="px-3 py-2 text-[10px] text-ink-faint tracking-widest flex items-center gap-2 font-medium">
                <AlertTriangle size={13} className="text-cinnabar" /> 省思
              </div>
              {results.failures.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectResult('FAILURE', item.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-card hover:bg-paper-deep flex items-center gap-3 transition-colors"
                >
                  <AlertTriangle className="text-cinnabar shrink-0" size={15} strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink truncate">{item.description.substring(0, 40)}</div>
                    <div className="text-xs text-ink-faint">
                      {item.status === 'New' ? '待省思' : item.status === 'Analyzed' ? '已析' : '已沉淀'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
