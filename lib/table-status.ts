import type { SeatingTable } from "@/types/seating";

export type TableStatus = "empty" | "available" | "almost-full" | "full";

export function getOpenSeats(table: SeatingTable) {
  return Math.max(0, table.capacity - table.students.length);
}

export function getTableStatus(table: SeatingTable): TableStatus {
  const openSeats = getOpenSeats(table);

  if (openSeats === 0) {
    return "full";
  }

  if (table.students.length === 0) {
    return "empty";
  }

  if (openSeats === 1) {
    return "almost-full";
  }

  return "available";
}
