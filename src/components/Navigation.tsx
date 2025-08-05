'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  Thermometer,
  Menu,
  X,
  LogOut
} from 'lucide-react';

const navigation = [
  { name: 'Tableau de Bord', href: '/dashboard', icon: Home },
  { name: 'Équipements', href: '/equipment', icon: Settings },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Planning', href: '/planning', icon: Calendar },
  { name: 'Analyses', href: '/analyse', icon: BarChart3 },
  { name: 'Efficacité', href: '/efficacite', icon: Thermometer },
  { name: 'Stock', href: '/stock', icon: Package },
  { name: 'Alertes', href: '/alerte', icon: AlertTriangle },
  { name: 'Profil', href: '/profil', icon: UserIcon },
];

interface NavigationProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

export default function Navigation({ currentUser, onLogout }: NavigationProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto shadow-sm">
          {/* Logo et titre */}
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <img
              src="/logo.png"
              alt="Dangote Cement"
              className="h-10 w-16 mr-3"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">GMAO Dangote</h1>
              <p className="text-sm text-gray-600">
                {currentUser?.name ? 'Dangote Cement' : 'Système de Maintenance'}
              </p>
              <p className="text-xs text-gray-500">
                Cameroun - Douala
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Informations utilisateur */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser?.name || 'Utilisateur'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {currentUser?.role || 'Opérateur'}
                  </p>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-gray-100"
                    title="Déconnexion"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Mobile */}
      <div className="lg:hidden">
        {/* Header mobile */}
        <div className="relative z-40 flex h-16 flex-shrink-0 items-center bg-white border-b border-gray-200 px-4 shadow-sm">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setIsMenuOpen(true)}
          >
            <span className="sr-only">Ouvrir la sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1">
              <div className="flex items-center">
                <img
                  src="/logo.png"
                  alt="Dangote Cement"
                  className="h-8 w-12 mr-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <h1 className="text-lg font-semibold text-gray-900">GMAO Dangote</h1>
              </div>
            </div>
            <div className="flex items-center">
              {currentUser && (
                <div className="flex items-center">
                  <div className="text-right mr-2">
                    <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                  </div>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-100"
                      title="Déconnexion"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overlay mobile */}
        {isMenuOpen && (
          <div className="relative z-50">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMenuOpen(false)} />
            <div className="fixed inset-0 flex">
              <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="sr-only">Fermer la sidebar</span>
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
                <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
                  <div className="flex flex-shrink-0 items-center px-4 mb-8">
                    <img
                      src="/logo.png"
                      alt="Dangote Cement"
                      className="h-8 w-12 mr-2"
                    />
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900">GMAO Dangote</h1>
                      <p className="text-sm text-gray-600">Dangote Cement</p>
                    </div>
                  </div>
                  <nav className="space-y-1 px-2">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`group flex items-center px-3 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <Icon className={`mr-4 h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                          {item.name}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
                {/* User info in mobile */}
                {currentUser && (
                  <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                    <div className="flex items-center w-full">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="w-14 flex-shrink-0">
                {/* Espace de fermeture forcée */}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
