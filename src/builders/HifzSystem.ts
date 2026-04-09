// src/builders/HifzSystem.ts
import { TrackManager } from '../core/TrackManager';
import { LinearTrack } from '../tracks/LinearTrack';
import { WindowTrack } from '../tracks/WindowTrack';
import { LoopingTrack } from '../tracks/LoopingTrack';
import { WallConstraint } from '../constraints/WallConstraint';
import { QuranRepository } from '../core/QuranRepository';
import { BuilderContext, LocationConfig } from './PlanTypes';
import { ITrack } from '../tracks/BaseTrack';
import { TrackId } from '../core/constants';
import { WindowMode } from '../core/constants';
import { PlanError, PlanErrorCode, Severity } from '../errors';


/**
 * HifzSystem
 * * Subsystem responsible for creating and wiring Hifz tracks.
 * * 🚀 REFACTORED: Uses TrackId Enum instead of Magic Numbers.
 */
export class HifzSystem {

    // 🚀 Helper to get singleton strictly for Setup phase
    // (Allowed exception as per refactoring rules)
    private static getRepo(): QuranRepository {
        return QuranRepository.getInstance();
    }

    static createHifzTrack(
        manager: TrackManager,
        context: BuilderContext,
        amountLines: number,
        start: LocationConfig,
        end?: LocationConfig
    ) {
        const repo = this.getRepo();
        const startIdx = repo.getIndexFromLocation(start.surah, start.ayah, context.isReverse);

        let endIdx: number | undefined = undefined;
        if (end) {
            endIdx = repo.getIndexFromLocation(end.surah, end.ayah, context.isReverse);
        }

        if (endIdx !== undefined && startIdx >= endIdx) {
            throw new PlanError(
                PlanErrorCode.START_AFTER_END,
                Severity.ERROR,
                `موقع البداية (${startIdx}) بعد موقع النهاية (${endIdx}).`,
                { startIdx, endIdx }
            );
        }

        const track = new LinearTrack(
            TrackId.HIFZ, // 👈 Enum Usage
            "حفظ جديد",
            startIdx,
            amountLines,
            endIdx
        );

        manager.addTrack(track);
    }

    static createMinorReview(
        manager: TrackManager,
        lessonCount: number,
        mode: WindowMode = WindowMode.GRADUAL  // ← default: سلوك قديم
    ) {
        const track = new WindowTrack(
            TrackId.MINOR_REVIEW,
            "مراجعة صغرى",
            TrackId.HIFZ,
            lessonCount,
            mode        // ← يُمرَّر للـ Track ثم للـ Strategy
        );
        manager.addTrack(track);
    }

    static createMajorReview(
        manager: TrackManager,
        context: BuilderContext,
        amountLines: number,
        trackId: number,
        start?: LocationConfig,
        end?: LocationConfig
    ) {
        const repo = this.getRepo();
        let startIdx = 0;
        let endIdx: number | undefined = undefined;

        if (start) {
            startIdx = repo.getIndexFromLocation(start.surah, start.ayah, context.isReverse);
        }
        if (end) {
            endIdx = repo.getIndexFromLocation(end.surah, end.ayah, context.isReverse);
        }

        if (endIdx !== undefined && startIdx >= endIdx) {
            throw new PlanError(
                PlanErrorCode.START_AFTER_END,
                Severity.ERROR,
                `موقع البداية (${startIdx}) بعد موقع النهاية (${endIdx}) للمراجعة الكبرى.`,
                { startIdx, endIdx }
            );
        }

        // ─────────────────────────────────────────────────────────────
        // 🛡️ VALIDATION: Major Review must not start ahead of Hifz
        // (Only apply this constraint if there is no explicit endIdx, 
        //  since explicit endIdx implies independent Khana loops)
        // ─────────────────────────────────────────────────────────────
        if (endIdx === undefined && manager.hasTrack(TrackId.HIFZ)) {
            const hifzTrack = manager.getTrack(TrackId.HIFZ);
            if (hifzTrack && startIdx > hifzTrack.state.currentIdx) {
                const hifzLoc = repo.getLocationFromIndex(
                    hifzTrack.state.currentIdx,
                    repo.getDirectionData(context.isReverse).index_map
                );
                const majorLoc = repo.getLocationFromIndex(
                    startIdx,
                    repo.getDirectionData(context.isReverse).index_map
                );
                throw new PlanError(
                    PlanErrorCode.MAJOR_REVIEW_AHEAD,
                    Severity.ERROR,
                    'المراجعة الكبرى لا يمكن أن تبدأ أمام الحفظ.',
                    {
                        hifzLocation: hifzLoc,
                        majorLocation: majorLoc,
                        hifzIdx: hifzTrack.state.currentIdx,
                        majorIdx: startIdx
                    }
                );
            }
        }

        const trackName = trackId === TrackId.MAJOR_REVIEW ? "مراجعة كبرى" : `مراجعة كبرى ${trackId - TrackId.MAJOR_REVIEW + 1}`;
        const track = new LoopingTrack(
            trackId,
            trackName,
            startIdx,
            amountLines,
            endIdx
        );
        manager.addTrack(track);

        // If user defined a specific end loop boundary, it does NOT get bounded by Hifz progress.
        if (endIdx === undefined) {
            const constraintManager = manager.getConstraintManager();

            if (manager.hasTrack(TrackId.MINOR_REVIEW)) {
                constraintManager.addConstraint(new WallConstraint(
                    trackId,
                    TrackId.MINOR_REVIEW,
                    true,
                    1,
                    TrackId.HIFZ
                ));
            } else if (manager.hasTrack(TrackId.HIFZ)) {
                constraintManager.addConstraint(new WallConstraint(
                    trackId,
                    TrackId.HIFZ,
                    true,
                    1
                ));
            }
        }
    }

    static getCompletionCondition(): (tracks: Map<number, ITrack>) => boolean {
        return (tracks: Map<number, ITrack>) => {
            const hifzTrack = tracks.get(TrackId.HIFZ);
            return !!(hifzTrack && hifzTrack.state.isCompleted);
        };
    }
}