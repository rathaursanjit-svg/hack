import React from 'react';
import { AlertTriangle, Store, Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';

interface RoleAccessRequiredProps {
  requiredRole: 'retailer' | 'supplier' | 'admin';
  title?: string;
  description?: string;
}

export const RoleAccessRequired: React.FC<RoleAccessRequiredProps> = ({
  requiredRole,
  title,
  description,
}) => {
  const { currentUser, demoUsers, switchUser } = useApp();

  const matchingUsers = demoUsers.filter(u => {
    if (requiredRole === 'retailer') return u.role === 'retailer';
    if (requiredRole === 'supplier') return u.role === 'supplier';
    if (requiredRole === 'admin') return u.role === 'admin';
    return false;
  });

  const getRoleIcon = () => {
    switch (requiredRole) {
      case 'retailer':
        return <Store className="w-8 h-8 text-indigo-600" />;
      case 'supplier':
        return <Building2 className="w-8 h-8 text-emerald-600" />;
      case 'admin':
        return <ShieldCheck className="w-8 h-8 text-purple-600" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-amber-600" />;
    }
  };

  const roleNameMap: Record<string, string> = {
    retailer: 'Retailer / Shopkeeper',
    supplier: 'Supplier / Distributor',
    admin: 'Platform Administrator',
  };

  const defaultTitle = title || `${roleNameMap[requiredRole] || requiredRole} Mode Required`;
  const defaultDesc = description || `You are currently browsing as "${currentUser?.name || 'Guest'}" (${currentUser?.role || 'Guest'}). Switch to one of the demo ${requiredRole} accounts below to view and manage this area.`;

  return (
    <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200/80 shadow-md p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
        {getRoleIcon()}
      </div>

      <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
        {defaultTitle}
      </h2>

      <p className="text-sm text-slate-600 leading-relaxed mb-6">
        {defaultDesc}
      </p>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Select a demo persona to switch instantly:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {matchingUsers.map(u => (
            <button
              key={u.id}
              onClick={() => switchUser(u)}
              className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="min-w-0 pr-2">
                <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 truncate">
                  {u.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {u.shop_name || u.supplier_name || u.email}
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
