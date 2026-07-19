import { motion } from 'framer-motion'
import AlertWidget from '../components/AlertWidget'
import Background from '../components/Background'
import DriverCard from '../components/DriverCard'
import FeatureBar from '../components/FeatureBar'
import FleetCard from '../components/FleetCard'
import Hero from '../components/Hero'
import Navbar from '../components/Navbar'
import WeatherWidget from '../components/WeatherWidget'

export default function Home(){return <main className="landing"><Background/><Navbar/><Hero/><motion.section className="content" initial={{opacity:0,y:9}} animate={{opacity:1,y:0}} transition={{duration:.55}}><WeatherWidget/><AlertWidget/><div className="cards"><DriverCard/><FleetCard/></div></motion.section><FeatureBar/></main>}
