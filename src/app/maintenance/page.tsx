'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, 
  Plus, 
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import StorageManager, { type MaintenanceTask, type Equipment } from '@/lib/storage';

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
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
    const tasksData = storageManager.getMaintenanceTasks();
    const equipmentsData = storageManager.getEquipments();
    setTasks(tasksData);
    setEquipments(equipmentsData);
    setLoading(false);
  }, [router, storageManager]);

  const getEquipmentName = (equipmentId: string) => {
    const equipment = equipments.find(e => e.id === equipmentId);
    return equipment ? equipment.name : 'Équipement inconnu';
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesType = filterType === 'all' || task.type === filterType;
    return matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Planifiée';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Faible';
      case 'medium': return 'Moyenne';
      case 'high': return 'Élevée';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  const getTypeText = (type: string) => {
    return type === 'preventive' ? 'Préventive' : 'Corrective';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des tâches de maintenance...</p>
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
              <Wrench className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestion de la Maintenance</h1>
                <p className="text-gray-600">Dangote Cement Cameroon</p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Retour au Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">
                  {tasks.filter(t => t.status === 'scheduled').length}
                </div>
                <div className="text-sm text-gray-600">Planifiées</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </div>
                <div className="text-sm text-gray-600">En cours</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">
                  {tasks.filter(t => t.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Terminées</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">
                  {tasks.filter(t => t.priority === 'urgent').length}
                </div>
                <div className="text-sm text-gray-600">Urgentes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre d'outils */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Filtre par statut */}
              <select
                title="Filtrer par statut"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="scheduled">Planifiée</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>

              {/* Filtre par type */}
              <select
                title="Filtrer par type"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Tous les types</option>
                <option value="preventive">Préventive</option>
                <option value="corrective">Corrective</option>
              </select>
            </div>

            {/* Bouton d'ajout */}
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Nouvelle Tâche</span>
            </button>
          </div>
        </div>

        {/* Liste des tâches */}
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(task.status)}
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                      {getPriorityText(task.priority)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Équipement:</span>
                      <div className="text-gray-900">{getEquipmentName(task.equipmentId)}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <div className="text-gray-900">{getTypeText(task.type)}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Date prévue:</span>
                      <div className="text-gray-900">
                        {new Date(task.scheduledDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Durée estimée:</span>
                      <div className="text-gray-900">{task.estimatedDuration}h</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Assigné à:</span>
                      <div className="text-gray-900 flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {task.assignedTo || 'Non assigné'}
                      </div>
                    </div>
                    {task.frequency && (
                      <div>
                        <span className="font-medium text-gray-700">Fréquence:</span>
                        <div className="text-gray-900">{task.frequency}</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="ml-6 flex space-x-2">
                  <button 
                    title="Modifier la tâche"
                    className="text-blue-600 hover:text-blue-900 p-2"
                  >
                    <Wrench className="h-5 w-5" />
                  </button>
                  {task.status === 'scheduled' && (
                    <button 
                      title="Démarrer la tâche"
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Démarrer
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button 
                      title="Terminer la tâche"
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Terminer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Wrench className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune tâche trouvée</h3>
              <p className="mt-1 text-sm text-gray-500">
                Aucune tâche de maintenance ne correspond aux filtres sélectionnés.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
