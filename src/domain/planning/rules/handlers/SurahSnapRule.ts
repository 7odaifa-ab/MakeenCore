import { PlanningRule, RuleCandidate, RuleContext, RuleResult } from '../RuleInterface';

export class SurahSnapRule implements PlanningRule {
    name = 'SurahSnapRule';
    priority = 20;

    apply(candidate: RuleCandidate, context: RuleContext): RuleResult {
        const repo = context.repository;
        const currentEnd = candidate.proposedEnd;

        // Check distance to the end of the surah
        const ayahCount = repo.getAyahCount(currentEnd.surah);
        const distanceToSurahEnd = repo.getLinesBetween(
            currentEnd, 
            { surah: currentEnd.surah, ayah: ayahCount }, 
            candidate.isReverse
        );

        if (currentEnd.ayah < ayahCount && distanceToSurahEnd > 0 && distanceToSurahEnd <= context.snapThresholdLines) {
            // Snap to surah end
            const newEnd = { surah: currentEnd.surah, ayah: ayahCount, is_end: true };

            // re-fetch page metadata to keep the record clean
            const newEndLoc = repo.getLocationFromIndex(
                repo.getIndexFromLocation(newEnd.surah, newEnd.ayah, candidate.isReverse),
                repo.getDirectionData(candidate.isReverse).index_map
            );

            return {
                approvedEnd: newEndLoc,
                metadata: {
                    appliedRule: this.name,
                    reason: `Snapped to the end of Surah ${currentEnd.surah}`,
                    adjustmentLines: distanceToSurahEnd
                }
            };
        }

        return { approvedEnd: currentEnd };
    }
}
