import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { DEFAULT_STORE_DATA } from "@/lib/domain/defaults";
import { storeDataSchema } from "@/lib/domain/schemas";
import type { StoreData } from "@/lib/domain/types";

const STORE_PATH = process.env.PROMPT_COPILOT_STORE_PATH
  ? path.resolve(process.env.PROMPT_COPILOT_STORE_PATH)
  : path.join(process.cwd(), "data", "store.json");
const DATA_DIR = path.dirname(STORE_PATH);

let mutationQueue: Promise<StoreData> = Promise.resolve(DEFAULT_STORE_DATA);

async function ensureStoreExists(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await stat(STORE_PATH);
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(DEFAULT_STORE_DATA, null, 2), "utf8");
  }
}

export async function readStore(): Promise<StoreData> {
  await ensureStoreExists();
  const content = await readFile(STORE_PATH, "utf8");
  const parsed = JSON.parse(content) as unknown;
  return storeDataSchema.parse(parsed);
}

async function writeStoreAtomic(data: StoreData): Promise<void> {
  const tmpPath = `${STORE_PATH}.tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
  await rename(tmpPath, STORE_PATH);
}

export async function mutateStore(
  mutator: (draft: StoreData) => void | StoreData | Promise<void | StoreData>,
): Promise<StoreData> {
  mutationQueue = mutationQueue.then(async () => {
    const current = await readStore();
    const draft: StoreData = structuredClone(current);
    const result = await mutator(draft);
    const next = storeDataSchema.parse(result ?? draft);
    await writeStoreAtomic(next);
    return next;
  });

  return mutationQueue;
}

export function getStorePath(): string {
  return STORE_PATH;
}
