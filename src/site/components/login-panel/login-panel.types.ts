import type { RefObject } from 'react'
import type { LoginBridge } from '@/site/components/login-expanding/expanding-login.types'

export interface AccessFormProps {
  bridge: LoginBridge
  emailRef: RefObject<HTMLInputElement | null>
}

export interface LoginCardProps {
  bridge: LoginBridge
}
