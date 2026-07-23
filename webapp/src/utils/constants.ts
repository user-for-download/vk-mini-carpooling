/** Shared seat configuration — single source of truth for both DriverPanel and TripCard. */
export const SEATS = [
  { id: 1, label: 'В', position: 'driver' as const },
  { id: 2, label: 'ПП', position: 'front-passenger' as const },
  { id: 3, label: 'ЗЛ', position: 'rear-left' as const },
  { id: 4, label: 'ЗЦ', position: 'rear-center' as const },
  { id: 5, label: 'ЗП', position: 'rear-right' as const },
];