import fs from "node:fs"

const sellerId = "a682f12b-8d1d-4da4-9b7c-196019600001"
const categoryId = null
const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const records = []
function add(name, family, basePrice = null, { specs = {}, description, variants, sku } = {}) {
  if (typeof family === "number" || family === null) {
    const options = basePrice || {}
    basePrice = typeof family === "number" ? family : null
    family = options.family || "Other"
    specs = options.specs || specs
    description = options.description || description
    variants = options.variants || variants
    sku = options.sku || sku
  }
  const slug = `jbs-${slugify(family)}-${slugify(name)}`
  const finalPrice = basePrice == null ? 0 : Math.round(basePrice * 1.10)
  records.push({
    seller_id: sellerId, category_id: categoryId, name, slug,
    description: description || `${name} by Jaipur Billiards (JBS), a Jaipur manufacturer established in 1960. ${basePrice == null ? "The source PDF does not state a price; request a quote from the seller." : "Listed price includes the requested 10% markup on the PDF base price."}`,
    price: finalPrice, mrp: finalPrice, stock: 0, unit: "piece",
    images: [`/images/products/${slug}.png`], mode: "machine_made", approval_status: "pending", state_code: "RJ",
    tags: ["jaipur-billiards", "catalog-import", basePrice == null ? "inquiry-only" : "pdf-price-marked-up"],
    specifications: {
      catalogue: "JBS Billiards Since 1960 product catalogue",
      catalogue_code: sku || `JBS-${slug.replace("jbs-", "").toUpperCase()}`,
      sku_source: sku ? "Source article code with product suffix for uniqueness" : "Assigned from product slug; source PDF did not specify a SKU",
      craft_family: family, origin: "Jaipur, Rajasthan", source_state: "Rajasthan",
      price_status: basePrice == null ? "Price on request; PDF has no numeric base price" : "10% PDF catalog markup applied",
      ...(variants ? { variants: JSON.stringify(variants) } : {}),
      ...specs,
    },
  })
}

const designer = [
  ["Krypton",115000,135000],["Cypress",185000,205000],["Queen",185000,205000],["Queen B",185000,205000],
  ["Crown",205000,225000],["Crounus",205000,225000],["Sparta",110000,120000],["Xalvador",130000,150000],
  ["Vega",155000,170000],["Caribbean",185000,205000],["Oval",185000,205000],["Ventus",130000,150000],
  ["Bali Pool Table",185000,205000],["Barcelona",185000,205000],["Red Black",185000,205000],["Parson Pool",185000,205000],
]
for (const [name, small, large] of designer) add(name, "Designer Pool Table", small, { specs: { material: "Solid wood structure", dimensions: "8 ft × 4 ft; 9 ft × 4.5 ft", source_sizes: "8ft x 4ft / 9ft x 4.5ft" }, variants: [{ name: "8 ft × 4 ft", price: Math.round(small * 1.1) }, { name: "9 ft × 4.5 ft", price: Math.round(large * 1.1) }] })

add("3 in 1 Table", "3-in-1 Game Table", 105000, { specs: { material: "Solid wood structure", dimensions: "8 ft × 4 ft" }, variants: [{name:"Option 1",price:115500},{name:"Option 2",price:132000},{name:"Option 3",price:126500}], description: "3-in-1 table listing. The PDF shows three price/image options across two pages without naming the option differences; ask the seller to confirm the selected configuration." })

const indian = [["JBS Premium",55000],["JBS Premium Plus",63000],["JBS White Edition",73000],["JBS Black Edition",null],["JBS Tang Edition",70000],["JBS Diamond",78000],["JBS Diamond Plus",95000],["JBS Heritage (Lion Leg)",125000],["JBS Grey Series",135000],["JBS Classic J-1",135000]]
for (const [name,price] of indian) add(name,"Indian Pool Table",price,{specs:{material:"Solid wood structure",dimensions:"8 ft × 4 ft",slate:"Indian slate; exact grade varies by model",source_accessories:"The PDF lists model-specific cues, balls, cloth, pockets, rail, cushion rubber, chalk, brush, dust cover and related table accessories."}})

