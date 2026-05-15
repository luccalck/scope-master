import { Outlet } from "react-router";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function Layout() {
  useEffect(() => {
    const savedFont = localStorage.getItem("scopemaster_font_family") || "Inter";
    const savedSize = localStorage.getItem("scopemaster_font_size") || "16";
    
    document.documentElement.style.setProperty("--font-size", `${savedSize}px`);
    document.documentElement.style.fontFamily = savedFont === "Inter" 
      ? "Inter, sans-serif" 
      : savedFont === "Roboto" 
      ? "Roboto, sans-serif" 
      : savedFont === "Outfit"
      ? "Outfit, sans-serif"
      : "serif";
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
