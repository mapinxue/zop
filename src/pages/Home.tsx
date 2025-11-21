import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function Home() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div className="page">
      <h1>首页</h1>
      <p>欢迎使用 Tauri 应用！</p>

      <div className="card">
        <h2>Tauri 命令演示</h2>
        <form
          className="row"
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
          />
          <button type="submit">问候</button>
        </form>
        {greetMsg && <p className="greet-msg">{greetMsg}</p>}
      </div>
    </div>
  );
}
