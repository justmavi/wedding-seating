interface Props {
  /** Diameter of the spinner. Accepts a number (px) or any CSS length. */
  size?: number | string;
  /** Optional text shown under the spinner. */
  label?: string;
  /** Padding around the loader — controls how much vertical space it occupies. */
  padding?: number | string;
}

export default function Spinner({
  size = "clamp(26px, 7vw, 40px)",
  label,
  padding = "40px 16px",
}: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding,
        color: "#8a8a84",
      }}
    >
      <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />
      {label && (
        <span style={{ fontSize: "clamp(13px, 3.4vw, 15px)", fontWeight: 500 }}>
          {label}
        </span>
      )}
    </div>
  );
}
