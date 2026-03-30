/**
 * Canonical model for a single Ayah in the Mushaf.
 */
export type ThematicBreakType = 'QUARTER' | 'HIZB' | 'JUZ' | 'SAJDAH' | 'NONE';

export interface QuranAyahReference {
    ayahId: number;
    surahNumber: number;
    ayahNumber: number;
    pageNumber: number;
    lineStart: number;
    lineEnd: number;
    linesCount: number;
    thematicBreakType: ThematicBreakType;
    surah: number;
    ayah: number;
    lines: number;
    page: number;
    isSurahEnd: boolean;
    isPageEnd: boolean;
    thematicBreak: boolean;
}

/**
 * Payload for a directional index element.
 */
export interface DirectionalIndexElement {
    ayah_id?: number;
    surah_number?: number;
    ayah_number?: number;
    page_number?: number;
    line_start?: number;
    line_end?: number;
    lines_count?: number;
    thematic_break_type?: ThematicBreakType;
    thematic_break?: boolean;
    surah: number;
    ayah: number;
    is_end: boolean;
    page: number;
    is_page_end: boolean;
}

/**
 * Directional Index Data
 */
export interface DirectionalIndex {
    cumulative_lines: Float32Array;
    index_map: Record<string, number>;
    locations: readonly DirectionalIndexElement[];
}

/**
 * Contract for a canonical dataset payload.
 */
export interface CanonicalMushafDataset {
    surah_info: readonly [string, number][]; // [surah name, ayah count]
    surah_names: readonly string[];
    forward: DirectionalIndex;
    reverse: DirectionalIndex;
}
