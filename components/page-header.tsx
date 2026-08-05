export function PageHeader({
  title,
  description,
  children,
  style,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={`page-header ${className ?? ""}`.trim()} style={style}>
      <div className="page-header-text">
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {children ? <div className="page-header-actions">{children}</div> : null}
    </div>
  );
}
