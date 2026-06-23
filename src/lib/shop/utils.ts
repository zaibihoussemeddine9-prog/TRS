export function formatDZD(amount: number): string {
  return new Intl.NumberFormat("fr-DZ").format(Math.round(amount)) + " DA"
}

export function formatTiktokViews(views: number): string {
  if (views >= 1_000_000) return (views / 1_000_000).toFixed(1) + "M vues"
  if (views >= 1_000) return (views / 1_000).toFixed(0) + "K vues"
  return views + " vues"
}

export function generateOrderNumber(): string {
  const now = Date.now()
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `TRS-${now.toString().slice(-6)}${random}`
}

export function formatPhoneAlgeria(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10 && digits.startsWith("0")) {
    return digits.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4")
  }
  return phone
}

export const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  NOUVELLE: { label: "Nouvelle", color: "text-blue-400", bg: "bg-blue-400/10" },
  CONFIRMEE: { label: "Confirmée", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  EN_LIVRAISON: { label: "En livraison", color: "text-purple-400", bg: "bg-purple-400/10" },
  LIVREE: { label: "Livrée", color: "text-green-400", bg: "bg-green-400/10" },
  ANNULEE: { label: "Annulée", color: "text-red-400", bg: "bg-red-400/10" },
}
