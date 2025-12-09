import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ICONS: { name: string; Icon: LucideIcon }[] = [
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

export default function NewItem() {
  const { t } = useTranslation();
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

  const getSelectedIcon = () => {
    return ICONS.find((i) => i.name === selectedIcon) || ICONS[0];
  };

  const SelectedIconComponent = getSelectedIcon().Icon;

  const TYPES = [
    { value: "todo", label: t('newItem.todoType'), description: t('newItem.todoDescription') },
    { value: "flowchart", label: t('newItem.flowchartType'), description: t('newItem.flowchartDescription') },
  ];

  return (
    <div className="h-full bg-background pt-6 pl-8 pr-8">
      <div className="w-full max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Icon + Name Row */}
          <div className="flex items-end gap-4">
            {/* Icon Selector */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">{t('newItem.icon')}</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background hover:bg-accent transition-colors text-sm"
                  >
                    <SelectedIconComponent className="w-4 h-4 text-foreground" />
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="p-2">
                  <div className="grid grid-cols-8 gap-1">
                    {ICONS.map(({ name: iconName, Icon }) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setSelectedIcon(iconName)}
                        title={t(`icons.${iconName === 'file-text' ? 'document' : iconName}`)}
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Separator */}
            {/* <span className="h-9 flex items-center text-muted-foreground text-lg">/</span> */}

            {/* Name Input */}
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-foreground">{t('newItem.name')}</label>
              <Input
                type="text"
                placeholder={t('newItem.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Type Selector */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">{t('newItem.type')}</label>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`p-4 rounded-lg border transition-colors text-left ${
                    selectedType === type.value
                      ? "bg-accent border-none"
                      : "border-primary/10 hover:bg-accent/50"
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
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting ? t('common.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
