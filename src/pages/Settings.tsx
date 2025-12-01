import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function Settings() {
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  async function toggleAlwaysOnTop() {
    try {
      const newState = await invoke("toggle_always_on_top");
      setIsAlwaysOnTop(newState as boolean);
    } catch (error) {
      console.error("Failed to toggle always on top:", error);
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-background">
      <h1 className="text-2xl font-bold text-foreground">设置</h1>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">窗口设置</h2>
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <h3 className="font-medium text-foreground">窗口置顶</h3>
            <p className="text-sm text-muted-foreground">让窗口始终显示在其他窗口上方</p>
          </div>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isAlwaysOnTop
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
            onClick={toggleAlwaysOnTop}
          >
            {isAlwaysOnTop ? "已开启" : "已关闭"}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">外观设置</h2>
        <div className="flex items-center justify-between py-3">
          <div>
            <h3 className="font-medium text-foreground">主题</h3>
            <p className="text-sm text-muted-foreground">选择应用的显示主题</p>
          </div>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as "light" | "dark")}
            className="px-4 py-2 rounded-md bg-muted text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">关于设置</h2>
        <p className="text-muted-foreground">
          这是一个设置页面示例，展示了如何与 Tauri 后端交互以及管理应用配置。
          你可以添加更多设置选项来定制你的应用。
        </p>
      </div>
    </div>
  );
}
