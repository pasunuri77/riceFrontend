export default function TableShell({ minWidth, maxHeight = '65vh', children }) {
  return (
    <div className="card overflow-auto" style={{ maxHeight }}>
      <table className="w-full text-sm [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-white" style={minWidth ? { minWidth } : undefined}>
        {children}
      </table>
    </div>
  )
}
