import LoginForm from './LoginForm'

interface Props {
  searchParams: Promise<{ return_url?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { return_url } = await searchParams

  return <LoginForm returnUrl={return_url} />
}
