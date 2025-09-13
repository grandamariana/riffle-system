"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Sede {
  id: number
  nombre: string
  ciudad: string
  direccion?: string
  estado: "activa" | "inactiva"
  fecha_creacion: string
}

interface SedeFormProps {
  sede?: Sede | null
  onSuccess: () => void
  onCancel: () => void
}

export function SedeForm({ sede, onSuccess, onCancel }: SedeFormProps) {
  const [formData, setFormData] = useState({
    nombre: sede?.nombre || "",
    ciudad: sede?.ciudad || "",
    direccion: sede?.direccion || "",
    estado: sede?.estado || "activa",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("internal_token")
      const url = sede ? `/api/internal/admin/sedes/${sede.id}` : "/api/internal/admin/sedes"
      const method = sede ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: sede ? "Sede actualizada" : "Sede creada",
          description: `La sede "${formData.nombre}" ha sido ${sede ? "actualizada" : "creada"} exitosamente`,
        })
        onSuccess()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Error al procesar la solicitud",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{sede ? "Editar Sede" : "Nueva Sede"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                placeholder="Nombre de la sede"
                maxLength={100}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad *</Label>
              <Input
                id="ciudad"
                value={formData.ciudad}
                onChange={(e) => handleInputChange("ciudad", e.target.value)}
                placeholder="Ciudad"
                maxLength={100}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleInputChange("direccion", e.target.value)}
                placeholder="Dirección (opcional)"
                maxLength={150}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => handleInputChange("estado", value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="inactiva">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {sede ? "Actualizando..." : "Creando..."}
                  </>
                ) : sede ? (
                  "Actualizar"
                ) : (
                  "Crear"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
