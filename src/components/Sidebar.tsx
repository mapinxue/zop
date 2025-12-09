import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
} from "@/components/ui/sidebar";
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
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<SopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
              Zop
            </h2>
            <div className="flex items-center gap-1">
              <button
                className="p-1.5 hover:bg-sidebar-accent rounded-md transition-colors"
                title="搜索项目"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                className="p-1.5 hover:bg-sidebar-accent rounded-md transition-colors"
                title="新建事项"
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
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="sr-only">事项列表</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="px-2 py-4 text-sm text-muted-foreground">
                  加载中...
                </div>
              ) : items.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  暂无事项，点击 + 创建
                </div>
              ) : (
                items.map((item) => {
                  const Icon = getIcon(item.icon);
                  const itemPath =
                    item.item_type === "todo"
                      ? `/todo/${item.id}`
                      : `/flow/${item.id}`;
                  const isActive = location.pathname === itemPath;
                  const handleItemClick = () => {
                    navigate(itemPath);
                  };
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        tooltip={item.name}
                        onClick={handleItemClick}
                        isActive={isActive}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </SidebarMenuButton>
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
