import { DIAL_COUNTRIES } from "@/lib/phone";

// lib/profile-options.ts
// Profile එකේ තෝරන්න පුළුවන් values (database එකේ save වෙන්නේ මේ English values).
// Screen එකේ පෙන්නනකොට option_translations table එකෙන් language එකට පරිවර්තනය වෙනවා (useTr).

export const GENDER_OPTIONS = ["male", "female"];
export const MARITAL_STATUS_OPTIONS = ["Never Married", "Divorced", "Widowed"];
export const MOTHER_TONGUE_OPTIONS = ["Sinhala", "Tamil", "English"];
export const ACCOUNT_CREATED_BY_OPTIONS = ["Self", "Parents/Family"];

export const RELIGION_OPTIONS = ["Buddhist", "Hindu", "Christian", "Catholic", "Islam", "Other"];
export const CASTE_OPTIONS = ["Govigama", "Karava", "Durava", "Nawandawa", "Salagama", "Vahumpura", "Other"];
export const YES_NO_OPTIONS = ["Yes", "No"];
export const YES_NO_SOMETIMES_OPTIONS = ["Yes", "No", "Occasionally"];

// රටවල් (phone dropdown එකේ list එකමයි) + "Other"
export const COUNTRY_OPTIONS = [...DIAL_COUNTRIES.map((c) => c.name), "Other"];

export const DISTRICT_OPTIONS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
];

export const EDUCATION_OPTIONS = ["O/L", "A/L", "Diploma", "B.Sc", "B.A", "BBA", "M.Sc", "MBA", "PhD", "Other"];

export const PROFESSION_OPTIONS = [
  "Accountant", "Architect", "Banker", "Business Owner", "Chef", "Civil Engineer",
  "Doctor", "Driver", "Engineer", "Executive", "Farmer", "Government Service",
  "Graphic Designer", "HR Professional", "Hotelier", "IT Professional", "Lawyer",
  "Lecturer", "Manager", "Medical Professional", "Military", "Not Employed",
  "Nurse", "Police Officer", "Quantity Surveyor", "Researcher", "Sales Executive",
  "Self Employed", "Software Engineer", "Student", "Supervisor", "Surveyor",
  "Teacher", "Technician", "Other",
];

export const INCOME_OPTIONS = ["LKR 50k - 100k", "LKR 100k - 200k", "LKR 200k - 300k", "LKR 300k+"];

export const PARENT_JOB_OPTIONS = [
  "Government", "Private Sector", "Business", "Self Employed", "Retired", "Housewife", "Not Employed", "Passed Away", "Other",
];

export const SIBLINGS_OPTIONS = ["0", "1", "2", "3", "4", "5", "6", "7", "8"];

export const FOOD_OPTIONS = ["Vegetarian", "Non Vegetarian", "Vegan"];

export const ETHNICITY_OPTIONS = ["Sinhala", "Tamil", "Muslim", "Burgher", "Malay", "Other"];
export const HOROSCOPE_MATCHING_OPTIONS = ["Required", "Not required"];

// දෙමාපියන්ගේ රැකියාව: රැකියා list එක + දෙමාපියන්ට අදාළ අමතර ඒවා
export const PARENT_PROFESSION_OPTIONS = Array.from(
  new Set(["Government", "Private Sector", "Business", "Retired", "Housewife", "Passed Away", ...PROFESSION_OPTIONS])
);

export const HOBBY_OPTIONS = [
  "Reading", "Singing", "Music", "Dancing", "Cooking", "Watching Movies", "Travelling", "Photography",
  "Watching TV", "Cricket", "Sports", "Gym", "Gardening", "Art", "Writing", "Yoga", "Swimming",
];

// 4' 6" සිට 7' 0" දක්වා (Browse page එකේ height sort එකට ගැලපෙන format එක)
export const HEIGHT_OPTIONS: string[] = (() => {
  const list: string[] = [];
  for (let inches = 54; inches <= 84; inches++) {
    list.push(`${Math.floor(inches / 12)}' ${inches % 12}"`);
  }
  return list;
})();

