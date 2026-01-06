import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { X, ChevronRight, ChevronLeft, Check, Play, FileText, FormInput, CircleStop, List, CheckCircle2, Pin, PinOff, ArrowLeft, Upload, File, Trash2, Pencil, Paperclip, FolderOpen, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Node, Edge } from "@xyflow/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    allowAttachment?: boolean;
  };
}

type EditableNode = Node<EditableNodeData>;

interface UploadedFile {
  file_name: string;
  file_path: string;
  display_name?: string;
}

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
  const [isTocOpen, setIsTocOpen] = useState(true);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile[]>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null);
  const [editingFileName, setEditingFileName] = useState("");
  const [isFileListOpen, setIsFileListOpen] = useState(false);

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

    const startNode = nodes.find(n => n.data.shape === "start");
    if (!startNode) return nodes;

    const order: EditableNode[] = [];
    const visited = new Set<string>();

    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      order.push(node);

      const outgoingEdges = edges.filter(e => e.source === nodeId);
      for (const edge of outgoingEdges) {
        traverse(edge.target);
      }
    };

    traverse(startNode.id);

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

  const handleExit = useCallback(async () => {
    // Clear uploaded files for this SOP
    try {
      await invoke("clear_sop_uploads", { sopId });
    } catch (error) {
      console.error("Failed to clear uploads:", error);
    }
    navigate(`/flow/${sopId}`);
  }, [navigate, sopId]);

  const handleJumpToStep = useCallback((index: number) => {
    setCurrentNodeIndex(index);
    if (executionOrder[index]?.data.shape === "end") {
      setIsCompleted(true);
    } else {
      setIsCompleted(false);
    }
  }, [executionOrder]);

  const handleToggleAlwaysOnTop = async () => {
    try {
      const newState = await invoke("toggle_always_on_top");
      setIsAlwaysOnTop(newState as boolean);
    } catch (error) {
      console.error("Failed to toggle always on top:", error);
    }
  };

  const handleFileUpload = async () => {
    if (!currentNode) return;

    try {
      const selected = await open({
        multiple: true,
        title: t('flowExecute.uploadFile'),
      });

      if (selected) {
        setIsUploading(true);
        const files = Array.isArray(selected) ? selected : [selected];

        for (const filePath of files) {
          try {
            const result = await invoke<UploadedFile>("upload_file", {
              sopId,
              nodeId: currentNode.id,
              filePath,
            });

            setUploadedFiles((prev) => ({
              ...prev,
              [currentNode.id]: [...(prev[currentNode.id] || []), result],
            }));
          } catch (error) {
            console.error("Failed to upload file:", error);
          }
        }
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Failed to open file dialog:", error);
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (nodeId: string, fileIndex: number) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [nodeId]: prev[nodeId].filter((_, index) => index !== fileIndex),
    }));
  };

  const handleStartEditFileName = (fileIndex: number, currentName: string) => {
    setEditingFileIndex(fileIndex);
    setEditingFileName(currentName);
  };

  const handleSaveFileName = (nodeId: string, fileIndex: number) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [nodeId]: prev[nodeId].map((file, index) =>
        index === fileIndex
          ? { ...file, display_name: editingFileName || undefined }
          : file
      ),
    }));
    setEditingFileIndex(null);
    setEditingFileName("");
  };

  const handleCancelEditFileName = () => {
    setEditingFileIndex(null);
    setEditingFileName("");
  };

  // File operations for file list dropdown
  const handleOpenFolder = async (filePath: string) => {
    try {
      await revealItemInDir(filePath);
    } catch (error) {
      console.error("Failed to open folder:", error);
    }
  };

  const handleCopyPath = async (filePath: string) => {
    try {
      await navigator.clipboard.writeText(filePath);
    } catch (error) {
      console.error("Failed to copy path:", error);
    }
  };

  // Get all uploaded files grouped by node
  const allUploadedFiles = useMemo(() => {
    const result: { nodeId: string; nodeLabel: string; files: UploadedFile[] }[] = [];

    for (const node of executionOrder) {
      const files = uploadedFiles[node.id];
      if (files && files.length > 0) {
        result.push({
          nodeId: node.id,
          nodeLabel: node.data.label,
          files,
        });
      }
    }

    return result;
  }, [uploadedFiles, executionOrder]);

  const totalFilesCount = useMemo(() => {
    return Object.values(uploadedFiles).reduce((sum, files) => sum + files.length, 0);
  }, [uploadedFiles]);

  const currentNodeFiles = currentNode ? uploadedFiles[currentNode.id] || [] : [];

  const getSmallNodeIcon = (shape: string) => {
    switch (shape) {
      case "start":
        return <Play className="w-4 h-4 text-green-500" />;
      case "read":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "form":
        return <FormInput className="w-4 h-4 text-orange-500" />;
      case "end":
        return <CircleStop className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getNodeIcon = (shape: string) => {
    switch (shape) {
      case "start":
        return <Play className="w-5 h-5 text-green-500" />;
      case "read":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "form":
        return <FormInput className="w-5 h-5 text-orange-500" />;
      case "end":
        return <CircleStop className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const appWindow = getCurrentWindow();

  const handleDragWindow = () => {
    appWindow.startDragging();
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
      {/* Header - minimal toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border select-none">
        <div className="flex items-center gap-1">
          {/* Table of Contents Dropdown */}
          <DropdownMenu open={isTocOpen} onOpenChange={(open) => open && setIsTocOpen(true)} modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <List className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-border mb-1">
                <span className="text-sm font-medium">{t('flowExecute.toc')}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsTocOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {executionOrder.map((node, index) => {
                const isExecuted = index < currentNodeIndex;
                const isCurrent = index === currentNodeIndex;
                const isFuture = index > currentNodeIndex;

                return (
                  <DropdownMenuItem
                    key={node.id}
                    onClick={() => !isFuture && handleJumpToStep(index)}
                    className={`flex items-center gap-2 ${
                      isCurrent ? "bg-accent" : ""
                    } ${isFuture ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    disabled={isFuture}
                  >
                    {isExecuted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      getSmallNodeIcon(node.data.shape)
                    )}
                    <span className="flex-1 truncate">{node.data.label}</span>
                    {isCurrent && (
                      <span className="text-xs text-muted-foreground">{t('flowExecute.current')}</span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* File List Dropdown */}
          <DropdownMenu open={isFileListOpen} onOpenChange={setIsFileListOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                <Paperclip className="w-4 h-4" />
                {totalFilesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {totalFilesCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-border mb-1">
                <span className="text-sm font-medium">{t('flowExecute.fileList')}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsFileListOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {allUploadedFiles.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {t('flowExecute.noFiles')}
                </div>
              ) : (
                allUploadedFiles.map((group, groupIndex) => (
                  <div key={group.nodeId}>
                    {groupIndex > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-center gap-2">
                      <FormInput className="w-3 h-3" />
                      {group.nodeLabel}
                    </DropdownMenuLabel>
                    {group.files.map((file, fileIndex) => (
                      <div
                        key={fileIndex}
                        className="px-2 py-1.5 hover:bg-accent rounded-sm mx-1"
                      >
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                              {file.display_name || file.file_name}
                            </p>
                            {file.display_name && (
                              <p className="text-xs text-muted-foreground truncate">
                                {file.file_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5 ml-6">
                          <button
                            onClick={() => handleOpenFolder(file.file_path)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-background"
                            title={t('flowExecute.openFolder')}
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopyPath(file.file_path)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-background"
                            title={t('flowExecute.copyPath')}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-4 bg-border mx-1" />

          <span className="text-xs text-muted-foreground">
            {currentNodeIndex + 1} / {executionOrder.length}
          </span>

          {/* Progress bar */}
          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentNodeIndex + 1) / executionOrder.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Draggable area */}
        <div
          className="flex-1 h-full cursor-move"
          onMouseDown={handleDragWindow}
        />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleToggleAlwaysOnTop}
            title={isAlwaysOnTop ? t('toolbar.unpin') : t('toolbar.pin')}
          >
            {isAlwaysOnTop ? (
              <Pin className="w-4 h-4 text-primary" />
            ) : (
              <PinOff className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExit} title={t('flowExecute.exit')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {isCompleted ? (
          <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {t('flowExecute.completed')}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t('flowExecute.completedMessage')}
            </p>
            <Button onClick={handleExit}>
              {t('flowExecute.exit')}
            </Button>
          </div>
        ) : currentNode ? (
          <div className="p-6 space-y-6 max-w-3xl mx-auto">
            {/* Title section - top left aligned */}
            <div className="flex items-center gap-3">
              {getNodeIcon(currentNode.data.shape)}
              <h1 className="text-xl font-semibold text-foreground">
                {currentNode.data.label}
              </h1>
            </div>

            {/* Content section */}
            {currentNode.data.config?.content && (
              <div className="prose prose-sm dark:prose-invert max-w-none [&_ol]:list-decimal [&_ol]:pl-4 [&_ul]:list-disc [&_ul]:pl-4 [&_p]:text-muted-foreground [&_li]:text-muted-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentNode.data.config.content}
                </ReactMarkdown>
              </div>
            )}

            {/* File upload section for form nodes with allowAttachment */}
            {currentNode.data.shape === "form" && currentNode.data.config?.allowAttachment && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-foreground">
                  {t('flowExecute.uploadFile')}
                </h3>

                {/* Upload button */}
                <button
                  onClick={handleFileUpload}
                  disabled={isUploading}
                  className="w-full border-2 border-dashed border-border rounded-lg p-4 hover:border-orange-500 hover:bg-orange-500/5 transition-colors flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-muted-foreground">
                    {isUploading ? t('common.loading') : t('flowExecute.uploadHint')}
                  </span>
                </button>

                {/* Uploaded files list */}
                {currentNodeFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t('flowExecute.uploadedFiles')}
                    </h4>
                    <div className="space-y-2">
                      {currentNodeFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                        >
                          <File className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            {editingFileIndex === index ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingFileName}
                                  onChange={(e) => setEditingFileName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSaveFileName(currentNode.id, index);
                                    } else if (e.key === "Escape") {
                                      handleCancelEditFileName();
                                    }
                                  }}
                                  placeholder={t('flowExecute.fileNamePlaceholder')}
                                  className="flex-1 text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveFileName(currentNode.id, index)}
                                  className="p-1 text-primary hover:text-primary/80 transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelEditFileName}
                                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-foreground truncate">
                                  {file.display_name || file.file_name}
                                </p>
                                {file.display_name && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {file.file_name}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground truncate" title={file.file_path}>
                                  {file.file_path}
                                </p>
                              </>
                            )}
                          </div>
                          {editingFileIndex !== index && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleStartEditFileName(index, file.display_name || file.file_name)}
                                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                title={t('flowExecute.editFileName')}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveFile(currentNode.id, index)}
                                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                title={t('flowExecute.removeFile')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hint text */}
            <p className="text-xs text-muted-foreground pt-4">
              {currentNode.data.shape === "start" && t('flowExecute.startHint')}
              {currentNode.data.shape === "read" && t('flowExecute.readHint')}
              {currentNode.data.shape === "form" && t('flowExecute.formHint')}
              {currentNode.data.shape === "end" && t('flowExecute.endHint')}
            </p>
          </div>
        ) : null}
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentNodeIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t('flowExecute.previous')}
        </Button>

        {!isCompleted && (
          <Button
            size="sm"
            onClick={handleNext}
            disabled={currentNodeIndex === executionOrder.length - 1}
          >
            {t('flowExecute.next')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
