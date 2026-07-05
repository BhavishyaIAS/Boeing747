import type { NodeType } from "@prisma/client";

/**
 * The official APPSC Group-1 syllabus (Prelims + Mains, 2018 notification)
 * encoded as a node tree. Seeded into `syllabus_node` + `syllabus_closure`.
 *
 * `key` is a slug fragment, unique among siblings; the full slug is the ancestor
 * keys joined by "-", so every node has a globally-unique, readable slug.
 */
export interface RawNode {
  key: string;
  title: string;
  type: NodeType;
  summary?: string;
  examAngle?: string;
  children?: RawNode[];
}

const S: NodeType = "SUBJECT";
const U: NodeType = "UNIT";
const T: NodeType = "THEME";

export const appscGroup1Syllabus: RawNode[] = [
  // ─────────────────────────── PRELIMS ───────────────────────────
  {
    key: "prelims-gs",
    title: "Prelims Paper I — General Studies",
    type: S,
    examAngle: "120 marks · 120 questions · 120 minutes (objective).",
    summary: "History & Culture; Constitution & Polity; Economy & Planning; Geography.",
    children: [
      {
        key: "history",
        title: "History & Culture",
        type: U,
        children: [
          { key: "ancient", title: "Ancient India — IVC to the Guptas", type: T, summary: "Indus Valley Civilization; Vedic Age & Mahajanapadas; Jainism & Buddhism; Magadha, Mauryas, foreign invasions, Kushans; Satavahanas, Sangam Age, Sungas, Gupta Empire — administration, society, religion, economy, art, architecture, literature, science." },
          { key: "south-dynasties", title: "Early Medieval & South Indian Dynasties", type: T, summary: "Kanauj; Badami & Eastern Chalukyas, Rashtrakutas, Kalyani Chalukyas, Cholas, Hoysalas, Yadavas, Kakatiyas and the Reddis." },
          { key: "sultanate-mughals", title: "Delhi Sultanate, Vijayanagara & Mughals", type: T, summary: "Delhi Sultanate, Vijayanagara & Mughal empires; Bhakti movement & Sufism — administration, economy, society, religion, literature, arts and architecture." },
          { key: "european-companies", title: "European Companies & Colonial India", type: T, summary: "European trading companies and their struggle for supremacy (Bengal, Bombay, Madras, Mysore, Andhra, Nizam); Governor-Generals and Viceroys." },
          { key: "1857-reforms", title: "Revolt of 1857 & Reform Movements", type: T, summary: "1857 — origin, nature, causes, consequences and significance; 19th-century religious & social reform; freedom movement; revolutionaries in India and abroad." },
          { key: "gandhi-independence", title: "Gandhi, National Leaders & Post-Independence", type: T, summary: "Gandhi's thought, principles & satyagrahas; Sardar Patel, Subhas Chandra Bose; Dr B.R. Ambedkar and the making of the Constitution; reorganization of states." },
        ],
      },
      {
        key: "polity",
        title: "Constitution, Polity, Social Justice & International Relations",
        type: U,
        children: [
          { key: "constitution", title: "Indian Constitution", type: T, summary: "Evolution, features, Preamble, Fundamental Rights & Duties, DPSP, amendments, significant provisions and basic structure." },
          { key: "federalism", title: "Union, States & Federalism", type: T, summary: "Functions & responsibilities of the Union and States; Parliament & State Legislatures — structure, powers, privileges; federal challenges; devolution of powers & finances." },
          { key: "constitutional-authorities", title: "Constitutional Authorities & Panchayati Raj", type: T, summary: "Powers, functions & responsibilities of constitutional authorities; Panchayati Raj; public policy and governance." },
          { key: "lpg-bodies", title: "LPG & Governance Bodies", type: T, summary: "Impact of Liberalization, Privatization & Globalization on governance; statutory, regulatory and quasi-judicial bodies." },
          { key: "rights", title: "Rights Issues", type: T, summary: "Human rights, women's rights, SC/ST rights, child rights." },
          { key: "foreign-policy", title: "Foreign Policy & International Relations", type: T, summary: "India's foreign policy; important institutions, agencies & fora; central and state policies and programmes." },
        ],
      },
      {
        key: "economy",
        title: "Indian & Andhra Pradesh Economy and Planning",
        type: U,
        children: [
          { key: "development-planning", title: "Indian Economy & Planning", type: T, summary: "Developing economy; planning since independence; NITI Aayog; growth vs distributive justice; HDI; environmental degradation; sustainable development." },
          { key: "national-income", title: "National Income, Poverty & Employment", type: T, summary: "National income concepts; demographic issues; poverty & inequality; occupational structure & unemployment; rural & urban development." },
          { key: "agri-industry", title: "Agriculture & Industry", type: T, summary: "Agriculture, irrigation, inputs, policy, land reforms, MSP, food security; industrial policy, Make in India, SEZs & corridors; economic reforms; trade & BoP; WTO." },
          { key: "money-finance", title: "Money, Banking & Public Finance", type: T, summary: "RBI & monetary policy; banking reforms; NPAs; financial markets, SEBI; tax system & GST; centre-state finance; finance commissions; public debt; fiscal policy & budget." },
          { key: "ap-economy", title: "AP Economy after Bifurcation", type: T, summary: "Features of the AP economy post-2014; impact of bifurcation on resources & revenue; river-water disputes; infrastructure, IT & e-governance; agriculture, industry & social sector." },
          { key: "ap-reorg-act", title: "AP Reorganisation Act, 2014 — Economic Issues", type: T, summary: "Economic issues from bifurcation; central assistance for a new capital; backward-district development; special status controversy." },
        ],
      },
      {
        key: "geography",
        title: "Geography",
        type: U,
        children: [
          { key: "general", title: "General Geography", type: T, summary: "Earth in the solar system; motions; internal structure; landforms; atmosphere & climate; oceans; hydrological disasters; resources." },
          { key: "physical", title: "Physical Geography", type: T, summary: "World, India & AP — physical divisions; earthquakes, landslides; drainage; monsoon; vegetation; parks & sanctuaries; soils, rocks & minerals." },
          { key: "social", title: "Social Geography", type: T, summary: "Distribution, density, growth, sex-ratio, literacy, occupational structure, SC/ST population, rural-urban components, urbanization & migration." },
          { key: "economic", title: "Economic Geography", type: T, summary: "Major sectors — agriculture, industry, services; basic industries; transport & trade patterns and issues." },
        ],
      },
    ],
  },
  {
    key: "prelims-aptitude",
    title: "Prelims Paper II — General Aptitude",
    type: S,
    examAngle: "120 marks · 120 questions · 120 minutes (objective).",
    children: [
      {
        key: "mental-abilities",
        title: "General Mental & Psychological Abilities",
        type: U,
        children: [
          { key: "reasoning", title: "Logical Reasoning & Analytical Ability", type: T },
          { key: "series-coding", title: "Number Series, Coding–Decoding & Relations", type: T },
          { key: "clocks-calendars", title: "Clocks, Calendars, Age & Number System", type: T },
          { key: "arithmetic", title: "Ratio, Percentage, Interest, Profit & Loss", type: T },
          { key: "time-distance", title: "Time & Work, Time, Speed & Distance", type: T },
          { key: "mensuration", title: "Mensuration & Geometry", type: T },
          { key: "algebra-data", title: "Algebra, Data Interpretation & Probability", type: T },
          { key: "emotional-intelligence", title: "Emotional Intelligence", type: T, summary: "Understanding & analyzing emotions; dimensions; coping with emotions, empathy and stress." },
          { key: "social-intelligence", title: "Social Intelligence & Personality", type: T, summary: "Interpersonal skills; decision making; critical thinking; problem solving; assessment of personality." },
        ],
      },
      {
        key: "science-tech",
        title: "Science & Technology",
        type: U,
        children: [
          { key: "st-nature", title: "Science & Technology — Nature & Scope", type: T, summary: "Relevance to daily life; national policy on S&T & innovation; institutes; contributions of prominent Indian scientists." },
          { key: "ict", title: "ICT & Cyber Security", type: T, summary: "Nature & scope of ICT; ICT in daily life, industry & governance; e-governance; netiquette; cyber-security and national cyber-crime policy." },
          { key: "space-defence", title: "Space & Defence Technology", type: T, summary: "Indian space programme; ISRO activities & achievements; IRNSS, IRS satellites; satellites for defence & academics; DRDO." },
          { key: "energy", title: "Energy Requirement & Efficiency", type: T, summary: "India's energy needs & deficit; resources & dependence; energy policy; solar, wind & nuclear energy." },
          { key: "environment", title: "Environmental Science, Biotech & Nanotech", type: T, summary: "Environment issues & law; biodiversity; climate change & India's commitments; forests & wildlife; pollution & global warming; biotech & nanotech; genetic engineering." },
        ],
      },
      { key: "current-events", title: "Current Events of Regional, National & International Importance", type: U },
    ],
  },

  // ─────────────────────────── MAINS ───────────────────────────
  {
    key: "mains-essay",
    title: "Mains Paper I — General Essay",
    type: S,
    examAngle: "150 marks · three essays (~800 words), one from each section.",
    children: [
      { key: "current-affairs", title: "Current Affairs", type: T },
      { key: "socio-political", title: "Socio-political Issues", type: T },
      { key: "socio-economic", title: "Socio-economic Issues", type: T },
      { key: "socio-environmental", title: "Socio-environmental Issues", type: T },
      { key: "cultural-historical", title: "Cultural & Historical Aspects", type: T },
      { key: "civic-awareness", title: "Issues of Civic Awareness", type: T },
      { key: "reflective", title: "Reflective Topics", type: T },
    ],
  },
  {
    key: "mains-hcg",
    title: "Mains Paper II — History, Culture & Geography (India & AP)",
    type: S,
    examAngle: "150 marks · 150 minutes (descriptive).",
    children: [
      {
        key: "india-history",
        title: "History & Culture of India",
        type: U,
        children: [
          { key: "prehistory-guptas", title: "Prehistory to the Guptas", type: T, summary: "Pre-historic cultures; IVC; Vedic culture; Mahajanapadas; Jainism & Buddhism; Magadha & Mauryas; Ashoka's Dharma; Kushans; Satavahanas, Sangam Age, Sungas, Guptas, Kanauj; foreign travellers." },
          { key: "pallavas-sultanate", title: "South Indian Kingdoms & Delhi Sultanate", type: T, summary: "Pallavas, Chalukyas, Rashtrakutas, Cholas; Delhi Sultanates; advent of Islam; Bhakti & Sufi movements; Kakatiyas, Vijayanagara, Bahmanis, Qutub Shahis." },
          { key: "mughals-europeans", title: "Mughals, Marathas & Europeans", type: T, summary: "Mughal administration & culture; Shivaji & the Marathas; advent of Europeans; rise of the East India Company; Christian missionaries." },
          { key: "british-nationalism", title: "British Rule & Rise of Nationalism", type: T, summary: "British rule 1757–1856; land-revenue settlements; 1857 revolt; socio-religious reform (Roy, Vivekananda, Besant); INC; Home Rule; Self-Respect movement; Gandhi, Bose, Patel; Quit India; Ambedkar." },
          { key: "freedom-partition", title: "Freedom Struggle & Post-Independence", type: T, summary: "Three phases of nationalism (1885–1947); peasant, women, tribal & worker movements; communalism; independence & partition; linguistic reorganization; integration of states; foreign policy." },
        ],
      },
      {
        key: "ap-history",
        title: "History & Culture of Andhra Pradesh",
        type: U,
        children: [
          { key: "ap-ancient", title: "Ancient Andhra", type: T, summary: "Satavahanas, Ikshvakus, Salankayanas, Pallavas, Vishnukundins; Eastern Chalukyas, Rashtrakutas, Renati Cholas — society, religion, Telugu script & literature, art & architecture; Jainism & Buddhism in Andhra." },
          { key: "ap-medieval", title: "Medieval Andhra", type: T, summary: "Socio-cultural & religious conditions 1000–1565 AD; Telugu language & literature (Kavitraya, Ashtadiggajas); art under Kakatiyas, Reddis, Gajapatis, Vijayanagara; Qutub Shahi contributions; Vemana." },
          { key: "ap-modern", title: "Modern Andhra", type: T, summary: "European trade; Company rule; missionaries; C.P. Brown, Munro, Mackenzie; zamindari & polegar systems; social reformers — Gurajada, Veeresalingam, Gidugu Ramamurthy; library movement." },
          { key: "ap-nationalist", title: "Nationalist Movement in Andhra", type: T, summary: "Andhra leaders; Justice Party & non-Brahmin movement; nationalist literature; Andhra Mahasabhas; Alluri Sitarama Raju; Potti Sreeramulu; formation of Andhra State (1953) & AP (1956)." },
          { key: "ap-bifurcation", title: "Bifurcation of Andhra Pradesh", type: T, summary: "Administrative, economic, social, political, cultural & legal implications; new capital; division of employees; river-water sharing; AP Reorganisation Act, 2014." },
        ],
      },
      {
        key: "geography",
        title: "Geography: India & Andhra Pradesh",
        type: U,
        children: [
          { key: "physical-resources", title: "Physical Features & Resources", type: T, summary: "Landforms, climate, soils, rivers, geology, minerals, dams, forests, flora & fauna in India and AP." },
          { key: "economic-geo", title: "Economic Geography", type: T, summary: "Agriculture, livestock, forestry, fishery, mining, manufacturing, industries, trade, transport & communication." },
          { key: "social-geo", title: "Social Geography", type: T, summary: "Population distribution & movement; density; age, sex, caste, tribe, religion, language; urban migration; education." },
          { key: "flora-fauna", title: "Fauna & Floral Geography", type: T, summary: "Wild animals, birds, reptiles, mammals, trees and plants." },
          { key: "environmental-geo", title: "Environmental Geography", type: T, summary: "Sustainable development; weather phenomena; natural hazards (earthquakes, landslides, floods, cyclones); disaster management; pollution." },
        ],
      },
    ],
  },
  {
    key: "mains-polity",
    title: "Mains Paper III — Polity, Constitution, Governance, Law & Ethics",
    type: S,
    examAngle: "150 marks · 150 minutes (descriptive).",
    children: [
      {
        key: "polity-constitution",
        title: "Indian Polity & Constitution",
        type: U,
        children: [
          { key: "salient-features", title: "Constitution & Its Salient Features", type: T, summary: "Salient features; functions & duties of the Union and State governments." },
          { key: "federal-structure", title: "Federal Structure & Distribution of Powers", type: T, summary: "Federal challenges; role of the Governor; Union, State & Concurrent lists; issues & challenges." },
          { key: "local-governance", title: "Local Governance (73rd & 74th Amendments)", type: T, summary: "Rural & urban local governance; constitutional authorities and their role." },
          { key: "legislatures", title: "Parliament & State Legislatures", type: T, summary: "Structure, functioning, conduct of business, powers & privileges and related issues." },
          { key: "judiciary", title: "Judiciary in India", type: T, summary: "Structure & functions; emergency provisions; constitutional amendments; judicial review; Public Interest Litigation." },
        ],
      },
      {
        key: "governance",
        title: "Public Administration & Governance",
        type: U,
        children: [
          { key: "public-admin", title: "Public Administration — Meaning & Evolution", type: T, summary: "Nature & scope; Kautilya's Arthashastra; Mughal administration; legacy of British rule." },
          { key: "govt-policies", title: "Government Policies & Interventions", type: T, summary: "Sectoral development policies and problems of implementation." },
          { key: "civil-society", title: "Development Processes & Civil Society", type: T, summary: "Role of civil society, NGOs and other stakeholders." },
          { key: "regulatory-bodies", title: "Regulatory Authorities & Civil Services", type: T, summary: "Statutory, regulatory & quasi-judicial authorities; role of civil services in democracy." },
          { key: "good-governance", title: "Good Governance & e-Governance", type: T, summary: "Transparency, accountability & responsiveness; Citizen's Charter; RTI; Public Service Act; social audit." },
        ],
      },
      {
        key: "ethics",
        title: "Ethics in Public Service & Knowledge of Law",
        type: U,
        children: [
          { key: "ethics-human-interface", title: "Ethics & Human Interface", type: T, summary: "Essence, determinants & consequences of ethics; dimensions; ethics in private & public relationships; integrity & accountability." },
          { key: "human-values", title: "Human Values", type: T, summary: "Harmony in existence; gender equability; role of family, society & education; lessons from great leaders and reformers." },
          { key: "attitude", title: "Attitude & Emotional Intelligence", type: T, summary: "Content, functions & influence of attitude; moral & political attitudes; social influence; emotional intelligence in governance." },
          { key: "public-service-ethics", title: "Public Service & Professional Ethics", type: T, summary: "Philosophical basis of governance; codes of ethics & conduct; RTI; Public Service Act; leadership ethics; work culture." },
        ],
      },
    ],
  },
  {
    key: "mains-economy",
    title: "Mains Paper IV — Economy & Development (India & AP)",
    type: S,
    examAngle: "150 marks · 150 minutes (descriptive).",
    children: [
      {
        key: "resources-budgeting",
        title: "Challenges, Resource Mobilisation & Budgeting",
        type: U,
        children: [
          { key: "major-challenges", title: "Major Challenges of the Indian Economy", type: T, summary: "Inconsistent growth; weak agriculture & manufacturing; inflation & oil prices; CAD & BoP; rupee value; NPAs; black money; inclusive & sustainable growth." },
          { key: "resource-mobilisation-india", title: "Resource Mobilisation in India", type: T, summary: "Public & private financial resources; budgetary resources; tax & non-tax revenue; public & external debt; FII & FDI; monetary & fiscal policy; development finance." },
          { key: "resource-mobilisation-ap", title: "Resource Mobilisation in Andhra Pradesh", type: T, summary: "Budgetary resources & constraints; AP Bifurcation Act conditions; central assistance; public debt; mineral & forest resources; water disputes." },
          { key: "govt-budgeting-india", title: "Government Budgeting (India)", type: T, summary: "Budget structure & process; types of budgets & deficits; union budget; GST; central assistance; federal finance; finance commission." },
          { key: "govt-budgeting-ap", title: "Government Budgeting (Andhra Pradesh)", type: T, summary: "Budget constraints; central assistance post-bifurcation; deficit management; state finance commission & local finance." },
        ],
      },
      {
        key: "inclusive-agri",
        title: "Inclusive Growth & Agriculture",
        type: U,
        children: [
          { key: "inclusive-growth", title: "Inclusive Growth", type: T, summary: "Causes of exclusion; strategies & instruments; poverty alleviation, health, education, women empowerment; PDS & food security; financial inclusion; AP schemes & DWCRA." },
          { key: "agri-development-india", title: "Agricultural Development (India)", type: T, summary: "Role in development; finance, production & marketing; green revolution to dryland/organic farming; MSP; agriculture policy; Swaminathan Commission." },
          { key: "agri-development-ap", title: "Agricultural Development (Andhra Pradesh)", type: T, summary: "Contribution to SGDP; regional disparities in irrigation; cropping patterns; horticulture, fisheries & dairying; AP schemes." },
        ],
      },
      {
        key: "industry-infra",
        title: "Industry & Infrastructure",
        type: U,
        children: [
          { key: "industrial-development", title: "Industrial Development & Policy", type: T, summary: "Role of industry; industrial policy since 1991; PSUs; LPG impact; disinvestment; MSMEs; Make in India; NIMZs, SEZs & corridors." },
          { key: "industrial-policy-ap", title: "Industrial Policy of Andhra Pradesh", type: T, summary: "Incentives; industrial corridors & SEZs in AP; bottlenecks; power projects." },
          { key: "infrastructure-india", title: "Infrastructure in India", type: T, summary: "Transport, communication, IT, Digital India, energy & power; smart cities; PPP; pricing of utilities; environmental impacts." },
          { key: "infrastructure-ap", title: "Infrastructure Development in Andhra Pradesh", type: T, summary: "Transport, energy & ICT infrastructure; bottlenecks; government policy; ongoing projects." },
        ],
      },
    ],
  },
  {
    key: "mains-scitech",
    title: "Mains Paper V — Science & Technology",
    type: S,
    examAngle: "150 marks · 150 minutes (descriptive).",
    children: [
      {
        key: "st-core",
        title: "S&T, ICT, Space & Energy",
        type: U,
        children: [
          { key: "sti-integration", title: "Science, Technology & Innovation", type: T, summary: "S&T in everyday life; national policies; India's contributions; concerns & challenges; scientific institutes in India & AP; indigenous technologies." },
          { key: "ict", title: "Information & Communication Technology", type: T, summary: "Importance, advantages & challenges; e-governance; cyber crime & security policy; IT policy; IT development in India & AP." },
          { key: "space", title: "Indian Space Programme", type: T, summary: "Past, present & future; ISRO activities & achievements; satellite applications (health, education, weather); DRDO." },
          { key: "energy", title: "Energy — Needs, Resources & Policy", type: T, summary: "Energy needs & efficiency; clean energy; conventional & non-conventional resources; energy security; nuclear policy of India." },
        ],
      },
      {
        key: "st-environment",
        title: "Environment & Sustainability",
        type: U,
        children: [
          { key: "environment-resources", title: "Development, Environment & Natural Resources", type: T, summary: "Development vs environment; resource depletion; pollution & degradation; sustainable development; climate change & justice; EIA; natural disasters; renewable/non-renewable resources." },
          { key: "pollution-waste", title: "Environmental Pollution & Waste Management", type: T, summary: "Air, water, soil & noise pollution; solid-waste management; global issues (ozone, acid rain, global warming); environmental legislation (Montreal, Kyoto, UNFCCC, EPA 1986); SDGs; NDMA 2016." },
        ],
      },
      {
        key: "st-biotech",
        title: "Biotechnology & Health",
        type: U,
        children: [
          { key: "biotech-nanotech", title: "Biotechnology & Nanotechnology", type: T, summary: "Nature, scope & applications; ethical, social & legal concerns; government policies; genetic engineering & its impact; biodiversity; fermentation; immuno-diagnosis." },
          { key: "human-diseases", title: "Human Diseases & Health Biotech", type: T, summary: "Microbial infections & prevention; genetic engineering & tissue culture; biotech in agriculture (bio-pesticides, bio-fertilizers, GM crops); vaccines & immunity." },
          { key: "ipr", title: "Intellectual Property Rights in S&T", type: T, summary: "IPR issues in science & technology; promotion of science in India and AP." },
        ],
      },
    ],
  },
  {
    key: "mains-english",
    title: "Mains — English (Qualifying)",
    type: S,
    examAngle: "150 marks · qualifying language paper.",
    children: [
      { key: "essay-letter", title: "Essay, Letter, Press Release & Report Writing", type: T },
      { key: "visual-speech", title: "Writing on Visual Information & Formal Speech", type: T },
      { key: "precis-comprehension", title: "Précis Writing & Reading Comprehension", type: T },
      { key: "grammar", title: "English Grammar", type: T, summary: "Tenses, voice, narration, transformation, articles, prepositions, phrasal verbs, idioms, synonyms/antonyms, one-word substitution, connectives, affixes." },
      { key: "translation", title: "Translation (Regional → English)", type: T },
    ],
  },
  {
    key: "mains-telugu",
    title: "Mains — Telugu (Qualifying)",
    type: S,
    examAngle: "150 marks · qualifying language paper.",
    children: [
      { key: "essay-elaboration", title: "Essay & Elaboration of Verse", type: T },
      { key: "precis-comprehension", title: "Précis & Comprehension", type: T },
      { key: "speech-media", title: "Formal Speech & Media Statements", type: T },
      { key: "letter-debate", title: "Letter, Application, Report, Debate & Dialogue Writing", type: T },
      { key: "translation-grammar", title: "Translation (English → Telugu) & Telugu Grammar", type: T },
    ],
  },
];
