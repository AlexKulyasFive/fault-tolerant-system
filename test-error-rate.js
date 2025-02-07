const axios = require('axios');

const API_ENDPOINT = 'https://wz30sthcpg.execute-api.us-east-1.amazonaws.com/dev/tasks';
const TOTAL_TESTS = 20;
const DELAY_BETWEEN_REQUESTS = 1000;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    let successful = 0;
    let failed = 0;
    let processing = 0;
    const tasks = [];

    console.log(`Починаємо тестування. Всього запитів: ${TOTAL_TESTS}`);
    console.log('Очікувана кількість помилок: ~30%\n');

    // Створюємо задачі
    for (let i = 0; i < TOTAL_TESTS; i++) {
        try {
            console.log(`Відправляємо задачу ${i + 1}/${TOTAL_TESTS}`);

            const response = await axios.post(API_ENDPOINT, {
                message: "Test task"
            });

            tasks.push(response.data.taskId);
            await sleep(DELAY_BETWEEN_REQUESTS);

        } catch (error) {
            console.error(`Помилка створення задачі ${i + 1}:`, error.message);
        }
    }

    console.log('\nЧекаємо 45 секунд на обробку задач...');
    await sleep(45000); // Збільшимо час очікування для retry спроб

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

            console.log(`Задача ${taskId}: ${status} (Спроб: ${retryCount})`);
            await sleep(500);

        } catch (error) {
            console.error(`Помилка перевірки задачі ${taskId}:`, error.message);
        }
    }

    // Виводимо статистику
    console.log('\nРезультати тестування:');
    console.log(`Всього задач: ${tasks.length}`);
    console.log(`Успішно: ${successful} (${(successful/tasks.length*100).toFixed(1)}%)`);
    console.log(`Невдало: ${failed} (${(failed/tasks.length*100).toFixed(1)}%)`);
    if (processing > 0) {
        console.log(`В обробці: ${processing} (${(processing/tasks.length*100).toFixed(1)}%)`);
    }
}

runTest().catch(console.error);