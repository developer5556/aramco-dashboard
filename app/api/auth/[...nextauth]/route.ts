import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        const validUsername = credentials.username === process.env.DASHBOARD_USERNAME
        if (!validUsername) return null
        const passwordHash = process.env.DASHBOARD_PASSWORD_HASH
        if (!passwordHash) {
          // Fallback for initial setup — Jake must set the env var
          const fallback = credentials.password === 'Coolpass$123'
          if (!fallback) return null
        } else {
          const valid = await bcrypt.compare(credentials.password, passwordHash)
          if (!valid) return null
        }
        return { id: '1', name: 'Hamza', email: 'hamza@aramcoproperties.com' }
      },
    }),
  ],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
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
})

export { handler as GET, handler as POST }
