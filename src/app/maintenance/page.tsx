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
  XCircle,
  Edit,
  Trash2
} from 'lucide-react';
import StorageManager, { type MaintenanceTask, type Equipment } from '@/lib/storage';

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [formData, setFormData] = useState({
    equipmentId: '',
    type: 'preventive' as MaintenanceTask['type'],
    title: '',
    description: '',
    scheduledDate: '',
    completedDate: '',
    frequency: '' as MaintenanceTask['frequency'],
    priority: 'medium' as MaintenanceTask['priority'],
    assignedTo: '',
    estimatedDuration: 2,
    notes: '',
    status: 'scheduled' as MaintenanceTask['status']
  });

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

  const resetForm = () => {
    setFormData({
      equipmentId: '',
      type: 'preventive',
      title: '',
      description: '',
      scheduledDate: '',
      completedDate: '',
      frequency: undefined,
      priority: 'medium',
      assignedTo: '',
      estimatedDuration: 2,
      notes: '',
      status: 'scheduled'
    });
    setEditingTask(null);
  };

  const handleAddTask = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditTask = (task: MaintenanceTask) => {
    setEditingTask(task);
    setFormData({
      equipmentId: task.equipmentId,
      type: task.type,
      title: task.title,
      description: task.description,
      scheduledDate: task.scheduledDate,
      completedDate: task.completedDate || '',
      frequency: task.frequency,
      priority: task.priority,
      assignedTo: task.assignedTo || '',
      estimatedDuration: task.estimatedDuration,
      notes: task.notes || '',
      status: task.status
    });
    setShowModal(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      storageManager.saveMaintenanceTasks(updatedTasks);
    }
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTask) {
      // Modifier la tâche existante
      const updatedTask = {
        ...editingTask,
        ...formData
      };
      storageManager.updateMaintenanceTask(editingTask.id, formData);
      const updatedTasks = tasks.map(task => 
        task.id === editingTask.id ? updatedTask : task
      );
      setTasks(updatedTasks);
    } else {
      // Ajouter une nouvelle tâche
      const newTask: MaintenanceTask = {
        id: `task-${Date.now()}`,
        ...formData,
        status: 'scheduled'
      };
      storageManager.addMaintenanceTask(newTask);
      setTasks([...tasks, newTask]);
    }
    
    setShowModal(false);
    resetForm();
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;

    const updatedTask = {
      ...taskToUpdate,
      status: newStatus,
      completedDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : taskToUpdate.completedDate
    };

    storageManager.updateMaintenanceTask(taskId, updatedTask);
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? updatedTask : task
    );
    setTasks(updatedTasks);
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Tous les types</option>
                <option value="preventive">Préventive</option>
                <option value="corrective">Corrective</option>
              </select>
            </div>

            {/* Bouton d'ajout */}
            <button 
              onClick={handleAddTask}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
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
                    onClick={() => handleEditTask(task)}
                    className="text-blue-600 hover:text-blue-900 p-2"
                  >
                    <Wrench className="h-5 w-5" />
                  </button>
                  <button 
                    title="Supprimer la tâche"
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-600 hover:text-red-900 p-2"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  {task.status === 'scheduled' && (
                    <button 
                      title="Démarrer la tâche"
                      onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Démarrer
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button 
                      title="Terminer la tâche"
                      onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
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
              <Wrench className="mx-auto h-12 w-12 text-gray-600" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune tâche trouvée</h3>
              <p className="mt-1 text-sm text-gray-700">
                Aucune tâche de maintenance ne correspond aux filtres sélectionnés.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal pour ajouter/modifier une tâche */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-black">
                {editingTask ? 'Modifier la tâche' : 'Nouvelle tâche de maintenance'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Équipement
                  </label>
                  <select
                    value={formData.equipmentId}
                    onChange={(e) => setFormData({...formData, equipmentId: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                    required
                  >
                    <option value="">Sélectionner un équipement</option>
                    <option value="EQ001">Broyeur Principal - EQ001</option>
                    <option value="EQ002">Four Rotatif - EQ002</option>
                    <option value="EQ003">Convoyeur A - EQ003</option>
                    <option value="EQ004">Compresseur B - EQ004</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Type de maintenance
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'preventive' | 'corrective'})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                    required
                  >
                    <option value="preventive">Préventive</option>
                    <option value="corrective">Corrective</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black mb-1">
                    Titre de la tâche
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Date prévue
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Assigné à
                  </label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                    placeholder="Nom du technicien"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Priorité
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent'})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                    required
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Élevée</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Durée estimée (heures)
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({...formData, estimatedDuration: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                    min="0"
                    step="0.5"
                  />
                </div>

                {formData.type === 'preventive' && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Fréquence
                    </label>
                    <select
                      value={formData.frequency || ''}
                      onChange={(e) => setFormData({...formData, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | undefined})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                    >
                      <option value="">Sélectionner une fréquence</option>
                      <option value="daily">Quotidienne</option>
                      <option value="weekly">Hebdomadaire</option>
                      <option value="monthly">Mensuelle</option>
                      <option value="quarterly">Trimestrielle</option>
                      <option value="annually">Annuelle</option>
                    </select>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black mb-1">
                    Notes additionnelles
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                    rows={2}
                    placeholder="Instructions spéciales, pièces nécessaires, etc."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingTask ? 'Modifier' : 'Créer'} la tâche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
