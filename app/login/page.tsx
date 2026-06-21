import LoginForm from './LoginForm'

interface Props {
  searchParams: Promise<{ return_url?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const authServiceUrl = process.env.AUTH_SERVICE_URL ?? 'not set'
  const { return_url } = await searchParams

  return <LoginForm authServiceUrl={authServiceUrl} returnUrl={return_url} />
}
