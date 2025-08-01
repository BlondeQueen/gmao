'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Clock,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import StorageManager, { type MaintenanceTask, type Equipment } from '@/lib/storage';

export default function PlanningPage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
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

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Commencer le lundi
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - mondayOffset);

    const days = [];
    const current = new Date(startDate);
    
    // Générer 42 jours (6 semaines)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.scheduledDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const getDateRange = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = currentDate.getDay();
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(currentDate.getDate() - mondayOffset);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString('fr-FR')} - ${endOfWeek.toLocaleDateString('fr-FR')}`;
    } else {
      return currentDate.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const getTaskColor = (task: MaintenanceTask) => {
    if (task.priority === 'urgent') return 'bg-red-500';
    if (task.priority === 'high') return 'bg-orange-500';
    if (task.type === 'preventive') return 'bg-blue-500';
    return 'bg-green-500';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du planning...</p>
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
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Planning de Maintenance</h1>
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
        {/* Contrôles du calendrier */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                title="Période précédente"
                onClick={() => navigateDate('prev')}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                {getDateRange()}
              </div>
              <button
                title="Période suivante"
                onClick={() => navigateDate('next')}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Sélecteur de vue */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['month', 'week', 'day'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {mode === 'month' ? 'Mois' : mode === 'week' ? 'Semaine' : 'Jour'}
                  </button>
                ))}
              </div>

              {/* Bouton aujourd'hui */}
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-black bg-white"
              >
                Aujourd'hui
              </button>

              {/* Bouton nouvelle tâche */}
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Nouvelle Tâche</span>
              </button>
            </div>
          </div>
        </div>

        {/* Vue mensuelle */}
        {viewMode === 'month' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* En-têtes des jours */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
            </div>

            {/* Grille du calendrier */}
            <div className="grid grid-cols-7">
              {getMonthDays().map((day, index) => {
                const dayTasks = getTasksForDate(day);
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b border-gray-100 ${
                      !isCurrentMonth(day) ? 'bg-gray-50' : ''
                    } ${isToday(day) ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-2 ${
                      !isCurrentMonth(day) ? 'text-gray-600' : 
                      isToday(day) ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className={`text-xs text-white px-2 py-1 rounded truncate ${getTaskColor(task)}`}
                          title={`${task.title} - ${getEquipmentName(task.equipmentId)}`}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-gray-700 px-2">
                          +{dayTasks.length - 3} autre(s)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vue semaine/jour (liste) */}
        {(viewMode === 'week' || viewMode === 'day') && (
          <div className="space-y-4">
            {(() => {
              const days = viewMode === 'week' ? (() => {
                const startOfWeek = new Date(currentDate);
                const dayOfWeek = currentDate.getDay();
                const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                startOfWeek.setDate(currentDate.getDate() - mondayOffset);
                
                const weekDays = [];
                for (let i = 0; i < 7; i++) {
                  const day = new Date(startOfWeek);
                  day.setDate(startOfWeek.getDate() + i);
                  weekDays.push(day);
                }
                return weekDays;
              })() : [currentDate];

              return days.map((day) => {
                const dayTasks = getTasksForDate(day);
                return (
                  <div key={day.toISOString()} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-lg font-semibold ${
                        isToday(day) ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {day.toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      <span className="text-sm text-gray-700">
                        {dayTasks.length} tâche(s)
                      </span>
                    </div>

                    {dayTasks.length === 0 ? (
                      <p className="text-gray-700 text-center py-8">
                        Aucune tâche planifiée pour cette journée
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {dayTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-4">
                              <div className={`w-4 h-4 rounded-full ${getTaskColor(task)}`}></div>
                              <div>
                                <h4 className="font-medium text-gray-900">{task.title}</h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                  <span className="flex items-center">
                                    <Wrench className="h-4 w-4 mr-1" />
                                    {getEquipmentName(task.equipmentId)}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {task.estimatedDuration}h
                                  </span>
                                  {task.priority === 'urgent' && (
                                    <span className="flex items-center text-red-600">
                                      <AlertTriangle className="h-4 w-4 mr-1" />
                                      Urgent
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                task.type === 'preventive' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {task.type === 'preventive' ? 'Préventive' : 'Corrective'}
                              </span>
                              <button
                                title="Voir les détails"
                                className="text-blue-600 hover:text-blue-900 p-1"
                              >
                                <Wrench className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* Légende */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Légende</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Urgente</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>Priorité élevée</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Maintenance préventive</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Maintenance corrective</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
