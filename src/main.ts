// src/main.ts
import { getScenarioByKey, scenarios } from './scenarios';
import { runScenario } from './scenarios/runScenario';

function printHelp() {
    console.log(`
MakenCore Scenario Launcher

Usage:
npm start
npm start -- --scenario=beginner
npm start -- --scenario=intermediate --excel
npm start -- --all --excel
npm start -- --list
npm start -- --help

Flags:
--scenario=<key>    Run one scenario by key
--all               Run all scenarios
--excel             Export Excel in addition to console output
--list              List available scenarios
--help              Show help
    `);
}

function printScenarioList() {
    console.log('\nAvailable scenarios:\n');
    for (const scenario of scenarios) {
        console.log(`- ${scenario.key}: ${scenario.title}`);
        console.log(`  ${scenario.description}`);
        if (scenario.notes) {
            for (const note of scenario.notes) {
                console.log(`  note: ${note}`);
            }
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    const isExcelMode = args.includes('--excel');
    const isHelpMode = args.includes('--help') || args.includes('-h');
    const isListMode = args.includes('--list');
    const isAllMode = args.includes('--all');
    const scenarioArg = args.find((arg) => arg.startsWith('--scenario='));
    const scenarioKey = scenarioArg ? scenarioArg.split('=')[1] : undefined;

    if (isHelpMode) {
        printHelp();
        return;
    }

    if (isListMode) {
        printScenarioList();
        return;
    }

    console.log('\nMakenCore Scenario Launcher\n');

    try {
        if (isAllMode) {
            for (const scenario of scenarios) {
                await runScenario(scenario, {
                    printToConsole: true,
                    exportExcel: isExcelMode
                });
            }
            return;
        }

        const selectedScenario = scenarioKey ? getScenarioByKey(scenarioKey) : scenarios[0];

        if (!selectedScenario) {
            console.error(`Unknown scenario: ${scenarioKey}`);
            printScenarioList();
            process.exitCode = 1;
            return;
        }

        await runScenario(selectedScenario, {
            printToConsole: true,
            exportExcel: isExcelMode
        });
    } catch (error) {
        console.error('Critical Error:', error);
    }
}

// Run the program
main().catch(console.error);