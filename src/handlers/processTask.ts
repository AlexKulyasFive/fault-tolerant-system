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

        console.log(`Processing task ${task.taskId}, attempt ${approximateReceiveCount}`);

        try {
            // Оновлюємо статус на "PROCESSING"
            await updateTaskStatus(task.taskId, TaskStatus.PROCESSING);

            // Перевіряємо чи це тестова помилка
            if (task.payload.message === 'ERROR') {
                throw new Error('Simulated error for testing');
            }

            // Симулюємо випадкову помилку з ймовірністю 30%
            if (shouldSimulateError()) {
                throw new Error('Simulated random processing error');
            }

            // Якщо обробка успішна
            await updateTaskStatus(task.taskId, TaskStatus.COMPLETED);
            console.log(`Task ${task.taskId} completed successfully`);

        } catch (error) {
            console.error(`Error processing task ${task.taskId}:`, error);

            // Перевіряємо чи це остання спроба (maxReceiveCount = 3)
            if (approximateReceiveCount >= 3) {
                console.log(`Task ${task.taskId} failed permanently after ${approximateReceiveCount} attempts`);
                await updateTaskStatus(task.taskId, TaskStatus.FAILED);
                // Не кидаємо помилку - повідомлення буде видалено з черги і переміщено в DLQ
                return;
            }

            // Якщо це не остання спроба
            await updateTaskStatus(
                task.taskId,
                TaskStatus.RETRYING,
                approximateReceiveCount
            );

            // Кидаємо помилку щоб SQS повторно обробив повідомлення
            throw error;
        }
    }
};

async function updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    retryCount?: number
): Promise<void> {
    const updateParams: any = {
        TableName: process.env.TABLE_NAME!,
        Key: { taskId },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': status }
    };

    // Додаємо лічильник спроб, якщо він переданий
    if (retryCount !== undefined) {
        updateParams.UpdateExpression += ', retryCount = :retryCount';
        updateParams.ExpressionAttributeValues[':retryCount'] = retryCount;
    }

    await dynamoDB.update(updateParams).promise();
}