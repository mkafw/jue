import React, { useState } from 'react';
import { GitBranch, Terminal, FileText, CheckCircle, Clock, ChevronRight, X, DownloadCloud, ListChecks, Loader2, CircleDashed } from 'lucide-react';
import { Iteration } from '../types';
import { INITIAL_ITERATIONS } from '../services/mockData';

interface VersionControlProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURE_MATRIX = [
  {
    category: '一 · 核心架构',
    items: [
      { id: 'arch-1', label: '五层 DDD-Lite 结构', status: 'DONE' },
      { id: 'arch-2', label: 'Repository 工厂模式', status: 'DONE' },
      { id: 'arch-3', label: 'Supabase 集成', status: 'DONE' },
      { id: 'arch-4', label: '向量存储接口 (SeekDB)', status: 'TODO' },
    ],
  },
  {
    category: '二 · 问学画布',
    items: [
      { id: 'qa-1', label: '瀑布流卡片布局', status: 'DONE' },
      { id: 'qa-2', label: 'L0-L2 认知层级筛选', status: 'DONE' },
      { id: 'qa-3', label: 'Markdown 内容渲染', status: 'DONE' },
      { id: 'qa-4', label: '智能输入 ([[ & @)', status: 'WIP' },
      { id: 'qa-5', label: '附件/关联自动补全', status: 'TODO' },
    ],
  },
  {
    category: '三 · 践行螺旋',
    items: [
      { id: 'okr-1', label: '目标与关键结果可视化', status: 'DONE' },
      { id: 'okr-2', label: '依赖关系连线', status: 'DONE' },
      { id: 'okr-3', label: '交互状态更新', status: 'TODO' },
      { id: 'okr-4', label: '创建目标弹窗', status: 'TODO' },
    ],
  },
  {
    category: '四 · 知识图谱',
    items: [
      { id: 'grp-1', label: '双螺旋数学投影', status: 'DONE' },
      { id: 'grp-2', label: '节点悬浮提示', status: 'DONE' },
      { id: 'grp-3', label: '结构横档渲染', status: 'DONE' },
      { id: 'grp-4', label: 'Shift+Click 删除节点', status: 'DONE' },
      { id: 'grp-5', label: '数据驱动关联可视化', status: 'TODO' },
    ],
  },
  {
    category: '五 · 省思沉淀',
    items: [
      { id: 'sed-1', label: '失败队列界面', status: 'DONE' },
      { id: 'sed-2', label: '沉淀服务 (失败→问题)', status: 'DONE' },
      { id: 'sed-3', label: '五W二H 分析编辑器', status: 'WIP' },
    ],
  },
];

