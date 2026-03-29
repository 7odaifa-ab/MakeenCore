import { PlanningRule, RuleCandidate, RuleContext, RuleResult } from '../RuleInterface';

export class ThematicHaltingRule implements PlanningRule {
    name = 'ThematicHaltingRule';
    priority = 40;

    apply(candidate: RuleCandidate, context: RuleContext): RuleResult {
        // Not implemented fully yet because thematic markers don't exist in CSV.
        // It acts as a passthrough until data is enriched.
        return { approvedEnd: candidate.proposedEnd };
    }
}

export class BalanceCorrectionRule implements PlanningRule {
    name = 'BalanceCorrectionRule';
    priority = 50;

    apply(candidate: RuleCandidate, context: RuleContext): RuleResult {
        // If the resulting track has built up a huge positive or negative balance
        // we could correct it here. For now, passthrough.
        // E.g., if expected cumulative lines is far from actual cumulative completed.
        return { approvedEnd: candidate.proposedEnd };
    }
}
