import { PlanDefinition } from '../entities/PlanConfig';
import { PlanDay } from '../../../core/types';

export interface PlanRecord {
    id: string;
    config: PlanDefinition;
    days: PlanDay[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IPlanRepository {
    save(plan: PlanRecord): Promise<void>;
    findById(id: string): Promise<PlanRecord | null>;
    findByUserId(userId: string): Promise<PlanRecord[]>;
    delete(id: string): Promise<void>;
}
