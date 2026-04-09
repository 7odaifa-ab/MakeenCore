import { PlanExporter } from '../utils/PlanExporter';
import { ScenarioDefinition } from './index';

export async function runScenario(
    scenario: ScenarioDefinition,
    options: { printToConsole: boolean; exportExcel: boolean }
): Promise<void> {
    console.log(`\n=== ${scenario.title} ===`);
    console.log(scenario.description);

    if (scenario.notes && scenario.notes.length > 0) {
        for (const note of scenario.notes) {
            console.log(`- ${note}`);
        }
    }

    const manager = scenario.create();
    console.time(`Generation Time (${scenario.key})`);
    const plan = manager.generatePlan();
    console.timeEnd(`Generation Time (${scenario.key})`);
    console.log(`Generated ${plan.length} days.\n`);

    const exporter = new PlanExporter();

    if (options.printToConsole) {
        exporter.printToConsole(plan);
    }

    if (options.exportExcel) {
        const fileName = `QuranPlan_${scenario.key}_${new Date().toISOString().split('T')[0]}.xlsx`;
        console.log(`Saving Excel file: ${fileName}...`);
        await exporter.exportToExcel(plan, fileName);
    }
}
