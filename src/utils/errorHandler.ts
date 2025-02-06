export const shouldSimulateError = (): boolean => {
    // 30% ймовірність помилки
    return Math.random() < 0.3;
};

export const calculateBackoff = (retryCount: number): number => {
    // Експоненціальний відступ: 2^retryCount * 1000 мс
    // Наприклад: 1-ша спроба - 2 сек, 2-га спроба - 4 сек
    return Math.pow(2, retryCount) * 1000;
};