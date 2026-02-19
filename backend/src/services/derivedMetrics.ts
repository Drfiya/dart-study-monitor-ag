/**
 * Derived metrics — computes summary statistics from raw study data.
 * All computations are done in-memory from the loaded JSON datasets.
 */

import type {
    StudyDataset, GroupTimeSeries, PregnancyOutcome,
    ClinicalSignIncidence, GroupBoxData, LitterSummaryRow,
    FetalFindingRow, MilestoneIncidence, PostnatalData,
    MaternalData, LitterData, FetalFindingsData,
} from '../types/types.js';

// ── Statistical helpers ─────────────────────────────────────────────────────

function mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

function sem(values: number[]): number {
    if (values.length <= 1) return 0;
    const m = mean(values);
    const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
    return Math.sqrt(variance / values.length);
}

function median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function quantile(values: number[], q: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return sorted[base + 1] !== undefined
        ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
        : sorted[base];
}

function toBoxData(groupName: string, groupId: string, values: number[]): GroupBoxData {
    return {
        groupName, groupId, values,
        mean: round(mean(values)),
        median: round(median(values)),
        min: values.length > 0 ? round(Math.min(...values)) : 0,
        max: values.length > 0 ? round(Math.max(...values)) : 0,
        q1: round(quantile(values, 0.25)),
        q3: round(quantile(values, 0.75)),
    };
}

function round(v: number, digits = 2): number {
    const factor = 10 ** digits;
    return Math.round(v * factor) / factor;
}

// ── Body weight / food consumption time series ──────────────────────────────

export function computeBodyWeightByGroup(dataset: StudyDataset): GroupTimeSeries[] {
    return dataset.groups.map(group => {
        const groupAnimals = dataset.animals.filter(a => a.groupId === group.groupId);
        // Collect all unique days
        const allDays = new Set<number>();
        groupAnimals.forEach(a => a.bodyWeights.forEach(bw => allDays.add(bw.day)));
        const sortedDays = [...allDays].sort((a, b) => a - b);

        const data = sortedDays.map(day => {
            const weights = groupAnimals
                .map(a => a.bodyWeights.find(bw => bw.day === day)?.weight)
                .filter((w): w is number => w !== undefined);
            return { day, mean: round(mean(weights)), sem: round(sem(weights)) };
        });

        return { groupName: group.name, groupId: group.groupId, doseLevel: group.doseLevel, data };
    });
}

export function computeBodyWeightChangeByGroup(dataset: StudyDataset): GroupTimeSeries[] {
    return dataset.groups.map(group => {
        const groupAnimals = dataset.animals.filter(a => a.groupId === group.groupId);
        const allDays = new Set<number>();
        groupAnimals.forEach(a => a.bodyWeights.forEach(bw => allDays.add(bw.day)));
        const sortedDays = [...allDays].sort((a, b) => a - b);

        const data = sortedDays.map(day => {
            const changes = groupAnimals
                .map(a => a.bodyWeights.find(bw => bw.day === day)?.changeFromBaseline)
                .filter((c): c is number => c !== undefined);
            return { day, mean: round(mean(changes)), sem: round(sem(changes)) };
        });

        return { groupName: group.name, groupId: group.groupId, doseLevel: group.doseLevel, data };
    });
}

export function computeFoodConsumptionByGroup(dataset: StudyDataset): GroupTimeSeries[] {
    return dataset.groups.map(group => {
        const groupAnimals = dataset.animals.filter(a => a.groupId === group.groupId);
        const allIntervals = new Set<number>();
        groupAnimals.forEach(a => a.foodConsumption.forEach(fc => allIntervals.add(fc.dayStart)));
        const sortedStarts = [...allIntervals].sort((a, b) => a - b);

        const data = sortedStarts.map(dayStart => {
            const values = groupAnimals
                .map(a => a.foodConsumption.find(fc => fc.dayStart === dayStart)?.consumption)
                .filter((c): c is number => c !== undefined);
            return { day: dayStart, mean: round(mean(values)), sem: round(sem(values)) };
        });

        return { groupName: group.name, groupId: group.groupId, doseLevel: group.doseLevel, data };
    });
}

// ── Pregnancy outcomes ──────────────────────────────────────────────────────

export function computePregnancyOutcomes(dataset: StudyDataset): PregnancyOutcome[] {
    return dataset.groups.map(group => {
        const groupAnimals = dataset.animals.filter(a => a.groupId === group.groupId);
        return {
            groupName: group.name,
            groupId: group.groupId,
            pregnant: groupAnimals.filter(a => a.pregnancyStatus === 'pregnant').length,
            notPregnant: groupAnimals.filter(a => a.pregnancyStatus === 'not pregnant').length,
            aborted: groupAnimals.filter(a => a.pregnancyStatus === 'aborted').length,
        };
    });
}

// ── Clinical signs incidence ────────────────────────────────────────────────