const mini = [["JBS Pro Series",90000,"Indian slate"],["JBS Strom Series",110000,"Banglori slate"],["JBS Strom Plus Series",135000,"Banglori slate"],["JBS Italian Series",160000,"Italian slate"],["JBS Classic J-1",210000,"Italian slate"]]
for (const [name,price,slate] of mini) add(name,"Regent / Mini Snooker Table",price,{specs:{material:"Solid wood structure",dimensions:"10 ft × 5 ft",slate}})
const royal = [["JBS Pro",120000],["JBS Pro Plus",140000],["JBS Strom",155000],["JBS Hurricane",210000],["JBS Hurricane Plus",260000],["JBS Star",295000],["JBS Classic J-1",320000],["JBS Classic J-1 Plus",370000],["JBS Grey",420000],["JBS Victor",420000]]
for (const [name,price] of royal) add(name,"Royal Snooker Table",price,{specs:{material:"Solid wood structure",dimensions:"12 ft × 6 ft"}})

const foos = [
  ["Jaipur Billiards 123 In",30000,"55 × 30 × 34.5 in; solid CARB-certified MDF; MDF legs; approx. 45–50 kg"],
  ["Jaipur Billiards Pearl Black",20000,"55 × 30 × 34.5 in; 25 mm MDF; 63 mm round metal legs; 16 mm rods; approx. 45–50 kg"],
  ["Jaipur Billiards BB 6006 In",30000,"55 × 30 × 34.5 in; solid CARB-certified MDF; hollow pro tournament rods; approx. 45–50 kg"],
  ["Jaipur Billiards BB 6111 In",45000,"55 × 30 × 34.5 in; solid CARB-certified MDF; hollow pro tournament rods; approx. 45–50 kg"],
  ["Jaipur Billiards BB 6111 In Solid Steel Rod",75000,"Solid CARB-certified MDF; solid steel player rods and steel ball bearings; 5-3-2-1 arrangement; approx. 99 kg"],
]
for (const [name,price,description] of foos) add(name,"Foosball Table",price,{description:`${description}. ${name}, Jaipur Billiards catalogue.` ,specs:{dimensions:description.split(";")[0], construction:description.split(";").slice(1).join(";")}})

add("JBS Pro 18mm",15000,{family:"Table Tennis Table",specs:{dimensions:"2470 × 1525 × 760 mm",board:"18 mm laminated particle board",frame:"25 × 25 mm",legs:"25 × 25 mm",wheels:"65 mm Indian; 8 without lock",included:"2 rackets, 4 balls, standard attachable net"}})
add("JBS Strom 18mm",20000,{family:"Table Tennis Table",specs:{dimensions:"2470 × 1525 × 760 mm",board:"18 mm laminated particle board",frame:"38 × 19 mm",legs:"38 × 38 mm",wheels:"75 mm Indian; 4 locking and 4 non-locking",included:"2 rackets, 4 balls, standard attachable net"}})
for (const [name,base,colour] of [["JBS Hurricane 25mm",25000,"Blue"],["JBS Hurricane 25mm",27000,"Black"],["JBS Classic 25mm",30000,"Blue"],["JBS Classic 25mm",32000,"Black"]]) add(`${name} ${colour}`,base,{family:"Table Tennis Table",specs:{colour,dimensions:"2470 × 1525 × 760 mm",board:"25 mm laminated particle board",frame:name.includes("Classic")?"50 × 25 mm":"38 × 19 mm",legs:"50 × 50 mm",wheels:name.includes("Classic")?"100 mm imported heavy":"100 mm Indian",included:name.includes("Classic")?"2 rackets, 4 balls, extra-heavy attachable net with catcher":"2 rackets, 4 balls, standard attachable net"}})

