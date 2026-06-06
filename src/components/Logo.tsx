// 메디록 로고 (Concept 04B — 錄 Vault)
// 메인 로고로 사용. favicon은 別도로 M Vault 사용.

interface LogoProps {
  size?: number;
  variant?: "light" | "dark";
  showWordmark?: boolean;
}

export function Logo({ size = 32, variant = "light", showWordmark = true }: LogoProps) {
  const isDark = variant === "dark";
  const bg = isDark ? "#B89968" : "#2D3748";
  const fg = isDark ? "#2D3748" : "#B89968";

  return (
    <div className="flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 72 72"
        role="img"
        aria-label="메디록"
      >
        <rect x="6" y="6" width="60" height="60" rx="14" fill={bg} />
        <text
          x="36"
          y="51"
          fontFamily="serif"
          fontSize="36"
          fill={fg}
          textAnchor="middle"
          fontWeight="500"
        >
          錄
        </text>
      </svg>
      {showWordmark && (
        <span
          className="font-medium"
          style={{
            fontSize: size * 0.55,
            color: isDark ? "var(--color-text-inverse)" : "var(--color-text-primary)",
          }}
        >
          메디록
        </span>
      )}
    </div>
  );
}
