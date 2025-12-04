import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { Minus, Square, X, Pin, PinOff } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

const ROUTE_TITLES: Record<string, string> = {
  "/": "首页",
  "/new": "新建事项",
  "/about": "关于",
  "/settings": "设置",
};

export default function Toolbar() {
  const location = useLocation();
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const appWindow = getCurrentWindow();

  const getTitle = () => {
    return ROUTE_TITLES[location.pathname] || "Zop";
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
          title={isAlwaysOnTop ? "取消置顶" : "窗口置顶"}
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
          title="最小化"
        >
          <Minus className="w-4 h-4 text-foreground" />
        </button>

        {/* Maximize/Restore */}
        <button
          onClick={handleMaximize}
          className="h-full px-3 hover:bg-accent transition-colors flex items-center justify-center"
          title={isMaximized ? "还原" : "最大化"}
        >
          <Square className="w-3.5 h-3.5 text-foreground" />
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="h-full px-3 hover:bg-destructive hover:text-white transition-colors flex items-center justify-center"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
