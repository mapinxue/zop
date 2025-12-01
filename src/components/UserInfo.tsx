import { ChevronsUpDown, CloudCheck, CloudOff, LogOut, User } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";

interface UserInfoProps {
  name?: string;
  email?: string;
  avatar?: string;
}

export default function UserInfo({
  name = "张三",
  email = "zhangsan@example.com",
  avatar,
}: UserInfoProps) {
  const { state } = useSidebar();
  const [syncStatus, setSyncStatus] = useState<"synced" | "offline">("synced");

  const handleLogout = () => {
    console.log("退出登录");
    // TODO: 实现退出登录逻辑
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          {/* Avatar */}
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="size-8 rounded-lg object-cover"
              />
            ) : (
              <User className="size-4" />
            )}
          </div>

          {/* User Info - 只在展开状态显示 */}
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {email}
            </span>
          </div>

          {/* Chevron Icon - 只在展开状态显示 */}
          <ChevronsUpDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56"
        side={state === "collapsed" ? "right" : "bottom"}
        align={state === "collapsed" ? "start" : "end"}
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="size-8 rounded-lg object-cover"
                />
              ) : (
                <User className="size-4" />
              )}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Sync Status */}
        <DropdownMenuItem className="cursor-default focus:bg-transparent">
          <div className="flex items-center gap-2 w-full">
            {syncStatus === "synced" ? (
              <>
                <CloudCheck className="size-4 text-green-500" />
                <span className="text-sm">已同步</span>
              </>
            ) : (
              <>
                <CloudOff className="size-4 text-muted-foreground" />
                <span className="text-sm">未同步</span>
              </>
            )}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOut className="size-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
