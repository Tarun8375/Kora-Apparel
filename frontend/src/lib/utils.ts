import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  try {
    return twMerge(clsx(inputs))
  } catch (err: any) {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
      console.error('[twMerge Exception Guard]: Prevented rendering crash on malformed class object.', err, inputs);
    } else {
      console.error('[twMerge Exception Guard]: Prevented rendering crash on malformed class object.', err?.message || err);
    }
    return clsx(inputs); // Fallback to raw clsx merging
  }
}
