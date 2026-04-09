import { PlanBuilder } from '../builders/PlanBuilder';
import { WindowMode } from '../core/constants';
import { TrackManager } from '../core/TrackManager';

export function createBeginnerScenario(): TrackManager {
    return new PlanBuilder()
        .setSchedule({
            startDate: '2026-02-01',
            daysPerWeek: 5,
            limitDays: 30,
            isReverse: true,
            maxAyahPerDay: 5,
            sequentialSurahMode: true,
            strictSequentialMode: true,
            consolidationDayInterval: 5
        })
        .addHifz(7, { surah: 66, ayah: 1 })
        .addMinorReview(3, WindowMode.GRADUAL)
        .addMajorReview(15 * 5, { surah: 114, ayah: 1 })
        .stopWhenCompleted()
        .build();
}
