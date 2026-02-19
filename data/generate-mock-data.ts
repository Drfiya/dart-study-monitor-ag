/**
 * Mock data generator for DART Study Monitor
 * Produces three fully-populated DART study datasets:
 *   - Study A: Rat EFD (embryo-fetal development)
 *   - Study B: Rabbit EFD
 *   - Study C: Rat PPND (pre/postnatal development)
 *
 * Run: npx tsx data/generate-mock-data.ts
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Seeded pseudo-random ────────────────────────────────────────────────────
let _seed = 42;
function rand(): number {
    _seed = (_seed * 16807 + 0) % 2147483647;
    return (_seed - 1) / 2147483646;
}
function randInt(min: number, max: number): number {
    return Math.floor(rand() * (max - min + 1)) + min;
}
function randNormal(mean: number, sd: number): number {
    // Box-Muller
    const u1 = rand() || 0.0001;
    const u2 = rand();
    return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
function pick<T>(arr: T[]): T {
    return arr[randInt(0, arr.length - 1)];
}

// ── Helpers ─────────────────────────────────────────────────────────────────
let idCounter = 0;
function uid(prefix: string): string {
    return `${prefix}-${String(++idCounter).padStart(4, '0')}`;
}

// ── Study A — Rat EFD ───────────────────────────────────────────────────────
function generateStudyA() {
    const studyId = 'STUDY-A';
    const study = {
        studyId,
        studyName: 'XYZ-101 Rat Embryo-Fetal Development Study',
        testArticle: 'XYZ-101',
        species: 'rat' as const,
        strain: 'Sprague-Dawley',
        route: 'oral gavage',
        glpFlag: true,
        startDate: '2025-11-01',
        endDate: null,
        studyType: 'EFD' as const,
        status: 'ongoing' as const,
        design: {
            ichType: 'ICH S5(R3)',
            dosingWindow: 'GD6–GD17',
            numberOfGroups: 4,
            damsPerGroup: 22,
        },
    };

    const groups = [
        { groupId: 'A-G1', studyId, name: 'Vehicle Control', doseLevel: 0, doseUnits: 'mg/kg/day', sex: 'female' as const, plannedDams: 22, actualDams: 22 },
        { groupId: 'A-G2', studyId, name: 'Low (30 mg/kg)', doseLevel: 30, doseUnits: 'mg/kg/day', sex: 'female' as const, plannedDams: 22, actualDams: 22 },
        { groupId: 'A-G3', studyId, name: 'Mid (100 mg/kg)', doseLevel: 100, doseUnits: 'mg/kg/day', sex: 'female' as const, plannedDams: 22, actualDams: 22 },
        { groupId: 'A-G4', studyId, name: 'High (300 mg/kg)', doseLevel: 300, doseUnits: 'mg/kg/day', sex: 'female' as const, plannedDams: 22, actualDams: 22 },
    ];

    const clinicalSignTerms = ['piloerection', 'decreased activity', 'salivation', 'soft stool', 'vaginal bleeding'];
    const gdDays = [0, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const fcIntervals = [[0, 3], [3, 6], [6, 9], [9, 12], [12, 15], [15, 17], [17, 20]];

    // dose-effect parameters
    const doseEffects: Record<string, { bwMultiplier: number; fcMultiplier: number; clinicalProb: number; resorptionExtra: number; malformProb: number; variationProb: number }> = {
        'A-G1': { bwMultiplier: 1.0, fcMultiplier: 1.0, clinicalProb: 0.02, resorptionExtra: 0, malformProb: 0.01, variationProb: 0.03 },
        'A-G2': { bwMultiplier: 0.99, fcMultiplier: 0.98, clinicalProb: 0.03, resorptionExtra: 0, malformProb: 0.01, variationProb: 0.04 },
        'A-G3': { bwMultiplier: 0.96, fcMultiplier: 0.93, clinicalProb: 0.12, resorptionExtra: 0.5, malformProb: 0.03, variationProb: 0.08 },
        'A-G4': { bwMultiplier: 0.88, fcMultiplier: 0.82, clinicalProb: 0.35, resorptionExtra: 1.5, malformProb: 0.10, variationProb: 0.20 },
    };

    const animals: any[] = [];
    const litters: any[] = [];
    const fetuses: any[] = [];
    const findings: any[] = [];

    for (const group of groups) {
        const eff = doseEffects[group.groupId];
        for (let d = 0; d < group.actualDams; d++) {
            const animalId = uid('DAM');
            const litterId = uid('LIT');
            const baseWeight = randNormal(250, 12);

            // Pregnancy status
            const isPregnant = rand() < 0.92;
            const isAborted = isPregnant && group.groupId === 'A-G4' && rand() < 0.08;
            const pregnancyStatus = !isPregnant ? 'not pregnant' : isAborted ? 'aborted' : 'pregnant';
            const isDead = group.groupId === 'A-G4' && rand() < 0.04;

            // Body weights
            const bodyWeights = gdDays.map(day => {
                const normalGain = day <= 6 ? day * 1.5 : day * 2.2;
                const doseEffect = day > 6 ? (1 - eff.bwMultiplier) * baseWeight * ((day - 6) / 14) : 0;
                const weight = Math.round((baseWeight + normalGain - doseEffect + randNormal(0, 3)) * 10) / 10;
                const change = Math.round(((weight - baseWeight) / baseWeight) * 100 * 10) / 10;
                return { day, dayType: 'GD', weight, changeFromBaseline: change };
            });

            // Food consumption
            const foodConsumption = fcIntervals.map(([s, e]) => {
                const baseFC = randNormal(22, 2);
                return {
                    dayStart: s, dayEnd: e, dayType: 'GD',
                    consumption: Math.round(baseFC * eff.fcMultiplier * 10) / 10,
                };
            });

            // Clinical observations
            const clinicalObservations: any[] = [];
            for (const day of gdDays.filter(d => d >= 6)) {
                if (rand() < eff.clinicalProb) {
                    const term = pick(clinicalSignTerms);
                    clinicalObservations.push({
                        day, dayType: 'GD', findingTerm: term,
                        severity: pick(['minimal', 'mild', 'moderate']),
                    });
                }
            }

            animals.push({
                animalId, studyId, groupId: group.groupId, sex: 'female',
                litterId: pregnancyStatus === 'pregnant' ? litterId : null,
                matingPairId: uid('MP'),
                pregnancyStatus,
                maternalDeathFlag: isDead,
                maternalTerminationReason: isDead ? 'found dead' : null,
                bodyWeights, foodConsumption, clinicalObservations,
            });

            // Litter & fetuses — only for pregnant, non-aborted, alive dams
            if (pregnancyStatus === 'pregnant' && !isDead) {
                const corporaLutea = randInt(12, 18);
                const implantations = corporaLutea - randInt(0, 2);
                const earlyResorp = Math.max(0, randInt(0, 2) + Math.round(eff.resorptionExtra * rand()));
                const lateResorp = Math.max(0, randInt(0, 1) + (eff.resorptionExtra > 1 ? randInt(0, 1) : 0));
                const potentialLive = implantations - earlyResorp - lateResorp;
                const deadFetuses = rand() < 0.03 ? 1 : 0;
                const liveFetuses = Math.max(0, potentialLive - deadFetuses);
                const totalFetuses = liveFetuses + deadFetuses;

                const fetalWeightBase = 3.5 * eff.bwMultiplier;
                let litterWeightSum = 0;
                const litterFetuses: any[] = [];

                for (let f = 0; f < totalFetuses; f++) {
                    const fSex = rand() < 0.5 ? 'male' : 'female';
                    const fWeight = Math.round(randNormal(fetalWeightBase, 0.3) * 100) / 100;
                    litterWeightSum += fWeight;
                    const isLive = f < liveFetuses;

                    // Findings
                    const fetalFindings: any[] = [];
                    if (isLive) {
                        // Skeletal variations
                        if (rand() < eff.variationProb) {
                            const term = pick(['wavy rib', 'extra rib', 'reduced ossification of sternebrae', 'incomplete ossification of skull']);
                            fetalFindings.push({
                                findingCode: `SK-V-${term.substring(0, 3).toUpperCase()}`,
                                findingTerm: term,
                                classification: 'variation',
                                examType: 'skeletal',
                                laterality: pick(['left', 'right', 'bilateral', 'N/A']),
                                location: pick(['rib', 'sternebra', 'skull', 'vertebra']),
                            });
                            findings.push({
                                findingId: uid('FND'), studyId, scope: 'fetal', level: 'fetus',
                                domain: 'fetal skeletal variation',
                                findingCode: fetalFindings[fetalFindings.length - 1].findingCode,
                                findingTerm: term,
                                severity: 'minimal', doseRelatedFlag: group.doseLevel >= 100,
                                timepoint: 'GD20',
                            });
                        }
                        // Malformations
                        if (rand() < eff.malformProb) {
                            const term = pick(['cleft palate', 'anophthalmia', 'omphalocele', 'short tail']);
                            fetalFindings.push({
                                findingCode: `EX-M-${term.substring(0, 3).toUpperCase()}`,
                                findingTerm: term,
                                classification: 'malformation',
                                examType: pick(['external', 'visceral']),
                                laterality: pick(['left', 'right', 'bilateral', 'N/A']),
                                location: pick(['head', 'trunk', 'limb']),
                            });
                            findings.push({
                                findingId: uid('FND'), studyId, scope: 'fetal', level: 'fetus',
                                domain: term === 'cleft palate' || term === 'anophthalmia'
                                    ? 'fetal visceral malformation' : 'fetal external malformation',
                                findingCode: fetalFindings[fetalFindings.length - 1].findingCode,
                                findingTerm: term,
                                severity: 'moderate', doseRelatedFlag: group.doseLevel >= 300,
                                timepoint: 'GD20',
                            });
                        }
                        // Visceral variations
                        if (rand() < eff.variationProb * 0.5) {
                            const term = pick(['dilated renal pelvis', 'dilated ureter', 'supernumerary liver lobe']);
                            fetalFindings.push({
                                findingCode: `VI-V-${term.substring(0, 3).toUpperCase()}`,
                                findingTerm: term,
                                classification: 'variation',
                                examType: 'visceral',
                                laterality: pick(['left', 'right', 'bilateral', 'N/A']),
                                location: pick(['kidney', 'ureter', 'liver']),
                            });
                        }
                    }

                    litterFetuses.push({
                        fetusId: uid('FET'), litterId, studyId, groupId: group.groupId,
                        sex: fSex, weight: fWeight,
                        viabilityStatus: isLive ? 'live' : 'dead',
                        examType: pick(['external', 'visceral', 'skeletal']),
                        findings: fetalFindings,
                        gestationalDayOfObservation: 20,
                    });
                }
                fetuses.push(...litterFetuses);

                const maleCount = litterFetuses.filter((f: any) => f.sex === 'male').length;
                litters.push({
                    litterId, studyId, damAnimalId: animalId, groupId: group.groupId,
                    implantations, corporaLutea,
                    resorptionsEarly: earlyResorp, resorptionsLate: lateResorp,
                    liveFetuses, deadFetuses,
                    sexRatio: totalFetuses > 0 ? Math.round((maleCount / totalFetuses) * 100) / 100 : 0,
                    litterWeight: Math.round(litterWeightSum * 100) / 100,
                    meanFetalWeight: totalFetuses > 0 ? Math.round((litterWeightSum / totalFetuses) * 100) / 100 : 0,
                });
            }

            // Add maternal clinical sign findings
            for (const obs of clinicalObservations) {
                findings.push({
                    findingId: uid('FND'), studyId, scope: 'maternal', level: 'animal',
                    domain: 'maternal clinical sign',
                    findingCode: `CS-${obs.findingTerm.substring(0, 4).toUpperCase()}`,
                    findingTerm: obs.findingTerm,
                    severity: obs.severity,
                    doseRelatedFlag: group.doseLevel >= 100,
                    timepoint: `GD${obs.day}`,
                });
            }
        }
    }

    const timepoints = gdDays.map(d => ({
        timepointId: uid('TP'), studyId, dayType: 'GD' as const, day: d,
        visitLabel: d === 20 ? 'Cesarean section' : `GD${d}`,
    }));

    return { study, groups, animals, litters, fetuses, pups: [], findings, timepoints };
}

// ── Study B — Rabbit EFD ────────────────────────────────────────────────────
function generateStudyB() {
    const studyId = 'STUDY-B';
    const study = {
        studyId,
        studyName: 'XYZ-101 Rabbit Embryo-Fetal Development Study',
        testArticle: 'XYZ-101',
        species: 'rabbit' as const,
        strain: 'New Zealand White',
        route: 'oral gavage',
        glpFlag: true,
        startDate: '2025-12-01',
        endDate: null,
        studyType: 'EFD' as const,
        status: 'ongoing' as const,
        design: {
            ichType: 'ICH S5(R3)',
            dosingWindow: 'GD6–GD18',
            numberOfGroups: 4,
            damsPerGroup: 18,
        },
    };

    const groups = [
        { groupId: 'B-G1', studyId, name: 'Vehicle Control', doseLevel: 0, doseUnits: 'mg/kg/day', sex: 'female' as const, plannedDams: 18, actualDams: 18 },
        { groupId: 'B-G2', studyId, name: 'Low (10 mg/kg)', doseLevel: 10, doseUnits: 'mg/kg/day', sex: 'female' as const, plannedDams: 18, actualDams: 18 },
        { groupId: 'B-G3', studyId, name: 'Mid (30 mg/kg)', doseLevel: 30, doseUnits: 'mg/kg/day', sex: 'female' as const, plannedDams: 18, actualDams: 18 },
        { groupId: 'B-G4', studyId, name: 'High (100 mg/kg)', doseLevel: 100, doseUnits: 'mg/kg/day', sex: 'female' as const, plannedDams: 18, actualDams: 18 },
    ];

    const clinicalSignTerms = ['decreased food consumption', 'decreased activity', 'soft stool', 'nasal discharge', 'weight loss'];
    const gdDays = [0, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29];
    const fcIntervals = [[0, 3], [3, 6], [6, 9], [9, 12], [12, 15], [15, 18], [18, 21], [21, 24], [24, 29]];

    const doseEffects: Record<string, { bwMultiplier: number; fcMultiplier: number; clinicalProb: number; resorptionExtra: number; malformProb: number; variationProb: number; abortProb: number; deathProb: number }> = {
        'B-G1': { bwMultiplier: 1.0, fcMultiplier: 1.0, clinicalProb: 0.02, resorptionExtra: 0, malformProb: 0.01, variationProb: 0.02, abortProb: 0.0, deathProb: 0.0 },
        'B-G2': { bwMultiplier: 0.99, fcMultiplier: 0.97, clinicalProb: 0.04, resorptionExtra: 0, malformProb: 0.01, variationProb: 0.03, abortProb: 0.0, deathProb: 0.0 },
        'B-G3': { bwMultiplier: 0.95, fcMultiplier: 0.88, clinicalProb: 0.15, resorptionExtra: 0.5, malformProb: 0.02, variationProb: 0.05, abortProb: 0.05, deathProb: 0.0 },
        'B-G4': { bwMultiplier: 0.87, fcMultiplier: 0.72, clinicalProb: 0.40, resorptionExtra: 2.0, malformProb: 0.04, variationProb: 0.08, abortProb: 0.15, deathProb: 0.10 },
    };

    const animals: any[] = [];
    const litters: any[] = [];
    const fetuses: any[] = [];
    const findings: any[] = [];

    for (const group of groups) {
        const eff = doseEffects[group.groupId];
        for (let d = 0; d < group.actualDams; d++) {
            const animalId = uid('DAM');
            const litterId = uid('LIT');
            const baseWeight = randNormal(3800, 200); // rabbits ~3.5-4kg

            const isPregnant = rand() < 0.88;
            const isAborted = isPregnant && rand() < eff.abortProb;
            const pregnancyStatus = !isPregnant ? 'not pregnant' : isAborted ? 'aborted' : 'pregnant';
            const isDead = rand() < eff.deathProb;

            const bodyWeights = gdDays.map(day => {
                const normalGain = day * 8;
                const doseEffect = day > 6 ? (1 - eff.bwMultiplier) * 500 * ((day - 6) / 23) : 0;
                const weight = Math.round((baseWeight + normalGain - doseEffect + randNormal(0, 40)) * 10) / 10;
                const change = Math.round(((weight - baseWeight) / baseWeight) * 100 * 10) / 10;
                return { day, dayType: 'GD', weight, changeFromBaseline: change };
            });

            const foodConsumption = fcIntervals.map(([s, e]) => ({
                dayStart: s, dayEnd: e, dayType: 'GD',
                consumption: Math.round(randNormal(150, 15) * eff.fcMultiplier * 10) / 10,
            }));

            const clinicalObservations: any[] = [];
            for (const day of gdDays.filter(dd => dd >= 6)) {
                if (rand() < eff.clinicalProb) {
                    clinicalObservations.push({
                        day, dayType: 'GD', findingTerm: pick(clinicalSignTerms),
                        severity: pick(['minimal', 'mild', 'moderate']),
                    });
                }
            }

            animals.push({
                animalId, studyId, groupId: group.groupId, sex: 'female',
                litterId: pregnancyStatus === 'pregnant' ? litterId : null,
                matingPairId: uid('MP'),
                pregnancyStatus,
                maternalDeathFlag: isDead,
                maternalTerminationReason: isDead ? pick(['found dead', 'moribund sacrifice']) : null,
                bodyWeights, foodConsumption, clinicalObservations,
            });

            if (pregnancyStatus === 'pregnant' && !isDead) {
                const corporaLutea = randInt(8, 13);
                const implantations = corporaLutea - randInt(0, 2);
                const earlyResorp = Math.max(0, randInt(0, 1) + Math.round(eff.resorptionExtra * rand()));
                const lateResorp = Math.max(0, randInt(0, 1) + (eff.resorptionExtra > 1 ? randInt(0, 1) : 0));
                const potentialLive = implantations - earlyResorp - lateResorp;
                const deadFetuses = rand() < 0.04 ? 1 : 0;
                const liveFetuses = Math.max(0, potentialLive - deadFetuses);
                const totalFetuses = liveFetuses + deadFetuses;

                const fetalWeightBase = 42 * eff.bwMultiplier; // rabbits ~40-45g
                let litterWeightSum = 0;
                const litterFetuses: any[] = [];

                for (let f = 0; f < totalFetuses; f++) {
                    const fSex = rand() < 0.5 ? 'male' : 'female';
                    const fWeight = Math.round(randNormal(fetalWeightBase, 3) * 100) / 100;
                    litterWeightSum += fWeight;
                    const isLive = f < liveFetuses;

                    const fetalFindings: any[] = [];
                    if (isLive) {
                        if (rand() < eff.variationProb) {
                            const term = pick(['27th presacral vertebra', 'extra rib', 'reduced ossification of sternebrae', 'accessory skull bone']);
                            fetalFindings.push({
                                findingCode: `SK-V-${term.substring(0, 3).toUpperCase()}`,
                                findingTerm: term, classification: 'variation', examType: 'skeletal',
                                laterality: pick(['left', 'right', 'bilateral', 'N/A']),
                                location: pick(['vertebra', 'rib', 'sternebra', 'skull']),
                            });
                        }
                        if (rand() < eff.malformProb) {
                            const term = pick(['hydrocephaly', 'microphthalmia', 'ventricular septal defect']);
                            fetalFindings.push({
                                findingCode: `VI-M-${term.substring(0, 3).toUpperCase()}`,
                                findingTerm: term, classification: 'malformation',
                                examType: 'visceral',
                                laterality: pick(['left', 'right', 'bilateral', 'N/A']),
                                location: pick(['head', 'heart', 'eye']),
                            });
                        }
                    }

                    litterFetuses.push({
                        fetusId: uid('FET'), litterId, studyId, groupId: group.groupId,
                        sex: fSex, weight: fWeight,
                        viabilityStatus: isLive ? 'live' : 'dead',
                        examType: pick(['external', 'visceral', 'skeletal']),
                        findings: fetalFindings, gestationalDayOfObservation: 29,
                    });
                }
                fetuses.push(...litterFetuses);

                const maleCount = litterFetuses.filter((f: any) => f.sex === 'male').length;
                litters.push({
                    litterId, studyId, damAnimalId: animalId, groupId: group.groupId,
                    implantations, corporaLutea,
                    resorptionsEarly: earlyResorp, resorptionsLate: lateResorp,
                    liveFetuses, deadFetuses,
                    sexRatio: totalFetuses > 0 ? Math.round((maleCount / totalFetuses) * 100) / 100 : 0,
                    litterWeight: Math.round(litterWeightSum * 100) / 100,
                    meanFetalWeight: totalFetuses > 0 ? Math.round((litterWeightSum / totalFetuses) * 100) / 100 : 0,
                });
            }

            for (const obs of clinicalObservations) {
                findings.push({
                    findingId: uid('FND'), studyId, scope: 'maternal', level: 'animal',
                    domain: 'maternal clinical sign',
                    findingCode: `CS-${obs.findingTerm.substring(0, 4).toUpperCase()}`,
                    findingTerm: obs.findingTerm, severity: obs.severity,
                    doseRelatedFlag: group.doseLevel >= 30, timepoint: `GD${obs.day}`,
                });
            }
        }
    }

    const timepoints = gdDays.map(d => ({
        timepointId: uid('TP'), studyId, dayType: 'GD' as const, day: d,
        visitLabel: d === 29 ? 'Cesarean section' : `GD${d}`,
    }));

    return { study, groups, animals, litters, fetuses, pups: [], findings, timepoints };
}

// ── Study C — Rat PPND ──────────────────────────────────────────────────────
function generateStudyC() {
    const studyId = 'STUDY-C';
    const study = {
        studyId,
        studyName: 'XYZ-101 Rat Pre- and Postnatal Development Study',
        testArticle: 'XYZ-101',
        species: 'rat' as const,
        strain: 'Sprague-Dawley',
        route: 'oral gavage',
        glpFlag: true,
        startDate: '2025-10-01',
        endDate: '2026-02-15',
        studyType: 'PPND' as const,
        status: 'completed' as const,
        design: {
            ichType: 'ICH S5(R3)',
            dosingWindow: 'GD6–PND21',
            numberOfGroups: 4,
            damsPerGroup: 22,
        },
    };

    const groups = [
        { groupId: 'C-G1', studyId, name: 'Vehicle Control', doseLevel: 0, doseUnits: 'mg/kg/day', sex: 'female' as const, plannedDams: 22, actualDams: 22 },
        { groupId: 'C-G2', studyId, name: 'Low (15 mg/kg)', doseLevel: 15, doseUnits: 'mg/kg/day', sex: 'female' as const, plannedDams: 22, actualDams: 22 },
        { groupId: 'C-G3', studyId, name: 'Mid (50 mg/kg)', doseLevel: 50, doseUnits: 'mg/kg/day', sex: 'female' as const, plannedDams: 22, actualDams: 22 },
        { groupId: 'C-G4', studyId, name: 'High (150 mg/kg)', doseLevel: 150, doseUnits: 'mg/kg/day', sex: 'female' as const, plannedDams: 22, actualDams: 22 },
    ];

    const clinicalSignTerms = ['piloerection', 'decreased activity', 'salivation', 'hunched posture'];
    const gdDays = [0, 3, 6, 9, 12, 15, 17, 20]; // gestation portion
    const pndDays = [0, 1, 4, 7, 14, 21]; // postnatal portion
    const allMaternalDays = [...gdDays.map(d => ({ day: d, dayType: 'GD' as const })), ...pndDays.map(d => ({ day: d, dayType: 'PND' as const }))];
    const fcIntervalsGD = [[0, 3], [3, 6], [6, 9], [9, 12], [12, 15], [15, 17], [17, 20]];
    const fcIntervalsPND = [[0, 4], [4, 7], [7, 14], [14, 21]];

    const doseEffects: Record<string, { bwMultiplier: number; fcMultiplier: number; clinicalProb: number; pupMortProb: number; pupWeightMult: number; eyeOpenDelay: number; pinnaDelay: number; neuroBehaviorDelta: number }> = {
        'C-G1': { bwMultiplier: 1.0, fcMultiplier: 1.0, clinicalProb: 0.02, pupMortProb: 0.03, pupWeightMult: 1.0, eyeOpenDelay: 0, pinnaDelay: 0, neuroBehaviorDelta: 0 },
        'C-G2': { bwMultiplier: 0.99, fcMultiplier: 0.98, clinicalProb: 0.03, pupMortProb: 0.04, pupWeightMult: 0.98, eyeOpenDelay: 0, pinnaDelay: 0, neuroBehaviorDelta: 0 },
        'C-G3': { bwMultiplier: 0.96, fcMultiplier: 0.92, clinicalProb: 0.10, pupMortProb: 0.06, pupWeightMult: 0.93, eyeOpenDelay: 0.5, pinnaDelay: 0, neuroBehaviorDelta: -2 },
        'C-G4': { bwMultiplier: 0.90, fcMultiplier: 0.80, clinicalProb: 0.30, pupMortProb: 0.15, pupWeightMult: 0.82, eyeOpenDelay: 2, pinnaDelay: 1, neuroBehaviorDelta: -5 },
    };

    const animals: any[] = [];
    const litters: any[] = [];
    const pups: any[] = [];
    const findings: any[] = [];

    for (const group of groups) {
        const eff = doseEffects[group.groupId];
        for (let d = 0; d < group.actualDams; d++) {
            const animalId = uid('DAM');
            const litterId = uid('LIT');
            const baseWeight = randNormal(250, 12);

            const isPregnant = rand() < 0.92;
            const pregnancyStatus = isPregnant ? 'pregnant' : 'not pregnant';

            // Dam body weights (GD + PND)
            const bodyWeights = allMaternalDays.map(({ day, dayType }) => {
                let normalGain: number;
                if (dayType === 'GD') {
                    normalGain = day * 2.2;
                } else {
                    // Postpartum: weight drops after delivery then stabilizes
                    normalGain = 35 - day * 0.5;
                }
                const doseEffect = (1 - eff.bwMultiplier) * baseWeight * 0.3;
                const weight = Math.round((baseWeight + normalGain - doseEffect + randNormal(0, 4)) * 10) / 10;
                const change = Math.round(((weight - baseWeight) / baseWeight) * 100 * 10) / 10;
                return { day, dayType, weight, changeFromBaseline: change };
            });

            // Food consumption
            const foodConsumption = [
                ...fcIntervalsGD.map(([s, e]) => ({
                    dayStart: s, dayEnd: e, dayType: 'GD',
                    consumption: Math.round(randNormal(22, 2) * eff.fcMultiplier * 10) / 10,
                })),
                ...fcIntervalsPND.map(([s, e]) => ({
                    dayStart: s, dayEnd: e, dayType: 'PND',
                    consumption: Math.round(randNormal(35, 3) * eff.fcMultiplier * 10) / 10,
                })),
            ];

            const clinicalObservations: any[] = [];
            for (const { day, dayType } of allMaternalDays) {
                if (day >= 6 && rand() < eff.clinicalProb) {
                    clinicalObservations.push({
                        day, dayType, findingTerm: pick(clinicalSignTerms),
                        severity: pick(['minimal', 'mild', 'moderate']),
                    });
                }
            }

            animals.push({
                animalId, studyId, groupId: group.groupId, sex: 'female',
                litterId: isPregnant ? litterId : null,
                matingPairId: uid('MP'),
                pregnancyStatus,
                maternalDeathFlag: false,
                maternalTerminationReason: null,
                bodyWeights, foodConsumption, clinicalObservations,
            });

            // Litter & pups
            if (isPregnant) {
                const corporaLutea = randInt(12, 17);
                const implantations = corporaLutea - randInt(0, 2);
                const litterSize = implantations - randInt(0, 2);
                const liveBorn = Math.max(0, litterSize - (rand() < 0.05 ? 1 : 0));
                const deadBorn = litterSize - liveBorn;

                litters.push({
                    litterId, studyId, damAnimalId: animalId, groupId: group.groupId,
                    implantations, corporaLutea,
                    resorptionsEarly: randInt(0, 1), resorptionsLate: 0,
                    liveFetuses: liveBorn, deadFetuses: deadBorn,
                    sexRatio: 0.5, litterWeight: 0, meanFetalWeight: 0,
                    postnatalPups: liveBorn,
                    pupsSurvivingPND4: Math.max(0, liveBorn - (rand() < eff.pupMortProb ? randInt(1, 2) : 0)),
                    pupsSurvivingPND21: 0, // calculated below
                });

                const litter = litters[litters.length - 1];
                let survivingPND21 = litter.pupsSurvivingPND4;

                for (let p = 0; p < liveBorn; p++) {
                    const pupSex = rand() < 0.5 ? 'male' : 'female';
                    const isDead = p >= litter.pupsSurvivingPND4;
                    let deathDay = isDead ? randInt(0, 3) : null;

                    // Some additional mortality PND4-21
                    if (!isDead && rand() < eff.pupMortProb * 0.5) {
                        deathDay = randInt(5, 20);
                        survivingPND21--;
                    }

                    const basePupWeight = 6.5 * eff.pupWeightMult;
                    const pupWeights = pndDays
                        .filter(pd => deathDay === null || pd <= deathDay)
                        .map(pd => ({
                            day: pd,
                            weight: Math.round((basePupWeight + pd * 2.5 * eff.pupWeightMult + randNormal(0, 0.5)) * 10) / 10,
                        }));

                    // Milestones
                    const eyeOpenDay = Math.round(14 + eff.eyeOpenDelay + randNormal(0, 0.5));
                    const pinnaDay = Math.round(3 + eff.pinnaDelay + randNormal(0, 0.3));
                    const milestones = [
                        { milestone: 'pinna detachment', dayAchieved: deathDay !== null && deathDay < pinnaDay ? null : pinnaDay },
                        { milestone: 'eye opening', dayAchieved: deathDay !== null && deathDay < eyeOpenDay ? null : eyeOpenDay },
                    ];

                    const neuroScore = deathDay !== null ? null : Math.max(0, Math.round(75 + eff.neuroBehaviorDelta + randNormal(0, 5)));

                    pups.push({
                        pupId: uid('PUP'), litterId, studyId, groupId: group.groupId,
                        sex: pupSex,
                        viabilityStatus: deathDay !== null ? 'dead' : 'live',
                        deathDay,
                        bodyWeights: pupWeights,
                        milestones,
                        neurobehaviorScore: neuroScore,
                    });
                }

                litter.pupsSurvivingPND21 = Math.max(0, survivingPND21);
            }

            for (const obs of clinicalObservations) {
                findings.push({
                    findingId: uid('FND'), studyId, scope: 'maternal', level: 'animal',
                    domain: 'maternal clinical sign',
                    findingCode: `CS-${obs.findingTerm.substring(0, 4).toUpperCase()}`,
                    findingTerm: obs.findingTerm, severity: obs.severity,
                    doseRelatedFlag: group.doseLevel >= 50,
                    timepoint: `${obs.dayType}${obs.day}`,
                });
            }
        }
    }

    const timepoints = [
        ...gdDays.map(d => ({ timepointId: uid('TP'), studyId, dayType: 'GD' as const, day: d, visitLabel: `GD${d}` })),
        ...pndDays.map(d => ({ timepointId: uid('TP'), studyId, dayType: 'PND' as const, day: d, visitLabel: d === 0 ? 'Birth' : d === 21 ? 'Weaning' : `PND${d}` })),
    ];

    return { study, groups, animals, litters, fetuses: [], pups, findings, timepoints };
}

// ── Generate and write ──────────────────────────────────────────────────────
const studyA = generateStudyA();
const studyB = generateStudyB();
const studyC = generateStudyC();

const write = (name: string, data: any) => {
    const path = join(__dirname, name);
    writeFileSync(path, JSON.stringify(data, null, 2));
    console.log(`✔ ${path} (${JSON.stringify(data.study?.studyName ?? name)})`);
};

write('study-a-rat-efd.json', studyA);
write('study-b-rabbit-efd.json', studyB);
write('study-c-rat-ppnd.json', studyC);

console.log('\n✅ All mock data generated successfully.');
console.log(`   Study A: ${studyA.animals.length} animals, ${studyA.litters.length} litters, ${studyA.fetuses.length} fetuses`);
console.log(`   Study B: ${studyB.animals.length} animals, ${studyB.litters.length} litters, ${studyB.fetuses.length} fetuses`);
console.log(`   Study C: ${studyC.animals.length} animals, ${studyC.litters.length} litters, ${studyC.pups.length} pups`);
