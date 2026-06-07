import * as React from 'react'
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material'

interface ButtonProps extends MuiButtonProps {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild, ...props }, ref) => {
    const Comp = asChild ? 'span' : MuiButton
    return (
      <Comp
        ref={ref}
        {...props}
        variant={props.variant || 'contained'}
        sx={{
          textTransform: 'none',
          borderRadius: 2,
          ...props.sx,
        }}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps } 