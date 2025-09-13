"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Building2, Plus, Search, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SedeForm } from "@/components/admin/SedeForm"
import { SedesList } from "@/components/admin/SedesList"

interface Sede {
  id: number
  nombre: string
  ciudad: string
  direccion?: string
  estado: "activa" | "inactiva"
  fecha_creacion: string
}

export default function SedesPage() {
  const [loading, setLoading] = useState(true)
  const [sedes, setSedes] = useState<Sede[]>([])
  const [filteredSedes, setFilteredSedes] = useState<Sede[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingSede, setEditingSede] = useState<Sede | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("internal_token")
    if (!token) {
      router.push("/internal")
      return
    }

    verifyAdminToken()
    loadSedes()
  }, [router])

  useEffect(() => {
    // Filtrar sedes por término de búsqueda
    const filtered = sedes.filter(
      (sede) =>
        sede.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sede.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sede.direccion?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredSedes(filtered)
  }, [sedes, searchTerm])

  const verifyAdminToken = async () => {
    try {
      const token = localStorage.getItem("internal_token")
      const response = await fetch("/api/internal/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (!response.ok || data.tipo !== "admin") {
        localStorage.removeItem("internal_token")
        router.push("/internal")
      }
    } catch (error) {
      localStorage.removeItem("internal_token")
      router.push("/internal")
    }
  }

  const loadSedes = async () => {
    try {
      const token = localStorage.getItem("internal_token")
      const response = await fetch("/api/internal/admin/sedes", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setSedes(data.sedes)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "No se pudieron cargar las sedes",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión al cargar sedes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSede = () => {
    setEditingSede(null)
    setShowForm(true)
  }

  const handleEditSede = (sede: Sede) => {
    setEditingSede(sede)
    setShowForm(true)
  }

  const handleDeleteSede = async (sede: Sede) => {
    if (!confirm(`¿Estás seguro de desactivar la sede "${sede.nombre}"?`)) {
      return
    }

    setActionLoading(true)
    try {
      const token = localStorage.getItem("internal_token")
      const response = await fetch(`/api/internal/admin/sedes/${sede.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Sede desactivada",
          description: data.mensaje,
        })
        await loadSedes()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "No se pudo desactivar la sede",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión al desactivar sede",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleExportSede = async (sede: Sede) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem("internal_token")
      const response = await fetch(`/api/internal/admin/sedes/export?sede_id=${sede.id}&type=csv&limit=10000`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `clientes_${sede.nombre.replace(/[^a-zA-Z0-9]/g, "_")}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast({
          title: "Exportación exitosa",
          description: `Clientes de ${sede.nombre} exportados correctamente`,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "No se pudo exportar los clientes",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión al exportar clientes",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingSede(null)
    loadSedes()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-lg">Cargando sedes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            Gestión de Sedes
          </h1>
          <p className="text-gray-600 mt-1">Administra las sedes de Papayoo</p>
        </div>
        <Button onClick={handleCreateSede} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Sede
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sedes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sedes.length}</div>
            <p className="text-xs text-muted-foreground">Sedes registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sedes Activas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{sedes.filter((s) => s.estado === "activa").length}</div>
            <p className="text-xs text-muted-foreground">En operación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sedes Inactivas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{sedes.filter((s) => s.estado === "inactiva").length}</div>
            <p className="text-xs text-muted-foreground">Desactivadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Sedes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, ciudad o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sedes List */}
      <SedesList
        sedes={filteredSedes}
        onEdit={handleEditSede}
        onDelete={handleDeleteSede}
        onExport={handleExportSede}
        loading={actionLoading}
      />

      {/* Form Modal */}
      {showForm && (
        <SedeForm
          sede={editingSede}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false)
            setEditingSede(null)
          }}
        />
      )}
    </div>
  )
}
