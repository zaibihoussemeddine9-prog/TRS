// This is a utility file for creating Leaflet divIcon markers
// Must only be used in client-side (non-SSR) contexts

export type ScooterStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE" | "OFFLINE";

export function getStatusColor(status: ScooterStatus): string {
  switch (status) {
    case "AVAILABLE":
      return "#10b981"; // emerald-500
    case "RENTED":
      return "#ef4444"; // red-500
    case "MAINTENANCE":
      return "#f59e0b"; // amber-500
    case "OFFLINE":
      return "#64748b"; // slate-500
    default:
      return "#10b981";
  }
}

export function getStatusLabel(status: ScooterStatus): string {
  switch (status) {
    case "AVAILABLE":
      return "Disponible";
    case "RENTED":
      return "Loué";
    case "MAINTENANCE":
      return "Maintenance";
    case "OFFLINE":
      return "Hors ligne";
    default:
      return status;
  }
}

export function createScooterMarkerHtml(status: ScooterStatus, battery: number): string {
  const color = getStatusColor(status);
  const batteryColor = battery >= 60 ? "#10b981" : battery >= 30 ? "#f59e0b" : "#ef4444";
  const batteryWidth = Math.max(battery, 5);

  return `
    <div style="position:relative;width:44px;height:52px;">
      <!-- Pin body -->
      <div style="
        width:44px;height:44px;
        background:${color};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 4px 12px rgba(0,0,0,0.4);
        border:2px solid rgba(255,255,255,0.3);
      "></div>
      <!-- Scooter icon centered in pin -->
      <div style="
        position:absolute;top:6px;left:6px;
        width:28px;height:28px;
        display:flex;align-items:center;justify-content:center;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="5" cy="17" r="3"/>
          <circle cx="19" cy="17" r="3"/>
          <path d="M12 17V7l-4-3h10l-2 3"/>
          <path d="M8 17h6"/>
        </svg>
      </div>
      <!-- Battery strip at bottom of pin -->
      <div style="
        position:absolute;bottom:10px;left:4px;
        width:36px;height:3px;
        background:#1e293b;border-radius:2px;overflow:hidden;
      ">
        <div style="width:${batteryWidth}%;height:100%;background:${batteryColor};border-radius:2px;"></div>
      </div>
    </div>
  `;
}

export function createUserLocationHtml(): string {
  return `
    <div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center;">
      <div style="
        width:20px;height:20px;
        background:#3b82f6;
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 0 0 4px rgba(59,130,246,0.3);
      "></div>
    </div>
  `;
}
