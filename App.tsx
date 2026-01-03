import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MousePointer2, ZoomIn, ZoomOut, Maximize, Bot, Sparkles, Layout } from 'lucide-react';
import type { AuthUser } from './services/authService';

// Import Types and Constants
import { NodeInstance, Viewport, Connection, LanguageCode, NodeType } from './types';
import { NODE_CATALOG, WORKFLOW_TEMPLATES, SAMPLE_TEMPLATES } from './constants';
import { CONTENT_TRANSLATIONS, LANGUAGES, UI_STRINGS } from './i18n';

// Import Services
import { workflowService } from './services/workflowService';
import { exportToN8n } from './utils/n8nExporter';
import { generateId } from './utils/helpers';
import { hydrateTemplate } from './utils/templateLoader';
import { createNode } from './utils/nodeFactory';

// Import Components
import { AuthModal } from './components/AuthModal';
import { ConnectivityGuide } from './components/ConnectivityGuide';
import { WizardOverlay } from './components/WizardOverlay';
import { Toast } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { GuideBot } from './components/GuideBot';
import { QuickAddMenu } from './components/QuickAddMenu';
import { NodeCanvasItem } from './components/NodeCanvasItem';
import { Header } from './components/Header';
import { SelectedNodePanel } from './components/SelectedNodePanel';
import { SmartConfigModal } from './components/SmartConfigModal';
import { TemplatesModal } from './components/TemplatesModal';
import { JsonViewModal } from './components/JsonViewModal';
import { HelpButton } from './components/HelpButton';
import { InteractiveTutorial } from './components/InteractiveTutorial';
import { TestModeModal } from './components/TestModeModal';
import { CanvasControls } from './components/Canvas/CanvasControls';
import { BoxSelection } from './components/Canvas/BoxSelection';
import { ConnectionLines } from './components/Canvas/ConnectionLines';
import { EmptyState } from './components/Canvas/EmptyState';
import { MultiSelectionBox } from './components/Canvas/MultiSelectionBox';
import { Dashboard } from './components/Dashboard';
import { ExecutionLogsModal } from './components/ExecutionLogsModal';
import { LandingPage } from './components/LandingPage';

// Import Custom Hooks
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useWorkflowPersistence } from './hooks/useWorkflowPersistence';
import { useToast } from './hooks/useToast';
import { useViewport } from './hooks/useViewport';
import { useCanvasInteractions } from './hooks/useCanvasInteractions';
import { useConnections } from './hooks/useConnections';
import { useSimulation } from './hooks/useSimulation';
import { useAIFeatures } from './hooks/useAIFeatures';

// --- MAIN APP COMPONENT ---
interface AppProps {
  user: AuthUser | null;
  onLogout: () => void;
}

