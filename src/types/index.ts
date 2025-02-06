export interface Task {
    taskId: string;
    payload: Record<string, unknown>;
    createdAt: string;
    status: TaskStatus;
    retryCount?: number;
}

export enum TaskStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export interface TaskError {
    message: string;
    code: string;
    timestamp: string;
}