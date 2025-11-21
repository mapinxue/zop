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
    <div className="page">
      <h1>设置</h1>

      <div className="card">
        <h2>窗口设置</h2>
        <div className="setting-item">
          <div>
            <h3>窗口置顶</h3>
            <p>让窗口始终显示在其他窗口上方</p>
          </div>
          <button
            className={`toggle-button ${isAlwaysOnTop ? 'active' : ''}`}
            onClick={toggleAlwaysOnTop}
          >
            {isAlwaysOnTop ? '已开启' : '已关闭'}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>外观设置</h2>
        <div className="setting-item">
          <div>
            <h3>主题</h3>
            <p>选择应用的显示主题</p>
          </div>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as "light" | "dark")}
            className="theme-select"
          >
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h2>关于设置</h2>
        <p className="info-text">
          这是一个设置页面示例，展示了如何与 Tauri 后端交互以及管理应用配置。
          你可以添加更多设置选项来定制你的应用。
        </p>
      </div>
    </div>
  );
}
