/**
 * Utility functions for sanitizing Quill editor content
 */

/**
 * Sanitizes Quill editor content by replacing non-breaking spaces (&nbsp;) with regular spaces
 * and performing other necessary cleanups
 *
 * @param htmlContent The HTML content from the Quill editor
 * @returns Sanitized content
 */
export function sanitizeQuillContent(
  htmlContent: string | null | undefined,
): string {
  if (!htmlContent) return ''

  // Replace &nbsp; with regular spaces
  let sanitized = htmlContent.replace(/&nbsp;/g, ' ')

  // Remove excessive line breaks (more than 2 consecutive)
  sanitized = sanitized.replace(/(\r\n|\n|\r){3,}/g, '\n\n')

  // Remove trailing/leading whitespace
  sanitized = sanitized.trim()

  return sanitized
}
