import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "md", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      default: "bg-gray-900 text-white hover:bg-gray-800 focus-visible:ring-gray-900",
      primary: "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-600",
      secondary: "bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-secondary-600",
      outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus-visible:ring-primary-600",
      ghost: "hover:bg-gray-100 text-gray-700 focus-visible:ring-gray-400"
    }
    
    const sizes = {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-13 px-8 text-lg"
    }
    
    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }
