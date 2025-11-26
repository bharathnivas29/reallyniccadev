import React from "react";
import {
  LayoutGrid,
  Plus,
  Settings,
  HelpCircle,
  User,
  Menu,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  return (
    <div className="flex h-screen w-full bg-[var(--bg-app)] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`
          flex flex-col border-r border-[var(--border)] bg-[var(--bg-panel)] transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "w-64" : "w-16"}
        `}
      >
        {/* Logo Area */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--border)]">
          {isSidebarOpen ? (
            <span className="text-lg font-bold text-[var(--text-main)] tracking-tight">
              Really Nicca
            </span>
          ) : (
            <span className="text-lg font-bold text-[var(--primary)]">RN</span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 rounded-md hover:bg-[var(--bg-app)] text-[var(--text-muted)]"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          <NavItem
            icon={<Plus size={20} />}
            label="New Graph"
            isOpen={isSidebarOpen}
            isActive
          />
          <NavItem
            icon={<LayoutGrid size={20} />}
            label="My Library"
            isOpen={isSidebarOpen}
          />
        </nav>

        {/* Footer Actions */}
        <div className="p-2 border-t border-[var(--border)] space-y-1">
          <NavItem
            icon={<Settings size={20} />}
            label="Settings"
            isOpen={isSidebarOpen}
          />
          <NavItem
            icon={<HelpCircle size={20} />}
            label="Help"
            isOpen={isSidebarOpen}
          />

          <div
            className={`flex items-center p-2 mt-4 rounded-md ${
              isSidebarOpen ? "bg-[var(--bg-app)]" : ""
            }`}
          >
            <div className="h-8 w-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
              <User size={16} />
            </div>
            {isSidebarOpen && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-[var(--text-main)] truncate">
                  User
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  Free Plan
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  isOpen,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center w-full p-2 rounded-md transition-colors
        ${
          isActive
            ? "bg-[var(--primary-light)] text-[var(--primary)]"
            : "text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]"
        }
        ${!isOpen ? "justify-center" : ""}
      `}
      title={!isOpen ? label : undefined}
    >
      {icon}
      {isOpen && <span className="ml-3 text-sm font-medium">{label}</span>}
    </button>
  );
};
