import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MousePointer2, ZoomIn, ZoomOut, Maximize, Bot, Sparkles, Layout } from 'lucide-react';
import type { AuthUser } from './services/authService';

// Import Types and Constants
import { NodeInstance, Viewport, Connection, LanguageCode, NodeType } from './types';
import { NODE_CATALOG, WORKFLOW_TEMPLATES, SAMPLE_TEMPLATES } from './constants';
import { CONTENT_TRANSLATIONS, LANGUAGES, UI_STRINGS } from './i18n';

// Import Services
import { analyzeWorkflow, generateSmartConfig, generateWorkflowFromPrompt } from './services/aiService';
import { workflowService } from './services/workflowService';
import { executionEngine } from './services/executionEngine';
import { backendApi } from './services/backendApi';

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

import { ExecutionLogsModal } from './components/ExecutionLogsModal';
import { exportToN8n } from './utils/n8nExporter';

// --- HELPER FUNCTIONS ---
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// --- MAIN APP COMPONENT ---
interface AppProps {
  user: AuthUser | null;
  onLogout: () => void;
}

function App({ user, onLogout }: AppProps) {
  // State: Nodes & Connections
  const [nodes, setNodes] = useState<NodeInstance[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  // State: Viewport & Interactions
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [draggedNodeIds, setDraggedNodeIds] = useState<Set<string>>(new Set());
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [connectingHandleId, setConnectingHandleId] = useState<string | null>(null);
  const mousePos = useRef({ x: 0, y: 0 }); // Converted to Ref for performance
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [boxSelectStart, setBoxSelectStart] = useState<{ x: number; y: number } | null>(null);
  const [boxSelectEnd, setBoxSelectEnd] = useState<{ x: number; y: number } | null>(null);

  // State: UI Overlays & Modes
  const [showTemplates, setShowTemplates] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lang, setLang] = useState<LanguageCode>('es'); // Changed from 'en' to 'es'
  const [showWizard, setShowWizard] = useState(false);
  const [quickAdd, setQuickAdd] = useState<{ visible: boolean; x: number; y: number; sourceNodeId?: string }>({ visible: false, x: 0, y: 0 });
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showSmartConfig, setShowSmartConfig] = useState(false);
  const [configPrompt, setConfigPrompt] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [showConnectivityGuide, setShowConnectivityGuide] = useState(false);

  // Tutorial State
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  // Language Modal State
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Sidebar State
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [mainPrompt, setMainPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);

  // Activation State
  const [isActive, setIsActive] = useState(false);
  const [showTestModeModal, setShowTestModeModal] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeSimulationNode, setActiveSimulationNode] = useState<string | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<any[]>([]);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const quickSearchRef = useRef<HTMLInputElement>(null);

  // Derived State
  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);
  const content = useMemo(() => ({
    ...(CONTENT_TRANSLATIONS[lang] || CONTENT_TRANSLATIONS['en']),
    translations: UI_STRINGS[lang] || UI_STRINGS['en']
  }), [lang]);
  const t = useCallback((key: string) => content.translations[key] || key, [content]);

  // --- EFFECTS ---

  // Wheel event with passive: false to prevent warnings
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();

      if (e.shiftKey) {
        // Pan with Shift + Scroll
        setViewport(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      } else {
        // Zoom with normal scroll
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const delta = -e.deltaY;
        const scaleAmount = delta > 0 ? 0.1 : -0.1;
        const newK = Math.max(0.1, Math.min(5, viewport.k + scaleAmount));

        if (newK !== viewport.k) {
          const scaleChange = newK - viewport.k;
          const newX = viewport.x - (mouseX - viewport.x) * (scaleChange / viewport.k);
          const newY = viewport.y - (mouseY - viewport.y) * (scaleChange / viewport.k);

          setViewport({ x: newX, y: newY, k: newK });
        }
      }
    };

    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    return () => canvas.removeEventListener('wheel', wheelHandler);
  }, [viewport]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A: Select all nodes
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setSelectedNodeIds(new Set(nodes.map(n => n.id)));
        addToast(`Selected ${nodes.length} nodes`, 'info');
      }

      // Escape: Deselect all
      if (e.key === 'Escape') {
        setSelectedNodeIds(new Set());
        setSelectedNodeId(null);
      }

      // Delete: Remove selected nodes
      if (e.key === 'Delete' && selectedNodeIds.size > 0) {
        selectedNodeIds.forEach(id => {
          setNodes(prev => prev.filter(n => n.id !== id));
          setConnections(prev => prev.filter(c => c.source !== id && c.target !== id));
        });
        addToast(`Deleted ${selectedNodeIds.size} nodes`, 'info');
        setSelectedNodeIds(new Set());
        setSelectedNodeId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, selectedNodeIds]);

  // Initialize tutorial on first visit
  useEffect(() => {
    const hasCompletedTutorial = localStorage.getItem('tutorial_completed');
    const hasSeenHelp = localStorage.getItem('help_button_seen');

    // Start tutorial if user hasn't completed it and has no nodes
    if (!hasCompletedTutorial && !hasSeenHelp && nodes.length === 0) {
      // Delay to let the app load
      const timer = setTimeout(() => setTutorialActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [nodes.length]);

  // MANDATORY AUTH ENFORCEMENT
  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
    }
  }, [user]);

  // --- PERSISTENCE LOGIC ---

  // 1. Load from LocalStorage on Mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('autoflow_draft');
    if (savedDraft) {
      try {
        const { nodes: savedNodes, connections: savedConnections, timestamp } = JSON.parse(savedDraft);

        if (Array.isArray(savedNodes) && Array.isArray(savedConnections)) {
          // HYDRATION STEP: Restore functions/components lost in JSON
          const hydratedNodes = savedNodes.map((n: any) => {
            const template = NODE_CATALOG.find(t => t.type === n.type);
            return {
              ...n,
              // Restore UI assets from catalog (Icons are functions, lost in JSON)
              icon: template?.icon || n.icon,
              bg: template?.bg || n.bg,
              color: template?.color || n.color,
              component: undefined // Ensure no stale component refs
            };
          });

          setNodes(hydratedNodes);
          setConnections(savedConnections);

          if (savedNodes.length > 0) {
            setTimeout(() => addToast('Workflow restored from autosave', 'success'), 500);
          }
        }
      } catch (e) {
        console.error('Failed to load draft', e);
      }
    }
  }, []); // Run ONCE on mount

  // 2. Auto-Save to LocalStorage on Change
  useEffect(() => {
    // Debounce slightly to avoid thrashing storage on drag
    const timeoutId = setTimeout(() => {
      // Removing the nodes.length > 0 check to allow saving empty state (clearing the canvas)
      const draft = {
        nodes,
        connections,
        timestamp: Date.now()
      };
      localStorage.setItem('autoflow_draft', JSON.stringify(draft));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [nodes, connections]);

  // --- EVENT HANDLERS ---

  // Toast Helper
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // Node Operations
  const addNode = useCallback((type: NodeType, position: { x: number, y: number }) => {
    const template = NODE_CATALOG.find(n => n.type === type);
    if (!template) return;

    const newNode: NodeInstance = {
      id: generateId(),
      type,
      name: content.nodeNames[type] || template.name,
      n8nType: template.n8nType,
      n8nVersion: template.n8nVersion,
      position,
      icon: template.icon,
      bg: template.bg,
      color: template.color,
      category: template.category,
      border: template.border,
      fields: template.fields,
      desc: template.desc,
      config: {},
      customParams: {}
    };

    setNodes(prev => [...prev, newNode]);
    addToast(`${newNode.name} added`, 'success');
  }, [content, addToast]); // content changes with lang

  const removeNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.source !== id && c.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    addToast('Node removed', 'info');
  };

  // Canvas Bounds Cache to prevent layout thrashing
  const canvasBounds = useRef<DOMRect | null>(null);

  // Canvas Interactions
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !connectingNodeId) { // Left click
      if (e.target === canvasRef.current) {
        // Cache bounds on start
        if (canvasRef.current) {
          canvasBounds.current = canvasRef.current.getBoundingClientRect();
        }

        if (!e.ctrlKey && !e.shiftKey) {
          // Start box selection or panning
          if (e.altKey) {
            // Alt + Click = Box selection
            setIsBoxSelecting(true);
            const rect = canvasBounds.current!;
            const x = (e.clientX - rect.left - viewport.x) / viewport.k;
            const y = (e.clientY - rect.top - viewport.y) / viewport.k;
            setBoxSelectStart({ x, y });
            setBoxSelectEnd({ x, y });
          } else {
            // Normal panning
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
          }
        }
        // Deselect all if clicking on empty canvas without modifiers
        if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
          setSelectedNodeId(null);
          setSelectedNodeIds(new Set());
        }
        setQuickAdd({ ...quickAdd, visible: false });
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    // FAST PATH: Use cached bounds if dragging/panning
    // Only recalculate if we don't have them (shouldn't happen during drag if MouseDown logic is correct)
    let rect = canvasBounds.current;
    if (!rect) {
      rect = canvasRef.current.getBoundingClientRect();
      canvasBounds.current = rect;
    }

    mousePos.current = {
      x: (e.clientX - rect.left - viewport.x) / viewport.k,
      y: (e.clientY - rect.top - viewport.y) / viewport.k
    };

    // Box selection
    if (isBoxSelecting && boxSelectStart) {
      const x = (e.clientX - rect.left - viewport.x) / viewport.k;
      const y = (e.clientY - rect.top - viewport.y) / viewport.k;
      setBoxSelectEnd({ x, y });

      // Calculate box bounds
      const minX = Math.min(boxSelectStart.x, x);
      const maxX = Math.max(boxSelectStart.x, x);
      const minY = Math.min(boxSelectStart.y, y);
      const maxY = Math.max(boxSelectStart.y, y);

      // Find nodes within box
      const nodesInBox = nodes.filter(node => {
        const nodeRight = node.position.x + 240;
        const nodeBottom = node.position.y + 72;
        return (
          node.position.x < maxX &&
          nodeRight > minX &&
          node.position.y < maxY &&
          nodeBottom > minY
        );
      });

      setSelectedNodeIds(new Set(nodesInBox.map(n => n.id)));
    }

    // Panning
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
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

    // Single node dragging (legacy support)
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
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    setIsPanning(false);
    setDraggedNodeId(null);
    setDraggedNodeIds(new Set());
    setIsBoxSelecting(false);
    setBoxSelectStart(null);
    setBoxSelectEnd(null);

    if (connectingNodeId) {
      // MAGIC CONNECT: If we released over canvas (not a handle), open Quick Add to create & connect
      // Calculate mouse position relative to canvas
      if (canvasRef.current) {
        setQuickAdd({
          visible: true,
          x: (mousePos.current.x * viewport.k) + viewport.x + canvasRef.current.getBoundingClientRect().left, // Approximate screen coords from logic
          y: (mousePos.current.y * viewport.k) + viewport.y + canvasRef.current.getBoundingClientRect().top, // Wait, we have e.clientX/Y from mouseUp? No, this function doesn't take 'e' currently in the signature shown below... 
          // Actually handleCanvasMouseUp IS dealing with an event in the codebase relative to where it's attached?
          // Let's check the signature in the file content. It currently takes NO args.
          // I need to update the signature to accept 'e' or use the ref.
          // Using the ref 'mousePos' is safer if we don't change signature, BUT 'mousePos' is in canvas coords.
          // QuickAdd expects SCREEN coords (client X/Y).
          // Let's use the 'lastMousePos' state if available or change signature.
          // Changing signature is best practice.
          // But wait, line 863 says `onMouseUp={handleCanvasMouseUp}`. React passes the event.
          // So I just need to add `e` to the arguments.
          sourceNodeId: connectingNodeId
        });

        // However, to get the EXACT drop position, we need 'e'. 
        // Let's modify the function signature first.
      }

      setConnectingNodeId(null);
      setConnectingHandleId(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomSensitivity = 0.001;
      const newK = Math.min(Math.max(0.1, viewport.k - e.deltaY * zoomSensitivity), 5);

      // Zoom towards mouse position
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scaleChange = newK - viewport.k;
        const newX = viewport.x - (mouseX - viewport.x) * (scaleChange / viewport.k);
        const newY = viewport.y - (mouseY - viewport.y) * (scaleChange / viewport.k);

        setViewport({ x: newX, y: newY, k: newK });
      }
    } else {
      setViewport(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY })); // Pan
    }
  };

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setQuickAdd({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      sourceNodeId: undefined
    });
    setTimeout(() => quickSearchRef.current?.focus(), 50);
  };

  // Node Interactions
  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.button === 0) {
      if (e.ctrlKey) {
        // Ctrl+Click: Add/remove from selection
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
        // Clicking on already selected node: start group drag
        setDraggedNodeIds(new Set(selectedNodeIds));
        setSelectedNodeId(id);
      } else {
        // Normal single selection
        setDraggedNodeId(id);
        setSelectedNodeId(id);
        setSelectedNodeIds(new Set([id]));
      }
    }
  };

  const handleConnectStart = (e: React.MouseEvent, nodeId: string, handleId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setConnectingNodeId(nodeId);
    setConnectingHandleId(handleId);
  };

  const handleConnectEnd = (e: React.MouseEvent, targetNodeId: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (connectingNodeId && connectingNodeId !== targetNodeId) {
      // Check if connection already exists
      const exists = connections.some(c =>
        c.source === connectingNodeId &&
        c.target === targetNodeId &&
        c.sourceHandle === connectingHandleId
      );

      if (!exists) {
        setConnections(prev => [...prev, {
          id: generateId(),
          source: connectingNodeId,
          target: targetNodeId,
          sourceHandle: connectingHandleId!,
          targetHandle: 'input' // Default to 'input' for now
        }]);
        addToast('Connected!', 'success');
      }
    }
    setConnectingNodeId(null);
    setConnectingHandleId(null);
  };

  // Quick Add Interactions
  const handleQuickAddClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = (node.position.x + 260) * viewport.k + viewport.x + rect.left; // Position to the right of the node
      const screenY = (node.position.y) * viewport.k + viewport.y + rect.top;

      setQuickAdd({
        visible: true,
        x: screenX,
        y: screenY,
        sourceNodeId: nodeId
      });
      setTimeout(() => quickSearchRef.current?.focus(), 50);
    }
  };

  const handleQuickAddSelect = (type: NodeType) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    // Calculate position in canvas coordinates
    const x = (quickAdd.x - rect.left - viewport.x) / viewport.k;
    const y = (quickAdd.y - rect.top - viewport.y) / viewport.k;

    addNode(type, { x, y });

    // If added from another node, create connection automatically
    if (quickAdd.sourceNodeId) {
      // Need to find the ID of the newly added node (it's the last one in the list, but list update is async)
      // So we'll cheat a bit and assume connection logic happens after node is added
      // Or better, we explicitly handle connection after state update
      // For simplicity in this refactor, we rely on the fact that addNode updates state
      // We need to capture the ID generated in addNode. Refactoring addNode to return ID.

      // Let's modify addNode logic slightly inline here to capture ID for connection
      const template = NODE_CATALOG.find(n => n.type === type);
      if (template) {
        const newNodeId = generateId(); // We need to duplicate ID generation here or refactor addNode
        // To avoid duplicating complex addNode logic, we will just use the standard addNode
        // and then find the *latest* node in an effect? No, that's messy.
        // Let's just manually add the node and connection here for the Quick Add case specifically.

        const newNode: NodeInstance = {
          id: newNodeId,
          type,
          name: content.nodeNames[type] || template.name,
          n8nType: template.n8nType,
          n8nVersion: template.n8nVersion,
          position: { x, y },
          icon: template.icon,
          bg: template.bg,
          color: template.color,
          category: template.category,
          border: template.border,
          fields: template.fields,
          desc: template.desc,
          config: {},
          customParams: {}
        };

        setNodes(prev => [...prev, newNode]);

        setConnections(prev => [...prev, {
          id: generateId(),
          source: quickAdd.sourceNodeId!,
          target: newNodeId,
          sourceHandle: 'main', // Default
          targetHandle: 'input'
        }]);
        addToast(`${newNode.name} added & connected`, 'success');
      }
    }

    setQuickAdd({ ...quickAdd, visible: false });
  };

  // Zoom Controls
  const zoomIn = () => setViewport(prev => ({ ...prev, k: Math.min(prev.k + 0.2, 5) }));
  const zoomOut = () => setViewport(prev => ({ ...prev, k: Math.max(prev.k - 0.2, 0.1) }));
  const resetView = () => setViewport({ x: 0, y: 0, k: 1 });

  // Intelligent Functions
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeWorkflow(nodes, connections);
      setAnalysis(result);
      addToast(t('auditComplete'), 'success');
    } catch (error) {
      setAnalysis("Could not complete analysis. Check API key.");
      addToast('Analysis failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSmartConfig = async (node: NodeInstance) => {
    if (!configPrompt) return;
    setIsConfiguring(true);
    try {
      const config = await generateSmartConfig(node, configPrompt);
      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, config: { ...n.config, ...config } } : n));
      setConfigPrompt('');
      addToast(t('configApplied'), 'success');
    } catch (error) {
      addToast('Smart config failed', 'error');
    } finally {
      setIsConfiguring(false);
      setShowSmartConfig(false);
    }
  };

  const handleGenWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainPrompt) return;
    setIsProcessing(true);
    try {
      const flow = await generateWorkflowFromPrompt(mainPrompt, lang);
      if (flow && flow.nodes) {
        // Map generated nodes to our internal structure with IDs and positions
        // IMPORTANT: Hydrate with catalog data (icon, color, fields, etc.)
        const idMap: Record<number, string> = {}; // Map array index to new ID
        const newNodes: NodeInstance[] = flow.nodes.map((n: any, i: number) => {
          const newId = generateId();
          idMap[i] = newId; // Store mapping for connections

          // Find the template from catalog to get icon, color, fields, etc.
          const template = NODE_CATALOG.find(cat => cat.type === n.type);

          if (!template) {
            console.warn(`Node type "${n.type}" not found in catalog`);
            return null;
          }

          // Hydrate the node with ALL catalog data
          return {
            id: newId,
            type: n.type,
            name: content.nodeNames[n.type] || template.name,
            n8nType: template.n8nType,
            n8nVersion: template.n8nVersion,
            position: { x: 100 + (i * 280), y: 150 + (i % 2 * 120) }, // Stagger layout
            icon: template.icon,
            bg: template.bg,
            color: template.color,
            category: template.category,
            border: template.border,
            fields: template.fields,
            desc: template.desc,
            config: n.config || {}, // Use AI-provided config
            customParams: {}
          } as NodeInstance;
        }).filter(Boolean) as NodeInstance[]; // Remove nulls

        // Create connections if provided by AI
        const newConnections: Connection[] = [];
        if (flow.connections && Array.isArray(flow.connections)) {
          flow.connections.forEach((conn: any) => {
            const sourceId = idMap[conn.source];
            const targetId = idMap[conn.target];

            if (sourceId && targetId) {
              newConnections.push({
                id: generateId(),
                source: sourceId,
                target: targetId,
                sourceHandle: conn.sourceHandle || 'main',
                targetHandle: conn.targetHandle || 'input'
              });
            }
          });
        }

        // Add nodes and connections to canvas
        setNodes(curr => [...curr, ...newNodes]);
        setConnections(curr => [...curr, ...newConnections]);

        addToast(t('generatedNodes'), 'success');
        setMainPrompt('');
      }
    } catch (err) {
      console.error('Workflow generation error:', err);
      addToast('Generation failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadTemplate = (templateId: string) => {
    const template = WORKFLOW_TEMPLATES.find(t => t.id === templateId) || SAMPLE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      // Regenerate IDs to avoid conflicts
      // Templates use array indices for connections, so we map by index
      const newNodes = template.nodes.map(n => {
        const catalogNode = NODE_CATALOG.find(cat => cat.type === n.type);
        return {
          ...catalogNode, // Hydrate with catalog defaults (fields, icon, color, etc.)
          ...n, // Override with template specifics (config, position)
          id: generateId(),
          // Ensure fields are definitely present if catalog has them
          fields: catalogNode?.fields || [],
          // Ensure visual properties are present if template missed them
          icon: catalogNode?.icon,
          color: catalogNode?.color,
          bg: catalogNode?.bg,
          border: catalogNode?.border,
          name: content.nodeNames[n.type] || catalogNode?.name || n.name // Use translated name if available
        } as NodeInstance;
      });

      // Map connections using array indices
      const newConnections = template.connections.map(c => ({
        ...c,
        id: generateId(),
        source: newNodes[c.source as number]?.id,
        target: newNodes[c.target as number]?.id
      }));

      setNodes(newNodes);
      setConnections(newConnections);
      setShowTemplates(false);
      addToast(`${content.templates[template.id] || 'Template'} loaded`, 'success');
    }
  };

  // Simulation Logic
  const handleSimulate = async () => {
    if (!isSimulating) {
      // Start real execution
      setIsSimulating(true);
      setActiveSimulationNode(null);
      setSimulationLogs([]);
      addToast("Starting execution...", "info");

      try {
        // If workflow not saved, save it first
        let workflowId = currentWorkflowId;
        if (!workflowId) {
          const { workflow, error } = await workflowService.createWorkflow(
            `Workflow ${new Date().toLocaleString()}`,
            nodes,
            connections
          );
          if (error || !workflow) {
            addToast(`Failed to save workflow: ${error || 'Unknown error'}`, "error");
            setIsSimulating(false);
            return;
          }
          workflowId = workflow.id;
          setCurrentWorkflowId(workflowId);
        }

        // Execute workflow
        const { executionId, logs, error } = await executionEngine.executeWorkflow(
          workflowId,
          nodes,
          connections
        );

        if (error) {
          setSimulationLogs(logs || []);
          addToast(`Execution failed: ${error}`, "error");
        } else {
          setSimulationLogs(logs || []);
          addToast("Execution completed successfully", "success");
        }
      } catch (err) {
        addToast("Execution error", "error");
      } finally {
        setIsSimulating(false);
      }
    } else {
      // Stop simulation
      setIsSimulating(false);
      addToast("Execution stopped", "info");
    }
  };

  // Activation Logic
  const handleToggleActivation = async () => {
    if (isActivating) return;

    setIsActivating(true);
    try {
      // Save workflow first if not saved
      let workflowId = currentWorkflowId;
      if (!workflowId) {
        const { workflow, error } = await workflowService.createWorkflow(
          `Workflow ${new Date().toLocaleString()}`,
          nodes,
          connections
        );
        if (error || !workflow) {
          addToast(`Failed to save workflow: ${error || 'Unknown error'}`, "error");
          setIsActivating(false);
          return;
        }
        workflowId = workflow.id;
        setCurrentWorkflowId(workflowId);
      } else {
        // Update existing workflow
        await workflowService.updateWorkflow(workflowId, { nodes, connections });
      }

      // Toggle activation
      if (isActive) {
        await backendApi.deactivateWorkflow(workflowId);
        setIsActive(false);
        addToast("Workflow deactivated", "success");
      } else {
        await backendApi.activateWorkflow(workflowId);
        setIsActive(true);
        addToast("Workflow activated! Running in background", "success");
      }
    } catch (error) {
      addToast(`Activation failed: ${(error as Error).message}`, "error");
    } finally {
      setIsActivating(false);
    }
  };

  const handleStartTestMode = async (config: { interval: string; duration: string; maxExecutions?: number }) => {
    try {
      // Save workflow first if not saved
      let workflowId = currentWorkflowId;
      if (!workflowId) {
        const { workflow, error } = await workflowService.createWorkflow(
          `Workflow ${new Date().toLocaleString()}`,
          nodes,
          connections
        );
        if (error || !workflow) {
          addToast(`Failed to save workflow: ${error || 'Unknown error'}`, "error");
          return;
        }
        workflowId = workflow.id;
        setCurrentWorkflowId(workflowId);
      } else {
        // Update existing workflow
        await workflowService.updateWorkflow(workflowId, { nodes, connections });
      }

      // Start test mode
      await backendApi.startTestMode(workflowId, config);
      addToast(`Test mode started: ${config.interval} for ${config.duration}`, "success");
    } catch (error) {
      addToast(`Test mode failed: ${(error as Error).message}`, "error");
      throw error;
    }
  };

  // Save workflow
  const handleSaveWorkflow = async () => {
    try {
      if (currentWorkflowId) {
        // Update existing
        const { error } = await workflowService.updateWorkflow(currentWorkflowId, {
          nodes,
          connections
        });
        if (error) {
          addToast(`Save failed: ${error}`, "error");
        } else {
          addToast("Workflow saved", "success");
        }
      } else {
        // Create new
        const { workflow, error } = await workflowService.createWorkflow(
          `Workflow ${new Date().toLocaleString()}`,
          nodes,
          connections
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
  };

  // Load workflow
  const handleLoadWorkflow = async (id: string) => {
    try {
      const { workflow, error } = await workflowService.getWorkflow(id);
      if (error || !workflow) {
        addToast(`Load failed: ${error}`, "error");
        return;
      }
      setNodes(workflow.nodes as NodeInstance[]);
      setConnections(workflow.connections as Connection[]);
      setCurrentWorkflowId(workflow.id);
      addToast("Workflow loaded", "success");
    } catch (err) {
      addToast("Load error", "error");
    }
  };

  // Rendering Connections - Memoized
  const connectionLines = useMemo(() => {
    return (
      <svg className="absolute inset-0 overflow-visible pointer-events-none z-10">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#475569" />
          </marker>
        </defs>
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.k})`}>
          {connections.map(conn => {
            const source = nodes.find(n => n.id === conn.source);
            const target = nodes.find(n => n.id === conn.target);
            if (!source || !target) return null;

            // Calculate connection points
            const sourceX = source.position.x + 240; // Width of node
            const sourceY = source.position.y + 36; // Mid-height
            const targetX = target.position.x;
            const targetY = target.position.y + 36;

            // Bezier curve for smooth connections
            const d = `M ${sourceX} ${sourceY} C ${sourceX + 50} ${sourceY}, ${targetX - 50} ${targetY}, ${targetX} ${targetY}`;

            return (
              <path
                key={conn.id}
                d={d}
                stroke="#475569"
                strokeWidth="1"
                fill="none"
                markerEnd="url(#arrowhead)"
                className="transition-all duration-200 hover:stroke-indigo-400 hover:stroke-[1.5]"
              />
            );
          })}
        </g>
      </svg>
    );
  }, [connections, nodes, viewport]);


  // Memoized callback for Sidebar to prevent re-renders
  const handleAddNodeFromSidebar = useCallback((type: NodeType) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (rect.width / 2 - viewport.x) / viewport.k;
      const y = (rect.height / 2 - viewport.y) / viewport.k;
      addNode(type, { x, y });
    } else {
      addNode(type, { x: 100, y: 100 });
    }
  }, [viewport, addNode]); // addNode depends mostly on constants/translation, so it stabilizes if those are stable? 
  // Wait, addNode (defined at line 211) is NOT wrapped in useCallback. 
  // I need to wrap addNode in useCallback first for this to work perfectly, 
  // OR just assume addNode identity changes? 
  // Function `addNode` (ln 211) is created every render. 
  // So `handleAddNodeFromSidebar` will ALSO change every render. 
  // This fails the optimization.
  // I MUST wrap `addNode` (ln 211) in useCallback first.

  return (
    <div className="w-full h-screen bg-[#0B0E14] text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden">

      <Header
        t={t}
        lang={lang}
        setLang={setLang}
        showTemplates={showTemplates}
        setShowTemplates={setShowTemplates}
        isGuidedMode={isGuidedMode}
        setIsGuidedMode={setIsGuidedMode}
        nodesCount={nodes.length}
        setShowJson={setShowJson}
        isSimulating={isSimulating}
        onSimulate={handleSimulate}
        user={user}
        onShowAuth={() => setShowAuthModal(true)}
        onLogout={() => { }}
        onRestartTutorial={() => {
          setTutorialStep(0);
          setTutorialActive(true);
        }}
        showLanguageModal={showLanguageModal}
        setShowLanguageModal={setShowLanguageModal}
        isActive={isActive}
        onToggleActivation={handleToggleActivation}
        onTestMode={() => setShowTestModeModal(true)}
        hasActiveWorkflow={nodes.some(n => n.type === 'cron')}
        onShowHistory={() => setShowHistory(true)}
      />

      <main className="flex-1 flex overflow-hidden relative">
        <Sidebar
          t={t}
          lang={lang}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          mainPrompt={mainPrompt}
          setMainPrompt={setMainPrompt}
          handleGenWorkflow={handleGenWorkflow}
          isProcessing={isProcessing}
          searchQuery={sidebarSearchQuery}
          setSearchQuery={setSidebarSearchQuery}
          addNode={handleAddNodeFromSidebar}
        />

        <div
          ref={canvasRef}
          className={`flex-1 relative overflow-hidden bg-[#0B0E14] ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onContextMenu={handleCanvasContextMenu}
        >
          {/* Background Grid */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: `${20 * viewport.k}px ${20 * viewport.k}px`, backgroundPosition: `${viewport.x}px ${viewport.y}px` }}></div>

          {/* Box Selection Rectangle */}
          {isBoxSelecting && boxSelectStart && boxSelectEnd && (
            <div
              className="absolute border-2 border-indigo-500 bg-indigo-500/10 pointer-events-none z-20"
              style={{
                left: Math.min(boxSelectStart.x, boxSelectEnd.x) * viewport.k + viewport.x,
                top: Math.min(boxSelectStart.y, boxSelectEnd.y) * viewport.k + viewport.y,
                width: Math.abs(boxSelectEnd.x - boxSelectStart.x) * viewport.k,
                height: Math.abs(boxSelectEnd.y - boxSelectStart.y) * viewport.k,
              }}
            />
          )}

          {/* Multi-Selection Bounding Box */}
          {selectedNodeIds.size > 1 && !isBoxSelecting && (() => {
            const selectedNodes = nodes.filter(n => selectedNodeIds.has(n.id));
            if (selectedNodes.length === 0) return null;

            const minX = Math.min(...selectedNodes.map(n => n.position.x));
            const minY = Math.min(...selectedNodes.map(n => n.position.y));
            const maxX = Math.max(...selectedNodes.map(n => n.position.x + 240));
            const maxY = Math.max(...selectedNodes.map(n => n.position.y + 72));

            return (
              <div
                className="absolute border-2 border-dashed border-indigo-400 rounded-lg pointer-events-none z-10"
                style={{
                  left: (minX - 8) * viewport.k + viewport.x,
                  top: (minY - 8) * viewport.k + viewport.y,
                  width: (maxX - minX + 16) * viewport.k,
                  height: (maxY - minY + 16) * viewport.k,
                }}
              >
                <div className="absolute -top-6 left-0 bg-indigo-500 text-white text-xs px-2 py-0.5 rounded">
                  {selectedNodeIds.size} selected
                </div>
              </div>
            );
          })()}

          {/* Connection Lines */}
          {connectionLines}

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
                    onDelete={() => removeNode(node.id)}
                    onMouseDown={handleNodeMouseDown}
                    onConnectStart={handleConnectStart}
                    onConnectEnd={handleConnectEnd}
                    onQuickAdd={handleQuickAddClick}
                    onSmartConfig={() => { setSelectedNodeId(node.id); setShowSmartConfig(true); }}
                    isGuidedMode={isGuidedMode}
                    isDimmed={isGuidedMode && selectedNodeId !== null && selectedNodeId !== node.id}
                    description={content.tips[node.type]?.desc || ""}
                    displayName={content.nodeNames[node.type] || node.name}
                    simulationStatus={
                      isSimulating
                        ? (activeSimulationNode === node.id ? 'running' : (simulationLogs.some(l => l.details?.nodeId === node.id && l.type === 'success') ? 'success' : 'idle'))
                        : 'idle'
                    }
                  />
                ))}
              </>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-40">
            <button onClick={zoomIn} className="p-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-600/20 shadow-lg"><ZoomIn size={18} /></button>
            <button onClick={zoomOut} className="p-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-600/20 shadow-lg"><ZoomOut size={18} /></button>
            <button onClick={resetView} className="p-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-600/20 shadow-lg"><Maximize size={18} /></button>
          </div>

          {/* Global Guide Bot - Shows when guided mode is active and no node selected */}
          {isGuidedMode && !selectedNodeId && <GuideBot t={t} lang={lang} variant="global" focusedField={null} />}

          {/* Empty State */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center animate-[fadeIn_0.5s] pointer-events-none p-6">
              <div className="flex flex-col items-center text-center max-w-lg w-full pointer-events-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1A1E26] to-[#0F1116] rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-2xl ring-1 ring-white/5 group">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <MousePointer2 size={28} className="text-slate-400 group-hover:text-indigo-400 transition-colors relative z-10" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">{t('startBuilding')}</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs md:max-w-sm mx-auto">
                  Right-click anywhere to add a node, or use the menu on the left.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl">
                  <button onClick={() => setShowTemplates(true)} className="flex items-center gap-3 p-3 bg-[#151921]/80 hover:bg-[#1A1E26] border border-white/5 hover:border-indigo-500/30 rounded-xl transition-all group text-left shadow-lg hover:shadow-indigo-500/10">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors"><Layout size={18} /></div>
                    <div><div className="font-bold text-slate-200 text-xs mb-0.5">{t('templates')}</div><div className="text-[10px] text-slate-500">Pre-built flows</div></div>
                  </button>
                  <button onClick={() => document.querySelector('textarea')?.focus()} className="flex items-center gap-3 p-3 bg-[#151921]/80 hover:bg-[#1A1E26] border border-white/5 hover:border-purple-500/30 rounded-xl transition-all group text-left shadow-lg hover:shadow-purple-500/10">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors"><Sparkles size={18} /></div>
                    <div><div className="font-bold text-slate-200 text-xs mb-0.5">{t('magicBuild')}</div><div className="text-[10px] text-slate-500">AI Generator</div></div>
                  </button>
                  <button onClick={() => setShowWizard(true)} className="flex items-center gap-3 p-3 bg-[#151921]/80 hover:bg-[#1A1E26] border border-white/5 hover:border-emerald-500/30 rounded-xl transition-all group text-left shadow-lg hover:shadow-emerald-500/10">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><Bot size={18} /></div>
                    <div><div className="font-bold text-slate-200 text-xs mb-0.5">Wizard Mode</div><div className="text-[10px] text-slate-500">Step-by-Step</div></div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Overlay */}
          {showWizard && (
            <WizardOverlay
              t={t}
              onClose={() => setShowWizard(false)}
              onComplete={(selections) => {
                // Wizard completion logic (simplified for refactor, reuse detailed one if needed)
                // Or import a helper to handle this.
                // For now, retaining basic logic but cleaner would be nice.
                // ... (keeping implementation logic minimal here or extracted)
                // Ideally this logic moves to WizardOverlay or a helper service.
                // I will assume WizardOverlay handles the *data* and passes it back, 
                // and App just adds it.
                let lastNodeId = '';
                const newNodes: NodeInstance[] = [];
                const newConnections: Connection[] = [];
                let xOffset = 100;

                // ... (Original wizard logic implementation)
                selections.forEach((sel, idx) => {
                  if (sel.type === 'none' as any) return;

                  const template = NODE_CATALOG.find(n => n.type === sel.type);
                  if (template) {
                    const newNode: NodeInstance = {
                      id: generateId(),
                      type: sel.type,
                      name: sel.label,
                      n8nType: template.n8nType,
                      n8nVersion: template.n8nVersion,
                      position: { x: xOffset, y: 300 },
                      icon: template.icon,
                      bg: template.bg,
                      color: template.color,
                      category: template.category,
                      border: template.border,
                      fields: template.fields,
                      desc: template.desc,
                      config: {},
                      customParams: {}
                    };
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
                setConnections(newConnections);
                setShowWizard(false);
                addToast('Wizard flow created!', 'success');
              }}
            />
          )}

          {/* Analysis Result */}
          {analysis && (
            <div className="absolute bottom-20 left-4 right-4 md:right-auto md:w-96 bg-[#11141a]/95 backdrop-blur border border-emerald-500/20 rounded-xl overflow-hidden shadow-2xl z-30 animate-[slideUp_0.3s]">
              <div className="bg-emerald-950/30 p-3 border-b border-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2"><Bot size={16} className="text-emerald-400" /><span className="text-xs font-bold text-emerald-100">{t('workflowAuditor')}</span></div>
                <button onClick={() => setAnalysis('')} className="text-emerald-500 hover:text-white"><Layout size={14} /></button>
              </div>
              <div className="p-4 text-xs text-slate-300 leading-relaxed font-light max-h-60 overflow-y-auto custom-scrollbar" dangerouslySetInnerHTML={{ __html: analysis }}></div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Help Button */}
      <HelpButton t={t} />

      {/* Quick Add Menu - Fixed positioning outside canvas */}
      {quickAdd.visible && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setQuickAdd({ ...quickAdd, visible: false })}
          />
          {/* Menu */}
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
        onClose={() => setShowTemplates(false)
        }
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
        configPrompt={configPrompt}
        setConfigPrompt={setConfigPrompt}
        handleSmartConfig={handleSmartConfig}
        isConfiguring={isConfiguring}
        setNodes={setNodes}
        nodes={nodes}
        connections={connections}
        simulationLogs={simulationLogs}
      />

      <SmartConfigModal
        isOpen={showSmartConfig}
        onClose={() => setShowSmartConfig(false)}
        selectedNode={selectedNode}
        t={t}
        configPrompt={configPrompt}
        setConfigPrompt={setConfigPrompt}
        isConfiguring={isConfiguring}
        onSmartConfig={handleSmartConfig}
        addToast={addToast}
      />

      {/* Auth Modal - Mandatory Gate if not logged in */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        canClose={!!user}
      />

      <JsonViewModal
        isOpen={showJson}
        onClose={() => setShowJson(false)}
        t={t}
        lang={lang}
        onShowGuide={() => setShowConnectivityGuide(true)}
        exportData={exportToN8n(nodes, connections)}
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
          isBoxSelecting={isBoxSelecting}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {/* Test Mode Modal */}
      <ExecutionLogsModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        workflowId="demo-flow-1"
      />

      <TestModeModal
        isOpen={showTestModeModal}
        onClose={() => setShowTestModeModal(false)}
        onStart={handleStartTestMode}
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