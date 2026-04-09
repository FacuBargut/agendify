import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      // Auto-create professional on first login
      const existing = await db.professional.findUnique({
        where: { email: user.email },
      });

      if (!existing) {
        const name = user.name || "Profesional";
        let slug = slugify(name);

        // Ensure slug is unique
        const slugExists = await db.professional.findUnique({
          where: { slug },
        });
        if (slugExists) {
          slug = `${slug}-${Date.now().toString(36)}`;
        }

        await db.professional.create({
          data: {
            name,
            email: user.email,
            slug,
            avatarUrl: user.image || null,
          },
        });
      }

      return true;
    },

    async jwt({ token, trigger }) {
      // On sign-in or update, fetch professional data
      if (trigger === "signIn" || trigger === "update" || !token.professionalId) {
        if (token.email) {
          const pro = await db.professional.findUnique({
            where: { email: token.email },
            select: { id: true, slug: true, plan: true, name: true },
          });
          if (pro) {
            token.professionalId = pro.id;
            token.slug = pro.slug;
            token.plan = pro.plan;
            token.name = pro.name;
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.professionalId = token.professionalId as string;
        session.user.slug = token.slug as string;
        session.user.plan = token.plan as string;
        if (token.name) session.user.name = token.name;
      }
      return session;
    },
  },
});
