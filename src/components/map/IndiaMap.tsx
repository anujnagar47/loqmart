"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { Tooltip } from 'react-tooltip';
import * as topojson from 'topojson-client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, MapPin, Users, Package, Search, X, Globe, ArrowRight, Star, TrendingUp } from 'lucide-react';
import styles from './IndiaMap.module.css';

const INDIA_TOPO_JSON = "/maps/india-topo.json";

const STATE_CODE_MAP: Record<string, string> = {
  "Andaman and Nicobar Islands": "AN",
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  "Assam": "AS",
  "Bihar": "BR",
  "Chandigarh": "CH",
  "Chhattisgarh": "CT",
  "Dadra and Nagar Haveli": "DN",
  "Daman and Diu": "DD",
  "Delhi": "DL",
  "Goa": "GA",
  "Gujarat": "GJ",
  "Haryana": "HR",
  "Himachal Pradesh": "HP",
  "Jammu and Kashmir": "JK",
  "Jharkhand": "JH",
  "Karnataka": "KA",
  "Kerala": "KL",
  "Ladakh": "LA",
  "Lakshadweep": "LD",
  "Madhya Pradesh": "MP",
  "Maharashtra": "MH",
  "Manipur": "MN",
  "Meghalaya": "ML",
  "Mizoram": "MZ",
  "Nagaland": "NL",
  "Odisha": "OR",
  "Puducherry": "PY",
  "Punjab": "PB",
  "Rajasthan": "RJ",
  "Sikkim": "SK",
  "Tamil Nadu": "TN",
  "Telangana": "TG",
  "Tripura": "TR",
  "Uttar Pradesh": "UP",
  "Uttarakhand": "UA",
  "West Bengal": "WB",
};

interface StateStats {
  stateName: string;
  stateCode: string;
  artisanCount: number;
  productCount: number;
}

interface StateInfo {
  stateName: string;
  artisans: string;
  products: string;
  districts: string;
  description: string;
  crafts: string[];
  featured?: boolean;
  trend?: string;
}