export const VersionControl: React.FC<VersionControlProps> = ({ isOpen, onClose }) => {
  const [iterations, setIterations] = useState<Iteration[]>(INITIAL_ITERATIONS);
  const [selectedIteration, setSelectedIteration] = useState<Iteration>(
    INITIAL_ITERATIONS[INITIAL_ITERATIONS.length - 1]
  );
  const [activeTab, setActiveTab] = useState<'LOG' | 'CONTEXT' | 'FEATURES'>('FEATURES');

  if (!isOpen) return null;

  const handleCommit = () => {
    const newIteration: Iteration = {
      id: `it-${Date.now()}`,
      hash: Math.random().toString(16).substring(2, 8),
      timestamp: new Date().toLocaleString(),
      message: 'WIP: 同步上下文文件',
      changes: { added: 2, modified: 1, sedimented: 0 },
      contextSummary:
        '# Iteration [Current]\n\n- **Status**: Synced.\n- **Action**: Created .gitignore and .ai-context.md.\n- **Outcome**: Project structure is now fully compliant with PRD.',
    };
    setIterations([newIteration, ...iterations]);
    setSelectedIteration(newIteration);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle size={13} className="text-celadon" strokeWidth={1.5} />;
      case 'WIP':
        return <Loader2 size={13} className="text-gold animate-spin" strokeWidth={1.5} />;
      case 'TODO':
        return <CircleDashed size={13} className="text-ink-ghost" strokeWidth={1.5} />;
      default:
        return <CircleDashed size={13} className="text-ink-ghost" strokeWidth={1.5} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-4xl h-[600px] bg-paper border border-line rounded-input flex overflow-hidden shadow-paper">
        {/* 侧边栏：迭代历史 */}
        <div className="w-1/3 border-r border-line bg-paper-card/40 flex flex-col">
          <div className="p-4 border-b border-line flex items-center justify-between">
            <h3 className="font-serif font-extralight text-sm text-ink tracking-widest-2 flex items-center">
              <GitBranch size={15} className="mr-2 text-gold" strokeWidth={1.5} />
              迭代录
            </h3>
            <span className="text-[10px] bg-paper-deep px-2 py-0.5 rounded-ticket text-ink-faint border border-line/50">
              main
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {iterations.map((it) => (
              <div
                key={it.id}
                onClick={() => setSelectedIteration(it)}
                className={`p-3 rounded-card border cursor-pointer transition-all ${
                  selectedIteration.id === it.id
                    ? 'bg-paper border-gold/40'
                    : 'bg-transparent border-transparent hover:bg-paper-deep'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-[10px] text-gold">{it.hash}</span>
                  <span className="text-[10px] text-ink-faint">{it.timestamp.split(' ')[0]}</span>
                </div>
                <div className="text-xs text-ink font-light truncate mb-2">{it.message}</div>
                <div className="flex space-x-3 text-[10px] text-ink-faint">
                  <span className="flex items-center">
                    <span className="w-1 h-1 rounded-full bg-celadon mr-1" />
                    +{it.changes.added}
                  </span>
                  <span className="flex items-center">
                    <span className="w-1 h-1 rounded-full bg-gold mr-1" />
                    ~{it.changes.modified}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-line">
            <button
              onClick={handleCommit}
              className="w-full py-2 bg-ink text-paper rounded-card text-xs tracking-wider hover:bg-ink-soft transition-colors flex items-center justify-center"
            >
              <DownloadCloud size={13} className="mr-2" />
              快照
            </button>
          </div>
        </div>

        {/* 主内容 */}
        <div className="flex-1 flex flex-col bg-paper">
          {/* Tab */}
          <div className="h-12 border-b border-line flex items-center px-5 justify-between shrink-0">
            <div className="flex space-x-5">
              {[
                { id: 'FEATURES' as const, label: '功能矩阵', icon: ListChecks },
                { id: 'LOG' as const, label: '迭代日志', icon: Terminal },
                { id: 'CONTEXT' as const, label: '上下文', icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center text-xs pb-3 pt-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'text-ink border-gold'
                      : 'text-ink-faint border-transparent hover:text-ink-soft'
                  }`}
                >
                  <tab.icon size={13} className="mr-1.5" strokeWidth={1.5} />
                  {tab.label}
                </button>
              ))}
            </div>

            <button onClick={onClose} className="text-ink-faint hover:text-ink">
              <X size={16} />
            </button>
          </div>

          {/* 内容 */}
          <div className="flex-1 p-6 overflow-y-auto text-sm leading-relaxed text-ink-soft">
            {activeTab === 'FEATURES' && (
              <div className="space-y-6">
                {FEATURE_MATRIX.map((section, idx) => (
                  <div key={idx}>
                    <h4 className="text-gold text-[10px] tracking-widest font-medium mb-3 border-b border-line/60 pb-1.5">
                      {section.category}
                    </h4>
                    <div className="space-y-1.5">
                      {section.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-card bg-paper-card/40 border border-line/40 hover:border-line transition-colors"
                        >
                          <span className="text-xs text-ink-soft">{item.label}</span>
                          <div className="flex items-center space-x-1.5 bg-paper px-2 py-0.5 rounded-ticket border border-line/40">
                            {getStatusIcon(item.status)}
                            <span
                              className={`text-[9px] tracking-wider font-medium ${
                                item.status === 'DONE'
                                  ? 'text-celadon'
                                  : item.status === 'WIP'
                                  ? 'text-gold'
                                  : 'text-ink-faint'
                              }`}
                            >
                              {item.status === 'DONE' ? '已成' : item.status === 'WIP' ? '进行中' : '待启'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'LOG' && (
              <div>
                <div className="flex items-center mb-4 text-wisteria">
                  <Terminal size={14} className="mr-2" strokeWidth={1.5} />
                  <span className="text-[10px] tracking-widest font-medium">执行记录</span>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-xs text-ink-soft bg-paper-card/50 p-4 rounded-card border border-line/40">
                  {selectedIteration.contextSummary}
                </pre>
              </div>
            )}

            {activeTab === 'CONTEXT' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-gold text-[10px] tracking-widest font-medium">项目上下文</div>
                  <div className="text-[10px] text-ink-faint">只读</div>
                </div>
                <div className="bg-paper-card/50 p-4 rounded-card border border-line/40">
                  <pre className="whitespace-pre-wrap font-mono text-xs text-ink-soft">{`# QA-OS 项目上下文
> 本文件为人机协作的中央同步点。

## 1. 项目身份
- **名称**: QA-OS (螺旋版)
- **核心隐喻**: DNA 双螺旋 (认知 + 践行)
- **美学**: 烟光暮山紫 × 瘦金体 × 文具店社论风
- **状态**: 视觉重构阶段

## 2. 活动配置
- **框架**: React 19 + Tailwind CSS + Vite
- **可视化**: D3.js (2D) + Three.js (3D)
- **主题约束**:
  - 底色: #F6F3F8 (烟光暮山紫)
  - 墨迹: #35303A (松烟墨)
  - 徽标: #A88C52 (暗金)
  - 形态: 6-8px 锐利圆角, 1px 极细边框

## 3. 迭代记录
- **当前哈希**: ${selectedIteration.hash}
- **焦点**: 视觉系统重构

## 4. 已知问题
- [ ] 连接真实 GitHub API (当前模拟)
- [ ] 实现向量搜索
- [ ] 移动端响应式优化
`}</pre>
                </div>
              </div>
            )}
          </div>

          {/* 底部状态 */}
          <div className="h-9 border-t border-line flex items-center px-5 justify-between bg-paper-card/30 text-[10px] text-ink-faint shrink-0">
            <div className="flex items-center">
              <Clock size={11} className="mr-1.5" />
              刚刚同步
            </div>
            <div className="flex items-center font-mono">
              main <ChevronRight size={9} className="mx-1" /> {selectedIteration.hash}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
