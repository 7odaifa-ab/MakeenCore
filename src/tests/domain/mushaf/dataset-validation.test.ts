import { describe, expect, it } from 'vitest';
import {
    INDEX_MAP_FORWARD,
    INDEX_MAP_REVERSE,
    REVERSE_INDEX_FORWARD,
    REVERSE_INDEX_REVERSE,
} from '../../../data/CanonicalQuranData';

describe('Dataset Validation', () => {
    const fw = REVERSE_INDEX_FORWARD;
    const rev = REVERSE_INDEX_REVERSE;

    it('validates ayah continuity per surah', () => {
        let prevSurah = 1;
        let prevAyah = 0;
        for (const loc of fw) {
            if (loc.surah === prevSurah) {
                expect(loc.ayah, `Gap in surah ${loc.surah}: expected ayah ${prevAyah + 1}, got ${loc.ayah}`).toBe(prevAyah + 1);
            } else {
                expect(loc.surah, `Gap in surahs: expected ${prevSurah + 1}, got ${loc.surah}`).toBe(prevSurah + 1);
                expect(loc.ayah, `Surah ${loc.surah} does not start at ayah 1 (got ${loc.ayah})`).toBe(1);
                expect(
                    fw[INDEX_MAP_FORWARD[`${prevSurah}:${prevAyah}`]].is_end,
                    `is_end missing for surah end at ${prevSurah}:${prevAyah}`
                ).toBe(true);
            }
            prevSurah = loc.surah;
            prevAyah = loc.ayah;
        }
    });

    it('validates page totals and end markers', () => {
        let maxPage = 0;
        let computedEndingFlags = 0;
        for (const loc of fw) {
            if (loc.page > maxPage) maxPage = loc.page;
            if (loc.is_page_end) computedEndingFlags++;
        }
        expect(maxPage).toBeGreaterThanOrEqual(604);
        expect(maxPage).toBeLessThanOrEqual(610);
        expect(computedEndingFlags, `Expected ${maxPage} page end flags, got ${computedEndingFlags}`).toBe(maxPage);
    });

    it('validates thematic metadata integrity', () => {
        const allowedTypes = new Set(['QUARTER', 'HIZB', 'JUZ', 'SAJDAH', 'NONE']);
        const thematicCounts: Record<string, number> = {
            QUARTER: 0,
            HIZB: 0,
            JUZ: 0,
            SAJDAH: 0,
            NONE: 0
        };

        for (const loc of fw as any[]) {
            const type = loc.thematic_break_type ?? 'NONE';
            expect(allowedTypes.has(type), `Invalid thematic break type: ${type}`).toBe(true);

            thematicCounts[type] = (thematicCounts[type] || 0) + 1;

            if (type === 'NONE') {
                expect(loc.thematic_break, `thematic_break should be false when type is NONE at ${loc.surah}:${loc.ayah}`).toBe(false);
            } else {
                expect(loc.thematic_break, `thematic_break should be true when type is ${type} at ${loc.surah}:${loc.ayah}`).toBe(true);
            }
        }

        expect(thematicCounts.JUZ).toBeGreaterThan(0);
        expect(thematicCounts.HIZB).toBeGreaterThan(0);
    });

    it('validates weighted line totals per page', () => {
        const pageLineTotals = new Map<number, number>();
        for (const loc of fw as any[]) {
            const lines = Number(loc.lines_count ?? 0);
            pageLineTotals.set(loc.page, (pageLineTotals.get(loc.page) || 0) + lines);
        }

        let minPageLines = Number.POSITIVE_INFINITY;
        let maxPageLines = Number.NEGATIVE_INFINITY;
        let minPageNumber = -1;
        let maxPageNumber = -1;

        for (const [page, total] of pageLineTotals.entries()) {
            if (total < minPageLines) {
                minPageLines = total;
                minPageNumber = page;
            }
            if (total > maxPageLines) {
                maxPageLines = total;
                maxPageNumber = page;
            }

            expect(total, `Page ${page} expected weighted lines within canonical bounds, got ${total.toFixed(4)}`).toBeGreaterThanOrEqual(6);
            expect(total, `Page ${page} expected weighted lines within canonical bounds, got ${total.toFixed(4)}`).toBeLessThanOrEqual(15.5);
        }

        expect(
            minPageLines,
            `Expected at least one short page (<10 weighted lines), got min=${minPageLines.toFixed(4)} at page ${minPageNumber}`
        ).toBeLessThan(10);
        expect(
            maxPageLines,
            `Expected at least one full page (~15 weighted lines), got max=${maxPageLines.toFixed(4)} at page ${maxPageNumber}`
        ).toBeGreaterThanOrEqual(14.5);
    });

    it('validates symmetry across forward and reverse directions', () => {
        expect(fw.length, `Length mismatch: fwd=${fw.length}, rev=${rev.length}`).toBe(rev.length);

        const midPointFwd = fw[3000];
        const mapRevIdx = INDEX_MAP_REVERSE[`${midPointFwd.surah}:${midPointFwd.ayah}`];
        const midPointRev = rev[mapRevIdx];

        expect(midPointFwd.surah).toBe(midPointRev.surah);
        expect(midPointFwd.ayah).toBe(midPointRev.ayah);
    });
});
