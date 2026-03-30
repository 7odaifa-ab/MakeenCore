import { describe, expect, it } from 'vitest';
import { ReferenceRepository } from '../../../domain/mushaf/repositories/ReferenceRepository';
import { RuleEngine } from '../../../domain/planning/rules/RuleEngine';
import { 
    AyahIntegrityRule 
} from '../../../domain/planning/rules/handlers/AyahIntegrityRule';
import { 
    SurahSnapRule 
} from '../../../domain/planning/rules/handlers/SurahSnapRule';
import { 
    PageAlignmentRule 
} from '../../../domain/planning/rules/handlers/PageAlignmentRule';
import {
    ThematicHaltingRule
} from '../../../domain/planning/rules/handlers/OtherRules';
import { RuleCandidate, RuleContext } from '../../../domain/planning/rules/RuleInterface';

describe('RuleEngine', () => {
    const repo = ReferenceRepository.getInstance();
    const context: RuleContext = {
        repository: repo,
        trackId: 'test_track',
        snapThresholdLines: 7 // 7 lines snap threshold
    };

    const engine = new RuleEngine([
        new AyahIntegrityRule(),
        new SurahSnapRule(),
        new PageAlignmentRule(),
        new ThematicHaltingRule()
    ]);

    it('keeps deterministic configured rule order', () => {
        expect(engine.getRuleNamesInOrder()).toEqual([
            'AyahIntegrityRule',
            'SurahSnapRule',
            'PageAlignmentRule',
            'ThematicHaltingRule'
        ]);
    });

    it('preserves ayah integrity when no snap rule triggers', () => {
        const candidate: RuleCandidate = {
            start: { surah: 2, ayah: 1, is_end: false },
            proposedEnd: { surah: 2, ayah: 3, is_end: false, page: 2, is_page_end: false },
            targetLines: 5,
            isReverse: false
        };

        const result = engine.evaluate(candidate, context);
        expect(result.approvedEnd.surah).toBe(2);
        expect(result.approvedEnd.ayah).toBeGreaterThanOrEqual(3);
    });

    it('applies surah snap when close to surah end', () => {
        const candidate: RuleCandidate = {
            start: { surah: 110, ayah: 1, is_end: false },
            proposedEnd: { surah: 110, ayah: 2, is_end: false },
            targetLines: 5,
            isReverse: false
        };

        const result = engine.evaluate(candidate, context);
        expect(result.approvedEnd.surah).toBe(110);
        expect(result.approvedEnd.ayah).toBe(3);
        expect(result.metadata?.appliedRule).toContain('SurahSnapRule');
    });

    it('applies page alignment when a nearby page boundary exists', () => {
        const pg4End = repo.getIndexFromLocation(2, 24, false);
        const loc2_24 = repo.getLocationFromIndex(pg4End, repo.getDirectionData(false).index_map);

        if (!loc2_24.is_page_end) {
            return;
        }

        const candidate: RuleCandidate = {
            start: { surah: 2, ayah: 20, is_end: false },
            proposedEnd: { surah: 2, ayah: 23, is_end: false, page: loc2_24.page || 1, is_page_end: false },
            targetLines: 5,
            isReverse: false
        };

        const result = engine.evaluate(candidate, context);
        expect(result.approvedEnd.surah).toBe(2);
        expect(result.approvedEnd.ayah).toBe(24);
        expect(result.metadata?.appliedRule).toContain('PageAlignmentRule');
    });

    it('keeps thematic rule trace reason when thematic halting applies', () => {
        const candidate: RuleCandidate = {
            start: { surah: 2, ayah: 140, is_end: false },
            proposedEnd: { surah: 2, ayah: 141, is_end: false, page: 22, is_page_end: false },
            targetLines: 5,
            isReverse: false
        };

        const result = engine.evaluate(candidate, context);
        if (result.metadata?.appliedRule?.includes('ThematicHaltingRule')) {
            expect(result.metadata.reason).toContain('thematic boundary');
        }
    });
});
