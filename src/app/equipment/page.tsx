'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import StorageManager, { type Equipment } from '@/lib/storage';

export default function EquipmentPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'heat_exchanger' as Equipment['type'],
    location: '',
    status: 'operational' as Equipment['status'],
    manufacturer: '',
    model: '',
    installationDate: '',
    nextMaintenanceDate: ''
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

    // Charger les équipements
    const equipmentsData = storageManager.getEquipments();
    setEquipments(equipmentsData);
    setLoading(false);
  }, [router, storageManager]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'heat_exchanger',
      location: '',
      status: 'operational',
      manufacturer: '',
      model: '',
      installationDate: '',
      nextMaintenanceDate: ''
    });
    setEditingEquipment(null);
  };

  const handleAddEquipment = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setFormData({
      name: equipment.name,
      type: equipment.type,
      location: equipment.location,
      status: equipment.status,
      manufacturer: equipment.manufacturer,
      model: equipment.model,
      installationDate: equipment.installationDate,
      nextMaintenanceDate: equipment.nextMaintenanceDate
    });
    setEditingEquipment(equipment);
    setShowModal(true);
  };

  const handleDeleteEquipment = (equipmentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet équipement ?')) {
      const updatedEquipments = equipments.filter(eq => eq.id !== equipmentId);
      setEquipments(updatedEquipments);
      storageManager.saveEquipments(updatedEquipments);
    }
  };

  const handleSaveEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEquipment) {
      // Modifier l'équipement existant
      const updatedEquipment = {
        ...editingEquipment,
        ...formData
      };
      storageManager.updateEquipment(editingEquipment.id, formData);
      const updatedEquipments = equipments.map(eq => 
        eq.id === editingEquipment.id ? updatedEquipment : eq
      );
      setEquipments(updatedEquipments);
    } else {
      // Ajouter un nouvel équipement
      const newEquipment: Equipment = {
        id: `eq-${Date.now()}`,
        ...formData,
        specifications: {}
      };
      storageManager.addEquipment(newEquipment);
      setEquipments([...equipments, newEquipment]);
    }
    
    setShowModal(false);
    resetForm();
  };

  const filteredEquipments = equipments.filter(equipment => {
    const matchesSearch = equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || equipment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'breakdown': return 'bg-red-100 text-red-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational': return 'Opérationnel';
      case 'maintenance': return 'Maintenance';
      case 'breakdown': return 'Panne';
      case 'offline': return 'Hors ligne';
      default: return status;
    }
  };

  const getEquipmentTypeText = (type: string) => {
    switch (type) {
      case 'heat_exchanger': return 'Échangeur thermique';
      case 'cooling_tower': return 'Tour de refroidissement';
      case 'water_pump': return 'Pompe à eau';
      case 'oil_pump': return 'Pompe à huile';
      case 'water_prefilter': return 'Pré-filtre à eau';
      case 'water_filter': return 'Filtre à eau';
      case 'oil_filter': return 'Filtre à huile';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des équipements...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Équipements</h1>
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
        {/* Barre d'outils */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-600" />
                <input
                  type="text"
                  placeholder="Rechercher un équipement..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 text-black bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtre par statut */}
              <div className="relative">
                <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-600" />
                              <select
                title="Filtrer par statut"
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                  <option value="all">Tous les statuts</option>
                  <option value="operational">Opérationnel</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="breakdown">Panne</option>
                  <option value="offline">Hors ligne</option>
                </select>
              </div>
            </div>

            {/* Bouton d'ajout */}
            <button 
              onClick={handleAddEquipment}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Nouvel Équipement</span>
            </button>
          </div>
        </div>

        {/* Liste des équipements */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Équipement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Localisation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Prochaine Maintenance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEquipments.map((equipment) => (
                  <tr key={equipment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {equipment.name}
                        </div>
                        <div className="text-sm text-gray-700">
                          {equipment.manufacturer} - {equipment.model}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getEquipmentTypeText(equipment.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {equipment.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(equipment.status)}`}>
                        {getStatusText(equipment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(equipment.nextMaintenanceDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditEquipment(equipment)}
                          title="Modifier l'équipement"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteEquipment(equipment.id)}
                          title="Supprimer l'équipement"
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEquipments.length === 0 && (
            <div className="text-center py-12">
              <Wrench className="mx-auto h-12 w-12 text-gray-600" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun équipement trouvé</h3>
              <p className="mt-1 text-sm text-gray-700">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Essayez de modifier vos critères de recherche.'
                  : 'Commencez par ajouter un nouvel équipement.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-green-600">
              {equipments.filter(e => e.status === 'operational').length}
            </div>
            <div className="text-sm text-gray-600">Opérationnels</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {equipments.filter(e => e.status === 'maintenance').length}
            </div>
            <div className="text-sm text-gray-600">En maintenance</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-red-600">
              {equipments.filter(e => e.status === 'breakdown').length}
            </div>
            <div className="text-sm text-gray-600">En panne</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-gray-600">
              {equipments.filter(e => e.status === 'offline').length}
            </div>
            <div className="text-sm text-gray-600">Hors ligne</div>
          </div>
        </div>
      </div>

      {/* Modale pour ajouter/modifier un équipement */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingEquipment ? 'Modifier l\'équipement' : 'Nouvel équipement'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Fermer"
                  aria-label="Fermer la modale"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSaveEquipment}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de l'équipement
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type d'équipement
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as Equipment['type']})}
                    >
                      <option value="heat_exchanger">Échangeur thermique</option>
                      <option value="cooling_tower">Tour de refroidissement</option>
                      <option value="water_pump">Pompe à eau</option>
                      <option value="oil_pump">Pompe à huile</option>
                      <option value="water_prefilter">Préfiltre eau</option>
                      <option value="water_filter">Filtre à eau</option>
                      <option value="oil_filter">Filtre à huile</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Localisation
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as Equipment['status']})}
                    >
                      <option value="operational">Opérationnel</option>
                      <option value="maintenance">En maintenance</option>
                      <option value="breakdown">En panne</option>
                      <option value="offline">Hors ligne</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fabricant
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modèle
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date d'installation
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      value={formData.installationDate}
                      onChange={(e) => setFormData({...formData, installationDate: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prochaine maintenance
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      value={formData.nextMaintenanceDate}
                      onChange={(e) => setFormData({...formData, nextMaintenanceDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingEquipment ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
