'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';

interface ThermalMeasurement {
  id: string;
  exchangerType: string;
  hotInletTemp: number;
  hotOutletTemp: number;
  coldInletTemp: number;
  coldOutletTemp: number;
  hotFlowRate: number;
  coldFlowRate: number;
  timestamp: Date;
  efficiency: number;
  deltaT: number;
  status: 'optimal' | 'warning' | 'critical';
}

export default function EfficacitePage() {
  const [measurements, setMeasurements] = useState<ThermalMeasurement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<ThermalMeasurement | null>(null);
  const [formData, setFormData] = useState({
    exchangerType: '',
    hotInletTemp: '',
    hotOutletTemp: '',
    coldInletTemp: '',
    coldOutletTemp: '',
    hotFlowRate: '',
    coldFlowRate: ''
  });

  // Charger les données au démarrage
  useEffect(() => {
    loadMeasurements();
  }, []);

  const loadMeasurements = () => {
    try {
      const stored = localStorage.getItem('thermal_measurements');
      if (stored) {
        const data = JSON.parse(stored).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setMeasurements(data);
      } else {
        // Données d'exemple
        const sampleData: ThermalMeasurement[] = [
          {
            id: '1',
            exchangerType: 'echangeur-1',
            hotInletTemp: 85,
            hotOutletTemp: 75,
            coldInletTemp: 20,
            coldOutletTemp: 30,
            hotFlowRate: 2.5,
            coldFlowRate: 3.0,
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            efficiency: 85.5,
            deltaT: 10,
            status: 'optimal'
          },
          {
            id: '2',
            exchangerType: 'echangeur-2',
            hotInletTemp: 80,
            hotOutletTemp: 78,
            coldInletTemp: 25,
            coldOutletTemp: 27,
            hotFlowRate: 2.2,
            coldFlowRate: 2.8,
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            efficiency: 45.2,
            deltaT: 2,
            status: 'critical'
          }
        ];
        setMeasurements(sampleData);
        saveMeasurements(sampleData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des mesures:', error);
    }
  };

  const saveMeasurements = (data: ThermalMeasurement[]) => {
    try {
      localStorage.setItem('thermal_measurements', JSON.stringify(data));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const calculateEfficiency = (measurement: Omit<ThermalMeasurement, 'id' | 'timestamp' | 'efficiency' | 'deltaT' | 'status'>) => {
    const deltaT = Math.abs(measurement.hotInletTemp - measurement.hotOutletTemp);
    const efficiency = (deltaT / measurement.hotInletTemp) * 100;
    const status: 'optimal' | 'warning' | 'critical' = 
      deltaT >= 10 ? 'optimal' : 
      deltaT >= 5 ? 'warning' : 'critical';
    
    return { efficiency, deltaT, status };
  };

  // CREATE - Ajouter une nouvelle mesure
  const handleCreate = () => {
    if (!formData.exchangerType || !formData.hotInletTemp || !formData.hotOutletTemp || 
        !formData.coldInletTemp || !formData.coldOutletTemp || !formData.hotFlowRate || !formData.coldFlowRate) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const measurementData = {
      exchangerType: formData.exchangerType,
      hotInletTemp: parseFloat(formData.hotInletTemp),
      hotOutletTemp: parseFloat(formData.hotOutletTemp),
      coldInletTemp: parseFloat(formData.coldInletTemp),
      coldOutletTemp: parseFloat(formData.coldOutletTemp),
      hotFlowRate: parseFloat(formData.hotFlowRate),
      coldFlowRate: parseFloat(formData.coldFlowRate)
    };

    const { efficiency, deltaT, status } = calculateEfficiency(measurementData);

    const newMeasurement: ThermalMeasurement = {
      id: Date.now().toString(),
      ...measurementData,
      timestamp: new Date(),
      efficiency,
      deltaT,
      status
    };

    const updatedMeasurements = [newMeasurement, ...measurements];
    setMeasurements(updatedMeasurements);
    saveMeasurements(updatedMeasurements);
    resetForm();
    setShowModal(false);
  };

  // UPDATE - Modifier une mesure existante
  const handleUpdate = () => {
    if (!editingMeasurement) return;

    const measurementData = {
      exchangerType: formData.exchangerType,
      hotInletTemp: parseFloat(formData.hotInletTemp),
      hotOutletTemp: parseFloat(formData.hotOutletTemp),
      coldInletTemp: parseFloat(formData.coldInletTemp),
      coldOutletTemp: parseFloat(formData.coldOutletTemp),
      hotFlowRate: parseFloat(formData.hotFlowRate),
      coldFlowRate: parseFloat(formData.coldFlowRate)
    };

    const { efficiency, deltaT, status } = calculateEfficiency(measurementData);

    const updatedMeasurement: ThermalMeasurement = {
      ...editingMeasurement,
      ...measurementData,
      efficiency,
      deltaT,
      status
    };

    const updatedMeasurements = measurements.map(m => 
      m.id === editingMeasurement.id ? updatedMeasurement : m
    );
    
    setMeasurements(updatedMeasurements);
    saveMeasurements(updatedMeasurements);
    resetForm();
    setShowModal(false);
    setEditingMeasurement(null);
  };

  // DELETE - Supprimer une mesure
  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette mesure ?')) {
      const updatedMeasurements = measurements.filter(m => m.id !== id);
      setMeasurements(updatedMeasurements);
      saveMeasurements(updatedMeasurements);
    }
  };

  // Ouvrir modal pour édition
  const handleEdit = (measurement: ThermalMeasurement) => {
    setEditingMeasurement(measurement);
    setFormData({
      exchangerType: measurement.exchangerType,
      hotInletTemp: measurement.hotInletTemp.toString(),
      hotOutletTemp: measurement.hotOutletTemp.toString(),
      coldInletTemp: measurement.coldInletTemp.toString(),
      coldOutletTemp: measurement.coldOutletTemp.toString(),
      hotFlowRate: measurement.hotFlowRate.toString(),
      coldFlowRate: measurement.coldFlowRate.toString()
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      exchangerType: '',
      hotInletTemp: '',
      hotOutletTemp: '',
      coldInletTemp: '',
      coldOutletTemp: '',
      hotFlowRate: '',
      coldFlowRate: ''
    });
    setEditingMeasurement(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '❌';
      default: return '❓';
    }
  };

  const getExchangerName = (type: string) => {
    switch (type) {
      case 'echangeur-1': return 'Échangeur Principal #1';
      case 'echangeur-2': return 'Échangeur Principal #2';
      case 'echangeur-secours': return 'Échangeur de Secours';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🌡️ Efficacité des Échangeurs</h1>
            <p className="text-gray-600">Surveillance thermique en temps réel </p>
            
            <div className="mt-4 flex items-center space-x-4">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                + Nouvelle Mesure
              </button>
              
              <div className="text-sm text-gray-600">
                Total: {measurements.length} mesures
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">
                {measurements.filter(m => m.status === 'optimal').length}
              </div>
              <div className="text-sm text-gray-600">Mesures Optimales</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {measurements.filter(m => m.status === 'warning').length}
              </div>
              <div className="text-sm text-gray-600">Avertissements</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-red-600">
                {measurements.filter(m => m.status === 'critical').length}
              </div>
              <div className="text-sm text-gray-600">Critiques</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">
                {measurements.length > 0 ? 
                  (measurements.reduce((acc, m) => acc + m.efficiency, 0) / measurements.length).toFixed(1) + '%'
                  : '0%'
                }
              </div>
              <div className="text-sm text-gray-600">Efficacité Moyenne</div>
            </div>
          </div>

          {/* Table des mesures */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Historique des Mesures</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Échangeur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Températures (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Débits (kg/s)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delta T
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Efficacité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Heure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {measurements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        Aucune mesure enregistrée. Cliquez sur "Nouvelle Mesure" pour commencer.
                      </td>
                    </tr>
                  ) : (
                    measurements.map((measurement) => (
                      <tr key={measurement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getExchangerName(measurement.exchangerType)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>In: {measurement.hotInletTemp}°C → {measurement.hotOutletTemp}°C</div>
                            <div>Out: {measurement.coldInletTemp}°C → {measurement.coldOutletTemp}°C</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>Chaud: {measurement.hotFlowRate}</div>
                            <div>Froid: {measurement.coldFlowRate}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {measurement.deltaT.toFixed(1)}°C
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {measurement.efficiency.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(measurement.status)}`}>
                            {getStatusIcon(measurement.status)} {measurement.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {measurement.timestamp.toLocaleString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(measurement)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              ✏️ Modifier
                            </button>
                            <button
                              onClick={() => handleDelete(measurement.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nouvelle/Modifier Mesure */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingMeasurement ? 'Modifier la Mesure' : 'Nouvelle Mesure Thermique'}
              </h3>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form className="space-y-4">
              {/* Sélection Échangeur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sélectionner un échangeur
                </label>
                <select
                  value={formData.exchangerType}
                  onChange={(e) => setFormData({...formData, exchangerType: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choisir un échangeur...</option>
                  <option value="echangeur-1">Échangeur Principal #1</option>
                  <option value="echangeur-2">Échangeur Principal #2</option>
                  <option value="echangeur-secours">Échangeur de Secours</option>
                </select>
              </div>

              {/* Températures */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    T° Entrée Chaud (huile) (°C)
                  </label>
                  <input
                    type="number"
                    value={formData.hotInletTemp}
                    onChange={(e) => setFormData({...formData, hotInletTemp: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="85"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    T° Sortie Chaud (huile) (°C)
                  </label>
                  <input
                    type="number"
                    value={formData.hotOutletTemp}
                    onChange={(e) => setFormData({...formData, hotOutletTemp: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="75"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    T° Entrée Froid (eau) (°C)
                  </label>
                  <input
                    type="number"
                    value={formData.coldInletTemp}
                    onChange={(e) => setFormData({...formData, coldInletTemp: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    T° Sortie Froid (eau) (°C)
                  </label>
                  <input
                    type="number"
                    value={formData.coldOutletTemp}
                    onChange={(e) => setFormData({...formData, coldOutletTemp: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="30"
                  />
                </div>
              </div>

              {/* Débits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Débit Chaud (kg/s)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.hotFlowRate}
                    onChange={(e) => setFormData({...formData, hotFlowRate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Débit Froid (kg/s)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.coldFlowRate}
                    onChange={(e) => setFormData({...formData, coldFlowRate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="3.0"
                  />
                </div>
              </div>

              {/* Boutons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={editingMeasurement ? handleUpdate : handleCreate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingMeasurement ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
