"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Gift, QrCode } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const [codigo, setCodigo] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Limpiar cualquier sesión existente al cargar la página
    localStorage.removeItem("papayoo_token")
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigo.trim()) {
      setError("Por favor ingresa tu código único")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigo.toUpperCase() }),
      })

      const data = await response.json()

      if (response.ok) {
        // Código válido, redirigir a registro/login
        localStorage.setItem("temp_codigo", codigo.toUpperCase())
        router.push("/auth")
      } else {
        setError(data.error || "Código inválido")
        toast({
          title: "Error",
          description: data.error || "Código inválido",
          variant: "destructive",
        })
      }
    } catch (error) {
      setError("Error de conexión. Intenta nuevamente.")
      toast({
        title: "Error de conexión",
        description: "No se pudo verificar el código. Intenta nuevamente.",
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
            <div className="flex justify-center">
              <Image
                src="/images/papayoo-logo.png"
                alt="Papayoo Logo"
                width={120}
                height={120}
                className="rounded-full"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">¡Bienvenido a la Rifa Papayoo!</CardTitle>
            <CardDescription className="text-gray-600">
              Ingresa el código único de tu cupón para participar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
              <div className="flex items-start space-x-3">
                <QrCode className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium">¿Cómo participar?</p>
                  <p>1. Escanea el código QR de tu cupón</p>
                  <p>2. Ingresa el código único</p>
                  <p>3. Regístrate o inicia sesión</p>
                  <p>4. ¡Recibe tu número de rifa!</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo" className="text-gray-700 font-medium">
                  Código Único
                </Label>
                <Input
                  id="codigo"
                  type="text"
                  placeholder="Ej: ABC12345"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="text-center text-lg font-mono tracking-wider"
                  maxLength={8}
                  disabled={loading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full papayoo-button h-12 text-lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-5 w-5" />
                    Participar en la Rifa
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-500">
              <p>¿Eres empleado o administrador?</p>
              <Button
                variant="link"
                onClick={() => router.push("/internal")}
                className="text-orange-600 hover:text-orange-700 p-0 h-auto"
              >
                Acceder al panel interno
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
