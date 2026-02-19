/**
 * Alert engine — evaluates study data against configurable thresholds
 * to generate safety signal alerts.
 */

import type { StudyDataset, Alert, AlertSeverity } from '../types/types.js';
import { THRESHOLDS } from '../config/thresholds.js';

let alertCounter = 0;
function alertId(): string {
    return `ALT-${String(++alertCounter).padStart(4, '0')}`;
}

/** Compute the mean of an array of numbers. */
function mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Evaluate all alert rules for a study dataset. Returns list of alerts. */
export function evaluateAlerts(dataset: StudyDataset): Alert[] {
    const alerts: Alert[] = [];
    const controlGroup = dataset.groups[0]; // first group is always control

    for (const group of dataset.groups) {
        if (group.groupId === controlGroup.groupId) continue; // skip control vs itself

        const groupAnimals = dataset.animals.filter(a => a.groupId === group.groupId);
        const controlAnimals = dataset.animals.filter(a => a.groupId === controlGroup.groupId);
        const groupLitters = dataset.litters.filter(l => l.groupId === group.groupId);
        const controlLitters = dataset.litters.filter(l => l.groupId === controlGroup.groupId);

        // ── Maternal alerts ───────────────────────────────────────────────────
        checkMaternalBodyWeight(dataset, group, groupAnimals, alerts);
        checkMaternalFoodConsumption(dataset, group, groupAnimals, controlAnimals, alerts);
        checkMaternalDeaths(dataset, group, groupAnimals, alerts);
        checkMaternalClinicalSigns(dataset, group, groupAnimals, alerts);

        // ── Developmental alerts ──────────────────────────────────────────────
        checkResorptions(dataset, group, groupLitters, controlLitters, alerts);
        checkFetalWeight(dataset, group, groupLitters, controlLitters, alerts);
        checkMalformations(dataset, group, groupLitters, alerts);

        // ── Postnatal alerts (PPND only) ──────────────────────────────────────
        if (dataset.pups.length > 0) {
            checkPupMortality(dataset, group, alerts);
            checkPupWeightGain(dataset, group, controlGroup, alerts);
            checkMilestoneDelay(dataset, group, controlGroup, alerts);
        }
    }

    return alerts;
}

// ── Individual check functions ──────────────────────────────────────────────

function checkMaternalBodyWeight(
    dataset: StudyDataset, group: any, groupAnimals: any[], alerts: Alert[]
) {
    // Check if any animal has > X% body weight loss from baseline at any point
    for (const animal of groupAnimals) {
        const worstChange = Math.min(...animal.bodyWeights.map((bw: any) => bw.changeFromBaseline));
        if (worstChange < -THRESHOLDS.maternal.bodyWeightLossPercent) {
            alerts.push({
                alertId: alertId(),
                studyId: dataset.study.studyId,
                groupId: group.groupId,
                category: 'maternal',
                severity: 'red',
                message: `Maternal body weight loss >${THRESHOLDS.maternal.bodyWeightLossPercent}% in ${group.name}`,
                endpoint: 'maternal',
            });
            break; // one alert per group
        }
    }

    // Group-level: mean weight loss
    const baselineWeights = groupAnimals.map((a: any) => a.bodyWeights[0]?.weight).filter(Boolean);
    const lastWeights = groupAnimals.map((a: any) => {
        const bws = a.bodyWeights;
        return bws[bws.length - 1]?.weight;
    }).filter(Boolean);

    if (baselineWeights.length > 0 && lastWeights.length > 0) {
        const meanBaseline = mean(baselineWeights);
        const meanLast = mean(lastWeights);
        const pctChange = ((meanLast - meanBaseline) / meanBaseline) * 100;
        if (pctChange < -THRESHOLDS.maternal.bodyWeightLossPercent * 0.5) {
            alerts.push({
                alertId: alertId(),
                studyId: dataset.study.studyId,
                groupId: group.groupId,
                category: 'maternal',
                severity: pctChange < -THRESHOLDS.maternal.bodyWeightLossPercent ? 'red' : 'yellow',
                message: `Mean maternal body weight change ${pctChange.toFixed(1)}% in ${group.name}`,
                endpoint: 'maternal',
            });
        }
    }
}

