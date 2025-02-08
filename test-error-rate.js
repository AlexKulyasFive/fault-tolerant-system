const axios = require('axios');

const API_ENDPOINT = 'https://dq79zssfza.execute-api.us-east-1.amazonaws.com/dev/tasks';
const TOTAL_TESTS = 30;
const DELAY_BETWEEN_REQUESTS = 1000;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    let successful = 0;
    let failed = 0;
    let processing = 0;
    const tasks = [];

    console.log(`Start testing. Requests amont: ${TOTAL_TESTS}`);
    console.log('Expected error rate: ~30%\n');

    // Створюємо задачі
    for (let i = 0; i < TOTAL_TESTS; i++) {
        try {
            console.log(`Send task ${i + 1}/${TOTAL_TESTS}`);

            const response = await axios.post(API_ENDPOINT, {
                message: "Test task"
            });

            tasks.push(response.data.taskId);
            await sleep(DELAY_BETWEEN_REQUESTS);

        } catch (error) {
            console.error(`Error during task creation ${i + 1}:`, error.message);
        }
    }

    console.log('\nWaiting 45 sec for tasks to complete...');
    await sleep(45000);

    // Перевіряємо результати
    for (const taskId of tasks) {
        try {
            const response = await axios.get(`${API_ENDPOINT}/${taskId}`);
            const status = response.data.status;
            const retryCount = response.data.retryCount || 0;

            switch(status) {
                case 'COMPLETED':
                    successful++;
                    break;
                case 'FAILED':
                    failed++;
                    break;
                case 'PROCESSING':
                    processing++;
                    break;
            }

            console.log(`TASK ${taskId}: ${status} (Retries: ${retryCount})`);
            await sleep(500);

        } catch (error) {
            console.error(`Error during task check ${taskId}:`, error.message);
        }
    }

    // Виводимо статистику
    console.log('\nTest results:');
    console.log(`Tasks amount: ${tasks.length}`);
    console.log(`COMPLETED: ${successful} (${(successful/tasks.length*100).toFixed(1)}%)`);
    console.log(`FAILED: ${failed} (${(failed/tasks.length*100).toFixed(1)}%)`);
    if (processing > 0) {
        console.log(`IN PROGRESS: ${processing} (${(processing/tasks.length*100).toFixed(1)}%)`);
    }
}

runTest().catch(console.error);