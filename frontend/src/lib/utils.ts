import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  try {
    return twMerge(clsx(inputs))
  } catch (err) {
    console.error('[twMerge Exception Guard]: Prevented rendering crash on malformed class object.', err, inputs);
    return clsx(inputs); // Fallback to raw clsx merging without tailwind's specific collision resolution
  }
}
