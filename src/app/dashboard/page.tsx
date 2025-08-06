'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import StorageManager, { type User, type Equipment, type Breakdown, type MaintenanceTask } from '@/lib/storage';
import PerformanceCalculator, { type PerformanceMetrics, type EquipmentMetrics } from '@/lib/calculations';
import NotificationManager from '@/lib/notifications';
import Navigation from '@/components/Navigation';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [globalMetrics, setGlobalMetrics] = useState<PerformanceMetrics | null>(null);
  const [equipmentMetrics, setEquipmentMetrics] = useState<EquipmentMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const storageManager = StorageManager.getInstance();
  const notificationManager = NotificationManager.getInstance();

  const loadData = useCallback(() => {
    try {
      const equipmentsData = storageManager.getEquipments();
      const breakdownsData = storageManager.getBreakdowns();
      const tasksData = storageManager.getMaintenanceTasks();

      setEquipments(equipmentsData);
      setBreakdowns(breakdownsData);
      setMaintenanceTasks(tasksData);

      // Calculer les métriques pour les 30 derniers jours
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const globalMetricsData = PerformanceCalculator.calculateGlobalMetrics(
        equipmentsData,
        breakdownsData,
        tasksData,
        startDate,
        endDate
      );

      const equipmentMetricsData = equipmentsData.map(equipment =>
        PerformanceCalculator.calculateEquipmentMetrics(
          equipment,
          breakdownsData,
          tasksData,
          startDate,
          endDate
        )
      );

      setGlobalMetrics(globalMetricsData);
      setEquipmentMetrics(equipmentMetricsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  }, [storageManager]);

  useEffect(() => {
    // Vérifier l'authentification
    const currentUser = storageManager.getCurrentUser();
    if (!currentUser) {
      router.push('/');
      return;
    }

    setUser(currentUser);
    loadData();
    
    // Démarrer les vérifications automatiques de notifications
    notificationManager.startAutoChecks();
  }, [router, storageManager, notificationManager, loadData]);

  useEffect(() => {
    // Vérifier l'authentification
    const currentUser = storageManager.getCurrentUser();
    if (!currentUser) {
      router.push('/');
      return;
    }

    setUser(currentUser);
    loadData();
    
    // Démarrer les vérifications automatiques de notifications
    notificationManager.startAutoChecks();
  }, [router, storageManager, notificationManager, loadData]);

  const handleLogout = () => {
    storageManager.logout();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'breakdown':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Opérationnel';
      case 'maintenance':
        return 'En maintenance';
      case 'breakdown':
        return 'En panne';
      case 'offline':
        return 'Hors ligne';
      default:
        return 'Inconnu';
    }
  };

  const getEquipmentTypeText = (type: string) => {
    switch (type) {
      case 'heat_exchanger':
        return 'Échangeur thermique';
      case 'cooling_tower':
        return 'Tour de refroidissement';
      case 'water_pump':
        return 'Pompe à eau';
      case 'oil_pump':
        return 'Pompe à huile';
      case 'water_prefilter':
        return 'Pré-filtre à eau';
      case 'water_filter':
        return 'Filtre à eau';
      case 'oil_filter':
        return 'Filtre à huile';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentUser={user} onLogout={handleLogout} />

      {/* Contenu principal avec padding pour sidebar */}
      <div className="lg:pl-64">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Métriques globales */}
        {globalMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">MTBF Moyenne</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(globalMetrics.mtbf)}h</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">MTTR Moyenne</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(globalMetrics.mttr * 10) / 10}h</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Disponibilité</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(globalMetrics.availability * 10) / 10}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Interventions</p>
                  <p className="text-2xl font-bold text-gray-900">{globalMetrics.interventionCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Liste des équipements */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">État des Équipements</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {equipments.map((equipment) => (
                  <div key={equipment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{equipment.name}</h3>
                      <p className="text-sm text-gray-600">{getEquipmentTypeText(equipment.type)}</p>
                      <p className="text-xs text-gray-700">{equipment.location}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(equipment.status)}`}>
                        {getStatusText(equipment.status)}
                      </span>
                      {equipmentMetrics.find(m => m.equipmentId === equipment.id) && (
                        <div className="text-right">
                          <p className="text-xs text-gray-700">
                            Disponibilité: {Math.round((equipmentMetrics.find(m => m.equipmentId === equipment.id)?.availability || 0) * 10) / 10}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tâches de maintenance récentes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Maintenance Récente</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {maintenanceTasks.slice(0, 5).map((task) => {
                  const equipment = equipments.find(e => e.id === task.equipmentId);
                  return (
                    <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        <p className="text-sm text-gray-600">{equipment?.name}</p>
                        <p className="text-xs text-gray-700">
                          {task.type === 'preventive' ? 'Préventive' : 'Corrective'} • 
                          Prévue: {new Date(task.scheduledDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status === 'completed' ? 'Terminée' :
                           task.status === 'in_progress' ? 'En cours' :
                           task.status === 'scheduled' ? 'Planifiée' : 'Annulée'}
                        </span>
                        <p className="text-xs text-gray-700 mt-1">
                          Priorité: {task.priority === 'urgent' ? 'Urgente' :
                                   task.priority === 'high' ? 'Haute' :
                                   task.priority === 'medium' ? 'Moyenne' : 'Faible'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides - 7 Pages Client */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Modules GMAO</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/equipment')}
              className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              <div className="flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
                </svg>
              </div>
              <p className="font-medium">Équipements</p>
            </button>

            <button
              onClick={() => router.push('/maintenance')}
              className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-center"
            >
              <div className="flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <p className="font-medium">Maintenance</p>
            </button>

            <button
              onClick={() => router.push('/planning')}
              className="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 transition-colors text-center"
            >
              <div className="flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-medium">Planning</p>
            </button>

            <button
              onClick={() => router.push('/analyse')}
              className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-center"
            >
              <div className="flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="font-medium">Analyse</p>
            </button>

            <button
              onClick={() => router.push('/efficacite')}
              className="bg-teal-600 text-white p-4 rounded-lg hover:bg-teal-700 transition-colors text-center"
            >
              <div className="flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="font-medium">Efficacité</p>
            </button>

            <button
              onClick={() => router.push('/stock')}
              className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors text-center"
            >
              <div className="flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="font-medium">Stock</p>
            </button>

            <button
              onClick={() => router.push('/alerte')}
              className="bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 transition-colors text-center"
            >
              <div className="flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="font-medium">Alertes</p>
            </button>

            <button
              onClick={() => router.push('/profil')}
              className="bg-gray-600 text-white p-4 rounded-lg hover:bg-gray-700 transition-colors text-center"
            >
              <div className="flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="font-medium">Profil</p>
            </button>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
