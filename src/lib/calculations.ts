// Utilitaires de calcul pour les indicateurs de performance GMAO
import type { Equipment, Breakdown, MaintenanceTask } from './storage';

export interface PerformanceMetrics {
  mtbf: number; // Mean Time Between Failures (heures)
  mttr: number; // Mean Time To Repair (heures)
  availability: number; // Disponibilité (%)
  interventionCount: number; // Nombre d'interventions
}

export interface EquipmentMetrics extends PerformanceMetrics {
  equipmentId: string;
  equipmentName: string;
  period: string;
}

export class PerformanceCalculator {
  
  /**
   * Calcule la MTBF (Mean Time Between Failures)
   * MTBF = Temps total de fonctionnement / Nombre de pannes
   */
  static calculateMTBF(
    equipmentId: string, 
    breakdowns: Breakdown[], 
    periodStart: Date, 
    periodEnd: Date
  ): number {
    const equipmentBreakdowns = breakdowns.filter(b => 
      b.equipmentId === equipmentId &&
      new Date(b.startTime) >= periodStart &&
      new Date(b.startTime) <= periodEnd
    );

    if (equipmentBreakdowns.length === 0) {
      // Si aucune panne, MTBF = période totale
      return (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60);
    }

    // Temps total de la période en heures
    const totalPeriodHours = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60);
    
    // Temps total d'arrêt dû aux pannes
    let totalDowntimeHours = 0;
    equipmentBreakdowns.forEach(breakdown => {
      if (breakdown.endTime) {
        const startTime = Math.max(new Date(breakdown.startTime).getTime(), periodStart.getTime());
        const endTime = Math.min(new Date(breakdown.endTime).getTime(), periodEnd.getTime());
        totalDowntimeHours += (endTime - startTime) / (1000 * 60 * 60);
      }
    });

