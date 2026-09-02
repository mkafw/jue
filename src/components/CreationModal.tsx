import React, { useState } from 'react';
import { X, Target, Zap, Plus, Trash2, Link as LinkIcon, AlertCircle, Radiation } from 'lucide-react';
import { Question, Objective, EntityType, LearningLevel, KeyResult, Failure } from '../types';
import { DomainRules } from '../services/DomainRules';

interface CreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateQuestion: (q: Question) => Promise<boolean>;
  onCreateObjective: (o: Objective) => Promise<boolean>;
  onCreateFailure: (f: Failure) => Promise<boolean>;
}

type TabType = 'QA' | 'OKR' | 'FAILURE';

export const CreationModal: React.FC<CreationModalProps> = ({
  isOpen,
  onClose,
  onCreateQuestion,
  onCreateObjective,
  onCreateFailure,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('QA');

  const [qTitle, setQTitle] = useState('');
  const [qContent, setQContent] = useState('');
  const [qLevel, setQLevel] = useState<LearningLevel>(LearningLevel.L0_TOOL);
  const [qTags, setQTags] = useState('');

  const [oTitle, setOTitle] = useState('');
  const [oDesc, setODesc] = useState('');
  const [keyResults, setKeyResults] = useState<Partial<KeyResult>[]>([{ title: '', metric: '' }]);

  const [fDesc, setFDesc] = useState('');
  const [fAnalysis, setFAnalysis] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const timestamp = new Date().toISOString();

    if (activeTab === 'QA') {
      const newQuestion: Question = {
        id: `q-${Date.now()}`,
        type: EntityType.QUESTION,
        title: qTitle,
        content: qContent,
        level: qLevel,
        tags: qTags.split(',').map((t) => t.trim()).filter(Boolean),
        linkedQuestionIds: [],
        linkedOKRIds: [],
        status: 'Draft',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await onCreateQuestion(newQuestion);
    } else if (activeTab === 'OKR') {
      const newObjective: Objective = {
        id: `o-${Date.now()}`,
        type: EntityType.OBJECTIVE,
        title: oTitle,
        description: oDesc,
        linkedQuestionIds: [],
        keyResults: keyResults
          .filter((kr) => kr.title)
          .map((kr, idx) => ({
            id: `kr-${Date.now()}-${idx}`,
            type: EntityType.KEY_RESULT,
            title: kr.title || 'Untitled',
            metric: kr.metric || 'Boolean',
            status: 'Pending',
            linkedQuestionIds: [],
            createdAt: timestamp,
            updatedAt: timestamp,
          })),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await onCreateObjective(newObjective);
    } else {
      const newFailure: Failure = {
        id: `f-${Date.now()}`,
        type: EntityType.FAILURE,
        description: fDesc,
        analysis5W2H: fAnalysis,
        status: 'New',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await onCreateFailure(newFailure);
    }

    handleClose();
  };

  const handleClose = () => {
    setQTitle('');
    setQContent('');
    setOTitle('');
    setODesc('');
    setKeyResults([{ title: '', metric: '' }]);
    setFDesc('');
    setFAnalysis('');
    onClose();
  };

  const canSubmitQA = qTitle.length > 0 && DomainRules.validateCognitiveCost(qContent);
  const canSubmitOKR = DomainRules.validateObjectiveConfig(
    oTitle,
    keyResults.filter((kr) => kr.title).length
  );
  const canSubmitFailure = fDesc.length > 5;

  const canSubmit =
    activeTab === 'QA' ? canSubmitQA : activeTab === 'OKR' ? canSubmitOKR : canSubmitFailure;

  const tabs = [
    { id: 'QA' as TabType, label: '认知', icon: Zap, accent: 'text-gold border-gold' },
    { id: 'OKR' as TabType, label: '践行', icon: Target, accent: 'text-wisteria border-wisteria' },
    { id: 'FAILURE' as TabType, label: '省思', icon: Radiation, accent: 'text-cinnabar border-cinnabar' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-2xl bg-paper border border-line rounded-input overflow-hidden flex flex-col max-h-[90vh] shadow-paper">
        {/* Tab 切换 */}
        <div className="flex border-b border-line shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 flex items-center justify-center space-x-2 transition-all border-b-2 ${
                activeTab === tab.id
                  ? `${tab.accent} bg-paper-card/50`
                  : 'text-ink-faint border-transparent hover:text-ink-soft hover:bg-paper-card/30'
              }`}
            >
              <tab.icon size={16} strokeWidth={1.5} />
              <span className="font-serif font-extralight tracking-widest-2 text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 内容 */}
        <div className="p-5 md:p-7 overflow-y-auto flex-1">
          {activeTab === 'QA' && (
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-medium text-ink-faint tracking-widest mb-2 block">
                  问题 / 概念
                </label>
                <input
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  placeholder="例如：注意力机制是如何工作的？"
                  className="stationery-input"
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-ink-faint tracking-widest mb-2 block">
                    认知层级
                  </label>
                  <div className="flex bg-paper-input p-0.5 rounded-input border border-line">
                    {[LearningLevel.L0_TOOL, LearningLevel.L1_PATTERN, LearningLevel.L2_SELF].map(
                      (lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setQLevel(lvl)}
                          className={`flex-1 py-2 rounded-ticket text-xs tracking-wider transition-all ${
                            qLevel === lvl ? 'bg-ink text-paper' : 'text-ink-faint hover:text-ink'
                          }`}
                        >
                          {lvl === 0 ? '器 · 工具' : lvl === 1 ? '法 · 模式' : '道 · 体系'}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-ink-faint tracking-widest mb-2 block">
                    标签
                  </label>
                  <input
                    value={qTags}
                    onChange={(e) => setQTags(e.target.value)}
                    placeholder="逗号分隔"
                    className="stationery-input text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-medium text-ink-faint tracking-widest">
                    分析与思考
                  </label>
                  <span
                    className={`text-[10px] flex items-center transition-colors ${
                      canSubmitQA ? 'text-celadon' : 'text-cinnabar'
                    }`}
                  >
                    <LinkIcon size={10} className="mr-1" />
                    {canSubmitQA ? '已锚定' : '需包含 [[ 关联 ]] 或 @ 附件'}
                  </span>
                </div>
                <textarea
                  value={qContent}
                  onChange={(e) => setQContent(e.target.value)}
                  rows={6}
                  placeholder="支持 Markdown。需包含关联 [[...]] 或附件 @... 方可保存。"
                  className={`stationery-input font-mono text-xs ${canSubmitQA ? '' : 'border-cinnabar/30 focus:border-cinnabar/50'}`}
                />
              </div>
            </div>
          )}

          {activeTab === 'OKR' && (
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-medium text-ink-faint tracking-widest mb-2 block">
                  目标
                </label>
                <input
                  value={oTitle}
                  onChange={(e) => setOTitle(e.target.value)}
                  placeholder="例如：掌握向量数据库"
                  className="stationery-input"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-ink-faint tracking-widest mb-2 block">
                  为何重要 · 策略说明
                </label>
                <textarea
                  value={oDesc}
                  onChange={(e) => setODesc(e.target.value)}
                  rows={3}
                  placeholder="这个目标为何重要？达成路径是什么？"
                  className="stationery-input text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-ink-faint tracking-widest mb-2 block">
                  关键结果
                </label>
                <div className="space-y-2">
                  {keyResults.map((kr, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        value={kr.title}
                        onChange={(e) => {
                          const newKRs = [...keyResults];
                          newKRs[idx].title = e.target.value;
                          setKeyResults(newKRs);
                        }}
                        placeholder="关键结果"
                        className="flex-[2] stationery-input text-sm"
                      />
                      <input
                        value={kr.metric}
                        onChange={(e) => {
                          const newKRs = [...keyResults];
                          newKRs[idx].metric = e.target.value;
                          setKeyResults(newKRs);
                        }}
                        placeholder="度量"
                        className="flex-1 stationery-input text-sm"
                      />
                      <button
                        onClick={() => setKeyResults(keyResults.filter((_, i) => i !== idx))}
                        className="p-2 text-ink-faint hover:text-cinnabar transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setKeyResults([...keyResults, { title: '', metric: '' }])}
                    className="flex items-center text-xs text-wisteria tracking-wider hover:text-ink transition-colors"
                  >
                    <Plus size={14} className="mr-1" /> 添加关键结果
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'FAILURE' && (
            <div className="space-y-5">
              <div className="bg-cinnabar/5 border border-cinnabar/20 p-4 rounded-card flex items-start space-x-3">
                <AlertCircle className="text-cinnabar shrink-0 mt-0.5" size={18} strokeWidth={1.5} />
                <div>
                  <h4 className="text-cinnabar text-sm font-medium mb-1">省思录</h4>
                  <p className="text-xs text-ink-soft">记录失败是优化的第一步。</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-ink-faint tracking-widest mb-2 block">
                  发生了什么？
                </label>
                <textarea
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                  rows={2}
                  placeholder="例如：Agent 在第三步陷入无限循环…"
                  className="stationery-input"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-ink-faint tracking-widest mb-2 block">
                  初步分析（五W二H）
                </label>
                <textarea
                  value={fAnalysis}
                  onChange={(e) => setFAnalysis(e.target.value)}
                  rows={6}
                  placeholder="为何失败？系统如何反应？"
                  className="stationery-input font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="p-4 md:p-5 border-t border-line bg-paper-card/40 flex justify-end space-x-3 shrink-0">
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-card text-ink-soft hover:text-ink text-sm transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-6 py-2 rounded-card text-sm tracking-wider flex items-center transition-all ${
              canSubmit
                ? 'bg-ink text-paper hover:bg-ink-soft'
                : 'bg-paper-deep text-ink-ghost cursor-not-allowed'
            }`}
          >
            {activeTab === 'QA' ? '落笔' : activeTab === 'OKR' ? '立志' : '录思'}
          </button>
        </div>

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-ink-faint hover:text-ink transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
