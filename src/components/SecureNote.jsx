import { ShieldCheck } from "lucide-react";
import "../styles/secureNote.css";

export default function SecureNote({
  text = "Secure encrypted connection",
  className = "",
}) {
  return (
    <div className={`secure-note ${className}`}>
      <ShieldCheck size={16} />
      <span>{text}</span>
    </div>
  );
}
