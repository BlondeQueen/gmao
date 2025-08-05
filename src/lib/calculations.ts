// Utilitaires de calcul pour les indicateurs de performance GMAO
import type { Equipment, Breakdown, MaintenanceTask } from './storage';

export interface PerformanceMetrics {
  mtbf: number; // Mean Time Between Failures (heures)
  mttr: number; // Mean Time To Repair (heures)
  availability: number; // Disponibilité (%)
  interventionCount: number; // Nombre d'interventions
}

export interface TheoreticalMetrics {
  observedMtbf: number; // MTBF calculée à partir des données historiques
  observedMttr: number; // MTTR calculée à partir des données historiques
  observedAvailability: number; // Disponibilité calculée à partir des temps d'arrêt
  theoreticalAvailability: number; // Disponibilité théorique = MTBF/(MTBF+MTTR)
  consistencyCheck: {
    isConsistent: boolean; // Vérifie si les données respectent la relation théorique
    deviation: number; // Écart entre observé et théorique (%)
  };
}

export interface EquipmentMetrics extends PerformanceMetrics {
  equipmentId: string;
  equipmentName: string;
  period: string;
}

// Nouvelles interfaces pour l'efficacité des échangeurs de chaleur
export interface ThermalData {
  timestamp: string;
  hotInletTemp: number;    // Température entrée fluide chaud (°C)
  hotOutletTemp: number;   // Température sortie fluide chaud (°C)
  coldInletTemp: number;   // Température entrée fluide froid (°C)
  coldOutletTemp: number;  // Température sortie fluide froid (°C)
  flowRateHot: number;     // Débit fluide chaud (kg/s)
  flowRateCold: number;    // Débit fluide froid (kg/s)
}

export interface HeatExchangerEfficiency {
  equipmentId: string;
  equipmentName: string;
  currentEfficiency: number;        // Efficacité actuelle (%)
  designEfficiency: number;         // Efficacité de conception (%)
  degradationRate: number;          // Taux de dégradation (%/mois)
  predictedMaintenanceDate: string; // Date de maintenance prédite
  recommendedAction: 'none' | 'monitoring' | 'cleaning' | 'maintenance' | 'replacement';
  alertLevel: 'green' | 'yellow' | 'orange' | 'red';
  lastCalculationDate: string;
  thermodynamicData: {
    actualHeatTransfer: number;     // Transfert thermique réel (kW)
    maxPossibleHeatTransfer: number; // Transfert thermique maximum théorique (kW)
    ntu: number;                    // Number of Transfer Units
    effectiveness: number;          // Efficacité thermodynamique
  };
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
   * Calcule la disponibilité théorique basée sur MTBF et MTTR
   * Formule: Availability = MTBF / (MTBF + MTTR)
   * Cette méthode respecte la relation théorique de fiabilité
   */
  static calculateTheoreticalAvailability(mtbf: number, mttr: number): number {
    if (mtbf <= 0 || mttr <= 0) {
      return 0;
    }
    return (mtbf / (mtbf + mttr)) * 100;
  }

  /**
   * Calcule la MTBF théorique basée sur la disponibilité et MTTR
   * Formule inversée: MTBF = (Availability × MTTR) / (1 - Availability)
   */
  static calculateTheoreticalMTBF(availability: number, mttr: number): number {
    if (availability <= 0 || availability >= 100 || mttr <= 0) {
      return 0;
    }
    const availabilityDecimal = availability / 100;
    return (availabilityDecimal * mttr) / (1 - availabilityDecimal);
  }

