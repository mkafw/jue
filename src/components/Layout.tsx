import React from 'react';
import {
  LayoutGrid,
  Target,
  Network,
  AlertTriangle,
  GitBranch,
  Search,
  Plus,
  Home,
  Settings,
  Feather,
} from 'lucide-react';
import { ViewMode } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  toggleCreateModal: () => void;
  onOpenGit: () => void;
  onOpenSearch: () => void;
}

const viewTitles: Record<ViewMode, string> = {
  [ViewMode.DASHBOARD]: '卷首 · 总览',
  [ViewMode.QA_FIRST]: '问学 · 认知',
  [ViewMode.OKR_FIRST]: '践行 · 目标',
  [ViewMode.GRAPH]: '螺旋 · 图谱',
  [ViewMode.FAILURE_QUEUE]: '沉淀 · 省思',
  [ViewMode.SETTINGS]: '器用 · 设置',
  [ViewMode.THREE_D]: '螺旋 · 图谱',
};

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onChangeView,
  toggleCreateModal,
  onOpenGit,
  onOpenSearch,
}) => {
  const navItems = [
    { id: ViewMode.DASHBOARD, icon: Home, label: '卷首' },
    { id: ViewMode.QA_FIRST, icon: LayoutGrid, label: '问学' },
    { id: ViewMode.OKR_FIRST, icon: Target, label: '践行' },
    { id: ViewMode.GRAPH, icon: Network, label: '螺旋' },
    { id: ViewMode.FAILURE_QUEUE, icon: AlertTriangle, label: '沉淀' },
    { id: ViewMode.SETTINGS, icon: Settings, label: '器用' },
  ];

  const isFullHeightView = currentView === ViewMode.GRAPH;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full font-sans font-light bg-paper text-ink overflow-hidden relative">
      {/* 侧边栏 - 桌面 */}
      <nav className="hidden md:flex flex-col w-20 border-r border-line bg-paper-card/50 py-8 items-center relative">
        {/* 品牌徽标 */}
        <div className="mb-12 flex flex-col items-center">
          <div className="w-10 h-10 border border-gold/40 rounded-card flex items-center justify-center bg-paper">
            <Feather className="text-gold" size={18} strokeWidth={1.5} />
          </div>
          <div className="vertical-sign mt-3">问学</div>
        </div>

        {/* 导航节点 */}
        <div className="flex flex-col items-center space-y-2 flex-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-card transition-all duration-300 ${
                  isActive
                    ? 'bg-ink text-paper'
                    : 'text-ink-faint hover:text-ink hover:bg-paper-deep'
                }`}
              >
                <item.icon size={18} strokeWidth={1.5} />
                {/* 悬停提示 */}
                <div className="absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30 translate-x-1 group-hover:translate-x-0 duration-200">
                  <div className="bg-paper border border-line px-3 py-1 text-[10px] tracking-widest text-ink-soft rounded-ticket whitespace-nowrap">
                    {item.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 底部 Git */}
        <button
          onClick={onOpenGit}
          className="w-10 h-10 rounded-card border border-line flex items-center justify-center text-ink-faint hover:text-ink hover:border-gold/40 transition-all"
        >
          <GitBranch size={14} strokeWidth={1.5} />
        </button>
      </nav>

      {/* 移动端底部导航 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-paper border-t border-line z-50 flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-card transition-all ${
                isActive ? 'text-gold' : 'text-ink-faint'
              }`}
            >
              <item.icon size={18} strokeWidth={1.5} />
              <span className="text-[8px] mt-0.5 tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col relative overflow-hidden pb-16 md:pb-0">
        {/* 顶部栏 */}
        <header className="h-16 md:h-20 flex items-center justify-between px-5 md:px-10 border-b border-line bg-paper/80 backdrop-blur-sm z-20 shrink-0">
          <div className="flex items-center">
            <button onClick={onOpenGit} className="md:hidden mr-3 text-ink-faint">
              <GitBranch size={18} />
            </button>
            <h1 className="font-serif font-extralight text-lg md:text-2xl tracking-shoujin text-ink">
              {viewTitles[currentView]}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {/* 搜索 */}
            <button
              onClick={onOpenSearch}
              className="hidden sm:flex items-center w-40 md:w-56 h-9 bg-paper-input border border-line rounded-input px-3 text-xs text-ink-faint hover:border-gold/30 transition-colors"
            >
              <Search size={14} className="mr-2 text-ink-faint" />
              检索卷轴…
            </button>

            {/* 移动端搜索图标 */}
            <button onClick={onOpenSearch} className="sm:hidden text-ink-faint">
              <Search size={18} />
            </button>

            {/* 创建 */}
            <button
              onClick={toggleCreateModal}
              className="w-9 h-9 rounded-card bg-ink text-paper flex items-center justify-center hover:bg-ink-soft transition-colors"
            >
              <Plus size={16} strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* 内容视口 */}
        {isFullHeightView ? (
          <div className="flex-1 w-full h-full relative">{children}</div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};
