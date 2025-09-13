"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

export default function InternalLoginPage() {
  const [formData, setFormData] = useState({
    usuario: "",
    contraseña: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.usuario || !formData.contraseña) {
      setError("Todos los campos son obligatorios")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/internal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("internal_token", data.token)

        if (data.rol === "admin") {
          router.push("/internal/admin")
        } else {
          router.push("/internal/employee")
        }
      } else {
        setError(data.error || "Credenciales inválidas")
        toast({
          title: "Error de acceso",
          description: data.error || "Credenciales inválidas",
          variant: "destructive",
        })
      }
    } catch (error) {
      setError("Error de conexión. Intenta nuevamente.")
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen papayoo-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="papayoo-card">
          <CardHeader className="text-center space-y-4">
            <Button variant="ghost" onClick={() => router.push("/")} className="absolute top-4 left-4 p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex justify-center">
              <Image
                src="/images/papayoo-logo.png"
                alt="Papayoo Logo"
                width={80}
                height={80}
                className="rounded-full"
              />
            </div>
            <CardTitle className="text-xl font-bold text-gray-800">Panel Interno</CardTitle>
            <CardDescription className="text-gray-600">Acceso para empleados y administradores</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuario" className="text-gray-700 font-medium">
                  Usuario
                </Label>
                <Input
                  id="usuario"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={formData.usuario}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contraseña" className="text-gray-700 font-medium">
                  Contraseña
                </Label>
                <Input
                  id="contraseña"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={formData.contraseña}
                  onChange={(e) => setFormData({ ...formData, contraseña: e.target.value })}
                  disabled={loading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full papayoo-button h-12" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Credenciales por defecto:</p>
                <p>
                  <strong>Empleado:</strong> usuario: empleado, contraseña: empleado123
                </p>
                <p>
                  <strong>Admin:</strong> usuario: admin, contraseña: admin123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
