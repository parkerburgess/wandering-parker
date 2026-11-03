import LoginForm from './LoginForm'

interface Props {
  searchParams: Promise<{ return_url?: string; verified?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { return_url, verified } = await searchParams

  return <LoginForm returnUrl={return_url} verified={verified === '1'} />
}
