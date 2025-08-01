'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Plus, 
  Search,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';
import StorageManager, { type Equipment } from '@/lib/storage';

interface StockItem {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  unitPrice: number;
  supplier: string;
  location: string;
  equipmentIds: string[];
  lastUpdated: string;
}

export default function StockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
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

    // Charger les équipements
    const equipmentsData = storageManager.getEquipments();
    setEquipments(equipmentsData);

    // Générer des données de stock d'exemple
    const sampleStockItems: StockItem[] = [
      {
        id: '1',
        name: 'Roulement SKF 6308',
        description: 'Roulement à billes radial',
        category: 'Roulements',
        quantity: 15,
        minQuantity: 5,
        unit: 'pièce',
        unitPrice: 45.50,
        supplier: 'SKF Cameroun',
        location: 'Magasin A - Étagère 3',
        equipmentIds: [equipmentsData[0]?.id || ''],
        lastUpdated: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Courroie trapézoïdale A50',
        description: 'Courroie de transmission',
        category: 'Courroies',
        quantity: 2,
        minQuantity: 10,
        unit: 'pièce',
        unitPrice: 25.00,
        supplier: 'Continental',
        location: 'Magasin B - Zone 1',
        equipmentIds: [equipmentsData[1]?.id || ''],
        lastUpdated: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Huile hydraulique ISO 46',
        description: 'Huile pour systèmes hydrauliques',
        category: 'Lubrifiants',
        quantity: 200,
        minQuantity: 50,
        unit: 'litres',
        unitPrice: 8.75,
        supplier: 'Shell Cameroun',
        location: 'Magasin C - Cuve 2',
        equipmentIds: [equipmentsData[2]?.id || ''],
        lastUpdated: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Joint torique NBR 30x3',
        description: 'Joint d\'étanchéité',
        category: 'Joints',
        quantity: 50,
        minQuantity: 20,
        unit: 'pièce',
        unitPrice: 1.25,
        supplier: 'Trelleborg',
        location: 'Magasin A - Tiroir 12',
        equipmentIds: [equipmentsData[0]?.id || '', equipmentsData[1]?.id || ''],
        lastUpdated: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Filtre à air K1234',
        description: 'Filtre pour compresseur',
        category: 'Filtres',
        quantity: 3,
        minQuantity: 8,
        unit: 'pièce',
        unitPrice: 35.00,
        supplier: 'Mann Filter',
        location: 'Magasin B - Étagère 5',
        equipmentIds: [equipmentsData[3]?.id || ''],
        lastUpdated: new Date().toISOString()
      }
    ];

    setStockItems(sampleStockItems);
    setLoading(false);
  }, [router, storageManager]);

  const getEquipmentName = (equipmentId: string) => {
    const equipment = equipments.find(e => e.id === equipmentId);
    return equipment ? equipment.name : 'Équipement inconnu';
  };

  const getStockStatus = (item: StockItem) => {
    if (item.quantity === 0) return 'out';
    if (item.quantity <= item.minQuantity) return 'low';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out': return 'bg-red-100 text-red-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      case 'normal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'out': return 'Rupture';
      case 'low': return 'Stock faible';
      case 'normal': return 'Normal';
      default: return status;
    }
  };

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    
    const status = getStockStatus(item);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(stockItems.map(item => item.category)));

  const getStockStatistics = () => {
    const total = stockItems.length;
    const outOfStock = stockItems.filter(item => getStockStatus(item) === 'out').length;
    const lowStock = stockItems.filter(item => getStockStatus(item) === 'low').length;
    const totalValue = stockItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    return { total, outOfStock, lowStock, totalValue };
  };

  const stats = getStockStatistics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du stock...</p>
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
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestion du Stock</h1>
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
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Articles totaux</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{stats.outOfStock}</div>
                <div className="text-sm text-gray-600">Ruptures</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{stats.lowStock}</div>
                <div className="text-sm text-gray-600">Stock faible</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                </div>
                <div className="text-sm text-gray-600">Valeur totale</div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre d'outils */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Rechercher un article..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 text-black bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtre par catégorie */}
              <select
                title="Filtrer par catégorie"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">Toutes les catégories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Filtre par statut */}
              <select
                title="Filtrer par statut"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="normal">Normal</option>
                <option value="low">Stock faible</option>
                <option value="out">Rupture</option>
              </select>
            </div>

            {/* Bouton d'ajout */}
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Nouvel Article</span>
            </button>
          </div>
        </div>

        {/* Liste des articles */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Valeur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Emplacement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-700">{item.description}</div>
                          <div className="text-xs text-gray-600">Fournisseur: {item.supplier}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.quantity} {item.unit}
                        </div>
                        <div className="text-xs text-gray-700">
                          Min: {item.minQuantity} {item.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(item.quantity * item.unitPrice).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                        </div>
                        <div className="text-xs text-gray-700">
                          {item.unitPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}/ {item.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            title="Modifier l'article"
                            className="text-blue-600 hover:text-blue-900 p-1"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            title="Supprimer l'article"
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-600" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun article trouvé</h3>
              <p className="mt-1 text-sm text-gray-700">
                Aucun article ne correspond aux critères de recherche.
              </p>
            </div>
          )}
        </div>

        {/* Alertes de stock */}
        {(stats.outOfStock > 0 || stats.lowStock > 0) && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <h3 className="ml-2 text-lg font-medium text-yellow-800">Alertes de Stock</h3>
            </div>
            <div className="mt-4 space-y-2">
              {stats.outOfStock > 0 && (
                <div className="text-sm text-yellow-700">
                  <strong>{stats.outOfStock}</strong> article(s) en rupture de stock nécessitent une commande urgente.
                </div>
              )}
              {stats.lowStock > 0 && (
                <div className="text-sm text-yellow-700">
                  <strong>{stats.lowStock}</strong> article(s) ont un stock faible et doivent être réapprovisionnés.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
