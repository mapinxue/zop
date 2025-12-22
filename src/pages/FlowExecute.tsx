import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { X, ChevronRight, ChevronLeft, Check, Play, FileText, FormInput, CircleStop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Node, Edge } from "@xyflow/react";

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

export default function FlowExecute() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const sopId = Number(id);

  const [nodes, setNodes] = useState<EditableNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

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

  // Compute execution order from start node
  const executionOrder = useMemo(() => {
    if (nodes.length === 0) return [];

    // Find start node
    const startNode = nodes.find(n => n.data.shape === "start");
    if (!startNode) return nodes; // Fallback to all nodes if no start

    const order: EditableNode[] = [];
    const visited = new Set<string>();

    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      order.push(node);

      // Find next nodes through edges
      const outgoingEdges = edges.filter(e => e.source === nodeId);
      for (const edge of outgoingEdges) {
        traverse(edge.target);
      }
    };

    traverse(startNode.id);

    // Add any unvisited nodes at the end
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        order.push(node);
      }
    });

    return order;
  }, [nodes, edges]);

  const currentNode = executionOrder[currentNodeIndex];

  const handleNext = useCallback(() => {
    if (currentNodeIndex < executionOrder.length - 1) {
      const nextIndex = currentNodeIndex + 1;
      setCurrentNodeIndex(nextIndex);

      // Check if we reached the end
      if (executionOrder[nextIndex]?.data.shape === "end") {
        setIsCompleted(true);
      }
    }
  }, [currentNodeIndex, executionOrder]);

  const handlePrevious = useCallback(() => {
    if (currentNodeIndex > 0) {
      setCurrentNodeIndex(currentNodeIndex - 1);
      setIsCompleted(false);
    }
  }, [currentNodeIndex]);

  const handleExit = useCallback(() => {
    navigate(`/flow/${sopId}`);
  }, [navigate, sopId]);

  const getNodeIcon = (shape: string) => {
    switch (shape) {
      case "start":
        return <Play className="w-8 h-8 text-green-500" />;
      case "read":
        return <FileText className="w-8 h-8 text-blue-500" />;
      case "form":
        return <FormInput className="w-8 h-8 text-orange-500" />;
      case "end":
        return <CircleStop className="w-8 h-8 text-red-500" />;
      default:
        return null;
    }
  };

  const getNodeColorClass = (shape: string) => {
    switch (shape) {
      case "start":
        return "border-green-500 bg-green-500/10";
      case "read":
        return "border-blue-500 bg-blue-500/10";
      case "form":
        return "border-orange-500 bg-orange-500/10";
      case "end":
        return "border-red-500 bg-red-500/10";
      default:
        return "border-border bg-background";
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (executionOrder.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">{t('flowExecute.emptyFlow')}</p>
        <Button variant="outline" onClick={handleExit}>
          <X className="w-4 h-4 mr-2" />
          {t('flowExecute.exit')}
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {t('flowExecute.step')} {currentNodeIndex + 1} / {executionOrder.length}
          </span>
          {/* Progress bar */}
          <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentNodeIndex + 1) / executionOrder.length) * 100}%` }}
            />
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleExit}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {isCompleted ? (
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
              <Check className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              {t('flowExecute.completed')}
            </h2>
            <p className="text-muted-foreground">
              {t('flowExecute.completedMessage')}
            </p>
            <Button onClick={handleExit}>
              {t('flowExecute.exit')}
            </Button>
          </div>
        ) : currentNode ? (
          <div className="flex flex-col items-center gap-8 max-w-2xl w-full">
            {/* Node display */}
            <div className={`
              w-full p-8 rounded-xl border-2
              ${getNodeColorClass(currentNode.data.shape)}
              flex flex-col items-center gap-6
            `}>
              {getNodeIcon(currentNode.data.shape)}
              <h2 className="text-2xl font-semibold text-foreground text-center">
                {currentNode.data.label}
              </h2>
              {currentNode.data.config?.content && (
                <p className="text-muted-foreground text-center whitespace-pre-wrap">
                  {currentNode.data.config.content}
                </p>
              )}
            </div>

            {/* Node type hint */}
            <p className="text-sm text-muted-foreground">
              {currentNode.data.shape === "start" && t('flowExecute.startHint')}
              {currentNode.data.shape === "read" && t('flowExecute.readHint')}
              {currentNode.data.shape === "form" && t('flowExecute.formHint')}
              {currentNode.data.shape === "end" && t('flowExecute.endHint')}
            </p>
          </div>
        ) : null}
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentNodeIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t('flowExecute.previous')}
        </Button>

        {!isCompleted && (
          <Button
            onClick={handleNext}
            disabled={currentNodeIndex === executionOrder.length - 1}
          >
            {t('flowExecute.next')}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
