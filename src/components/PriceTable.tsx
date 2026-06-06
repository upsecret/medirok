interface PriceRow {
  treatment: string;
  priceRange: string;
  note?: string;
}

interface PriceTableProps {
  rows: PriceRow[];
  title?: string;
}

export function PriceTable({ rows, title = "가격 비교" }: PriceTableProps) {
  if (!rows || rows.length === 0) return null;
  return (
    <section className="my-8" aria-label={title}>
      <h2 className="text-lg font-medium mb-3">{title}</h2>
      <div className="bg-white border border-[var(--color-surface-border)] rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-bg)]">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">
                항목
              </th>
              <th className="text-right px-4 py-3 font-medium text-[var(--color-text-secondary)]">
                가격
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className={i < rows.length - 1 ? "border-b border-[var(--color-surface-divider)]" : ""}
              >
                <td className="px-4 py-3">
                  {r.treatment}
                  {r.note && (
                    <span className="text-xs text-[var(--color-text-muted)] ml-2">
                      ({r.note})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium text-[var(--color-primary-600)]">
                  {r.priceRange}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
