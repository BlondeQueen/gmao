'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type User } from '@/lib/storage';
import { 
  Home, 
  Calendar, 
  BarChart3, 
  Package, 
  Settings, 
  Wrench, 
  AlertTriangle,
  User as UserIcon,
  Thermometer
} from 'lucide-react';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: Home },
  { name: 'Planning', href: '/planning', icon: Calendar },
  { name: 'Efficacité', href: '/efficacite', icon: Thermometer },
  { name: 'Analyse', href: '/analyse', icon: BarChart3 },
  { name: 'Stock', href: '/stock', icon: Package },
  { name: 'Équipements', href: '/equipment', icon: Settings },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Alertes', href: '/alerte', icon: AlertTriangle },
  { name: 'Profil', href: '/profil', icon: UserIcon },
];

interface NavigationProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

export default function Navigation({ currentUser, onLogout }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          {/* Logo et titre */}
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="Dangote Cement"
              className="h-8 w-12 mr-3"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">GMAO Dangote</h1>
              <p className="text-xs text-gray-600">Système de Maintenance</p>
            </div>
          </div>

          {/* Menu de navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Informations utilisateur */}
          <div className="flex items-center space-x-4">
            {currentUser && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-600 capitalize">{currentUser.role}</p>
              </div>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Déconnexion
              </button>
            )}
          </div>
        </div>

        {/* Menu mobile */}
        <div className="md:hidden pb-3">
          <div className="flex flex-wrap gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
