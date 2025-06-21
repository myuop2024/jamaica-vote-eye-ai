import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { format as formatDateFns, parse as parseDateFns, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a Date object or a date string into DD/MM/YYYY string format.
 * @param date The date to format. Can be a Date object, or a string parsable by Date.
 * @returns The formatted date string (DD/MM/YYYY) or an empty string if the date is invalid or null.
 */
export function formatDateToDisplay(date: Date | string | null | undefined): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseDateFns(date, 'yyyy-MM-dd', new Date()) : date;
    if (!isValid(dateObj)) { // Check if date is valid after parsing or if it's an invalid Date object
        // try parsing as ISO string if it's a string and previous parse failed
        if (typeof date === 'string') {
            const isoDateObj = new Date(date);
            if (isValid(isoDateObj)) return formatDateFns(isoDateObj, 'dd/MM/yyyy');
        }
        console.warn('formatDateToDisplay: Received invalid date:', date);
        return '';
    }
    return formatDateFns(dateObj, 'dd/MM/yyyy');
  } catch (error) {
    console.error("Error formatting date to display:", error);
    return '';
  }
}

/**
 * Parses a DD/MM/YYYY string into a YYYY-MM-DD string.
 * Returns an empty string if parsing fails or input is invalid.
 * @param dateString The date string in DD/MM/YYYY format.
 * @returns Date string in YYYY-MM-DD format, or empty string for invalid input.
 */
export function parseDisplayDateToISO(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const parsedDate = parseDateFns(dateString, 'dd/MM/yyyy', new Date());
    if (isValid(parsedDate)) {
      return formatDateFns(parsedDate, 'yyyy-MM-dd');
    }
    return ''; // Invalid date string
  } catch (error) {
    console.error("Error parsing display date to ISO:", error);
    return '';
  }
}

/**
 * Parses a DD/MM/YYYY string into a Date object.
 * Returns null if parsing fails or input is invalid.
 * @param dateString The date string in DD/MM/YYYY format.
 * @returns Date object or null for invalid input.
 */
export function parseDisplayDateToDateObject(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  try {
    const parsedDate = parseDateFns(dateString, 'dd/MM/yyyy', new Date());
    return isValid(parsedDate) ? parsedDate : null;
  } catch (error) {
    console.error("Error parsing display date to Date object:", error);
    return null;
  }
}

/**
 * Formats a Date object or a date string (expected to be YYYY-MM-DD or ISO) into a YYYY-MM-DD string.
 * Useful for ensuring consistent format for backend/database.
 * @param date The date to format.
 * @returns The formatted date string (YYYY-MM-DD) or an empty string if invalid.
 */
export function formatDateToISO(date: Date | string | null | undefined): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date; // More flexible parsing for string input
    if (!isValid(dateObj)) {
        console.warn('formatDateToISO: Received invalid date:', date);
        return '';
    }
    return formatDateFns(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error("Error formatting date to ISO:", error);
    return '';
  }
}
