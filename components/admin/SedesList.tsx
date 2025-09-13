"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Download, Building2 } from "lucide-react"

interface Sede {
  id: number
  nombre: string
  ciudad: string
  direccion?: string
  estado: "activa" | "inactiva"
  fecha_creacion: string
}

interface SedesListProps {
  sedes: Sede[]
  onEdit: (sede: Sede) => void
  onDelete: (sede: Sede) => void
  onExport: (sede: Sede) => void
  loading: boolean
}

export function SedesList({ sedes, onEdit, onDelete, onExport, loading }: SedesListProps) {
  if (sedes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">No se encontraron sedes</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Sedes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sedes.map((sede) => (
            <div key={sede.id} className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{sede.nombre}</h3>
                  <Badge variant={sede.estado === "activa" ? "default" : "secondary"}>{sede.estado}</Badge>
                </div>
                <p className="text-sm text-gray-600">{sede.ciudad}</p>
                {sede.direccion && <p className="text-sm text-gray-500">{sede.direccion}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  Creada: {new Date(sede.fecha_creacion).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport(sede)}
                  disabled={loading}
                  title="Exportar clientes"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(sede)} disabled={loading} title="Editar sede">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(sede)}
                  disabled={loading || sede.estado === "inactiva"}
                  title="Desactivar sede"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
