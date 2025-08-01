# GMAO Dangote - Gestion de Maintenance Assistée par Ordinateur

## 📋 Description du Projet

GMAO Dangote est une application web de **Gestion de Maintenance Assistée par Ordinateur** spécialement conçue pour **Dangote Cement Cameroon**. Cette application permet de calculer et suivre les indicateurs de performance de maintenance (MTBF, MTTR, disponibilité) et de gérer l'ensemble des équipements industriels.

## 🎯 Objectifs Principaux

- **Calcul des indicateurs de performance** : MTBF (Mean Time Between Failures), MTTR (Mean Time To Repair), taux de disponibilité
- **Gestion des équipements** : Suivi en temps réel des équipements industriels (échangeurs thermiques, tours de refroidissement, pompes, filtres)
- **Planification de maintenance** : Maintenance préventive et corrective avec notifications automatiques
- **Stockage local** : Fonctionnement sans base de données backend (localStorage)
- **Interface responsive** : Adaptée aux différents appareils (desktop, tablet, mobile)

## 🏭 Équipements Gérés

- **Échangeurs thermiques** (Heat Exchangers)
- **Tours de refroidissement** (Cooling Towers) 
- **Pompes à eau** (Water Pumps)
- **Pompes à huile** (Oil Pumps)
- **Pré-filtres à eau** (Water Prefilters)
- **Filtres à eau** (Water Filters)
- **Filtres à huile** (Oil Filters)

## 📊 Indicateurs Calculés

### MTBF (Mean Time Between Failures)
- Temps moyen entre les pannes
- Indicateur de fiabilité des équipements

### MTTR (Mean Time To Repair)  
- Temps moyen de réparation
- Indicateur d'efficacité de maintenance

### Taux de Disponibilité
- Pourcentage de temps où l'équipement est opérationnel
- Formule : `Disponibilité = (Temps total - Temps d'arrêt) / Temps total × 100`

### Nombre d'Interventions
- Comptage des interventions de maintenance par période

## 🔐 Système d'Authentification

### Comptes de Démonstration
- **Ingénieur** : `engineer` / `password123`
- **Maintenance** : `maintenance` / `password123` 
- **Administrateur** : `admin` / `password123`

### Rôles et Permissions
- **Engineer** : Consultation et analyse des données
- **Maintenance** : Gestion des tâches de maintenance
- **Admin** : Administration complète du système

## 🛠️ Technologies Utilisées

### Frontend
- **Next.js 14.2.5** - Framework React avec rendu côté serveur
- **TypeScript** - Typage statique pour une meilleure robustesse
- **Tailwind CSS** - Framework CSS utilitaire pour le design
- **React 18.2.0** - Bibliothèque d'interface utilisateur

### Visualisation des Données
- **Chart.js 4.5.0** - Graphiques et visualisations
- **react-chartjs-2** - Intégration React pour Chart.js

### Icônes et Interface
- **Lucide React** - Icônes modernes et cohérentes

### Stockage
- **localStorage API** - Stockage local côté navigateur
- **Pas de base de données** - Fonctionnement autonome

## 📱 Fonctionnalités

### Dashboard Principal
- Vue d'ensemble des métriques globales
- Statut en temps réel des équipements
- Alertes et notifications prioritaires
- Graphiques de performance

### Gestion des Équipements
- Catalogue complet des équipements
- Statuts : Opérationnel, Maintenance, Panne, Hors ligne
- Historique des interventions
- Spécifications techniques

### Planification de Maintenance
- Tâches préventives et correctives
- Calendrier de maintenance
- Attribution des tâches
- Suivi des délais

### Système de Notifications
- Alertes de maintenance due
- Notifications de pannes
- Seuils de capteurs dépassés
- Tâches en retard

### Capteurs et Monitoring
- Surveillance température et pression
- Alertes basées sur des seuils
- Historique des mesures

## 🚀 Installation et Déploiement

### Prérequis
- Node.js 18.18.0 ou supérieur
- npm ou yarn

### Installation Locale
```bash
# Cloner le repository
git clone https://github.com/BlondeQueen/gmao.git
cd gmao/gmao-dangote

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Construire pour la production
npm run build

# Lancer en production
npm run start
```

### Déploiement Vercel
L'application est configurée pour être déployée automatiquement sur Vercel lors des commits sur la branche `master`.

## 📁 Structure du Projet

```
gmao-dangote/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Page de connexion
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Dashboard principal
│   │   └── globals.css        # Styles globaux
│   └── lib/
│       ├── storage.ts         # Gestion du stockage local
│       ├── calculations.ts    # Calculs de performance
│       └── notifications.ts   # Système de notifications
├── public/                    # Assets publics
├── package.json              # Dépendances et scripts
├── next.config.js            # Configuration Next.js
├── tailwind.config.ts        # Configuration Tailwind
└── tsconfig.json             # Configuration TypeScript
```

## 🔄 Cycle de Développement

1. **Développement local** avec `npm run dev`
2. **Tests et validation** avec `npm run build`
3. **Commit des changements** sur GitHub
4. **Déploiement automatique** sur Vercel

## 📞 Support et Contact

Pour toute question ou support technique concernant l'application GMAO Dangote :

- **Email** : support@dangote-cement-cameroon.com
- **Documentation** : Consultez les fichiers de documentation du projet
- **Issues** : Utilisez le système d'issues GitHub pour reporter les bugs

## 📄 Licence

© 2025 Dangote Cement Cameroon - Tous droits réservés

---

**Développé pour Dangote Cement Cameroon** 🏭  
*Optimisation de la maintenance industrielle par la technologie*
