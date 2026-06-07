"use client";

interface Props {
  label?: string;
  confirmMessage: string;
}

export function DeleteConfirmButton({ label = "삭제", confirmMessage }: Props) {
  return (
    <button
      type="submit"
      className="text-xs text-[var(--color-danger)]"
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
