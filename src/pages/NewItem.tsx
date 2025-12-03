import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import {
  Folder,
  FileText,
  Star,
  Heart,
  Bookmark,
  Flag,
  Zap,
  Target,
  Coffee,
  Music,
  Camera,
  Gift,
  Briefcase,
  Home,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ICONS = [
  { name: "folder", Icon: Folder },
  { name: "file-text", Icon: FileText },
  { name: "star", Icon: Star },
  { name: "heart", Icon: Heart },
  { name: "bookmark", Icon: Bookmark },
  { name: "flag", Icon: Flag },
  { name: "zap", Icon: Zap },
  { name: "target", Icon: Target },
  { name: "coffee", Icon: Coffee },
  { name: "music", Icon: Music },
  { name: "camera", Icon: Camera },
  { name: "gift", Icon: Gift },
  { name: "briefcase", Icon: Briefcase },
  { name: "home", Icon: Home },
  { name: "settings", Icon: Settings },
  { name: "users", Icon: Users },
];

const TYPES = [
  { value: "todo", label: "普通待办", description: "简单的待办事项清单" },
  { value: "flowchart", label: "流程图", description: "可视化的流程图编辑" },
];

export default function NewItem() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("folder");
  const [selectedType, setSelectedType] = useState("todo");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await invoke("create_sop_item", {
        item: {
          name: name.trim(),
          icon: selectedIcon,
          item_type: selectedType,
        },
      });
      navigate("/");
    } catch (error) {
      console.error("Failed to create item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">新建事项</h1>
          <p className="text-muted-foreground">创建一个新的 SOP 事项</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">名称</label>
            <Input
              type="text"
              placeholder="输入事项名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">图标</label>
            <div className="grid grid-cols-8 gap-2">
              {ICONS.map(({ name: iconName, Icon }) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setSelectedIcon(iconName)}
                  className={`p-2 rounded-md transition-colors ${
                    selectedIcon === iconName
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">类型</label>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`p-4 rounded-lg border transition-colors text-left ${
                    selectedType === type.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium text-foreground">{type.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/")}
            >
              取消
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting ? "创建中..." : "创建"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
