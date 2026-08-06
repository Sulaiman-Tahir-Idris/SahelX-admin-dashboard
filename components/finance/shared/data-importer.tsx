"use client"

import { useState, useRef } from "react"
import { Upload, Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { saveAs } from "file-saver"

interface DataImporterProps {
  title: string
  templateName: string
  columns: string[]
  dropdownLists?: Record<string, string[]>
  onImport: (data: any[]) => Promise<void>
}

export function DataImporter({ title, templateName, columns, dropdownLists, onImport }: DataImporterProps) {
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownloadTemplate = async () => {
    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Template")

      // Add Headers
      worksheet.addRow(columns)
      
      // Style headers
      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD93C3C" } // SahelX Red
        }
        cell.alignment = { horizontal: "center" }
      })

      // Set column widths
      worksheet.columns.forEach(column => {
        column.width = 20
      })

      // Add dummy data row
      const dummyData = columns.map(col => {
        if (col === "Date") return new Date()
        if (col === "Amount" || col === "Cost") return 5000
        return "Sample Data"
      })
      worksheet.addRow(dummyData)

      // Add Data Validation (Dropdowns)
      if (dropdownLists) {
        Object.entries(dropdownLists).forEach(([colName, options]) => {
          const colIndex = columns.indexOf(colName)
          if (colIndex !== -1) {
            // Apply validation to the next 1000 rows
            for (let i = 2; i <= 1001; i++) {
              const cell = worksheet.getCell(i, colIndex + 1)
              cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`"${options.join(',')}"`]
              }
            }
          }
        })
      }

      // Download file
      const buffer = await workbook.xlsx.writeBuffer()
      saveAs(new Blob([buffer]), `${templateName}_Template.xlsx`)

    } catch (error) {
      toast.error("Failed to generate template")
      console.error(error)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()

    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx-js-style')
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        
        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(ws)
        
        if (data.length === 0) {
          throw new Error("The uploaded file is empty.")
        }

        // Basic validation: check if the first row has all required columns
        const firstRow = data[0] as any
        const missingColumns = columns.filter(col => !(col in firstRow))
        
        if (missingColumns.length > 0) {
          throw new Error(`Missing required columns: ${missingColumns.join(", ")}`)
        }

        await onImport(data)
        toast.success(`Successfully imported ${data.length} records`)
        
      } catch (error: any) {
        toast.error(error.message || "Failed to parse the file")
      } finally {
        setLoading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = "" // reset input
        }
      }
    }
    
    reader.onerror = () => {
      toast.error("Failed to read the file")
      setLoading(false)
    }

    reader.readAsBinaryString(file)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={loading} className="gap-2">
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Template</span>
      </Button>
      
      <div className="relative">
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileUpload}
          disabled={loading}
          ref={fileInputRef}
        />
        <Button size="sm" disabled={loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span className="hidden sm:inline">{loading ? "Importing..." : title}</span>
        </Button>
      </div>
    </div>
  )
}
