import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeProps,
  Handle,
  Position,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { Play, FileText, FormInput, CircleStop, Hammer, PlayCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FlowData {
  id: number;
  sop_id: number;
  nodes: string;
  edges: string;
  created_at: string;
  updated_at: string;
}

interface EditableNodeData extends Record<string, unknown> {
  label: string;
  shape: "start" | "read" | "form" | "end";
  config?: {
    content?: string;
  };
}

type EditableNode = Node<EditableNodeData>;

// Editable Node Component
function EditableNode({ data, selected }: NodeProps<EditableNode>) {
  const shapeClasses = {
    start: "rounded-full bg-green-500/10 border-green-500",
    read: "rounded-lg bg-blue-500/10 border-blue-500",
    form: "rounded-lg bg-orange-500/10 border-orange-500",
    end: "rounded-full bg-red-500/10 border-red-500",
  };

  const sizeClasses = {
    start: "w-[80px] h-[80px]",
    read: "min-w-[120px] min-h-[50px] px-4 py-2",
    form: "min-w-[120px] min-h-[50px] px-4 py-2",
    end: "w-[80px] h-[80px]",
  };

  return (
    <div
      className={`
        ${shapeClasses[data.shape]}
        ${sizeClasses[data.shape]}
        border-2
        ${selected ? "shadow-lg ring-2 ring-primary" : ""}
        flex items-center justify-center
        transition-all cursor-pointer
        hover:shadow-md
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-primary !w-2 !h-2" />

      <div className="flex items-center justify-center w-full h-full">
        <span className="text-sm text-foreground text-center px-1 select-none">
          {data.label}
        </span>
      </div>
    </div>
  );
}

const nodeTypes = {
  editable: EditableNode,
};

function FlowDetailInner() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const sopId = Number(id);
  const { screenToFlowPosition, getViewport } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<EditableNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [selectedNode, setSelectedNode] = useState<EditableNode | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as HTMLElement)) {
        setIsToolbarExpanded(false);
      }
    };

    if (isToolbarExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isToolbarExpanded]);

  // Load flow data
  useEffect(() => {
    const loadFlowData = async () => {
      try {
        const data = await invoke<FlowData | null>("get_flow_data", { sopId });
        if (data) {
          const parsedNodes = JSON.parse(data.nodes) as EditableNode[];
          const parsedEdges = JSON.parse(data.edges) as Edge[];
          setNodes(parsedNodes);
          setEdges(parsedEdges);
        }
      } catch (error) {
        console.error("Failed to load flow data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFlowData();
  }, [sopId]);

  // Auto-save with debounce
  const saveFlowData = useCallback(async () => {
    try {
      await invoke("save_flow_data", {
        sopId,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
      });
    } catch (error) {
      console.error("Failed to save flow data:", error);
    }
  }, [sopId, nodes, edges]);

  useEffect(() => {
    if (isLoading) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveFlowData();
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [nodes, edges, saveFlowData, isLoading]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Find source and target nodes to determine edge type
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      let edgeType = "smoothstep";

      // Use straight line if nodes are aligned (within 5px tolerance)
      if (sourceNode && targetNode) {
        const xDiff = Math.abs(sourceNode.position.x - targetNode.position.x);
        const yDiff = Math.abs(sourceNode.position.y - targetNode.position.y);

        if (xDiff < 5 || yDiff < 5) {
          edgeType = "straight";
        }
      }

      setEdges((eds) => addEdge({ ...params, type: edgeType }, eds));
    },
    [setEdges, nodes]
  );

  // Dynamically update edge types when nodes move
  useEffect(() => {
    if (edges.length === 0 || nodes.length === 0) return;

    const updatedEdges = edges.map((edge) => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        const xDiff = Math.abs(sourceNode.position.x - targetNode.position.x);
        const yDiff = Math.abs(sourceNode.position.y - targetNode.position.y);

        const newType = (xDiff < 1 || yDiff < 1) ? "straight" : "smoothstep";

        if (edge.type !== newType) {
          return { ...edge, type: newType };
        }
      }
      return edge;
    });

    // Only update if there are actual changes
    const hasChanges = updatedEdges.some((edge, i) => edge.type !== edges[i].type);
    if (hasChanges) {
      setEdges(updatedEdges);
    }
  }, [nodes]);

  const addNode = (shape: "start" | "read" | "form" | "end") => {
    // Calculate center position in flow coordinates using viewport
    const { x, y, zoom } = getViewport();
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 600;

    // Convert viewport center to flow position
    const centerX = -x / zoom + containerWidth / 2 / zoom;
    const centerY = -y / zoom + containerHeight / 2 / zoom;

    const defaultLabels = {
      start: t('flowDetail.startNode'),
      read: t('flowDetail.readNode'),
      form: t('flowDetail.formNode'),
      end: t('flowDetail.endNode'),
    };

    const newNode: EditableNode = {
      id: `node-${Date.now()}`,
      type: "editable",
      position: { x: centerX - 60, y: centerY - 25 }, // Offset by half node size
      data: { label: defaultLabels[shape], shape },
    };
    setNodes((nds) => [...nds, newNode]);
    setIsToolbarExpanded(false);
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const shape = event.dataTransfer.getData("application/reactflow-shape") as "start" | "read" | "form" | "end";
      if (!shape) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const defaultLabels = {
        start: t('flowDetail.startNode'),
        read: t('flowDetail.readNode'),
        form: t('flowDetail.formNode'),
        end: t('flowDetail.endNode'),
      };

      const newNode: EditableNode = {
        id: `node-${Date.now()}`,
        type: "editable",
        position,
        data: { label: defaultLabels[shape], shape },
      };

      setNodes((nds) => [...nds, newNode]);
      setIsToolbarExpanded(false);
    },
    [screenToFlowPosition, t, setNodes]
  );

  const onDragStart = (event: React.DragEvent, shape: "start" | "read" | "form" | "end") => {
    event.dataTransfer.setData("application/reactflow-shape", shape);
    event.dataTransfer.effectAllowed = "move";
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: EditableNode) => {
    // Only show config for read and form nodes
    if (node.data.shape === "read" || node.data.shape === "form") {
      setSelectedNode(node);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = (nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      )
    );
    // Update selectedNode to reflect the change
    setSelectedNode((prev) =>
      prev && prev.id === nodeId
        ? { ...prev, data: { ...prev.data, label: newLabel } }
        : prev
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background relative" ref={containerRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.5, maxZoom: 1 }}
        deleteKeyCode={["Backspace", "Delete"]}
        className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="!bg-background" />
        <Controls className="!bg-background !border-border !shadow-md" />
      </ReactFlow>

      {/* Toolbar */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
        {isToolbarExpanded && (
          <div className="flex flex-col gap-2 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200" ref={toolbarRef}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">{t('flowDetail.addNode')}</span>
              <button
                onClick={() => setIsToolbarExpanded(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div
              draggable
              onDragStart={(e) => onDragStart(e, "start")}
              onClick={() => addNode("start")}
              className="flex items-center gap-3 h-9 px-3 rounded-md cursor-grab hover:bg-accent transition-colors"
            >
              <Play className="w-4 h-4 text-green-500" />
              <span className="text-sm">{t('flowDetail.startNode')}</span>
            </div>
            <div
              draggable
              onDragStart={(e) => onDragStart(e, "read")}
              onClick={() => addNode("read")}
              className="flex items-center gap-3 h-9 px-3 rounded-md cursor-grab hover:bg-accent transition-colors"
            >
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-sm">{t('flowDetail.readNode')}</span>
            </div>
            <div
              draggable
              onDragStart={(e) => onDragStart(e, "form")}
              onClick={() => addNode("form")}
              className="flex items-center gap-3 h-9 px-3 rounded-md cursor-grab hover:bg-accent transition-colors"
            >
              <FormInput className="w-4 h-4 text-orange-500" />
              <span className="text-sm">{t('flowDetail.formNode')}</span>
            </div>
            <div
              draggable
              onDragStart={(e) => onDragStart(e, "end")}
              onClick={() => addNode("end")}
              className="flex items-center gap-3 h-9 px-3 rounded-md cursor-grab hover:bg-accent transition-colors"
            >
              <CircleStop className="w-4 h-4 text-red-500" />
              <span className="text-sm">{t('flowDetail.endNode')}</span>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg"
            onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
          >
            <Hammer className="w-5 h-5" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg"
            onClick={() => navigate(`/flow/${sopId}/execute`)}
          >
            <PlayCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Node Configuration Sidebar */}
      {selectedNode && (
        <div className="absolute top-0 right-0 h-full w-80 bg-background border-l border-border shadow-lg animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">
              {selectedNode.data.shape === "read" ? t('flowDetail.readNodeConfig') : t('flowDetail.formNodeConfig')}
            </h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('flowDetail.nodeName')}
              </label>
              <Input
                type="text"
                value={selectedNode.data.label}
                onChange={(e) => updateNodeData(selectedNode.id, e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlowDetail() {
  return (
    <ReactFlowProvider>
      <FlowDetailInner />
    </ReactFlowProvider>
  );
}
