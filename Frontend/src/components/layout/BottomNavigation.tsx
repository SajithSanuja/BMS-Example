import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarLink } from '@/types';
import { Package, DollarSign, Settings } from 'lucide-react';

const BottomNavigation: React.FC = () => {
  const { user, checkAccess } = useAuth();
  const location = useLocation();
  
  const sidebarLinks: SidebarLink[] = [
    {
      title: 'Inventory',
      path: '/inventory',
      icon: <Package size={20} />,
      roles: ['manager', 'employee']
    },
    {
      title: 'Sales',
      path: '/sales',
      icon: <DollarSign size={20} />,
      roles: ['manager', 'employee']
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: <Settings size={20} />,
      roles: ['manager', 'employee']
    }
  ];
  
  // Filter links based on user role
  const filteredLinks = sidebarLinks.filter(link => 
    user && checkAccess(link.roles)
  );

  // Limit to 5 most important items for mobile
  const mobileLinks = filteredLinks.slice(0, 5);
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <nav className="flex justify-around items-center py-2 px-2 max-w-md mx-auto">
        {mobileLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1",
              "hover:bg-accent active:bg-accent/80",
              isActive || location.pathname.startsWith(link.path + '/') ? 
                "text-primary bg-primary/10" : 
                "text-muted-foreground"
            )}
          >
            <span className="mb-1 transition-transform duration-200 hover:scale-110">
              {link.icon}
            </span>
            <span className="text-xs font-medium truncate max-w-[60px] leading-tight">
              {link.title}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default BottomNavigation; 