// =============================================================================
// DART Study Monitor – SEND/SENDIG-DART Domain Types
// =============================================================================

// ---------------------------------------------------------------------------
// Study
// ---------------------------------------------------------------------------
export type StudyType = 'EFD' | 'Fertility' | 'PPND' | 'DNT';
export type StudyStatus = 'ongoing' | 'completed' | 'scheduled';
export type Species = 'rat' | 'rabbit';

export interface StudyDesign {
  ichType: string;          // e.g. "ICH S5(R3)"
  dosingWindow: string;     // e.g. "GD6–GD17"
  numberOfGroups: number;
  damsPerGroup: number;
}

export interface Study {
  studyId: string;
  studyName: string;
  testArticle: string;
  species: Species;
  strain: string;
  route: string;
  glpFlag: boolean;
  startDate: string;        // ISO date
  endDate: string | null;
  studyType: StudyType;
  status: StudyStatus;
  design: StudyDesign;
}

// ---------------------------------------------------------------------------
// Group (Dose Group)
// ---------------------------------------------------------------------------
export interface Group {
  groupId: string;
  studyId: string;
  name: string;             // "Control", "Low", "Mid", "High"
  doseLevel: number;        // mg/kg/day
  doseUnits: string;
  sex: 'female' | 'male' | 'both';
  plannedDams: number;
  actualDams: number;
}

// ---------------------------------------------------------------------------
// Body‑weight / Food‑consumption time‑series points
// ---------------------------------------------------------------------------
export interface BodyWeightRecord {
  day: number;              // GD or PND
  dayType: 'GD' | 'PND';
  weight: number;           // grams
  changeFromBaseline: number; // %
}

export interface FoodConsumptionRecord {
  dayStart: number;
  dayEnd: number;
  dayType: 'GD' | 'PND';
  consumption: number;      // g/day
}

export interface ClinicalObservation {
  day: number;
  dayType: 'GD' | 'PND';
  findingTerm: string;      // e.g. "piloerection", "decreased activity"
  severity: Severity;
}

// ---------------------------------------------------------------------------
// Animal / Dam
// ---------------------------------------------------------------------------
export type PregnancyStatus = 'pregnant' | 'not pregnant' | 'aborted' | 'N/A';

export interface Animal {
  animalId: string;
  studyId: string;
  groupId: string;
  sex: 'female' | 'male';
  litterId: string | null;
  matingPairId: string | null;
  pregnancyStatus: PregnancyStatus;
  maternalDeathFlag: boolean;
  maternalTerminationReason: string | null;
  bodyWeights: BodyWeightRecord[];
  foodConsumption: FoodConsumptionRecord[];
  clinicalObservations: ClinicalObservation[];
}

// ---------------------------------------------------------------------------
// Litter
// ---------------------------------------------------------------------------
export interface Litter {
  litterId: string;
  studyId: string;
  damAnimalId: string;
  groupId: string;
  implantations: number;
  corporaLutea: number;
  resorptionsEarly: number;
  resorptionsLate: number;
  liveFetuses: number;
  deadFetuses: number;
  sexRatio: number;           // proportion male
  litterWeight: number;       // grams, sum of fetal weights
  meanFetalWeight: number;
  // PPND-specific
  postnatalPups?: number;
  pupsSurvivingPND4?: number;
  pupsSurvivingPND21?: number;
}

// ---------------------------------------------------------------------------
// Fetus / Pup
// ---------------------------------------------------------------------------
export type ExamType = 'external' | 'visceral' | 'skeletal';
export type ViabilityStatus = 'live' | 'dead';

export interface FetalFinding {
  findingCode: string;
  findingTerm: string;
  classification: 'malformation' | 'variation';
  examType: ExamType;
  laterality: 'left' | 'right' | 'bilateral' | 'N/A';
  location: string;          // anatomical site
}

export interface Fetus {
  fetusId: string;
  litterId: string;
  studyId: string;
  groupId: string;
  sex: 'male' | 'female';
  weight: number;
  viabilityStatus: ViabilityStatus;
  examType: ExamType;
  findings: FetalFinding[];
  gestationalDayOfObservation: number;
}

// ---------------------------------------------------------------------------
// Pup (for PPND studies)
// ---------------------------------------------------------------------------
export interface PupWeightRecord {
  day: number;               // PND
  weight: number;            // grams
}

export interface DevelopmentalMilestone {
  milestone: string;         // "eye opening", "pinna detachment"
  dayAchieved: number | null; // PND; null = not yet achieved
}

export interface Pup {
  pupId: string;
  litterId: string;
  studyId: string;
  groupId: string;
  sex: 'male' | 'female';
  viabilityStatus: ViabilityStatus;
  deathDay: number | null;   // PND of death, null if alive
  bodyWeights: PupWeightRecord[];
  milestones: DevelopmentalMilestone[];
  neurobehaviorScore: number | null; // composite mock score
}

