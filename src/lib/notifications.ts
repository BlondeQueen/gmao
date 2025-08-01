// Gestionnaire de notifications pour l'application GMAO
import StorageManager, { type Notification, type MaintenanceTask, type Sensor } from './storage';

export class NotificationManager {
  private static instance: NotificationManager;
  private storageManager: StorageManager;

  constructor() {
    this.storageManager = StorageManager.getInstance();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Génère un ID unique pour les notifications
   */
  private generateId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Crée une notification de maintenance due
   */
  createMaintenanceNotification(task: MaintenanceTask): void {
    const scheduledDate = new Date(task.scheduledDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    let title = '';
    let message = '';

    if (daysUntilDue < 0) {
      priority = 'urgent';
      title = 'Maintenance en retard';
      message = `La tâche "${task.title}" était due le ${scheduledDate.toLocaleDateString('fr-FR')}`;
    } else if (daysUntilDue === 0) {
      priority = 'high';
      title = 'Maintenance due aujourd\'hui';
      message = `La tâche "${task.title}" est due aujourd'hui`;
    } else if (daysUntilDue <= 3) {
      priority = 'high';
      title = 'Maintenance bientôt due';
      message = `La tâche "${task.title}" est due dans ${daysUntilDue} jour(s)`;
    } else if (daysUntilDue <= 7) {
      priority = 'medium';
      title = 'Maintenance à programmer';
      message = `La tâche "${task.title}" est due dans ${daysUntilDue} jours`;
    }

    if (title && message) {
      const notification: Notification = {
        id: this.generateId(),
        type: 'maintenance_due',
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        priority,
        relatedId: task.id
      };

      this.storageManager.addNotification(notification);
    }
  }

  /**
   * Crée une notification d'alerte capteur
   */
  createSensorAlert(sensor: Sensor): void {
    if (sensor.status === 'critical') {
      let message = '';
      
      if (sensor.minThreshold && sensor.value < sensor.minThreshold) {
        message = `${sensor.type === 'temperature' ? 'Température' : 'Pression'} trop basse: ${sensor.value}${sensor.unit} (min: ${sensor.minThreshold}${sensor.unit})`;
      } else if (sensor.maxThreshold && sensor.value > sensor.maxThreshold) {
        message = `${sensor.type === 'temperature' ? 'Température' : 'Pression'} trop élevée: ${sensor.value}${sensor.unit} (max: ${sensor.maxThreshold}${sensor.unit})`;
      }

      const notification: Notification = {
        id: this.generateId(),
        type: 'sensor_alert',
        title: `Alerte capteur - ${sensor.location}`,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'urgent',
        relatedId: sensor.id
      };

      this.storageManager.addNotification(notification);
    }
  }

  /**
   * Crée une notification de panne
   */
  createBreakdownAlert(equipmentName: string, description: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    
    switch (severity) {
      case 'critical':
        priority = 'urgent';
        break;
      case 'high':
        priority = 'high';
        break;
      case 'medium':
        priority = 'medium';
        break;
      case 'low':
        priority = 'low';
        break;
    }

    const notification: Notification = {
      id: this.generateId(),
      type: 'breakdown_alert',
      title: `Panne signalée - ${equipmentName}`,
      message: description,
      timestamp: new Date().toISOString(),
      read: false,
      priority
    };

    this.storageManager.addNotification(notification);
  }

  /**
   * Vérifie toutes les tâches de maintenance et génère les notifications nécessaires
   */
  checkMaintenanceDue(): void {
    const tasks = this.storageManager.getMaintenanceTasks();
    const now = new Date();
    
    // Vérifier les tâches schedulées
    const scheduledTasks = tasks.filter(task => task.status === 'scheduled');
    
    scheduledTasks.forEach(task => {
      const scheduledDate = new Date(task.scheduledDate);
      const daysUntilDue = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Vérifier si on doit notifier (aujourd'hui, dans 3 jours, dans 7 jours, ou en retard)
      if (daysUntilDue <= 7 || daysUntilDue < 0) {
        // Vérifier si une notification similaire existe déjà
        const existingNotifications = this.storageManager.getNotifications();
        const hasExistingNotification = existingNotifications.some(notif => 
          notif.type === 'maintenance_due' && 
          notif.relatedId === task.id &&
          !notif.read
        );
        
        if (!hasExistingNotification) {
          this.createMaintenanceNotification(task);
        }
      }
    });
  }

  /**
   * Vérifie tous les capteurs et génère les alertes nécessaires
   */
  checkSensorAlerts(): void {
    const sensors = this.storageManager.getSensors();
    
    sensors.forEach(sensor => {
      if (sensor.status === 'critical') {
        // Vérifier si une alerte similaire existe déjà récemment
        const existingNotifications = this.storageManager.getNotifications();
        const recentAlert = existingNotifications.find(notif => 
          notif.type === 'sensor_alert' && 
          notif.relatedId === sensor.id &&
          !notif.read &&
          (new Date().getTime() - new Date(notif.timestamp).getTime()) < (30 * 60 * 1000) // 30 minutes
        );
        
        if (!recentAlert) {
          this.createSensorAlert(sensor);
        }
      }
    });
  }

  /**
   * Génère des notifications pour les tâches récurrentes
   */
  generateRecurringNotifications(): void {
    const tasks = this.storageManager.getMaintenanceTasks();
    const now = new Date();
    
    tasks.forEach(task => {
      if (task.frequency && task.status === 'completed' && task.completedDate) {
        const completedDate = new Date(task.completedDate);
        const nextDueDate = new Date(completedDate);
        
        // Calculer la prochaine date d'échéance basée sur la fréquence
        switch (task.frequency) {
          case 'daily':
            nextDueDate.setDate(completedDate.getDate() + 1);
            break;
          case 'weekly':
            nextDueDate.setDate(completedDate.getDate() + 7);
            break;
          case 'monthly':
            nextDueDate.setMonth(completedDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDueDate.setMonth(completedDate.getMonth() + 3);
            break;
          case 'annually':
            nextDueDate.setFullYear(completedDate.getFullYear() + 1);
            break;
        }
        
        // Si la prochaine échéance est proche, créer une nouvelle tâche
        const daysUntilNext = Math.ceil((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilNext <= 0) {
          const newTask: MaintenanceTask = {
            ...task,
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            scheduledDate: nextDueDate.toISOString().split('T')[0],
            status: 'scheduled',
            completedDate: undefined,
            actualDuration: undefined
          };
          
          this.storageManager.addMaintenanceTask(newTask);
          this.createMaintenanceNotification(newTask);
        }
      }
    });
  }

  /**
   * Exécute toutes les vérifications de notifications
   */
  runAllChecks(): void {
    this.checkMaintenanceDue();
    this.checkSensorAlerts();
    this.generateRecurringNotifications();
  }

  /**
   * Démarre les vérifications automatiques
   */
  startAutoChecks(): void {
    // Vérification immédiate
    this.runAllChecks();
    
    // Vérifications périodiques
    setInterval(() => {
      this.runAllChecks();
    }, 5 * 60 * 1000); // Toutes les 5 minutes
  }

  /**
   * Marque une notification comme lue
   */
  markAsRead(notificationId: string): void {
    this.storageManager.markNotificationAsRead(notificationId);
  }

  /**
   * Obtient le nombre de notifications non lues
   */
  getUnreadCount(): number {
    const notifications = this.storageManager.getNotifications();
    return notifications.filter(notif => !notif.read).length;
  }

  /**
   * Obtient les notifications par priorité
   */
  getNotificationsByPriority(): {
    urgent: Notification[];
    high: Notification[];
    medium: Notification[];
    low: Notification[];
  } {
    const notifications = this.storageManager.getNotifications();
    
    return {
      urgent: notifications.filter(n => n.priority === 'urgent' && !n.read),
      high: notifications.filter(n => n.priority === 'high' && !n.read),
      medium: notifications.filter(n => n.priority === 'medium' && !n.read),
      low: notifications.filter(n => n.priority === 'low' && !n.read)
    };
  }
}

export default NotificationManager;
