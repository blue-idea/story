import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ req, token }) => {
      if (
        process.env.NODE_ENV === "development" &&
        req.nextUrl.pathname.startsWith("/qa/")
      ) {
        return true;
      }

      return Boolean(token);
    },
  },
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"],
};
