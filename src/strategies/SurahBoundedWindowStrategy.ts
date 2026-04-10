// src/strategies/SurahBoundedWindowStrategy.ts
import { IMovementStrategy } from './IMovementStrategy';
import { TrackState, StepResult } from '../core/types';
import { PlanContext } from '../core/PlanContext';
import { WindowMode } from '../core/constants';

interface SurahBoundedWindowStrategyConfig {
    historySourceId: number;
    count: number;
    mode: WindowMode;
    pagesCount?: number;  // Optional: specify review amount in pages (15 lines = 1 page)
}

/**
 * SurahBoundedWindowStrategy
 * 
 * Minor review strategy that respects surah boundaries:
 * 1. Never crosses surah boundaries - review is always within current surah
 * 2. Resets counter when hifz moves to a new surah
 * 3. Supports specifying review amount in pages (15 lines = 1 page)
 * 
 * This implements the teacher's requirements:
 * - المراجعة الصغرى تُربط دائماً بإطار السورة الواحدة
 * - تصفير العداد عند الانتقال لسورة جديدة
 * - يمكن تحديد مقدار المراجعة بالأوجه
 */
export class SurahBoundedWindowStrategy implements IMovementStrategy {
    private currentSurah: number | null = null;
    private historyInCurrentSurah: TrackState['history'] = [];

    calculateNextStep(
        state: TrackState,
        context: PlanContext,
        config: SurahBoundedWindowStrategyConfig
    ): StepResult | null {
        const sourceTrack = context.allTracks.get(config.historySourceId);
        if (!sourceTrack) return null;

        const fullHistory = sourceTrack.state.history;
        const pastLessons = fullHistory.slice(0, -1); // Exclude today's lesson

        if (pastLessons.length === 0) return null;

        // Get current hifz position to determine surah
        const currentHifzIdx = sourceTrack.state.currentIdx;
        const currentLocation = context.quranRepo.getLocationFromIndex(
            currentHifzIdx,
            context.indexMap
        );
        const currentSurahNum = currentLocation.surah;

        // Check if surah changed - if so, reset counter
        if (this.currentSurah !== null && this.currentSurah !== currentSurahNum) {
            this.historyInCurrentSurah = [];
        }
        this.currentSurah = currentSurahNum;

        // Filter history to only include lessons in current surah (limited to config.count)
        this.historyInCurrentSurah = pastLessons.slice(-config.count).filter(lesson => {
            const lessonStartLoc = context.quranRepo.getLocationFromIndex(
                lesson.startIdx,
                context.indexMap
            );
            return lessonStartLoc.surah === currentSurahNum;
        });

        // Determine the count (either lessons or pages)
        let effectiveCount = config.count;
        if (config.pagesCount !== undefined) {
            // Convert pages to approximate lesson count
            // Standard page = 15 lines, average lesson varies
            // For now, we'll use a simple heuristic: 1 page ≈ 1 lesson
            // This can be refined based on actual lesson sizes
            effectiveCount = config.pagesCount;
        }

        // Apply window mode
        return config.mode === WindowMode.FIXED
            ? this.calcFixed(this.historyInCurrentSurah, context, effectiveCount)
            : this.calcGradual(this.historyInCurrentSurah, context, effectiveCount);
    }

    private calcGradual(
        pastLessons: TrackState['history'],
        context: PlanContext,
        count: number
    ): StepResult | null {
        if (pastLessons.length === 0) return null;

        const window = pastLessons.slice(-count);
        const startIdx = window[0].startIdx;
        const endIdx = window[window.length - 1].endIdx;

        return this.buildResult(startIdx, endIdx, context);
    }

    private calcFixed(
        pastLessons: TrackState['history'],
        context: PlanContext,
        count: number
    ): StepResult | null {
        if (pastLessons.length === 0) return null;

        if (pastLessons.length >= count) {
            const window = pastLessons.slice(-count);
            return this.buildResult(
                window[0].startIdx,
                window[window.length - 1].endIdx,
                context
            );
        }

        // Not enough lessons in current surah - use what we have
        const window = pastLessons;
        return this.buildResult(
            window[0].startIdx,
            window[window.length - 1].endIdx,
            context
        );
    }

    private buildResult(
        startIdx: number,
        endIdx: number,
        context: PlanContext
    ): StepResult {
        return {
            startIdx,
            endIdx,
            start: context.quranRepo.getLocationFromIndex(startIdx, context.indexMap),
            end: context.quranRepo.getLocationFromIndex(endIdx, context.indexMap),
            linesProcessed: 0,
            flags: ['review']
        };
    }

}
