import {
  Laptop, Monitor, Computer, Smartphone, Tablet, Keyboard, Mouse,
  Headphones, Speaker, Printer, Video, Camera, HardDrive, Cpu,
  Server, Network, Wifi, Bluetooth, Usb, Book,
  Briefcase, Wrench, Hammer, PenTool, Box, Package, Truck, Car,
  Bus, File, FileText, Folder, Calculator, Calendar, Clock,
  Map, Compass, Lightbulb, Zap, Shield, Lock, Key, Settings,
  Layout, Grid, List, Maximize, Activity, Award, Badge, Star,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react'

// Only the icons offered by the category icon picker. Importing these by name
// (instead of `import * as LucideIcons`) keeps the other ~1500 icons out of the bundle.
// 'Microphone' is in the picker list but doesn't exist in lucide, so it was never rendered.
// Null prototype so names like "constructor" can't resolve to non-icons.
export const CATEGORY_ICONS: Record<string, LucideIcon | undefined> = Object.assign(Object.create(null), {
  Laptop, Monitor, Computer, Smartphone, Tablet, Keyboard, Mouse,
  Headphones, Speaker, Printer, Video, Camera, HardDrive, Cpu,
  Server, Network, Wifi, Bluetooth, Usb, Book,
  Briefcase, Wrench, Hammer, PenTool, Box, Package, Truck, Car,
  Bus, File, FileText, Folder, Calculator, Calendar, Clock,
  Map, Compass, Lightbulb, Zap, Shield, Lock, Key, Settings,
  Layout, Grid, List, Maximize, Activity, Award, Badge, Star,
  HelpCircle,
})

/** Icon component for a stored category icon name, or undefined (e.g. emoji icons). */
export function getCategoryIcon(name: string | null | undefined): LucideIcon | undefined {
  return name ? CATEGORY_ICONS[name] : undefined
}

export { HelpCircle as FallbackCategoryIcon }
