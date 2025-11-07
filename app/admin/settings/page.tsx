"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Save, Loader2, Settings, Database, Key, Bell } from "lucide-react"

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    // Data Quality Settings
    autoCalculateQualityScore: true,
    qualityScoreThreshold: 70,
    
    // Audit Settings
    enableAuditLogging: true,
    auditLogRetentionDays: 365,
    
    // API Settings
    enablePublicAPI: false,
    apiRateLimit: 100,
    
    // Notification Settings
    notifyOnDataQualityIssues: true,
    notifyOnBulkOperations: true,
  })

  const handleSave = async () => {
    setSaving(true)
    // TODO: Implement settings save API
    setTimeout(() => {
      setSaving(false)
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully",
      })
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure system settings and preferences
        </p>
      </div>

      {/* Data Quality Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Quality Settings
          </CardTitle>
          <CardDescription>
            Configure data quality scoring and thresholds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-calculate Quality Score</Label>
              <p className="text-sm text-muted-foreground">
                Automatically calculate data quality scores when data is updated
              </p>
            </div>
            <Switch
              checked={settings.autoCalculateQualityScore}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoCalculateQualityScore: checked })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qualityScoreThreshold">Quality Score Threshold</Label>
            <Input
              id="qualityScoreThreshold"
              type="number"
              min="0"
              max="100"
              value={settings.qualityScoreThreshold}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  qualityScoreThreshold: parseInt(e.target.value) || 70,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Institutions/programs below this score will be flagged
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Audit Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Audit Settings
          </CardTitle>
          <CardDescription>
            Configure audit logging and retention
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Audit Logging</Label>
              <p className="text-sm text-muted-foreground">
                Log all changes to institutions and programs
              </p>
            </div>
            <Switch
              checked={settings.enableAuditLogging}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enableAuditLogging: checked })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auditLogRetentionDays">Audit Log Retention (Days)</Label>
            <Input
              id="auditLogRetentionDays"
              type="number"
              min="30"
              max="3650"
              value={settings.auditLogRetentionDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  auditLogRetentionDays: parseInt(e.target.value) || 365,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              How long to keep audit logs (30-3650 days)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Settings
          </CardTitle>
          <CardDescription>
            Configure public API access and rate limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Public API</Label>
              <p className="text-sm text-muted-foreground">
                Allow public access to API endpoints
              </p>
            </div>
            <Switch
              checked={settings.enablePublicAPI}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enablePublicAPI: checked })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiRateLimit">API Rate Limit (per hour)</Label>
            <Input
              id="apiRateLimit"
              type="number"
              min="10"
              max="10000"
              value={settings.apiRateLimit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  apiRateLimit: parseInt(e.target.value) || 100,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Maximum API requests per hour per IP
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notify on Data Quality Issues</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when data quality scores drop below threshold
              </p>
            </div>
            <Switch
              checked={settings.notifyOnDataQualityIssues}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notifyOnDataQualityIssues: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notify on Bulk Operations</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when bulk operations are performed
              </p>
            </div>
            <Switch
              checked={settings.notifyOnBulkOperations}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notifyOnBulkOperations: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

