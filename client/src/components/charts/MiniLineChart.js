import React, { useMemo } from 'react';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const buildPoints = ({ data, width, height, padding }) => {
  const safe = Array.isArray(data) ? data.filter((d) => Number.isFinite(d?.value)) : [];
  if (safe.length < 2) return '';

  const xs = safe.map((d) => Number(d.x ?? 0));
  const ys = safe.map((d) => Number(d.value));

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1e-9, maxY - minY);

  return safe
    .map((d) => {
      const nx = (Number(d.x ?? 0) - minX) / spanX;
      const ny = (Number(d.value) - minY) / spanY;
      const px = padding + nx * (width - padding * 2);
      const py = padding + (1 - ny) * (height - padding * 2);
      return `${px.toFixed(2)},${py.toFixed(2)}`;
    })
    .join(' ');
};

const MiniLineChart = ({
  series = [],
  width = 220,
  height = 60,
  padding = 6,
  strokeWidth = 2,
  showBaseline = true,
}) => {
  const normalized = useMemo(() => {
    const list = Array.isArray(series) ? series : [];
    return list
      .filter((s) => s && Array.isArray(s.data))
      .map((s) => ({
        ...s,
        color: s.color || '#0d6efd',
        data: s.data
          .map((d) => ({ x: d.x, value: Number(d.value) }))
          .filter((d) => Number.isFinite(d.value)),
      }))
      .filter((s) => s.data.length > 0);
  }, [series]);

  const allValues = useMemo(() => normalized.flatMap((s) => s.data.map((d) => d.value)), [normalized]);
  const minY = allValues.length ? Math.min(...allValues) : 0;
  const maxY = allValues.length ? Math.max(...allValues) : 0;
  const baselineY = maxY === minY ? height / 2 : clamp(height - padding, padding, height - padding);

  if (!normalized.length) {
    return (
      <div style={{ width, height }} className="bg-light border rounded d-flex align-items-center justify-content-center text-muted">
        <small>No data</small>
      </div>
    );
  }

  return (
    <svg width={width} height={height} role="img" aria-label="trend" className="bg-white border rounded">
      {showBaseline && (
        <line x1={padding} y1={baselineY} x2={width - padding} y2={baselineY} stroke="#e9ecef" strokeWidth="1" />
      )}
      {normalized.map((s, idx) => {
        const pts = buildPoints({ data: s.data, width, height, padding });
        return (
          <polyline
            key={idx}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeWidth}
            points={pts}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

export default MiniLineChart;
