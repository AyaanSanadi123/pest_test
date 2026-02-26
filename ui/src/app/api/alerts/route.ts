import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 1. Temporary UI State
let alertsDB: any[] = [];

// 2. CSV Permanent Storage Setup
const LOG_FILE_PATH = path.join(process.cwd(), 'silo_telemetry_log.csv');

// Boot sequence: Create the CSV with advanced headers if it doesn't exist
if (!fs.existsSync(LOG_FILE_PATH)) {
    const headers = 'timestamp,device_id,predicted_class,confidence,rms_energy,inference_time_ms\n';
    fs.writeFileSync(LOG_FILE_PATH, headers);
    console.log("📄 Created new telemetry log: silo_telemetry_log.csv");
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Extract the 6 advanced parameters sent by Python
    const { device_id, predicted_class, confidence, rms_energy, inference_time_ms, timestamp } = payload;
    
    // --- TRACK A: Update the Live Next.js Dashboard ---
    const newAlert = { 
      id: Date.now(),
      deviceId: device_id, 
      insect: predicted_class, 
      confidence: confidence, 
      timestamp: timestamp 
    };
    
    alertsDB.unshift(newAlert);
    if (alertsDB.length > 50) alertsDB.pop(); // Prevent memory bloat

    // --- TRACK B: Append to the CSV for Future Data Science ---
    const csvLine = `${timestamp},${device_id},${predicted_class},${confidence},${rms_energy},${inference_time_ms}\n`;
    fs.appendFileSync(LOG_FILE_PATH, csvLine);

    return NextResponse.json({ success: true, alert: newAlert });
    
  } catch (error) {
    console.error("Failed to log alert:", error);
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ alerts: alertsDB });
}