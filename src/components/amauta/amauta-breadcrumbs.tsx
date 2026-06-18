import { cn } from "@/lib/utils"
import { Breadcrumbs } from "@/components/ui/breadcrumb"

interface AmautaBreadcrumbsProps {
  className?: string
}

function AmautaBreadcrumbs({ className }: AmautaBreadcrumbsProps) {
  return (
    <div className={cn("mb-4", className)}>
      <Breadcrumbs />
    </div>
  )
}

export { AmautaBreadcrumbs }
export type { AmautaBreadcrumbsProps }
