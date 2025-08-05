'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Thermometer,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Plus,
  Activity,
  Gauge,
  Droplets,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import StorageManager, { type ThermalReading, type Equipment } from '@/lib/storage';
import { HeatExchangerAnalyzer, type HeatExchangerEfficiency, type ThermalData } from '@/lib/calculations';
import Navigation from '@/components/Navigation';

export default function EfficacitePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [heatExchangers, setHeatExchangers] = useState<Equipment[]>([]);
  const [efficiencyData, setEfficiencyData] = useState<HeatExchangerEfficiency[]>([]);
  const [thermalReadings, setThermalReadings] = useState<ThermalReading[]>([]);
  const [selectedExchanger, setSelectedExchanger] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReading, setNewReading] = useState({
    hotInletTemp: '',
    hotOutletTemp: '',
    coldInletTemp: '',
    coldOutletTemp: '',
    flowRateHot: '',
    flowRateCold: ''
  });
  const [loading, setLoading] = useState(true);

  const storageManager = StorageManager.getInstance();

  useEffect(() => {
    // Vérifier l'authentification
    const currentUser = storageManager.getCurrentUser();
    if (!currentUser) {
      router.push('/');
      return;
    }

    setUser(currentUser);
    loadData();
  }, [router]);

  const handleLogout = () => {
    storageManager.logout();
    router.push('/');
  };

  const loadData = () => {
    try {
      // Charger les équipements échangeurs de chaleur
      const allEquipments = storageManager.getEquipments();
      const exchangers = allEquipments.filter(eq => eq.type === 'heat_exchanger');
      setHeatExchangers(exchangers);

      // Charger les données thermiques
      const readings = storageManager.getThermalReadings();
      setThermalReadings(readings);

      // Calculer l'efficacité pour chaque échangeur
      const efficiencies = exchangers.map(exchanger => {
        const exchangerReadings = readings.filter(r => r.equipmentId === exchanger.id);
        const thermalData: ThermalData[] = exchangerReadings.map(r => ({
          timestamp: r.timestamp,
          hotInletTemp: r.hotInletTemp,
          hotOutletTemp: r.hotOutletTemp,
          coldInletTemp: r.coldInletTemp,
          coldOutletTemp: r.coldOutletTemp,
          flowRateHot: r.flowRateHot,
          flowRateCold: r.flowRateCold
        }));

        return HeatExchangerAnalyzer.evaluateHeatExchanger(exchanger, thermalData, 85);
      });

      setEfficiencyData(efficiencies);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setLoading(false);
    }
  };

  const handleAddReading = () => {
    if (!selectedExchanger || !newReading.hotInletTemp || !newReading.hotOutletTemp || 
        !newReading.coldInletTemp || !newReading.coldOutletTemp) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const reading: ThermalReading = {
      id: `thermal-${Date.now()}`,
      equipmentId: selectedExchanger,
      timestamp: new Date().toISOString(),
      hotInletTemp: parseFloat(newReading.hotInletTemp),
      hotOutletTemp: parseFloat(newReading.hotOutletTemp),
      coldInletTemp: parseFloat(newReading.coldInletTemp),
      coldOutletTemp: parseFloat(newReading.coldOutletTemp),
      flowRateHot: parseFloat(newReading.flowRateHot) || 2.5,
      flowRateCold: parseFloat(newReading.flowRateCold) || 3.0,
      recordedBy: storageManager.getCurrentUser()?.name || 'Inconnu'
    };

    storageManager.addThermalReading(reading);
    
    // Réinitialiser le formulaire
    setNewReading({
      hotInletTemp: '',
      hotOutletTemp: '',
      coldInletTemp: '',
      coldOutletTemp: '',
      flowRateHot: '',
      flowRateCold: ''
    });
    setShowAddModal(false);
    
    // Recharger les données
    loadData();
  };

  const getAlertIcon = (alertLevel: string) => {
    switch (alertLevel) {
      case 'green': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'yellow': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'orange': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'red': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <CheckCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColor = (alertLevel: string) => {
    switch (alertLevel) {
      case 'green': return 'bg-green-100 border-green-200 text-green-800';
      case 'yellow': return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'orange': return 'bg-orange-100 border-orange-200 text-orange-800';
      case 'red': return 'bg-red-100 border-red-200 text-red-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getTrendIcon = (degradationRate: number) => {
    if (degradationRate < -1) return <TrendingDown className="h-4 w-4 text-red-500" />;
    if (degradationRate > 1) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'none': return 'Aucune action';
      case 'monitoring': return 'Surveillance renforcée';
      case 'cleaning': return 'Nettoyage recommandé';
      case 'maintenance': return 'Maintenance requise';
      case 'replacement': return 'Remplacement nécessaire';
      default: return 'Action indéterminée';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données d'efficacité...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentUser={user} onLogout={handleLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Efficacité des Échangeurs</h1>
              <p className="mt-2 text-gray-600">
                Analyse thermique et maintenance prédictive des échangeurs de chaleur
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle Mesure
            </button>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Thermometer className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Échangeurs Analysés</p>
                <p className="text-2xl font-bold text-gray-900">{efficiencyData.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Gauge className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Efficacité Moyenne</p>
                <p className="text-2xl font-bold text-gray-900">
                  {efficiencyData.length > 0 
                    ? Math.round(efficiencyData.reduce((sum, e) => sum + e.currentEfficiency, 0) / efficiencyData.length)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Alertes Actives</p>
                <p className="text-2xl font-bold text-gray-900">
                  {efficiencyData.filter(e => e.alertLevel !== 'green').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Maintenances Prédites</p>
                <p className="text-2xl font-bold text-gray-900">
                  {efficiencyData.filter(e => 
                    new Date(e.predictedMaintenanceDate) <= new Date(Date.now() + 30*24*60*60*1000)
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des échangeurs */}
        <div className="grid gap-6">
          {efficiencyData.map((efficiency) => (
            <div key={efficiency.equipmentId} className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{efficiency.equipmentName}</h3>
                    <p className="text-gray-600">ID: {efficiency.equipmentId}</p>
                  </div>
                  <div className={`flex items-center px-3 py-1 rounded-full border ${getAlertColor(efficiency.alertLevel)}`}>
                    {getAlertIcon(efficiency.alertLevel)}
                    <span className="ml-2 text-sm font-medium">{efficiency.alertLevel.toUpperCase()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {/* Efficacité actuelle */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {efficiency.currentEfficiency}%
                    </div>
                    <div className="text-sm text-gray-600">Efficacité Actuelle</div>
                    <div className="text-xs text-gray-500">
                      (Conception: {efficiency.designEfficiency}%)
                    </div>
                  </div>

                  {/* Taux de dégradation */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      {getTrendIcon(efficiency.degradationRate)}
                      <span className="text-lg font-semibold ml-2">
                        {Math.abs(efficiency.degradationRate).toFixed(1)}%/mois
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">Taux de Dégradation</div>
                  </div>

                  {/* Transfert thermique */}
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      {efficiency.thermodynamicData.actualHeatTransfer.toFixed(1)} kW
                    </div>
                    <div className="text-sm text-gray-600">Transfert Actuel</div>
                    <div className="text-xs text-gray-500">
                      (Max: {efficiency.thermodynamicData.maxPossibleHeatTransfer.toFixed(1)} kW)
                    </div>
                  </div>

                  {/* Date de maintenance prédite */}
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      {new Date(efficiency.predictedMaintenanceDate).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-sm text-gray-600">Maintenance Prédite</div>
                  </div>
                </div>

                {/* Action recommandée */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Action Recommandée</h4>
                      <p className="text-gray-600">{getActionText(efficiency.recommendedAction)}</p>
                    </div>
                    <Activity className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal d'ajout de mesure */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Nouvelle Mesure Thermique</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Échangeur</label>
                  <select
                    value={selectedExchanger}
                    onChange={(e) => setSelectedExchanger(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un échangeur</option>
                    {heatExchangers.map(exchanger => (
                      <option key={exchanger.id} value={exchanger.id}>
                        {exchanger.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">T° Entrée Chaud (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newReading.hotInletTemp}
                      onChange={(e) => setNewReading({...newReading, hotInletTemp: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">T° Sortie Chaud (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newReading.hotOutletTemp}
                      onChange={(e) => setNewReading({...newReading, hotOutletTemp: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">T° Entrée Froid (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newReading.coldInletTemp}
                      onChange={(e) => setNewReading({...newReading, coldInletTemp: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">T° Sortie Froid (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newReading.coldOutletTemp}
                      onChange={(e) => setNewReading({...newReading, coldOutletTemp: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Débit Chaud (kg/s)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newReading.flowRateHot}
                      onChange={(e) => setNewReading({...newReading, flowRateHot: e.target.value})}
                      placeholder="2.5"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Débit Froid (kg/s)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newReading.flowRateCold}
                      onChange={(e) => setNewReading({...newReading, flowRateCold: e.target.value})}
                      placeholder="3.0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddReading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