function App({ user, onLogout }: AppProps) {
  // Navigation State - Start at Landing Page if not logged in
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'editor'>(user ? 'dashboard' : 'landing');


  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const quickSearchRef = useRef<HTMLInputElement>(null);

  // Language and Content
  const [lang, setLang] = useState<LanguageCode>('es');
  const content = useMemo(() => ({
    ...(CONTENT_TRANSLATIONS[lang] || CONTENT_TRANSLATIONS['en']),
    translations: UI_STRINGS[lang] || UI_STRINGS['en']
  }), [lang]);
  const t = useCallback((key: string) => content.translations[key] || key, [content]);

  // Toast System
  const { toasts, addToast } = useToast();

  // Viewport and Zoom
  const { viewport, setViewport, zoomIn, zoomOut, resetView } = useViewport(canvasRef);

  // Nodes State (keeping local state for now, will integrate with custom hook later)
  const [nodes, setNodes] = useState<NodeInstance[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [draggedNodeIds, setDraggedNodeIds] = useState<Set<string>>(new Set());

  // Connections Hook
  const connectionsHook = useConnections({ addToast });

  // Canvas Interactions
  const [quickAdd, setQuickAdd] = useState<{ visible: boolean; x: number; y: number; sourceNodeId?: string }>({ visible: false, x: 0, y: 0 });

  const canvasInteractions = useCanvasInteractions({
    viewport,
    setViewport,
    nodes,
    setSelectedNodeId,
    setSelectedNodeIds,
    setQuickAdd,
    connectingNodeId: connectionsHook.connectingNodeId,
    canvasRef
  });

  // Workflow Operations
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);

  // Simulation Hook
  const simulation = useSimulation({
    nodes,
    connections: connectionsHook.connections,
    currentWorkflowId,
    setCurrentWorkflowId,
    addToast
  });

  // AI Features Hook
  const aiFeatures = useAIFeatures({
    nodes,
    connections: connectionsHook.connections,
    lang,
    nodeNames: content.nodeNames,
    setNodes,
    setConnections: connectionsHook.setConnections,
    addToast,
    t
  });

  // UI State
  const [showTemplates, setShowTemplates] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showSmartConfig, setShowSmartConfig] = useState(false);
  const [showConnectivityGuide, setShowConnectivityGuide] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTestModeModal, setShowTestModeModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Derived State
  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  // --- EFFECTS ---

  // Update view when user logs in/out
  useEffect(() => {
    if (user && currentView === 'landing') {
      setCurrentView('dashboard');
    }
  }, [user]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    nodes,
    selectedNodeIds,
    setSelectedNodeIds,
    setSelectedNodeId,
    setNodes,
    setConnections: connectionsHook.setConnections,
    addToast
  });

  // Initialize tutorial on first visit
  useEffect(() => {
    const hasCompletedTutorial = localStorage.getItem('tutorial_completed');
    const hasSeenHelp = localStorage.getItem('help_button_seen');

    if (!hasCompletedTutorial && !hasSeenHelp && nodes.length === 0) {
      const timer = setTimeout(() => setTutorialActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [nodes.length]);

  // --- PERSISTENCE LOGIC ---
  useWorkflowPersistence({
    nodes,
    connections: connectionsHook.connections,
    setNodes,
    setConnections: connectionsHook.setConnections,
    addToast
  });

  // --- EVENT HANDLERS ---

  // Node Operations
  const addNode = useCallback((type: NodeType, position: { x: number, y: number }) => {
    const newNode = createNode(type, position, content.nodeNames);
    if (newNode) {
      setNodes(prev => [...prev, newNode]);
      addToast(`${newNode.name} added`, 'success');
    }
  }, [content.nodeNames, addToast]);

  const removeNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    connectionsHook.setConnections(prev => prev.filter(c => c.source !== id && c.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    addToast('Node removed', 'info');
  }, [selectedNodeId, connectionsHook, addToast]);

  // Node Mouse Handlers
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.button === 0) {
      if (e.ctrlKey) {
        setSelectedNodeIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
        setSelectedNodeId(id);
      } else if (selectedNodeIds.has(id)) {
        setDraggedNodeIds(new Set(selectedNodeIds));
        setSelectedNodeId(id);
      } else {
        setDraggedNodeId(id);
        setSelectedNodeId(id);
        setSelectedNodeIds(new Set([id]));
      }
    }
  }, [selectedNodeIds]);

  // Canvas Mouse Move (for node dragging)
  const handleCanvasMouseMoveWithDrag = useCallback((e: React.MouseEvent) => {
    canvasInteractions.handleCanvasMouseMove(e);

    // Update connection line position if connecting
    if (connectionsHook.connectingNodeId) {
      connectionsHook.updateConnectionMousePos(e.clientX, e.clientY);
    }

    // Group dragging
    if (draggedNodeIds.size > 0) {
      const dx = e.movementX / viewport.k;
      const dy = e.movementY / viewport.k;

      setNodes(prev => prev.map(n => {
        if (draggedNodeIds.has(n.id)) {
          return {
            ...n,
            position: {
              x: n.position.x + dx,
              y: n.position.y + dy
            }
          };
        }
        return n;
      }));
    }

    // Single node dragging
    if (draggedNodeId && draggedNodeIds.size === 0) {
      setNodes(prev => prev.map(n => {
        if (n.id === draggedNodeId) {
          return {
            ...n,
            position: {
              x: n.position.x + e.movementX / viewport.k,
              y: n.position.y + e.movementY / viewport.k
            }
          };
        }
        return n;
      }));
    }
  }, [canvasInteractions, draggedNodeIds, draggedNodeId, viewport.k, connectionsHook]);

  const handleCanvasMouseUpWithDrag = useCallback((e: React.MouseEvent) => {
    canvasInteractions.handleCanvasMouseUp(e);
    setDraggedNodeId(null);
    setDraggedNodeIds(new Set());
  }, [canvasInteractions]);

  // Stable handlers for node items to prevent re-renders
  const handleNodeDelete = useCallback((id: string) => {
    removeNode(id);
  }, [removeNode]);

  const handleSmartConfigClick = useCallback((node: NodeInstance) => {
    setSelectedNodeId(node.id);
    setShowSmartConfig(true);
  }, []);

  // Quick Add Handlers
  const handleQuickAddClick = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = (node.position.x + 260) * viewport.k + viewport.x + rect.left;
      const screenY = (node.position.y) * viewport.k + viewport.y + rect.top;

      setQuickAdd({
        visible: true,
        x: screenX,
        y: screenY,
        sourceNodeId: nodeId
      });
      setTimeout(() => quickSearchRef.current?.focus(), 50);
    }
  }, [nodes, viewport]);

  const handleQuickAddSelect = useCallback((type: NodeType) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    const x = (quickAdd.x - rect.left - viewport.x) / viewport.k;
    const y = (quickAdd.y - rect.top - viewport.y) / viewport.k;

    const newNode = createNode(type, { x, y }, content.nodeNames);

    if (newNode && quickAdd.sourceNodeId) {
      setNodes(prev => [...prev, newNode]);
      connectionsHook.addConnection(quickAdd.sourceNodeId!, newNode.id);
      addToast(`${newNode.name} added & connected`, 'success');
    } else if (newNode) {
      setNodes(prev => [...prev, newNode]);
      addToast(`${newNode.name} added`, 'success');
    }

    setQuickAdd({ ...quickAdd, visible: false });
  }, [quickAdd, viewport, content.nodeNames, connectionsHook, addToast]);

  // Template Loading
  const loadTemplate = useCallback((templateId: string) => {
    const result = hydrateTemplate(templateId, content.nodeNames);
    if (result) {
      setNodes(result.nodes);
      connectionsHook.setConnections(result.connections);
      setShowTemplates(false);
      const template = WORKFLOW_TEMPLATES.find(t => t.id === templateId) || SAMPLE_TEMPLATES.find(t => t.id === templateId);
      const templateName = (content.templates && content.templates[templateId]) || template?.name || 'Template';
      addToast(`${templateName} loaded`, 'success');
    }
  }, [content, connectionsHook, addToast]);

  // Workflow Save/Load
  const handleSaveWorkflow = useCallback(async () => {
    try {
      if (currentWorkflowId) {
        const { error } = await workflowService.updateWorkflow(currentWorkflowId, {
          nodes,
          connections: connectionsHook.connections
        });
        if (error) {
          addToast(`Save failed: ${error}`, "error");
        } else {
          addToast("Workflow saved", "success");
        }
      } else {
        const { workflow, error } = await workflowService.createWorkflow(
          `Workflow ${new Date().toLocaleString()}`,
          nodes,
          connectionsHook.connections
        );
        if (error || !workflow) {
          addToast(`Save failed: ${error}`, "error");
        } else {
          setCurrentWorkflowId(workflow.id);
          addToast("Workflow saved", "success");
        }
      }
    } catch (err) {
      addToast("Save error", "error");
    }
  }, [currentWorkflowId, nodes, connectionsHook.connections, addToast]);

  const handleLoadWorkflow = useCallback(async (id: string, silent = false) => {
    try {
      const { workflow, error } = await workflowService.getWorkflow(id);
      if (error || !workflow) {
        if (!silent) addToast(`Load failed: ${error}`, "error");
        return;
      }
      setNodes(workflow.nodes as NodeInstance[]);
      connectionsHook.setConnections(workflow.connections as Connection[]);
      setCurrentWorkflowId(workflow.id);
      if (!silent) addToast("Workflow loaded", "success");
    } catch (err) {
      if (!silent) addToast("Load error", "error");
    }
  }, [connectionsHook, addToast]);

  // URL Persistence Effect
  const hasCheckedUrl = useRef(false);
  useEffect(() => {
    if (!user || hasCheckedUrl.current) return;

    const params = new URLSearchParams(window.location.search);
    const workflowId = params.get('workflowId');

    if (workflowId) {
      handleLoadWorkflow(workflowId, true); // Silent load on init
      setCurrentView('editor');
    }
    hasCheckedUrl.current = true;
  }, [user, handleLoadWorkflow]);

  // Dashboard Navigation Handlers
  const handleOpenWorkflow = useCallback(async (id: string | null) => {
    if (id) {
      // Update URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('workflowId', id);
      window.history.pushState({}, '', newUrl);
      await handleLoadWorkflow(id);
    } else {
      // Create new workflow
      setNodes([]);
      connectionsHook.setConnections([]);
      setCurrentWorkflowId(null);

      // Clear URL for new project until saved
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('workflowId');
      window.history.pushState({}, '', newUrl);
    }
    setCurrentView('editor');
  }, [connectionsHook, handleLoadWorkflow, setCurrentWorkflowId, setNodes, setViewport, addToast]);

  const handleBackToDashboard = useCallback(() => {
    // Clear URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('workflowId');
    window.history.pushState({}, '', newUrl);

    setCurrentView('dashboard');
    setCurrentWorkflowId(null); // Optional: clear selected workflow
  }, [setCurrentView, setCurrentWorkflowId]);

  // Sidebar Add Node Handler
  const handleAddNodeFromSidebar = useCallback((type: NodeType) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (rect.width / 2 - viewport.x) / viewport.k;
      const y = (rect.height / 2 - viewport.y) / viewport.k;
      addNode(type, { x, y });
    } else {
      addNode(type, { x: 100, y: 100 });
    }
  }, [viewport, addNode]);

  // --- RENDER ---

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onGetStarted={() => setCurrentView('dashboard')}
          onLogin={() => setShowAuthModal(true)}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          canClose={true} // Allow closing on landing page too
        />
        <div className="fixed top-4 right-4 z-[100] space-y-2">
          {toasts.map(toast => <Toast key={toast.id} message={toast.message} type={toast.type} />)}
        </div>
      </>
    );
  }

  if (currentView === 'dashboard') {
    return (
      <>
        <Dashboard
          onOpenWorkflow={handleOpenWorkflow}
          user={user}
          onLogout={onLogout}
          onShowAuth={() => setShowAuthModal(true)}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          canClose={true}
        />
        <div className="fixed top-4 right-4 z-[100] space-y-2">
          {toasts.map(toast => <Toast key={toast.id} message={toast.message} type={toast.type} />)}
        </div>
      </>
    );
  }

  return (
    <div className="w-full h-screen bg-[#0B0E14] text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden">

      <Header
        onBack={handleBackToDashboard}
        t={t}
        lang={lang}
        setLang={setLang}
        showTemplates={showTemplates}
        setShowTemplates={setShowTemplates}
        isGuidedMode={isGuidedMode}
        setIsGuidedMode={setIsGuidedMode}
        nodesCount={nodes.length}
        setShowJson={setShowJson}
        isSimulating={simulation.isSimulating}
        onSimulate={simulation.handleSimulate}
        user={user}
        onShowAuth={() => setShowAuthModal(true)}
        onLogout={() => { }}
        onRestartTutorial={() => {
          setTutorialStep(0);
          setTutorialActive(true);
        }}
        showLanguageModal={showLanguageModal}
        setShowLanguageModal={setShowLanguageModal}
        isActive={simulation.isActive}
        onToggleActivation={simulation.handleToggleActivation}
        onTestMode={() => setShowTestModeModal(true)}
        hasActiveWorkflow={nodes.length > 0}
        onShowHistory={() => setShowHistory(true)}
      />

      <main className="flex-1 flex overflow-hidden relative">
        <Sidebar
          t={t}
          lang={lang}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          mainPrompt={aiFeatures.mainPrompt}
          setMainPrompt={aiFeatures.setMainPrompt}
          handleGenWorkflow={aiFeatures.handleGenWorkflow}
          isProcessing={aiFeatures.isProcessing}
          searchQuery={sidebarSearchQuery}
          setSearchQuery={setSidebarSearchQuery}
          addNode={handleAddNodeFromSidebar}
        />

        <div
          ref={canvasRef}
          className={`flex-1 relative overflow-hidden bg-[#0B0E14] ${canvasInteractions.isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
          onMouseDown={canvasInteractions.handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMoveWithDrag}
          onMouseUp={handleCanvasMouseUpWithDrag}
          onMouseLeave={handleCanvasMouseUpWithDrag}
          onContextMenu={canvasInteractions.handleCanvasContextMenu}
        >
          {/* Background Grid */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: `${20 * viewport.k}px ${20 * viewport.k}px`, backgroundPosition: `${viewport.x}px ${viewport.y}px` }}></div>

          {/* Box Selection Rectangle */}
          <BoxSelection
            isActive={canvasInteractions.isBoxSelecting}
            start={canvasInteractions.boxSelectStart}
            end={canvasInteractions.boxSelectEnd}
            viewport={viewport}
          />

          {/* Multi-Selection Bounding Box */}
          <MultiSelectionBox
            selectedNodeIds={selectedNodeIds}
            nodes={nodes}
            viewport={viewport}
          />

          {/* Connection Lines */}
          <ConnectionLines
            connections={connectionsHook.connections}
            nodes={nodes}
            viewport={viewport}
            connectingFrom={
              connectionsHook.connectingNodeId && connectionsHook.connectionMousePos
                ? {
                  nodeId: connectionsHook.connectingNodeId,
                  handleId: connectionsHook.connectingHandleId || 'main',
                  mouseX: connectionsHook.connectionMousePos.x,
                  mouseY: connectionsHook.connectionMousePos.y
                }
                : null
            }
          />

          {/* Canvas Content */}
          <div className="absolute origin-top-left will-change-transform" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.k})` }}>
            {nodes.length > 0 && (
              <>
                {nodes.map((node) => (
                  <NodeCanvasItem
                    key={node.id}
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    onSelect={(e) => { e.stopPropagation(); setSelectedNodeId(node.id); }}
                    onDelete={() => handleNodeDelete(node.id)}
                    onMouseDown={handleNodeMouseDown}
                    onConnectStart={connectionsHook.handleConnectStart}
                    onConnectEnd={connectionsHook.handleConnectEnd}
                    onQuickAdd={handleQuickAddClick}
                    onSmartConfig={handleSmartConfigClick}
                    isGuidedMode={isGuidedMode}
                    isDimmed={isGuidedMode && selectedNodeId !== null && selectedNodeId !== node.id}
                    description={content.tips[node.type]?.desc || ""}
                    displayName={content.nodeNames[node.type] || node.name}
                    simulationStatus={
                      simulation.isSimulating
                        ? (simulation.activeSimulationNode === node.id ? 'running' : (simulation.simulationLogs.some(l => l.details?.nodeId === node.id && l.type === 'success') ? 'success' : 'idle'))
                        : 'idle'
                    }
                  />
                ))}
              </>
            )}
          </div>

          {/* Zoom Controls */}
          {nodes.length > 0 && (
            <CanvasControls
              viewport={viewport}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onResetView={resetView}
            />
          )}

          {/* Global Guide Bot */}
          {isGuidedMode && !selectedNodeId && <GuideBot t={t} lang={lang} variant="global" focusedField={null} />}

          {/* Empty State */}
          {nodes.length === 0 && (
            <EmptyState
              t={t}
              onShowTemplates={() => setShowTemplates(true)}
              onFocusPrompt={() => document.querySelector('textarea')?.focus()}
              onShowWizard={() => setShowWizard(true)}
            />
          )}

          {/* Wizard Overlay */}
          {showWizard && (
            <WizardOverlay
              t={t}
              onClose={() => setShowWizard(false)}
              onComplete={(selections) => {
                let lastNodeId = '';
                const newNodes: NodeInstance[] = [];
                const newConnections: Connection[] = [];
                let xOffset = 100;

                selections.forEach((sel, idx) => {
                  if (sel.type === 'none' as any) return;

                  const newNode = createNode(sel.type, { x: xOffset, y: 300 }, content.nodeNames);
                  if (newNode) {
                    newNode.name = sel.label;
                    newNodes.push(newNode);

                    if (lastNodeId) {
                      newConnections.push({
                        id: generateId(),
                        source: lastNodeId,
                        target: newNode.id,
                        sourceHandle: 'main',
                        targetHandle: 'input'
                      });
                    }
                    lastNodeId = newNode.id;
                    xOffset += 300;
                  }
                });

                setNodes(newNodes);
                connectionsHook.setConnections(newConnections);
                setShowWizard(false);
                addToast('Wizard flow created!', 'success');
              }}
            />
          )}

          {/* Analysis Result */}
          {aiFeatures.analysis && (
            <div className="absolute bottom-20 left-4 right-4 md:right-auto md:w-96 bg-[#11141a]/95 backdrop-blur border border-emerald-500/20 rounded-xl overflow-hidden shadow-2xl z-30 animate-[slideUp_0.3s]">
              <div className="bg-emerald-950/30 p-3 border-b border-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2"><Bot size={16} className="text-emerald-400" /><span className="text-xs font-bold text-emerald-100">{t('workflowAuditor')}</span></div>
                <button onClick={() => aiFeatures.setAnalysis('')} className="text-emerald-500 hover:text-white"><Layout size={14} /></button>
              </div>
              <div className="p-4 text-xs text-slate-300 leading-relaxed font-light max-h-60 overflow-y-auto custom-scrollbar" dangerouslySetInnerHTML={{ __html: aiFeatures.analysis }}></div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Help Button */}
      <HelpButton t={t} />

      {/* Quick Add Menu */}
      {quickAdd.visible && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setQuickAdd({ ...quickAdd, visible: false })}
          />
          <QuickAddMenu
            position={{ x: quickAdd.x, y: quickAdd.y }}
            onClose={() => setQuickAdd({ ...quickAdd, visible: false })}
            onSelect={handleQuickAddSelect}
            searchRef={quickSearchRef}
            nodeNames={content.nodeNames}
          />
        </>
      )}

      {/* MODALS & OVERLAYS */}
      <TemplatesModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        t={t}
        content={content}
        onLoadTemplate={loadTemplate}
      />

      <SelectedNodePanel
        selectedNode={selectedNode}
        setSelectedNodeId={setSelectedNodeId}
        isGuidedMode={isGuidedMode}
        focusedField={focusedField}
        setFocusedField={setFocusedField}
        t={t}
        lang={lang}
        content={content}
        configPrompt={aiFeatures.configPrompt}
        setConfigPrompt={aiFeatures.setConfigPrompt}
        handleSmartConfig={aiFeatures.handleSmartConfig}
        isConfiguring={aiFeatures.isConfiguring}
        setNodes={setNodes}
        nodes={nodes}
        connections={connectionsHook.connections}
        simulationLogs={simulation.simulationLogs}
      />

      <SmartConfigModal
        isOpen={showSmartConfig}
        onClose={() => setShowSmartConfig(false)}
        selectedNode={selectedNode}
        t={t}
        configPrompt={aiFeatures.configPrompt}
        setConfigPrompt={aiFeatures.setConfigPrompt}
        isConfiguring={aiFeatures.isConfiguring}
        onSmartConfig={aiFeatures.handleSmartConfig}
        addToast={addToast}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        canClose={true}
      />

      <JsonViewModal
        isOpen={showJson}
        onClose={() => setShowJson(false)}
        t={t}
        lang={lang}
        onShowGuide={() => setShowConnectivityGuide(true)}
        exportData={exportToN8n(nodes, connectionsHook.connections)}
        addToast={addToast}
      />

      <ConnectivityGuide
        isOpen={showConnectivityGuide}
        onClose={() => setShowConnectivityGuide(false)}
        lang={lang}
      />

      {/* Interactive Tutorial */}
      {tutorialActive && (
        <InteractiveTutorial
          currentStep={tutorialStep}
          onStepComplete={() => setTutorialStep(prev => prev + 1)}
          onSkip={() => {
            setTutorialActive(false);
            localStorage.setItem('tutorial_completed', 'true');
            addToast('Tutorial omitido', 'info');
          }}
          onComplete={() => {
            setTutorialActive(false);
            localStorage.setItem('tutorial_completed', 'true');
            addToast('¡Tutorial completado! 🎉', 'success');
          }}
          nodes={nodes}
          selectedNodeIds={selectedNodeIds}
          isBoxSelecting={canvasInteractions.isBoxSelecting}
        />
      )}

      {/* Execution Logs Modal */}
      <ExecutionLogsModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        workflowId="demo-flow-1"
      />

      {/* Test Mode Modal */}
      <TestModeModal
        isOpen={showTestModeModal}
        onClose={() => setShowTestModeModal(false)}
        onStart={simulation.handleStartTestMode}
        workflowName={currentWorkflowId ? `Workflow ${currentWorkflowId.slice(0, 8)}` : 'Current Workflow'}
      />

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map(toast => <Toast key={toast.id} message={toast.message} type={toast.type} />)}
      </div>
    </div >
  );
}

export default App;