function checkMaternalFoodConsumption(
    dataset: StudyDataset, group: any, groupAnimals: any[], controlAnimals: any[], alerts: Alert[]
) {
    // Compare mean food consumption to control
    const groupFC = groupAnimals.flatMap((a: any) => a.foodConsumption.map((fc: any) => fc.consumption));
    const controlFC = controlAnimals.flatMap((a: any) => a.foodConsumption.map((fc: any) => fc.consumption));

    if (groupFC.length > 0 && controlFC.length > 0) {
        const meanGroupFC = mean(groupFC);
        const meanControlFC = mean(controlFC);
        const pctDecrease = ((meanControlFC - meanGroupFC) / meanControlFC) * 100;

        if (pctDecrease > THRESHOLDS.maternal.foodConsumptionDecreasePercent) {
            alerts.push({
                alertId: alertId(),
                studyId: dataset.study.studyId,
                groupId: group.groupId,
                category: 'maternal',
                severity: 'red',
                message: `Food consumption decreased ${pctDecrease.toFixed(0)}% vs control in ${group.name}`,
                endpoint: 'maternal',
            });
        } else if (pctDecrease > THRESHOLDS.maternal.foodConsumptionDecreasePercent * 0.5) {
            alerts.push({
                alertId: alertId(),
                studyId: dataset.study.studyId,
                groupId: group.groupId,
                category: 'maternal',
                severity: 'yellow',
                message: `Food consumption decreased ${pctDecrease.toFixed(0)}% vs control in ${group.name}`,
                endpoint: 'maternal',
            });
        }
    }
}

function checkMaternalDeaths(
    dataset: StudyDataset, group: any, groupAnimals: any[], alerts: Alert[]
) {
    const deaths = groupAnimals.filter((a: any) => a.maternalDeathFlag).length;
    if (deaths >= THRESHOLDS.maternal.deathCount) {
        alerts.push({
            alertId: alertId(),
            studyId: dataset.study.studyId,
            groupId: group.groupId,
            category: 'maternal',
            severity: deaths >= 2 ? 'red' : 'yellow',
            message: `${deaths} maternal death(s) in ${group.name}`,
            endpoint: 'maternal',
        });
    }
}

function checkMaternalClinicalSigns(
    dataset: StudyDataset, group: any, groupAnimals: any[], alerts: Alert[]
) {
    const withSigns = groupAnimals.filter((a: any) => a.clinicalObservations.length > 0).length;
    const pct = (withSigns / groupAnimals.length) * 100;
    if (pct > THRESHOLDS.maternal.clinicalSignIncidencePercent) {
        alerts.push({
            alertId: alertId(),
            studyId: dataset.study.studyId,
            groupId: group.groupId,
            category: 'maternal',
            severity: pct > 50 ? 'red' : 'yellow',
            message: `${pct.toFixed(0)}% dams with clinical signs in ${group.name}`,
            endpoint: 'maternal',
        });
    }
}

function checkResorptions(
    dataset: StudyDataset, group: any, groupLitters: any[], controlLitters: any[], alerts: Alert[]
) {
    const meanEarly = mean(groupLitters.map((l: any) => l.resorptionsEarly));
    const meanLate = mean(groupLitters.map((l: any) => l.resorptionsLate));

    if (meanEarly > THRESHOLDS.developmental.earlyResorptionThreshold) {
        alerts.push({
            alertId: alertId(),
            studyId: dataset.study.studyId,
            groupId: group.groupId,
            category: 'developmental',
            severity: meanEarly > THRESHOLDS.developmental.earlyResorptionThreshold * 1.5 ? 'red' : 'yellow',
            message: `Mean early resorptions ${meanEarly.toFixed(1)}/litter in ${group.name}`,
            endpoint: 'litter',
        });
    }

    if (meanLate > THRESHOLDS.developmental.lateResorptionThreshold) {
        alerts.push({
            alertId: alertId(),
            studyId: dataset.study.studyId,
            groupId: group.groupId,
            category: 'developmental',
            severity: 'yellow',
            message: `Mean late resorptions ${meanLate.toFixed(1)}/litter in ${group.name}`,
            endpoint: 'litter',
        });
    }
}

function checkFetalWeight(
    dataset: StudyDataset, group: any, groupLitters: any[], controlLitters: any[], alerts: Alert[]
) {
    const groupMean = mean(groupLitters.map((l: any) => l.meanFetalWeight));
    const controlMean = mean(controlLitters.map((l: any) => l.meanFetalWeight));

    if (controlMean > 0) {
        const pctDecrease = ((controlMean - groupMean) / controlMean) * 100;
        if (pctDecrease > THRESHOLDS.developmental.fetalWeightDecreasePercent) {
            alerts.push({
                alertId: alertId(),
                studyId: dataset.study.studyId,
                groupId: group.groupId,
                category: 'developmental',
                severity: 'red',
                message: `Mean fetal weight decreased ${pctDecrease.toFixed(0)}% vs control in ${group.name}`,
                endpoint: 'fetal',
            });
        } else if (pctDecrease > THRESHOLDS.developmental.fetalWeightDecreasePercent * 0.5) {
            alerts.push({
                alertId: alertId(),
                studyId: dataset.study.studyId,
                groupId: group.groupId,
                category: 'developmental',
                severity: 'yellow',
                message: `Mean fetal weight decreased ${pctDecrease.toFixed(0)}% vs control in ${group.name}`,
                endpoint: 'fetal',
            });
        }
    }
}

