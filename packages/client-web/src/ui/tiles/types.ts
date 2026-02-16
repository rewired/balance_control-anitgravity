import type { ReactNode } from "react";

export type SeatId = 1 | 2 | 3 | 4 | 5 | 6;

export type BadgeSlotId = "TL_T" | "T_TR" | "TR_BR" | "BR_B" | "B_BL" | "BL_TL";

export type TileBadgeTone = "neutral" | "warn" | "danger";

export type TileBadge = {
  key: string;
  icon: ReactNode;
  tone?: TileBadgeTone;
};

