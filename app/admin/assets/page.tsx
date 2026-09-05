"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Package, Plus, Pencil, Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { getAssets, addAsset, updateAsset, deleteAsset, type Asset } from "@/lib/firebase/assets"

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState<Partial<Asset>>({
    name: "",
    description: "",
    value: 0,
    purchaseDate: "",
    status: "",
    serialNumber: "",
    location: "",
    notes: ""
  })

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    setIsLoading(true)
    try {
      const data = await getAssets()
      setAssets(data)
    } catch (e) {
      toast.error("Failed to load assets")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingAsset(null)
    setFormData({
      name: "", description: "", value: 0, purchaseDate: "", status: "", serialNumber: "", location: "", notes: ""
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset)
    setFormData({ ...asset })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (editingAsset?.id) {
        await updateAsset(editingAsset.id, formData)
        toast.success("Asset updated")
      } else {
        await addAsset(formData as Asset)
        toast.success("Asset created")
      }
      setIsDialogOpen(false)
      loadAssets()
    } catch (e) {
      toast.error("Failed to save asset")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return
    try {
      await deleteAsset(id)
      toast.success("Asset deleted")
      loadAssets()
    } catch (e) {
      toast.error("Failed to delete asset")
    }
  }

  return (
    <DashboardLayout>
      <motion.div
        className="flex flex-col gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Company Assets</h1>
              <p className="text-sm text-muted-foreground">Manage and track company property and assets.</p>
            </div>
          </div>
          <Button onClick={handleOpenCreate} className="bg-sahelx-600 hover:bg-sahelx-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>

        <div className="rounded-md border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Category/Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading assets...
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No assets found. Click "Add Asset" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div className="font-medium">{asset.name || "Unnamed Asset"}</div>
                      <div className="text-xs text-muted-foreground">{asset.serialNumber || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{asset.status || "Active"}</div>
                    </TableCell>
                    <TableCell>
                      ₦{(asset.value || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>{asset.location || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(asset)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => asset.id && handleDelete(asset.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsset ? "Edit Asset" : "Add New Asset"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Asset Name</Label>
              <Input value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input value={formData.serialNumber || ""} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Value (₦)</Label>
              <Input type="number" value={formData.value || ""} onChange={e => setFormData({ ...formData, value: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Purchase Date</Label>
              <Input type="date" value={formData.purchaseDate || ""} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Input placeholder="e.g. Active, Maintenance, Disposed" value={formData.status || ""} onChange={e => setFormData({ ...formData, status: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={formData.location || ""} onChange={e => setFormData({ ...formData, location: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Additional Notes</Label>
              <Textarea value={formData.notes || ""} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-sahelx-600 hover:bg-sahelx-700">
              {isSaving ? "Saving..." : "Save Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
