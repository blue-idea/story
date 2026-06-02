import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.1fr) minmax(20rem, 28rem)",
        background:
          "linear-gradient(145deg, #f7fafc 0%, #dbe7f3 42%, #eef4fb 100%)",
      }}
    >
      <section
        style={{
          display: "grid",
          alignContent: "center",
          padding: "clamp(2rem, 5vw, 4rem)",
          gap: "1.25rem",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.84rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#334155",
          }}
        >
          墨语AI小说系统认证
        </p>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(2.3rem, 6vw, 4.6rem)",
            lineHeight: 1.02,
            color: "#0f172a",
          }}
        >
          登录以继续创作
        </h1>
        <p
          style={{
            maxWidth: "40rem",
            margin: 0,
            fontSize: "1rem",
            lineHeight: 1.8,
            color: "#334155",
          }}
        >
          在开发过程中，使用任何有效的邮箱和非空密码即可登录。首次登录将自动创建账号。
        </p>
      </section>

      <section
        style={{
          display: "grid",
          alignContent: "center",
          padding: "clamp(1.25rem, 4vw, 2.5rem)",
        }}
      >
        <div
          style={{
            borderRadius: "1.5rem",
            backgroundColor: "rgba(255, 255, 255, 0.88)",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.16)",
            padding: "1.6rem",
            backdropFilter: "blur(18px)",
          }}
        >
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
