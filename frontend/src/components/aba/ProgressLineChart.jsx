import React from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

export default function ProgressLineChart({ labels, independenceRates, variant = "therapist" }) {
  const isGuardian = variant === "guardian";
  const data = {
    labels,
    datasets: [
      {
        label: isGuardian ? "Progresso (%)" : "Independência (%)",
        data: independenceRates,
        borderColor: "#0f172a",
        backgroundColor: "rgba(15, 23, 42, 0.08)",
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
      title: {
        display: true,
        text: isGuardian ? "Como foi o progresso em cada sessão" : "Evolução da independência por sessão",
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { callback: (v) => `${v}%` },
      },
    },
  };

  return <Line data={data} options={options} />;
}
