"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, FileSpreadsheet, Download } from 'lucide-react'
import { toast } from 'sonner'
import { saveAs } from 'file-saver'

import { getAllPayments } from '@/lib/firebase/payments'
import { getRevenueEntries, getExpenses, getCashTransactions } from '@/lib/firebase/finance'
import type { Payment } from '@/lib/firebase/payments'
import type { RevenueEntry, Expense, CashTransaction } from '@/lib/finance/types'

import { useCurrency } from "@/components/providers/currency-provider"
import { CurrencySwitcher } from "@/components/finance/currency-switcher"

const reports = [
  { id: 'monthly-revenue',     name: 'Monthly Revenue',      description: 'All revenue for the selected month' },
  { id: 'monthly-expense',     name: 'Monthly Expenses',     description: 'All expenses for the selected month' },
  { id: 'cash-flow',           name: 'Cash Flow',            description: 'Cash in/out statement' },
  { id: 'profit-loss',         name: 'Profit & Loss',        description: 'Revenue vs expenses summary' },
  { id: 'dept-spending',       name: 'Department Spending',  description: 'Expense breakdown by department' },
  { id: 'category-spending',   name: 'Category Spending',    description: 'Expense breakdown by category' },
  { id: 'revenue-by-rider',    name: 'Revenue by Rider',     description: 'Revenue grouped by rider' },
  { id: 'revenue-by-method',   name: 'Revenue by Payment Method', description: 'Revenue grouped by payment method' },
  { id: 'expense-by-dept',     name: 'Expense by Department', description: 'Totals per department' },
  { id: 'expense-by-category', name: 'Expense by Category',  description: 'Totals per category' },
]

