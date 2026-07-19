import { ChevronDown, ShieldCheck } from 'lucide-react'

export default function Navbar() {
  return <header className="topbar">
    <div className="logo">S-<em>WIND</em>s</div>
    <nav className="nav"><a href="#features">Features</a><a href="#solutions">Solutions <ChevronDown size={15} style={{display:'inline',verticalAlign:'middle',marginLeft:9}} /></a><a href="#business">For Businesses</a><a href="#technology">Technology</a><a href="#about">About</a></nav>
    <div className="weather-badge"><span className="shield"><ShieldCheck size={19}/></span>Smart Weather Intelligence</div>
    <div className="header-actions"><button className="header-button">Sign In</button><button className="header-button primary">Get Started</button></div>
  </header>
}
