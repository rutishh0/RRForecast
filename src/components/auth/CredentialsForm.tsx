// V5/src/components/auth/CredentialsForm.tsx
import { useState, type FormEvent } from "react";
import { Loader2, LogIn } from "lucide-react";

interface Props {
  visible: boolean;
  onSubmit: (username: string, password: string) => void;
  error: string | null;
  loading: boolean;
}

export default function CredentialsForm({ visible, onSubmit, error, loading }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || loading) return;
    onSubmit(username.trim(), password);
  };

  return (
    <div
      className={`absolute inset-0 transition-all duration-300 ease-out
        ${visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"}`}
      aria-hidden={!visible}
    >
      <p className="text-sm text-rr-text-dim mb-6">Welcome — please sign in</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-xs uppercase tracking-wider font-semibold text-rr-text-dim mb-2">
            Username
          </label>
          <input
            id="username"
            type="text"
            autoFocus={visible}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 rounded-md bg-rr-navy-50 border border-rr-border
              text-rr-text placeholder:text-rr-text-muted focus:outline-none focus:border-rr-gold/50
              text-sm"
            autoComplete="username"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs uppercase tracking-wider font-semibold text-rr-text-dim mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 rounded-md bg-rr-navy-50 border border-rr-border
              text-rr-text placeholder:text-rr-text-muted focus:outline-none focus:border-rr-gold/50
              text-sm"
            autoComplete="current-password"
          />
          {error && <p className="text-rr-danger text-xs mt-2">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={!username.trim() || !password || loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md
            bg-rr-gold text-rr-bg-secondary font-semibold text-sm
            hover:bg-rr-gold-bright disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
        >
          {loading ? (
            <><Loader2 size={14} className="animate-spin" /> Signing in…</>
          ) : (
            <><LogIn size={14} /> Sign In</>
          )}
        </button>
      </form>
    </div>
  );
}
