import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import { RESPONSE_TYPES } from "../../constants/abaResponseTypes";

const GUARDIAN_HELP_LABELS = {
  independent: "Sozinho(a)",
  minimal_prompt: "Pouca ajuda",
  partial_prompt: "Ajuda moderada",
  full_prompt: "Muita ajuda",
  no_response: "Sem resposta",
};

export default function ProgressStackedBar({ labels, sessionsCounts, variant = "therapist" }) {
  const isGuardian = variant === "guardian";
  const datasets = useMemo(
    () =>
      RESPONSE_TYPES.map((t) => ({
        label: isGuardian ? GUARDIAN_HELP_LABELS[t.key] || t.label : t.label,
        data: sessionsCounts.map((row) => row[t.key] || 0),
        backgroundColor: t.color,
        stack: "s",
      })),
    [sessionsCounts, isGuardian]
  );

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12 } },
      title: {
        display: true,
        text: isGuardian ? "Como foi cada sessão (tipos de apoio)" : "Tentativas por tipo de resposta",
      },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  return <Bar data={data} options={options} />;
}
