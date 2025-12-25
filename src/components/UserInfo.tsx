import { ChevronsUpDown, CloudOff, LogOut, User, Languages, Check, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";

export default function UserInfo() {
  const { t, i18n } = useTranslation();
  const { state } = useSidebar();
  const navigate = useNavigate();

  const name = "User";
  const email = "user@zhiliang.com";

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
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
            <User className="size-4" />
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
              <User className="size-4" />
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

        {/* Sync Status - disabled */}
        <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
          <div className="flex items-center gap-2 w-full">
            <CloudOff className="size-4 text-muted-foreground" />
            <span className="text-sm">{t('userInfo.offline')}</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* AI Config */}
        <DropdownMenuItem onClick={() => navigate('/ai-config')}>
          <Settings className="size-4" />
          <span>{t('userInfo.aiConfig')}</span>
        </DropdownMenuItem>

        {/* Language Selector - enabled */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="size-4" />
            <span>{t('userInfo.language')}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => changeLanguage('zh')}>
              <Check className={`size-4 ${i18n.language === 'zh' ? 'opacity-100' : 'opacity-0'}`} />
              <span>{t('userInfo.chinese')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('en')}>
              <Check className={`size-4 ${i18n.language === 'en' ? 'opacity-100' : 'opacity-0'}`} />
              <span>{t('userInfo.english')}</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Logout - disabled */}
        <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
          <LogOut className="size-4" />
          <span>{t('userInfo.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
