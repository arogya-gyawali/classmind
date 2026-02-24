"use client";
import { createContext } from "react";

export type Mode = "guided" | "direct";

export const ModeContext = createContext<{ mode: Mode; setMode: (m: Mode) => void }>({
  mode: "guided",
  setMode: () => {}
});
