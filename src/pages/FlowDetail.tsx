import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
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
} from "@xyflow/react";
import { Square, Circle, Diamond } from "lucide-react";
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
  shape: "rectangle" | "circle" | "diamond";
}

type EditableNode = Node<EditableNodeData>;

// Editable Node Component
function EditableNode({ data, selected }: NodeProps<EditableNode>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(data.label);
  };

  const handleSave = () => {
    data.label = editValue;
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(data.label);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const shapeClasses = {
    rectangle: "rounded-lg",
    circle: "rounded-full",
    diamond: "rotate-45",
  };

  const contentClasses = {
    rectangle: "",
    circle: "",
    diamond: "-rotate-45",
  };

  const sizeClasses = {
    rectangle: "min-w-[120px] min-h-[50px] px-4 py-2",
    circle: "w-[80px] h-[80px]",
    diamond: "w-[80px] h-[80px]",
  };

  return (
    <div
      className={`
        ${shapeClasses[data.shape]}
        ${sizeClasses[data.shape]}
        bg-background border-2
        ${selected ? "border-primary shadow-lg" : "border-border"}
        flex items-center justify-center
        transition-all cursor-pointer
        hover:border-primary/50
      `}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-primary !w-2 !h-2" />

      <div className={`${contentClasses[data.shape]} flex items-center justify-center w-full h-full`}>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="h-6 text-xs w-20 text-center"
            />
          </div>
        ) : (
          <span className="text-sm text-foreground text-center px-1 select-none">
            {data.label}
          </span>
        )}
      </div>
    </div>
  );
}

const nodeTypes = {
  editable: EditableNode,
};

export default function FlowDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const sopId = Number(id);

  const [nodes, setNodes, onNodesChange] = useNodesState<EditableNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const addNode = (shape: "rectangle" | "circle" | "diamond") => {
    const newNode: EditableNode = {
      id: `node-${Date.now()}`,
      type: "editable",
      position: { x: 200 + Math.random() * 100, y: 100 + Math.random() * 100 },
      data: { label: t('flowDetail.newNode'), shape },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
        className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="!bg-background" />
        <Controls className="!bg-background !border-border !shadow-md" />
      </ReactFlow>

      {/* Toolbar */}
      <div className="absolute bottom-4 right-4 flex gap-2 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg">
        <Button
          variant="outline"
          size="icon"
          onClick={() => addNode("rectangle")}
          title={t('flowDetail.addRectangle')}
        >
          <Square className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => addNode("circle")}
          title={t('flowDetail.addCircle')}
        >
          <Circle className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => addNode("diamond")}
          title={t('flowDetail.addDiamond')}
        >
          <Diamond className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
