import { Loader2, Building2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Card Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Loading Indicator */}
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-lg text-gray-600">Cargando sedes...</span>
        </div>
      </div>
    </div>
  )
}
