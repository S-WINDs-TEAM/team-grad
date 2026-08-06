<<<<<<< HEAD
import { Fragment, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Toaster, toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  AlertTriangle, BarChart3, Bell, CheckCircle2, ChevronDown, ChevronRight, Clock3,
  Cloud, CloudLightning, CloudRain, Gauge, Info, Layers3, LayoutDashboard, List,
  Map, Maximize, Moon, MoreVertical, Pencil, Plus, Minus, RefreshCw, Route as RouteIcon,
  Settings, ShieldCheck, Sun, Timer, Truck, XCircle, LogOut, User, FileText
} from 'lucide-react';
import './App.css';

const points = { Cairo:[29.9792,31.1342], Alexandria:[31.2001,29.9187], Suez:[29.9668,32.5498], Hurghada:[27.2579,33.8116], Asyut:[27.1809,31.1837], Damanhur:[31.0341,30.4682], 'Port Said':[31.2653,32.3019] };
const vehicles = [
  {id:'SW-TRK-001', dest:'Alexandria', risk:'LOW', departure:'07:00 AM', eta:'11:20 AM', temp:'28°C', weather:'sun', decision:'Approved', duration:'4h 20m', distance:'220 km'},
  {id:'SW-TRK-002', dest:'Port Said', risk:'LOW', departure:'07:30 AM', eta:'12:10 PM', temp:'29°C', weather:'cloud', decision:'Approved', duration:'4h 40m', distance:'220 km'},
  {id:'SW-TRK-003', dest:'Suez', risk:'MEDIUM', departure:'08:00 AM', eta:'12:45 PM', temp:'30°C', weather:'cloud', decision:'Review', duration:'4h 45m', distance:'155 km'},
  {id:'SW-TRK-004', dest:'Damanhur', risk:'MEDIUM', departure:'08:30 AM', eta:'01:30 PM', temp:'31°C', weather:'storm', decision:'Review', duration:'5h', distance:'165 km'},
  {id:'SW-TRK-005', dest:'Hurghada', risk:'HIGH', departure:'09:00 AM', eta:'03:50 PM', temp:'32°C', weather:'storm', decision:'Blocked', duration:'4h 50m', distance:'450 km'},
  {id:'SW-TRK-006', dest:'Asyut', risk:'HIGH', departure:'09:30 AM', eta:'04:40 PM', temp:'33°C', weather:'sun', decision:'Blocked', duration:'5h 10m', distance:'385 km'},
];
const navItems = [
  ['/dashboard','Dashboard',LayoutDashboard], ['/fleet','Fleet Overview',Truck], ['/trips','Trip History',Clock3], ['/routes','Route Comparison',RouteIcon], ['/vehicles','Vehicle List',List], ['/analytics','Analytics',BarChart3], ['/settings','Settings',Settings]
];
const routeCoords = {
  Alexandria: [[29.9792,31.1342],[30.15,30.95],[30.45,30.7],[30.7,30.35],[31.2001,29.9187]],
  Suez: [[29.9792,31.1342],[30.04,31.42],[30.02,31.75],[29.9668,32.5498]],
  Hurghada: [[29.9792,31.1342],[29.3,31.42],[28.55,31.8],[27.9,32.65],[27.2579,33.8116]],
  Asyut: [[29.9792,31.1342],[29.25,31.15],[28.5,31.16],[27.1809,31.1837]],
  Damanhur: [[29.9792,31.1342],[30.35,30.95],[30.7,30.66],[31.0341,30.4682]],
  'Port Said': [[29.9792,31.1342],[30.35,31.4],[30.72,31.78],[31.2653,32.3019]],
};
const riskColor = {LOW:'#20b55b',MEDIUM:'#f3a40c',HIGH:'#ef4444'};
function Tip({text, children}) { return <Tooltip.Root><Tooltip.Trigger asChild>{children}</Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="tooltip" sideOffset={7}>{text}<Tooltip.Arrow className="tooltip-arrow" /></Tooltip.Content></Tooltip.Portal></Tooltip.Root> }
function IconButton({label,children,onClick}) { return <Tip text={label}><button aria-label={label} onClick={onClick} className="icon-btn">{children}</button></Tip> }
function WeatherIcon({type, size=22}) { const C=type==='sun'?Sun:type==='storm'?CloudLightning:type==='rain'?CloudRain:Cloud; return <C size={size} /> }
function Brand(){return <div className="brand"><div className="swirl"><i/><i/><i/><i/><i/></div><div><strong>S-WINDS</strong><span>Fleet Intelligence</span></div></div>}
function Sidebar(){ const loc=useLocation(), nav=useNavigate(); return <aside className="sidebar"><Brand/><nav>{navItems.map(([path,label,Icon])=><button key={path} onClick={()=>nav(path)} className={'nav-item '+(loc.pathname===path?'active':'')}><Icon/><span>{label}</span></button>)}</nav><div className="side-status"><b></b>All Systems Operational <ChevronRight size={19}/></div></aside> }
function Header(){return <header className="header"><div className="crumb">Dashboard <ChevronRight size={18}/> <span>Fleet Dispatch</span></div><div className="header-actions"><DropdownMenu.Root><DropdownMenu.Trigger asChild><button className="icon-btn notify" aria-label="Notifications"><Bell/><em>3</em></button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className="menu-pop" align="end"><b>Notifications</b><span>3 vehicles require review</span><span>4 high-risk routes</span><span>Weather impact between 12PM–5PM</span></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root><IconButton label="Settings"><Settings/></IconButton><DropdownMenu.Root><DropdownMenu.Trigger className="admin"><span>AD</span>Admin<ChevronDown size={18}/></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className="menu-pop" align="end"><DropdownMenu.Item><User size={15}/>Profile</DropdownMenu.Item><DropdownMenu.Item><Settings size={15}/>Account Settings</DropdownMenu.Item><DropdownMenu.Item><LogOut size={15}/>Logout</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root></div></header>}
function KpiCard({icon:Icon,title,children,accent='cyan'}){return <section className={'kpi '+accent}><Tip text={title}><div className="kpi-icon"><Icon/></div></Tip><div><p>{title}</p>{children}</div></section>}
function Kpis(){const trend=[{v:4.1},{v:3.9},{v:3.8},{v:3.5},{v:3.6},{v:3.3},{v:3.2}];return <div className="kpis"><KpiCard icon={Truck} title="VEHICLES TO DEPLOY"><h2>24</h2><small className="yellow"><Info size={18}/>3 require review</small></KpiCard><KpiCard icon={ShieldCheck} title="SAFE TO SEND" accent="green"><div className="split-val"><h2>18</h2><strong>75%</strong></div><div className="kpi-foot">vs 22 yesterday <i className="progress"><b/></i></div></KpiCard><KpiCard icon={AlertTriangle} title="HIGH RISK" accent="red"><h2>4</h2><small>dispatch blocked</small></KpiCard><KpiCard icon={Gauge} title="AVG RISK SCORE" accent="orange"><div className="avg-risk-body"><div><h2>3.2<sup>/10</sup></h2><span>vs 3.8 yesterday</span></div><div className="spark" aria-label="Average risk score trend"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><Line type="monotone" dataKey="v" stroke="#f3a40c" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div></div></KpiCard><KpiCard icon={Clock3} title="NEXT DECISION"><h2>08:00 AM</h2><small className="yellow">42 min</small></KpiCard></div>}
function Decision({vehicle,onChange}){const colors={Approved:CheckCircle2,Review:Pencil,Blocked:XCircle},I=colors[vehicle.decision]; return <button onClick={(e)=>{e.stopPropagation();onChange(vehicle)}} className={'decision '+vehicle.decision.toLowerCase()}><I size={17}/>{vehicle.decision}<ChevronRight size={15}/></button>}
function RouteDetails({v,onCompare}){const slots=[['9 AM','sun','29°C','Clear'],['12 PM','cloud','31°C','Cloudy'],['2 PM','storm','32°C','Storms'],['4 PM','rain','30°C','Rain']]; return <div className="details"><div className="overview"><p>ROUTE OVERVIEW</p><div className="mini-route"><span>Cairo</span><i></i><span>{v.dest}</span></div></div><div className="weather-details"><p>WEATHER DETAILS</p><div>{slots.map(s=><article key={s[0]}><b>{s[0]}</b><WeatherIcon type={s[1]} size={35}/><strong>{s[2]}</strong><small>{s[3]}</small></article>)}</div></div><div className="stats"><p>EST. DURATION</p><b>{v.duration}</b><p>EST. DISTANCE</p><b>{v.distance}</b><button onClick={onCompare}>Compare Times</button></div></div>}
function FleetBoard({selected,setSelected}){const [reviewOpen,setReviewOpen]=useState(false); function changeDecision(v){toast(`${v.id} marked ${v.decision.toLowerCase()}`)} return <section className="panel fleet"><div className="panel-title"><h3>FLEET DISPATCH BOARD</h3><div><button className="outline amber" onClick={()=>setReviewOpen(true)}><AlertTriangle/>Review All (3)</button><button className="outline safe" onClick={()=>toast.success('18 safe routes approved')}><CheckCircle2/>Approve Safe (18)</button><DropdownMenu.Root><DropdownMenu.Trigger asChild><button className="more"><MoreVertical/></button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className="menu-pop"><DropdownMenu.Item>Export fleet data</DropdownMenu.Item><DropdownMenu.Item>Refresh list</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root></div></div><div className="table-wrap"><table className="fleet-table"><thead><tr><th>VEHICLE ID</th><th>ROUTE</th><th>RISK<small>Click to compare</small></th><th>DEPARTURE</th><th>ETA</th><th>WEATHER</th><th>DECISION</th></tr></thead><tbody>{vehicles.map(v=><Fragment key={v.id}><tr className={'fleet-row '+(selected.id===v.id?'selected':'')} onClick={()=>setSelected(selected.id===v.id?vehicles[0]:v)}><td className="vehicle"><b className={v.risk.toLowerCase()}></b>{v.id}</td><td>Cairo → {v.dest}</td><td><b className={'risk '+v.risk.toLowerCase()}>{v.risk}</b></td><td>{v.departure}</td><td>{v.eta}</td><td className={'weather '+v.weather}><WeatherIcon type={v.weather}/>{v.temp}</td><td><Decision vehicle={v} onChange={changeDecision}/></td></tr>{selected.id===v.id&&<tr className="detail-row"><td colSpan="7"><RouteDetails v={v} onCompare={()=>document.getElementById('comparison').scrollIntoView({behavior:'smooth'})}/></td></tr>}</Fragment>)}</tbody></table></div><Dialog.Root open={reviewOpen} onOpenChange={setReviewOpen}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="dialog"><Dialog.Title>Vehicles requiring review</Dialog.Title><Dialog.Description>Three fleet routes have elevated weather-related risk.</Dialog.Description><ul><li>SW-TRK-003 — Cairo → Suez</li><li>SW-TRK-004 — Cairo → Damanhur</li><li>SW-TRK-005 — Cairo → Hurghada</li></ul><Dialog.Close asChild><button className="primary">Close review</button></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root></section>}
function FitRoute({selected}){const map=useMap(); useEffect(()=>{map.fitBounds(routeCoords[selected.dest],{padding:[25,25],maxZoom:7});},[map,selected]);return null}
function MapZoomControls(){const map=useMap();return <div className="map-controls"><button aria-label="Zoom in" onClick={()=>map.zoomIn()}><Plus/></button><button aria-label="Zoom out" onClick={()=>map.zoomOut()}><Minus/></button></div>}
function RouteMap({selected,setSelected}){const routes=['Alexandria','Suez','Hurghada'];return <section className="panel map-panel"><div className="panel-title map-title"><h3>ROUTE MAP <span>Click route to view details</span></h3><div><IconButton label="Map information"><Info size={19}/></IconButton><IconButton label="Map layers"><Layers3 size={21}/></IconButton><IconButton label="Fullscreen map"><Maximize size={19}/></IconButton></div></div><MapContainer center={[29.3,31.7]} zoom={6} scrollWheelZoom className="leaflet-map" zoomControl={false}><LayersControl position="bottomright"><LayersControl.BaseLayer checked name="Dark map"><TileLayer attribution='&copy; OpenStreetMap contributors &copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"/></LayersControl.BaseLayer><LayersControl.BaseLayer name="OpenStreetMap"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/></LayersControl.BaseLayer></LayersControl>{routes.map(dest=>{const v=vehicles.find(x=>x.dest===dest), active=selected.dest===dest;return <Polyline key={dest} positions={routeCoords[dest]} pathOptions={{color:riskColor[v.risk],weight:active?7:5,opacity:active?1:.85}} eventHandlers={{click:()=>setSelected(v)}}/>})}{['Cairo','Alexandria','Suez','Hurghada'].map(name=><Marker key={name} position={points[name]} icon={L.divIcon({className:'map-marker',html:`<span></span>`,iconSize:[17,17],iconAnchor:[8,8]})}><Popup>{name}</Popup></Marker>)}<FitRoute selected={selected}/><MapZoomControls/></MapContainer><div className="map-legend"><span className="l-green"></span>Cairo → Alexandria <span className="l-orange"></span>Cairo → Suez <span className="l-red"></span>Cairo → Hurghada</div></section>}
function WeatherImpact(){const weather=[['8 AM','sun','28°C','Clear'],['12 PM','cloud','31°C','Cloudy'],['4 PM','rain','27°C','Rain'],['8 PM','moon','24°C','Clear']];return <section className="panel weather-summary"><div className="panel-title"><h3>WEATHER IMPACT SUMMARY</h3><ChevronDown/></div><div className="weather-timeline">{weather.map(x=><div key={x[0]}><b>{x[0]}</b>{x[1]==='moon'?<Moon/>:<WeatherIcon type={x[1]} size={35}/>}<strong>{x[2]}</strong><small>{x[3]}</small></div>)}</div><button className="weather-alert"><AlertTriangle/><span><b>3 vehicles</b> affected between 12PM–5PM<small>Affected Routes: <em>Cairo → Hurghada</em><em>Cairo → Asyut</em><em>Cairo → Damanhur</em></small></span><ChevronRight/></button></section>}
function RiskAnalytics(){const data=[{name:'Low',value:75,color:'#2fb35d'},{name:'Medium',value:15,color:'#f5a30b'},{name:'High',value:10,color:'#ef4444'}];return <section className="panel risk-analytics"><div className="panel-title"><h3>RISK ANALYTICS</h3><ChevronDown/></div><div className="risk-content"><div className="donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" innerRadius={48} outerRadius={70} stroke="#061725" strokeWidth={3}>{data.map(x=><Cell key={x.name} fill={x.color}/>)}</Pie></PieChart></ResponsiveContainer><div><b>75%</b><span>Low Risk</span></div></div><div className="risk-labels">{data.map(d=><p key={d.name}><i style={{background:d.color}}></i>{d.name.toUpperCase()}<b>{d.value}% <small>({d.value===75?36:d.value===15?7:5} routes)</small></b></p>)}</div></div><div className="insights"><p>TOP INSIGHTS</p><span>75% of high-risk routes occur 12PM–5PM</span><span>Trucks show 1.8x higher risk than cars</span><span>Cairo–Hurghada corridor most affected</span></div></section>}
function Comparison(){const [departure,setDeparture]=useState(''); return <section className="panel comparison" id="comparison"><div className="panel-title"><h3>COMPARE DEPARTURE TIMES <Info size={18}/></h3></div><div className="time-line"><i></i>{['6 AM','8 AM','10 AM','12 PM','2 PM','4 PM','6 PM','8 PM','10 PM'].map(t=><span key={t}>{t}</span>)}<b className="point early">7:00 AM</b><b className="point late">2:00 PM</b></div><div className="time-cards"><article className="departure-good"><h3>7:00 AM <em>RECOMMENDED</em></h3><div><Sun/><span>Risk Score<strong>2.1 <sup>/10</sup></strong></span><b className="low-chip">LOW</b></div><p><span>Duration<strong>4h 20m</strong></span><span>Avg Speed<strong>110 km/h</strong></span></p><button onClick={()=>{setDeparture('07:00 AM');toast.success('Departure time changed to 7:00 AM')}}>{departure?'Selected departure':'Set as departure'}</button></article><article className="departure-bad"><h3>2:00 PM</h3><div><CloudLightning/><span>Risk Score<strong>7.8 <sup>/10</sup></strong></span><b className="high-chip">HIGH</b></div><p><span>Duration<strong>5h 10m</strong></span><span>Avg Speed<strong>70 km/h</strong></span></p><button onClick={()=>toast.info('Afternoon weather risk details opened')}>See details →</button></article></div></section>}
function QuickActions(){const [open,setOpen]=useState(false); const nav=useNavigate();return <section className="panel quick"><div className="panel-title"><h3>QUICK ACTIONS</h3><ChevronDown/></div><button className="plan" onClick={()=>setOpen(true)}><Map/>Plan New Route<ChevronRight/></button><div><button onClick={()=>nav('/trips')}><Clock3/>View Trip History</button><button onClick={()=>toast.success('Report generated successfully')}><BarChart3/>Generate Report</button></div><Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="dialog plan-dialog"><Dialog.Title>Plan New Route</Dialog.Title><Dialog.Description>Create a fleet route with real-time risk checks.</Dialog.Description><label>Start Location<input defaultValue="Cairo"/></label><label>Destination<input placeholder="Select destination"/></label><label>Departure Time<input type="time" defaultValue="07:00"/></label><label>Vehicle<select defaultValue=""><option value="" disabled>Select vehicle</option><option>SW-TRK-007</option></select></label><div className="preview"><b>Risk Preview</b><span>Low at 7:00 AM · Clear weather</span></div><div className="dialog-actions"><Dialog.Close asChild><button className="outline">Cancel</button></Dialog.Close><button className="primary" onClick={()=>{setOpen(false);toast.success('Route planned successfully')}}>Plan Route</button></div></Dialog.Content></Dialog.Portal></Dialog.Root></section>}
function Bottom(){return <footer><span><i></i>All Systems Operational</span><span>16 routes completed today <b/> Avg safety score 7.2/10</span><span><RefreshCw size={19}/>Last updated: 07:18 AM</span></footer>}
function Dashboard(){const [selected,setSelected]=useState(vehicles[4]);return <><Sidebar/><main className="min-h-screen"><Header/><Kpis/><div className="dashboard-grid"><FleetBoard selected={selected} setSelected={setSelected}/><div className="mid-col"><RouteMap selected={selected} setSelected={setSelected}/><Comparison/></div><div className="right-col"><WeatherImpact/><RiskAnalytics/><QuickActions/></div></div><Bottom/></main></>}
function Placeholder(){return <><Sidebar/><main><Header/><div className="placeholder panel"><Truck size={42}/><h2>Fleet Intelligence</h2><p>This section is ready for your fleet data.</p></div></main></>}
export default function App(){return <Tooltip.Provider delayDuration={250}><Toaster theme="dark" position="top-right"/><Routes><Route path="/dashboard" element={<Dashboard/>}/><Route path="/" element={<Navigate to="/dashboard" replace/>}/>{navItems.slice(1).map(([p])=><Route key={p} path={p} element={<Placeholder/>}/>)}<Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes></Tooltip.Provider>}
=======
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import PlanTripPage from './pages/PlanTripPage';
import LandingPage from './pages/LandingPage';
// import RouteResultsPage from './pages/RouteResultsPage';
import ProtectedRoute from './components/ProtectedRoute';
import TripHistoryPage from './pages/tripHistoryPage';
import {Toaster} from 'react-hot-toast';

function App() {
  return (
  <>
  <Toaster position="top-right" toastOptions={{duration: 4000}}/>
    <Routes>
      //login
      <Route path="/login" element={<LoginPage />} />
      //register
      <Route path="/register" element={<Register />} />
      <Route path="/landing" element={<LandingPage />} />
      //home
      <Route 
      path='/home'
      element = {
        <ProtectedRoute>
          <HomePage/>
        </ProtectedRoute>}/>
        /plan and results
      <Route
        path="/plan"
        element={
          <ProtectedRoute>
            <PlanTripPage />
          </ProtectedRoute>}/>
          //trip history
      {/* <Route path='/results' 
      element={<ProtectedRoute>
         <RouteResultsPage/> 
         </ProtectedRoute>}/> */}
         <Route
  path="/history"
  element={
    <ProtectedRoute>
      <TripHistoryPage />
    </ProtectedRoute>
  }
/>
//main
      <Route path="*" element={<Navigate to="/landing" />} />
    </Routes>
        </>
  );
}

export default App;
>>>>>>> 7cddbdd (adding register & trip history pages)
