import { PlanBuilder } from '../builders/PlanBuilder';
import { WindowMode } from '../core/constants';
import { TrackManager } from '../core/TrackManager';

export function createQuarterPageScenario(): TrackManager {
    return new PlanBuilder()
        .setSchedule({
            startDate: '2026-02-01',
            daysPerWeek: 5,
            isReverse: true,
            maxAyahPerDay: 5,
            sequentialSurahMode: true,
            strictSequentialMode: true,
            consolidationDayInterval: 5,
            // Teacher's requirements for minor review
            surahBoundedMinorReview: true,
            minorReviewPagesCount: 5  // 5 pages for weekly review coverage
        })
        .planByDailyAmount({
            from: { surah: 78, ayah: 1 },  // An-Naba
            to: { surah: 66, ayah: 1 },    // At-Tahreem
            dailyLines: 4  // Quarter page (standard page = 15 lines)
        })
        .addMinorReview(3, WindowMode.GRADUAL)
        .addMajorReview(15 * 5, { surah: 114, ayah: 1 })
        .stopWhenCompleted()
        .build();
}
