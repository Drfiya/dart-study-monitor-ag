/**
 * Data loader — reads mock JSON study data from /data/ directory
 * and provides in-memory access. Supports simulated refresh by
 * tracking a refresh counter.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { StudyDataset } from '../types/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', '..', 'data');

const STUDY_FILES = [
    'study-a-rat-efd.json',
    'study-b-rabbit-efd.json',
    'study-c-rat-ppnd.json',
];

let datasets: Map<string, StudyDataset> = new Map();
let refreshCount = 0;
let lastRefreshTime = new Date().toISOString();

/** Load all study datasets from disk into memory. */
export function loadAllStudies(): void {
    datasets.clear();
    for (const file of STUDY_FILES) {
        const raw = readFileSync(join(DATA_DIR, file), 'utf-8');
        const data: StudyDataset = JSON.parse(raw);
        datasets.set(data.study.studyId, data);
    }
    refreshCount++;
    lastRefreshTime = new Date().toISOString();
    console.log(`📂 Loaded ${datasets.size} studies (refresh #${refreshCount})`);
}

/** Get all loaded study datasets. */
export function getAllStudies(): StudyDataset[] {
    return Array.from(datasets.values());
}

/** Get a single study dataset by ID. */
export function getStudyById(studyId: string): StudyDataset | undefined {
    return datasets.get(studyId);
}

/** Get current refresh metadata. */
export function getRefreshInfo() {
    return { refreshCount, lastRefreshTime };
}

/** Simulate a data refresh from "source system". */
export function triggerRefresh(): void {
    loadAllStudies();
}
