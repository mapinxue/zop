import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { Minus, Square, X, Pin, PinOff } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Toolbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const appWindow = getCurrentWindow();

  const getTitle = () => {
    const path = location.pathname;

    // Handle static routes
    if (path === "/") return t('toolbar.home');
    if (path === "/new") return t('toolbar.newItem');
    if (path === "/about") return t('toolbar.about');
    if (path === "/settings") return t('toolbar.settings');

    // Handle dynamic routes
    if (path.startsWith("/todo/")) return t('toolbar.todoDetail');
    if (path.startsWith("/flow/")) return t('toolbar.flowDetail');

    return "";
  };

  useEffect(() => {
    // 检查窗口是否最大化
    appWindow.isMaximized().then(setIsMaximized);

    // 监听窗口大小变化
    const unlisten = appWindow.onResized(() => {
      appWindow.isMaximized().then(setIsMaximized);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleMinimize = () => {
    appWindow.minimize();
  };

  const handleMaximize = () => {
    appWindow.toggleMaximize();
  };

  const handleClose = () => {
    appWindow.close();
  };

  const handleToggleAlwaysOnTop = async () => {
    try {
      const newState = await invoke("toggle_always_on_top");
      setIsAlwaysOnTop(newState as boolean);
    } catch (error) {
      console.error("Failed to toggle always on top:", error);
    }
  };

  const handleDragWindow = () => {
    appWindow.startDragging();
  };

  return (
    <div className="flex items-center justify-between h-[3.5rem] bg-background border-b border-border select-none">
      {/* Left: Sidebar Toggle + Title */}
      <div className="flex items-center h-full px-2 gap-2">
        <SidebarTrigger />
        <span className="text-sm font-medium text-foreground">{getTitle()}</span>
      </div>

      {/* Center: Draggable Area */}
      <div
        className="flex-1 h-full"
        onMouseDown={handleDragWindow}
      />

      {/* Right: Window Controls */}
      <div className="flex items-center h-full shrink-0">
        {/* Always on Top Button */}
        <button
          onClick={handleToggleAlwaysOnTop}
          className="h-full px-3 hover:bg-accent transition-colors flex items-center justify-center"
          title={isAlwaysOnTop ? t('toolbar.unpin') : t('toolbar.pin')}
        >
          {isAlwaysOnTop ? (
            <Pin className="w-4 h-4 text-primary" />
          ) : (
            <PinOff className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="h-full px-3 hover:bg-accent transition-colors flex items-center justify-center"
          title={t('toolbar.minimize')}
        >
          <Minus className="w-4 h-4 text-foreground" />
        </button>

        {/* Maximize/Restore */}
        <button
          onClick={handleMaximize}
          className="h-full px-3 hover:bg-accent transition-colors flex items-center justify-center"
          title={isMaximized ? t('toolbar.restore') : t('toolbar.maximize')}
        >
          <Square className="w-3.5 h-3.5 text-foreground" />
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="h-full px-3 hover:bg-destructive hover:text-white transition-colors flex items-center justify-center"
          title={t('toolbar.close')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
