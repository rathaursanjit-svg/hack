import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Store, 
  ShoppingCart, 
  Package, 
  LayoutDashboard, 
  Boxes, 
  FileText, 
  Calculator, 
  Receipt, 
  DollarSign, 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const { currentUser, demoUsers, switchUser, cart } = useApp();
  const location = useLocation();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const roleBadgeColors: Record<string, string> = {
    consumer: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    retailer: 'bg-blue-100 text-blue-800 border-blue-300',
    supplier: 'bg-purple-100 text-purple-800 border-purple-300',
    admin: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  const navLinks = [
    // Consumer Links
    { path: '/', label: 'Marketplace', icon: Store, roles: ['consumer', 'admin'] },
    { path: '/my-orders', label: 'My Orders', icon: Package, roles: ['consumer'] },
    
    // Retailer Links
    { path: '/retailer', label: 'Dashboard', icon: LayoutDashboard, roles: ['retailer'] },
    { path: '/retailer/inventory', label: 'Inventory & Stock', icon: Boxes, roles: ['retailer'] },
    { path: '/retailer/purchases', label: 'Inward Purchases', icon: Receipt, roles: ['retailer'] },
    { path: '/retailer/orders', label: 'Store Orders', icon: Package, roles: ['retailer'] },
    { path: '/retailer/gst', label: 'GST Summary', icon: Calculator, roles: ['retailer'] },
    { path: '/retailer/expenses', label: 'Expenses', icon: DollarSign, roles: ['retailer'] },
    { path: '/retailer/pnl', label: 'Profit & Loss', icon: FileText, roles: ['retailer'] },

    // Supplier Links
    { path: '/supplier', label: 'Supplier Portal', icon: Building2, roles: ['supplier'] },

    // Admin Links
    { path: '/admin', label: 'Admin Hub', icon: ShieldCheck, roles: ['admin'] },
  ];

  const currentRole = currentUser?.role || 'consumer';
  const visibleLinks = navLinks.filter(l => l.roles.includes(currentRole));

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-md group-hover:bg-emerald-400 transition-colors">
                ₹
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                  Smart Retail <span className="text-emerald-400 font-medium">India</span>
                </span>
                <span className="text-[10px] block text-slate-400 tracking-wider font-semibold -mt-1 uppercase">
                  GST-Aware Retail Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {visibleLinks.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold tracking-wide transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Side: Role Switcher & Cart */}
          <div className="flex items-center gap-3">
            {/* Consumer Cart Button */}
            {currentRole === 'consumer' && (
              <Link
                to="/cart"
                className="relative flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="bg-slate-900 text-emerald-400 text-[10px] font-black rounded-full px-1.5 py-0.2 border border-emerald-400">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 transition"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold leading-none">
                    Role: {currentRole}
                  </div>
                  <div className="text-xs font-semibold text-white truncate max-w-[120px]">
                    {currentUser?.name || 'Switch Role'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Role Dropdown Menu */}
              {roleMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setRoleMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Demo Role Switcher
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Switch personas to test role-based access & views
                    </p>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {demoUsers.map(user => {
                      const isSelected = user.id === currentUser?.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            switchUser(user);
                            setRoleMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition ${
                            isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-500' : ''
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              {user.name}
                              {isSelected && <span className="text-emerald-600 font-normal text-[10px]">● Active</span>}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {user.shop_name || user.supplier_name || user.email}
                            </div>
                          </div>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                              roleBadgeColors[user.role] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {user.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-800 border-t border-slate-700 px-4 pt-2 pb-4 space-y-1">
          {visibleLinks.map(link => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
