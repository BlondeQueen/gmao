'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { 
  Bell, 
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  Filter,
  Clock,
  User as UserIcon,
  Settings,
  Plus,
  XCircle
} from 'lucide-react';
import StorageManager, { type Equipment, type MaintenanceTask, type Breakdown, type Notification, type User } from '@/lib/storage';

export default function AlertePage() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'system' as Notification['type'],
    title: '',
    message: '',
    priority: 'medium' as Notification['priority'],
    relatedId: '',
    relatedType: 'system' as Notification['relatedType'],
    actionRequired: false
  });

  const router = useRouter();
  const storageManager = StorageManager.getInstance();

  const handleLogout = () => {
    storageManager.logout();
    router.push('/');
  };

  useEffect(() => {
    // Vérifier l'authentification
    const currentUser = storageManager.getCurrentUser();
    if (!currentUser) {
      router.push('/');
      return;
    }
    
    setUser(currentUser);

    // Charger les données
    const notificationsData = storageManager.getNotifications();
    const equipmentsData = storageManager.getEquipments();
    const tasksData = storageManager.getMaintenanceTasks();
    const breakdownsData = storageManager.getBreakdowns();
    
    // Générer les alertes automatiques
    const generatedAlerts = generateAutomaticAlerts(equipmentsData, tasksData);
    const allNotifications = [...notificationsData, ...generatedAlerts];
    
    setNotifications(allNotifications);
    setEquipments(equipmentsData);
    setTasks(tasksData);
    setBreakdowns(breakdownsData);
    setLoading(false);
  }, [router, storageManager]);

  // Fonction pour générer les alertes automatiques
  const generateAutomaticAlerts = (equipments: Equipment[], tasks: MaintenanceTask[]): Notification[] => {
    const alerts: Notification[] = [];
    const now = new Date();

    // Alertes de maintenance due
    tasks.forEach(task => {
      const taskDate = new Date(task.scheduledDate);
      const daysUntilMaintenance = Math.ceil((taskDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilMaintenance <= 7 && daysUntilMaintenance >= 0 && task.status === 'scheduled') {
        alerts.push({
          id: `maint-${task.id}`,
          type: 'maintenance_due',
          title: `Maintenance programmée - ${task.title}`,
          message: `La maintenance "${task.title}" est prévue dans ${daysUntilMaintenance} jour(s). Équipement concerné: ${getEquipmentName(task.equipmentId)}.`,
          timestamp: now.toISOString(),
          read: false,
          priority: daysUntilMaintenance <= 2 ? 'high' : daysUntilMaintenance <= 5 ? 'medium' : 'low',
          relatedId: task.id,
          relatedType: 'task',
          actionRequired: true
        });
      }

      // Alertes de tâches en retard
      if (daysUntilMaintenance < 0 && task.status === 'scheduled') {
        alerts.push({
          id: `overdue-${task.id}`,
          type: 'task_overdue',
          title: `Maintenance en retard - ${task.title}`,
          message: `La maintenance "${task.title}" était prévue il y a ${Math.abs(daysUntilMaintenance)} jour(s) et n'a pas encore été effectuée.`,
          timestamp: now.toISOString(),
          read: false,
          priority: 'urgent',
          relatedId: task.id,
          relatedType: 'task',
          actionRequired: true
        });
      }
    });

    // Alertes d'équipements en panne
    equipments.forEach(equipment => {
      if (equipment.status === 'breakdown') {
        alerts.push({
          id: `breakdown-${equipment.id}`,
          type: 'breakdown_alert',
          title: `Panne détectée - ${equipment.name}`,
          message: `L'équipement "${equipment.name}" (${equipment.type}) est actuellement en panne et nécessite une intervention immédiate.`,
          timestamp: now.toISOString(),
          read: false,
          priority: 'urgent',
          relatedId: equipment.id,
          relatedType: 'equipment',
          actionRequired: true
        });
      }

      // Alertes d'équipements en maintenance depuis trop longtemps
      if (equipment.status === 'maintenance') {
        const nextMaintenanceDate = new Date(equipment.nextMaintenanceDate);
        const daysSinceMaintenance = Math.ceil((now.getTime() - nextMaintenanceDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceMaintenance > 30) {
          alerts.push({
            id: `long-maint-${equipment.id}`,
            type: 'maintenance_due',
            title: `Maintenance prolongée - ${equipment.name}`,
            message: `L'équipement "${equipment.name}" est en maintenance depuis plus de 30 jours. Vérification recommandée.`,
            timestamp: now.toISOString(),
            read: false,
            priority: 'medium',
            relatedId: equipment.id,
            relatedType: 'equipment',
            actionRequired: true
          });
        }
      }
    });

    return alerts;
  };

  const getEquipmentName = (equipmentId: string) => {
    const equipment = equipments.find(e => e.id === equipmentId);
    return equipment ? equipment.name : 'Équipement inconnu';
  };

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

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const deleteAllRead = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer toutes les alertes lues ?')) {
      setNotifications(prev => prev.filter(notif => !notif.read));
    }
  };

  const handleCreateAlert = () => {
    setFormData({
      type: 'system',
      title: '',
      message: '',
      priority: 'medium',
      relatedId: '',
      relatedType: 'system',
      actionRequired: false
    });
    setShowModal(true);
  };

  const handleSaveAlert = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newAlert: Notification = {
      id: `manual-${Date.now()}`,
      type: formData.type,
      title: formData.title,
      message: formData.message,
      timestamp: new Date().toISOString(),
      read: false,
      priority: formData.priority,
      relatedId: formData.relatedId || undefined,
      relatedType: formData.relatedType,
      actionRequired: formData.actionRequired
    };

    setNotifications(prev => [newAlert, ...prev]);
    setShowModal(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'maintenance_due':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'breakdown_alert':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'low_stock':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'task_completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'task_overdue':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'sensor_alert':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'system':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') {
      return 'border-l-4 border-red-600 bg-red-50';
    }
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
      case 'urgent': return 'Urgente';
      case 'high': return 'Élevée';
      case 'medium': return 'Moyenne';
      case 'low': return 'Faible';
      default: return priority;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'maintenance_due': return 'Maintenance due';
      case 'breakdown_alert': return 'Panne';
      case 'low_stock': return 'Stock faible';
      case 'task_completed': return 'Tâche terminée';
      case 'task_overdue': return 'Tâche en retard';
      case 'sensor_alert': return 'Alerte capteur';
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
    const urgent = notifications.filter(n => n.priority === 'urgent').length;
    const actionRequired = notifications.filter(n => n.actionRequired && !n.read).length;
    
    return { total, unread, urgent, actionRequired };
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
      <Navigation currentUser={user} onLogout={handleLogout} />
      <div className="lg:pl-64">
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
                <div className="text-2xl font-bold text-gray-900">{stats.urgent}</div>
                <div className="text-sm text-gray-600">Urgentes</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{stats.actionRequired}</div>
                <div className="text-sm text-gray-600">Action requise</div>
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Tous les types</option>
                <option value="maintenance_due">Maintenance due</option>
                <option value="breakdown_alert">Panne</option>
                <option value="task_overdue">Tâche en retard</option>
                <option value="low_stock">Stock faible</option>
                <option value="task_completed">Tâche terminée</option>
                <option value="sensor_alert">Alerte capteur</option>
                <option value="system">Système</option>
              </select>

              {/* Filtre par statut */}
              <select
                title="Filtrer par statut"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
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
                onClick={handleCreateAlert}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nouvelle Alerte</span>
              </button>
              <button 
                onClick={markAllAsRead}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Marquer tout comme lu
              </button>
              <button 
                onClick={deleteAllRead}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Supprimer les lues
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
                        notification.priority === 'urgent' ? 'bg-red-200 text-red-900' :
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

      {/* Modal pour créer une alerte manuelle */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-black">
                Créer une nouvelle alerte
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveAlert} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Type d'alerte *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as Notification['type']})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                    required
                  >
                    <option value="system">Système</option>
                    <option value="maintenance_due">Maintenance due</option>
                    <option value="breakdown_alert">Panne</option>
                    <option value="low_stock">Stock faible</option>
                    <option value="task_overdue">Tâche en retard</option>
                    <option value="sensor_alert">Alerte capteur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Priorité *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as Notification['priority']})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                    required
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Élevée</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black mb-1">
                    Titre de l'alerte *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                    placeholder="Titre descriptif de l'alerte"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black mb-1">
                    Message détaillé *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                    rows={4}
                    placeholder="Description détaillée de l'alerte..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Type d'élément associé
                  </label>
                  <select
                    value={formData.relatedType}
                    onChange={(e) => setFormData({...formData, relatedType: e.target.value as Notification['relatedType']})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                  >
                    <option value="system">Système</option>
                    <option value="equipment">Équipement</option>
                    <option value="task">Tâche</option>
                    <option value="stock">Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    ID de l'élément (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.relatedId}
                    onChange={(e) => setFormData({...formData, relatedId: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                    placeholder="ID de l'équipement, tâche, etc."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.actionRequired}
                      onChange={(e) => setFormData({...formData, actionRequired: e.target.checked})}
                      className="mr-2 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-black">Action requise de la part de l'utilisateur</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Créer l'alerte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
