
import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  FileText,
  Home,
  LogOut,
  MessageCircle,
  Menu,
  X,
  Upload,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    toast.success("Successfully logged out");
    // In a real app, we would also clear auth tokens here
    window.location.href = "/";
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: "Prescriptions",
      path: "/prescriptions",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Upload",
      path: "/upload",
      icon: <Upload className="h-5 w-5" />,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      name: "AI Assistant",
      path: "/assistant",
      icon: <MessageCircle className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "bg-white border-r border-border transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo area */}
        <div className="h-16 border-b border-border flex items-center px-4">
          {isSidebarOpen ? (
            <div className="text-xl font-semibold text-primary">MediSafe AI</div>
          ) : (
            <div className="text-xl font-semibold text-primary">MS</div>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 py-4 px-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-3 py-2 mb-1 rounded-md transition-colors",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-foreground"
              )}
            >
              {item.icon}
              {isSidebarOpen && <span className="ml-3">{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && <span className="ml-2">Log Out</span>}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          <div className="flex items-center space-x-4">
            <Button size="sm" variant="outline">
              <AlertCircle className="h-4 w-4 mr-1 text-alert" />
              <span>Report Issue</span>
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              DS
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
