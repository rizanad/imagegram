import { ReactNode } from "react";
import Sidenav from "../sidenav";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Sidebar */}
      <aside className="w-64 fixed h-full z-20">
        <Sidenav />
      </aside>
      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="flex flex-col items-center justify-center min-h-full p-6">
          <div className="w-full max-w-2xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
