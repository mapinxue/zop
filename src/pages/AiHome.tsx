import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import {
  RotateCcw,
  Send,
  Loader2,
  GripVertical,
  Trash2,
  Plus,
  Check,
  Play,
  FileText,
  FormInput,
  CircleStop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SopStep {
  step_type: "start" | "read" | "form" | "end";
  label: string;
  content: string | null;
}

interface GeneratedSop {
  title: string;
  steps: SopStep[];
}

const STEP_TYPES = [
  { value: "start", label: "Start", icon: Play, color: "text-green-500" },
  { value: "read", label: "Read", icon: FileText, color: "text-blue-500" },
  { value: "form", label: "Form", icon: FormInput, color: "text-orange-500" },
  { value: "end", label: "End", icon: CircleStop, color: "text-red-500" },
];

export default function AiHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSop, setGeneratedSop] = useState<GeneratedSop | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleReset = () => {
    setInput("");
    setGeneratedSop(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await invoke<GeneratedSop>("generate_sop", {
        prompt: input,
      });
      setGeneratedSop(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const updateStep = (index: number, field: keyof SopStep, value: string) => {
    if (!generatedSop) return;

    const newSteps = [...generatedSop.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setGeneratedSop({ ...generatedSop, steps: newSteps });
  };

  const deleteStep = (index: number) => {
    if (!generatedSop) return;

    const newSteps = generatedSop.steps.filter((_, i) => i !== index);
    setGeneratedSop({ ...generatedSop, steps: newSteps });
  };

  const addStep = (afterIndex: number) => {
    if (!generatedSop) return;

    const newStep: SopStep = {
      step_type: "read",
      label: t("aiHome.newStep"),
      content: "",
    };

    const newSteps = [...generatedSop.steps];
    newSteps.splice(afterIndex + 1, 0, newStep);
    setGeneratedSop({ ...generatedSop, steps: newSteps });
  };

  const handleCreateFlow = async () => {
    if (!generatedSop) return;

    setIsCreating(true);

    try {
      // Create SOP item
      const sopItem = await invoke<{ id: number }>("create_sop_item", {
        item: {
          name: generatedSop.title,
          icon: "zap",
          item_type: "flowchart",
        },
      });

      // Convert steps to flow nodes and edges
      const nodes = generatedSop.steps.map((step, index) => ({
        id: `node-${Date.now()}-${index}`,
        type: "editable",
        position: { x: 300, y: 100 + index * 120 },
        data: {
          label: step.label,
          shape: step.step_type,
          config: step.content ? { content: step.content } : undefined,
        },
      }));

      const edges = nodes.slice(0, -1).map((node, index) => ({
        id: `edge-${Date.now()}-${index}`,
        source: node.id,
        target: nodes[index + 1].id,
        type: "straight",
      }));

      // Save flow data
      await invoke("save_flow_data", {
        sopId: sopItem.id,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
      });

      // Navigate to flow detail
      navigate(`/flow/${sopItem.id}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsCreating(false);
    }
  };

  const getStepIcon = (stepType: string) => {
    const type = STEP_TYPES.find((t) => t.value === stepType);
    if (!type) return null;
    const Icon = type.icon;
    return <Icon className={`w-4 h-4 ${type.color}`} />;
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto space-y-6">
          {/* Input area */}
          {!generatedSop && (
            <div className="space-y-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("aiHome.placeholder")}
                className="min-h-[200px] resize-none text-base"
                disabled={isGenerating}
              />

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!input.trim() || isGenerating}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t("aiHome.reset")}
                </Button>

                <Button onClick={handleGenerate} disabled={!input.trim() || isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isGenerating ? t("aiHome.generating") : t("aiHome.generate")}
                </Button>
              </div>
            </div>
          )}

          {/* Generated SOP Editor */}
          {generatedSop && (
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("aiHome.sopTitle")}
                </label>
                <Input
                  value={generatedSop.title}
                  onChange={(e) =>
                    setGeneratedSop({ ...generatedSop, title: e.target.value })
                  }
                  className="text-lg font-semibold"
                />
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  {t("aiHome.steps")}
                </label>

                {generatedSop.steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-center w-6 h-9 text-muted-foreground">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={step.step_type}
                          onValueChange={(value) =>
                            updateStep(index, "step_type", value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue>
                              <div className="flex items-center gap-2">
                                {getStepIcon(step.step_type)}
                                <span className="capitalize">{step.step_type}</span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {STEP_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className={`w-4 h-4 ${type.color}`} />
                                  <span>{type.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          value={step.label}
                          onChange={(e) =>
                            updateStep(index, "label", e.target.value)
                          }
                          placeholder={t("aiHome.stepLabel")}
                          className="flex-1"
                        />
                      </div>

                      {(step.step_type === "read" || step.step_type === "form") && (
                        <Textarea
                          value={step.content || ""}
                          onChange={(e) =>
                            updateStep(index, "content", e.target.value)
                          }
                          placeholder={t("aiHome.stepContent")}
                          className="min-h-[60px] resize-none text-sm"
                        />
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => addStep(index)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteStep(index)}
                        disabled={generatedSop.steps.length <= 2}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t("aiHome.startOver")}
                </Button>

                <Button onClick={handleCreateFlow} disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {isCreating ? t("aiHome.creating") : t("aiHome.createFlow")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
