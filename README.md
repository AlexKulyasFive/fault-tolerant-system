# Fault-Tolerant Task Processing System

A fault-tolerant task processing system built on AWS Lambda, SQS, and DynamoDB.

## Architecture

```ascii
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   API        │     │    Main      │     │   Lambda     │
│   Gateway    │────►│    Queue     │────►│   Worker     │
└──────────────┘     └──────────────┘     └──────────────┘
       ▲                     │                    │
       │                     │                    │
       │                     ▼                    ▼
       │            ┌──────────────┐     ┌──────────────┐
       │            │    Dead      │     │   DynamoDB   │
       └────────────│   Letter     │     │    Table     │
                    │    Queue     │     │              │
                    └──────────────┘     └──────────────┘
```

### System Components:
- **API Gateway**: Accepts HTTP requests for task creation and status checking
- **Main Queue**: Primary queue for task processing
- **Dead Letter Queue**: Queue for tasks that failed after multiple attempts
- **Lambda Worker**: Processes tasks and manages retry logic
- **DynamoDB**: Stores task state and information

## Installation and Deployment

### Prerequisites
- Node.js 18.x or newer
- AWS CLI configured with appropriate credentials
- Serverless Framework

### Installation Steps

1. Install dependencies:
```bash
npm install
```

2. Deploy the system:
```bash
npm run deploy
```

## Testing

### 1. Creating a New Task

```bash
# Success scenario
curl -X POST https://your-api-url/dev/tasks \
-H "Content-Type: application/json" \
-d '{"message": "SUCCESS"}'

# Error scenario
curl -X POST https://your-api-url/dev/tasks \
-H "Content-Type: application/json" \
-d '{"message": "ERROR"}'
```

### 2. Checking Task Status

```bash
curl https://your-api-url/dev/tasks/{taskId}
```

### Test Scenarios

1. **Successful Processing**
   - Send a task with `"message": "SUCCESS"`
   - Expected result: `status: "COMPLETED"`

2. **Simulated Error**
   - Send a task with `"message": "ERROR"`
   - Expected result: `status: "FAILED"` after 2 attempts

3. **Random Errors**
   - System has a 30% probability of error for any task
   - Can be tested in bulk using the script (insert your endpoint in fault-tolerant-system/test-error-rate.js):
   ```bash
    npm run test:error-rate
   ```

## Monitoring and Logs

- CloudWatch Logs for each Lambda function
- CloudWatch Metrics for SQS queues
- DynamoDB records for task status tracking

## Features and Limitations

- Maximum of 2 retry attempts per task
- Exponential backoff between attempts
- 30% probability of simulated error
- Maximum retry delay of 15 minutes

## System Removal

To remove all resources:
```bash
npm run remove
```

## Tech Stack

- TypeScript
- AWS Lambda
- Amazon SQS
- Amazon DynamoDB
- Serverless Framework
- AWS SDK v2