add("Carrom Board 8mm",6200,{family:"Carrom",specs:{thickness:"8 mm",play_area:"29 × 29 in",border:"3 × 1.5 in",stand_pipe:"1 × 1 in",wheels:"Yes",jack:"No"}})
add("Carrom Board 12mm",7500,{family:"Carrom",specs:{thickness:"12 mm",play_area:"29 × 29 in",border:"3 × 2 in",stand_pipe:"1 × 1 in",wheels:"Yes",jack:"Yes"}})
add("Chess 1 Rose Wood",85000,{family:"Chess Table",sku:"TTIN-60-CHESS",specs:{catalogue_code:"TTIN 60",material:"Rose wood",top:"18 mm",wheels:"100 mm"}})
add("Ludo",85000,{family:"Ludo Game Table",sku:"TTIN-60-LUDO",specs:{catalogue_code:"TTIN 60",top:"18 mm"}})
add("Snake & Ladder",85000,{family:"Snake and Ladder Game Table",sku:"TTIN-60-SNAKE-LADDER",specs:{catalogue_code:"TTIN 60",top:"18 mm"}})
add("Shuffle Board",null,{family:"Shuffleboard",description:"Shuffle board shown in the JBS catalogue. No price, SKU, dimensions, or material are stated; contact the seller for specifications and a quote."})

