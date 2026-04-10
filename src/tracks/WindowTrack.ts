// src/tracks/WindowTrack.ts
import { BaseTrack } from './BaseTrack';
import { WindowStrategy } from '../strategies/WindowStrategy';
import { WindowMode } from '../core/constants';
import { IMovementStrategy } from '../strategies/IMovementStrategy';

interface WindowTrackConfig {
    historySourceId: number;
    count: number;
    mode: WindowMode;
    [key: string]: unknown;
}

export class WindowTrack extends BaseTrack {
    constructor(
        id: number,
        name: string,
        sourceTrackId: number,
        lookBackCount: number,
        mode: WindowMode = WindowMode.GRADUAL,  // ← default حتى لا يتكسر أي كود قديم
        customStrategy?: IMovementStrategy,
        customConfig?: Partial<WindowTrackConfig>
    ) {
        const strategy = customStrategy ?? new WindowStrategy();
        const config: WindowTrackConfig = {
            historySourceId: sourceTrackId,
            count: lookBackCount,
            mode,
            ...customConfig
        };
        super(id, name, 'window', strategy, config);
    }
}