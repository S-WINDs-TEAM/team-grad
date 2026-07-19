import { CloudRain, Globe2, MapPinned, ShieldCheck } from 'lucide-react'
const entries = [[CloudRain,<>Real-time<br/>Weather Intelligence</>],[MapPinned,<>AI-Powered<br/>Smart Routing</>],[ShieldCheck,<>Safety First,<br/>Always</>],[Globe2,<>Built for Today.<br/>Ready for Tomorrow.</>]]
export default function FeatureBar(){return <section className="feature-bar" id="features">{entries.map(([Icon,label],i)=><div className="bar-item" key={i}><Icon/>{label}</div>)}</section>}
