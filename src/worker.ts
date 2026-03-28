import { workerData, parentPort } from 'node:worker_threads';
import * as math from 'mathjs';

interface WorkerInput {
  expression: string;
  maxMatrixSize: number;
}

function checkSize(value: unknown, maxMatrixSize: number): void {
  if (math.isMatrix(value)) {
    const size = (value as math.Matrix).size();
    for (const dim of size) {
      if (dim > maxMatrixSize) {
        throw new Error(
          `Result matrix dimension ${dim} exceeds the limit of ${maxMatrixSize}`,
        );
      }
    }
  } else if (Array.isArray(value)) {
    if (value.length > maxMatrixSize) {
      throw new Error(
        `Result array length ${value.length} exceeds the limit of ${maxMatrixSize}`,
      );
    }
    for (const item of value) {
      checkSize(item, maxMatrixSize);
    }
  }
}

const { expression, maxMatrixSize } = workerData as WorkerInput;

try {
  const result = math.evaluate(expression);
  checkSize(result, maxMatrixSize);
  parentPort!.postMessage({ ok: true, value: math.format(result, { precision: 14 }) });
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  parentPort!.postMessage({ ok: false, error: message });
}
