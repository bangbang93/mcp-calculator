import { workerData, parentPort } from 'node:worker_threads';
import * as math from 'mathjs';

interface WorkerInput {
  expression: string;
  maxMatrixSize: number;
}

function checkMatrixSize(value: unknown, maxMatrixSize: number): void {
  if (math.isMatrix(value)) {
    const m = value as math.Matrix;
    const size = m.size();
    for (const dim of size) {
      if (dim > maxMatrixSize) {
        throw new Error(
          `Result matrix dimension ${dim} exceeds the limit of ${maxMatrixSize}`,
        );
      }
    }
  }
}

const { expression, maxMatrixSize } = workerData as WorkerInput;

try {
  const result = math.evaluate(expression);
  checkMatrixSize(result, maxMatrixSize);
  parentPort!.postMessage({ ok: true, value: math.format(result, { precision: 14 }) });
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  parentPort!.postMessage({ ok: false, error: message });
}
