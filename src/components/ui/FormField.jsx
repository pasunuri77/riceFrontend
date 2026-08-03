import { Children, cloneElement, isValidElement, useId } from 'react'

const FIELD_TAGS = ['input', 'select', 'textarea']

// Walks into wrapper elements (e.g. an icon + input `<div>`) to find the actual
// form control so id/aria-describedby/aria-invalid can be wired up without every
// call site having to pass them through manually.
function injectFieldProps(node, extra) {
  if (!isValidElement(node)) return node

  if (typeof node.type === 'string' && FIELD_TAGS.includes(node.type)) {
    return cloneElement(node, {
      id: extra.id,
      'aria-describedby': [node.props['aria-describedby'], extra.describedBy].filter(Boolean).join(' ') || undefined,
      'aria-invalid': node.props['aria-invalid'] ?? extra.invalid,
    })
  }

  if (node.props?.children) {
    return cloneElement(node, {
      children: Children.map(node.props.children, (child) => injectFieldProps(child, extra)),
    })
  }

  return node
}

export default function FormField({ label, error, hint, maxLength, currentLength, children }) {
  const autoId = useId()
  const describedBy = error || hint ? `${autoId}-desc` : undefined
  const content = Children.map(children, (child) => injectFieldProps(child, { id: autoId, describedBy, invalid: !!error }))

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={autoId} className="label-field !mb-0">{label}</label>
        {typeof maxLength === 'number' && (
          <span className={`text-[11px] font-medium ${currentLength > maxLength ? 'text-red-500' : 'text-ink/60'}`}>
            {currentLength ?? 0}/{maxLength}
          </span>
        )}
      </div>
      {content}
      {error ? (
        <p id={describedBy} role="alert" className="text-xs text-red-500 mt-1 font-medium">{error}</p>
      ) : hint ? (
        <p id={describedBy} className="text-xs text-ink/60 mt-1">{hint}</p>
      ) : null}
    </div>
  )
}
