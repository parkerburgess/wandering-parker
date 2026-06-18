import LoginForm from './LoginForm'

export default function LoginPage() {
  const authServiceUrl = process.env.AUTH_SERVICE_URL ?? 'not set'

  return <LoginForm authServiceUrl={authServiceUrl} />
}
