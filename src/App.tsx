import { BrowserRouter, Routes, Route } from "react-router-dom";
import Toolbar from "./components/Toolbar";
import AppSidebar from "./components/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Home from "./pages/Home";
import About from "./pages/About";
import Settings from "./pages/Settings";
import NewItem from "./pages/NewItem";
import TodoDetail from "./pages/TodoDetail";
import FlowDetail from "./pages/FlowDetail";
import "./App.css";
import '@xyflow/react/dist/style.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <SidebarInset>
            <Toolbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/new" element={<NewItem />} />
              <Route path="/todo/:id" element={<TodoDetail />} />
              <Route path="/flow/:id" element={<FlowDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </BrowserRouter>
  );
}

export default App;
