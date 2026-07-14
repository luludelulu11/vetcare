import { ArrowLeft } from "lucide-react";

export default function PageHeader({
  icon,
  title,
  subtitle,
  onBack,
  backClassName = "",
  variant = "",
}) {
  return (
    <header
      className={`page-header ${
        variant ? `page-header--${variant}` : ""
      }`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className={backClassName}
          aria-label="Volver"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "8px",
          }}
        >
          <ArrowLeft size={20} />
        </button>
      )}

      {icon && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      )}

      <div>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>{title}</h1>

        {subtitle && (
          <p style={{ margin: "4px 0 0", opacity: 0.7 }}>
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}