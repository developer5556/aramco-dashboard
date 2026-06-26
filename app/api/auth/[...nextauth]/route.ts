import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[auth] authorize called, username:', credentials?.username)
        if (!credentials?.username || !credentials?.password) {
          console.log('[auth] missing credentials')
          return null
        }
        const expectedUser = process.env.DASHBOARD_USERNAME || 'aramcoproperties'
        const validUsername = credentials.username === expectedUser
        if (!validUsername) {
          console.log('[auth] invalid username')
          return null
        }
        const passwordHash = process.env.DASHBOARD_PASSWORD_HASH
        if (!passwordHash) {
          console.log('[auth] no hash set, using fallback')
          const fallback = credentials.password === 'Coolpass$123'
          if (!fallback) return null
        } else {
          const valid = await bcrypt.compare(credentials.password, passwordHash)
          console.log('[auth] bcrypt compare result:', valid)
          if (!valid) return null
        }
        console.log('[auth] login successful')
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
