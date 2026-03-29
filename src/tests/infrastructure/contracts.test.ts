import { GeneratePreviewRequestDTO, GeneratePreviewResponseDTO, ExportRequestDTO } from '../../infrastructure/api/contracts';

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function runTests() {
    console.log("Running Epic 4 tests: API Contracts Validation...");

    // Test 1: GeneratePreviewRequestDTO structure
    const payload: GeneratePreviewRequestDTO = {
        tracks: [
            {
                trackType: 'HIFZ',
                startPoint: { surahId: 1, ayahId: 1 },
                dailyLines: 15,
                priority: 1
            }
        ],
        startDate: '2026-03-30',
        workingDays: [0, 1, 2, 3, 4],
        maxDaysToSimulate: 30
    };

    assert(payload.tracks !== undefined, "Expected tracks property");
    assert(payload.tracks[0].trackType === 'HIFZ', "Expected trackType to be HIFZ");
    assert(payload.tracks[0].startPoint.surahId === 1, "Expected startPoint surahId 1");
    console.log("✓ GeneratePreviewRequestDTO shape valid");

    // Test 2: ExportRequestDTO structure
    const exportPayload: ExportRequestDTO = {
        planId: 'some-uuid-1234',
        format: 'excel',
        includeTeachersNotes: true
    };

    assert(exportPayload.planId === 'some-uuid-1234', "Expected planId");
    assert(exportPayload.format === 'excel', "Expected format excel");
    assert(exportPayload.includeTeachersNotes === true, "Expected includeTeachersNotes true");
    console.log("✓ ExportRequestDTO shape valid");

    // Test 3: GeneratePreviewResponseDTO shape
    const response: GeneratePreviewResponseDTO = {
        planDays: [
            {
                dayNum: 1,
                date: '2026-03-30',
                events: [
                    {
                        trackId: 'HIFZ',
                        trackName: 'Hifz Track',
                        start: { surahId: 1, ayahId: 1 },
                        end: { surahId: 1, ayahId: 7 },
                        metadata: {
                            reason: 'Snap rule applied'
                        }
                    }
                ]
            }
        ],
        summary: {
            totalDays: 1,
            tracksSummary: {
                'HIFZ': {
                    completedLines: 15,
                    estimatedCompletionDate: '2026-04-30'
                }
            }
        }
    };

    assert(response.planDays.length === 1, "Expected 1 plan day");
    assert(response.planDays[0].events[0].metadata !== undefined, "Expected metadata");
    assert(response.planDays[0].events[0].metadata.reason === 'Snap rule applied', "Expected snap rule reason");
    console.log("✓ GeneratePreviewResponseDTO shape valid");

    console.log("✓ All Epic 4 API Contract tests passed!");
}

if (require.main === module) {
    runTests().catch(e => {
        console.error(e);
        process.exit(1);
    });
}
