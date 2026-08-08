import { Link } from "react-router";
import { Button } from "@/components/ui/button";

/**
 * Catch-all 404 page for unmatched routes.
 */
export function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
      <h1 className="font-display text-3xl sm:text-4xl">Page not found</h1>
      <p className="mt-4 text-muted-foreground">
        There is nothing at this address — it may have moved or never existed.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link to="/">Back to Overview</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/learn">Browse Learn</Link>
        </Button>
      </div>
    </div>
  );
}
