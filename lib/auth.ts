import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const validUsername = credentials.username === 'Aramco'
        if (!validUsername) return null

        const passwordHash = '$2a$10$CoW.wEPpjbFoZY1/tRIhk.H8HzFhvgOwkE0NKqyPCJlvN3gNEyDey'
        if (!passwordHash) return null

        const validPassword = await bcrypt.compare(credentials.password, passwordHash)
        if (!validPassword) return null

        return {
          id: '1',
          name: 'Hamza',
          email: 'hamza@aramcoproperties.com',
          image: null,
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.user = user
      return token
    },
    async session({ session, token }) {
      session.user = token.user as typeof session.user
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
