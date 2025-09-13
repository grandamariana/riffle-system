"use client"

import { CardDescription } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  LogOut,
  Users,
  Download,
  Trophy,
  Settings,
  Search,
  AlertTriangle,
  FileText,
  BarChart3,
  Building2,
} from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"

interface Cliente {
  id: number
  nombre: string
  apellidos: string
  documento: string
  correo: string
  fecha_registro: string
  participaciones: Array<{
    numero_rifa: string
    fecha_asignacion: string
  }>
}

interface AdminStats {
  total_clientes: number
  total_participaciones: number
  total_codigos: number
  codigos_activos: number
  codigos_usados: number
  total_sedes: number
  sedes_activas: number
}

type ActiveSection = "dashboard" | "clients" | "winner" | "settings" | "exports" | "sedes"

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("internal_token")
    if (!token) {
      router.push("/internal")
      return
    }

    verifyAdminToken()
    loadData()
  }, [router])

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
      } else {
        setUserInfo(data)
      }
    } catch (error) {
      localStorage.removeItem("internal_token")
      router.push("/internal")
    }
  }

  const loadData = async () => {
    try {
      const token = localStorage.getItem("internal_token")

      // Cargar estadísticas
      const statsResponse = await fetch("/api/internal/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Cargar clientes
      const clientsResponse = await fetch("/api/internal/admin/clients", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        setClientes(clientsData)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleRaffleStatus = async () => {
    if (!stats) return

    // Placeholder for toggleRaffleStatus logic
  }

  const setWinner = async () => {
    // Placeholder for setWinner logic
  }

  const resetRaffle = async () => {
    // Placeholder for resetRaffle logic
  }

  const exportEmails = () => {
    const emails = clientes.map((cliente) => cliente.correo).join("\n")
    const blob = new Blob([emails], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "emails_participantes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportClients = () => {
    const csvContent = [
      "Nombre,Apellidos,Documento,Correo,Fecha Registro,Números de Rifa",
      ...clientes.map(
        (cliente) =>
          `"${cliente.nombre}","${cliente.apellidos}","${cliente.documento}","${cliente.correo}","${formatDate(cliente.fecha_registro)}","${cliente.participaciones.map((p) => p.numero_rifa).join(", ")}"`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "clientes_participantes.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportWinner = () => {
    // Placeholder for exportWinner logic
  }

  const filteredClients = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes("") ||
      cliente.apellidos.toLowerCase().includes("") ||
      cliente.documento.includes("") ||
      cliente.participaciones.some((p) => p.numero_rifa.includes("")),
  )

  const handleLogout = () => {
    localStorage.removeItem("internal_token")
    router.push("/internal")
  }

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "clients", label: "Clientes", icon: Users },
    { id: "winner", label: "Ganador", icon: Trophy },
    { id: "settings", label: "Configuración", icon: Settings },
    { id: "exports", label: "Exportar", icon: Download },
    { id: "sedes", label: "Sedes", icon: Building2 }, // AÑADIR ESTA LÍNEA
  ]

  if (loading) {
    return (
      <div className="min-h-screen papayoo-gradient flex items-center justify-center">
        <Card className="papayoo-card p-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <p className="text-gray-600">Cargando panel de administración...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Image src="/images/papayoo-logo.png" alt="Papayoo Logo" width={40} height={40} className="rounded-full" />
            <div>
              <h1 className="font-montserrat font-bold text-lg text-gray-800">Papayoo</h1>
              <p className="text-sm text-gray-600">Panel Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as ActiveSection)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? "bg-orange-100 text-orange-700 border border-orange-200"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button onClick={handleLogout} variant="outline" className="w-full bg-transparent">
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <p className="text-gray-600 mt-1">Bienvenido, {userInfo?.usuario}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Cerrar Sesión
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="papayoo-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_clientes}</div>
                <p className="text-xs text-muted-foreground">Clientes registrados</p>
              </CardContent>
            </Card>

            <Card className="papayoo-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Participaciones</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_participaciones}</div>
                <p className="text-xs text-muted-foreground">Números asignados</p>
              </CardContent>
            </Card>

            <Card className="papayoo-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Códigos Activos</CardTitle>
                <FileText className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.codigos_activos}</div>
                <p className="text-xs text-muted-foreground">De {stats.total_codigos} totales</p>
              </CardContent>
            </Card>

            <Card className="papayoo-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sedes Activas</CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.sedes_activas}</div>
                <p className="text-xs text-muted-foreground">De {stats.total_sedes} totales</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dashboard */}
        {activeSection === "dashboard" && (
          <Card className="papayoo-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                <span>Dashboard Principal</span>
              </CardTitle>
              <CardDescription>Resumen general del sistema de rifa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">Actividad Reciente</h3>
                  <p className="text-sm text-blue-700">
                    {stats?.total_participaciones || 0} participaciones registradas
                  </p>
                  <p className="text-sm text-blue-700">{stats?.codigos_usados || 0} códigos utilizados</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">Estado del Sistema</h3>
                  <p className="text-sm text-green-700">Rifa: {stats?.estado_rifa || "Desconocido"}</p>
                  <p className="text-sm text-green-700">
                    {stats?.numero_ganador ? `Ganador: ${stats.numero_ganador}` : "Sin ganador"}
                  </p>
                </div>
              </div>

              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">¡Bienvenido al Panel de Administración!</h3>
                <p className="text-gray-600">
                  Usa el menú lateral para navegar entre las diferentes secciones del sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clientes */}
        {activeSection === "clients" && (
          <Card className="papayoo-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-orange-600" />
                <span>Clientes Registrados</span>
              </CardTitle>
              <CardDescription>Lista completa de participantes en la rifa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, documento o número de rifa..."
                  value=""
                  onChange={(e) => {}}
                  className="flex-1"
                />
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredClients.map((cliente) => (
                  <div key={cliente.id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-medium">
                          {cliente.nombre} {cliente.apellidos}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Doc: {cliente.documento} | Email: {cliente.correo}
                        </p>
                        <p className="text-xs text-gray-500">Registrado: {formatDate(cliente.fecha_registro)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium mb-1">Números de Rifa:</p>
                        <div className="flex flex-wrap gap-1">
                          {cliente.participaciones.map((participacion, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {participacion.numero_rifa}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ganador */}
        {activeSection === "winner" && (
          <Card className="papayoo-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-orange-600" />
                <span>Establecer Ganador</span>
              </CardTitle>
              <CardDescription>Ingresa el número ganador del sorteo externo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Ej: 12345"
                  value=""
                  onChange={(e) => {}}
                  maxLength={5}
                  className="font-mono text-center"
                />
                <Button onClick={() => {}} className="papayoo-button">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              </div>

              {/* Placeholder for ganador display */}
            </CardContent>
          </Card>
        )}

        {/* Configuración */}
        {activeSection === "settings" && (
          <Card className="papayoo-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-orange-600" />
                <span>Control de la Rifa</span>
              </CardTitle>
              <CardDescription>Administra el estado y configuración de la rifa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Estado de la Rifa</h4>
                  <p className="text-sm text-gray-600">La rifa está actualmente {stats?.estado_rifa}</p>
                </div>
                <Button onClick={() => {}} disabled={false} variant="destructive">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Pausar
                </Button>
              </div>

              <div className="border-t pt-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800 mb-2">Reiniciar Rifa (Zona Peligrosa)</h4>
                      <p className="text-sm text-red-700 mb-3">
                        Esta acción eliminará todas las participaciones y marcará todos los códigos como no usados. Los
                        clientes registrados se mantendrán. Esta acción no se puede deshacer.
                      </p>

                      {/* Placeholder for reset confirmation alerts */}
                      <div className="flex space-x-2">
                        <Button onClick={() => {}} disabled={false} variant="destructive" size="sm">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Reiniciar Rifa
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exportar */}
        {activeSection === "exports" && (
          <Card className="papayoo-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5 text-orange-600" />
                <span>Exportar Datos</span>
              </CardTitle>
              <CardDescription>Descarga información de participantes y ganadores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={exportEmails} className="papayoo-button h-20 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  <span>Exportar Correos</span>
                  <span className="text-xs opacity-80">Lista de emails</span>
                </Button>

                <Button onClick={exportClients} className="papayoo-button h-20 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  <span>Exportar Clientes</span>
                  <span className="text-xs opacity-80">Datos completos CSV</span>
                </Button>

                <Button onClick={() => {}} disabled={false} className="papayoo-button h-20 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  <span>Exportar Ganador</span>
                  <span className="text-xs opacity-80">Datos del ganador</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sedes */}
        {activeSection === "sedes" && (
          <Card className="papayoo-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-orange-600" />
                <span>Sedes</span>
              </CardTitle>
              <CardDescription>Administra las sedes del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Administrar Sedes</h3>
                <p className="text-gray-600">Usa esta sección para gestionar las sedes del sistema.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