// දිස්ත්‍රික්කය අනුව ප්‍රධාන නගර (list එකේ නැත්නම් "Other" තෝරලා type කරන්න පුළුවන්)
export const TOWNS_BY_DISTRICT: Record<string, string[]> = {
  Ampara: ["Ampara", "Akkaraipattu", "Addalaichenai", "Dehiattakandiya", "Kalmunai", "Mahaoya", "Pottuvil", "Sainthamaruthu", "Sammanthurai", "Uhana"],
  Anuradhapura: ["Anuradhapura", "Eppawala", "Galenbindunuwewa", "Horowpothana", "Kebithigollewa", "Kekirawa", "Medawachchiya", "Mihintale", "Nochchiyagama", "Talawa", "Thambuttegama"],
  Badulla: ["Badulla", "Bandarawela", "Diyatalawa", "Ella", "Hali-Ela", "Haputale", "Kandaketiya", "Mahiyanganaya", "Passara", "Welimada"],
  Batticaloa: ["Batticaloa", "Chenkalady", "Eravur", "Kaluwanchikudy", "Kattankudy", "Oddamavadi", "Valaichchenai"],
  Colombo: ["Colombo", "Avissawella", "Battaramulla", "Boralesgamuwa", "Dehiwala-Mount Lavinia", "Homagama", "Kaduwela", "Kesbewa", "Kolonnawa", "Kottawa", "Maharagama", "Moratuwa", "Nugegoda", "Padukka", "Piliyandala", "Sri Jayawardenepura Kotte", "Wellampitiya"],
  Galle: ["Galle", "Ahangama", "Ambalangoda", "Baddegama", "Bentota", "Elpitiya", "Habaraduwa", "Hikkaduwa", "Karapitiya", "Neluwa", "Udugama"],
  Gampaha: ["Gampaha", "Biyagama", "Delgoda", "Divulapitiya", "Ganemulla", "Ja-Ela", "Kadawatha", "Kandana", "Katunayake", "Kelaniya", "Kiribathgoda", "Minuwangoda", "Mirigama", "Negombo", "Nittambuwa", "Ragama", "Veyangoda", "Wattala"],
  Hambantota: ["Hambantota", "Ambalantota", "Beliatta", "Middeniya", "Sooriyawewa", "Tangalle", "Tissamaharama", "Walasmulla", "Weeraketiya"],
  Jaffna: ["Jaffna", "Chavakachcheri", "Chunnakam", "Karainagar", "Kayts", "Kopay", "Nallur", "Point Pedro", "Valvettithurai"],
  Kalutara: ["Kalutara", "Agalawatta", "Aluthgama", "Bandaragama", "Beruwala", "Horana", "Ingiriya", "Matugama", "Panadura", "Wadduwa"],
  Kandy: ["Kandy", "Akurana", "Digana", "Galagedara", "Gampola", "Kadugannawa", "Katugastota", "Kundasale", "Nawalapitiya", "Peradeniya", "Pilimathalawa", "Teldeniya", "Wattegama"],
  Kegalle: ["Kegalle", "Aranayake", "Dehiowita", "Galigamuwa", "Mawanella", "Rambukkana", "Ruwanwella", "Warakapola", "Yatiyantota"],
  Kilinochchi: ["Kilinochchi", "Pallai", "Paranthan", "Poonakary"],
  Kurunegala: ["Kurunegala", "Alawwa", "Galgamuwa", "Giriulla", "Ibbagamuwa", "Kuliyapitiya", "Maho", "Melsiripura", "Narammala", "Nikaweratiya", "Pannala", "Polgahawela", "Wariyapola"],
  Mannar: ["Mannar", "Madhu", "Murunkan", "Nanattan", "Pesalai"],
  Matale: ["Matale", "Dambulla", "Galewela", "Naula", "Palapathwela", "Rattota", "Sigiriya", "Ukuwela"],
  Matara: ["Matara", "Akuressa", "Deniyaya", "Devinuwara", "Dikwella", "Hakmana", "Kamburupitiya", "Mirissa", "Thihagoda", "Weligama"],
  Moneragala: ["Moneragala", "Bibile", "Buttala", "Kataragama", "Medagama", "Siyambalanduwa", "Thanamalwila", "Wellawaya"],
  Mullaitivu: ["Mullaitivu", "Mankulam", "Oddusuddan", "Puthukkudiyiruppu"],
  "Nuwara Eliya": ["Nuwara Eliya", "Ginigathhena", "Hatton", "Kotagala", "Maskeliya", "Nanu Oya", "Ragala", "Talawakele", "Walapane"],
  Polonnaruwa: ["Polonnaruwa", "Aralaganwila", "Dimbulagala", "Hingurakgoda", "Kaduruwela", "Manampitiya", "Medirigiriya", "Welikanda"],
  Puttalam: ["Puttalam", "Anamaduwa", "Chilaw", "Dankotuwa", "Kalpitiya", "Madampe", "Marawila", "Nattandiya", "Nawagattegama", "Wennappuwa"],
  Ratnapura: ["Ratnapura", "Balangoda", "Eheliyagoda", "Embilipitiya", "Godakawela", "Kahawatta", "Kalawana", "Kuruwita", "Pelmadulla", "Rakwana"],
  Trincomalee: ["Trincomalee", "Kantale", "Kinniya", "Kuchchaveli", "Mutur", "Nilaveli", "Seruwila"],
  Vavuniya: ["Vavuniya", "Cheddikulam", "Nedunkeni", "Omanthai"],
};

// ශ්‍රී ලංකාවේ හැම නගරයක්ම (උපන් ස්ථානය search කරන්න) — { town, district }
export const ALL_SRI_LANKAN_TOWNS: { town: string; district: string }[] = Object.entries(TOWNS_BY_DISTRICT)
  .flatMap(([district, towns]) => towns.map((town) => ({ town, district })))
  .sort((a, b) => a.town.localeCompare(b.town));