  /**
   * Calcule la MTTR théorique basée sur la disponibilité et MTBF
   * Formule inversée: MTTR = MTBF × (1 - Availability) / Availability
   */
  static calculateTheoreticalMTTR(availability: number, mtbf: number): number {
    if (availability <= 0 || availability >= 100 || mtbf <= 0) {
      return 0;
    }
    const availabilityDecimal = availability / 100;
    return (mtbf * (1 - availabilityDecimal)) / availabilityDecimal;
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
   * Calcule les métriques avec vérification de cohérence théorique
   * Vérifie si la relation Availability = MTBF/(MTBF+MTTR) est respectée
   */
  static calculateTheoreticalEquipmentMetrics(
    equipment: Equipment,
    breakdowns: Breakdown[], 
    maintenanceTasks: MaintenanceTask[],
    periodStart: Date, 
    periodEnd: Date
  ): TheoreticalMetrics {
    const observedMtbf = this.calculateMTBF(equipment.id, breakdowns, periodStart, periodEnd);
    const observedMttr = this.calculateMTTR(equipment.id, breakdowns, periodStart, periodEnd);
    const observedAvailability = this.calculateAvailability(equipment.id, breakdowns, maintenanceTasks, periodStart, periodEnd);
    
    // Calcul de la disponibilité théorique basée sur MTBF et MTTR
    const theoreticalAvailability = this.calculateTheoreticalAvailability(observedMtbf, observedMttr);
    
    // Vérification de cohérence
    const deviation = Math.abs(observedAvailability - theoreticalAvailability);
    const isConsistent = deviation <= 5; // Seuil de 5% d'écart acceptable
    
    return {
      observedMtbf,
      observedMttr,
      observedAvailability,
      theoreticalAvailability,
      consistencyCheck: {
        isConsistent,
        deviation
      }
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

/**
 * Classe pour l'analyse de l'efficacité des échangeurs de chaleur
 * Calcule l'efficacité thermique et prédit les besoins de maintenance
 */
export class HeatExchangerAnalyzer {
  
  /**
   * Calcule l'efficacité d'un échangeur de chaleur
   * Méthode ε-NTU (Effectiveness-Number of Transfer Units)
   */
  static calculateEffectiveness(thermalData: ThermalData): number {
    const { hotInletTemp, hotOutletTemp, coldInletTemp, coldOutletTemp } = thermalData;
    
    // Calcul de l'efficacité basé sur le fluide avec la plus petite capacité thermique
    const hotSideDelta = hotInletTemp - hotOutletTemp;
    const coldSideDelta = coldOutletTemp - coldInletTemp;
    const maxPossibleDelta = hotInletTemp - coldInletTemp;
    
    if (maxPossibleDelta <= 0) return 0;
    
    // L'efficacité est basée sur le transfert thermique réel vs maximum possible
    const actualEfficiency = Math.max(hotSideDelta, coldSideDelta) / maxPossibleDelta;
    
    return Math.min(100, Math.max(0, actualEfficiency * 100));
  }

  /**
   * Calcule le transfert thermique réel (en kW)
   */
  static calculateActualHeatTransfer(thermalData: ThermalData): number {
    const { hotInletTemp, hotOutletTemp, flowRateHot } = thermalData;
    const cp = 4.18; // Capacité thermique spécifique de l'eau (kJ/kg·K)
    
    const deltaT = hotInletTemp - hotOutletTemp;
    const heatTransfer = flowRateHot * cp * deltaT;
    
    return heatTransfer; // kW
  }

  /**
   * Calcule le transfert thermique maximum théorique
   */
  static calculateMaxHeatTransfer(thermalData: ThermalData): number {
    const { hotInletTemp, coldInletTemp, flowRateHot, flowRateCold } = thermalData;
    const cp = 4.18; // Capacité thermique spécifique de l'eau (kJ/kg·K)
    
    const minFlowRate = Math.min(flowRateHot, flowRateCold);
    const maxDeltaT = hotInletTemp - coldInletTemp;
    
    return minFlowRate * cp * maxDeltaT; // kW
  }

  /**
   * Évalue l'état d'un échangeur et recommande des actions
   */
  static evaluateHeatExchanger(
    equipment: Equipment,
    thermalDataHistory: ThermalData[],
    designEfficiency: number = 85 // Efficacité de conception par défaut
  ): HeatExchangerEfficiency {
    
    if (thermalDataHistory.length === 0) {
      return this.createDefaultEfficiencyResult(equipment, designEfficiency);
    }

    // Calcul de l'efficacité actuelle (moyenne des 10 dernières mesures)
    const recentData = thermalDataHistory.slice(-10);
    const efficiencies = recentData.map(data => this.calculateEffectiveness(data));
    const currentEfficiency = efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length;

    // Calcul du taux de dégradation (sur les 30 derniers jours)
    const degradationRate = this.calculateDegradationRate(thermalDataHistory);

    // Calcul des données thermodynamiques
    const latestData = thermalDataHistory[thermalDataHistory.length - 1];
    const actualHeatTransfer = this.calculateActualHeatTransfer(latestData);
    const maxPossibleHeatTransfer = this.calculateMaxHeatTransfer(latestData);

    // Détermination du niveau d'alerte et actions recommandées
    const { alertLevel, recommendedAction } = this.determineAlertLevel(currentEfficiency, designEfficiency, degradationRate);

    // Prédiction de la date de maintenance
    const predictedMaintenanceDate = this.predictMaintenanceDate(currentEfficiency, degradationRate, designEfficiency);

    return {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      currentEfficiency: Math.round(currentEfficiency * 100) / 100,
      designEfficiency,
      degradationRate: Math.round(degradationRate * 100) / 100,
      predictedMaintenanceDate,
      recommendedAction,
      alertLevel,
      lastCalculationDate: new Date().toISOString(),
      thermodynamicData: {
        actualHeatTransfer: Math.round(actualHeatTransfer * 100) / 100,
        maxPossibleHeatTransfer: Math.round(maxPossibleHeatTransfer * 100) / 100,
        ntu: this.calculateNTU(latestData),
        effectiveness: Math.round(currentEfficiency * 100) / 100
      }
    };
  }

  /**
   * Calcule le taux de dégradation de l'efficacité (%/mois)
   */
  private static calculateDegradationRate(thermalDataHistory: ThermalData[]): number {
    if (thermalDataHistory.length < 2) return 0;

    // Prendre les données des 3 derniers mois pour calculer la tendance
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentData = thermalDataHistory.filter(data => 
      new Date(data.timestamp) >= threeMonthsAgo
    );

    if (recentData.length < 2) return 0;

    // Calculer l'efficacité pour chaque point
    const efficiencyPoints = recentData.map(data => ({
      date: new Date(data.timestamp),
      efficiency: this.calculateEffectiveness(data)
    }));

    // Régression linéaire simple pour calculer la tendance
    const firstPoint = efficiencyPoints[0];
    const lastPoint = efficiencyPoints[efficiencyPoints.length - 1];
    
    const timeDiffMonths = (lastPoint.date.getTime() - firstPoint.date.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const efficiencyDiff = lastPoint.efficiency - firstPoint.efficiency;

    return timeDiffMonths > 0 ? efficiencyDiff / timeDiffMonths : 0;
  }

  /**
   * Détermine le niveau d'alerte et l'action recommandée
   */
  private static determineAlertLevel(
    currentEfficiency: number, 
    designEfficiency: number, 
    degradationRate: number
  ): { alertLevel: 'green' | 'yellow' | 'orange' | 'red', recommendedAction: 'none' | 'monitoring' | 'cleaning' | 'maintenance' | 'replacement' } {
    
    const efficiencyRatio = currentEfficiency / designEfficiency;
    
    // Efficacité très dégradée (< 60% de l'efficacité de conception)
    if (efficiencyRatio < 0.6) {
      return { alertLevel: 'red', recommendedAction: 'replacement' };
    }
    
    // Efficacité dégradée (60-75% de l'efficacité de conception)
    if (efficiencyRatio < 0.75) {
      return { alertLevel: 'orange', recommendedAction: 'maintenance' };
    }
    
    // Efficacité en baisse (75-85% de l'efficacité de conception)
    if (efficiencyRatio < 0.85) {
      return { alertLevel: 'yellow', recommendedAction: 'cleaning' };
    }
    
    // Dégradation rapide détectée (> 2% par mois)
    if (degradationRate < -2) {
      return { alertLevel: 'yellow', recommendedAction: 'monitoring' };
    }
    
    // Efficacité normale
    return { alertLevel: 'green', recommendedAction: 'none' };
  }

  /**
   * Prédit la date de maintenance basée sur le taux de dégradation
   */
  private static predictMaintenanceDate(
    currentEfficiency: number, 
    degradationRate: number, 
    designEfficiency: number
  ): string {
    
    const maintenanceThreshold = designEfficiency * 0.75; // 75% de l'efficacité de conception
    
    if (degradationRate >= 0 || currentEfficiency <= maintenanceThreshold) {
      // Si pas de dégradation ou déjà en dessous du seuil
      return new Date().toISOString().split('T')[0];
    }
    
    const monthsUntilMaintenance = (currentEfficiency - maintenanceThreshold) / Math.abs(degradationRate);
    const maintenanceDate = new Date();
    maintenanceDate.setMonth(maintenanceDate.getMonth() + Math.ceil(monthsUntilMaintenance));
    
    return maintenanceDate.toISOString().split('T')[0];
  }

  /**
   * Calcule le NTU (Number of Transfer Units)
   */
  private static calculateNTU(thermalData: ThermalData): number {
    const effectiveness = this.calculateEffectiveness(thermalData) / 100;
    
    // Approximation pour un échangeur à contre-courant
    if (effectiveness >= 0.99) return 10; // Limite pratique
    
    return -Math.log(1 - effectiveness);
  }

  /**
   * Crée un résultat par défaut si pas de données disponibles
   */
  private static createDefaultEfficiencyResult(equipment: Equipment, designEfficiency: number): HeatExchangerEfficiency {
    return {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      currentEfficiency: designEfficiency,
      designEfficiency,
      degradationRate: 0,
      predictedMaintenanceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Dans 3 mois
      recommendedAction: 'monitoring',
      alertLevel: 'green',
      lastCalculationDate: new Date().toISOString(),
      thermodynamicData: {
        actualHeatTransfer: 0,
        maxPossibleHeatTransfer: 0,
        ntu: 0,
        effectiveness: designEfficiency
      }
    };
  }
}

export default PerformanceCalculator;