export function computeClinicalSignsIncidence(dataset: StudyDataset): ClinicalSignIncidence[] {
    // Collect all unique finding terms across all animals
    const termSet = new Set<string>();
    dataset.animals.forEach(a => a.clinicalObservations.forEach(obs => termSet.add(obs.findingTerm)));
    const terms = [...termSet].sort();

    return terms.map(term => ({
        findingTerm: term,
        groups: dataset.groups.map(group => {
            const groupAnimals = dataset.animals.filter(a => a.groupId === group.groupId);
            const affected = groupAnimals.filter(a =>
                a.clinicalObservations.some(obs => obs.findingTerm === term)
            ).length;
            return {
                groupName: group.name,
                groupId: group.groupId,
                incidence: affected,
                total: groupAnimals.length,
            };
        }),
    }));
}

// ── Maternal data bundle ────────────────────────────────────────────────────

export function computeMaternalData(dataset: StudyDataset): MaternalData {
    return {
        bodyWeight: computeBodyWeightByGroup(dataset),
        bodyWeightChange: computeBodyWeightChangeByGroup(dataset),
        foodConsumption: computeFoodConsumptionByGroup(dataset),
        clinicalSignsIncidence: computeClinicalSignsIncidence(dataset),
    };
}

// ── Litter-based metrics ────────────────────────────────────────────────────

export function computeLitterData(dataset: StudyDataset): LitterData {
    const byGroup = (extractor: (l: any) => number) =>
        dataset.groups.map(group => {
            const groupLitters = dataset.litters.filter(l => l.groupId === group.groupId);
            const values = groupLitters.map(extractor);
            return toBoxData(group.name, group.groupId, values);
        });

    const implantations = byGroup(l => l.implantations);
    const earlyResorptions = byGroup(l => l.resorptionsEarly);
    const lateResorptions = byGroup(l => l.resorptionsLate);
    const liveFetuses = byGroup(l => l.liveFetuses);
    const fetalWeights = byGroup(l => l.meanFetalWeight);

    // Pre-implantation loss: (corpora lutea - implantations) / corpora lutea * 100
    const preImplantationLoss = dataset.groups.map(group => {
        const groupLitters = dataset.litters.filter(l => l.groupId === group.groupId);
        const values = groupLitters.map(l =>
            l.corporaLutea > 0 ? round(((l.corporaLutea - l.implantations) / l.corporaLutea) * 100) : 0
        );
        return toBoxData(group.name, group.groupId, values);
    });

    // Post-implantation loss: (implantations - live fetuses) / implantations * 100
    const postImplantationLoss = dataset.groups.map(group => {
        const groupLitters = dataset.litters.filter(l => l.groupId === group.groupId);
        const values = groupLitters.map(l =>
            l.implantations > 0 ? round(((l.implantations - l.liveFetuses) / l.implantations) * 100) : 0
        );
        return toBoxData(group.name, group.groupId, values);
    });

    // Summary table
    const litterSummaryTable: LitterSummaryRow[] = dataset.groups.map(group => {
        const groupAnimals = dataset.animals.filter(a => a.groupId === group.groupId);
        const groupLitters = dataset.litters.filter(l => l.groupId === group.groupId);
        const pregnantDams = groupAnimals.filter(a => a.pregnancyStatus === 'pregnant').length;

        return {
            groupName: group.name,
            doseLevel: group.doseLevel,
            dams: groupAnimals.length,
            pregnantDams,
            littersEvaluated: groupLitters.length,
            meanLitterSize: round(mean(groupLitters.map(l => l.liveFetuses + l.deadFetuses))),
            meanImplantations: round(mean(groupLitters.map(l => l.implantations))),
            meanResorptions: round(mean(groupLitters.map(l => l.resorptionsEarly + l.resorptionsLate))),
            meanLiveFetuses: round(mean(groupLitters.map(l => l.liveFetuses))),
            meanFetalWeight: round(mean(groupLitters.map(l => l.meanFetalWeight))),
        };
    });

    return {
        implantations, earlyResorptions, lateResorptions, liveFetuses,
        preImplantationLoss, postImplantationLoss, fetalWeights, litterSummaryTable,
    };
}

// ── Fetal findings incidence ────────────────────────────────────────────────

