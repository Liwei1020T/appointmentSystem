'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface RetentionData {
  retentionRate: number;
  totalOrderingUsers: number;
  repeatUsers: number;
}

const COLORS = ['#F97316', '#E5E7EB']; // Accent, Gray

export default function RetentionChart({ data }: { data: RetentionData }) {
  const oneTimeUsers = data.totalOrderingUsers - data.repeatUsers;

  const chartData = [
    { name: '回头客', value: data.repeatUsers },
    { name: '单次客', value: oneTimeUsers },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" height={36} />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-gray-900 text-2xl font-bold font-mono"
        >
          {data.retentionRate}%
        </text>
        <text
          x="50%"
          y="60%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-gray-500 text-xs"
        >
          留存率
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}
