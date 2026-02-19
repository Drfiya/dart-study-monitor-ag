/**
 * Alert threshold configuration — all thresholds in one place.
 * Adjust these values to tune sensitivity of safety signals.
 */
export const THRESHOLDS = {
    maternal: {
        /** % body weight loss vs baseline that triggers alert */
        bodyWeightLossPercent: 10,
        /** % food consumption below control mean that triggers alert */
        foodConsumptionDecreasePercent: 20,
        /** Number of maternal deaths/moribund in any group that triggers alert */
        deathCount: 1,
        /** % dams with clinical signs in any group that triggers alert */
        clinicalSignIncidencePercent: 25,
    },
    developmental: {
        /** Mean early resorptions per litter threshold vs control */
        earlyResorptionThreshold: 1.5,
        /** Mean late resorptions per litter threshold vs control */
        lateResorptionThreshold: 0.8,
        /** % decrease in mean fetal weight vs control */
        fetalWeightDecreasePercent: 10,
        /** % litters with malformations threshold */
        malformationIncidencePercent: 5,
        /** % litters with variations threshold (higher bar since variations more common) */
        variationIncidencePercent: 15,
    },
    postnatal: {
        /** % pup mortality PND0-4 that triggers alert */
        perinatalMortalityPercent: 10,
        /** % decrease in pup weight gain vs control */
        pupWeightGainDecreasePercent: 15,
        /** Days of delay in developmental milestones vs control */
        milestoneDelayDays: 1.5,
    },
} as const;
