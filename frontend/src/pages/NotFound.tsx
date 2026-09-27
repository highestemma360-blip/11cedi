import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <main className="not-found" role="status">
      <img src="/cedi-mark.svg" alt="CEDIGAIN" width={56} height={56}  />
      <span>404</span>
      <h1>Page not found</h1>
      <p>The page you requested does not exist or is no longer available.</p>
      <Link className="btn primary" to="/dashboard">Return to overview</Link>
    </main>
  )
}
