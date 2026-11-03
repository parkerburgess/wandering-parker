import GuestAccessCard from './GuestAccessCard'
import SignInCard from './SignInCard'

interface Props {
  returnUrl?: string
  verified?: boolean
}

export default function LoginForm({ returnUrl, verified }: Props) {
  // #region Tailwind utility consts
  const pageCls = 'grid justify-items-center pt-12 pb-16'
  const stackCls = 'w-full max-w-sm grid gap-8'
  // #endregion

  return (
    <div className={pageCls}>
      <div className={stackCls}>
        <GuestAccessCard />
        <SignInCard returnUrl={returnUrl} verified={verified} />
      </div>
    </div>
  )
}
