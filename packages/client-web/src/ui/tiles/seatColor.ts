import type { SeatId } from "./types";

export function seatColor(seat: SeatId): string {
  return `var(--seat-${seat})`;
}
