// Gestionnaire de stockage local pour l'application GMAO
export interface User {
  id: string;
  username: string;
  role: 'engineer' | 'maintenance' | 'admin';
  name: string;
  email: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'heat_exchanger' | 'cooling_tower' | 'water_pump' | 'oil_pump' | 'water_prefilter' | 'water_filter' | 'oil_filter';
  location: string;
  status: 'operational' | 'maintenance' | 'breakdown' | 'offline';
  installationDate: string;
  nextMaintenanceDate: string;
  manufacturer: string;
  model: string;
  specifications: Record<string, any>;
}

export interface Sensor {
  id: string;
  equipmentId: string;
  type: 'temperature' | 'pressure';
  location: string;
  value: number;
  unit: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
  minThreshold?: number;
  maxThreshold?: number;
}

export interface ThermalReading {
  id: string;
  equipmentId: string;
  timestamp: string;
  hotInletTemp: number;    // Température entrée fluide chaud (°C)
  hotOutletTemp: number;   // Température sortie fluide chaud (°C)
  coldInletTemp: number;   // Température entrée fluide froid (°C)
  coldOutletTemp: number;  // Température sortie fluide froid (°C)
  flowRateHot: number;     // Débit fluide chaud (kg/s)
  flowRateCold: number;    // Débit fluide froid (kg/s)
  efficiency?: number;     // Efficacité calculée (%)
  recordedBy: string;      // Utilisateur qui a enregistré la mesure
}

export interface Breakdown {
  id: string;
  equipmentId: string;
  description: string;
  startTime: string;
  endTime?: string;
  cause: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  photos?: string[];
}

export interface MaintenanceTask {
  id: string;
  equipmentId: string;
  type: 'preventive' | 'corrective';
  title: string;
  description: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number; // en heures
  actualDuration?: number;
  notes?: string;
}

export interface Notification {
  id: string;
  type: 'maintenance_due' | 'breakdown_alert' | 'sensor_alert' | 'task_overdue' | 'low_stock' | 'task_completed' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relatedId?: string; // ID de l'équipement, tâche, etc.
  relatedType?: 'equipment' | 'task' | 'stock' | 'system';
  actionRequired?: boolean;
}

class StorageManager {
  private static instance: StorageManager;

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // Gestion des utilisateurs
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  logout(): void {
    localStorage.removeItem('currentUser');
  }

  // Gestion des équipements
  getEquipments(): Equipment[] {
    const equipments = localStorage.getItem('equipments');
    return equipments ? JSON.parse(equipments) : this.getDefaultEquipments();
  }

  saveEquipments(equipments: Equipment[]): void {
    localStorage.setItem('equipments', JSON.stringify(equipments));
  }

  addEquipment(equipment: Equipment): void {
    const equipments = this.getEquipments();
    equipments.push(equipment);
    this.saveEquipments(equipments);
  }

  updateEquipment(equipmentId: string, updates: Partial<Equipment>): void {
    const equipments = this.getEquipments();
    const index = equipments.findIndex(e => e.id === equipmentId);
    if (index !== -1) {
      equipments[index] = { ...equipments[index], ...updates };
      this.saveEquipments(equipments);
    }
  }

  // Gestion des capteurs
  getSensors(): Sensor[] {
    const sensors = localStorage.getItem('sensors');
    return sensors ? JSON.parse(sensors) : this.getDefaultSensors();
  }

  saveSensors(sensors: Sensor[]): void {
    localStorage.setItem('sensors', JSON.stringify(sensors));
  }

  updateSensorValue(sensorId: string, value: number): void {
    const sensors = this.getSensors();
    const sensor = sensors.find(s => s.id === sensorId);
    if (sensor) {
      sensor.value = value;
      sensor.timestamp = new Date().toISOString();
      
      // Vérifier les seuils
      if (sensor.minThreshold && value < sensor.minThreshold) {
        sensor.status = 'critical';
      } else if (sensor.maxThreshold && value > sensor.maxThreshold) {
        sensor.status = 'critical';
      } else {
        sensor.status = 'normal';
      }
      
      this.saveSensors(sensors);
    }
  }

  // Gestion des pannes
  getBreakdowns(): Breakdown[] {
    const breakdowns = localStorage.getItem('breakdowns');
    return breakdowns ? JSON.parse(breakdowns) : [];
  }

  saveBreakdowns(breakdowns: Breakdown[]): void {
    localStorage.setItem('breakdowns', JSON.stringify(breakdowns));
  }

  addBreakdown(breakdown: Breakdown): void {
    const breakdowns = this.getBreakdowns();
    breakdowns.push(breakdown);
    this.saveBreakdowns(breakdowns);
  }

  // Gestion des tâches de maintenance
  getMaintenanceTasks(): MaintenanceTask[] {
    const tasks = localStorage.getItem('maintenanceTasks');
    return tasks ? JSON.parse(tasks) : this.getDefaultMaintenanceTasks();
  }

  saveMaintenanceTasks(tasks: MaintenanceTask[]): void {
    localStorage.setItem('maintenanceTasks', JSON.stringify(tasks));
  }

