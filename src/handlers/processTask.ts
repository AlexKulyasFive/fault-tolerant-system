import { SQSHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { Task, TaskStatus } from '@/types';
import { shouldSimulateError } from '@/utils/errorHandler';

const dynamoDB = new DynamoDB.DocumentClient();

export const handler: SQSHandler = async (event) => {
    for (const record of event.Records) {
        const task: Task = JSON.parse(record.body);
        const approximateReceiveCount = parseInt(
            record.attributes.ApproximateReceiveCount
        );

        try {
            await updateTaskStatus(task.taskId, TaskStatus.PROCESSING);

            if (task.payload.message === 'ERROR') {
                throw new Error('Simulated error for testing');
            }

            if (shouldSimulateError()) {
                throw new Error('Simulated random processing error');
            }

            await updateTaskStatus(task.taskId, TaskStatus.COMPLETED);
            console.log(`Task ${task.taskId} completed successfully`);

        } catch (error) {
            console.error(`Error processing task ${task.taskId}:`, error);

            if (approximateReceiveCount >= 3) {
                await updateTaskStatus(
                    task.taskId,
                    TaskStatus.FAILED,
                    approximateReceiveCount,
                    error as Error
                );
            } else {
                await updateTaskStatus(
                    task.taskId,
                    TaskStatus.RETRYING,
                    approximateReceiveCount,
                    error as Error
                );
                throw error; // Перезапускаємо обробку
            }
        }
    }
};


async function updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    retryCount?: number,
    error?: Error
): Promise<void> {
    const updateParams: any = {
        TableName: process.env.TABLE_NAME!,
        Key: { taskId },
        UpdateExpression: 'SET #status = :status, lastProcessedAt = :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
            ':status': status,
            ':now': new Date().toISOString()
        }
    };

    if (retryCount !== undefined) {
        updateParams.UpdateExpression += ', retryCount = :retryCount';
        updateParams.ExpressionAttributeValues[':retryCount'] = retryCount;
    }

    if (error) {
        updateParams.UpdateExpression += ', lastError = :error';
        updateParams.ExpressionAttributeValues[':error'] = error.message;
    }

    await dynamoDB.update(updateParams).promise();
}