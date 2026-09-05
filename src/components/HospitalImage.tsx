import Image from "next/image";
import type { Hospital } from "@/types";
import { DepartmentIcon } from "./DepartmentIcon";

export function HospitalImage({
  hospital,
  priority = false,
  className = "",
}: {
  hospital: Hospital;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-[var(--color-surface-bg2)] ${className}`}>
      {hospital.coverImage ? (
        <Image
          src={hospital.coverImage.cardUrl}
          alt={hospital.coverImage.alt || `${hospital.nameKr} 시설`}
          fill
          priority={priority}
          placeholder={hospital.coverImage.blurDataURL ? "blur" : "empty"}
          blurDataURL={hospital.coverImage.blurDataURL}
          sizes="(max-width: 768px) 100vw, 520px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(145deg,var(--color-surface-bg2),var(--color-surface-bg3))]">
          <DepartmentIcon
            slug={hospital.departmentSlug}
            size={48}
            strokeWidth={1.3}
            className="text-[var(--color-primary-600)]"
          />
        </div>
      )}
    </div>
  );
}