    const operatingTime = totalPeriodHours - totalDowntimeHours;
    return operatingTime / equipmentBreakdowns.length;
  }

  /**
   * Calcule la MTTR (Mean Time To Repair)
   * MTTR = Somme des temps de réparation / Nombre de pannes
   */
  static calculateMTTR(
    equipmentId: string, 
    breakdowns: Breakdown[], 
    periodStart: Date, 
    periodEnd: Date
  ): number {
    const equipmentBreakdowns = breakdowns.filter(b => 
      b.equipmentId === equipmentId &&
      new Date(b.startTime) >= periodStart &&
      new Date(b.startTime) <= periodEnd &&
      b.endTime // Seulement les pannes résolues
    );

    if (equipmentBreakdowns.length === 0) {
      return 0;
    }

    const totalRepairTime = equipmentBreakdowns.reduce((total, breakdown) => {
      if (breakdown.endTime) {
        const repairTime = (new Date(breakdown.endTime).getTime() - new Date(breakdown.startTime).getTime()) / (1000 * 60 * 60);
        return total + repairTime;
      }
      return total;
    }, 0);

    return totalRepairTime / equipmentBreakdowns.length;
  }

  /**
   * Calcule la disponibilité d'un équipement
   * Disponibilité = (Temps de fonctionnement / Temps total) * 100
   */
  static calculateAvailability(
    equipmentId: string, 
    breakdowns: Breakdown[], 
    maintenanceTasks: MaintenanceTask[],
    periodStart: Date, 
    periodEnd: Date
  ): number {
    const totalPeriodHours = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60);
    
    // Temps d'arrêt dû aux pannes
    const equipmentBreakdowns = breakdowns.filter(b => 
      b.equipmentId === equipmentId &&
      new Date(b.startTime) >= periodStart &&
      new Date(b.startTime) <= periodEnd
    );

    let breakdownDowntime = 0;
    equipmentBreakdowns.forEach(breakdown => {
      if (breakdown.endTime) {
        const startTime = Math.max(new Date(breakdown.startTime).getTime(), periodStart.getTime());
        const endTime = Math.min(new Date(breakdown.endTime).getTime(), periodEnd.getTime());
        breakdownDowntime += (endTime - startTime) / (1000 * 60 * 60);
      }
    });

    // Temps d'arrêt dû à la maintenance préventive
    const equipmentMaintenance = maintenanceTasks.filter(t => 
      t.equipmentId === equipmentId &&
      t.status === 'completed' &&
      t.completedDate &&
      new Date(t.scheduledDate) >= periodStart &&
      new Date(t.scheduledDate) <= periodEnd
    );

    const maintenanceDowntime = equipmentMaintenance.reduce((total, task) => {
      return total + (task.actualDuration || task.estimatedDuration);
    }, 0);

    const totalDowntime = breakdownDowntime + maintenanceDowntime;
    const uptime = totalPeriodHours - totalDowntime;
    
    return Math.max(0, (uptime / totalPeriodHours) * 100);
  }

  /**
   * Compte le nombre d'interventions (pannes + maintenance)
   */
  static calculateInterventionCount(
    equipmentId: string, 
    breakdowns: Breakdown[], 
    maintenanceTasks: MaintenanceTask[],
    periodStart: Date, 
    periodEnd: Date
  ): number {
    const equipmentBreakdowns = breakdowns.filter(b => 
      b.equipmentId === equipmentId &&
      new Date(b.startTime) >= periodStart &&
      new Date(b.startTime) <= periodEnd
    ).length;

    const equipmentMaintenance = maintenanceTasks.filter(t => 
      t.equipmentId === equipmentId &&
      new Date(t.scheduledDate) >= periodStart &&
      new Date(t.scheduledDate) <= periodEnd
    ).length;

    return equipmentBreakdowns + equipmentMaintenance;
  }

  /**
   * Calcule tous les indicateurs pour un équipement
   */
  static calculateEquipmentMetrics(
    equipment: Equipment,
    breakdowns: Breakdown[], 
    maintenanceTasks: MaintenanceTask[],
    periodStart: Date, 
    periodEnd: Date
  ): EquipmentMetrics {
    const mtbf = this.calculateMTBF(equipment.id, breakdowns, periodStart, periodEnd);
    const mttr = this.calculateMTTR(equipment.id, breakdowns, periodStart, periodEnd);
    const availability = this.calculateAvailability(equipment.id, breakdowns, maintenanceTasks, periodStart, periodEnd);
    const interventionCount = this.calculateInterventionCount(equipment.id, breakdowns, maintenanceTasks, periodStart, periodEnd);

    return {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      mtbf,
      mttr,
      availability,
      interventionCount,
      period: `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`
    };
  }

  /**
   * Calcule les indicateurs globaux pour tous les équipements
   */
  static calculateGlobalMetrics(
    equipments: Equipment[],
    breakdowns: Breakdown[], 
    maintenanceTasks: MaintenanceTask[],
    periodStart: Date, 
    periodEnd: Date
  ): PerformanceMetrics {
    const equipmentMetrics = equipments.map(equipment => 
      this.calculateEquipmentMetrics(equipment, breakdowns, maintenanceTasks, periodStart, periodEnd)
    );

    // Calcul des moyennes pondérées
    const totalMtbf = equipmentMetrics.reduce((sum, metrics) => sum + metrics.mtbf, 0);
    const totalMttr = equipmentMetrics.reduce((sum, metrics) => sum + metrics.mttr, 0);
    const totalAvailability = equipmentMetrics.reduce((sum, metrics) => sum + metrics.availability, 0);
    const totalInterventions = equipmentMetrics.reduce((sum, metrics) => sum + metrics.interventionCount, 0);

    const equipmentCount = equipments.length;

    return {
      mtbf: equipmentCount > 0 ? totalMtbf / equipmentCount : 0,
      mttr: equipmentCount > 0 ? totalMttr / equipmentCount : 0,
      availability: equipmentCount > 0 ? totalAvailability / equipmentCount : 0,
      interventionCount: totalInterventions
    };
  }

  /**
   * Génère des données historiques pour les graphiques
   */
  static generateHistoricalData(
    equipments: Equipment[],
    breakdowns: Breakdown[], 
    maintenanceTasks: MaintenanceTask[],
    monthsBack: number = 12
  ): Array<{
    month: string;
    mtbf: number;
    mttr: number;
    availability: number;
    interventions: number;
  }> {
    const data = [];
    const now = new Date();

    for (let i = monthsBack - 1; i >= 0; i--) {
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      
      const metrics = this.calculateGlobalMetrics(equipments, breakdowns, maintenanceTasks, periodStart, periodEnd);
      
      data.push({
        month: periodStart.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' }),
        mtbf: Math.round(metrics.mtbf * 10) / 10,
        mttr: Math.round(metrics.mttr * 10) / 10,
        availability: Math.round(metrics.availability * 10) / 10,
        interventions: metrics.interventionCount
      });
    }

    return data;
  }

  /**
   * Détermine le statut de performance basé sur les seuils
   */
  static getPerformanceStatus(availability: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (availability >= 95) return 'excellent';
    if (availability >= 90) return 'good';
    if (availability >= 80) return 'warning';
    return 'critical';
  }

  /**
   * Calcule les tendances (amélioration/dégradation)
   */
  static calculateTrend(currentValue: number, previousValue: number): 'up' | 'down' | 'stable' {
    const threshold = 0.05; // 5% de seuil
    const change = (currentValue - previousValue) / previousValue;
    
    if (Math.abs(change) < threshold) return 'stable';
    return change > 0 ? 'up' : 'down';
  }
}

export default PerformanceCalculator;
