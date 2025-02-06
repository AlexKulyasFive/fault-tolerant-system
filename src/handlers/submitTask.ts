import { APIGatewayProxyHandler } from 'aws-lambda';
import { SQS } from 'aws-sdk';
import { Task, TaskStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

const sqs = new SQS();

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing request body' })
            };
        }

        const payload = JSON.parse(event.body);

        const task: Task = {
            taskId: uuidv4(),
            payload,
            createdAt: new Date().toISOString(),
            status: TaskStatus.PENDING
        };

        // TODO: Додати логіку відправки в SQS

        return {
            statusCode: 200,
            body: JSON.stringify({ taskId: task.taskId })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};