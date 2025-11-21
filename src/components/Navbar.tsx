import { NavLink } from "react-router-dom";
import { Home, Info, Settings } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-card border-b border-border px-8 flex items-center justify-between h-14 shadow-sm">
      <div className="text-lg font-semibold text-foreground">Tauri App</div>
      <div className="flex items-center gap-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`
          }
        >
          <Home size={20} />
          <span>首页</span>
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`
          }
        >
          <Info size={20} />
          <span>关于</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`
          }
        >
          <Settings size={20} />
          <span>设置</span>
        </NavLink>
      </div>
    </nav>
  );
}
