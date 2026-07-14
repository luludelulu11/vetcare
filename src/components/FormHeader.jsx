export default function FormHeader({
  title,
  subtitle,
  children,
}) {
  return (
    <header
      style={{
        position: "relative",
        padding: "24px",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      {children}

      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "1.5rem",
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              margin: "6px 0 0",
              opacity: 0.7,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}