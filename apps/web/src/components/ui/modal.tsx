'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  showClose?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  showClose = true,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div
        className={cn(
          'relative w-full max-w-lg bg-card border shadow-soft-xl animate-slide-up sm:rounded-2xl flex flex-col max-h-[90vh]',
          'rounded-t-3xl sm:rounded-2xl',
          className
        )}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg font-bold leading-none tracking-tight">
            {title}
          </h2>
          {showClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
        
        {footer && (
          <div className="p-4 sm:p-6 border-t flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
