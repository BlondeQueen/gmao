'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  Filter,
  Clock,
  User,
  Settings
} from 'lucide-react';
import StorageManager, { type Equipment, type MaintenanceTask, type Breakdown, type Notification } from '@/lib/storage';

export default function AlertePage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const storageManager = StorageManager.getInstance();

  useEffect(() => {
    // Vérifier l'authentification
    const currentUser = storageManager.getCurrentUser();
    if (!currentUser) {
      router.push('/');
      return;
    }

    // Charger les données
    const notificationsData = storageManager.getNotifications();
    const equipmentsData = storageManager.getEquipments();
    const tasksData = storageManager.getMaintenanceTasks();
    const breakdownsData = storageManager.getBreakdowns();
    
    setNotifications(notificationsData);
    setEquipments(equipmentsData);
    setTasks(tasksData);
    setBreakdowns(breakdownsData);
    setLoading(false);
  }, [router, storageManager]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId 
        ? { ...notif, read: true }
        : notif
    ));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'maintenance_due':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'breakdown':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'low_stock':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'task_completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'system':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') {
      return 'border-l-4 border-red-500 bg-red-50';
    }
    if (priority === 'medium') {
      return 'border-l-4 border-yellow-500 bg-yellow-50';
    }
    return 'border-l-4 border-blue-500 bg-blue-50';
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Élevée';
      case 'medium': return 'Moyenne';
      case 'low': return 'Faible';
      default: return priority;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'maintenance_due': return 'Maintenance due';
      case 'breakdown': return 'Panne';
      case 'low_stock': return 'Stock faible';
      case 'task_completed': return 'Tâche terminée';
      case 'system': return 'Système';
      default: return type;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesType = filterType === 'all' || notif.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'read' && notif.read) ||
                         (filterStatus === 'unread' && !notif.read);
    return matchesType && matchesStatus;
  });

  const getAlertStatistics = () => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const high = notifications.filter(n => n.priority === 'high').length;
    const today = notifications.filter(n => {
      const notifDate = new Date(n.timestamp);
      const today = new Date();
      return notifDate.toDateString() === today.toDateString();
    }).length;
    
    return { total, unread, high, today };
  };

  const stats = getAlertStatistics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des alertes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Centre d'Alertes</h1>
                <p className="text-gray-600">Dangote Cement Cameroon</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Settings className="h-5 w-5" />
                <span>Paramètres</span>
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Retour au Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total alertes</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{stats.unread}</div>
                <div className="text-sm text-gray-600">Non lues</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{stats.high}</div>
                <div className="text-sm text-gray-600">Priorité élevée</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{stats.today}</div>
                <div className="text-sm text-gray-600">Aujourd'hui</div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre d'outils */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Filtre par type */}
              <select
                title="Filtrer par type"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Tous les types</option>
                <option value="maintenance_due">Maintenance due</option>
                <option value="breakdown">Panne</option>
                <option value="low_stock">Stock faible</option>
                <option value="task_completed">Tâche terminée</option>
                <option value="system">Système</option>
              </select>

              {/* Filtre par statut */}
              <select
                title="Filtrer par statut"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="unread">Non lues</option>
                <option value="read">Lues</option>
              </select>
            </div>

            {/* Actions rapides */}
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Marquer tout comme lu
              </button>
            </div>
          </div>
        </div>

        {/* Liste des alertes */}
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md ${
                getNotificationColor(notification.type, notification.priority)
              } ${!notification.read ? 'ring-2 ring-blue-200' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className={`text-lg font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="inline-flex w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                        notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {getPriorityText(notification.priority)}
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                        {getTypeText(notification.type)}
                      </span>
                    </div>
                    
                    <p className={`mb-3 ${!notification.read ? 'text-gray-700' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-700">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(notification.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="ml-6 flex space-x-2">
                  {!notification.read && (
                    <button
                      title="Marquer comme lu"
                      onClick={() => markAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-900 p-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    title="Supprimer l'alerte"
                    onClick={() => deleteNotification(notification.id)}
                    className="text-red-600 hover:text-red-900 p-2"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredNotifications.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Bell className="mx-auto h-12 w-12 text-gray-600" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune alerte trouvée</h3>
              <p className="mt-1 text-sm text-gray-700">
                Aucune alerte ne correspond aux filtres sélectionnés.
              </p>
            </div>
          )}
        </div>

        {/* Configuration des alertes */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration des Alertes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Types d'alertes activées</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-700">Maintenance due</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-700">Pannes d'équipements</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-700">Stock faible</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-700">Tâches terminées</span>
                </label>
              </div>
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Canaux de notification</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-700">Notifications dans l'application</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-700">Notifications par email</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-700">Notifications SMS</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