// ---------------------------------------------------------------------------
// Finding (study‑level coded finding)
// ---------------------------------------------------------------------------
export type Severity = 'none' | 'minimal' | 'mild' | 'moderate' | 'severe';
export type FindingScope = 'maternal' | 'fetal' | 'pup';
export type FindingLevel = 'animal' | 'litter' | 'fetus';
export type FindingDomain =
  | 'maternal clinical sign'
  | 'fetal external malformation'
  | 'fetal external variation'
  | 'fetal visceral malformation'
  | 'fetal visceral variation'
  | 'fetal skeletal malformation'
  | 'fetal skeletal variation'
  | 'pup developmental milestone'
  | 'pup mortality';

export interface Finding {
  findingId: string;
  studyId: string;
  scope: FindingScope;
  level: FindingLevel;
  domain: FindingDomain;
  findingCode: string;
  findingTerm: string;
  severity: Severity;
  doseRelatedFlag: boolean;
  timepoint: string;         // e.g. "GD20", "PND21"
}

// ---------------------------------------------------------------------------
// Timepoint / Visit
// ---------------------------------------------------------------------------
export interface Timepoint {
  timepointId: string;
  studyId: string;
  dayType: 'GD' | 'PND';
  day: number;
  visitLabel: string;        // e.g. "GD6", "Cesarean section"
}

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------
export type AlertCategory = 'maternal' | 'developmental' | 'postnatal';
export type AlertSeverity = 'red' | 'yellow' | 'green';

export interface Alert {
  alertId: string;
  studyId: string;
  groupId: string | null;
  category: AlertCategory;
  severity: AlertSeverity;
  message: string;
  endpoint: string;          // which tab/view this alert relates to
}

// ---------------------------------------------------------------------------
// Full study dataset (used by data loader)
// ---------------------------------------------------------------------------
export interface StudyDataset {
  study: Study;
  groups: Group[];
  animals: Animal[];
  litters: Litter[];
  fetuses: Fetus[];
  pups: Pup[];
  findings: Finding[];
  timepoints: Timepoint[];
}

// ---------------------------------------------------------------------------
// API response types
// ---------------------------------------------------------------------------
export interface StudySummary extends Study {
  riskBadge: AlertSeverity;
  totalDams: number;
  percentPregnant: number;
  lastRefresh: string;       // ISO timestamp
  activeAlerts: number;
}

export interface OverviewData {
  study: Study;
  maternalToxicityStatus: string;
  developmentalToxicityStatus: string;
  bodyWeightByGroup: GroupTimeSeries[];
  foodConsumptionByGroup: GroupTimeSeries[];
  pregnancyOutcomeByGroup: PregnancyOutcome[];
  alerts: Alert[];
}

export interface GroupTimeSeries {
  groupName: string;
  groupId: string;
  doseLevel: number;
  data: { day: number; mean: number; sem: number }[];
}

export interface PregnancyOutcome {
  groupName: string;
  groupId: string;
  pregnant: number;
  notPregnant: number;
  aborted: number;
}

export interface MaternalData {
  bodyWeight: GroupTimeSeries[];
  bodyWeightChange: GroupTimeSeries[];
  foodConsumption: GroupTimeSeries[];
  clinicalSignsIncidence: ClinicalSignIncidence[];
}

export interface ClinicalSignIncidence {
  findingTerm: string;
  groups: { groupName: string; groupId: string; incidence: number; total: number }[];
}

export interface LitterData {
  implantations: GroupBoxData[];
  earlyResorptions: GroupBoxData[];
  lateResorptions: GroupBoxData[];
  liveFetuses: GroupBoxData[];
  preImplantationLoss: GroupBoxData[];
  postImplantationLoss: GroupBoxData[];
  fetalWeights: GroupBoxData[];
  litterSummaryTable: LitterSummaryRow[];
}

export interface GroupBoxData {
  groupName: string;
  groupId: string;
  values: number[];
  mean: number;
  median: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
}

export interface LitterSummaryRow {
  groupName: string;
  doseLevel: number;
  dams: number;
  pregnantDams: number;
  littersEvaluated: number;
  meanLitterSize: number;
  meanImplantations: number;
  meanResorptions: number;
  meanLiveFetuses: number;
  meanFetalWeight: number;
}

export interface FetalFindingsData {
  incidenceTable: FetalFindingRow[];
  categories: string[];
}

export interface FetalFindingRow {
  findingTerm: string;
  findingCode: string;
  examType: ExamType;
  classification: 'malformation' | 'variation';
  groups: {
    groupName: string;
    groupId: string;
    affectedLitters: number;
    totalLitters: number;
    percentLitters: number;
    affectedFetuses: number;
    totalFetuses: number;
    percentFetuses: number;
  }[];
}

export interface PostnatalData {
  pupWeightByGroup: GroupTimeSeries[];
  pupWeightByGroupAndSex: { sex: string; series: GroupTimeSeries[] }[];
  milestoneIncidence: MilestoneIncidence[];
  neurobehaviorByGroup: GroupBoxData[];
}

export interface MilestoneIncidence {
  milestone: string;
  groups: {
    groupName: string;
    groupId: string;
    meanDay: number;
    percentDelayed: number;
  }[];
}

export interface CrossStudyData {
  studies: {
    studyId: string;
    studyName: string;
    species: string;
    studyType: string;
  }[];
  endpoints: string[];
  heatmap: {
    studyId: string;
    endpoint: string;
    groups: { groupName: string; value: number; severity: AlertSeverity }[];
  }[];
}
