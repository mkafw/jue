import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { QAView } from './components/QAView';
import { OKRView } from './components/OKRView';
import { GraphView } from './components/GraphView';
import { ThreeGraphView } from './components/ThreeGraphView';
import { FailureQueue } from './components/FailureQueue';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { VersionControl } from './components/VersionControl';
import { CreationModal } from './components/CreationModal';
import { SearchModal } from './components/SearchModal';
import { ViewMode } from './types';
import { useQASystem } from './hooks/useQASystem';

export default function App() {
  const [view, setView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [viewDimension, setViewDimension] = useState<'2D' | '3D'>('3D');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGitOpen, setIsGitOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('qaos-theme') === 'dark';
    }
    return false;
  });

  // 同步暗色类到 <html> 并持久化
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('qaos-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('qaos-theme', 'light');
    }
  }, [isDark]);

  const { data, loading, actions } = useQASystem();

  const handleSediment = async (failureId: string) => {
    const success = await actions.sedimentFailure(failureId);
    if (success) {
      setView(ViewMode.QA_FIRST);
    }
  };

  const handleGraphAction = (id: string, type: 'QUESTION' | 'OBJECTIVE', action: 'SELECT' | 'DELETE') => {
    if (action === 'DELETE') {
      if (confirm('确认从知识网络中移除此节点？')) {
        actions.deleteNode(id, type);
      }
    } else {
      setActiveNodeId(id);
      if (type === 'QUESTION') {
        setView(ViewMode.QA_FIRST);
      } else {
        setView(ViewMode.OKR_FIRST);
      }
    }
  };

  const handleSearchSelect = (type: 'QUESTION' | 'OBJECTIVE' | 'FAILURE', id: string) => {
    setActiveNodeId(id);
    if (type === 'QUESTION') setView(ViewMode.QA_FIRST);
    else if (type === 'OBJECTIVE') setView(ViewMode.OKR_FIRST);
    else setView(ViewMode.FAILURE_QUEUE);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full text-ink-faint font-serif tracking-shoujin text-sm">
          正在展开知识卷轴…
        </div>
      );
    }

    switch (view) {
      case ViewMode.DASHBOARD:
        return (
          <DashboardView
            questions={data.questions}
            objectives={data.objectives}
            failures={data.failures}
            onNavigateToView={(v) => {
              if (v === 'QA') setView(ViewMode.QA_FIRST);
              if (v === 'OKR') setView(ViewMode.OKR_FIRST);
              if (v === 'GRAPH') setView(ViewMode.GRAPH);
              if (v === 'FAILURE') setView(ViewMode.FAILURE_QUEUE);
            }}
          />
        );
      case ViewMode.QA_FIRST:
        return (
          <QAView
            questions={data.questions}
            highlightedId={activeNodeId}
            onAddQuestion={actions.addQuestion}
            onNavigateToGraph={() => setView(ViewMode.GRAPH)}
          />
        );
      case ViewMode.OKR_FIRST:
        return (
          <OKRView
            objectives={data.objectives}
            highlightedId={activeNodeId}
            onToggleKR={actions.toggleKRStatus}
          />
        );
      case ViewMode.GRAPH:
        return (
          <div className="w-full h-full relative">
            <div className="absolute top-4 right-4 z-[60] flex bg-paper-card border border-line rounded-input p-0.5">
              <button
                onClick={() => setViewDimension('3D')}
                className={`px-4 py-1.5 rounded-ticket text-[10px] font-medium tracking-widest transition-all ${
                  viewDimension === '3D' ? 'bg-ink text-paper' : 'text-ink-faint hover:text-ink'
                }`}
              >
                三维
              </button>
              <button
                onClick={() => setViewDimension('2D')}
                className={`px-4 py-1.5 rounded-ticket text-[10px] font-medium tracking-widest transition-all ${
                  viewDimension === '2D' ? 'bg-ink text-paper' : 'text-ink-faint hover:text-ink'
                }`}
              >
                二维
              </button>
            </div>

            {viewDimension === '3D' ? (
              <ThreeGraphView
                questions={data.questions}
                objectives={data.objectives}
                onNodeAction={handleGraphAction}
              />
            ) : (
              <GraphView
                questions={data.questions}
                objectives={data.objectives}
                onNodeAction={handleGraphAction}
              />
            )}
          </div>
        );
      case ViewMode.FAILURE_QUEUE:
        return <FailureQueue failures={data.failures} onSediment={handleSediment} />;
      case ViewMode.SETTINGS:
        return <SettingsView onClose={() => setView(ViewMode.DASHBOARD)} />;
      default:
        return <QAView questions={data.questions} />;
    }
  };

  return (
    <Layout
      currentView={view}
      onChangeView={(v) => {
        setView(v);
        setActiveNodeId(null);
      }}
      toggleCreateModal={() => setIsModalOpen(true)}
      onOpenGit={() => setIsGitOpen(true)}
      onOpenSearch={() => setIsSearchOpen(true)}
      isDark={isDark}
      onToggleDark={() => setIsDark((v) => !v)}
    >
      {renderContent()}
      <VersionControl isOpen={isGitOpen} onClose={() => setIsGitOpen(false)} />
      <CreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateQuestion={actions.addQuestion}
        onCreateObjective={actions.addObjective}
        onCreateFailure={actions.addFailure}
      />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        questions={data.questions}
        objectives={data.objectives}
        failures={data.failures}
        onSelectResult={handleSearchSelect}
      />
    </Layout>
  );
}
