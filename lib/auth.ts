import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

const VALID_USERNAME = 'Aramco'
const VALID_PASSWORD_HASH = '$2a$10$/Y77gkQW./Ig41hZjDPfy.VpefvLS7iqKeSl3RPKskbmmelTJZSvy'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const usernameMatch = credentials.username === VALID_USERNAME
        const passwordMatch = await bcrypt.compare(credentials.password, VALID_PASSWORD_HASH)

        if (usernameMatch && passwordMatch) {
          return { id: '1', name: 'Hamza', email: 'hamza@aramcoproperties.com', image: null }
        }

        return null
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
