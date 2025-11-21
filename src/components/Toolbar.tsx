import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { Minus, Square, X, Pin, PinOff, Layers } from "lucide-react";

export default function Toolbar() {
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const appWindow = getCurrentWindow();

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

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between h-10 bg-background border-b border-border select-none"
    >
      {/* Left: Logo and Title */}
      <div
        data-tauri-drag-region
        className="flex items-center gap-2 px-3 h-full"
      >
        <Layers className="w-5 h-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">Zop</span>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center h-full">
        {/* Always on Top Button */}
        <button
          onClick={handleToggleAlwaysOnTop}
          className="h-full px-3 hover:bg-accent transition-colors"
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
          className="h-full px-3 hover:bg-accent transition-colors"
          title="最小化"
        >
          <Minus className="w-4 h-4 text-foreground" />
        </button>

        {/* Maximize/Restore */}
        <button
          onClick={handleMaximize}
          className="h-full px-3 hover:bg-accent transition-colors"
          title={isMaximized ? "还原" : "最大化"}
        >
          <Square className="w-3.5 h-3.5 text-foreground" />
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="h-full px-3 hover:bg-destructive hover:text-white transition-colors"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
