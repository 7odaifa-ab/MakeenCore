import { PlanBuilder } from '../builders/PlanBuilder';
import { TrackManager } from '../core/TrackManager';

export function createReviewOnlyFiveAjzaScenario(): TrackManager {
    return new PlanBuilder()
        .setSchedule({
            startDate: '2026-02-01',
            daysPerWeek: 5,
            limitDays: 60,
            isReverse: true,
            consolidationDayInterval: 6
        })
        .addMajorReview(15 * 6, { surah: 114, ayah: 1 }, { surah: 67, ayah: 1 })
        .addMajorReview(15 * 2, { surah: 114, ayah: 1 }, { surah: 78, ayah: 1 })
        .build();
}
