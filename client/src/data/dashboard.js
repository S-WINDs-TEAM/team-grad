import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Cloud,
  CloudLightning,
  CloudRain,
  Gauge,
  LayoutDashboard,
  List,
  Moon,
  Route,
  Settings,
  ShieldCheck,
  Sun,
  Truck,
} from 'lucide-react';

export const coordinates = {
  Cairo: [29.9792, 31.1342],
  Alexandria: [31.2001, 29.9187],
  Suez: [29.9668, 32.5498],
  Hurghada: [27.2579, 33.8116],
  Asyut: [27.1809, 31.1837],
  Damanhur: [31.0341, 30.4682],
  'Port Said': [31.2653, 32.3019],
};

export const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Fleet Overview', href: '/fleet', icon: Truck },
  { label: 'Trip History', href: '/trips', icon: Clock },
  { label: 'Route Comparison', href: '/routes', icon: Route },
  { label: 'Vehicle List', href: '/vehicles', icon: List },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export const notifications = [
  '3 vehicles require review',
  '4 high-risk routes',
  'Weather impact between 12PM-5PM',
];

export const kpis = [
  { title: 'VEHICLES TO DEPLOY', value: '24', footer: '3 require review', tone: 'cyan', icon: Truck },
  { title: 'SAFE TO SEND', value: '18', percent: '75%', footer: 'vs 22 yesterday', tone: 'green', icon: ShieldCheck },
  { title: 'HIGH RISK', value: '4', footer: 'dispatch blocked', tone: 'red', icon: AlertTriangle },
  { title: 'AVG RISK SCORE', value: '3.2', suffix: '/10', footer: 'vs 3.8 yesterday', tone: 'orange', icon: Gauge },
  { title: 'NEXT DECISION', value: '08:00 AM', footer: '42 min', tone: 'cyan', icon: Clock },
];

export const vehicles = [
  {
    id: 'SW-TRK-001',
    route: 'Cairo -> Alexandria',
    from: 'Cairo',
    to: 'Alexandria',
    risk: 'LOW',
    departure: '07:00 AM',
    eta: '11:20 AM',
    weather: { label: 'Sunny', temp: '28°C', icon: Sun },
    decision: 'Approved',
    status: 'green',
    duration: '4h 20m',
    distance: '220 km',
  },
  {
    id: 'SW-TRK-002',
    route: 'Cairo -> Port Said',
    from: 'Cairo',
    to: 'Port Said',
    risk: 'LOW',
    departure: '07:30 AM',
    eta: '12:10 PM',
    weather: { label: 'Partly Cloudy', temp: '29°C', icon: Cloud },
    decision: 'Approved',
    status: 'green',
    duration: '4h 40m',
    distance: '205 km',
  },
  {
    id: 'SW-TRK-003',
    route: 'Cairo -> Suez',
    from: 'Cairo',
    to: 'Suez',
    risk: 'MEDIUM',
    departure: '08:00 AM',
    eta: '12:45 PM',
    weather: { label: 'Cloudy', temp: '30°C', icon: Cloud },
    decision: 'Review',
    status: 'orange',
    duration: '4h 45m',
    distance: '145 km',
  },
  {
    id: 'SW-TRK-004',
    route: 'Cairo -> Damanhur',
    from: 'Cairo',
    to: 'Damanhur',
    risk: 'MEDIUM',
    departure: '08:30 AM',
    eta: '01:30 PM',
    weather: { label: 'Rain/Thunder', temp: '31°C', icon: CloudLightning },
    decision: 'Review',
    status: 'orange',
    duration: '5h 00m',
    distance: '165 km',
  },
  {
    id: 'SW-TRK-005',
    route: 'Cairo -> Hurghada',
    from: 'Cairo',
    to: 'Hurghada',
    risk: 'HIGH',
    departure: '09:00 AM',
    eta: '03:50 PM',
    weather: { label: 'Storm', temp: '32°C', icon: CloudLightning },
    decision: 'Blocked',
    status: 'red',
    duration: '4h 50m',
    distance: '450 km',
  },
  {
    id: 'SW-TRK-006',
    route: 'Cairo -> Asyut',
    from: 'Cairo',
    to: 'Asyut',
    risk: 'HIGH',
    departure: '09:30 AM',
    eta: '04:40 PM',
    weather: { label: 'Sunny', temp: '33°C', icon: Sun },
    decision: 'Blocked',
    status: 'red',
    duration: '7h 10m',
    distance: '380 km',
  },
];

