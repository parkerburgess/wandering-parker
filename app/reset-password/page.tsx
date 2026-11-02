import ResetPasswordForm from './ResetPasswordForm'

interface Props {
  searchParams: Promise<{ token?: string; error?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, error } = await searchParams
  return <ResetPasswordForm token={token} linkError={error} />
}
