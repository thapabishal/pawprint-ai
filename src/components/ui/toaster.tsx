import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        let Icon = Info
        let iconColor = 'text-blue-500'
        let borderColor = 'border-l-blue-500'

        if (variant === 'destructive') {
          Icon = XCircle
          iconColor = 'text-red-500'
          borderColor = 'border-l-red-500'
        } else if (title?.toLowerCase().includes('success')) {
          Icon = CheckCircle2
          iconColor = 'text-green-500'
          borderColor = 'border-l-green-500'
        } else if (title?.toLowerCase().includes('warning') || title?.toLowerCase().includes('offline')) {
          Icon = AlertTriangle
          iconColor = 'text-amber-500'
          borderColor = 'border-l-amber-500'
        }

        return (
          <Toast key={id} variant={variant} className={borderColor} {...props}>
            <div className="flex gap-3">
              <Icon className={iconColor} size={20} />
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
