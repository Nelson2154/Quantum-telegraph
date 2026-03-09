"use client";

import dynamic from "next/dynamic";

const QuantumTelegraph = dynamic(() => import("./QuantumTelegraph"), {
  ssr: false,
});

export default function Page() {
  return <QuantumTelegraph />;
}
