import { ShieldCheck } from "lucide-react";

export default function SecureNote() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "16px",
        fontSize: "0.875rem",
        opacity: 0.75,
      }}
    >
      <ShieldCheck size={18} />

      <span>
        Tus datos se procesan de forma segura.
      </span>
    </div>
  );
}