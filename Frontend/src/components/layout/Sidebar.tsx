
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarLink } from '@/types';
import { ChevronLeft, ChevronRight, ShoppingCart, Package, Factory, DollarSign, Users, Menu, TrendingUp, Settings } from 'lucide-react';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

// Store the sidebar state in localStorage for persistence
const STORAGE_KEY = 'sidebar_collapsed';

const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed: externalCollapsed, 
  onToggleCollapse 
}) => {
  // Initialize with localStorage value or default to false
  const storedCollapsed = localStorage.getItem(STORAGE_KEY) === 'true';
  const [collapsed, setCollapsed] = useState(externalCollapsed !== undefined ? externalCollapsed : storedCollapsed);
  const { user, checkAccess } = useAuth();
  const location = useLocation();
  
  // Determine active module from URL path
  const getActiveModule = (path: string) => {
    if (path === '/') return 'dashboard';
    return path.split('/')[1]; // Gets 'procurement', 'inventory', etc.
  };
  
  // Sync with external collapsed state if provided
  useEffect(() => {
    if (externalCollapsed !== undefined && externalCollapsed !== collapsed) {
      setCollapsed(externalCollapsed);
      localStorage.setItem(STORAGE_KEY, externalCollapsed.toString());
    }
  }, [externalCollapsed]);

  const handleToggleCollapse = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    // Save to localStorage for persistence
    localStorage.setItem(STORAGE_KEY, newCollapsedState.toString());
    if (onToggleCollapse) {
      onToggleCollapse(newCollapsedState);
    }
  };
  
  const sidebarLinks: SidebarLink[] = [
    {
      title: 'Procurement',
      path: '/procurement',
      icon: <ShoppingCart size={22} />,
      roles: ['manager', 'employee']
    },
    {
      title: 'Inventory',
      path: '/inventory',
      icon: <Package size={22} />,
      roles: ['manager', 'employee']
    },
    {
      title: 'Manufacturing',
      path: '/manufacturing',
      icon: <Factory size={22} />,
      roles: ['manager']
    },
    {
      title: 'Sales',
      path: '/sales',
      icon: <DollarSign size={22} />,
      roles: ['manager', 'employee']
    },
    {
      title: 'Financials',
      path: '/financials',
      icon: <TrendingUp size={22} />,
      roles: ['manager']
    },
    {
      title: 'User Management',
      path: '/users',
      icon: <Users size={22} />,
      roles: ['manager']
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: <Settings size={22} />,
      roles: ['manager', 'employee']
    }
  ];
  
  // Filter links based on user role
  const filteredLinks = sidebarLinks.filter(link => 
    user && checkAccess(link.roles)
  );
  
  return (
    <div 
      className={cn(
        "h-screen bg-sidebar fixed top-0 left-0 z-40 transition-all duration-300 ease-in-out border-r border-sidebar-border shadow-sm",
        "hidden md:block", // Hide on mobile, show on desktop
        collapsed ? "w-[70px]" : "w-[250px]"
      )}
    >
      {/* Mobile sidebar toggle */}
      <div className="absolute right-4 top-4 block md:hidden">
        <button 
          onClick={handleToggleCollapse}
          className="p-2 rounded-md hover:bg-sidebar-accent"
        >
          <Menu size={20} />
        </button>
      </div>
      
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <span className="text-xl font-semibold tracking-tight animate-fade-in">MDVD</span>
        )}
        
        {/* Collapse button */}
        <button 
          onClick={handleToggleCollapse}
          className={cn(
            "p-1.5 rounded-md hover:bg-sidebar-accent transition-all duration-300 ease-in-out",
            collapsed ? "rotate-180" : ""
          )}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      {/* Navigation Links */}
      <nav className="py-4 px-2">
        <ul className="space-y-1">
          {filteredLinks.map((link, index) => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
                  "hover:bg-sidebar-accent group",
                  isActive || location.pathname.startsWith(link.path + '/') ? 
                    "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : 
                    "text-sidebar-foreground",
                  collapsed ? "justify-center" : ""
                )}
              >
                <span className="transition-transform duration-300 group-hover:scale-110">
                  {link.icon}
                </span>
                
                {!collapsed && (
                  <span className="animate-fade-in">{link.title}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
