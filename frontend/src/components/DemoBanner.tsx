export default function DemoBanner() {
  return (
    <div
      role="status"
      style={{
        background: "#1e3a5f",
        color: "#fff",
        textAlign: "center",
        fontSize: 13,
        padding: "8px 12px",
        lineHeight: 1.4,
        zIndex: 50,
      }}
    >
      Synthetic demo — not clinical advice. Records are fictional and are not an
      NHS record.
    </div>
  );
}
