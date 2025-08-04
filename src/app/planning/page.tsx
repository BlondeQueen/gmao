'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Wrench, 
  Clock, 
  AlertTriangle,
  Edit,
  Trash2,
  X,
  Save,
  Printer
} from 'lucide-react';

interface PlanningTask {
  id: string;
  title: string;
  description: string;
  equipmentId: string;
  type: 'preventive' | 'corrective';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  estimatedDuration: number;
  assignedTechnician: string;
  createdAt: string;
}

interface Equipment {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
}

type ViewMode = 'month' | 'week' | 'day';

export default function PlanningPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<PlanningTask[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<PlanningTask | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    equipmentId: '',
    type: 'preventive' as 'preventive' | 'corrective',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    scheduledDate: '',
    estimatedDuration: 1,
    assignedTechnician: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Génération de données réalistes pour Dangote Cement
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const testTasks: PlanningTask[] = [
      {
        id: '1',
        title: 'Maintenance préventive Four #1',
        description: 'Inspection complète et nettoyage du four rotatif principal',
        equipmentId: 'eq1',
        type: 'preventive',
        priority: 'high',
        status: 'scheduled',
        scheduledDate: tomorrow.toISOString().split('T')[0],
        estimatedDuration: 8,
        assignedTechnician: 'Jean Mballa',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Réparation Convoyeur Principal',
        description: 'Remplacement courroie défectueuse et vérification alignement',
        equipmentId: 'eq2',
        type: 'corrective',
        priority: 'urgent',
        status: 'scheduled',
        scheduledDate: today.toISOString().split('T')[0],
        estimatedDuration: 4,
        assignedTechnician: 'Marie Nguema',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Contrôle Tour de Refroidissement',
        description: 'Vérification pompes et système de refroidissement',
        equipmentId: 'eq3',
        type: 'preventive',
        priority: 'medium',
        status: 'scheduled',
        scheduledDate: nextWeek.toISOString().split('T')[0],
        estimatedDuration: 6,
        assignedTechnician: 'Paul Essono',
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        title: 'Maintenance Broyeur Ciment',
        description: 'Remplacement blindages et vérification mécanismes',
        equipmentId: 'eq4',
        type: 'preventive',
        priority: 'high',
        status: 'scheduled',
        scheduledDate: new Date(today.getTime() + 3*24*60*60*1000).toISOString().split('T')[0],
        estimatedDuration: 12,
        assignedTechnician: 'Équipe A',
        createdAt: new Date().toISOString()
      }
    ];

    const testEquipment: Equipment[] = [
      { id: 'eq1', name: 'Four Rotatif #1', type: 'Four', location: 'Zone Production A', status: 'operational' },
      { id: 'eq2', name: 'Convoyeur Principal', type: 'Transport', location: 'Zone Transport', status: 'maintenance' },
      { id: 'eq3', name: 'Tour de Refroidissement Nord', type: 'Refroidissement', location: 'Zone Refroidissement', status: 'operational' },
      { id: 'eq4', name: 'Broyeur Ciment #2', type: 'Broyage', location: 'Zone Finition', status: 'operational' },
      { id: 'eq5', name: 'Ensacheuse Automatique', type: 'Conditionnement', location: 'Zone Expédition', status: 'operational' }
    ];

    setTasks(testTasks);
    setEquipment(testEquipment);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      equipmentId: '',
      type: 'preventive',
      priority: 'medium',
      scheduledDate: '',
      estimatedDuration: 1,
      assignedTechnician: ''
    });
    setShowModal(true);
  };

  const handleEditTask = (task: PlanningTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      equipmentId: task.equipmentId,
      type: task.type,
      priority: task.priority,
      scheduledDate: task.scheduledDate,
      estimatedDuration: task.estimatedDuration,
      assignedTechnician: task.assignedTechnician
    });
    setShowModal(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
    }
  };

  const handlePrintWorkOrder = (task: PlanningTask) => {
    const equipmentName = getEquipmentName(task.equipmentId);
    const equipmentInfo = equipment.find(eq => eq.id === task.equipmentId);
    const currentDate = new Date().toLocaleDateString('fr-FR');
    const currentTime = new Date().toLocaleTimeString('fr-FR');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Job Safety Analysis - ${task.title}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 15px; 
            color: #000;
            font-size: 12px;
            line-height: 1.2;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
            margin-bottom: 15px;
          }
          .document-title {
            font-size: 16px;
            font-weight: bold;
            margin: 5px 0;
          }
          .header-info {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            border: 1px solid #000;
          }
          th, td {
            border: 1px solid #000;
            padding: 4px;
            text-align: left;
            vertical-align: top;
            font-size: 10px;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          .section-title {
            background-color: #e0e0e0;
            font-weight: bold;
            text-align: center;
            padding: 5px;
          }
          .equipment-row {
            height: 25px;
          }
          .work-step {
            width: 25%;
          }
          .hazards {
            width: 25%;
          }
          .controls {
            width: 25%;
          }
          .permits {
            width: 25%;
          }
          .signature-section {
            margin-top: 20px;
          }
          .signature-table {
            width: 100%;
          }
          .signature-table td {
            height: 40px;
            text-align: center;
          }
          .checkbox-list {
            font-size: 9px;
          }
          .small-text {
            font-size: 9px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="document-title">JOB SAFETY ANALYSIS / ANALYSE DES RISQUES AVANT INTERVENTION</div>
          <div class="header-info">
            <div>
              <strong>Date:</strong> ${currentDate}<br>
              <strong>Task/Tâche:</strong> ${task.title}
            </div>
            <div>
              <strong>Job Location / Lieu d'exécution:</strong> ${equipmentInfo?.location || ''}<br>
              <strong>Supervisor/Personnel présents présent:</strong> ${task.assignedTechnician}
            </div>
          </div>
        </div>

        <!-- Section Équipements de Protection -->
        <table>
          <tr>
            <th colspan="8" class="section-title">PERSONAL PROTECTIVE EQUIPMENT / EPI / ÉQUIPEMENTS DE PROTECTION INDIVIDUELLE</th>
          </tr>
          <tr>
            <th class="small-text">Safety shoes<br>X Chaussures sécurité</th>
            <th class="small-text">Fall arrest equipment<br>X Dispositif anti-chute</th>
            <th class="small-text">HAZARD IDENTIFICATION / IDENTIFICATION DES DANGERS</th>
            <th class="small-text">Unprotected edge<br>Bord non protégé</th>
            <th class="small-text">WORK PERMITS REQUIRED / PERMIS DE TRAVAIL NÉCESSAIRES</th>
          </tr>
          <tr>
            <td class="checkbox-list">☐ Safety shoes<br>☐ Dust mask, filter</td>
            <td class="checkbox-list">☐ Fall arrest equipment<br>☐ Safety harness/belt</td>
            <td class="checkbox-list">☐ Structural<br>☐ Slip/trip/falls</td>
            <td class="checkbox-list">☐ Liquid<br>☐ Chemicals</td>
            <td class="checkbox-list">☐ Line Clearance / Energy isolation<br>☐ Hot Work</td>
          </tr>
          <tr>
            <td class="checkbox-list">☐ Work uniform<br>☐ High visibility vest</td>
            <td class="checkbox-list">☐ Safety gloves (type)<br>☐ Safety helmet</td>
            <td class="checkbox-list">☐ Fragile roof<br>☐ Electrical hazard</td>
            <td class="checkbox-list">☐ Burnt surfaces<br>☐ High / low temp</td>
            <td class="checkbox-list">☐ Confined Space Permit<br>☐ Work at Height</td>
          </tr>
          <tr>
            <td class="checkbox-list">☐ Safety goggles / eye<br>protection</td>
            <td class="checkbox-list">☐ Others<br>Autres</td>
            <td class="checkbox-list">☐ Falling objects<br>☐ Ionising radiation<br>☐ Noise<br>☐ Steam</td>
            <td class="checkbox-list">☐ High / low pressure<br>☐ Electricity<br>☐ Moving parts</td>
            <td class="checkbox-list">☐ Excavation Permit</td>
          </tr>
        </table>

        <!-- Section Analyse des étapes de travail -->
        <table>
          <tr>
            <th class="work-step">Job Step / Étape du travail</th>
            <th class="hazards">How is Work carried (what? What How?)<br>Méthode de travail ( Qui? Comment? À l'aide de quoi?)</th>
            <th class="controls">Existing or potential Hazards / risks<br>Dangers ou risques potentiels ou existants</th>
            <th class="permits">Controls<br>Mesures préventives</th>
          </tr>
          <tr>
            <td style="height: 120px;">
              <strong>Inspection du lieu de travail</strong><br><br>
              Le technicien vérifie l'état des points et huile.
            </td>
            <td style="height: 120px;">
              Rassemblement des clés nécessaires pour effectuer le travail et la mobilisation du personnel nécessaire
            </td>
            <td style="height: 120px;">
              - Glissades<br>
              - Chutes<br>
              - Écoulement de liquide
            </td>
            <td style="height: 120px;">
              - EPI et nettoyer la zone de fuite d'huile<br>
              - Port des gants<br>
              - Port des chaussures de sécurité
            </td>
          </tr>
          <tr>
            <td style="height: 120px;">
              <strong>Consignation (LLO)</strong><br><br>
              Après avoir identifié l'équipement il faut se diriger à la salle électrique à fin de faire un LOTO
            </td>
            <td style="height: 120px;">
              - Glissades<br>
              - Chutes<br>
              - Frottements
            </td>
            <td style="height: 120px;">
              - EPI et nettoyer la zone de fuite d'huile<br>
              - Port des gants<br>
              - Port des chaussures de sécurité
            </td>
            <td style="height: 120px;">
              - Port des gants<br>
              - Port des chaussures de sécurité<br>
              - EPI et nettoyer la zone de fuite d'huile<br>
              - Port des chaussures de sécurité
            </td>
          </tr>
          <tr>
            <td style="height: 120px;">
              <strong>Exécution du Travail</strong><br><br>
              Effectuer les tâches suivants à l'aide des différents clé nécessaires!<br>
              - Desserrage des raccord<br>
              - Vérification de l'étanchéité<br>
              - Application de la Loctite<br>
              - Ressemlage des raccord
            </td>
            <td style="height: 120px;">
              - Risk de fuites sur pression<br>
              - Peut atteint non recommandé<br>
              - Enfoncement de la loctite rendant la surface glissante
            </td>
            <td style="height: 120px;">
              - Port des gants amener<br>
              - Port des chaussures de sécurité<br>
              - Masque de protection<br>
              - Les lunettes de sécurité<br>
              - Faire attention lors de l'ouverture de la LOCTITE et éviter de laisser tomber la LOCTITE<br>
              - Port des chaussures de sécurité
            </td>
          </tr>
          <tr>
            <td style="height: 120px;">
              <strong>Housekeeping</strong><br><br>
              Après l'activité de maintenance nettoyer l'endroit où le travail à été effectué
            </td>
            <td style="height: 120px;">
              - Glissades<br>
              - Chutes<br>
              - Étalage des outils sur une surface de travail encombrée pouvant tout avec difficulté et désorganité
            </td>
            <td style="height: 120px;">
              - Port des gants à main<br>
              - Tête ou casque de protection<br>
              - Organisation de l'espace de travail et vérifier toit de la propreté
            </td>
          </tr>
        </table>

        <!-- Section Signatures -->
        <div class="signature-section">
          <table class="signature-table">
            <tr>
              <th colspan="3">NAMES / NOMS</th>
              <th>Signature</th>
              <th colspan="2">APPROVAL / VALIDATION</th>
            </tr>
            <tr>
              <td style="width: 20%"></td>
              <td style="width: 20%"></td>
              <td style="width: 20%"></td>
              <td style="width: 15%"></td>
              <td><strong>Supervisor</strong></td>
              <td><strong>HSE Manager In Charge</strong></td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td><strong>Date</strong><br><strong>Name /</strong><br><strong>Signature</strong></td>
              <td></td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 10px;">
          <strong>Tâche:</strong> ${task.title} | <strong>Équipement:</strong> ${equipmentName} | <strong>Date planifiée:</strong> ${new Date(task.scheduledDate).toLocaleDateString('fr-FR')} | <strong>Durée:</strong> ${task.estimatedDuration}h
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.equipmentId || !formData.scheduledDate) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const taskData: PlanningTask = {
      id: editingTask ? editingTask.id : Date.now().toString(),
      ...formData,
      status: 'scheduled',
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString()
    };

    if (editingTask) {
      const updatedTasks = tasks.map(task => 
        task.id === editingTask.id ? taskData : task
      );
      setTasks(updatedTasks);
    } else {
      setTasks([...tasks, taskData]);
    }

    setShowModal(false);
  };

  const getEquipmentName = (equipmentId: string) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq ? eq.name : 'Équipement inconnu';
  };

  const getTaskColor = (task: PlanningTask) => {
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
    return date.getMonth() === currentDate.getMonth() && 
           date.getFullYear() === currentDate.getFullYear();
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1));
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.scheduledDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-black">Planning de Maintenance</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Tâches</p>
                <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tasks.filter(t => t.priority === 'urgent').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Wrench className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Aujourd'hui</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getTasksForDate(new Date()).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Heures Planifiées</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tasks.reduce((acc, task) => acc + task.estimatedDuration, 0)}h
                </p>
              </div>
            </div>
          </div>
        </div>

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
              <button 
                onClick={handleAddTask}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
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
                          className={`text-xs text-white px-2 py-1 rounded truncate cursor-pointer ${getTaskColor(task)}`}
                          title={`${task.title} - ${getEquipmentName(task.equipmentId)}`}
                          onClick={() => handleEditTask(task)}
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
                                  <span className="text-gray-500">
                                    👤 {task.assignedTechnician}
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
                                onClick={() => handlePrintWorkOrder(task)}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Imprimer fiche de maintenance"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditTask(task)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
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
          <h4 className="text-sm font-medium text-gray-900 mb-3">Légende des Priorités</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-black">Urgente</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-black">Priorité élevée</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-black">Maintenance préventive</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-black">Maintenance corrective</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'ajout/modification de tâche */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingTask ? 'Modifier la tâche' : 'Nouvelle tâche de maintenance'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Fermer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre de la tâche *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Ex: Maintenance préventive four #1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Équipement concerné *
                  </label>
                  <select
                    value={formData.equipmentId}
                    onChange={(e) => setFormData({...formData, equipmentId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un équipement</option>
                    {equipment.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name} ({eq.location})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de maintenance
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'preventive' | 'corrective'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="preventive">Maintenance Préventive</option>
                    <option value="corrective">Maintenance Corrective</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Niveau de priorité
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Élevée</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date planifiée *
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée estimée (heures)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({...formData, estimatedDuration: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 4.5"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technicien/Équipe assigné(e)
                  </label>
                  <input
                    type="text"
                    value={formData.assignedTechnician}
                    onChange={(e) => setFormData({...formData, assignedTechnician: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Jean Mballa ou Équipe A"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description détaillée
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Détails de la maintenance à effectuer..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingTask ? 'Modifier la tâche' : 'Créer la tâche'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
