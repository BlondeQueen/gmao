'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import StorageManager from '@/lib/storage';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'engineer' as 'engineer' | 'maintenance' | 'admin'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const storageManager = StorageManager.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Créer des comptes de démonstration s'ils n'existent pas
        const demoUsers = [
          { id: 'user-1', username: 'engineer', password: 'password123', role: 'engineer' as const, name: 'Jean Dupont', email: 'engineer@dangote.com' },
          { id: 'user-2', username: 'maintenance', password: 'password123', role: 'maintenance' as const, name: 'Marie Martin', email: 'maintenance@dangote.com' },
          { id: 'user-3', username: 'admin', password: 'password123', role: 'admin' as const, name: 'Paul Admin', email: 'admin@dangote.com' }
        ];

        // Vérifier les identifiants
        const user = demoUsers.find(u => u.username === formData.username && u.password === formData.password);
        
        if (user) {
          storageManager.setCurrentUser(user);
          router.push('/dashboard');
        } else {
          setError('Nom d\'utilisateur ou mot de passe incorrect');
        }
      } else {
        // Inscription
        if (!formData.username || !formData.password || !formData.name || !formData.email) {
          setError('Tous les champs sont requis');
          return;
        }

        const newUser = {
          id: `user-${Date.now()}`,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          name: formData.name,
          email: formData.email
        };

        storageManager.setCurrentUser(newUser);
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="bg-white p-4 rounded-full w-20 h-20 mx-auto mb-4 shadow-lg flex items-center justify-center">
            <Image
              src="/logo.png" 
              alt="Dangote Cement"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GMAO Dangote</h1>
          <p className="text-gray-600">Gestion de Maintenance Assistée par Ordinateur</p>
          <p className="text-sm text-gray-700 mt-1">Dangote Cement Cameroon</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex mb-6">
            <button
              className={`flex-1 py-2 px-4 text-center rounded-l-lg transition-colors ${
                isLogin 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => {
                setIsLogin(true);
                setError('');
                setFormData({ username: '', password: '', name: '', email: '', role: 'engineer' });
              }}
            >
              Connexion
            </button>
            <button
              className={`flex-1 py-2 px-4 text-center rounded-r-lg transition-colors ${
                !isLogin 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => {
                setIsLogin(false);
                setError('');
                setFormData({ username: '', password: '', name: '', email: '', role: 'engineer' });
              }}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    required
                    title="Nom complet"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    title="Email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rôle
                  </label>
                  <select
                    title="Rôle"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'engineer' | 'maintenance' | 'admin' })}
                  >
                    <option value="engineer">Ingénieur</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom d&apos;utilisateur
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-600" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder={isLogin ? "engineer, maintenance ou admin" : "Votre nom d'utilisateur"}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={isLogin ? "password123" : "Votre mot de passe"}
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
            </button>
          </form>

          {isLogin && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800 font-medium mb-2">Comptes de démonstration :</p>
              <div className="text-xs text-blue-700 space-y-1">
                <div>• <span className="font-mono">engineer</span> / <span className="font-mono">password123</span></div>
                <div>• <span className="font-mono">maintenance</span> / <span className="font-mono">password123</span></div>
                <div>• <span className="font-mono">admin</span> / <span className="font-mono">password123</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-700">
          <p>© 2025 Dangote Cement Cameroon</p>
          <p>Système de Gestion de Maintenance</p>
        </div>
      </div>
    </div>
  );
}
