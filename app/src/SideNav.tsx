
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  Boxes,
  ChartNoAxesCombined,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Store,
  Logs,
} from "lucide-react";

import { logoutUser } from "./api/userService";

const SideNav = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate()

  const navItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "" },
    { title: "Point of Sale", icon: ShoppingCart, path: "pos" },
    { title: "Products", icon: Package, path: "products" },
    { title: "Orders", icon: ClipboardList, path: "orders" },
    { title: "Inventory", icon: Boxes, path: "inventory" },
    { title: "Reports", icon: ChartNoAxesCombined, path: "reports" },
     { title: "Order Display", icon: Logs, path: "queue" }
  ];

  const handleLogout = async () => {
  try {
    await logoutUser();
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    localStorage.clear();

    navigate("/", { replace: true });
    window.location.reload()
  }
};

  return (
    <>
      {/* MOBILE MENU */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40
          h-screen bg-[#1A1A1A] text-white
          flex flex-col transition-all duration-300
          ${collapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* LOGO */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="min-w-10 h-10 rounded-xl flex items-center justify-center">
                              <img src="/logo.png" alt="" />

            </div>

            {!collapsed && (
              <div>
               
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block text-slate-400 hover:text-white"
          >
            <ChevronLeft
              size={18}
              className={collapsed ? "rotate-180" : ""}
            />
          </button>
        </div>

        {/* MENU ITEMS */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {!collapsed && (
            <p className="text-xs font-semibold text-slate-500 uppercase px-3 mb-4">
              Main Menu
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.title;

            return (
              <button
                key={item.title}
                onClick={() => {
                  setActiveMenu(item.title);
                  setMobileOpen(false);
                  navigate(item.path)
                }}
                title={collapsed ? item.title : ""}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-xl
                  transition-all
                  ${
                    isActive
                      ? "bg-teal-500 text-white"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}
              >
                <Icon size={21} />

                {!collapsed && (
                  <span className="text-sm font-medium">
                    {item.title}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* BOTTOM MENU */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <button
            onClick={() => {
              navigate("settings")
              setActiveMenu("Settings")
            }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl ${
              activeMenu === "Settings"
                ? "bg-teal-500 text-white"
                : "text-slate-400 hover:bg-white/10 hover:text-white"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <Settings size={21} />
            {!collapsed && <span className="text-sm">Settings</span>}
          </button>

          <button
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 ${
              collapsed ? "justify-center" : ""
            }`}
            onClick={()=> {
              handleLogout()
              window.location.reload()
            }}
          >
            <LogOut size={21} />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default SideNav;