const STATIC_STATE_DATA: Record<string, StateInfo> = {
  "Andhra Pradesh": { stateName: "Andhra Pradesh", artisans: "85K+", products: "32K+", districts: "26", description: "Rich heritage of Kalamkari, Pochampally ikat, and Bidriware.", crafts: ["Kalamkari", "Pochampally Ikat", "Bidriware"], trend: "+19%", featured: false },
  "Arunachal Pradesh": { stateName: "Arunachal Pradesh", artisans: "22K+", products: "8K+", districts: "25", description: "Diverse tribal crafts, bamboo, and woven textiles.", crafts: ["Tribal Weaving", "Bamboo Crafts", "Wood Carving"], featured: false },
  "Assam": { stateName: "Assam", artisans: "48K+", products: "18K+", districts: "33", description: "Known for Muga silk, Assam tea, and bamboo crafts.", crafts: ["Muga Silk", "Assam Tea", "Bamboo Crafts"], trend: "+19%", featured: false },
  "Bihar": { stateName: "Bihar", artisans: "75K+", products: "25K+", districts: "38", description: "Famous for Madhubani paintings and Bhagalpur silk.", crafts: ["Madhubani Paintings", "Bhagalpur Silk", "Paper Machie"], trend: "+29%", featured: false },
  "Chhattisgarh": { stateName: "Chhattisgarh", artisans: "42K+", products: "16K+", districts: "33", description: "Home to tribal art, bell metal craft, and Dokra art.", crafts: ["Dokra Art", "Bell Metal", "Tribal Art"], trend: "+28%", featured: false },
  "Delhi": { stateName: "Delhi", artisans: "120K+", products: "45K+", districts: "11", description: "A melting pot of crafts from across India with modern artisans.", crafts: ["Contemporary Crafts", "Jewelry", "Textiles"], featured: false, trend: "+35%" },
  "Goa": { stateName: "Goa", artisans: "12K+", products: "4.5K+", districts: "2", description: "Portuguese-influenced crafts and Feni-inspired art.", crafts: ["Tile Art", "Feni Artifacts", "Crochet Lace"], featured: false },
  "Gujarat": { stateName: "Gujarat", artisans: "120K+", products: "38K+", districts: "33", description: "Rich heritage of Bandhani, Patola, and Block printing traditions.", crafts: ["Bandhani", "Patola Sarees", "Block Printing"], trend: "+18%", featured: false },
  "Haryana": { stateName: "Haryana", artisans: "38K+", products: "15K+", districts: "22", description: "Known for pottery, Durrie weaving, and leather crafts.", crafts: ["Pottery", "Durrie Weaving", "Leather Craft"], trend: "+11%", featured: false },
  "Himachal Pradesh": { stateName: "Himachal Pradesh", artisans: "28K+", products: "11K+", districts: "12", description: "Known for woolen crafts, Chamba rumal, and wooden toys.", crafts: ["Woolen Crafts", "Chamba Rumal", "Wooden Toys"], trend: "+16%", featured: false },
  "Jammu and Kashmir": { stateName: "Jammu and Kashmir", artisans: "35K+", products: "14K+", districts: "20", description: "Pashmina shawls, saffron, and intricate woodwork.", crafts: ["Pashmina Shawls", "Saffron", "Walnut Wood Carving"], trend: "+42%", featured: true },
  "Jharkhand": { stateName: "Jharkhand", artisans: "35K+", products: "12K+", districts: "24", description: "Home to tribal crafts, Pattachitra, and bamboo work.", crafts: ["Tribal Crafts", "Pattachitra", "Bamboo Work"], trend: "+24%", featured: false },
  "Karnataka": { stateName: "Karnataka", artisans: "95K+", products: "28K+", districts: "30", description: "Home to exquisite silk sarees and sandalwood carvings.", crafts: ["Bangalore Silk", "Sandalwood Carving", "Channapatna Toys"], trend: "+15%", featured: false },
  "Kerala": { stateName: "Kerala", artisans: "65K+", products: "22K+", districts: "14", description: "Known for Kasavu sarees, coir products, and Kathakali masks.", crafts: ["Kasavu Sarees", "Coir Products", "Kathakali Masks"], trend: "+12%", featured: false },
  "Madhya Pradesh": { stateName: "Madhya Pradesh", artisans: "92K+", products: "30K+", districts: "52", description: "Famous for Bagh prints, Gond art, and handwoven fabrics.", crafts: ["Bagh Prints", "Gond Art", "Handwoven Fabrics"], trend: "+22%", featured: false },
  "Maharashtra": { stateName: "Maharashtra", artisans: "180K+", products: "52K+", districts: "36", description: "From Paithani sarees to Warli paintings, Maharashtra has it all.", crafts: ["Paithani Sarees", "Warli Paintings", "Bidriware"], trend: "+31%", featured: false },
  "Manipur": { stateName: "Manipur", artisans: "18K+", products: "6K+", districts: "16", description: "Rich weaving traditions and bamboo crafts.", crafts: ["Phanek Weaving", "Bamboo Crafts", "Handloom"], featured: false },
  "Meghalaya": { stateName: "Meghalaya", artisans: "22K+", products: "7K+", districts: "11", description: "Bamboo and cane crafts with tribal artistry.", crafts: ["Bamboo Crafts", "Cane Work", "Tribal Weaving"], featured: false },
  "Odisha": { stateName: "Odisha", artisans: "68K+", products: "24K+", districts: "30", description: "Known for Pattachitra, silver filigree, and appliqué work.", crafts: ["Pattachitra", "Silver Filigree", "Appliqué Work"], trend: "+17%", featured: false },
  "Punjab": { stateName: "Punjab", artisans: "45K+", products: "18K+", districts: "22", description: "Famous for Phulkari, jutti, and wood carving traditions.", crafts: ["Phulkari", "Punjabi Jutti", "Wood Carving"], trend: "+14%", featured: false },
  "Rajasthan": { stateName: "Rajasthan", artisans: "150K+", products: "45K+", districts: "33", description: "The land of kings, famous for blue pottery, block prints, and handwoven textiles.", crafts: ["Blue Pottery", "Block Printing", "Handwoven Textiles"], trend: "+23%", featured: true },
  "Tamil Nadu": { stateName: "Tamil Nadu", artisans: "110K+", products: "35K+", districts: "38", description: "Famous for Kanchipuram silk, Temple jewelry, and bronze sculptures.", crafts: ["Kanchipuram Silk", "Temple Jewelry", "Bronze Sculptures"], trend: "+27%", featured: true },
  "Telangana": { stateName: "Telangana", artisans: "70K+", products: "25K+", districts: "33", description: "Historic Nizam crafts, Kalamkari, and Pochampally ikat.", crafts: ["Kalamkari", "Pochampally Ikat", "Bidriware"], trend: "+21%", featured: false },
  "Uttar Pradesh": { stateName: "Uttar Pradesh", artisans: "200K+", products: "65K+", districts: "75", description: "Varanasi silk, Lucknowi chikankari, and brassware excellence.", crafts: ["Banarasi Silk", "Chikankari", "Brassware"], trend: "+35%", featured: true },
  "Uttarakhand": { stateName: "Uttarakhand", artisans: "32K+", products: "12K+", districts: "13", description: "Famous for Aipan art, wooden craft, and Ayurvastra.", crafts: ["Aipan Art", "Wooden Craft", "Ayurvastra"], trend: "+13%", featured: false },
  "West Bengal": { stateName: "West Bengal", artisans: "98K+", products: "30K+", districts: "23", description: "Home to Baluchari sarees, Dhokra art, and terracotta crafts.", crafts: ["Baluchari Sarees", "Dhokra Art", "Terracotta"], trend: "+21%", featured: false },
};

