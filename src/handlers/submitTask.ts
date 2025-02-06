import { APIGatewayProxyHandler } from 'aws-lambda';
import { SQS, DynamoDB } from 'aws-sdk';
import { Task, TaskStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

const sqs = new SQS();
const dynamoDB = new DynamoDB.DocumentClient();

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
            status: TaskStatus.PENDING,
            retryCount: 0
        };

        // Зберігаємо задачу в DynamoDB
        await dynamoDB.put({
            TableName: process.env.TABLE_NAME!,
            Item: task
        }).promise();

        // Відправляємо задачу в чергу
        await sqs.sendMessage({
            QueueUrl: process.env.QUEUE_URL!,
            MessageBody: JSON.stringify(task)
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                taskId: task.taskId,
                message: 'Task submitted successfully'
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};