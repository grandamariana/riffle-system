"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, User, UserPlus, ArrowLeft, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import {
  validateDocument,
  validateEmail,
  validateName,
  sanitizeDocument,
  sanitizeEmail,
  sanitizeName,
  checkRateLimit,
} from "@/lib/utils"

interface ValidationErrors {
  nombre?: string
  apellidos?: string
  documento?: string
  correo?: string
  contraseña?: string
  confirmarContraseña?: string
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const router = useRouter()
  const { toast } = useToast()

  // Estados para login
  const [loginData, setLoginData] = useState({
    documento: "",
    contraseña: "",
  })

  // Estados para registro
  const [registerData, setRegisterData] = useState({
    nombre: "",
    apellidos: "",
    documento: "",
    correo: "",
    contraseña: "",
    confirmarContraseña: "",
  })

  useEffect(() => {
    // Verificar que hay un código temporal
    const tempCodigo = localStorage.getItem("temp_codigo")
    if (!tempCodigo) {
      router.push("/")
      return
    }
  }, [router])

  const validateRegisterForm = (): boolean => {
    const errors: ValidationErrors = {}

    if (!validateName(registerData.nombre)) {
      errors.nombre = "El nombre debe tener entre 2 y 100 caracteres y solo contener letras"
    }

    if (!validateName(registerData.apellidos)) {
      errors.apellidos = "Los apellidos deben tener entre 2 y 100 caracteres y solo contener letras"
    }

    if (!validateDocument(registerData.documento)) {
      errors.documento = "El documento debe tener entre 8 y 12 dígitos"
    }

    if (!validateEmail(registerData.correo)) {
      errors.correo = "El correo electrónico no es válido"
    }

    if (!registerData.contraseña || registerData.contraseña.length < 6) {
      errors.contraseña = "La contraseña debe tener al menos 6 caracteres"
    }

    if (registerData.contraseña !== registerData.confirmarContraseña) {
      errors.confirmarContraseña = "Las contraseñas no coinciden"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // Rate limiting
    if (!checkRateLimit("login", 5, 300000)) {
      // 5 intentos por 5 minutos
      setError("Demasiados intentos. Espera unos minutos antes de intentar nuevamente.")
      return
    }

    if (!loginData.documento || !loginData.contraseña) {
      setError("Todos los campos son obligatorios")
      return
    }

    if (!validateDocument(loginData.documento)) {
      setError("El documento debe tener entre 8 y 12 dígitos")
      return
    }

    setLoading(true)
    setError("")

    try {
      const tempCodigo = localStorage.getItem("temp_codigo")
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documento: sanitizeDocument(loginData.documento),
          contraseña: loginData.contraseña,
          codigo: tempCodigo,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("papayoo_token", data.token)
        localStorage.removeItem("temp_codigo")
        router.push("/raffle")
      } else {
        setError(data.error || "Error al iniciar sesión")
      }
    } catch (error) {
      setError("Error de conexión. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Rate limiting
    if (!checkRateLimit("register", 3, 300000)) {
      // 3 intentos por 5 minutos
      setError("Demasiados intentos de registro. Espera unos minutos antes de intentar nuevamente.")
      return
    }

    // Validar formulario
    if (!validateRegisterForm()) {
      setError("Por favor corrige los errores en el formulario")
      return
    }

    setLoading(true)
    setError("")

    try {
      const tempCodigo = localStorage.getItem("temp_codigo")
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: sanitizeName(registerData.nombre),
          apellidos: sanitizeName(registerData.apellidos),
          documento: sanitizeDocument(registerData.documento),
          correo: sanitizeEmail(registerData.correo),
          contraseña: registerData.contraseña,
          codigo: tempCodigo,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("papayoo_token", data.token)
        localStorage.removeItem("temp_codigo")
        router.push("/raffle")
      } else {
        setError(data.error || "Error al registrarse")
      }
    } catch (error) {
      setError("Error de conexión. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterInputChange = (field: keyof typeof registerData, value: string) => {
    setRegisterData({ ...registerData, [field]: value })

    // Limpiar error de validación cuando el usuario empiece a escribir
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors({ ...validationErrors, [field]: undefined })
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
            <CardTitle className="text-xl font-bold text-gray-800">Accede a tu cuenta</CardTitle>
            <CardDescription className="text-gray-600">Inicia sesión o crea una cuenta nueva</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-documento">Documento</Label>
                    <Input
                      id="login-documento"
                      type="text"
                      placeholder="12345678"
                      value={loginData.documento}
                      onChange={(e) => setLoginData({ ...loginData, documento: e.target.value })}
                      disabled={loading}
                      maxLength={12}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-contraseña">Contraseña</Label>
                    <Input
                      id="login-contraseña"
                      type="password"
                      value={loginData.contraseña}
                      onChange={(e) => setLoginData({ ...loginData, contraseña: e.target.value })}
                      disabled={loading}
                      maxLength={128}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full papayoo-button" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      <>
                        <User className="mr-2 h-4 w-4" />
                        Iniciar Sesión
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        type="text"
                        value={registerData.nombre}
                        onChange={(e) => handleRegisterInputChange("nombre", e.target.value)}
                        disabled={loading}
                        maxLength={100}
                        className={validationErrors.nombre ? "border-red-500" : ""}
                      />
                      {validationErrors.nombre && <p className="text-xs text-red-600">{validationErrors.nombre}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellidos">Apellidos</Label>
                      <Input
                        id="apellidos"
                        type="text"
                        value={registerData.apellidos}
                        onChange={(e) => handleRegisterInputChange("apellidos", e.target.value)}
                        disabled={loading}
                        maxLength={100}
                        className={validationErrors.apellidos ? "border-red-500" : ""}
                      />
                      {validationErrors.apellidos && (
                        <p className="text-xs text-red-600">{validationErrors.apellidos}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documento">Documento</Label>
                    <Input
                      id="documento"
                      type="text"
                      placeholder="12345678"
                      value={registerData.documento}
                      onChange={(e) => handleRegisterInputChange("documento", e.target.value)}
                      disabled={loading}
                      maxLength={12}
                      className={validationErrors.documento ? "border-red-500" : ""}
                    />
                    {validationErrors.documento && <p className="text-xs text-red-600">{validationErrors.documento}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="correo">Correo Electrónico</Label>
                    <Input
                      id="correo"
                      type="email"
                      placeholder="tu@email.com"
                      value={registerData.correo}
                      onChange={(e) => handleRegisterInputChange("correo", e.target.value)}
                      disabled={loading}
                      maxLength={255}
                      className={validationErrors.correo ? "border-red-500" : ""}
                    />
                    {validationErrors.correo && <p className="text-xs text-red-600">{validationErrors.correo}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contraseña">Contraseña</Label>
                    <Input
                      id="contraseña"
                      type="password"
                      value={registerData.contraseña}
                      onChange={(e) => handleRegisterInputChange("contraseña", e.target.value)}
                      disabled={loading}
                      maxLength={128}
                      className={validationErrors.contraseña ? "border-red-500" : ""}
                    />
                    {validationErrors.contraseña && (
                      <p className="text-xs text-red-600">{validationErrors.contraseña}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmar-contraseña">Confirmar Contraseña</Label>
                    <Input
                      id="confirmar-contraseña"
                      type="password"
                      value={registerData.confirmarContraseña}
                      onChange={(e) => handleRegisterInputChange("confirmarContraseña", e.target.value)}
                      disabled={loading}
                      maxLength={128}
                      className={validationErrors.confirmarContraseña ? "border-red-500" : ""}
                    />
                    {validationErrors.confirmarContraseña && (
                      <p className="text-xs text-red-600">{validationErrors.confirmarContraseña}</p>
                    )}
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full papayoo-button" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Crear Cuenta
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
