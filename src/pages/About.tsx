import reactLogo from "../assets/react.svg";

export default function About() {
  return (
    <div className="page">
      <h1>关于</h1>

      <div className="card">
        <h2>技术栈</h2>
        <div className="tech-stack">
          <div className="tech-item">
            <img src="/tauri.svg" alt="Tauri" className="tech-logo" />
            <h3>Tauri</h3>
            <p>使用 Rust 构建的桌面应用框架</p>
          </div>
          <div className="tech-item">
            <img src={reactLogo} alt="React" className="tech-logo" />
            <h3>React</h3>
            <p>用于构建用户界面的 JavaScript 库</p>
          </div>
          <div className="tech-item">
            <img src="/vite.svg" alt="Vite" className="tech-logo" />
            <h3>Vite</h3>
            <p>下一代前端构建工具</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>项目信息</h2>
        <ul className="info-list">
          <li><strong>版本:</strong> 0.1.0</li>
          <li><strong>类型:</strong> 桌面应用</li>
          <li><strong>前端:</strong> React + TypeScript</li>
          <li><strong>后端:</strong> Rust + Tauri</li>
        </ul>
      </div>
    </div>
  );
}
