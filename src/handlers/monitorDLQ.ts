import { SQSHandler } from 'aws-lambda';
import { CloudWatch } from 'aws-sdk';

const cloudwatch = new CloudWatch();

export const handler: SQSHandler = async (event) => {
    for (const record of event.Records) {
        const task = JSON.parse(record.body);

        console.error('Failed task in DLQ:', {
            taskId: task.taskId,
            payload: task.payload,
            retryCount: task.retryCount
        });

        // Відправляємо метрики в CloudWatch
        await cloudwatch.putMetricData({
            Namespace: 'FaultTolerantSystem',
            MetricData: [
                {
                    MetricName: 'FailedTasks',
                    Value: 1,
                    Unit: 'Count',
                    Dimensions: [
                        {
                            Name: 'TaskId',
                            Value: task.taskId
                        }
                    ]
                }
            ]
        }).promise();
    }
};