const DEFAULT_STATES = ["Rajasthan", "Uttar Pradesh", "Karnataka", "Maharashtra", "Tamil Nadu", "West Bengal", "Gujarat", "Kerala", "Assam", "Odisha"];

// Deterministic pseudo-random generator (seeded by index) so particle
// positions/timings match between server and client render and avoid
// a hydration mismatch. Math.random() would produce different values
// on the server vs. the client for the same render.
function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

const PARTICLES = Array.from({ length: 15 }, (_, i) => ({
    left: 10 + seededRandom(i * 1.7 + 1) * 80,
    top: 60 + seededRandom(i * 3.1 + 2) * 30,
    xOffset: seededRandom(i * 5.3 + 3) * 30 - 15,
    duration: 4 + seededRandom(i * 7.9 + 4) * 2,
    delay: seededRandom(i * 11.3 + 5) * 4,
}));

function getStateCode(stateName: string): string {
  return STATE_CODE_MAP[stateName] || stateName.toUpperCase().slice(0, 2);
}

export function IndiaMap() {
    const router = useRouter();
    const [geoData, setGeoData] = useState<any>(null);
    const [hoveredState, setHoveredState] = useState<string | null>(null);
    const [selectedState, setSelectedState] = useState<string>("");
    const [allStates, setAllStates] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [stateStats, setStateStats] = useState<StateStats[]>([]);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        fetch(INDIA_TOPO_JSON)
            .then(response => response.json())
            .then(topology => {
                if (topology.objects && topology.objects.states) {
                    const statesGeo = topojson.feature(topology, topology.objects.states) as any;
                    setGeoData(statesGeo);
                    const names = statesGeo.features.map((f: any) => f.properties.st_nm).sort();
                    setAllStates(names);
                } else {
                    console.error("Could not find 'states' object in TopoJSON.");
                }
            })
            .catch(err => console.error("Error loading map data:", err));
    }, []);

    useEffect(() => {
        async function fetchStateStats() {
            try {
                const response = await fetch('/api/states/stats');
                if (response.ok) {
                    const data = await response.json();
                    setStateStats(data.states || []);
                }
            } catch (err) {
                console.error("Error fetching state stats:", err);
            } finally {
                setIsLoadingStats(false);
            }
        }
        fetchStateStats();
    }, []);

    const handleStateClick = (stateName: string) => {
        if (stateName) {
            const slug = stateName.toLowerCase().replace(/\s+/g, '-');
            router.push(`/state/${slug}`);
        }
    };

    const handleManualSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedState(val);
        if (val) handleStateClick(val);
    };

    const filteredStates = allStates.filter(st => 
        st.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const featuredStates = DEFAULT_STATES;

    const getStateData = (stateName: string) => {
        if (STATIC_STATE_DATA[stateName]) {
            return STATIC_STATE_DATA[stateName];
        }
        return {
            stateName,
            artisans: "0",
            products: "0",
            districts: "0",
            description: `Explore authentic ${stateName} crafts and handmade products from verified artisans.`,
            crafts: ["Traditional Crafts"],
            featured: false,
        };
    };

    const currentStateData = hoveredState ? getStateData(hoveredState) : null;

    return (
        <div className={styles.container}>
            <div className={styles.bgGradient} />
            <div className={styles.bgPattern} />
            
            <div className={styles.particles}>
                {PARTICLES.map((particle, i) => (
                    <motion.div
                        key={i}
                        className={styles.particle}
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0, 0.4, 0],
                            y: [-20, -80],
                            x: particle.xOffset
                        }}
                        transition={{
                            duration: particle.duration,
                            repeat: Infinity,
                            delay: particle.delay,
                        }}
                        style={{
                            left: `${particle.left}%`,
                            top: `${particle.top}%`,
                        }}
                    />
                ))}
            </div>

            <motion.div 
                className={styles.header}
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <motion.div 
                    className={styles.headerBadge}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Globe size={16} />
                    <span>All 36 States & UTs</span>
                </motion.div>
                <h1 className={styles.title}>
                    Shop India by
                    <span className={styles.titleGradient}> State</span>
                </h1>
                <p className={styles.subtitle}>
                    36 states. 1.2 million artisans. One destination - hover any state to discover its crafts, or search below.
                </p>
            </motion.div>

            {!geoData ? (
                <div className={styles.loadingContainer}>
                    <motion.div
                        className={styles.loadingSpinner}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" as const }}
                    >
                        <Globe size={40} />
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        Loading Interactive Map...
                    </motion.p>
                    <motion.div
                        className={styles.loadingProgress}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" as const }}
                    />
                </div>
            ) : (
            <motion.div
                className={styles.mapLayout}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
            >
                <div className={styles.mapColumn}>
                    <div className={styles.mapCard}>
                        <div className={styles.mapOverlay} />
                        <div className={styles.mapGlow} />
                        
                        <ComposableMap
                            projection="geoMercator"
                            projectionConfig={{
                                scale: 1100,
                                center: [78.9, 22.5]
                            }}
                            className={styles.composableMap}
                            viewBox="0 0 800 700"
                        >
                            <Geographies geography={geoData}>
                                {({ geographies }: { geographies: any[] }) =>
                                    geographies.map((geo: any) => {
                                        const stName = geo.properties.st_nm;
                                        const isHovered = hoveredState === stName;
                                        const isFeatured = featuredStates.includes(stName);

                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                onMouseEnter={() => setHoveredState(stName)}
                                                onMouseLeave={() => setHoveredState(null)}
                                                onClick={() => handleStateClick(stName)}
                                                className={styles.geography}
                                                data-tooltip-id="my-tooltip"
                                                data-tooltip-content={stName}
                                                style={{
                                                    default: {
                                                        fill: isFeatured ? "#FDEDB0" : "#EDE5D4",
                                                        outline: "none",
                                                        stroke: "rgba(114, 92, 0, 0.25)",
                                                        strokeWidth: 0.7,
                                                        transition: "all 0.25s ease"
                                                    },
                                                    hover: {
                                                        fill: "#fcd020",
                                                        outline: "none",
                                                        stroke: "#1a1c1c",
                                                        strokeWidth: 1.5,
                                                        filter: "drop-shadow(0 4px 14px rgba(252, 208, 32, 0.45))",
                                                        cursor: "pointer",
                                                    },
                                                    pressed: {
                                                        fill: "#edc204",
                                                        outline: "none",
                                                        stroke: "#1a1c1c",
                                                        strokeWidth: 1.5,
                                                    }
                                                }}
                                            />
                                        );
                                    })
                                }
                            </Geographies>
                        </ComposableMap>
                        
                        <Tooltip
                            id="my-tooltip"
                            style={{
                                backgroundColor: "rgba(26, 28, 28, 0.92)",
                                color: "#fff",
                                padding: "8px 14px",
                                borderRadius: "10px",
                                fontSize: "13px",
                                fontWeight: 700,
                                letterSpacing: "0.01em",
                                border: "none",
                                boxShadow: "0 8px 24px rgba(26, 28, 28, 0.2)"
                            }}
                        />

                        <motion.div 
                            className={styles.legend}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                                            <div className={styles.legendItem}>
                                <div className={styles.legendDot} style={{ background: "#fcd020", border: "1px solid rgba(114,92,0,0.2)" }} />
                                <span>Top Craft States</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={styles.legendDot} style={{ background: "#EDE5D4", border: "1px solid rgba(114,92,0,0.2)" }} />
                                <span>All States & UTs</span>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className={styles.infoColumn}>
                    <motion.div 
                        className={styles.searchContainer}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className={`${styles.searchWrapper} ${isSearchFocused ? styles.searchFocused : ''}`}>
                            <Search className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search states..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                className={styles.searchInput}
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery("")}
                                    className={styles.searchClear}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        
                        <AnimatePresence>
                            {searchQuery && filteredStates.length > 0 && (
                                <motion.div 
                                    className={styles.searchResults}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    {filteredStates.slice(0, 6).map((state) => (
                                        <button
                                            key={state}
                                            className={styles.searchResultItem}
                                            onClick={() => {
                                                setSearchQuery(state);
                                                handleStateClick(state);
                                            }}
                                        >
                                            <MapPin size={14} />
                                            <span>{state}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    <motion.div 
                        className={styles.featuredSection}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <h3 className={styles.sectionTitle}>
                            <Star className={styles.sectionIcon} />
                            Featured Regions
                        </h3>
                        <div className={styles.featuredGrid}>
                            {featuredStates.slice(0, 3).map((state, i) => (
                                <motion.button
                                    key={state}
                                    className={styles.featuredCard}
                                    onClick={() => {
                                        setSelectedState(state);
                                        handleStateClick(state);
                                    }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 + i * 0.1 }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className={styles.featuredBadge}>
                                        <Star size={12} />
                                    </div>
                                    <span className={styles.featuredName}>{state}</span>
                                    {getStateData(state).trend && (
                                        <span className={styles.featuredTrend}>
                                            <TrendingUp size={12} />
                                            {getStateData(state).trend}
                                        </span>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div 
                        className={styles.selectWrapper}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <label className={styles.selectLabel}>
                            <MapPin size={14} />
                            Select State Manually
                        </label>
                        <div className={styles.selectContainer}>
                            <select
                                className={styles.stateSelect}
                                value={selectedState}
                                onChange={handleManualSelect}
                            >
                                <option value="">-- Choose State --</option>
                                {allStates.map(st => (
                                    <option key={st} value={st}>{st}</option>
                                ))}
                            </select>
                            <div className={styles.selectArrow}>
                                <ChevronRight size={18} style={{ transform: 'rotate(90deg)' }} />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        className={styles.infoCard}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <AnimatePresence mode="wait">
                            {currentStateData ? (
                                <motion.div
                                    key={hoveredState}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className={styles.infoHeader}>
                                        <div className={styles.infoStateInfo}>
                                            <motion.h3 
                                                className={styles.infoStateName}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                key={hoveredState}
                                            >
                                                {hoveredState}
                                            </motion.h3>
                                        </div>
                                        {currentStateData.featured && (
                                            <div className={styles.featuredBadgeLarge}>
                                                <Star size={14} />
                                                Featured
                                            </div>
                                        )}
                                    </div>

                                    <motion.p 
                                        className={styles.infoDescription}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        {currentStateData.description}
                                    </motion.p>

                                    <div className={styles.statsGrid}>
                                        <motion.div 
                                            className={styles.statItem}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.15 }}
                                        >
                                            <div className={styles.statIconWrapper}>
                                                <Users size={20} />
                                            </div>
                                            <div className={styles.statContent}>
                                                <span className={styles.statValue}>
                                                    {currentStateData.artisans}
                                                </span>
                                                <span className={styles.statLabel}>Active Artisans</span>
                                            </div>
                                        </motion.div>

                                        <motion.div 
                                            className={styles.statItem}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <div className={styles.statIconWrapper}>
                                                <Package size={20} />
                                            </div>
                                            <div className={styles.statContent}>
                                                <span className={styles.statValue}>
                                                    {currentStateData.products}
                                                </span>
                                                <span className={styles.statLabel}>Products</span>
                                            </div>
                                        </motion.div>
                                    </div>

                                    <div className={styles.craftsSection}>
                                        <h4 className={styles.craftsTitle}>Specialties</h4>
                                        <div className={styles.craftsList}>
                                            {currentStateData.crafts.map((craft, i) => (
                                                <motion.span 
                                                    key={craft} 
                                                    className={styles.craftTag}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.3 + i * 0.05 }}
                                                >
                                                    {craft}
                                                </motion.span>
                                            ))}
                                        </div>
                                    </div>

                                    <motion.button
                                        className={styles.exploreBtn}
                                        onClick={() => handleStateClick(hoveredState!)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span>Explore {hoveredState}</span>
                                        <motion.span
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            <ArrowRight size={18} />
                                        </motion.span>
                                    </motion.button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    className={styles.emptyState}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Globe className={styles.emptyIcon} />
                                    <p>Hover over a state on the map or search to explore</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </motion.div>
            )}

            <motion.div
                className={styles.statsBar}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <div className={styles.statsBarItem}>
                    <span className={styles.statsBarValue}>36</span>
                    <span className={styles.statsBarLabel}>States & UTs</span>
                </div>
                <div className={styles.statsBarDivider} />
                <div className={styles.statsBarItem}>
                    <span className={styles.statsBarValue}>1.2M+</span>
                    <span className={styles.statsBarLabel}>Active Artisans</span>
                </div>
                <div className={styles.statsBarDivider} />
                <div className={styles.statsBarItem}>
                    <span className={styles.statsBarValue}>500K+</span>
                    <span className={styles.statsBarLabel}>Products</span>
                </div>
                <div className={styles.statsBarDivider} />
                <div className={styles.statsBarItem}>
                    <span className={styles.statsBarValue}>15%</span>
                    <span className={styles.statsBarLabel}>Max Bonus</span>
                </div>
            </motion.div>
        </div>
    );
}