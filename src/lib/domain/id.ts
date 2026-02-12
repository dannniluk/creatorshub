import { randomUUID } from "node:crypto";

export function createId(prefix: string): string {
  const token = randomUUID().replaceAll("-", "").slice(0, 12);
  return `${prefix}_${token}`;
}
