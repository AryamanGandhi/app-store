import type { Metadata } from "next";

import { ModeLab } from "@/app/dev/lab/ModeLab";

export const metadata: Metadata = {
  title: "Mode Lab | Game Mode Sandbox",
};

export default function ModeLabPage() {
  return <ModeLab />;
}
