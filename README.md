# Fault-Tolerant Task Processing System

Відмовостійка система обробки задач, побудована на AWS Lambda, SQS та DynamoDB.

## Архітектура

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

### Компоненти системи:
- **API Gateway**: Приймає HTTP запити для створення та перевірки статусу задач
- **Main Queue**: Основна черга для обробки задач
- **Dead Letter Queue**: Черга для задач, які не вдалося обробити після декількох спроб
- **Lambda Worker**: Обробляє задачі та керує retry-логікою
- **DynamoDB**: Зберігає стан та інформацію про задачі

## Встановлення та розгортання

### Передумови
- Node.js 18.x або новіше
- AWS CLI налаштований з відповідними credentials
- Serverless Framework

### Кроки встановлення

1. Встановіть залежності:
```bash
npm install
```

2. Розгорніть систему:
```bash
npm run deploy
```

## Тестування

### 1. Створення нової задачі

```bash
# Успішний сценарій
curl -X POST https://your-api-url/dev/tasks \
-H "Content-Type: application/json" \
-d '{"message": "SUCCESS"}'

# Сценарій з помилкою
curl -X POST https://your-api-url/dev/tasks \
-H "Content-Type: application/json" \
-d '{"message": "ERROR"}'
```

### 2. Перевірка статусу задачі

```bash
curl https://your-api-url/dev/tasks/{taskId}
```

### Сценарії тестування

1. **Успішна обробка**
    - Відправте задачу з `"message": "SUCCESS"`
    - Очікуваний результат: `status: "COMPLETED"`

2. **Симульована помилка**
    - Відправте задачу з `"message": "ERROR"`
    - Очікуваний результат: `status: "FAILED"` після 2 спроб

3. **Випадкові помилки**
    - Система має 30% ймовірність помилки для будь-якої задачі
    - Можна протестувати масово за допомогою скрипта (підставити свій ендпоінт fault-tolerant-system/test-error-rate.js):
   ```bash
    npm run test:error-rate
   ```

## Моніторинг та логи

- CloudWatch Logs для кожної Lambda функції
- CloudWatch Metrics для SQS черг
- DynamoDB записи для відстеження статусу задач

## Особливості та обмеження

- Максимум 2 повторні спроби для кожної задачі
- Експоненційний backoff між спробами
- 30% ймовірність симульованої помилки
- Максимальний час затримки повторної спроби - 15 хвилин

## Видалення системи

Для видалення всіх ресурсів:
```bash
npm run remove
```

## Технічний стек

- TypeScript
- AWS Lambda
- Amazon SQS
- Amazon DynamoDB
- Serverless Framework
- AWS SDK v2