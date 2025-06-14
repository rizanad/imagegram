import {
  ArrowBigDown,
  Bell,
  Home,
  LogOut,
  Plus,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useUserAuth } from "../../context/userAuthContext";
import { useState } from "react";

const SideLinks = [
  { name: "Home", path: "/", icon: <Home className="h-5 w-5" /> },
  {
    name: "Create Posts",
    path: "/create-posts",
    icon: <Plus className="h-5 w-5" />,
  },
  { name: "Profile", path: "/profile", icon: <User className="h-5 w-5" /> },
  {
    name: "Notifications",
    path: "/notifications",
    icon: <Bell className="h-5 w-5" />,
  },
  {
    name: "Direct",
    path: "/direct",
    icon: <ArrowBigDown className="h-5 w-5" />,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

const Sidenav = () => {
  const { logOut } = useUserAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = async () => {
    try {
      await logOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <div
      className={`h-screen bg-gray-800 text-white flex flex-col ${
        isCollapsed ? "w-16" : "w-64"
      } transition-all duration-300 ease-in-out fixed`}
    >
      {/* Header with toggle button */}
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        {!isCollapsed && <h1 className="text-xl font-bold">PhotoGram</h1>}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-full hover:bg-gray-700"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto pt-4">
        {SideLinks.map((link) => (
          <NavLink
            to={link.path}
            key={link.name}
            className={({ isActive }) =>
              `flex items-center p-3 mx-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-white text-black"
                  : "hover:bg-gray-700 hover:text-white"
              }`
            }
          >
            <div className="flex items-center">
              <span className="flex-shrink-0">{link.icon}</span>
              {!isCollapsed && (
                <span className="ml-3 whitespace-nowrap">{link.name}</span>
              )}
            </div>
          </NavLink>
        ))}
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full p-2 rounded-lg hover:bg-gray-700 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">Log Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidenav;
