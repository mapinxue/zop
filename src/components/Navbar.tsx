import { NavLink } from "react-router-dom";
import { Home, Info, Settings } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-brand">Tauri App</div>
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Home size={20} />
          <span>首页</span>
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Info size={20} />
          <span>关于</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Settings size={20} />
          <span>设置</span>
        </NavLink>
      </div>
    </nav>
  );
}