function checkMalformations(
    dataset: StudyDataset, group: any, groupLitters: any[], alerts: Alert[]
) {
    const groupFetuses = dataset.fetuses.filter(f => f.groupId === group.groupId);
    const littersWithMalf = groupLitters.filter((litter: any) => {
        const litterFetuses = dataset.fetuses.filter(f => f.litterId === litter.litterId);
        return litterFetuses.some(f => f.findings.some(ff => ff.classification === 'malformation'));
    }).length;

    const pct = groupLitters.length > 0 ? (littersWithMalf / groupLitters.length) * 100 : 0;
    if (pct > THRESHOLDS.developmental.malformationIncidencePercent) {
        alerts.push({
            alertId: alertId(),
            studyId: dataset.study.studyId,
            groupId: group.groupId,
            category: 'developmental',
            severity: pct > THRESHOLDS.developmental.malformationIncidencePercent * 2 ? 'red' : 'yellow',
            message: `${pct.toFixed(0)}% litters with malformations in ${group.name}`,
            endpoint: 'fetal',
        });
    }
}

function checkPupMortality(
    dataset: StudyDataset, group: any, alerts: Alert[]
) {
    const groupLitters = dataset.litters.filter(l => l.groupId === group.groupId);
    const totalBorn = groupLitters.reduce((sum, l) => sum + (l.postnatalPups ?? 0), 0);
    const survivingPND4 = groupLitters.reduce((sum, l) => sum + (l.pupsSurvivingPND4 ?? 0), 0);
    const mortality = totalBorn > 0 ? ((totalBorn - survivingPND4) / totalBorn) * 100 : 0;

    if (mortality > THRESHOLDS.postnatal.perinatalMortalityPercent) {
        alerts.push({
            alertId: alertId(),
            studyId: dataset.study.studyId,
            groupId: group.groupId,
            category: 'postnatal',
            severity: mortality > THRESHOLDS.postnatal.perinatalMortalityPercent * 2 ? 'red' : 'yellow',
            message: `Perinatal pup mortality ${mortality.toFixed(0)}% in ${group.name}`,
            endpoint: 'postnatal',
        });
    }
}

function checkPupWeightGain(
    dataset: StudyDataset, group: any, controlGroup: any, alerts: Alert[]
) {
    const groupPups = dataset.pups.filter(p => p.groupId === group.groupId && p.viabilityStatus === 'live');
    const controlPups = dataset.pups.filter(p => p.groupId === controlGroup.groupId && p.viabilityStatus === 'live');

    // Compare PND21 weights
    const getLastWeight = (pup: any) => {
        const bws = pup.bodyWeights;
        return bws.length > 0 ? bws[bws.length - 1].weight : 0;
    };

    const groupMean = mean(groupPups.map(getLastWeight));
    const controlMean = mean(controlPups.map(getLastWeight));

    if (controlMean > 0) {
        const pctDecrease = ((controlMean - groupMean) / controlMean) * 100;
        if (pctDecrease > THRESHOLDS.postnatal.pupWeightGainDecreasePercent) {
            alerts.push({
                alertId: alertId(),
                studyId: dataset.study.studyId,
                groupId: group.groupId,
                category: 'postnatal',
                severity: 'red',
                message: `Pup weight gain decreased ${pctDecrease.toFixed(0)}% vs control in ${group.name}`,
                endpoint: 'postnatal',
            });
        }
    }
}

function checkMilestoneDelay(
    dataset: StudyDataset, group: any, controlGroup: any, alerts: Alert[]
) {
    const groupPups = dataset.pups.filter(p => p.groupId === group.groupId && p.viabilityStatus === 'live');
    const controlPups = dataset.pups.filter(p => p.groupId === controlGroup.groupId && p.viabilityStatus === 'live');

    const milestones = new Set<string>();
    dataset.pups.forEach(p => p.milestones.forEach(m => milestones.add(m.milestone)));

    for (const milestone of milestones) {
        const groupDays = groupPups
            .map(p => p.milestones.find(m => m.milestone === milestone)?.dayAchieved)
            .filter((d): d is number => d !== null && d !== undefined);
        const controlDays = controlPups
            .map(p => p.milestones.find(m => m.milestone === milestone)?.dayAchieved)
            .filter((d): d is number => d !== null && d !== undefined);

        if (groupDays.length > 0 && controlDays.length > 0) {
            const delay = mean(groupDays) - mean(controlDays);
            if (delay > THRESHOLDS.postnatal.milestoneDelayDays) {
                alerts.push({
                    alertId: alertId(),
                    studyId: dataset.study.studyId,
                    groupId: group.groupId,
                    category: 'postnatal',
                    severity: delay > THRESHOLDS.postnatal.milestoneDelayDays * 2 ? 'red' : 'yellow',
                    message: `${milestone} delayed ${delay.toFixed(1)} days vs control in ${group.name}`,
                    endpoint: 'postnatal',
                });
            }
        }
    }
}

/** Derive the overall risk badge for a study from its alerts. */
export function deriveRiskBadge(alerts: Alert[]): AlertSeverity {
    if (alerts.some(a => a.severity === 'red')) return 'red';
    if (alerts.some(a => a.severity === 'yellow')) return 'yellow';
    return 'green';
}
