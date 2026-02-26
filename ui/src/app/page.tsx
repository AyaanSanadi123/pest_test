"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Activity, Bug, History } from "lucide-react";

interface Alert {
  id: number;
  deviceId: string;
  insect: string;
  confidence: number;
  timestamp: string;
}

export default function Dashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Poll the API every 2 seconds
    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/alerts");
        const data = await res.json();
        
        setAlerts((prevAlerts) => {
          // If we have a new alert that wasn't in our previous state, trigger a toast!
          if (data.alerts.length > 0 && prevAlerts.length > 0) {
            if (data.alerts[0].id !== prevAlerts[0].id) {
              const latest = data.alerts[0];
              toast.error("🚨 Pest Detected!", {
                description: `${latest.insect} spotted with ${latest.confidence}% confidence.`,
              });
            }
          }
          return data.alerts;
        });
      } catch (error) {
        console.error("Failed to fetch alerts");
      }
    };

    const interval = setInterval(fetchAlerts, 2000);
    return () => clearInterval(interval);
  }, [toast]);

  // Quick stats calculations
  const totalAlerts = alerts.length;
  const mealworms = alerts.filter(a => a.insect === "Mealworm_L").length;
  const flourBeetles = alerts.filter(a => a.insect === "Flour_Beetle").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">SmartSilo Command Center</h1>
          <p className="text-slate-500 mt-2">Real-time acoustic pest monitoring.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
              <Activity className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAlerts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mealworm Activity</CardTitle>
              <Bug className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mealworms}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Flour Beetle Activity</CardTitle>
              <Bug className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{flourBeetles}</div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Silo ID</TableHead>
                  <TableHead>Detection</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                      Listening for acoustic anomalies...
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>{alert.deviceId}</TableCell>
                      <TableCell>
                        <Badge variant={alert.insect.includes('Beetle') ? 'destructive' : 'default'}>
                          {alert.insect.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {alert.confidence}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}