  addMaintenanceTask(task: MaintenanceTask): void {
    const tasks = this.getMaintenanceTasks();
    tasks.push(task);
    this.saveMaintenanceTasks(tasks);
  }

  updateMaintenanceTask(taskId: string, updates: Partial<MaintenanceTask>): void {
    const tasks = this.getMaintenanceTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      this.saveMaintenanceTasks(tasks);
    }
  }

  deleteMaintenanceTask(taskId: string): void {
    const tasks = this.getMaintenanceTasks();
    const filteredTasks = tasks.filter(t => t.id !== taskId);
    this.saveMaintenanceTasks(filteredTasks);
  }

  // Gestion des tâches de planning (spécifique au calendrier)
  getPlanningTasks(): any[] {
    const planningTasks = localStorage.getItem('planningTasks');
    if (planningTasks) {
      return JSON.parse(planningTasks);
    }
    // Si pas de tâches de planning spécifiques, utiliser les tâches de maintenance
    return this.getMaintenanceTasks();
  }

  savePlanningTasks(tasks: any[]): void {
    localStorage.setItem('planningTasks', JSON.stringify(tasks));
  }

  addPlanningTask(task: any): void {
    const tasks = this.getPlanningTasks();
    const newTask = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    this.savePlanningTasks(tasks);
  }

  updatePlanningTask(taskId: string, updates: any): void {
    const tasks = this.getPlanningTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      this.savePlanningTasks(tasks);
    }
  }

  deletePlanningTask(taskId: string): void {
    const tasks = this.getPlanningTasks();
    const filteredTasks = tasks.filter(t => t.id !== taskId);
    this.savePlanningTasks(filteredTasks);
  }

  // Gestion des notifications
  getNotifications(): Notification[] {
    const notifications = localStorage.getItem('notifications');
    return notifications ? JSON.parse(notifications) : [];
  }

  saveNotifications(notifications: Notification[]): void {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }

  addNotification(notification: Notification): void {
    const notifications = this.getNotifications();
    notifications.unshift(notification);
    this.saveNotifications(notifications);
  }

  markNotificationAsRead(notificationId: string): void {
    const notifications = this.getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications(notifications);
    }
  }

  // Données par défaut
  private getDefaultEquipments(): Equipment[] {
    const defaultEquipments: Equipment[] = [
      {
        id: 'eq-001',
        name: 'Échangeur Thermique Principal',
        type: 'heat_exchanger',
        location: 'Zone A - Ligne 1',
        status: 'operational',
        installationDate: '2023-01-15',
        nextMaintenanceDate: '2025-02-15',
        manufacturer: 'Alfa Laval',
        model: 'M15-BFG',
        specifications: {
          capacity: '1000 kW',
          maxTemperature: '150°C',
          maxPressure: '10 bar'
        }
      },
      {
        id: 'eq-002',
        name: 'Tour de Refroidissement Nord',
        type: 'cooling_tower',
        location: 'Zone B - Extérieur',
        status: 'operational',
        installationDate: '2022-08-20',
        nextMaintenanceDate: '2025-03-01',
        manufacturer: 'SPX Cooling',
        model: 'Marley NC',
        specifications: {
          capacity: '2000 m³/h',
          height: '15 m',
          fanPower: '45 kW'
        }
      },
      {
        id: 'eq-003',
        name: 'Pompe Eau Primaire',
        type: 'water_pump',
        location: 'Salle des Machines',
        status: 'operational',
        installationDate: '2023-03-10',
        nextMaintenanceDate: '2025-01-20',
        manufacturer: 'Grundfos',
        model: 'CR 64-2',
        specifications: {
          flow: '500 m³/h',
          head: '120 m',
          power: '75 kW'
        }
      },
      {
        id: 'eq-004',
        name: 'Pompe Huile Hydraulique',
        type: 'oil_pump',
        location: 'Zone C - Hydraulique',
        status: 'maintenance',
        installationDate: '2022-11-05',
        nextMaintenanceDate: '2025-01-10',
        manufacturer: 'Bosch Rexroth',
        model: 'A10VSO',
        specifications: {
          displacement: '140 cm³/rev',
          maxPressure: '350 bar',
          power: '30 kW'
        }
      }
    ];

    this.saveEquipments(defaultEquipments);
    return defaultEquipments;
  }

  private getDefaultSensors(): Sensor[] {
    const defaultSensors: Sensor[] = [
      {
        id: 'sen-001',
        equipmentId: 'eq-004',
        type: 'temperature',
        location: 'Filtre Eau - Entrée',
        value: 22.5,
        unit: '°C',
        timestamp: new Date().toISOString(),
        status: 'normal',
        minThreshold: 5,
        maxThreshold: 50
      },
      {
        id: 'sen-002',
        equipmentId: 'eq-004',
        type: 'temperature',
        location: 'Filtre Eau - Sortie',
        value: 24.1,
        unit: '°C',
        timestamp: new Date().toISOString(),
        status: 'normal',
        minThreshold: 5,
        maxThreshold: 50
      },
      {
        id: 'sen-003',
        equipmentId: 'eq-004',
        type: 'temperature',
        location: 'Filtre Huile - Entrée',
        value: 45.3,
        unit: '°C',
        timestamp: new Date().toISOString(),
        status: 'normal',
        minThreshold: 20,
        maxThreshold: 80
      },
      {
        id: 'sen-004',
        equipmentId: 'eq-004',
        type: 'temperature',
        location: 'Filtre Huile - Sortie',
        value: 43.8,
        unit: '°C',
        timestamp: new Date().toISOString(),
        status: 'normal',
        minThreshold: 20,
        maxThreshold: 80
      },
      {
        id: 'sen-005',
        equipmentId: 'eq-004',
        type: 'pressure',
        location: 'Pompe Huile - Sortie',
        value: 285.5,
        unit: 'bar',
        timestamp: new Date().toISOString(),
        status: 'normal',
        minThreshold: 200,
        maxThreshold: 350
      },
      {
        id: 'sen-006',
        equipmentId: 'eq-004',
        type: 'pressure',
        location: 'Pompe Huile - Retour',
        value: 15.2,
        unit: 'bar',
        timestamp: new Date().toISOString(),
        status: 'normal',
        minThreshold: 5,
        maxThreshold: 50
      }
    ];

    this.saveSensors(defaultSensors);
    return defaultSensors;
  }

  private getDefaultMaintenanceTasks(): MaintenanceTask[] {
    const defaultTasks: MaintenanceTask[] = [
      {
        id: 'task-001',
        equipmentId: 'eq-001',
        type: 'preventive',
        title: 'Inspection Échangeur Thermique',
        description: 'Vérification des plaques et joints',
        scheduledDate: '2025-01-15',
        status: 'scheduled',
        frequency: 'monthly',
        priority: 'medium',
        estimatedDuration: 4
      },
      {
        id: 'task-002',
        equipmentId: 'eq-002',
        type: 'preventive',
        title: 'Nettoyage Tour de Refroidissement',
        description: 'Nettoyage des ventilateurs et bassins',
        scheduledDate: '2025-01-10',
        status: 'scheduled',
        frequency: 'weekly',
        priority: 'high',
        estimatedDuration: 8
      }
    ];

    this.saveMaintenanceTasks(defaultTasks);
    return defaultTasks;
  }

  // Gestion des données thermiques des échangeurs
  getThermalReadings(): ThermalReading[] {
    const readings = localStorage.getItem('thermalReadings');
    return readings ? JSON.parse(readings) : this.getDefaultThermalReadings();
  }

  saveThermalReadings(readings: ThermalReading[]): void {
    localStorage.setItem('thermalReadings', JSON.stringify(readings));
  }

  addThermalReading(reading: ThermalReading): void {
    const readings = this.getThermalReadings();
    readings.push(reading);
    this.saveThermalReadings(readings);
  }

  getThermalReadingsByEquipment(equipmentId: string): ThermalReading[] {
    return this.getThermalReadings().filter(reading => reading.equipmentId === equipmentId);
  }

  getRecentThermalReadings(equipmentId: string, days: number = 30): ThermalReading[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.getThermalReadingsByEquipment(equipmentId).filter(reading => 
      new Date(reading.timestamp) >= cutoffDate
    );
  }

  private getDefaultThermalReadings(): ThermalReading[] {
    const now = new Date();
    const defaultReadings: ThermalReading[] = [];

    // Générer des données de test pour les échangeurs de chaleur
    const heatExchangers = this.getEquipments().filter(eq => eq.type === 'heat_exchanger');
    
    heatExchangers.forEach(exchanger => {
      // Générer 30 jours de données avec dégradation progressive
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Simulation de dégradation: efficacité diminue avec le temps
        const degradationFactor = 1 - (i * 0.002); // Perte de 0.2% par jour
        const baseEfficiency = 0.85; // 85% d'efficacité de base
        const currentEfficiency = baseEfficiency * degradationFactor;
        
        // Températures simulées basées sur l'efficacité
        const hotInlet = 85 + Math.random() * 5; // 85-90°C
        const coldInlet = 25 + Math.random() * 3; // 25-28°C
        const deltaT = (hotInlet - coldInlet) * currentEfficiency;
        
        defaultReadings.push({
          id: `thermal-${exchanger.id}-${i}`,
          equipmentId: exchanger.id,
          timestamp: date.toISOString(),
          hotInletTemp: Math.round(hotInlet * 10) / 10,
          hotOutletTemp: Math.round((hotInlet - deltaT * 0.8) * 10) / 10,
          coldInletTemp: Math.round(coldInlet * 10) / 10,
          coldOutletTemp: Math.round((coldInlet + deltaT * 0.6) * 10) / 10,
          flowRateHot: 2.5 + Math.random() * 0.5, // 2.5-3.0 kg/s
          flowRateCold: 3.0 + Math.random() * 0.5, // 3.0-3.5 kg/s
          efficiency: Math.round(currentEfficiency * 100 * 10) / 10,
          recordedBy: 'system'
        });
      }
    });

    this.saveThermalReadings(defaultReadings);
    return defaultReadings;
  }
}

export default StorageManager;
