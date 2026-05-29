"use client";

import { useState, useTransition } from "react";

import { signIn } from "next-auth/react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  borderRadius: "0.9rem",
  padding: "0.95rem 1rem",
  backgroundColor: "rgba(248, 250, 252, 0.92)",
  color: "#0f172a",
  outline: "none",
};

type LoginFormState = {
  error: string | null;
};

export function LoginForm() {
  const [state, setState] = useState<LoginFormState>({ error: null });
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "").trim();

        startTransition(async () => {
          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl: "/",
          });

          if (!result || result.error) {
            setState({ error: "Invalid credentials." });
            return;
          }

          window.location.href = result.url ?? "/";
        });
      }}
      style={{
        display: "grid",
        gap: "1rem",
      }}
    >
      <label style={{ display: "grid", gap: "0.45rem" }}>
        <span style={{ fontSize: "0.92rem", fontWeight: 600 }}>Email</span>
        <input
          autoComplete="email"
          name="email"
          placeholder="user@novelist.local"
          required
          style={inputStyle}
          type="email"
        />
      </label>

      <label style={{ display: "grid", gap: "0.45rem" }}>
        <span style={{ fontSize: "0.92rem", fontWeight: 600 }}>Password</span>
        <input
          autoComplete="current-password"
          name="password"
          placeholder="Password"
          required
          style={inputStyle}
          type="password"
        />
      </label>

      {state.error ? (
        <p
          role="alert"
          style={{
            margin: 0,
            color: "#b91c1c",
            fontSize: "0.92rem",
          }}
        >
          {state.error}
        </p>
      ) : null}

      <button
        disabled={isPending}
        style={{
          border: 0,
          borderRadius: "999px",
          padding: "0.95rem 1.15rem",
          background:
            "linear-gradient(135deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 0.92) 100%)",
          color: "#f8fafc",
          fontSize: "0.98rem",
          fontWeight: 700,
          cursor: isPending ? "progress" : "pointer",
        }}
        type="submit"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
