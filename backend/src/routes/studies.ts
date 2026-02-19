/**
 * REST API routes for DART Study Monitor.
 * All endpoints are read-only and serve computed data from mock JSON.
 */

import { Router } from 'express';
import {
    getAllStudies, getStudyById, getRefreshInfo, triggerRefresh,
} from '../services/dataLoader.js';
import {
    computeBodyWeightByGroup, computeFoodConsumptionByGroup,
    computePregnancyOutcomes, computeMaternalData,
    computeLitterData, computeFetalFindingsData, computePostnatalData,
} from '../services/derivedMetrics.js';
import { evaluateAlerts, deriveRiskBadge } from '../services/alertEngine.js';
import type { StudySummary, OverviewData, CrossStudyData } from '../types/types.js';

export const studyRouter = Router();

// ── GET /api/studies ────────────────────────────────────────────────────────
studyRouter.get('/studies', (_req, res) => {
    const datasets = getAllStudies();
    const { lastRefreshTime } = getRefreshInfo();

    const summaries: StudySummary[] = datasets.map(ds => {
        const alerts = evaluateAlerts(ds);
        const pregnantDams = ds.animals.filter(a => a.pregnancyStatus === 'pregnant').length;
        const totalDams = ds.animals.length;

        return {
            ...ds.study,
            riskBadge: deriveRiskBadge(alerts),
            totalDams,
            percentPregnant: totalDams > 0 ? Math.round((pregnantDams / totalDams) * 100) : 0,
            lastRefresh: lastRefreshTime,
            activeAlerts: alerts.length,
        };
    });

    res.json(summaries);
});

// ── GET /api/studies/:id ────────────────────────────────────────────────────
studyRouter.get('/studies/:id', (req, res) => {
    const ds = getStudyById(req.params.id);
    if (!ds) return res.status(404).json({ error: 'Study not found' });
    res.json(ds);
});

// ── GET /api/studies/:id/overview ───────────────────────────────────────────
studyRouter.get('/studies/:id/overview', (req, res) => {
    const ds = getStudyById(req.params.id);
    if (!ds) return res.status(404).json({ error: 'Study not found' });

    const alerts = evaluateAlerts(ds);
    const maternalAlerts = alerts.filter(a => a.category === 'maternal');
    const devAlerts = alerts.filter(a => a.category === 'developmental' || a.category === 'postnatal');

    const overview: OverviewData = {
        study: ds.study,
        maternalToxicityStatus: maternalAlerts.some(a => a.severity === 'red')
            ? 'Maternal toxicity detected at high dose'
            : maternalAlerts.some(a => a.severity === 'yellow')
                ? 'Possible maternal effects at high dose'
                : 'No significant maternal toxicity',
        developmentalToxicityStatus: devAlerts.some(a => a.severity === 'red')
            ? 'Developmental toxicity detected'
            : devAlerts.some(a => a.severity === 'yellow')
                ? 'Emerging developmental signals'
                : 'No significant developmental toxicity',
        bodyWeightByGroup: computeBodyWeightByGroup(ds),
        foodConsumptionByGroup: computeFoodConsumptionByGroup(ds),
        pregnancyOutcomeByGroup: computePregnancyOutcomes(ds),
        alerts,
    };

    res.json(overview);
});

// ── GET /api/studies/:id/maternal ───────────────────────────────────────────
studyRouter.get('/studies/:id/maternal', (req, res) => {
    const ds = getStudyById(req.params.id);
    if (!ds) return res.status(404).json({ error: 'Study not found' });
    res.json(computeMaternalData(ds));
});

// ── GET /api/studies/:id/litter ─────────────────────────────────────────────
studyRouter.get('/studies/:id/litter', (req, res) => {
    const ds = getStudyById(req.params.id);
    if (!ds) return res.status(404).json({ error: 'Study not found' });
    res.json(computeLitterData(ds));
});

// ── GET /api/studies/:id/fetal ──────────────────────────────────────────────
studyRouter.get('/studies/:id/fetal', (req, res) => {
    const ds = getStudyById(req.params.id);
    if (!ds) return res.status(404).json({ error: 'Study not found' });
    res.json(computeFetalFindingsData(ds));
});

