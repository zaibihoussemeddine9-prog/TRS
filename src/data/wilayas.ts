export interface Wilaya {
  id: number
  name: string
  nameAr: string
  deliveryFee: number
  communes: string[]
}

export const WILAYAS: Wilaya[] = [
  { id: 1, name: "Adrar", nameAr: "أدرار", deliveryFee: 900, communes: ["Adrar", "Aoulef", "Reggane", "Timimoun", "Tsabit"] },
  { id: 2, name: "Chlef", nameAr: "الشلف", deliveryFee: 600, communes: ["Chlef", "Ténès", "El Karimia", "Taougrite", "Bénairia"] },
  { id: 3, name: "Laghouat", nameAr: "الأغواط", deliveryFee: 750, communes: ["Laghouat", "Aflou", "Ksar El Hirane", "Brida", "Oued Morra"] },
  { id: 4, name: "Oum El Bouaghi", nameAr: "أم البواقي", deliveryFee: 650, communes: ["Oum El Bouaghi", "Aïn Beïda", "Aïn M'lila", "Souk Naamane", "Rahia"] },
  { id: 5, name: "Batna", nameAr: "باتنة", deliveryFee: 650, communes: ["Batna", "Barika", "Arris", "Merouana", "Ras El Aioun"] },
  { id: 6, name: "Béjaïa", nameAr: "بجاية", deliveryFee: 600, communes: ["Béjaïa", "Akbou", "Amizour", "Sidi Aïch", "Kherrata"] },
  { id: 7, name: "Biskra", nameAr: "بسكرة", deliveryFee: 700, communes: ["Biskra", "Tolga", "Ouled Djellal", "Sidi Okba", "El Kantara"] },
  { id: 8, name: "Béchar", nameAr: "بشار", deliveryFee: 900, communes: ["Béchar", "Abadla", "Kenadsa", "Igli", "Lahmar"] },
  { id: 9, name: "Blida", nameAr: "البليدة", deliveryFee: 500, communes: ["Blida", "Boufarik", "Larbaa", "Meftah", "Chréa"] },
  { id: 10, name: "Bouira", nameAr: "البويرة", deliveryFee: 600, communes: ["Bouira", "Lakhdaria", "M'Chedallah", "Sour El Ghozlane", "Bechloul"] },
  { id: 11, name: "Tamanrasset", nameAr: "تمنراست", deliveryFee: 1000, communes: ["Tamanrasset", "In Salah", "In Guezzam", "Abalessa", "Ideles"] },
  { id: 12, name: "Tébessa", nameAr: "تبسة", deliveryFee: 700, communes: ["Tébessa", "Bir El Ater", "Cheria", "El Ogla", "Hammamet"] },
  { id: 13, name: "Tlemcen", nameAr: "تلمسان", deliveryFee: 650, communes: ["Tlemcen", "Maghnia", "Nedroma", "Remchi", "Sebdou"] },
  { id: 14, name: "Tiaret", nameAr: "تيارت", deliveryFee: 650, communes: ["Tiaret", "Ksar Chellala", "Sougueur", "Frenda", "Mahdia"] },
  { id: 15, name: "Tizi Ouzou", nameAr: "تيزي وزو", deliveryFee: 550, communes: ["Tizi Ouzou", "Azazga", "Draa El Mizan", "Boghni", "Larbaa Nath Irathen"] },
  { id: 16, name: "Alger", nameAr: "الجزائر", deliveryFee: 400, communes: ["Alger Centre", "Bab El Oued", "El Harrach", "Bir Mourad Raïs", "Kouba", "Birkhadem", "Hydra", "El Biar", "Chéraga", "Dely Ibrahim", "Rouiba", "Dar El Beïda", "Bab Ezzouar", "Bordj El Kiffan", "Hussien Dey"] },
  { id: 17, name: "Djelfa", nameAr: "الجلفة", deliveryFee: 750, communes: ["Djelfa", "Messaad", "Ain Oussera", "Hassi Bahbah", "Birine"] },
  { id: 18, name: "Jijel", nameAr: "جيجل", deliveryFee: 600, communes: ["Jijel", "El Milia", "Taher", "Settara", "Chekfa"] },
  { id: 19, name: "Sétif", nameAr: "سطيف", deliveryFee: 600, communes: ["Sétif", "El Eulma", "Aïn Oulmane", "Bougaa", "Ain El Kebira"] },
  { id: 20, name: "Saïda", nameAr: "سعيدة", deliveryFee: 700, communes: ["Saïda", "Youb", "Ain El Hadjar", "Sidi Ahmed", "Doui Thabet"] },
  { id: 21, name: "Skikda", nameAr: "سكيكدة", deliveryFee: 600, communes: ["Skikda", "Azzaba", "Collo", "El Hadaïek", "Tamalous"] },
  { id: 22, name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس", deliveryFee: 650, communes: ["Sidi Bel Abbès", "Télagh", "Ras El Ma", "Sidi Brahim", "Moulay Slissen"] },
  { id: 23, name: "Annaba", nameAr: "عنابة", deliveryFee: 600, communes: ["Annaba", "El Bouni", "Berrahal", "El Hadjar", "Ain Berda"] },
  { id: 24, name: "Guelma", nameAr: "قالمة", deliveryFee: 650, communes: ["Guelma", "Bouchegouf", "Hammam Debagh", "Heliopolis", "Nechmaya"] },
  { id: 25, name: "Constantine", nameAr: "قسنطينة", deliveryFee: 600, communes: ["Constantine", "El Khroub", "Aïn Smara", "Hamma Bouziane", "Didouche Mourad"] },
  { id: 26, name: "Médéa", nameAr: "المدية", deliveryFee: 600, communes: ["Médéa", "Ksar El Boukhari", "Beni Slimane", "Ain Boucif", "Chelalet El Adhaoui"] },
  { id: 27, name: "Mostaganem", nameAr: "مستغانم", deliveryFee: 650, communes: ["Mostaganem", "Achaacha", "Aïn Tedles", "Kheir Eddine", "Stidia"] },
  { id: 28, name: "M'Sila", nameAr: "المسيلة", deliveryFee: 700, communes: ["M'Sila", "Bou Saada", "Sidi Aïssa", "Ain El Hadjel", "Berhoum"] },
  { id: 29, name: "Mascara", nameAr: "معسكر", deliveryFee: 650, communes: ["Mascara", "Sig", "Mohammadia", "Oggaz", "Maoussa"] },
  { id: 30, name: "Ouargla", nameAr: "ورقلة", deliveryFee: 850, communes: ["Ouargla", "Touggourt", "Hassi Messaoud", "El Borma", "Rouissat"] },
  { id: 31, name: "Oran", nameAr: "وهران", deliveryFee: 500, communes: ["Oran", "Es Sénia", "Bir El Djir", "Aïn El Turck", "Arzew", "Bethioua", "Mers El Kébir", "Hassi Ben Okba", "Sidi Chahmi", "El Kerma"] },
  { id: 32, name: "El Bayadh", nameAr: "البيض", deliveryFee: 850, communes: ["El Bayadh", "Rogassa", "El Abiodh Sidi Cheikh", "Boualem", "Brezina"] },
  { id: 33, name: "Illizi", nameAr: "إليزي", deliveryFee: 1000, communes: ["Illizi", "Djanet", "In Amenas", "Debdeb"] },
  { id: 34, name: "Bordj Bou Arréridj", nameAr: "برج بوعريريج", deliveryFee: 650, communes: ["Bordj Bou Arréridj", "El Anseur", "Mansoura", "Ras El Oued", "Aïn Taghrout"] },
  { id: 35, name: "Boumerdès", nameAr: "بومرداس", deliveryFee: 500, communes: ["Boumerdès", "Boudouaou", "Khemis El Khechna", "Thenia", "Bordj Menaïel"] },
  { id: 36, name: "El Tarf", nameAr: "الطارف", deliveryFee: 650, communes: ["El Tarf", "El Kala", "Ben M'Hidi", "Boutheldja", "Chefia"] },
  { id: 37, name: "Tindouf", nameAr: "تندوف", deliveryFee: 1000, communes: ["Tindouf", "Oum El Assel"] },
  { id: 38, name: "Tissemsilt", nameAr: "تيسمسيلت", deliveryFee: 700, communes: ["Tissemsilt", "Bordj Bounaama", "Khemisti", "Lardjem", "Theniet El Had"] },
  { id: 39, name: "El Oued", nameAr: "الوادي", deliveryFee: 800, communes: ["El Oued", "Guemar", "Robbah", "Bayadha", "Reguiba"] },
  { id: 40, name: "Khenchela", nameAr: "خنشلة", deliveryFee: 700, communes: ["Khenchela", "Aïn Touila", "Baghaï", "Kais", "Taouziant"] },
  { id: 41, name: "Souk Ahras", nameAr: "سوق أهراس", deliveryFee: 650, communes: ["Souk Ahras", "Sedrata", "Taoura", "M'Daourouch", "Ouled Moumen"] },
  { id: 42, name: "Tipaza", nameAr: "تيبازة", deliveryFee: 500, communes: ["Tipaza", "Cherchell", "Koléa", "Bou Ismaïl", "Hadjout"] },
  { id: 43, name: "Mila", nameAr: "ميلة", deliveryFee: 650, communes: ["Mila", "Ferdjioua", "Chelghoum Laïd", "Grarem Gouga", "Tassadane Haddada"] },
  { id: 44, name: "Aïn Defla", nameAr: "عين الدفلى", deliveryFee: 600, communes: ["Aïn Defla", "El Attaf", "Miliana", "Aïn Lechiakh", "El Abadia"] },
  { id: 45, name: "Naâma", nameAr: "النعامة", deliveryFee: 850, communes: ["Naâma", "Mecheria", "Aïn Sefra", "Sfissifa", "Tiout"] },
  { id: 46, name: "Aïn Témouchent", nameAr: "عين تيموشنت", deliveryFee: 650, communes: ["Aïn Témouchent", "Beni Saf", "Hammam Bouhadjar", "El Malah", "Oulhaça El Gheraba"] },
  { id: 47, name: "Ghardaïa", nameAr: "غرداية", deliveryFee: 800, communes: ["Ghardaïa", "Metlili", "El Meniaa", "Berriane", "Dhayet Bendhahoua"] },
  { id: 48, name: "Relizane", nameAr: "غليزان", deliveryFee: 650, communes: ["Relizane", "Oued Rhiou", "Mazouna", "Mendès", "Yellel"] },
]

export function getWilayaById(id: number): Wilaya | undefined {
  return WILAYAS.find(w => w.id === id)
}

export function formatDeliveryFee(fee: number): string {
  return new Intl.NumberFormat('fr-DZ').format(fee) + ' DA'
}
