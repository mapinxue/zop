import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function Home() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div className="page space-y-6">
      <h1 className="text-3xl font-bold text-foreground">首页</h1>
      <p className="text-muted-foreground text-lg">欢迎使用 Tauri 应用！</p>

      <div className="card bg-card rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Tauri 命令演示</h2>
        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            greet();
          }}
        >
          <input
            id="greet-input"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="输入你的名字..."
            className="flex-1 px-4 py-2 rounded-md bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            问候
          </button>
        </form>
        {greetMsg && (
          <p className="mt-4 text-lg text-primary font-medium animate-in fade-in duration-300">
            {greetMsg}
          </p>
        )}
      </div>
    </div>
  );
}
