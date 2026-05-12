export const TEST_FLOW_STORAGE_KEYS = {
  answers: "emotionlab_test_answers",
  hobbies: "emotionlab_test_hobbies",
  result: "emotionlab_test_result",
} as const;

export type TestFlowStorageKey = keyof typeof TEST_FLOW_STORAGE_KEYS;

export function getUserTestFlowStorageKey(userId: string, key: TestFlowStorageKey): string {
  return `${TEST_FLOW_STORAGE_KEYS[key]}:${userId}`;
}

export function clearLegacyTestFlowStorage(): void {
  if (typeof window === "undefined") return;

  Object.values(TEST_FLOW_STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

export function clearUserTestFlowStorage(userId: string): void {
  if (typeof window === "undefined") return;

  (Object.keys(TEST_FLOW_STORAGE_KEYS) as TestFlowStorageKey[]).forEach((key) => {
    const storageKey = getUserTestFlowStorageKey(userId, key);
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey);
  });
}
