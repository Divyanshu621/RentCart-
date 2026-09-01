import { db } from '../src/lib/db'
import { hash } from 'bcryptjs'

const now = new Date()
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000)
const daysFromNow = (n: number) => new Date(now.getTime() + n * 86400000)

async function seed() {
  console.log('🌱 Seeding database...')

  // ─── 1. States ───────────────────────────────────────────
  console.log('→ Creating states...')
  const statesData = [
    { name: 'Delhi', code: 'DL' },
    { name: 'Maharashtra', code: 'MH' },
    { name: 'Karnataka', code: 'KA' },
    { name: 'Tamil Nadu', code: 'TN' },
    { name: 'Gujarat', code: 'GJ' },
    { name: 'Rajasthan', code: 'RJ' },
    { name: 'Kerala', code: 'KL' },
    { name: 'West Bengal', code: 'WB' },
    { name: 'Telangana', code: 'TS' },
    { name: 'Uttar Pradesh', code: 'UP' },
  ]
  const states: Record<string, any> = {}
  for (const s of statesData) {
    states[s.code] = await db.state.create({ data: s })
  }

  // ─── 2. Cities ───────────────────────────────────────────
  console.log('→ Creating cities...')
  const citiesData: Record<string, string[]> = {
    DL: ['New Delhi', 'Dwarka', 'Rohini'],
    MH: ['Mumbai', 'Pune', 'Nagpur'],
    KA: ['Bangalore', 'Mysore', 'Mangalore'],
    TN: ['Chennai', 'Coimbatore', 'Madurai'],
    GJ: ['Ahmedabad', 'Surat', 'Vadodara'],
    RJ: ['Jaipur', 'Udaipur', 'Jodhpur'],
    KL: ['Kochi', 'Thiruvananthapuram', 'Kozhikode'],
    WB: ['Kolkata', 'Howrah', 'Durgapur'],
    TS: ['Hyderabad', 'Warangal', 'Nizamabad'],
    UP: ['Lucknow', 'Noida', 'Agra'],
  }
  const cities: Record<string, any> = {}
  for (const [stateCode, cityNames] of Object.entries(citiesData)) {
    for (const cityName of cityNames) {
      const key = `${stateCode}-${cityName}`
      cities[key] = await db.city.create({
        data: { name: cityName, stateId: states[stateCode].id },
      })
    }
  }

  // ─── 3. Areas ──────────────────────────────────────────
  console.log('→ Creating areas...')
  const areasData: Record<string, { name: string; pinCode?: string }[]> = {
    // Delhi
    'DL-New Delhi': [
      { name: 'Connaught Place', pinCode: '110001' },
      { name: 'Khan Market', pinCode: '110003' },
      { name: 'Sarojini Nagar', pinCode: '110023' },
      { name: 'Lajpat Nagar', pinCode: '110024' },
      { name: 'Karol Bagh', pinCode: '110005' },
      { name: 'Chandni Chowk', pinCode: '110006' },
      { name: 'Defence Colony', pinCode: '110024' },
      { name: 'Greater Kailash', pinCode: '110048' },
      { name: 'Hauz Khas', pinCode: '110016' },
      { name: 'Saket', pinCode: '110017' },
      { name: 'Mehrauli', pinCode: '110030' },
      { name: 'Vasant Kunj', pinCode: '110070' },
    ],
    'DL-Dwarka': [
      { name: 'Dwarka Sector 1', pinCode: '110075' },
      { name: 'Dwarka Sector 4', pinCode: '110075' },
      { name: 'Dwarka Sector 7', pinCode: '110075' },
      { name: 'Dwarka Sector 10', pinCode: '110075' },
      { name: 'Dwarka Sector 14', pinCode: '110078' },
      { name: 'Dwarka Sector 21', pinCode: '110077' },
      { name: 'Dwarka Sector 23', pinCode: '110077' },
      { name: 'Janakpuri', pinCode: '110058' },
      { name: 'Palam Vihar', pinCode: '110077' },
      { name: 'Uttam Nagar', pinCode: '110059' },
    ],
    'DL-Rohini': [
      { name: 'Rohini Sector 1', pinCode: '110085' },
      { name: 'Rohini Sector 3', pinCode: '110085' },
      { name: 'Rohini Sector 7', pinCode: '110085' },
      { name: 'Rohini Sector 11', pinCode: '110085' },
      { name: 'Rohini Sector 14', pinCode: '110089' },
      { name: 'Rohini Sector 16', pinCode: '110089' },
      { name: 'Rohini Sector 22', pinCode: '110086' },
      { name: 'Pitampura', pinCode: '110034' },
      { name: 'Shalimar Bagh', pinCode: '110088' },
      { name: 'Begumpur', pinCode: '110086' },
    ],
    // Maharashtra
    'MH-Mumbai': [
      { name: 'Bandra', pinCode: '400050' },
      { name: 'Andheri', pinCode: '400053' },
      { name: 'Juhu', pinCode: '400049' },
      { name: 'Powai', pinCode: '400076' },
      { name: 'Thane West', pinCode: '400601' },
      { name: 'Borivali', pinCode: '400066' },
      { name: 'Malad', pinCode: '400064' },
      { name: 'Goregaon', pinCode: '400063' },
      { name: 'Kandivali', pinCode: '400067' },
      { name: 'Dadar', pinCode: '400028' },
      { name: 'Lower Parel', pinCode: '400013' },
      { name: 'Worli', pinCode: '400030' },
    ],
    'MH-Pune': [
      { name: 'Koregaon Park', pinCode: '411001' },
      { name: 'Hinjewadi', pinCode: '411057' },
      { name: 'Baner', pinCode: '411045' },
      { name: 'Viman Nagar', pinCode: '411014' },
      { name: 'Kothrud', pinCode: '411038' },
      { name: 'Hadapsar', pinCode: '411028' },
      { name: 'Aundh', pinCode: '411007' },
      { name: 'Pimpri-Chinchwad', pinCode: '411018' },
      { name: 'Magarpatta', pinCode: '411028' },
      { name: 'Wakad', pinCode: '411057' },
    ],
    'MH-Nagpur': [
      { name: 'Dharampeth', pinCode: '440010' },
      { name: 'Civil Lines', pinCode: '440001' },
      { name: 'Sadar', pinCode: '440001' },
      { name: 'Sitabuldi', pinCode: '440012' },
      { name: 'Laxmi Nagar', pinCode: '440022' },
      { name: 'Manish Nagar', pinCode: '440023' },
      { name: 'Hingna Road', pinCode: '440016' },
      { name: 'Wardha Road', pinCode: '440015' },
      { name: 'Amravati Road', pinCode: '440026' },
      { name: 'Khamla', pinCode: '440025' },
      { name: 'Ramdaspeth', pinCode: '440010' },
    ],
    // Karnataka
    'KA-Bangalore': [
      { name: 'Koramangala', pinCode: '560034' },
      { name: 'Indiranagar', pinCode: '560038' },
      { name: 'Whitefield', pinCode: '560066' },
      { name: 'HSR Layout', pinCode: '560102' },
      { name: 'Jayanagar', pinCode: '560041' },
      { name: 'BTM Layout', pinCode: '560076' },
      { name: 'Electronic City', pinCode: '560100' },
      { name: 'Marathahalli', pinCode: '560037' },
      { name: 'Rajajinagar', pinCode: '560010' },
      { name: 'Malleshwaram', pinCode: '560003' },
      { name: 'JP Nagar', pinCode: '560078' },
      { name: 'Bannerghatta Road', pinCode: '560076' },
      { name: 'Yelahanka', pinCode: '560064' },
    ],
    'KA-Mysore': [
      { name: 'Gandhi Bazaar', pinCode: '570004' },
      { name: 'Vidyaranyapuram', pinCode: '570008' },
      { name: 'Jayalakshmipuram', pinCode: '570012' },
      { name: 'Saraswathipuram', pinCode: '570009' },
      { name: 'Kuvempu Nagar', pinCode: '570023' },
      { name: 'Hebbal Industrial Area', pinCode: '570016' },
      { name: 'Mandimohalla', pinCode: '570001' },
      { name: 'Nazarbad', pinCode: '570010' },
      { name: 'Gokulam', pinCode: '570002' },
      { name: 'Hunsur Road', pinCode: '570018' },
    ],
    'KA-Mangalore': [
      { name: 'Kadri', pinCode: '575002' },
      { name: 'Hampankatta', pinCode: '575001' },
      { name: 'Pumpwell', pinCode: '575002' },
      { name: 'Mangaladevi', pinCode: '575003' },
      { name: 'Surathkal', pinCode: '575014' },
      { name: 'Attavar', pinCode: '575001' },
      { name: 'Kankanady', pinCode: '575002' },
      { name: 'Bendoorwell', pinCode: '575008' },
      { name: 'Nandigudda', pinCode: '575004' },
      { name: 'Bejai', pinCode: '575004' },
    ],
    // Tamil Nadu
    'TN-Chennai': [
      { name: 'T. Nagar', pinCode: '600017' },
      { name: 'Anna Nagar', pinCode: '600040' },
      { name: 'Adyar', pinCode: '600020' },
      { name: 'Velachery', pinCode: '600042' },
      { name: 'Nungambakkam', pinCode: '600034' },
      { name: 'Chromepet', pinCode: '600044' },
      { name: 'Tambaram', pinCode: '600045' },
      { name: 'Porur', pinCode: '600116' },
      { name: 'OMR Thoraipakkam', pinCode: '600097' },
      { name: 'Egmore', pinCode: '600008' },
      { name: 'Mylapore', pinCode: '600004' },
      { name: 'Guindy', pinCode: '600032' },
    ],
    'TN-Coimbatore': [
      { name: 'RS Puram', pinCode: '641002' },
      { name: 'Gandhipuram', pinCode: '641012' },
      { name: 'Peelamedu', pinCode: '641004' },
      { name: 'Saibaba Colony', pinCode: '641011' },
      { name: 'Town Hall', pinCode: '641001' },
      { name: 'Vadavalli', pinCode: '641041' },
      { name: 'Saravanampatti', pinCode: '641035' },
      { name: 'Hopes College', pinCode: '641004' },
      { name: 'Singanallur', pinCode: '641005' },
      { name: 'Ramanathapuram', pinCode: '641013' },
    ],
    'TN-Madurai': [
      { name: 'Anna Nagar', pinCode: '625020' },
      { name: 'KK Nagar', pinCode: '625020' },
      { name: 'Vilakkuthoon', pinCode: '625001' },
      { name: 'Tallakulam', pinCode: '625002' },
      { name: 'Pasumalai', pinCode: '625004' },
      { name: 'Goripalayam', pinCode: '625001' },
      { name: 'K. Pudur', pinCode: '625007' },
      { name: 'S.S. Colony', pinCode: '625016' },
      { name: 'Aarapalayam', pinCode: '625001' },
      { name: 'Thirunagar', pinCode: '625006' },
      { name: 'Kalavasal', pinCode: '625016' },
    ],
    // Gujarat
    'GJ-Ahmedabad': [
      { name: 'Navrangpura', pinCode: '380009' },
      { name: 'Satellite', pinCode: '380015' },
      { name: 'Vastrapur', pinCode: '380015' },
      { name: 'Bodakdev', pinCode: '380054' },
      { name: 'Maninagar', pinCode: '380008' },
      { name: 'SG Highway', pinCode: '380054' },
      { name: 'Prahlad Nagar', pinCode: '380015' },
      { name: 'Paldi', pinCode: '380007' },
      { name: 'Memnagar', pinCode: '380052' },
      { name: 'Bopal', pinCode: '380058' },
      { name: 'Chandkheda', pinCode: '382424' },
      { name: 'Thaltej', pinCode: '380054' },
    ],
    'GJ-Surat': [
      { name: 'Adajan', pinCode: '395009' },
      { name: 'Vesu', pinCode: '395007' },
      { name: 'Piplod', pinCode: '395007' },
      { name: 'Dumas Road', pinCode: '395007' },
      { name: 'Ring Road', pinCode: '395002' },
      { name: 'Varachha', pinCode: '395006' },
      { name: 'Katargam', pinCode: '395004' },
      { name: 'Althan', pinCode: '395024' },
      { name: 'Palanpur Patiya', pinCode: '395009' },
      { name: 'Sachin GIDC', pinCode: '394230' },
    ],
    'GJ-Vadodara': [
      { name: 'Alkapuri', pinCode: '390007' },
      { name: 'Sayajigunj', pinCode: '390005' },
      { name: 'Fatehgunj', pinCode: '390002' },
      { name: 'Akota', pinCode: '390020' },
      { name: 'Gorwa', pinCode: '390016' },
      { name: 'Manjalpur', pinCode: '390011' },
      { name: 'Karelibaug', pinCode: '390018' },
      { name: 'Tandalja', pinCode: '390009' },
      { name: 'Waghodia Road', pinCode: '390019' },
      { name: 'Subhanpura', pinCode: '390021' },
      { name: 'Nizampura', pinCode: '390002' },
    ],
    // Rajasthan
    'RJ-Jaipur': [
      { name: 'C-Scheme', pinCode: '302001' },
      { name: 'Vaishali Nagar', pinCode: '302021' },
      { name: 'Malviya Nagar', pinCode: '302017' },
      { name: 'Mansarovar', pinCode: '302020' },
      { name: 'Tonk Road', pinCode: '302015' },
      { name: 'Raja Park', pinCode: '302004' },
      { name: 'Jhotwara', pinCode: '302012' },
      { name: 'Sanganer', pinCode: '302029' },
      { name: 'Bani Park', pinCode: '302016' },
      { name: 'Jagatpura', pinCode: '302017' },
      { name: 'Sodala', pinCode: '302012' },
    ],
    'RJ-Udaipur': [
      { name: 'Fatehsagar', pinCode: '313001' },
      { name: 'Sukhadia Circle', pinCode: '313001' },
      { name: 'Hathipole', pinCode: '313001' },
      { name: 'Surajpol', pinCode: '313001' },
      { name: 'Shakti Nagar', pinCode: '313001' },
      { name: 'Bhopalpura', pinCode: '313001' },
      { name: 'Ambamata', pinCode: '313001' },
      { name: 'University Road', pinCode: '313001' },
      { name: 'Nathdwara Road', pinCode: '313001' },
      { name: 'Rampura', pinCode: '313001' },
    ],
    'RJ-Jodhpur': [
      { name: 'Paota', pinCode: '342001' },
      { name: 'Sardarpura', pinCode: '342001' },
      { name: 'Shastri Nagar', pinCode: '342001' },
      { name: 'Ratanada', pinCode: '342001' },
      { name: 'Focal Point', pinCode: '342001' },
      { name: 'Chopasni Road', pinCode: '342001' },
      { name: 'Pal Road', pinCode: '342001' },
      { name: 'Basni', pinCode: '342001' },
      { name: 'Mandore', pinCode: '342001' },
      { name: 'Shiv Road', pinCode: '342001' },
      { name: 'Kabir Nagar', pinCode: '342001' },
    ],
    // Kerala
    'KL-Kochi': [
      { name: 'Edappally', pinCode: '682024' },
      { name: 'Kakkanad', pinCode: '682030' },
      { name: 'MG Road Ernakulam', pinCode: '682011' },
      { name: 'Kaloor', pinCode: '682017' },
      { name: 'Palarivattom', pinCode: '682025' },
      { name: 'Vyttila', pinCode: '682019' },
      { name: 'Tripunithura', pinCode: '682301' },
      { name: 'Fort Kochi', pinCode: '682001' },
      { name: 'Mattancherry', pinCode: '682002' },
      { name: 'Aluva', pinCode: '683101' },
    ],
    'KL-Thiruvananthapuram': [
      { name: 'Statue', pinCode: '695001' },
      { name: 'Palayam', pinCode: '695001' },
      { name: 'Kowdiar', pinCode: '695003' },
      { name: 'Vazhuthacaud', pinCode: '695014' },
      { name: 'Sasthamangalam', pinCode: '695010' },
      { name: 'Kesavadasapuram', pinCode: '695004' },
      { name: 'Pattom', pinCode: '695004' },
      { name: 'Karamana', pinCode: '695002' },
      { name: 'Neyyattinkara', pinCode: '695121' },
      { name: 'Attingal', pinCode: '695101' },
      { name: 'Kazhakkoottam', pinCode: '695582' },
    ],
    'KL-Kozhikode': [
      { name: 'SM Street', pinCode: '673001' },
      { name: 'Mavoor Road', pinCode: '673001' },
      { name: 'Nadakkavu', pinCode: '673011' },
      { name: 'Kuttichira', pinCode: '673001' },
      { name: 'Palayam', pinCode: '673001' },
      { name: 'Thondayad', pinCode: '673014' },
      { name: 'Meenchanda', pinCode: '673012' },
      { name: 'Korappath', pinCode: '673011' },
      { name: 'Ramanattukara', pinCode: '673633' },
      { name: 'Feroke', pinCode: '673631' },
    ],
    // West Bengal
    'WB-Kolkata': [
      { name: 'Salt Lake', pinCode: '700091' },
      { name: 'Park Street', pinCode: '700016' },
      { name: 'New Alipore', pinCode: '700053' },
      { name: 'Behala', pinCode: '700060' },
      { name: 'Gariahat', pinCode: '700029' },
      { name: 'Jadavpur', pinCode: '700032' },
      { name: 'Dum Dum', pinCode: '700028' },
      { name: 'Lake Town', pinCode: '700089' },
      { name: 'Tollygunge', pinCode: '700033' },
      { name: 'Ballygunge', pinCode: '700019' },
      { name: 'Mukundapur', pinCode: '700099' },
      { name: 'Rajarhat', pinCode: '700135' },
    ],
    'WB-Howrah': [
      { name: 'Howrah Station Area', pinCode: '711101' },
      { name: 'Shibpur', pinCode: '711102' },
      { name: 'Bally', pinCode: '711204' },
      { name: 'Liluah', pinCode: '711204' },
      { name: 'Andul', pinCode: '711302' },
      { name: 'Santragachi', pinCode: '711104' },
      { name: 'Domjur', pinCode: '711405' },
      { name: 'Bakultala', pinCode: '711102' },
      { name: 'Ramrajatala', pinCode: '711106' },
      { name: 'Maidan Howrah', pinCode: '711101' },
    ],
    'WB-Durgapur': [
      { name: 'City Centre', pinCode: '713216' },
      { name: 'A-Zone', pinCode: '713216' },
      { name: 'B-Zone', pinCode: '713213' },
      { name: 'C-Zone', pinCode: '713214' },
      { name: 'Durgapur Steel Township', pinCode: '713205' },
      { name: 'Benachity', pinCode: '713213' },
      { name: 'Bidhannagar', pinCode: '713212' },
      { name: 'Muchipara', pinCode: '713213' },
      { name: 'Gopalpur', pinCode: '713214' },
      { name: 'Fulia More', pinCode: '713216' },
    ],
    // Telangana
    'TS-Hyderabad': [
      { name: 'Banjara Hills', pinCode: '500034' },
      { name: 'Jubilee Hills', pinCode: '500033' },
      { name: 'HITEC City', pinCode: '500081' },
      { name: 'Gachibowli', pinCode: '500032' },
      { name: 'Madhapur', pinCode: '500081' },
      { name: 'Kondapur', pinCode: '500084' },
      { name: 'Kukatpally', pinCode: '500085' },
      { name: 'Miyapur', pinCode: '500049' },
      { name: 'Ameerpet', pinCode: '500038' },
      { name: 'Secunderabad', pinCode: '500003' },
      { name: 'Begumpet', pinCode: '500016' },
      { name: 'Tolichowki', pinCode: '500008' },
      { name: 'KPHB Colony', pinCode: '500085' },
    ],
    'TS-Warangal': [
      { name: 'Hanamkonda', pinCode: '506001' },
      { name: 'Kazipet', pinCode: '506003' },
      { name: 'Warangal Fort Area', pinCode: '506001' },
      { name: 'Naspur', pinCode: '506002' },
      { name: 'Millennium Township', pinCode: '506001' },
      { name: 'Ashok Nagar', pinCode: '506001' },
      { name: 'Subedari', pinCode: '506001' },
      { name: 'Lashkar Bazaar', pinCode: '506001' },
      { name: 'Bhadrakali', pinCode: '506001' },
      { name: 'Kakatiya Nagar', pinCode: '506001' },
    ],
    'TS-Nizamabad': [
      { name: 'Gandhi Chowk', pinCode: '503001' },
      { name: 'Mubarak Nagar', pinCode: '503001' },
      { name: 'Pragathi Nagar', pinCode: '503001' },
      { name: 'Dichpally', pinCode: '503001' },
      { name: 'Bodhan Road', pinCode: '503185' },
      { name: 'Kamareddy Road', pinCode: '503111' },
      { name: 'Malkapur Road', pinCode: '503001' },
      { name: 'Ashok Nagar', pinCode: '503001' },
      { name: 'Railway Station Road', pinCode: '503001' },
      { name: 'Armoor Road', pinCode: '503224' },
    ],
    // Uttar Pradesh
    'UP-Lucknow': [
      { name: 'Hazratganj', pinCode: '226001' },
      { name: 'Gomti Nagar', pinCode: '226010' },
      { name: 'Indira Nagar', pinCode: '226016' },
      { name: 'Aliganj', pinCode: '226024' },
      { name: 'Aminabad', pinCode: '226018' },
      { name: 'Mahanagar', pinCode: '226006' },
      { name: 'Kapoorthala', pinCode: '226024' },
      { name: 'Chinhat', pinCode: '226028' },
      { name: 'Tiwari Ganj', pinCode: '226004' },
      { name: 'Rajajipuram', pinCode: '226101' },
      { name: 'Kanpur Road', pinCode: '226022' },
      { name: 'La Martiniere Road', pinCode: '226001' },
    ],
    'UP-Noida': [
      { name: 'Sector 18', pinCode: '201301' },
      { name: 'Sector 62', pinCode: '201309' },
      { name: 'Sector 15', pinCode: '201301' },
      { name: 'Sector 50', pinCode: '201301' },
      { name: 'Sector 128', pinCode: '201304' },
      { name: 'Sector 137', pinCode: '201305' },
      { name: 'Sector 104', pinCode: '201304' },
      { name: 'Greater Noida', pinCode: '201310' },
      { name: 'Atta Market', pinCode: '201301' },
      { name: 'Sector 71', pinCode: '201307' },
    ],
    'UP-Agra': [
      { name: 'Sadar Bazaar', pinCode: '282001' },
      { name: 'Fatehabad Road', pinCode: '282001' },
      { name: 'MG Road Agra', pinCode: '282001' },
      { name: 'Sanjay Place', pinCode: '282002' },
      { name: 'Kamla Nagar', pinCode: '282004' },
      { name: 'Lohamandi', pinCode: '282001' },
      { name: 'Balkeshwar', pinCode: '282004' },
      { name: 'Sikandra', pinCode: '282007' },
      { name: 'Dayalbagh', pinCode: '282005' },
      { name: 'Idgah Colony', pinCode: '282001' },
      { name: 'Shahganj', pinCode: '282010' },
    ],
  }
  const allAreas: { name: string; cityId: string; pinCode?: string }[] = []
  for (const [cityKey, areaList] of Object.entries(areasData)) {
    for (const area of areaList) {
      allAreas.push({ name: area.name, cityId: cities[cityKey].id, pinCode: area.pinCode })
    }
  }
  await db.area.createMany({ data: allAreas })
  console.log(`  Created ${allAreas.length} areas across ${Object.keys(areasData).length} cities`)

  // ─── 4. Categories ────────────────────────────────────────
  console.log('→ Creating categories...')
  const categoriesData = [
    { name: 'Electronics', slug: 'electronics', icon: 'cpu', description: 'Electronic devices and gadgets' },
    { name: 'Cameras', slug: 'cameras', icon: 'camera', description: 'Photography and videography equipment' },
    { name: 'Laptops', slug: 'laptops', icon: 'laptop', description: 'Laptops and notebooks' },
    { name: 'Gaming', slug: 'gaming', icon: 'gamepad-2', description: 'Gaming consoles and accessories' },
    { name: 'Furniture', slug: 'furniture', icon: 'armchair', description: 'Home and office furniture' },
    { name: 'Tools', slug: 'tools', icon: 'wrench', description: 'Power tools and hand tools' },
    { name: 'Vehicles', slug: 'vehicles', icon: 'car', description: 'Vehicles for rent' },
    { name: 'Bikes', slug: 'bikes', icon: 'bike', description: 'Bicycles and motorbikes' },
    { name: 'Sports', slug: 'sports', icon: 'dumbbell', description: 'Sports and fitness equipment' },
    { name: 'Camping', slug: 'camping', icon: 'tent', description: 'Camping and outdoor gear' },
    { name: 'Party Equipment', slug: 'party-equipment', icon: 'music', description: 'Party and event equipment' },
    { name: 'Home Appliances', slug: 'home-appliances', icon: 'home', description: 'Home appliances' },
    { name: 'Books', slug: 'books', icon: 'book-open', description: 'Books and reading material' },
    { name: 'Fashion', slug: 'fashion', icon: 'shirt', description: 'Fashion and accessories' },
    { name: 'Musical Instruments', slug: 'musical-instruments', icon: 'guitar', description: 'Musical instruments and audio gear' },
  ]
  const categories: Record<string, any> = {}
  for (const c of categoriesData) {
    categories[c.slug] = await db.category.create({ data: c })
  }

  // ─── 4. Users ─────────────────────────────────────────────
  console.log('→ Creating users...')
  const passwordHash = await hash('password123', 10)

  const usersData = [
    { name: 'Admin User', email: 'admin@rentloop.com', phone: '9876543210', role: 'SUPER_ADMIN', stateCode: 'DL', cityKey: 'DL-New Delhi' },
    { name: 'Admin Two', email: 'admin2@rentloop.com', phone: '9876543211', role: 'ADMIN', stateCode: 'MH', cityKey: 'MH-Mumbai' },
    { name: 'Rahul Sharma', email: 'owner1@rentloop.com', phone: '9876543212', role: 'OWNER', stateCode: 'DL', cityKey: 'DL-New Delhi' },
    { name: 'Priya Patel', email: 'owner2@rentloop.com', phone: '9876543213', role: 'OWNER', stateCode: 'MH', cityKey: 'MH-Pune' },
    { name: 'Vikram Reddy', email: 'owner3@rentloop.com', phone: '9876543214', role: 'OWNER', stateCode: 'KA', cityKey: 'KA-Bangalore' },
    { name: 'Amit Kumar', email: 'customer1@rentloop.com', phone: '9876543215', role: 'CUSTOMER', stateCode: 'DL', cityKey: 'DL-New Delhi' },
    { name: 'Sneha Iyer', email: 'customer2@rentloop.com', phone: '9876543216', role: 'CUSTOMER', stateCode: 'MH', cityKey: 'MH-Mumbai' },
    { name: 'Rohan Das', email: 'customer3@rentloop.com', phone: '9876543217', role: 'CUSTOMER', stateCode: 'KA', cityKey: 'KA-Bangalore' },
    { name: 'Meera Nair', email: 'customer4@rentloop.com', phone: '9876543218', role: 'CUSTOMER', stateCode: 'TN', cityKey: 'TN-Chennai' },
    { name: 'Arjun Singh', email: 'customer5@rentloop.com', phone: '9876543219', role: 'CUSTOMER', stateCode: 'RJ', cityKey: 'RJ-Jaipur' },
  ]
  const users: any[] = []
  for (const u of usersData) {
    const user = await db.user.create({
      data: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        passwordHash,
        role: u.role,
        stateId: states[u.stateCode].id,
        cityId: cities[u.cityKey].id,
        isVerified: true,
        isActive: true,
      },
    })
    users.push(user)
  }

  // Shorthand references
  const admin = users[0]
  const admin2 = users[1]
  const owner1 = users[2] // Rahul - Delhi
  const owner2 = users[3] // Priya - Maharashtra
  const owner3 = users[4] // Vikram - Karnataka
  const cust1 = users[5]  // Amit - Delhi
  const cust2 = users[6]  // Sneha - Maharashtra
  const cust3 = users[7]  // Rohan - Karnataka
  const cust4 = users[8]  // Meera - Tamil Nadu
  const cust5 = users[9]  // Arjun - Rajasthan

  // ─── 5. Products ──────────────────────────────────────────
  console.log('→ Creating products...')
  const productsData = [
    {
      title: 'Canon EOS R10 Camera', slug: 'canon-eos-r10',
      description: 'Canon EOS R10 mirrorless camera with 18-45mm lens kit. Perfect for photography enthusiasts and content creators. 24.2MP APS-C sensor with fast autofocus.',
      categorySlug: 'cameras', condition: 'LIKE_NEW', dailyPrice: 800, securityDeposit: 15000,
      owner: owner1, stateCode: 'DL', cityKey: 'DL-New Delhi', brand: 'Canon', model: 'EOS R10', purchaseYear: 2023,
    },
    {
      title: 'Sony PlayStation 5', slug: 'sony-playstation-5',
      description: 'PS5 console with DualSense controller and 2 games included. Next-gen gaming experience with 4K support and ultra-fast SSD.',
      categorySlug: 'gaming', condition: 'GOOD', dailyPrice: 500, securityDeposit: 20000,
      owner: owner2, stateCode: 'MH', cityKey: 'MH-Mumbai', brand: 'Sony', model: 'PS5', purchaseYear: 2022,
    },
    {
      title: 'MacBook Pro M3', slug: 'macbook-pro-m3',
      description: 'Apple MacBook Pro 14-inch with M3 chip, 16GB RAM, 512GB SSD. Ideal for video editing, coding, and creative work.',
      categorySlug: 'laptops', condition: 'LIKE_NEW', dailyPrice: 1500, securityDeposit: 50000,
      owner: owner3, stateCode: 'KA', cityKey: 'KA-Bangalore', brand: 'Apple', model: 'MacBook Pro M3', purchaseYear: 2024,
    },
    {
      title: 'Mountain Bike', slug: 'mountain-bike',
      description: 'Premium mountain bike with 21-speed gear system, front suspension, and durable alloy frame. Great for trails and city rides.',
      categorySlug: 'bikes', condition: 'GOOD', dailyPrice: 300, securityDeposit: 5000,
      owner: owner1, stateCode: 'DL', cityKey: 'DL-Dwarka', brand: 'Hero', model: 'Xtreme', purchaseYear: 2023,
    },
    {
      title: 'Camping Tent Set', slug: 'camping-tent-set',
      description: '4-person waterproof camping tent with accessories including sleeping bags, ground mat, and LED lantern. Perfect for outdoor adventures.',
      categorySlug: 'camping', condition: 'NEW', dailyPrice: 400, securityDeposit: 3000,
      owner: owner1, stateCode: 'RJ', cityKey: 'RJ-Jaipur', brand: 'Decathlon', model: '2 Seconds Easy', purchaseYear: 2024,
    },
    {
      title: 'DJI Drone', slug: 'dji-drone',
      description: 'DJI Mavic Air 2 drone with 4K camera, 3-axis gimbal, and 34-min flight time. Includes extra batteries and carrying case.',
      categorySlug: 'cameras', condition: 'LIKE_NEW', dailyPrice: 2000, securityDeposit: 30000,
      owner: owner3, stateCode: 'KA', cityKey: 'KA-Bangalore', brand: 'DJI', model: 'Mavic Air 2', purchaseYear: 2023,
    },
    {
      title: 'Projector Epson', slug: 'projector-epson',
      description: 'Epson EB-X51 projector with 3LCD technology, 3600 lumens, and HD resolution. Great for movies, presentations, and events.',
      categorySlug: 'electronics', condition: 'GOOD', dailyPrice: 600, securityDeposit: 10000,
      owner: owner3, stateCode: 'TN', cityKey: 'TN-Chennai', brand: 'Epson', model: 'EB-X51', purchaseYear: 2022,
    },
    {
      title: 'Power Drill Set', slug: 'power-drill-set',
      description: 'Bosch professional power drill set with 50 accessories including drill bits, screwdriver bits, and carrying case. Cordless with 2 batteries.',
      categorySlug: 'tools', condition: 'GOOD', dailyPrice: 250, securityDeposit: 3000,
      owner: owner1, stateCode: 'DL', cityKey: 'DL-Rohini', brand: 'Bosch', model: 'GSB 18V-28', purchaseYear: 2023,
    },
    {
      title: 'Electric Guitar', slug: 'electric-guitar',
      description: 'Fender Squier Stratocaster electric guitar with amplifier and accessories. Perfect for beginners and intermediate players.',
      categorySlug: 'musical-instruments', condition: 'LIKE_NEW', dailyPrice: 350, securityDeposit: 5000,
      owner: owner2, stateCode: 'MH', cityKey: 'MH-Mumbai', brand: 'Fender', model: 'Squier Strat', purchaseYear: 2023,
    },
    {
      title: 'DSLR Nikon D850', slug: 'dslr-nikon-d850',
      description: 'Nikon D850 full-frame DSLR with 45.7MP sensor and 24-70mm f/2.8 lens. Professional-grade camera for weddings and events.',
      categorySlug: 'cameras', condition: 'GOOD', dailyPrice: 1500, securityDeposit: 40000,
      owner: owner1, stateCode: 'DL', cityKey: 'DL-New Delhi', brand: 'Nikon', model: 'D850', purchaseYear: 2021,
    },
    {
      title: 'Gaming Laptop ASUS ROG', slug: 'gaming-laptop-asus-rog',
      description: 'ASUS ROG Strix G16 gaming laptop with RTX 4060, Intel i7-13650HX, 16GB RAM. Ultimate gaming and streaming machine.',
      categorySlug: 'laptops', condition: 'LIKE_NEW', dailyPrice: 1200, securityDeposit: 35000,
      owner: owner3, stateCode: 'KA', cityKey: 'KA-Bangalore', brand: 'ASUS', model: 'ROG Strix G16', purchaseYear: 2024,
    },
    {
      title: 'Office Chair', slug: 'office-chair',
      description: 'Ergonomic office chair with lumbar support, adjustable armrests, and breathable mesh back. Ideal for long working hours.',
      categorySlug: 'furniture', condition: 'GOOD', dailyPrice: 100, securityDeposit: 2000,
      owner: owner2, stateCode: 'MH', cityKey: 'MH-Pune', brand: 'Featherlite', model: 'Ergo Pro', purchaseYear: 2022,
    },
    {
      title: 'Camping Stove', slug: 'camping-stove',
      description: 'Portable gas camping stove with 2 burners, auto-ignition, and wind shield. Comes with gas cylinder and carry bag.',
      categorySlug: 'camping', condition: 'NEW', dailyPrice: 150, securityDeposit: 1000,
      owner: owner2, stateCode: 'RJ', cityKey: 'RJ-Udaipur', brand: 'Coleman', model: ' Triton Series', purchaseYear: 2024,
    },
    {
      title: 'Bicycle', slug: 'bicycle',
      description: 'Hybrid city bicycle with 7-speed gears, comfortable saddle, and front basket. Perfect for daily commute and leisure rides.',
      categorySlug: 'bikes', condition: 'GOOD', dailyPrice: 100, securityDeposit: 2000,
      owner: owner1, stateCode: 'DL', cityKey: 'DL-Dwarka', brand: 'Hercules', model: 'Roadeo', purchaseYear: 2023,
    },
    {
      title: 'GoPro Hero 12', slug: 'gopro-hero-12',
      description: 'GoPro Hero 12 Black action camera with 5.3K video, HyperSmooth 6.0 stabilization, and waterproof design. Includes mounts and accessories.',
      categorySlug: 'cameras', condition: 'LIKE_NEW', dailyPrice: 500, securityDeposit: 8000,
      owner: owner3, stateCode: 'KA', cityKey: 'KA-Mysore', brand: 'GoPro', model: 'Hero 12 Black', purchaseYear: 2024,
    },
    {
      title: 'Bluetooth Speaker JBL', slug: 'bluetooth-speaker-jbl',
      description: 'JBL PartyBox 310 portable Bluetooth speaker with powerful bass, light effects, and 18-hour battery life. Great for parties and outdoor events.',
      categorySlug: 'electronics', condition: 'GOOD', dailyPrice: 400, securityDeposit: 4000,
      owner: owner2, stateCode: 'TN', cityKey: 'TN-Coimbatore', brand: 'JBL', model: 'PartyBox 310', purchaseYear: 2023,
    },
    {
      title: 'Treadmill', slug: 'treadmill',
      description: 'Motorized treadmill with 3HP motor, incline up to 15%, speed up to 14km/h. Foldable design with heart rate monitor and built-in speakers.',
      categorySlug: 'sports', condition: 'GOOD', dailyPrice: 300, securityDeposit: 5000,
      owner: owner2, stateCode: 'MH', cityKey: 'MH-Mumbai', brand: 'PowerMax', model: 'TDA-250', purchaseYear: 2023,
    },
    {
      title: 'Telescope', slug: 'telescope',
      description: 'Celestron AstroMaster 130EQ telescope with equatorial mount. Perfect for stargazing and celestial observation. Includes 2 eyepieces.',
      categorySlug: 'electronics', condition: 'LIKE_NEW', dailyPrice: 350, securityDeposit: 6000,
      owner: owner1, stateCode: 'DL', cityKey: 'DL-New Delhi', brand: 'Celestron', model: 'AstroMaster 130EQ', purchaseYear: 2023,
    },
    {
      title: 'VR Headset Meta Quest', slug: 'vr-headset-meta-quest',
      description: 'Meta Quest 3 VR headset with 128GB storage, mixed reality passthrough, and Touch Plus controllers. Includes carrying case.',
      categorySlug: 'electronics', condition: 'NEW', dailyPrice: 450, securityDeposit: 15000,
      owner: owner3, stateCode: 'KA', cityKey: 'KA-Bangalore', brand: 'Meta', model: 'Quest 3', purchaseYear: 2024,
    },
    {
      title: 'Folding Table', slug: 'folding-table',
      description: '6-foot folding table, heavy-duty steel frame with waterproof top. Ideal for events, exhibitions, and temporary setups.',
      categorySlug: 'furniture', condition: 'GOOD', dailyPrice: 80, securityDeposit: 1000,
      owner: owner2, stateCode: 'MH', cityKey: 'MH-Nagpur', brand: 'National', model: '6ft Folding', purchaseYear: 2022,
    },
    {
      title: 'Ring Light', slug: 'ring-light',
      description: '18-inch ring light with tripod stand, phone holder, and remote control. Adjustable color temperature and brightness. Perfect for content creators.',
      categorySlug: 'electronics', condition: 'NEW', dailyPrice: 150, securityDeposit: 2000,
      owner: owner1, stateCode: 'TN', cityKey: 'TN-Chennai', brand: 'Godox', model: 'LR180C', purchaseYear: 2024,
    },
    {
      title: 'Kayak', slug: 'kayak',
      description: 'Inflatable 2-person kayak with paddles, pump, and repair kit. Durable PVC construction suitable for lakes and calm rivers.',
      categorySlug: 'sports', condition: 'GOOD', dailyPrice: 500, securityDeposit: 5000,
      owner: owner2, stateCode: 'KL', cityKey: 'KL-Kochi', brand: 'Intex', model: 'Explorer K2', purchaseYear: 2023,
    },
    {
      title: 'Badminton Set', slug: 'badminton-set',
      description: 'Professional badminton set with 4 rackets, 12 shuttlecocks, net with posts, and carrying bag. Tournament-grade quality.',
      categorySlug: 'sports', condition: 'NEW', dailyPrice: 200, securityDeposit: 1500,
      owner: owner1, stateCode: 'DL', cityKey: 'DL-Rohini', brand: 'Yonex', model: 'Astrox Pro Set', purchaseYear: 2024,
    },
    {
      title: 'Party Speaker', slug: 'party-speaker',
      description: 'JBL Boombox 3 portable party speaker with IP67 waterproof rating, 24-hour battery, and powerful JBL Pro Sound.',
      categorySlug: 'party-equipment', condition: 'LIKE_NEW', dailyPrice: 350, securityDeposit: 5000,
      owner: owner2, stateCode: 'MH', cityKey: 'MH-Mumbai', brand: 'JBL', model: 'Boombox 3', purchaseYear: 2024,
    },
    {
      title: 'Welding Machine', slug: 'welding-machine',
      description: 'ARC welding machine 200A with accessories including electrodes, helmet, gloves, and chipping hammer. Industrial grade.',
      categorySlug: 'tools', condition: 'GOOD', dailyPrice: 400, securityDeposit: 5000,
      owner: owner3, stateCode: 'GJ', cityKey: 'GJ-Ahmedabad', brand: 'Bosch', model: 'GWS 200', purchaseYear: 2022,
    },
    {
      title: 'Sewing Machine', slug: 'sewing-machine',
      description: 'Brother computerized sewing machine with 80 built-in stitches, LCD display, and extension table. Great for tailoring and crafts.',
      categorySlug: 'home-appliances', condition: 'GOOD', dailyPrice: 150, securityDeposit: 3000,
      owner: owner1, stateCode: 'WB', cityKey: 'WB-Kolkata', brand: 'Brother', model: 'CS8080', purchaseYear: 2023,
    },
    {
      title: 'Piano Keyboard', slug: 'piano-keyboard',
      description: 'Yamaha PSR-E373 61-key portable keyboard with 622 voices, 165 styles, and education suite. Includes stand and power adapter.',
      categorySlug: 'musical-instruments', condition: 'LIKE_NEW', dailyPrice: 300, securityDeposit: 5000,
      owner: owner3, stateCode: 'TS', cityKey: 'TS-Hyderabad', brand: 'Yamaha', model: 'PSR-E373', purchaseYear: 2023,
    },
    {
      title: 'Drone Mini', slug: 'drone-mini',
      description: 'DJI Mini 3 Fly More Combo with 4K/60fps camera, 38-min flight time, and GPS return-to-home. Ultra-lightweight under 249g.',
      categorySlug: 'cameras', condition: 'NEW', dailyPrice: 1000, securityDeposit: 15000,
      owner: owner1, stateCode: 'UP', cityKey: 'UP-Lucknow', brand: 'DJI', model: 'Mini 3', purchaseYear: 2024,
    },
    {
      title: 'Surfboard', slug: 'surfboard',
      description: '8-foot foam surfboard, beginner-friendly with soft deck and tri-fin setup. Includes leash and board bag.',
      categorySlug: 'sports', condition: 'GOOD', dailyPrice: 400, securityDeposit: 3000,
      owner: owner2, stateCode: 'KL', cityKey: 'KL-Kozhikode', brand: 'Wavestorm', model: '8ft Classic', purchaseYear: 2023,
    },
    {
      title: 'Film Camera', slug: 'film-camera',
      description: 'Canon AE-1 35mm film SLR camera with 50mm f/1.8 lens. Classic analog camera for film photography enthusiasts. Includes camera bag.',
      categorySlug: 'cameras', condition: 'GOOD', dailyPrice: 200, securityDeposit: 5000,
      owner: owner3, stateCode: 'TN', cityKey: 'TN-Madurai', brand: 'Canon', model: 'AE-1', purchaseYear: 1980,
    },
  ]

  const products: any[] = []
  for (const p of productsData) {
    const product = await db.product.create({
      data: {
        ownerId: p.owner.id,
        categoryId: categories[p.categorySlug].id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        condition: p.condition,
        brand: p.brand,
        model: p.model,
        purchaseYear: p.purchaseYear,
        dailyPrice: p.dailyPrice,
        securityDeposit: p.securityDeposit,
        minRentalDays: 1,
        maxRentalDays: 30,
        stateId: states[p.stateCode].id,
        cityId: cities[p.cityKey].id,
        status: 'APPROVED',
      },
    })
    products.push(product)
  }

  // ─── 6. Rentals ───────────────────────────────────────────
  console.log('→ Creating rentals...')

  const rentals: any[] = []

  // Helper to create rental
  async function createRental(data: {
    customer: any, owner: any, product: any,
    startDate: Date, endDate: Date,
    status: string, actualReturnDate?: Date,
    cancellationReason?: string,
  }) {
    const rentalDays = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / 86400000)
    const dailyRate = data.product.dailyPrice
    const rentalAmount = rentalDays * dailyRate
    const securityDeposit = data.product.securityDeposit
    const platformFee = Math.round(rentalAmount * 0.1 * 100) / 100
    const tax = Math.round(rentalAmount * 0.18 * 100) / 100
    const totalAmount = rentalAmount + platformFee + tax + securityDeposit

    const rental = await db.rental.create({
      data: {
        customerId: data.customer.id,
        ownerId: data.owner.id,
        productId: data.product.id,
        startDate: data.startDate,
        endDate: data.endDate,
        actualReturnDate: data.actualReturnDate ?? null,
        rentalDays,
        dailyRate,
        rentalAmount,
        securityDeposit,
        platformFee,
        tax,
        totalAmount,
        status: data.status,
        cancellationReason: data.cancellationReason ?? null,
      },
    })
    rentals.push(rental)
    return rental
  }

  // 3 ACTIVE rentals
  await createRental({
    customer: cust1, owner: owner1, product: products[0], // Canon EOS R10
    startDate: daysAgo(3), endDate: daysFromNow(4), status: 'ACTIVE',
  })
  await createRental({
    customer: cust2, owner: owner2, product: products[1], // PS5
    startDate: daysAgo(2), endDate: daysFromNow(5), status: 'ACTIVE',
  })
  await createRental({
    customer: cust3, owner: owner3, product: products[2], // MacBook Pro
    startDate: daysAgo(1), endDate: daysFromNow(6), status: 'ACTIVE',
  })

  // 4 COMPLETED rentals
  const completedR1 = await createRental({
    customer: cust4, owner: owner1, product: products[3], // Mountain Bike
    startDate: daysAgo(20), endDate: daysAgo(15), status: 'COMPLETED', actualReturnDate: daysAgo(15),
  })
  const completedR2 = await createRental({
    customer: cust5, owner: owner2, product: products[4], // Camping Tent
    startDate: daysAgo(30), endDate: daysAgo(25), status: 'COMPLETED', actualReturnDate: daysAgo(25),
  })
  const completedR3 = await createRental({
    customer: cust1, owner: owner3, product: products[5], // DJI Drone
    startDate: daysAgo(25), endDate: daysAgo(20), status: 'COMPLETED', actualReturnDate: daysAgo(20),
  })
  const completedR4 = await createRental({
    customer: cust2, owner: owner1, product: products[7], // Power Drill
    startDate: daysAgo(15), endDate: daysAgo(12), status: 'COMPLETED', actualReturnDate: daysAgo(12),
  })

  // 2 OWNER_PENDING
  await createRental({
    customer: cust3, owner: owner2, product: products[8], // Electric Guitar
    startDate: daysFromNow(2), endDate: daysFromNow(5), status: 'OWNER_PENDING',
  })
  await createRental({
    customer: cust4, owner: owner1, product: products[17], // Telescope
    startDate: daysFromNow(3), endDate: daysFromNow(7), status: 'OWNER_PENDING',
  })

  // 2 OWNER_ACCEPTED
  await createRental({
    customer: cust5, owner: owner3, product: products[19], // VR Headset
    startDate: daysFromNow(1), endDate: daysFromNow(4), status: 'OWNER_ACCEPTED',
  })
  await createRental({
    customer: cust1, owner: owner2, product: products[14], // GoPro
    startDate: daysFromNow(2), endDate: daysFromNow(5), status: 'OWNER_ACCEPTED',
  })

  // 2 RETURN_PENDING
  await createRental({
    customer: cust2, owner: owner1, product: products[9], // DSLR Nikon
    startDate: daysAgo(5), endDate: daysAgo(1), status: 'RETURN_PENDING',
  })
  await createRental({
    customer: cust3, owner: owner3, product: products[11], // Gaming Laptop
    startDate: daysAgo(7), endDate: daysAgo(1), status: 'RETURN_PENDING',
  })

  // 2 OVERDUE
  await createRental({
    customer: cust4, owner: owner1, product: products[13], // Bicycle
    startDate: daysAgo(12), endDate: daysAgo(2), status: 'OVERDUE',
  })
  await createRental({
    customer: cust5, owner: owner2, product: products[15], // JBL Speaker
    startDate: daysAgo(10), endDate: daysAgo(3), status: 'OVERDUE',
  })

  // 2 CANCELLED
  await createRental({
    customer: cust1, owner: owner2, product: products[20], // Folding Table
    startDate: daysFromNow(5), endDate: daysFromNow(8), status: 'CANCELLED',
    cancellationReason: 'Customer changed plans',
  })
  await createRental({
    customer: cust3, owner: owner1, product: products[22], // Badminton Set
    startDate: daysFromNow(3), endDate: daysFromNow(6), status: 'CANCELLED',
    cancellationReason: 'Product unavailable on selected dates',
  })

  // 3 PENDING_PAYMENT
  await createRental({
    customer: cust4, owner: owner3, product: products[24], // Welding Machine
    startDate: daysFromNow(2), endDate: daysFromNow(5), status: 'PENDING_PAYMENT',
  })
  await createRental({
    customer: cust5, owner: owner1, product: products[25], // Sewing Machine
    startDate: daysFromNow(1), endDate: daysFromNow(4), status: 'PENDING_PAYMENT',
  })
  await createRental({
    customer: cust1, owner: owner3, product: products[26], // Piano Keyboard
    startDate: daysFromNow(3), endDate: daysFromNow(7), status: 'PENDING_PAYMENT',
  })

  // ─── 7. Reviews (for completed rentals) ───────────────────
  console.log('→ Creating reviews...')
  const reviewsData = [
    { rental: completedR1, reviewer: cust4, target: owner1, product: products[3], rating: 5, comment: 'Excellent mountain bike! Well maintained and great condition. Owner was very helpful with pickup and return.' },
    { rental: completedR2, reviewer: cust5, target: owner2, product: products[4], rating: 4, comment: 'Camping tent was in great condition. All accessories were included as described. Would rent again.' },
    { rental: completedR3, reviewer: cust1, target: owner3, product: products[5], rating: 5, comment: 'DJI drone was amazing! Captured some incredible footage. Owner provided a quick tutorial which was very helpful.' },
    { rental: completedR4, reviewer: cust2, target: owner1, product: products[7], rating: 4, comment: 'Power drill set was very useful for my home renovation project. All bits and accessories were included.' },
    { rental: completedR1, reviewer: owner1, target: cust4, product: products[3], rating: 5, comment: 'Great customer! Returned the bike on time and in excellent condition.' },
    { rental: completedR2, reviewer: owner2, target: cust5, product: products[4], rating: 4, comment: 'Good customer. Tent was returned clean and well-packed.' },
    { rental: completedR3, reviewer: owner3, target: cust1, product: products[5], rating: 5, comment: 'Very responsible renter. Drone returned in perfect condition with all accessories.' },
    { rental: completedR4, reviewer: owner1, target: cust2, product: products[7], rating: 4, comment: 'Polite and punctual customer. Would rent to again.' },
    { rental: completedR1, reviewer: cust4, target: owner1, product: products[3], rating: 4, comment: 'Smooth rental experience. The bike was perfect for my weekend trip to Aravalli hills.' },
    { rental: completedR2, reviewer: cust5, target: owner2, product: products[4], rating: 3, comment: 'Decent experience. Tent was good but delivery was slightly delayed.' },
    { rental: completedR3, reviewer: cust1, target: owner3, product: products[5], rating: 5, comment: 'Absolutely fantastic drone rental. The owner was super professional and responsive.' },
    { rental: completedR4, reviewer: cust2, target: owner1, product: products[7], rating: 3, comment: 'Drill set worked well. Minor issue with one battery not holding charge fully.' },
    { rental: completedR1, reviewer: cust4, target: owner1, product: products[3], rating: 5, comment: 'Best rental experience on RentCart so far! Highly recommend this owner.' },
    { rental: completedR2, reviewer: cust5, target: owner2, product: products[4], rating: 4, comment: 'Great value for money. The tent set had everything we needed for our camping trip.' },
    { rental: completedR3, reviewer: cust1, target: owner3, product: products[5], rating: 4, comment: 'Drone was in excellent condition. Clear instructions provided by the owner.' },
  ]

  for (const r of reviewsData) {
    await db.review.create({
      data: {
        rentalId: r.rental.id,
        reviewerId: r.reviewer.id,
        targetId: r.target.id,
        productId: r.product.id,
        rating: r.rating,
        comment: r.comment,
      },
    })
  }

  // ─── 8. Coupons ────────────────────────────────────────────
  console.log('→ Creating coupons...')
  await db.coupon.createMany({
    data: [
      {
        code: 'SAVE10',
        type: 'PERCENTAGE',
        value: 10,
        minOrder: 500,
        maxDiscount: 2000,
        validFrom: daysAgo(30),
        validUntil: daysFromNow(60),
        usageLimit: 100,
        perUserLimit: 1,
        createdById: admin.id,
        isActive: true,
      },
      {
        code: 'FLAT100',
        type: 'FIXED',
        value: 100,
        minOrder: 300,
        validFrom: daysAgo(15),
        validUntil: daysFromNow(90),
        usageLimit: 200,
        perUserLimit: 2,
        createdById: admin.id,
        isActive: true,
      },
    ],
  })

  // ─── 9. Notifications ─────────────────────────────────────
  console.log('→ Creating notifications...')
  await db.notification.createMany({
    data: [
      { userId: owner1.id, title: 'New Rental Request', message: 'Amit Kumar has requested to rent your Canon EOS R10 Camera.', type: 'RENTAL_REQUEST' },
      { userId: cust1.id, title: 'Rental Accepted', message: 'Your rental request for Canon EOS R10 Camera has been accepted.', type: 'RENTAL_UPDATE' },
      { userId: owner2.id, title: 'New Rental Request', message: 'Sneha Iyer has requested to rent your Sony PlayStation 5.', type: 'RENTAL_REQUEST' },
      { userId: cust2.id, title: 'Rental Started', message: 'Your rental for Sony PlayStation 5 has started. Enjoy!', type: 'RENTAL_UPDATE' },
      { userId: owner3.id, title: 'New Rental Request', message: 'Rohan Das has requested to rent your MacBook Pro M3.', type: 'RENTAL_REQUEST' },
      { userId: cust4.id, title: 'Return Reminder', message: 'Your rental for DSLR Nikon D850 is due for return tomorrow.', type: 'RETURN' },
      { userId: cust5.id, title: 'Overdue Notice', message: 'Your rental for JBL Bluetooth Speaker is overdue. Please return it as soon as possible.', type: 'OVERDUE' },
      { userId: owner1.id, title: 'Product Approved', message: 'Your product Canon EOS R10 Camera has been approved and is now live.', type: 'PRODUCT_UPDATE' },
      { userId: cust3.id, title: 'Payment Received', message: 'Payment of ₹8,160 for DJI Drone rental has been received.', type: 'PAYMENT' },
      { userId: admin.id, title: 'New Dispute Filed', message: 'A new dispute has been filed for rental #RNT001. Please review.', type: 'DISPUTE', data: '{"rentalId": "RNT001"}' },
    ],
  })

  // ─── 10. Favorites ────────────────────────────────────────
  console.log('→ Creating favorites...')
  await db.favorite.createMany({
    data: [
      { userId: cust1.id, productId: products[0].id },  // Canon EOS R10
      { userId: cust1.id, productId: products[2].id },  // MacBook Pro
      { userId: cust1.id, productId: products[5].id },  // DJI Drone
      { userId: cust2.id, productId: products[1].id },  // PS5
      { userId: cust2.id, productId: products[8].id },  // Electric Guitar
      { userId: cust2.id, productId: products[17].id }, // Telescope
      { userId: cust3.id, productId: products[2].id },  // MacBook Pro
      { userId: cust3.id, productId: products[10].id }, // Gaming Laptop
      { userId: cust3.id, productId: products[19].id }, // VR Headset
      { userId: cust4.id, productId: products[5].id },  // DJI Drone
      { userId: cust4.id, productId: products[9].id },  // DSLR Nikon
      { userId: cust4.id, productId: products[28].id }, // Drone Mini
      { userId: cust5.id, productId: products[4].id },  // Camping Tent
      { userId: cust5.id, productId: products[3].id },  // Mountain Bike
      { userId: cust5.id, productId: products[21].id }, // Kayak
    ],
  })

  console.log('✅ Seed completed successfully!')
  console.log(`   States: ${Object.keys(states).length}`)
  console.log(`   Cities: ${Object.keys(cities).length}`)
  console.log(`   Areas: ${allAreas.length}`)
  console.log(`   Categories: ${Object.keys(categories).length}`)
  console.log(`   Users: ${users.length}`)
  console.log(`   Products: ${products.length}`)
  console.log(`   Rentals: ${rentals.length}`)
  console.log(`   Reviews: ${reviewsData.length}`)
  console.log(`   Coupons: 2`)
  console.log(`   Notifications: 10`)
  console.log(`   Favorites: 15`)
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
