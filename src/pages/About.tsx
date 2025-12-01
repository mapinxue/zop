import reactLogo from "../assets/react.svg";

export default function About() {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-background">
      <h1 className="text-2xl font-bold text-foreground">关于</h1>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">技术栈</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <img src="/tauri.svg" alt="Tauri" className="w-16 h-16 mx-auto mb-2" />
            <h3 className="font-medium text-foreground">Tauri</h3>
            <p className="text-sm text-muted-foreground">使用 Rust 构建的桌面应用框架</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <img src={reactLogo} alt="React" className="w-16 h-16 mx-auto mb-2" />
            <h3 className="font-medium text-foreground">React</h3>
            <p className="text-sm text-muted-foreground">用于构建用户界面的 JavaScript 库</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <img src="/vite.svg" alt="Vite" className="w-16 h-16 mx-auto mb-2" />
            <h3 className="font-medium text-foreground">Vite</h3>
            <p className="text-sm text-muted-foreground">下一代前端构建工具</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">项目信息</h2>
        <ul className="space-y-2">
          <li className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">版本</span>
            <span className="text-foreground font-medium">0.1.0</span>
          </li>
          <li className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">类型</span>
            <span className="text-foreground font-medium">桌面应用</span>
          </li>
          <li className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">前端</span>
            <span className="text-foreground font-medium">React + TypeScript</span>
          </li>
          <li className="flex justify-between py-2">
            <span className="text-muted-foreground">后端</span>
            <span className="text-foreground font-medium">Rust + Tauri</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
