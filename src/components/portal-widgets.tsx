"use client";
import { useState } from "react";
import { Copy, Check, ChartNoAxesCombined } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className="referral-code">
      <code>{code}</code>
      <button
        aria-label="Copy referral code"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          } catch {
            setError(true);
          }
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
        {copied ? "Copied" : error ? "Select code to copy" : "Copy"}
      </button>
    </div>
  );
}
export function StatusChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  if (!data.length)
    return (
      <div className="chart-empty">
        <ChartNoAxesCombined size={30} />
        <span>Your activity will appear here.</span>
      </div>
    );
  return (
    <div
      role="img"
      aria-label={data.map((d) => `${d.name}: ${d.count}`).join(", ")}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 0, bottom: 15, left: -25 }}
        >
          <CartesianGrid vertical={false} stroke="#eef1f6" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip />
          <Bar
            dataKey="count"
            fill="#245ff2"
            radius={[4, 4, 0, 0]}
            maxBarSize={35}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
