

import React, { useState } from 'react';
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
  const [view, setView] = useState<ViewMode>(ViewMode.GRAPH);
  const [viewDimension, setViewDimension] = useState<'2D' | '3D'>('3D');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGitOpen, setIsGitOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Navigation State (Neural Pathway)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  // Hook handles all data and business logic
  const { data, loading, actions } = useQASystem();

  const handleSediment = async (failureId: string) => {
    const success = await actions.sedimentFailure(failureId);
    if (success) {
      setView(ViewMode.QA_FIRST); // Navigate to QA view upon success
    }
  };
  
  const handleGraphAction = (id: string, type: 'QUESTION'|'OBJECTIVE', action: 'SELECT'|'DELETE') => {
    if (action === 'DELETE') {
      if (confirm('Are you sure you want to delete this node from the neural net?')) {
        actions.deleteNode(id, type);
      }
    } else {
      // NAVIGATION LOGIC
      console.log('Navigating to node:', id);
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
    if (loading) return <div className="text-white p-12">Initializing Neural Core...</div>;

    switch(view) {
      case ViewMode.DASHBOARD:
        return <DashboardView 
          questions={data.questions}
          objectives={data.objectives}
          failures={data.failures}
          onNavigateToView={(v) => {
            if (v === 'QA') setView(ViewMode.QA_FIRST);
            if (v === 'OKR') setView(ViewMode.OKR_FIRST);
            if (v === 'GRAPH') setView(ViewMode.GRAPH);
            if (v === 'FAILURE') setView(ViewMode.FAILURE_QUEUE);
          }}
        />;
      case ViewMode.QA_FIRST:
        return <QAView 
          questions={data.questions} 
          highlightedId={activeNodeId}
          onAddQuestion={actions.addQuestion}
          onNavigateToGraph={() => setView(ViewMode.GRAPH)}
        />;
      case ViewMode.OKR_FIRST:
        return <OKRView 
          objectives={data.objectives} 
          highlightedId={activeNodeId}
          onToggleKR={actions.toggleKRStatus}
        />;
      case ViewMode.GRAPH:
        return (
          <div className="w-full h-full relative">
            {/* View Mode Toggle */}
            <div className="absolute top-4 right-4 z-[60] flex bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-1 shadow-2xl">
              <button 
                onClick={() => setViewDimension('3D')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-all ${viewDimension === '3D' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                3D CORE
              </button>
              <button 
                onClick={() => setViewDimension('2D')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-all ${viewDimension === '2D' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                2D MAP
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
      onChangeView={(v) => { setView(v); setActiveNodeId(null); }}
      toggleCreateModal={() => setIsModalOpen(true)}
      onOpenGit={() => setIsGitOpen(true)}
      onOpenSearch={() => setIsSearchOpen(true)}
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