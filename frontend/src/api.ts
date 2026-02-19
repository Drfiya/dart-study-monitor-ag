/**
 * API client — fetches data from the DART Study Monitor backend.
 * All functions return typed JSON responses.
 */

const BASE_URL = '/api';

async function fetchJSON<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
}

async function postJSON<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, { method: 'POST' });
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
}

// ── Study listing ───────────────────────────────────────────────────────────
export interface StudySummary {
    studyId: string;
    studyName: string;
    testArticle: string;
    species: string;
    strain: string;
    route: string;
    glpFlag: boolean;
    startDate: string;
    endDate: string | null;
    studyType: string;
    status: string;
    design: {
        ichType: string;
        dosingWindow: string;
        numberOfGroups: number;
        damsPerGroup: number;
    };
    riskBadge: 'red' | 'yellow' | 'green';
    totalDams: number;
    percentPregnant: number;
    lastRefresh: string;
    activeAlerts: number;
}

export function fetchStudies(): Promise<StudySummary[]> {
    return fetchJSON('/studies');
}

// ── Study overview ──────────────────────────────────────────────────────────
export interface GroupTimeSeriesPoint {
    day: number;
    mean: number;
    sem: number;
}

export interface GroupTimeSeries {
    groupName: string;
    groupId: string;
    doseLevel: number;
    data: GroupTimeSeriesPoint[];
}

export interface PregnancyOutcome {
    groupName: string;
    groupId: string;
    pregnant: number;
    notPregnant: number;
    aborted: number;
}

export interface Alert {
    alertId: string;
    studyId: string;
    groupId: string | null;
    category: string;
    severity: 'red' | 'yellow' | 'green';
    message: string;
    endpoint: string;
}

export interface OverviewData {
    study: StudySummary;
    maternalToxicityStatus: string;
    developmentalToxicityStatus: string;
    bodyWeightByGroup: GroupTimeSeries[];
    foodConsumptionByGroup: GroupTimeSeries[];
    pregnancyOutcomeByGroup: PregnancyOutcome[];
    alerts: Alert[];
}

export function fetchOverview(studyId: string): Promise<OverviewData> {
    return fetchJSON(`/studies/${studyId}/overview`);
}

// ── Maternal data ───────────────────────────────────────────────────────────
export interface ClinicalSignIncidence {
    findingTerm: string;
    groups: { groupName: string; groupId: string; incidence: number; total: number }[];
}

export interface MaternalData {
    bodyWeight: GroupTimeSeries[];
    bodyWeightChange: GroupTimeSeries[];
    foodConsumption: GroupTimeSeries[];
    clinicalSignsIncidence: ClinicalSignIncidence[];
}

export function fetchMaternalData(studyId: string): Promise<MaternalData> {
    return fetchJSON(`/studies/${studyId}/maternal`);
}

// ── Litter data ─────────────────────────────────────────────────────────────
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

export function fetchLitterData(studyId: string): Promise<LitterData> {
    return fetchJSON(`/studies/${studyId}/litter`);
}

// ── Fetal findings ──────────────────────────────────────────────────────────
export interface FetalFindingRow {
    findingTerm: string;
    findingCode: string;
    examType: string;
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

export interface FetalFindingsData {
    incidenceTable: FetalFindingRow[];
    categories: string[];
}

export function fetchFetalData(studyId: string): Promise<FetalFindingsData> {
    return fetchJSON(`/studies/${studyId}/fetal`);
}

// ── Postnatal data ──────────────────────────────────────────────────────────
export interface MilestoneIncidence {
    milestone: string;
    groups: {
        groupName: string;
        groupId: string;
        meanDay: number;
        percentDelayed: number;
    }[];
}

export interface PostnatalData {
    pupWeightByGroup: GroupTimeSeries[];
    pupWeightByGroupAndSex: { sex: string; series: GroupTimeSeries[] }[];
    milestoneIncidence: MilestoneIncidence[];
    neurobehaviorByGroup: GroupBoxData[];
}

export function fetchPostnatalData(studyId: string): Promise<PostnatalData> {
    return fetchJSON(`/studies/${studyId}/postnatal`);
}

// ── Animals ─────────────────────────────────────────────────────────────────
export interface AnimalDetail {
    animalId: string;
    studyId: string;
    groupId: string;
    groupName: string;
    doseLevel: number;
    sex: string;
    pregnancyStatus: string;
    maternalDeathFlag: boolean;
    maternalTerminationReason: string | null;
    bodyWeights: { day: number; dayType: string; weight: number; changeFromBaseline: number }[];
    foodConsumption: { dayStart: number; dayEnd: number; dayType: string; consumption: number }[];
    clinicalObservations: { day: number; dayType: string; findingTerm: string; severity: string }[];
    litter: any | null;
    fetuses: any[];
    pups: any[];
}

export function fetchAnimals(studyId: string): Promise<AnimalDetail[]> {
    return fetchJSON(`/studies/${studyId}/animals`);
}

// ── Alerts ───────────────────────────────────────────────────────────────────
export function fetchAlerts(studyId: string): Promise<Alert[]> {
    return fetchJSON(`/studies/${studyId}/alerts`);
}

// ── Cross-study ─────────────────────────────────────────────────────────────
export interface CrossStudyData {
    studies: { studyId: string; studyName: string; species: string; studyType: string }[];
    endpoints: string[];
    heatmap: {
        studyId: string;
        endpoint: string;
        groups: { groupName: string; value: number; severity: 'red' | 'yellow' | 'green' }[];
    }[];
}

export function fetchCrossStudyData(): Promise<CrossStudyData> {
    return fetchJSON('/cross-study');
}

// ── Refresh ─────────────────────────────────────────────────────────────────
export function refreshData(): Promise<{ refreshCount: number; lastRefreshTime: string }> {
    return postJSON('/refresh');
}
