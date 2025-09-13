"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Printer, LogOut, QrCode, Copy, Check } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import QRCode from "qrcode"

interface GeneratedCode {
  codigo: string
  qrDataUrl: string
}

export default function EmployeePage() {
  const [loading, setLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("internal_token")
    if (!token) {
      router.push("/internal")
      return
    }

    // Verificar token válido
    verifyToken()
  }, [router])

  const verifyToken = async () => {
    try {
      const token = localStorage.getItem("internal_token")
      const response = await fetch("/api/internal/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        localStorage.removeItem("internal_token")
        router.push("/internal")
      }
    } catch (error) {
      localStorage.removeItem("internal_token")
      router.push("/internal")
    }
  }

  const generateCode = async () => {
    setLoading(true)

    try {
      const token = localStorage.getItem("internal_token")
      const response = await fetch("/api/internal/generate-code", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (response.ok) {
        // Generar QR code
        const qrUrl = `${window.location.origin}`
        const qrDataUrl = await QRCode.toDataURL(qrUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: "#1a1a1a",
            light: "#ffffff",
          },
        })

        setGeneratedCode({
          codigo: data.codigo,
          qrDataUrl,
        })

        toast({
          title: "Código generado",
          description: `Nuevo código: ${data.codigo}`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al generar código",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "No se pudo generar el código",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyCode = async () => {
    if (generatedCode) {
      await navigator.clipboard.writeText(generatedCode.codigo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Código copiado",
        description: "El código se ha copiado al portapapeles",
      })
    }
  }

  const printCoupon = () => {
    if (!generatedCode) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cupón Papayoo</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .coupon {
              width: 300px;
              margin: 0 auto;
              border: 3px dashed #ff8c00;
              border-radius: 15px;
              padding: 20px;
              text-align: center;
              background: linear-gradient(135deg, #ff8c00 0%, #ffd700 100%);
              color: white;
            }
            .logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 15px;
              background: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 14px;
              margin-bottom: 20px;
              opacity: 0.9;
            }
            .qr-section {
              background: white;
              border-radius: 10px;
              padding: 15px;
              margin: 15px 0;
            }
            .qr-code {
              margin-bottom: 10px;
            }
            .code {
              font-size: 18px;
              font-weight: bold;
              color: #1a1a1a;
              font-family: monospace;
              letter-spacing: 2px;
            }
            .instructions {
              font-size: 12px;
              margin-top: 15px;
              line-height: 1.4;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .coupon { width: 280px; }
            }
          </style>
        </head>
        <body>
          <div class="coupon">
            <div class="logo">
              <span style="color: #ff8c00; font-weight: bold;">PAPAYOO</span>
            </div>
            <div class="title">¡PARTICIPA EN NUESTRA RIFA!</div>
            <div class="subtitle">Escanea el QR e ingresa tu código</div>
            
            <div class="qr-section">
              <div class="qr-code">
                <img src="${generatedCode.qrDataUrl}" alt="QR Code" style="width: 120px; height: 120px;" />
              </div>
              <div class="code">${generatedCode.codigo}</div>
            </div>
            
            <div class="instructions">
              1. Escanea el código QR<br>
              2. Ingresa el código único<br>
              3. Regístrate o inicia sesión<br>
              4. ¡Recibe tu número de rifa!
            </div>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleLogout = () => {
    localStorage.removeItem("internal_token")
    router.push("/internal")
  }

  return (
    <div className="min-h-screen papayoo-gradient p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card className="papayoo-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image
                src="/images/papayoo-logo.png"
                alt="Papayoo Logo"
                width={60}
                height={60}
                className="rounded-full"
              />
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">Panel de Empleado</CardTitle>
                <CardDescription className="text-gray-600">Genera e imprime cupones para clientes</CardDescription>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </CardHeader>
        </Card>

        {/* Generar código */}
        <Card className="papayoo-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-orange-600" />
              <span>Generar Nuevo Cupón</span>
            </CardTitle>
            <CardDescription>Crea un nuevo código único para entregar al cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={generateCode} disabled={loading} className="w-full papayoo-button h-12">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generando código...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Generar Cupón
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Cupón generado */}
        {generatedCode && (
          <Card className="papayoo-card border-2 border-orange-400">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-5 w-5 text-orange-600" />
                <span>Cupón Generado</span>
              </CardTitle>
              <CardDescription>Cupón listo para entregar al cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vista previa del cupón */}
              <div className="bg-gradient-to-br from-orange-400 to-yellow-400 p-6 rounded-lg text-white text-center">
                <div className="bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-sm">PAPAYOO</span>
                </div>
                <h3 className="text-xl font-bold mb-2">¡PARTICIPA EN NUESTRA RIFA!</h3>
                <p className="text-sm mb-4 opacity-90">Escanea el QR e ingresa tu código</p>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <img
                    src={generatedCode.qrDataUrl || "/placeholder.svg"}
                    alt="QR Code"
                    className="w-24 h-24 mx-auto mb-2"
                  />
                  <div className="text-black font-bold text-lg font-mono tracking-wider">{generatedCode.codigo}</div>
                </div>

                <div className="text-xs leading-relaxed">
                  1. Escanea el código QR
                  <br />
                  2. Ingresa el código único
                  <br />
                  3. Regístrate o inicia sesión
                  <br />
                  4. ¡Recibe tu número de rifa!
                </div>
              </div>

              {/* Código para copiar */}
              <Alert>
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    Código único: <strong className="font-mono">{generatedCode.codigo}</strong>
                  </span>
                  <Button onClick={copyCode} variant="outline" size="sm">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </AlertDescription>
              </Alert>

              {/* Botón de imprimir */}
              <Button onClick={printCoupon} className="w-full papayoo-button h-12">
                <Printer className="mr-2 h-5 w-5" />
                Imprimir Cupón
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instrucciones */}
        <Card className="papayoo-card">
          <CardHeader>
            <CardTitle>Instrucciones de Uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-3">
              <div className="bg-orange-100 text-orange-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                1
              </div>
              <p>Haz clic en "Generar Cupón" para crear un nuevo código único</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-orange-100 text-orange-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                2
              </div>
              <p>Revisa la vista previa del cupón generado</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-orange-100 text-orange-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <p>Haz clic en "Imprimir Cupón" para imprimir el cupón</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-orange-100 text-orange-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                4
              </div>
              <p>Entrega el cupón impreso al cliente con su compra</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
