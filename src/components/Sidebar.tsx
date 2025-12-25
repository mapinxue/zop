import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import {
  Search,
  Plus,
  Folder,
  Layers,
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
  MoreHorizontal,
  Pencil,
  Trash2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import UserInfo from "./UserInfo";

interface SopItem {
  id: number;
  name: string;
  icon: string;
  item_type: string;
  created_at: string;
  updated_at: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  folder: Folder,
  "file-text": FileText,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  flag: Flag,
  zap: Zap,
  target: Target,
  coffee: Coffee,
  music: Music,
  camera: Camera,
  gift: Gift,
  briefcase: Briefcase,
  home: Home,
  settings: Settings,
  users: Users,
};

export default function AppSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<SopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const fetchItems = async () => {
    try {
      const result = await invoke<SopItem[]>("get_all_sop_items");
      setItems(result);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [location.pathname]);

  const handleCreateNew = () => {
    navigate("/new");
  };

  const getIcon = (iconName: string): LucideIcon => {
    return ICON_MAP[iconName] || Folder;
  };

  const handleRename = async (id: number) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await invoke("rename_sop_item", { id, name: editingName });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, name: editingName } : item
        )
      );
    } catch (error) {
      console.error("Failed to rename item:", error);
    }
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("delete_sop_item", { id });
      setItems((prev) => prev.filter((item) => item.id !== id));
      // Navigate to home if the deleted item was currently viewed
      const itemPath = items.find((item) => item.id === id);
      if (itemPath) {
        const currentPath =
          itemPath.item_type === "todo"
            ? `/todo/${itemPath.id}`
            : `/flow/${itemPath.id}`;
        if (location.pathname === currentPath) {
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const startEditing = (item: SopItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pb-0">
        <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          {/* Logo - 始终显示 */}
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Layers className="size-4" />
          </div>

          {/* Title and Actions - 只在展开状态显示 */}
          <div className="flex items-center justify-between flex-1 group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-semibold text-sidebar-foreground">
              {t('app.name')}
            </h2>
            <div className="flex items-center gap-1">
              <button
                className="p-1.5 hover:bg-sidebar-accent rounded-md transition-colors"
                title={t('sidebar.searchProject')}
              >
                <Search className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                className="p-1.5 hover:bg-sidebar-accent rounded-md transition-colors"
                title={t('common.newItem')}
                onClick={handleCreateNew}
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        {/* AI Home Button */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={t('sidebar.aiHome')}
                  onClick={() => navigate('/')}
                  isActive={location.pathname === '/'}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('sidebar.aiHome')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />

        {/* Project List */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>{t('sidebar.itemList')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="px-2 py-4 text-sm text-muted-foreground">
                  {t('common.loading')}
                </div>
              ) : items.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  {t('sidebar.emptyMessage')}
                </div>
              ) : (
              items.map((item) => {
                  const Icon = getIcon(item.icon);
                  const itemPath =
                    item.item_type === "todo"
                      ? `/todo/${item.id}`
                      : `/flow/${item.id}`;
                  const isActive = location.pathname === itemPath;
                  const isEditing = editingId === item.id;
                  const handleItemClick = () => {
                    if (!isEditing) {
                      navigate(itemPath);
                    }
                  };
                  return (
                    <SidebarMenuItem key={item.id} className="group/item">
                      {isEditing ? (
                        <div className="flex items-center gap-2 px-2 py-1">
                          <Icon className="w-4 h-4 shrink-0" />
                          <Input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleRename(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleRename(item.id);
                              } else if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                            className="h-6 text-sm"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center w-full">
                          <SidebarMenuButton
                            tooltip={item.name}
                            onClick={handleItemClick}
                            isActive={isActive}
                            className="flex-1"
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </SidebarMenuButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="p-1 opacity-0 group-hover/item:opacity-100 hover:bg-sidebar-accent rounded transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="right">
                              <DropdownMenuItem onClick={() => startEditing(item)}>
                                <Pencil className="w-4 h-4" />
                                <span>{t('sidebar.rename')}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>{t('sidebar.delete')}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User Info */}
      <SidebarFooter>
        <UserInfo />
      </SidebarFooter>

      {/* Rail for resizing */}
      <SidebarRail />
    </Sidebar>
  );
}