export function ReportsPage() {
  const { formatAmount } = useCurrency()
  const [payments, setPayments] = useState<Payment[]>([])
  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [cashTxns, setCashTxns] = useState<CashTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  useEffect(() => {
    Promise.all([
      getAllPayments(),
      getRevenueEntries(),
      getExpenses(),
      getCashTransactions(),
    ]).then(([p, r, e, c]) => {
      setPayments(p)
      setRevenueEntries(r)
      setExpenses(e)
      setCashTxns(c)
    }).finally(() => setLoading(false))
  }, [])

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ]
  
  const currentYear = new Date().getFullYear()
  const years = [currentYear.toString(), (currentYear - 1).toString(), (currentYear - 2).toString()]

  const allRevenue = useMemo(() => {
    return [
      ...payments.filter(p => p.status === 'paid').map(p => ({
        date: new Date(p.paidAt ?? p.createdAt), amount: Number(p.amount), type: 'Gateway', source: p.gateway, rider: 'N/A'
      })),
      ...revenueEntries.map(e => ({
        date: new Date(e.date), amount: Number(e.amount), type: 'Manual', source: e.paymentMethod, rider: e.rider || 'N/A'
      }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [payments, revenueEntries])

  const getReportData = (reportId: string) => {
    const month = parseInt(selectedMonth) - 1
    const year = parseInt(selectedYear)
    
    let rows: any[] = []
    let head: string[] = []
    let title = ""

    const filterByMonth = (d: Date) => d.getMonth() === month && d.getFullYear() === year

    switch (reportId) {
      case 'monthly-revenue':
        head = ['Date', 'Type', 'Source/Method', 'Amount']
        title = `Monthly Revenue - ${months[month].label} ${year}`
        rows = allRevenue.filter(r => filterByMonth(r.date)).map(r => [
          r.date.toLocaleDateString(), r.type, r.source, formatAmount(r.amount)
        ])
        break
      case 'monthly-expense':
        head = ['Date', 'Department', 'Category', 'Vendor', 'Amount']
        title = `Monthly Expenses - ${months[month].label} ${year}`
        rows = expenses.filter(e => filterByMonth(new Date(e.date)) && e.status !== 'rejected').map(e => [
          new Date(e.date).toLocaleDateString(), e.department, e.category, e.vendor, formatAmount(e.amount)
        ])
        break
      case 'cash-flow':
        head = ['Date', 'Type', 'Description', 'Amount']
        title = `Cash Flow - ${months[month].label} ${year}`
        rows = cashTxns.filter(c => filterByMonth(new Date(c.date))).map(c => [
          new Date(c.date).toLocaleDateString(), c.type, c.description, formatAmount(c.amount)
        ])
        break
      case 'profit-loss':
        head = ['Category', 'Total Amount']
        title = `Profit & Loss - ${months[month].label} ${year}`
        const revTotal = allRevenue.filter(r => filterByMonth(r.date)).reduce((s, r) => s + r.amount, 0)
        const expTotal = expenses.filter(e => filterByMonth(new Date(e.date)) && e.status !== 'rejected').reduce((s, e) => s + e.amount, 0)
        rows = [
          ['Total Revenue', formatAmount(revTotal)],
          ['Total Expenses', formatAmount(expTotal)],
          ['Net Profit', formatAmount(revTotal - expTotal)]
        ]
        break
      case 'dept-spending':
      case 'expense-by-dept':
        head = ['Department', 'Total Amount']
        title = `Expense by Department - ${months[month].label} ${year}`
        const deptMap: Record<string, number> = {}
        expenses.filter(e => filterByMonth(new Date(e.date)) && e.status !== 'rejected').forEach(e => {
          deptMap[e.department] = (deptMap[e.department] || 0) + e.amount
        })
        rows = Object.entries(deptMap).map(([d, a]) => [d, formatAmount(a)])
        break
      case 'category-spending':
      case 'expense-by-category':
        head = ['Category', 'Total Amount']
        title = `Expense by Category - ${months[month].label} ${year}`
        const catMap: Record<string, number> = {}
        expenses.filter(e => filterByMonth(new Date(e.date)) && e.status !== 'rejected').forEach(e => {
          catMap[e.category] = (catMap[e.category] || 0) + e.amount
        })
        rows = Object.entries(catMap).map(([c, a]) => [c, formatAmount(a)])
        break
      case 'revenue-by-rider':
        head = ['Rider', 'Total Revenue']
        title = `Revenue by Rider - ${months[month].label} ${year}`
        const riderMap: Record<string, number> = {}
        allRevenue.filter(r => filterByMonth(r.date)).forEach(r => {
          riderMap[r.rider] = (riderMap[r.rider] || 0) + r.amount
        })
        rows = Object.entries(riderMap).map(([r, a]) => [r, formatAmount(a)])
        break
      case 'revenue-by-method':
        head = ['Payment Method', 'Total Revenue']
        title = `Revenue by Payment Method - ${months[month].label} ${year}`
        const methodMap: Record<string, number> = {}
        allRevenue.filter(r => filterByMonth(r.date)).forEach(r => {
          methodMap[r.source] = (methodMap[r.source] || 0) + r.amount
        })
        rows = Object.entries(methodMap).map(([m, a]) => [m, formatAmount(a)])
        break
    }
    return { head, rows, title }
  }

  const exportPDF = async (reportId: string) => {
    const { head, rows, title } = getReportData(reportId)
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width

    // 1. Fetch logo from public folder (no base64 bundle overhead)
    try {
      const resp = await fetch('/images/sahelx-logo.png')
      const blob = await resp.blob()
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      const imgWidth = 35
      const img = new Image()
      img.src = dataUrl
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject })
      const canvas = document.createElement('canvas')
      canvas.width = img.width || 500
      canvas.height = img.height || 200
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const pngData = canvas.toDataURL('image/png')
        const imgHeight = imgWidth * (canvas.height / canvas.width)
        doc.addImage(pngData, 'PNG', (pageWidth - imgWidth) / 2, 12, imgWidth, imgHeight)
      }
    } catch (e) {
      // Logo fetch failed — continue without it
    }

    // 2. Add Titles & Meta (Centered)
    doc.setFontSize(16)
    doc.setTextColor(217, 60, 60)
    const titleWidth = doc.getTextWidth(title)
    doc.text(title, (pageWidth - titleWidth) / 2, 45)
    
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const periodText = `Period: ${months[parseInt(selectedMonth)-1].label} ${selectedYear}`
    const generatedText = `Generated: ${new Date().toLocaleDateString()}`
    
    doc.text(periodText, (pageWidth - doc.getTextWidth(periodText)) / 2, 52)
    doc.text(generatedText, (pageWidth - doc.getTextWidth(generatedText)) / 2, 57)

    // 3. Add Table
    autoTable(doc, { 
      head: [head], 
      body: rows, 
      startY: 65,
      theme: 'grid',
      headStyles: { fillColor: [217, 60, 60], textColor: 255, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { left: 14, right: 14 }
    })
    
    doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`)
    toast.success("PDF exported successfully")
  }

  const exportExcel = async (reportId: string) => {
    const XLSX = await import('xlsx-js-style')
    const { head, rows, title } = getReportData(reportId)
    
    // Add meta-headers for Excel to make it look like a report
    const reportHeader = [
      [{ v: "SahelX Financial Report", t: "s", s: { font: { bold: true, sz: 16, color: { rgb: "D93C3C" } } } }],
      [{ v: title, t: "s", s: { font: { bold: true, sz: 12 } } }],
      [{ v: `Period: ${months[parseInt(selectedMonth)-1].label} ${selectedYear}`, t: "s", s: { font: { italic: true, color: { rgb: "666666" } } } }],
      [{ v: `Generated: ${new Date().toLocaleDateString()}`, t: "s", s: { font: { italic: true, color: { rgb: "666666" } } } }],
      [] // Empty spacer row
    ]
    
    // Style the table headers
    const styledHead = head.map(h => ({
      v: h,
      t: "s",
      s: {
        fill: { fgColor: { rgb: "D93C3C" } },
        font: { color: { rgb: "FFFFFF" }, bold: true },
        alignment: { horizontal: "center", vertical: "center" }
      }
    }))

    // Style the data rows
    const styledRows = rows.map((row, rowIndex) => 
      row.map(cell => ({
        v: cell,
        t: typeof cell === 'number' ? 'n' : 's',
        s: {
          fill: { fgColor: { rgb: rowIndex % 2 === 0 ? "FFFFFF" : "F9F9F9" } },
          border: {
            top: { style: "thin", color: { rgb: "EEEEEE" } },
            bottom: { style: "thin", color: { rgb: "EEEEEE" } },
            left: { style: "thin", color: { rgb: "EEEEEE" } },
            right: { style: "thin", color: { rgb: "EEEEEE" } }
          }
        }
      }))
    )
    
    const data = [...reportHeader, styledHead, ...styledRows]
    const ws = XLSX.utils.aoa_to_sheet(data)
    
    // Make columns wider automatically
    ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }]
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Report")
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `${title.replace(/[^a-z0-9]/gi, '_')}.xlsx`)
    toast.success("Excel exported successfully")
  }

  const exportCSV = (reportId: string) => {
    const { head, rows, title } = getReportData(reportId)
    
    // Add meta-headers for CSV
    const meta = [
      `"SahelX Financial Report"`,
      `"${title}"`,
      `"Period: ${months[parseInt(selectedMonth)-1].label} ${selectedYear}"`,
      `"Generated: ${new Date().toLocaleDateString()}"`,
      ``
    ].join('\n')
    
    const csvContent = [
      meta,
      head.join(','),
      ...rows.map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${title.replace(/[^a-z0-9]/gi, '_')}.csv`)
    toast.success("CSV exported successfully")
  }

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm">Loading reports data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 overflow-hidden">
      <div>
        <h1 className="font-heading text-2xl font-bold">Financial Reports</h1>
        <p className="text-sm text-muted-foreground">Export your financial data in multiple formats</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-full sm:w-[120px]">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map(report => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle className="text-base">{report.name}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => exportPDF(report.id)}>
                  <FileText className="h-3.5 w-3.5 mr-1" /> PDF
                </Button>
                <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => exportExcel(report.id)}>
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Excel
                </Button>
                <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => exportCSV(report.id)}>
                  <Download className="h-3.5 w-3.5 mr-1" /> CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
