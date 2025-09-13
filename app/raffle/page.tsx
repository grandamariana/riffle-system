"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, Camera, LogOut, Gift, Calendar } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"

interface ParticipacionData {
  cliente: {
    nombre: string
    apellidos: string
    documento: string
  }
  participaciones: Array<{
    numero_rifa: string
    fecha_asignacion: string
  }>
  nuevo_numero?: string
}

export default function RafflePage() {
  const [data, setData] = useState<ParticipacionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("papayoo_token")
    if (!token) {
      router.push("/")
      return
    }

    fetchParticipationData()

    // Auto-logout después de 15 minutos
    const timeout = setTimeout(
      () => {
        handleLogout()
      },
      15 * 60 * 1000,
    )

    // Prevenir navegación hacia atrás
    const handlePopState = () => {
      setShowLogoutConfirm(true)
    }

    window.addEventListener("popstate", handlePopState)
    window.history.pushState(null, "", window.location.href)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [router])

  const fetchParticipationData = async () => {
    try {
      const token = localStorage.getItem("papayoo_token")
      const response = await fetch("/api/raffle/participate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (response.ok) {
        setData(result)
        if (result.nuevo_numero) {
          toast({
            title: "¡Felicidades!",
            description: `Tu nuevo número de rifa es: ${result.nuevo_numero}`,
            duration: 5000,
          })
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al obtener datos",
          variant: "destructive",
        })
        if (response.status === 401) {
          handleLogout()
        }
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("papayoo_token")
    router.push("/")
  }

  const confirmLogout = () => {
    setShowLogoutConfirm(false)
    handleLogout()
  }

  if (loading) {
    return (
      <div className="min-h-screen papayoo-gradient flex items-center justify-center">
        <Card className="papayoo-card p-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <p className="text-gray-600">Cargando tu participación...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen papayoo-gradient flex items-center justify-center p-4">
        <Card className="papayoo-card">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Error al cargar los datos</p>
            <Button onClick={() => router.push("/")} className="mt-4">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen papayoo-gradient p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card className="papayoo-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/images/papayoo-logo.png"
                alt="Papayoo Logo"
                width={80}
                height={80}
                className="rounded-full"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">¡Felicidades, {data.cliente.nombre}!</CardTitle>
            <CardDescription className="text-gray-600">Ya estás participando en la rifa de Papayoo</CardDescription>
          </CardHeader>
        </Card>

        {/* Nuevo número (si existe) */}
        {data.nuevo_numero && (
          <Card className="papayoo-card border-2 border-orange-400">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <Trophy className="h-16 w-16 text-orange-600 mx-auto" />
                <h2 className="text-2xl font-bold text-gray-800">¡Tu nuevo número de rifa!</h2>
                <div className="bg-gradient-to-r from-orange-400 to-yellow-400 text-white p-6 rounded-lg">
                  <p className="text-sm font-medium mb-2">NÚMERO DE PARTICIPACIÓN</p>
                  <p className="text-4xl font-bold font-mono tracking-wider">{data.nuevo_numero}</p>
                </div>
                <Alert>
                  <Camera className="h-4 w-4" />
                  <AlertDescription>
                    <strong>¡Importante!</strong> Toma una captura de pantalla de este número. Solo podrás volver a
                    ingresar si realizas una nueva compra.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial de participaciones */}
        <Card className="papayoo-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-orange-600" />
              <span>Tus Números de Rifa</span>
            </CardTitle>
            <CardDescription>Historial completo de tus participaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.participaciones.map((participacion, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="text-lg font-mono px-3 py-1">
                    {participacion.numero_rifa}
                  </Badge>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(participacion.fecha_asignacion)}</span>
                    </div>
                  </div>
                </div>
                {participacion.numero_rifa === data.nuevo_numero && (
                  <Badge className="bg-green-100 text-green-800">¡Nuevo!</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Información del cliente */}
        <Card className="papayoo-card">
          <CardHeader>
            <CardTitle>Información de Participante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Nombre:</span>
                <p className="text-gray-800">
                  {data.cliente.nombre} {data.cliente.apellidos}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Documento:</span>
                <p className="text-gray-800">{data.cliente.documento}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón de cerrar sesión */}
        <Card className="papayoo-card">
          <CardContent className="p-6">
            <Button onClick={() => setShowLogoutConfirm(true)} variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">La sesión se cerrará automáticamente en 15 minutos</p>
          </CardContent>
        </Card>

        {/* Modal de confirmación de logout */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="papayoo-card max-w-md w-full">
              <CardHeader>
                <CardTitle>¿Cerrar sesión?</CardTitle>
                <CardDescription>Solo podrás volver a ingresar con un nuevo código de compra.</CardDescription>
              </CardHeader>
              <CardContent className="flex space-x-4">
                <Button onClick={() => setShowLogoutConfirm(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={confirmLogout} className="flex-1 papayoo-button">
                  Confirmar
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
