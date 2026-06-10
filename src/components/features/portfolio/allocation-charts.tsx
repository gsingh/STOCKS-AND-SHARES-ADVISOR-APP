import { useState, useCallback } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../../lib/format'
import type { AllocationItem } from '../../../features/portfolio/portfolio-calculations'

interface AllocationChartsProps {
  sectorData: AllocationItem[]
  marketCapData: AllocationItem[]
  styleData: AllocationItem[]
  onFilterChange: (filter: { type: string; name: string } | null) => void
}

const CHART_COLORS = [
  'var(--chart-color-1, #2E8B57)',
  'var(--chart-color-2, #2563EB)',
  'var(--chart-color-3, #D97706)',
  'var(--chart-color-4, #DC2626)',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#84CC16',
  '#06B6D4',
  '#A855F7',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#6366F1',
]

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--popover)] p-2 text-xs shadow-lg">
      <div className="font-medium text-[var(--popover-foreground)]">{item.name}</div>
      <div className="text-[var(--muted-foreground)]">{formatCurrency(item.value)}</div>
      <div className="text-[var(--muted-foreground)]">{item.percentage.toFixed(1)}%</div>
    </div>
  )
}

interface DonutProps {
  title: string
  data: AllocationItem[]
  onSliceClick: (name: string) => void
  activeFilter: string | null
}

function DonutChart({ title, data, onSliceClick, activeFilter }: DonutProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="mb-2 text-sm font-semibold text-[var(--card-foreground)]">{title}</h3>
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-[var(--muted-foreground)]">
          No data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              onClick={(entry) => onSliceClick(entry.name)}
              cursor="pointer"
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  opacity={activeFilter && activeFilter !== entry.name ? 0.3 : 1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      )}
      <div className="mt-2 space-y-1">
        {data.map((item, i) => (
          <div
            key={item.name}
            onClick={() => onSliceClick(item.name)}
            className={`flex cursor-pointer items-center justify-between rounded px-2 py-0.5 text-xs transition-colors hover:bg-[var(--muted)] ${
              activeFilter && activeFilter !== item.name ? 'opacity-30' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="text-[var(--foreground)]">{item.name}</span>
            </div>
            <span className="tabular-nums text-[var(--muted-foreground)]">
              {item.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AllocationCharts({ sectorData, marketCapData, styleData, onFilterChange }: AllocationChartsProps) {
  const [activeFilter, setActiveFilter] = useState<{ type: string; name: string } | null>(null)

  const handleSliceClick = useCallback((type: string, name: string) => {
    if (activeFilter?.type === type && activeFilter?.name === name) {
      setActiveFilter(null)
      onFilterChange(null)
    } else {
      setActiveFilter({ type, name })
      onFilterChange({ type, name })
    }
  }, [activeFilter, onFilterChange])

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <DonutChart
        title="Sector Allocation"
        data={sectorData}
        onSliceClick={(name) => handleSliceClick('sector', name)}
        activeFilter={activeFilter?.type === 'sector' ? activeFilter.name : null}
      />
      <DonutChart
        title="Market Cap Allocation"
        data={marketCapData}
        onSliceClick={(name) => handleSliceClick('marketCap', name)}
        activeFilter={activeFilter?.type === 'marketCap' ? activeFilter.name : null}
      />
      <DonutChart
        title="Investment Style"
        data={styleData}
        onSliceClick={(name) => handleSliceClick('style', name)}
        activeFilter={activeFilter?.type === 'style' ? activeFilter.name : null}
      />
    </div>
  )
}
