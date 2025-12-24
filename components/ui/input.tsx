import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-11 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
