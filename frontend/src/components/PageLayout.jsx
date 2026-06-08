export default function PageLayout({ children, navbar, className = '' }) {
  return (
    <div className={`page-wrap min-h-screen flex flex-col ${className}`}>
      {navbar}
      <div className="page-center flex-1 w-full">
        {children}
      </div>
    </div>
  )
}
