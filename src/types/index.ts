export interface Task {
    taskId: string;
    payload: Record<string, unknown>;
    createdAt: string;
    status: TaskStatus;
    retryCount: number;
    lastError?: string;
    lastProcessedAt?: string;
}

export enum TaskStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    RETRYING = 'RETRYING',
}

export interface TaskError {
    message: string;
    code: string;
    timestamp: string;
    retryCount: number;
}