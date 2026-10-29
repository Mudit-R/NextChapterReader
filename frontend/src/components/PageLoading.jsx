export default function PageLoading({ message = 'Opening your next chapter…' }) {
  return (
    <div role="status" aria-live="polite" className="min-h-screen flex items-center justify-center bg-cream dark:bg-dark-gray text-dark-gray dark:text-white px-6">
      <div className="max-w-sm w-full text-center">
        <div aria-hidden="true" className="w-12 h-12 rounded-full border-2 border-current/20 border-t-coral motion-safe:animate-spin mx-auto mb-6" />
        <p className="text-2xl mb-3">{message}</p>
        <p className="opacity-60">Please wait while this page loads.</p>
      </div>
    </div>
  )
}
