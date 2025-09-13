"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, User, Mail, Lock, CreditCard, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Sede {
  id: number
  nombre: string
  ciudad: string
  estado: string
}

interface RegisterFormProps {
  onSuccess: (token: string, cliente: any) => void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    documento: "",
    correo: "",
    contraseña: "",
    codigo: "",
    sede_id: "",
  })
  const [sedes, setSedes] = useState<Sede[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSedes, setLoadingSedes] = useState(true)
  const [error, setError] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadSedes()
  }, [])

  const loadSedes = async () => {
    try {
      const response = await fetch("/api/internal/admin/sedes?onlyActive=true")

      if (response.ok) {
        const data = await response.json()
        setSedes(data.sedes || [])
      } else {
        console.error("Error loading sedes:", response.status)
        // En caso de error, continuar sin sedes (para compatibilidad)
        setSedes([])
      }
    } catch (error) {
      console.error("Error loading sedes:", error)
      setSedes([])
    } finally {
      setLoadingSedes(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validaciones
    if (!formData.nombre.trim()) {
      setError("El nombre es obligatorio")
      return
    }

    if (!formData.apellidos.trim()) {
      setError("Los apellidos son obligatorios")
      return
    }

    if (!formData.documento.trim()) {
      setError("El documento es obligatorio")
      return
    }

    if (!/^\d{8,12}$/.test(formData.documento)) {
      setError("El documento debe tener entre 8 y 12 dígitos")
      return
    }

    if (!formData.correo.trim()) {
      setError("El correo es obligatorio")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      setError("El correo no es válido")
      return
    }

    if (!formData.contraseña) {
      setError("La contraseña es obligatoria")
      return
    }

    if (formData.contraseña.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (!formData.codigo.trim()) {
      setError("El código es obligatorio")
      return
    }

    if (!formData.sede_id) {
      setError("Selecciona la sede que más frecuentas")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          sede_id: Number.parseInt(formData.sede_id),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "¡Registro exitoso!",
          description: `Bienvenido ${formData.nombre}. Tu número de rifa ha sido asignado.`,
        })
        onSuccess(data.token, data.cliente)
      } else {
        setError(data.error || "Error al registrarse")
      }
    } catch (error) {
      setError("Error de conexión. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
        <CardDescription>Regístrate para participar en la rifa de Papayoo</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  placeholder="Tu nombre"
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input
                id="apellidos"
                value={formData.apellidos}
                onChange={(e) => handleInputChange("apellidos", e.target.value)}
                placeholder="Tus apellidos"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="documento">Documento *</Label>
            <Input
              id="documento"
              value={formData.documento}
              onChange={(e) => handleInputChange("documento", e.target.value.replace(/\D/g, ""))}
              placeholder="Número de documento"
              maxLength={12}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="correo">Correo Electrónico *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="correo"
                type="email"
                value={formData.correo}
                onChange={(e) => handleInputChange("correo", e.target.value)}
                placeholder="tu@email.com"
                className="pl-10"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contraseña">Contraseña *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="contraseña"
                type="password"
                value={formData.contraseña}
                onChange={(e) => handleInputChange("contraseña", e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pl-10"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo">Código de Rifa *</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => handleInputChange("codigo", e.target.value.toUpperCase())}
                placeholder="Código de tu compra"
                className="pl-10 font-mono"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sede_id">Sede Habitual *</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
              <Select
                value={formData.sede_id}
                onValueChange={(value) => handleInputChange("sede_id", value)}
                disabled={loading || loadingSedes}
                required
              >
                <SelectTrigger className="pl-10">
                  <SelectValue
                    placeholder={
                      loadingSedes
                        ? "Cargando sedes..."
                        : sedes.length === 0
                          ? "No hay sedes disponibles"
                          : "Selecciona la sede que más frecuentas"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {sedes.map((sede) => (
                    <SelectItem key={sede.id} value={sede.id.toString()}>
                      {sede.nombre} - {sede.ciudad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!loadingSedes && sedes.length === 0 && (
              <p className="text-sm text-amber-600">No hay sedes disponibles. Contacta al administrador.</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700"
            disabled={loading || loadingSedes || sedes.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              "Crear Cuenta"
            )}
          </Button>

          <div className="text-center">
            <Button type="button" variant="link" onClick={onSwitchToLogin} disabled={loading} className="text-sm">
              ¿Ya tienes cuenta? Inicia sesión
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