const accessories = [
  ["Billee Chalk","Chalk"],["Century Pro Chalk","Chalk"],["Master Chalk Set","Chalk"],["Taom V10 Chalk","Chalk"],["Triangle Chalk","Chalk"],
  ["Aramith 1g Ball Set","Snooker Ball Set"],["Aramith Tournament Ball Set","Snooker Ball Set"],["Aramith Ball Set","Snooker Ball Set"],["Basic Ball Set","Snooker Ball Set"],["Snooker Partner Ball Set","Snooker Ball Set"],["XingKang Snooker Ball Set","Snooker Ball Set"],
  ["Aramith Premier Pool Ball Set","Pool Ball Set"],["Basic Pool Ball Set","Pool Ball Set"],["Partner Pool Ball Set","Pool Ball Set"],["Xing Kong Pool Ball Set","Pool Ball Set"],
  ...["777 Pool Table Black","777 Pool Table Camel","Blue 777 Pool Table","W 980 Pool Table Black","W Pro Pool Table Cloth Red","Wiraka 777 Green Pool Table","777 Pool Table Green","W 980 Pool Table Green","Wiraka 6565 Pool Table","777 Pool Table Red","777 Pool Table Yellow","W Pro Pool Table Cloth Blue","W Pro Pool Table Cloth Green"].map(x=>[x,"Pool Table Cloth"]),
  ...["777 Snooker Table Cloth Green","Hainsworth Table Cloth Green","Wiraka 6565 Pool Table Cloth","Liberwin B Cloth","Strachan 6811 28 OZ Club Gold","Strachan 6811 30 OZ","Wiraka 777 Green Snooker Table","Liberwin A Cloth"].map(x=>[x,"Snooker Table Cloth"]),
  ...["Plastic Chalk Holder","Leather Pouch Chalk Holder Front","Magnet Chalk Holder 1","Round Shape Chalk Holder 1","Metal Chalk Holder 1","Metal Chalk Holder 2"].map(x=>[x,"Chalk Holder"]),
  ...["Brass Cross Rest & Stick","Brass Cross Rest","Long Spider Rest Mouth 1","Long Spider Rest Mouth 2","Swan Mouth 1","Swan Mouth 2","Mouth Stick","Short Spider Rest Mouth 1"].map(x=>[x,"Rest Cue Stick and Mouth"]),
  ...["Heavy Plastic White Triangle","Plastic 9 Ball Frame","Plastic Triangle","Wooden 9 Ball Frame","Wooden Triangle"].map(x=>[x,"Triangle Frame"]),
  ...["Basket Pocket 5 and 8 Inch","Corner Pocket Rubber","Leather Jhalar Pocket Set","American Table Pocket","Cotton Jali Heavy","Inner Pocket","Upper-Outer Pocket Set","Leather for Inner Pocket","Leather for Outer Pocket"].map(x=>[x,"Billiards Pocket"]),
  ...["Brass Railing","Golden Railing Set","Heavy Railing Set Black","Heavy Railing Set Golden","Plastic Railing Set"].map(x=>[x,"Billiards Railing Set"]),
  ["Plastic Cue Stand","Cue Stand"],["Wooden Cue Stand","Cue Stand"],["9 Inches Brush","Table Brush"],["Plastic Table Corner Brush","Table Brush"],["Wooden Side Corner Brush","Table Brush"],
  ...["Basic Cushion Rubber Pool Table Pink","Basic Cushion Rubber Pool Table Black","Melin Cushion Rubber Pool Table Green","NRC Snooker Rubber Set","V Shape Cushion Rubber","Basic Cushion Rubber Pool Table Green","Basic Cushion Rubber Snooker Table Black","Melin Cushion Rubber Snooker Table Pink","Melin Cushion Rubber Pool Table Black","Basic Cushion Rubber Snooker Table Green","Basic Cushion Rubber Snooker Table Pink","Melin Cushion Rubber Snooker Table Green"].map(x=>[x,"Cushion Rubber"]),
  ...["Aramith Billiard Ball Cleaner","Ball Position Marker","Cue Tip Fixing Glue","Cue Tip Puncher","Billiard and Pool Table Cue Tip Shaper","Billiards and Pool Hanging Rubber","Cue Tip Repair Clamp","Cue Tip Setter","Billiards and Pool Table Ashtray","Billiards Table Iron","Cue Tip Sharpener"].map(x=>[x,"Billiards Accessory"]),
  ["Billiard and Pool Telescopic Cue Extension Black Fiber","Cue Extension"],["Billiards and Snooker Telescopic Cue Extension Metal","Cue Extension"],
  ...["15 Slot LED Light","Apollo Black Hanging Light 1","Apollo Black Hanging Light 3","Steel Rod 3 Dome Pool Light","Steel Rod 6 Dome Snooker Light"].map(x=>[x,"Game Table Light"]),
  ["Billiards Wave Stand 500x500","Billiards Hook"],["Billiards Table Hook","Billiards Hook"],
  ...["Pool Ball Case","Snooker Ball Case","Pool Ball Tray","Snooker Ball Tray"].map(x=>[x,"Ball Case and Tray"]),
  ...["Blue Color 9mm Tips","Blue Diamond 9mm Tips","Meilin 10.5mm Tips","Omin Red 10mm Tips","Brunswick Blue Diamond 9mm Tips","Buffalo 10mm Cue Tip","Plastic 9mm Slip-on Tips","Precision 9mm Tips","Elk Master 10mm and 12mm Tips","First Class Leather Tips 10mm","Royal Oak Leather Cue Tips 10mm","Sapphire 9mm Tips"].map(x=>[x,"Cue Tip"]),
]
for (const [name,family] of accessories) add(name,family,null,{description:`${name}, listed in the accessories section of the JBS Billiards catalogue. The PDF does not state a price or product specifications; contact the seller for a quote and details.`})

const outfile = new URL("../public/jbs-catalog-import.json", import.meta.url)
fs.writeFileSync(outfile, JSON.stringify({ seller: { id:sellerId, business_name:"Jaipur Billiards", store_name:"Jaipur Billiards Since 1960", owner_name:"Pritpal Singh Ahuja", city:"Jaipur", state:"Rajasthan", state_code:"RJ", address:"Experience Zone: Basement, Plot No. 514, Street No. 5, Raja Park, Jaipur-302004, Rajasthan", phone:"+91 9214589813", secondary_phone:"+91 9799117500", customer_care:"9079599599", email:"jaipurbilliards@gmail.com", website:"https://www.jaipurbilliards.in", business_type:"manufacturer", craft_specialty:"Snooker, billiards, pool, table tennis, foosball, carrom and game tables with accessories", source:"JBS Billiards Since 1960 PDF catalog" }, source_pdf:"JBS BILLIARDS SINCE 1960 (1).pdf", price_markup_percent:10, products:records }, null, 2) + "\n")
console.log(`Wrote ${records.length} JBS product records to ${outfile.pathname}`)
