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
import FlowExecute from "./pages/FlowExecute";
import "./App.css";
import '@xyflow/react/dist/style.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Full-screen execution page without sidebar/toolbar */}
        <Route path="/flow/:id/execute" element={
          <div className="app">
            <FlowExecute />
          </div>
        } />

        {/* Main app layout with sidebar and toolbar */}
        <Route path="/*" element={
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
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
