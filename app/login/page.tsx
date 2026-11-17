import { getSafeReturnUrl } from '@/lib/returnUrl'
import LoginForm from './LoginForm'

interface Props {
  searchParams: Promise<{
    return_url?: string | string[]
    verified?: string | string[]
  }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { return_url, verified } = await searchParams

  // Checked here on the server so an unsafe value never reaches the client.
  const returnUrl = getSafeReturnUrl(return_url)

  return <LoginForm returnUrl={returnUrl} verified={verified === '1'} />
}
