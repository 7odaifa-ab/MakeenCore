import { IMovementStrategy } from './IMovementStrategy';
import { TrackState, StepResult } from '../core/types';
import { PlanContext } from '../core/PlanContext';
import { findExponentialStopIndex } from '../utils/Algorithms';

/**
 * LoopingStrategy — State-Driven Major Review
 * 
 * ARCHITECTURE FIX: This strategy now implements a **state-driven pointer**
 * instead of rule-driven generation.
 * 
 * BEHAVIOR:
 * 1. Pointer starts at configured startIdx (e.g. Surah An-Nas)
 * 2. Each day: pointer += dailyAmount (one single chunk)
 * 3. If pointer reaches the wall (memorized boundary): RESET
 *    - Emit the partial chunk up to the wall
 *    - Flag 'reset' so commitStep wraps pointer to startIdx
 *    - Next day starts fresh from startIdx
 * 4. **NEVER produce multiple chunks in one day** — prevents
 *    multi-track confusion and inconsistent direction
 * 
 * This ensures:
 * - Consistent ASC direction within each cycle
 * - One Major Review event per day
 * - Predictable coverage cycles
 * - Reset ONLY when pointer >= wall (real cycle completion)
 */
export class LoopingStrategy implements IMovementStrategy {
    calculateNextStep(
        state: TrackState, 
        context: PlanContext, 
        config: { amount: number, trackId: number, endIdx?: number, startIdx?: number }
    ): StepResult | null {
        const currentIdx = state.currentIdx;
        const maxIndex = context.cumulativeArray.length - 1;

        // Determine the wall (boundary of memorized material)
        let wallIdx = maxIndex;
        if (config.endIdx !== undefined) {
            wallIdx = Math.min(config.endIdx, maxIndex);
        } else {
            const meTrack = context.allTracks.get(config.trackId);
            if (meTrack) {
                const barrier = context.constraintManager.getBarrierIndex(meTrack, context.allTracks);
                if (barrier !== null) {
                    wallIdx = barrier;
                }
            }
        }

        // Guard: nothing to review (pool is empty)
        if (wallIdx <= 0) return null;
        if (currentIdx >= wallIdx) {
            // Already at or past the wall — need a reset.
            // Return null; commitStep from previous day should have reset.
            // If we're still here, force a reset result.
            return null;
        }

        // Calculate target position
        const currentCum = currentIdx > 0 ? context.cumulativeArray[currentIdx - 1] : 0;
        const targetCum = currentCum + config.amount;

        let stopIdx = findExponentialStopIndex(
            context.cumulativeArray,
            targetCum,
            currentIdx,
            Math.min(wallIdx, maxIndex)
        );

        // Clamp to wall
        let hitWall = false;
        if (stopIdx >= wallIdx) {
            stopIdx = wallIdx;
            hitWall = true;
        }

        // No movement possible
        if (stopIdx <= currentIdx) {
            return null;
        }

        const linesProcessed = context.cumulativeArray[stopIdx] - currentCum;

        return {
            startIdx: currentIdx,
            endIdx: stopIdx,
            start: context.quranRepo.getLocationFromIndex(currentIdx, context.indexMap),
            end: context.quranRepo.getLocationFromIndex(stopIdx, context.indexMap),
            linesProcessed: parseFloat(linesProcessed.toFixed(2)),
            flags: hitWall ? ['review', 'reset'] : ['review']
        };
    }
}