export const mapRoutes = [
  {
    vehicleId: 'SW-TRK-001',
    name: 'Cairo -> Alexandria',
    from: 'Cairo',
    to: 'Alexandria',
    color: '#22C55E',
    points: [[29.9792, 31.1342], [30.33, 30.92], [30.71, 30.43], [31.04, 30.05], [31.2001, 29.9187]],
  },
  {
    vehicleId: 'SW-TRK-003',
    name: 'Cairo -> Suez',
    from: 'Cairo',
    to: 'Suez',
    color: '#F59E0B',
    points: [[29.9792, 31.1342], [29.86, 31.52], [29.78, 31.94], [29.83, 32.25], [29.9668, 32.5498]],
  },
  {
    vehicleId: 'SW-TRK-005',
    name: 'Cairo -> Hurghada',
    from: 'Cairo',
    to: 'Hurghada',
    color: '#EF4444',
    points: [[29.9792, 31.1342], [29.73, 31.38], [29.42, 31.72], [28.96, 32.04], [28.48, 32.45], [27.98, 33.05], [27.2579, 33.8116]],
  },
];

export const weatherDetails = [
  { time: '9 AM', label: 'Sunny', temp: '29°C', detail: 'Clear', icon: Sun },
  { time: '12 PM', label: 'Cloudy', temp: '31°C', detail: 'Cloudy', icon: Cloud },
  { time: '2 PM', label: 'Storm', temp: '32°C', detail: 'Storms', icon: CloudLightning },
  { time: '4 PM', label: 'Rain', temp: '30°C', detail: 'Rain', icon: CloudRain },
];

export const weatherSummary = [
  { time: '8 AM', temp: '28°C', detail: 'Clear', icon: Sun },
  { time: '12 PM', temp: '31°C', detail: 'Cloudy', icon: Cloud },
  { time: '4 PM', temp: '27°C', detail: 'Rain', icon: CloudRain },
  { time: '8 PM', temp: '24°C', detail: 'Clear', icon: Moon },
];

export const riskAnalytics = [
  { name: 'LOW RISK', value: 75, routes: '36 routes', color: '#22C55E' },
  { name: 'MEDIUM RISK', value: 15, routes: '7 routes', color: '#F59E0B' },
  { name: 'HIGH RISK', value: 10, routes: '5 routes', color: '#EF4444' },
];

export const insights = [
  '75% of high-risk routes occur 12PM-5PM',
  'Trucks show 1.8x higher risk than cars',
  'Cairo-Hurghada corridor most affected',
];

export const departures = [
  {
    time: '7:00 AM',
    badge: 'RECOMMENDED',
    icon: Sun,
    riskScore: '2.1',
    risk: 'LOW',
    duration: '4h 20m',
    speed: '110 km/h',
    tone: 'green',
  },
  {
    time: '2:00 PM',
    icon: CloudLightning,
    riskScore: '7.8',
    risk: 'HIGH',
    duration: '5h 10m',
    speed: '70 km/h',
    tone: 'red',
  },
];

export const sparklineData = [
  { v: 8 }, { v: 8 }, { v: 7 }, { v: 7.2 }, { v: 6.4 }, { v: 6.9 },
  { v: 5.7 }, { v: 6 }, { v: 4.9 }, { v: 5.2 }, { v: 4.2 }, { v: 3.4 },
  { v: 3.7 }, { v: 2.8 }, { v: 2.1 },
];

export const decisionIcons = {
  Approved: CheckCircle,
  Review: AlertTriangle,
  Blocked: AlertTriangle,
};

export const planFields = ['Start Location', 'Destination', 'Departure Time', 'Vehicle'];
