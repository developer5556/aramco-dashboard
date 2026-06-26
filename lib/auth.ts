import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            console.log('AUTH: Missing credentials')
            return null
          }
          console.log('AUTH: Checking username:', credentials.username)
          if (credentials.username !== 'Aramco') {
            console.log('AUTH: Username mismatch')
            return null
          }
          console.log('AUTH: Checking password')
          if (credentials.password !== 'Coolpass123') {
            console.log('AUTH: Password mismatch, got:', credentials.password)
            return null
          }
          console.log('AUTH: Success!')
          return { id: '1', name: 'Hamza', email: 'hamza@aramcoproperties.com', image: null }
        } catch (e) {
          console.log('AUTH ERROR:', e)
          return null
        }
      },
    }),
  ],
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) { if (user) token.user = user; return token },
    async session({ session, token }) { session.user = token.user as typeof session.user; return session },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
