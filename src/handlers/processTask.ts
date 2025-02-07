import { SQSHandler } from 'aws-lambda';
import { SQS, DynamoDB } from 'aws-sdk';
import { Task, TaskStatus } from '@/types';
import { shouldSimulateError, calculateBackoff } from '@/utils/errorHandler';

const sqs = new SQS();
const dynamoDB = new DynamoDB.DocumentClient();

export const handler: SQSHandler = async (event) => {
    for (const record of event.Records) {
        const task: Task = JSON.parse(record.body);

        try {
            // Оновлюємо статус на "PROCESSING"
            await updateTaskStatus(task.taskId, TaskStatus.PROCESSING);

            if (task.payload.message === 'ERROR') {
                throw new Error('Simulated error for testing');
            }

            // Симулюємо обробку задачі
            if (shouldSimulateError()) {
                throw new Error('Simulated processing error');
            }

            // Якщо обробка успішна
            await updateTaskStatus(task.taskId, TaskStatus.COMPLETED);
            console.log(`Task ${task.taskId} completed successfully`);

        } catch (error) {
            console.error(`Error processing task ${task.taskId}:`, error);

            const retryCount = (task.retryCount || 0) + 1;
            const backoffTime = calculateBackoff(retryCount);

            if (retryCount <= 2) { // Максимум 2 спроби
                // Оновлюємо лічильник спроб
                await dynamoDB.update({
                    TableName: process.env.TABLE_NAME!,
                    Key: { taskId: task.taskId },
                    UpdateExpression: 'SET retryCount = :count, #status = :status',
                    ExpressionAttributeNames: { '#status': 'status' },
                    ExpressionAttributeValues: {
                        ':count': retryCount,
                        ':status': TaskStatus.FAILED
                    }
                }).promise();

                // Відправляємо назад в чергу з затримкою
                await sqs.sendMessage({
                    QueueUrl: process.env.QUEUE_URL!,
                    MessageBody: JSON.stringify({ ...task, retryCount }),
                    DelaySeconds: Math.min(Math.floor(backoffTime / 1000), 900) // Максимум 15 хвилин
                }).promise();
            } else {
                // Задача автоматично потрапить в DLQ після перевищення maxReceiveCount
                await updateTaskStatus(task.taskId, TaskStatus.FAILED);
            }

            throw error; // Перекидаємо помилку, щоб повідомлення не було видалено з черги
        }
    }
};

async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    await dynamoDB.update({
        TableName: process.env.TABLE_NAME!,
        Key: { taskId },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': status }
    }).promise();
}