export function computeFetalFindingsData(dataset: StudyDataset): FetalFindingsData {
    // Collect all unique fetal finding terms
    const findingMap = new Map<string, { findingCode: string; examType: string; classification: string }>();
    for (const fetus of dataset.fetuses) {
        for (const f of fetus.findings) {
            if (!findingMap.has(f.findingTerm)) {
                findingMap.set(f.findingTerm, {
                    findingCode: f.findingCode,
                    examType: f.examType,
                    classification: f.classification,
                });
            }
        }
    }

    const categories = [...new Set([...findingMap.values()].map(f => f.examType))].sort();

    const incidenceTable: FetalFindingRow[] = [...findingMap.entries()].map(([term, meta]) => ({
        findingTerm: term,
        findingCode: meta.findingCode,
        examType: meta.examType as any,
        classification: meta.classification as any,
        groups: dataset.groups.map(group => {
            const groupLitters = dataset.litters.filter(l => l.groupId === group.groupId);
            const groupFetuses = dataset.fetuses.filter(f => f.groupId === group.groupId);

            const affectedLitters = groupLitters.filter(litter => {
                const litterFetuses = dataset.fetuses.filter(f => f.litterId === litter.litterId);
                return litterFetuses.some(f => f.findings.some(ff => ff.findingTerm === term));
            }).length;

            const affectedFetuses = groupFetuses.filter(f =>
                f.findings.some(ff => ff.findingTerm === term)
            ).length;

            return {
                groupName: group.name,
                groupId: group.groupId,
                affectedLitters,
                totalLitters: groupLitters.length,
                percentLitters: groupLitters.length > 0 ? round((affectedLitters / groupLitters.length) * 100) : 0,
                affectedFetuses,
                totalFetuses: groupFetuses.length,
                percentFetuses: groupFetuses.length > 0 ? round((affectedFetuses / groupFetuses.length) * 100) : 0,
            };
        }),
    }));

    return { incidenceTable, categories };
}

// ── Postnatal data ──────────────────────────────────────────────────────────

export function computePostnatalData(dataset: StudyDataset): PostnatalData {
    if (dataset.pups.length === 0) {
        return {
            pupWeightByGroup: [],
            pupWeightByGroupAndSex: [],
            milestoneIncidence: [],
            neurobehaviorByGroup: [],
        };
    }

    // Pup weight by group (combined sexes)
    const allPNDDays = new Set<number>();
    dataset.pups.forEach(p => p.bodyWeights.forEach(bw => allPNDDays.add(bw.day)));
    const sortedPNDDays = [...allPNDDays].sort((a, b) => a - b);

    const pupWeightByGroup: GroupTimeSeries[] = dataset.groups.map(group => {
        const groupPups = dataset.pups.filter(p => p.groupId === group.groupId && p.viabilityStatus === 'live');
        const data = sortedPNDDays.map(day => {
            const weights = groupPups
                .map(p => p.bodyWeights.find(bw => bw.day === day)?.weight)
                .filter((w): w is number => w !== undefined);
            return { day, mean: round(mean(weights)), sem: round(sem(weights)) };
        });
        return { groupName: group.name, groupId: group.groupId, doseLevel: group.doseLevel, data };
    });

    // By sex
    const pupWeightByGroupAndSex = ['male', 'female'].map(sex => ({
        sex,
        series: dataset.groups.map(group => {
            const groupPups = dataset.pups.filter(
                p => p.groupId === group.groupId && p.sex === sex && p.viabilityStatus === 'live'
            );
            const data = sortedPNDDays.map(day => {
                const weights = groupPups
                    .map(p => p.bodyWeights.find(bw => bw.day === day)?.weight)
                    .filter((w): w is number => w !== undefined);
                return { day, mean: round(mean(weights)), sem: round(sem(weights)) };
            });
            return { groupName: group.name, groupId: group.groupId, doseLevel: group.doseLevel, data };
        }),
    }));

    // Milestone incidence
    const milestoneNames = new Set<string>();
    dataset.pups.forEach(p => p.milestones.forEach(m => milestoneNames.add(m.milestone)));

    const milestoneIncidence: MilestoneIncidence[] = [...milestoneNames].map(milestone => ({
        milestone,
        groups: dataset.groups.map(group => {
            const groupPups = dataset.pups.filter(
                p => p.groupId === group.groupId && p.viabilityStatus === 'live'
            );
            const achieved = groupPups
                .map(p => p.milestones.find(m => m.milestone === milestone)?.dayAchieved)
                .filter((d): d is number => d !== null && d !== undefined);

            // "Delayed" = above control mean + 1 SD
            const controlPups = dataset.pups.filter(
                p => p.groupId === dataset.groups[0].groupId && p.viabilityStatus === 'live'
            );
            const controlDays = controlPups
                .map(p => p.milestones.find(m => m.milestone === milestone)?.dayAchieved)
                .filter((d): d is number => d !== null && d !== undefined);
            const controlMean = mean(controlDays);
            const controlSD = controlDays.length > 1
                ? Math.sqrt(controlDays.reduce((acc, v) => acc + (v - controlMean) ** 2, 0) / (controlDays.length - 1))
                : 1;

            const delayed = achieved.filter(d => d > controlMean + controlSD).length;

            return {
                groupName: group.name,
                groupId: group.groupId,
                meanDay: round(mean(achieved)),
                percentDelayed: achieved.length > 0 ? round((delayed / achieved.length) * 100) : 0,
            };
        }),
    }));

    // Neurobehavior scores
    const neurobehaviorByGroup: GroupBoxData[] = dataset.groups.map(group => {
        const scores = dataset.pups
            .filter(p => p.groupId === group.groupId && p.neurobehaviorScore !== null)
            .map(p => p.neurobehaviorScore as number);
        return toBoxData(group.name, group.groupId, scores);
    });

    return { pupWeightByGroup, pupWeightByGroupAndSex, milestoneIncidence, neurobehaviorByGroup };
}
