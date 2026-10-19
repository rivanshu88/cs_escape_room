import { generateBinarySearch, type Generated } from "./binarySearch";

export type Generator = (seed: string) => Generated;

// Key = mission folder name inside /missions. A mission without an entry stays static.
export const GENERATORS: Record<string, Generator> = {
  "dsa-binary-search": generateBinarySearch,
};
