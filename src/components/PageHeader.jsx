import "../styles/pageHeader.css";

/**
 * Header for secondary/detail pages.
 * variant: "glass" (B, default) | "tint" (C) | "bare" (D) | "hero" (A)
 * icon: rendered inside a tinted chip before the heading (e.g. <PawPrint size={24} />)
 * onBack: shows the reusable back button when provided
 * backClassName: extra classes for the back button (e.g. counter-scale "btn-back--s75")
 * children: right-side actions (buttons, badges)
 */
export default function PageHeader({
  title,
  subtitle,
  icon,
  variant = "glass",
  onBack,
  backLabel = "Volver",
  backClassName = "",
  className = "",
  children,
}) {
  return (
    <header className={`page-header page-header--${variant} ${className}`}>
      <div className="page-header__left">
        {onBack && (
          <button
            type="button"
            className={`btn-back ${backClassName}`}
            onClick={onBack}
            aria-label={backLabel}
          >
            ←
          </button>
        )}

        {icon && (
          <span className="page-header__icon" aria-hidden="true">
            {icon}
          </span>
        )}

        <hgroup className="page-header__heading">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </hgroup>
      </div>

      {children && <div className="page-header__actions">{children}</div>}
    </header>
  );
}
