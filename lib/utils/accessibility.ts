/**
 * Accessibility utilities
 * Provides helper functions for ARIA labels and keyboard navigation
 */

/**
 * Generate ARIA label for navigation items
 */
export function getNavAriaLabel(label: string, isActive?: boolean): string {
  return isActive ? `${label}, current page` : label
}

/**
 * Generate ARIA label for buttons with icons
 */
export function getButtonAriaLabel(
  label: string,
  icon?: string
): string {
  return icon ? `${label}, ${icon} icon` : label
}

/**
 * Generate ARIA label for form inputs
 */
export function getInputAriaLabel(
  label: string,
  required?: boolean,
  error?: string
): string {
  let ariaLabel = label
  if (required) {
    ariaLabel += ", required"
  }
  if (error) {
    ariaLabel += `, ${error}`
  }
  return ariaLabel
}

/**
 * Generate ARIA described by for form inputs with help text
 */
export function getInputAriaDescribedBy(
  id: string,
  helpTextId?: string,
  errorId?: string
): string | undefined {
  const ids = [helpTextId, errorId].filter(Boolean)
  return ids.length > 0 ? ids.join(" ") : undefined
}

/**
 * Keyboard navigation helpers
 */
export const KEYBOARD_KEYS = {
  ENTER: "Enter",
  ESCAPE: "Escape",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  TAB: "Tab",
  SPACE: " ",
  HOME: "Home",
  END: "End",
} as const

/**
 * Check if key is a navigation key
 */
export function isNavigationKey(key: string): boolean {
  return [
    KEYBOARD_KEYS.ARROW_UP,
    KEYBOARD_KEYS.ARROW_DOWN,
    KEYBOARD_KEYS.ARROW_LEFT,
    KEYBOARD_KEYS.ARROW_RIGHT,
    KEYBOARD_KEYS.HOME,
    KEYBOARD_KEYS.END,
  ].includes(key as any)
}

/**
 * Check if key is an activation key
 */
export function isActivationKey(key: string): boolean {
  return [KEYBOARD_KEYS.ENTER, KEYBOARD_KEYS.SPACE].includes(key as any)
}

/**
 * Focus management helpers
 */
export function focusElement(element: HTMLElement | null): void {
  if (element) {
    element.focus()
  }
}

export function focusFirstElement(container: HTMLElement | null): void {
  if (!container) return
  
  const firstFocusable = container.querySelector<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  focusElement(firstFocusable)
}

export function focusLastElement(container: HTMLElement | null): void {
  if (!container) return
  
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const lastElement = focusableElements[focusableElements.length - 1]
  focusElement(lastElement)
}

/**
 * Trap focus within a container (for modals, dialogs)
 */
export function trapFocus(
  container: HTMLElement,
  event: KeyboardEvent
): void {
  if (event.key !== KEYBOARD_KEYS.TAB) return

  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  if (focusableElements.length === 0) return

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
  } else {
    if (document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

