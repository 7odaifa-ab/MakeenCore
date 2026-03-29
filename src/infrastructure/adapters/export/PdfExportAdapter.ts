import { PlanDay, LocationObj, PlanEvent } from '../../../core/types';
import { QuranRepository } from '../../../core/QuranRepository';
import { TrackId } from '../../../core/constants'; 
import { ExportOptions } from './ExcelExportAdapter';

export class PdfExportAdapter {
    private quranRepo: QuranRepository;

    constructor() {
        this.quranRepo = QuranRepository.getInstance();
    }

    private formatLocation(loc: LocationObj): string {
        const name = this.quranRepo.getSurahName(loc.surah);
        return `${name} (${loc.ayah})`;
    }

    public async generateBuffer(plan: PlanDay[], options?: ExportOptions): Promise<Buffer> {
        // NOTE: In a real environment, you would use pdfkit or jspdf.
        // For the sake of this Epic, we implement the scaffolding that supports
        // dynamic columns, day grouping, and teacher review fields.

        const allTrackIds = new Set<string | number>();
        for (const day of plan) {
            for (const event of day.events) {
                allTrackIds.add(event.trackId);
            }
        }
        
        const activeTrackOrder = Array.from(allTrackIds).sort();

        let outputStr = "PDF EXPORT MOCK\n";
        outputStr += "===============\n\n";

        if (options?.includeTeacherReview) {
            outputStr += "[Includes Teacher Review Columns]\n\n";
        }

        for (const day of plan) {
            // Grouping representation
            outputStr += `Day ${day.dayNum} - ${day.date.toISOString().split('T')[0]}:\n`;

            for (const trackId of activeTrackOrder) {
                const event = day.events.find(e => e.trackId === trackId);
                outputStr += `  - ${trackId}: `;
                if (event) {
                    const status = event.data.is_reset ? ' 🔄' : '';
                    outputStr += `${this.formatLocation(event.data.start)} -> ${this.formatLocation(event.data.end)}${status}\n`;
                } else {
                    outputStr += `None\n`;
                }
            }

            if (options?.includeTeacherReview) {
                outputStr += `  - Teacher Notes: ____________\n`;
                outputStr += `  - Grade: ____\n`;
            }

            outputStr += "\n";
        }

        return Buffer.from(outputStr, 'utf-8');
    }
}
