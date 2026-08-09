import { Layers, Maximize, Minus, Plus } from 'lucide-react';
import L from 'leaflet';
import { memo, useCallback, useMemo } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { coordinates, mapRoutes } from '../../data/dashboard';
import { Tooltip } from '../ui/Tooltip';

function makeIcon(color) {
  return L.divIcon({
    className: 'swinds-marker',
    html: `<span style="--marker-color:${color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function MapButtons() {
  const map = useMap();
  return (
    <div className="absolute bottom-8 right-4 z-[500] overflow-hidden rounded-[4px] border border-[#17384b] bg-[#061725]/95">
      <Tooltip label="Zoom in"><button className="grid h-10 w-10 place-items-center border-b border-[#17384b] text-white" onClick={() => map.zoomIn()} aria-label="Zoom in"><Plus /></button></Tooltip>
      <Tooltip label="Zoom out"><button className="grid h-10 w-10 place-items-center border-b border-[#17384b] text-white" onClick={() => map.zoomOut()} aria-label="Zoom out"><Minus /></button></Tooltip>
      <Tooltip label="Layers"><button className="grid h-10 w-10 place-items-center text-white" aria-label="Layers"><Layers /></button></Tooltip>
    </div>
  );
}

function RouteMap({ selectedRoute, selectRoute }) {
  const center = useMemo(() => [29.35, 31.75], []);
  const cairoIcon = useMemo(() => makeIcon('#dbeafe'), []);
  const routeIcons = useMemo(() => ({
    Alexandria: makeIcon('#22C55E'),
    Suez: makeIcon('#F59E0B'),
    Hurghada: makeIcon('#EF4444'),
  }), []);

  const handleRouteClick = useCallback((route) => {
    selectRoute(route.vehicleId);
  }, [selectRoute]);

  return (
    <section className="rounded-[7px] border border-[#17384b] bg-[#061725]/82">
      <div className="flex h-[48px] items-center gap-4 border-b border-[#123044] px-4">
        <h2 className="text-lg font-semibold">ROUTE MAP</h2>
        <span className="text-sm text-[#8feaf2]">Click route to view details</span>
        <div className="ml-auto flex items-center gap-4 text-[#c8d5dc]">
          <Tooltip label="Map info"><span className="grid h-7 w-7 place-items-center rounded-full border border-[#647786] text-xs">i</span></Tooltip>
          <Tooltip label="Layers"><Layers className="h-5 w-5" /></Tooltip>
          <Tooltip label="Fullscreen"><Maximize className="h-5 w-5" /></Tooltip>
        </div>
      </div>
      <div className="relative h-[346px] overflow-hidden rounded-b-[7px]">
        <MapContainer center={center} zoom={7} zoomControl={false} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <Marker position={coordinates.Cairo} icon={cairoIcon}>
            <Popup>Cairo dispatch origin</Popup>
          </Marker>
          {mapRoutes.map((route) => {
            const selected = selectedRoute?.vehicleId === route.vehicleId;
            return (
              <Polyline
                key={route.name}
                positions={route.points}
                pathOptions={{ color: route.color, weight: selected ? 8 : 5, opacity: selected ? 1 : 0.78 }}
                eventHandlers={{ click: () => handleRouteClick(route) }}
              >
                <Popup>{route.name}</Popup>
              </Polyline>
            );
          })}
          {mapRoutes.map((route) => (
            <Marker key={`${route.to}-marker`} position={coordinates[route.to]} icon={routeIcons[route.to]}>
              <Popup>{route.to}</Popup>
            </Marker>
          ))}
          <MapButtons />
        </MapContainer>
        <div className="pointer-events-none absolute bottom-4 left-4 z-[500] rounded-[5px] border border-[#17384b] bg-[#061725]/90 p-3 text-xs text-white">
          {mapRoutes.map((route) => (
            <div key={route.name} className="mb-2 flex items-center gap-2 last:mb-0"><span className="h-1 w-7 rounded-full" style={{ background: route.color }} />{route.name}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(RouteMap);
