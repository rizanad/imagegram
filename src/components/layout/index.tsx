import { ReactNode } from "react";
import Sidenav from "../sidenav";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen overflow-hidden">
      {" "}
      {/* Added overflow-hidden */}
      <aside className="w-64 fixed h-full">
        {" "}
        {/* Made fixed and full height */}
        <Sidenav />
      </aside>
      <div className="bg-gray-500 flex-1 ml-64 overflow-y-auto">
        {" "}
        {/* Added ml-64 and overflow-y-auto */}
        <div className="flex flex-col items-center justify-center min-h-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
