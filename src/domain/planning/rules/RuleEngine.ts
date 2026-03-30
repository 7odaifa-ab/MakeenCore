import { PlanningRule, RuleCandidate, RuleContext, RuleResult } from './RuleInterface';

export class RuleEngine {
    /**
     * ⚠️ WARNING: This engine currently operates on APPROXIMATE and INCOMPLETE Quranic data ($Lines/15$).
     * Distribution of pages and thematic breaks are technically inaccurate.
     * DO NOT PROCEED WITH DEVELOPMENT until a verified, ground-truth dataset is provided.
     */
    private rules: PlanningRule[] = [];


    constructor(rules: PlanningRule[] = []) {
        // Sort ascending priority (lower number = runs first)
        this.rules = rules.sort((a, b) => a.priority - b.priority);
    }

    public addRule(rule: PlanningRule) {
        this.rules.push(rule);
        this.rules.sort((a, b) => a.priority - b.priority);
    }

    public getRuleNamesInOrder(): string[] {
        return this.rules.map((rule) => rule.name);
    }

    /**
     * Executes the pipeline on a candidate location
     */
    public evaluate(candidate: RuleCandidate, context: RuleContext): RuleResult {
        let currentCandidate = { ...candidate };
        let finalResult: RuleResult = {
            approvedEnd: candidate.proposedEnd,
            warnings: []
        };
        
        let appliedRules: string[] = [];
        let combinedReason: string[] = [];
        let totalAdjustment = 0;

        for (const rule of this.rules) {
            const result = rule.apply(currentCandidate, context);
            const locationChanged =
                result.approvedEnd.surah !== currentCandidate.proposedEnd.surah ||
                result.approvedEnd.ayah !== currentCandidate.proposedEnd.ayah;

            if (result.metadata) {
                appliedRules.push(result.metadata.appliedRule);
                combinedReason.push(result.metadata.reason);
                totalAdjustment += result.metadata.adjustmentLines;
            }
            
            // If the rule modified the location
            if (locationChanged) {
                currentCandidate.proposedEnd = result.approvedEnd;
                finalResult.approvedEnd = result.approvedEnd;
            }
            
            if (result.warnings && result.warnings.length > 0) {
                finalResult.warnings!.push(...result.warnings);
            }

            if (finalResult.approvedEnd.is_end) {
                break;
            }
        }

        if (appliedRules.length > 0) {
            finalResult.metadata = {
                appliedRule: appliedRules.join(', '),
                reason: combinedReason.join(' | '),
                adjustmentLines: totalAdjustment
            };
        }

        return finalResult;
    }
}
