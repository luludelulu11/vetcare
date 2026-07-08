export default function FormHeader({
  title,
  subtitle,
  className = "",
  children,
}) {
  return (
    <header className={`form-header ${className}`}>
      <div className="form-header__content">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {children}
    </header>
  );
}