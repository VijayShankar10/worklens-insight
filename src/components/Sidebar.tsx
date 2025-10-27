import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Settings, LogOut, Activity } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/employees", label: "Employees", icon: Users },
    { path: "/reports", label: "Reports", icon: FileText },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("adminUser");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-black text-white shadow-2xl z-50 hidden lg:block">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="WorkLens Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold">WorkLens</h1>
              <p className="text-xs text-white/70">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-white/20 shadow-md"
                    : "hover:bg-white/10"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">
              A
            </div>
            <div>
              <p className="font-medium text-sm">Admin User</p>
              <p className="text-xs text-white/70">Administrator</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-3 text-white hover:bg-white/10"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
