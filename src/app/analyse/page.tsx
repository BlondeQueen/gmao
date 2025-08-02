'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  BarChart3,
  PieChart,
  Activity,
  Download,
  Filter,
  Calendar
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import StorageManager, { type Equipment, type MaintenanceTask, type Breakdown } from '@/lib/storage';
import PerformanceCalculator from '@/lib/calculations';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title);

export default function AnalysePage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);
  const [selectedChartType, setSelectedChartType] = useState<'overview' | 'trends' | 'performance'>('overview');

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
    const equipmentsData = storageManager.getEquipments();
    const tasksData = storageManager.getMaintenanceTasks();
    const breakdownsData = storageManager.getBreakdowns();
    
    setEquipments(equipmentsData);
    setTasks(tasksData);
    setBreakdowns(breakdownsData);
    setLoading(false);
  }, [router, storageManager]);

  const getDateRangeFilter = () => {
    const now = new Date();
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[dateRange];
    
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return startDate;
  };

  // Données pour les KPIs
  const getKPIData = () => {
    const totalEquipments = equipments.length;
    const operationalEquipments = equipments.filter(e => e.status === 'operational').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    
    const availability = totalEquipments > 0 ? (operationalEquipments / totalEquipments) * 100 : 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculer MTBF/MTTR moyens pour tous les équipements
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let totalMtbf = 0;
    let totalMttr = 0;
    let equipmentCount = 0;
    
    equipments.forEach(equipment => {
      const mtbf = PerformanceCalculator.calculateMTBF(equipment.id, breakdowns, oneMonthAgo, now);
      const mttr = PerformanceCalculator.calculateMTTR(equipment.id, breakdowns, oneMonthAgo, now);
      if (mtbf > 0) {
        totalMtbf += mtbf;
        equipmentCount++;
      }
      totalMttr += mttr;
    });

    const avgMtbf = equipmentCount > 0 ? totalMtbf / equipmentCount : 0;
    const avgMttr = equipments.length > 0 ? totalMttr / equipments.length : 0;

    return {
      availability,
      completionRate,
      mtbf: avgMtbf,
      mttr: avgMttr,
      totalBreakdowns: breakdowns.length,
      urgentTasks: tasks.filter(t => t.priority === 'urgent').length
    };
  };

  // Données pour le graphique de disponibilité par équipement
  const getAvailabilityChartData = () => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const data = equipments.slice(0, 10).map(equipment => {
      const availability = PerformanceCalculator.calculateAvailability(
        equipment.id, 
        breakdowns, 
        tasks, 
        oneMonthAgo, 
        now
      );
      return {
        name: equipment.name,
        availability
      };
    });

    return {
      labels: data.map(d => d.name),
      datasets: [{
        label: 'Disponibilité (%)',
        data: data.map(d => d.availability),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    };
  };

  // Données pour le graphique des pannes par mois
  const getBreakdownTrendData = () => {
    const months = [];
    const breakdownCounts = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      months.push(monthName);
      
      const monthBreakdowns = breakdowns.filter(b => {
        const breakdownDate = new Date(b.startTime);
        return breakdownDate.getMonth() === date.getMonth() && 
               breakdownDate.getFullYear() === date.getFullYear();
      });
      breakdownCounts.push(monthBreakdowns.length);
    }

    return {
      labels: months,
      datasets: [{
        label: 'Nombre de pannes',
        data: breakdownCounts,
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  };

  // Données pour le graphique des types de maintenance
  const getMaintenanceTypeData = () => {
    const preventive = tasks.filter(t => t.type === 'preventive').length;
    const corrective = tasks.filter(t => t.type === 'corrective').length;

    return {
      labels: ['Maintenance préventive', 'Maintenance corrective'],
      datasets: [{
        data: [preventive, corrective],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(249, 115, 22, 1)'
        ],
        borderWidth: 2
      }]
    };
  };

  // Données pour le graphique des statuts d'équipements
  const getEquipmentStatusData = () => {
    const operational = equipments.filter(e => e.status === 'operational').length;
    const maintenance = equipments.filter(e => e.status === 'maintenance').length;
    const breakdown = equipments.filter(e => e.status === 'breakdown').length;
    const offline = equipments.filter(e => e.status === 'offline').length;

    return {
      labels: ['Opérationnel', 'En maintenance', 'En panne', 'Hors service'],
      datasets: [{
        data: [operational, maintenance, breakdown, offline],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(107, 114, 128, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(107, 114, 128, 1)'
        ],
        borderWidth: 2
      }]
    };
  };

  const kpiData = getKPIData();

  // Fonction d'export de rapport
  const exportReport = () => {
    const reportData = {
      timestamp: new Date().toLocaleString('fr-FR'),
      period: dateRange,
      kpis: kpiData,
      equipmentDetails: equipments.map(equipment => {
        const equipmentBreakdowns = breakdowns.filter(b => b.equipmentId === equipment.id);
        const equipmentTasks = tasks.filter(t => t.equipmentId === equipment.id);
        
        const now = new Date();
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        return {
          name: equipment.name,
          status: equipment.status,
          availability: PerformanceCalculator.calculateAvailability(equipment.id, breakdowns, tasks, oneMonthAgo, now),
          mtbf: PerformanceCalculator.calculateMTBF(equipment.id, breakdowns, oneMonthAgo, now),
          breakdownCount: equipmentBreakdowns.length,
          maintenanceCount: equipmentTasks.length
        };
      })
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-gmao-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Données pour les graphiques de tendances de performance
  const getPerformanceTrendData = () => {
    const months = [];
    const availabilityTrend = [];
    const mtbfTrend = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      months.push(monthName);
      
      // Calculer la disponibilité moyenne pour ce mois
      let totalAvailability = 0;
      let totalMtbf = 0;
      let equipmentCount = 0;
      
      equipments.forEach(equipment => {
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const availability = PerformanceCalculator.calculateAvailability(
          equipment.id, 
          breakdowns, 
          tasks, 
          monthStart, 
          monthEnd
        );
        const mtbf = PerformanceCalculator.calculateMTBF(
          equipment.id, 
          breakdowns, 
          monthStart, 
          monthEnd
        );
        
        totalAvailability += availability;
        if (mtbf > 0) {
          totalMtbf += mtbf;
          equipmentCount++;
        }
      });
      
      availabilityTrend.push(equipments.length > 0 ? totalAvailability / equipments.length : 0);
      mtbfTrend.push(equipmentCount > 0 ? totalMtbf / equipmentCount : 0);
    }

    return {
      labels: months,
      datasets: [
        {
          label: 'Disponibilité moyenne (%)',
          data: availabilityTrend,
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'MTBF moyen (h)',
          data: mtbfTrend,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  };

  // Données pour les coûts de maintenance
  const getMaintenanceCostData = () => {
    const preventiveCost = tasks.filter(t => t.type === 'preventive').length * 1500; // Coût estimé
    const correctiveCost = tasks.filter(t => t.type === 'corrective').length * 3500; // Coût estimé

    return {
      labels: ['Maintenance préventive', 'Maintenance corrective'],
      datasets: [{
        label: 'Coûts estimés (XAF)',
        data: [preventiveCost, correctiveCost],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2
      }]
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des analyses...</p>
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
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analyses et Rapports</h1>
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
        {/* Contrôles */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-600" />
              <select
                title="Période d'analyse"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
              >
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">3 derniers mois</option>
                <option value="1y">Dernière année</option>
              </select>
              
              <select
                title="Type d'analyse"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                value={selectedChartType}
                onChange={(e) => setSelectedChartType(e.target.value as any)}
              >
                <option value="overview">Vue d'ensemble</option>
                <option value="trends">Tendances</option>
                <option value="performance">Performance</option>
              </select>
            </div>
            <button 
              onClick={exportReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Exporter le rapport</span>
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{kpiData.availability.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Disponibilité moyenne</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{kpiData.mtbf.toFixed(0)}h</div>
                <div className="text-sm text-gray-600">MTBF moyen</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <PieChart className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{kpiData.mttr.toFixed(1)}h</div>
                <div className="text-sm text-gray-600">MTTR moyen</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{kpiData.completionRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Taux de completion</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{kpiData.totalBreakdowns}</div>
                <div className="text-sm text-gray-600">Pannes totales</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{kpiData.urgentTasks}</div>
                <div className="text-sm text-gray-600">Tâches urgentes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques dynamiques */}
        {selectedChartType === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Disponibilité par équipement */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Disponibilité par Équipement</h3>
              <div className="h-64">
                <Bar 
                  data={getAvailabilityChartData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: function(value) {
                            return value + '%';
                          }
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Types de maintenance */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des Maintenances</h3>
              <div className="h-64">
                <Pie 
                  data={getMaintenanceTypeData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Statuts des équipements */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statuts des Équipements</h3>
              <div className="h-64">
                <Pie 
                  data={getEquipmentStatusData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Coûts de maintenance */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Coûts de Maintenance Estimés</h3>
              <div className="h-64">
                <Bar 
                  data={getMaintenanceCostData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return new Intl.NumberFormat('fr-FR', { 
                              style: 'currency', 
                              currency: 'XAF',
                              minimumFractionDigits: 0
                            }).format(value as number);
                          }
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {selectedChartType === 'trends' && (
          <div className="grid grid-cols-1 gap-6 mb-8">
            {/* Évolution des pannes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des Pannes sur 6 Mois</h3>
              <div className="h-80">
                <Line 
                  data={getBreakdownTrendData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Tendances de performance */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendances de Performance sur 12 Mois</h3>
              <div className="h-80">
                <Line 
                  data={getPerformanceTrendData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: function(value) {
                            return value + '%';
                          }
                        }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                          drawOnChartArea: false,
                        },
                        ticks: {
                          callback: function(value) {
                            return value + 'h';
                          }
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top'
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {selectedChartType === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Performance détaillée par équipement */}
            <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyse de Performance Détaillée</h3>
              <div className="h-96">
                <Bar 
                  data={{
                    labels: equipments.slice(0, 8).map(e => e.name),
                    datasets: [
                      {
                        label: 'Disponibilité (%)',
                        data: equipments.slice(0, 8).map(equipment => {
                          const now = new Date();
                          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                          return PerformanceCalculator.calculateAvailability(equipment.id, breakdowns, tasks, oneMonthAgo, now);
                        }),
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        yAxisID: 'y'
                      },
                      {
                        label: 'MTBF (h)',
                        data: equipments.slice(0, 8).map(equipment => {
                          const now = new Date();
                          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                          return PerformanceCalculator.calculateMTBF(equipment.id, breakdowns, oneMonthAgo, now) / 10; // Divisé par 10 pour l'échelle
                        }),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        yAxisID: 'y1'
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: function(value) {
                            return value + '%';
                          }
                        }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                          drawOnChartArea: false,
                        },
                        ticks: {
                          callback: function(value) {
                            return (value as number * 10) + 'h';
                          }
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top'
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tableau de synthèse */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Synthèse par Équipement</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Équipement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Disponibilité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    MTBF (h)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Pannes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Maintenance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipments.slice(0, 10).map((equipment) => {
                  const equipmentBreakdowns = breakdowns.filter(b => b.equipmentId === equipment.id);
                  const equipmentTasks = tasks.filter(t => t.equipmentId === equipment.id);
                  
                  const now = new Date();
                  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                  
                  const availability = PerformanceCalculator.calculateAvailability(
                    equipment.id, 
                    breakdowns, 
                    tasks, 
                    oneMonthAgo, 
                    now
                  );
                  const mtbf = PerformanceCalculator.calculateMTBF(
                    equipment.id, 
                    breakdowns, 
                    oneMonthAgo, 
                    now
                  );
                  
                  return (
                    <tr key={equipment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {equipment.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          equipment.status === 'operational' ? 'bg-green-100 text-green-800' :
                          equipment.status === 'maintenance' ? 'bg-blue-100 text-blue-800' :
                          equipment.status === 'breakdown' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {equipment.status === 'operational' ? 'Opérationnel' :
                           equipment.status === 'maintenance' ? 'Maintenance' :
                           equipment.status === 'breakdown' ? 'Panne' : 'Hors service'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {availability.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {mtbf.toFixed(0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {equipmentBreakdowns.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {equipmentTasks.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
