export async function initBatchProgress(batchId: string, total: number): Promise<void> {
  void batchId;
  void total;
}

export async function updateBatchProgress(batchId: string, updates: Record<string, unknown>): Promise<void> {
  void batchId;
  void updates;
}

export async function markBatchComplete(batchId: string, status: 'completed' | 'partial'): Promise<void> {
  void batchId;
  void status;
}

export async function deleteBatchProgress(batchId: string): Promise<void> {
  void batchId;
}
