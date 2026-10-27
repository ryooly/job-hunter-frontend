import { useEffect, useRef, useState } from "react";

interface LoginModalProps {
  open: boolean;
  /** "register" adds a name field and switches the copy; defaults to login. */
  mode?: "login" | "register";
  onClose: () => void;
  /** Called with the entered credentials when the form is submitted. */
  onSubmit?: (email: string, name: string) => void;
}

/**
 * Direct-action account dialog opened by the header, the bottom bar and the
 * menu. Authentication is not wired to the backend yet — the form validates
 * locally and hands the details to onSubmit, which records a demo account.
 */
export function LoginModal({
  open,
  mode = "login",
  onClose,
  onSubmit,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  const isRegister = mode === "register";

  // Reset the fields and focus the first one each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setEmail("");
    setName("");
    setPassword("");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    emailRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mode, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={isRegister ? "Formulir daftar" : "Formulir masuk"}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          aria-label="Tutup"
          onClick={onClose}
        >
          ×
        </button>

        <h2>{isRegister ? "Buat akun Job Hunter" : "Masuk ke Job Hunter"}</h2>
        <p className="modal-sub">
          Kelola lamaran dan daftar lowongan tersimpan Anda.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.(email.trim(), name.trim());
            onClose();
          }}
        >
          {isRegister && (
            <label className="modal-field">
              Nama
              <input
                type="text"
                placeholder="Nama lengkap"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          <label className="modal-field">
            Email
            <input
              ref={emailRef}
              type="email"
              placeholder="nama@email.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="modal-field">
            Kata sandi
            <input
              type="password"
              placeholder="••••••••"
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button type="submit" className="btn-solid modal-submit">
            {isRegister ? "Daftar" : "Masuk"}
          </button>

          <p className="modal-note" role="status">
            Autentikasi belum terhubung ke server — ini tampilan demo.
          </p>
        </form>
      </div>
    </div>
  );
}
