import { PlanBuilder } from '../builders/PlanBuilder';
import { WindowMode } from '../core/constants';
import { TrackManager } from '../core/TrackManager';

export function createAdvancedScenario(): TrackManager {
    return new PlanBuilder()
        .setSchedule({
            startDate: '2026-02-01',
            daysPerWeek: 6,
            limitDays: 120,
            isReverse: true,
            maxAyahPerDay: 12,
            sequentialSurahMode: true,
            strictSequentialMode: false,
            consolidationDayInterval: 7
        })
        .addHifz(14, { surah: 66, ayah: 1 })
        .addMinorReview(7, WindowMode.GRADUAL)
        .addMajorReview(15 * 10, { surah: 114, ayah: 1 })
        .stopWhenCompleted()
        .build();
}
