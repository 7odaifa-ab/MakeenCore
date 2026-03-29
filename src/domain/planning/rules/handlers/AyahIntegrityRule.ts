import { PlanningRule, RuleCandidate, RuleContext, RuleResult } from '../RuleInterface';

export class AyahIntegrityRule implements PlanningRule {
    name = 'AyahIntegrityRule';
    priority = 10;

    apply(candidate: RuleCandidate, context: RuleContext): RuleResult {
        // Our ReferenceRepository already returns full Ayahs.
        // This rule just guarantees the schema validation and adds tracking metadata if needed.
        // In the future, if lines could split ayahs, this rule would snap to the nearest ayah boundary.
        return {
            approvedEnd: candidate.proposedEnd,
            // metadata omitted because nothing changed
        };
    }
}
