import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const taskId = event.pathParameters?.taskId;

        if (!taskId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'TaskId is required' })
            };
        }

        const result = await dynamoDB.get({
            TableName: process.env.TABLE_NAME!,
            Key: { taskId }
        }).promise();

        if (!result.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Task not found' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(result.Item)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};