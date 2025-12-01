import { Search, Plus, Folder, Layers } from "lucide-react";
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

interface Project {
  id: string;
  name: string;
}

// Mock 项目数据
const mockProjects: Project[] = [
  { id: "1", name: "个人项目" },
  { id: "2", name: "工作项目" },
  { id: "3", name: "学习笔记" },
  { id: "4", name: "待办事项" },
  { id: "5", name: "代码片段" },
];

export default function AppSidebar() {
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
                title="添加项目"
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
          <SidebarGroupLabel className="sr-only">项目列表</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mockProjects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton tooltip={project.name}>
                    <Folder className="w-4 h-4" />
                    <span>{project.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