// ── GET /api/studies/:id/postnatal ──────────────────────────────────────────
studyRouter.get('/studies/:id/postnatal', (req, res) => {
    const ds = getStudyById(req.params.id);
    if (!ds) return res.status(404).json({ error: 'Study not found' });
    res.json(computePostnatalData(ds));
});

// ── GET /api/studies/:id/animals ────────────────────────────────────────────
studyRouter.get('/studies/:id/animals', (req, res) => {
    const ds = getStudyById(req.params.id);
    if (!ds) return res.status(404).json({ error: 'Study not found' });

    // Return animals with their associated litter and fetal/pup data
    const animalsWithDetails = ds.animals.map(animal => {
        const litter = ds.litters.find(l => l.damAnimalId === animal.animalId);
        const animalFetuses = litter
            ? ds.fetuses.filter(f => f.litterId === litter.litterId)
            : [];
        const animalPups = litter
            ? ds.pups.filter(p => p.litterId === litter.litterId)
            : [];
        const group = ds.groups.find(g => g.groupId === animal.groupId);

        return {
            ...animal,
            groupName: group?.name ?? '',
            doseLevel: group?.doseLevel ?? 0,
            litter: litter ?? null,
            fetuses: animalFetuses,
            pups: animalPups,
        };
    });

    res.json(animalsWithDetails);
});

// ── GET /api/studies/:id/alerts ─────────────────────────────────────────────
studyRouter.get('/studies/:id/alerts', (req, res) => {
    const ds = getStudyById(req.params.id);
    if (!ds) return res.status(404).json({ error: 'Study not found' });
    res.json(evaluateAlerts(ds));
});

// ── GET /api/cross-study ────────────────────────────────────────────────────
studyRouter.get('/cross-study', (_req, res) => {
    const datasets = getAllStudies();

    const endpoints = [
        'Maternal Body Weight',
        'Food Consumption',
        'Early Resorptions',
        'Late Resorptions',
        'Fetal Weight',
        'Malformations',
        'Variations',
        'Pup Mortality',
        'Pup Weight',
    ];

    const crossData: CrossStudyData = {
        studies: datasets.map(ds => ({
            studyId: ds.study.studyId,
            studyName: ds.study.studyName,
            species: ds.study.species,
            studyType: ds.study.studyType,
        })),
        endpoints,
        heatmap: datasets.flatMap(ds => {
            const alerts = evaluateAlerts(ds);
            return endpoints.map(endpoint => ({
                studyId: ds.study.studyId,
                endpoint,
                groups: ds.groups.map(group => {
                    // Find relevant alerts for this endpoint/group combination
                    const relevantAlerts = alerts.filter(a => {
                        if (a.groupId !== group.groupId) return false;
                        const msg = a.message.toLowerCase();
                        switch (endpoint) {
                            case 'Maternal Body Weight': return msg.includes('body weight');
                            case 'Food Consumption': return msg.includes('food consumption');
                            case 'Early Resorptions': return msg.includes('early resorption');
                            case 'Late Resorptions': return msg.includes('late resorption');
                            case 'Fetal Weight': return msg.includes('fetal weight');
                            case 'Malformations': return msg.includes('malformation');
                            case 'Variations': return msg.includes('variation');
                            case 'Pup Mortality': return msg.includes('pup mortality');
                            case 'Pup Weight': return msg.includes('pup weight');
                            default: return false;
                        }
                    });

                    const worstSeverity = relevantAlerts.some(a => a.severity === 'red')
                        ? 'red' as const
                        : relevantAlerts.some(a => a.severity === 'yellow')
                            ? 'yellow' as const
                            : 'green' as const;

                    return {
                        groupName: group.name,
                        value: worstSeverity === 'red' ? 2 : worstSeverity === 'yellow' ? 1 : 0,
                        severity: worstSeverity,
                    };
                }),
            }));
        }),
    };

    res.json(crossData);
});

// ── POST /api/refresh ───────────────────────────────────────────────────────
studyRouter.post('/refresh', (_req, res) => {
    triggerRefresh();
    const { refreshCount, lastRefreshTime } = getRefreshInfo();
    res.json({ refreshCount, lastRefreshTime, message: 'Data refreshed successfully' });
});
