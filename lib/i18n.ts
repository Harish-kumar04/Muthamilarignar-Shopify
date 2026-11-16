/**
 * Framework-agnostic bilingual helpers (safe in Server and Client Components).
 *
 * Product / category names are stored as `"தமிழ் | English"`, long descriptions as
 * `"தமிழ் விளக்கம் || English description"`.
 */
export type Lang = "ta" | "en";

export function splitBilingual(raw?: string | null, sep: "|" | "||" = "|"): [string, string] {
  if (!raw) return ["", ""];
  const str = String(raw);
  if (sep === "||" && str.includes("||")) {
    const [ta, ...rest] = str.split("||");
    return [ta.trim(), rest.join("||").trim() || ta.trim()];
  }
  if (str.includes("|")) {
    const [ta, ...rest] = str.split("|");
    return [ta.trim(), rest.join("|").trim() || ta.trim()];
  }
  return [str.trim(), str.trim()];
}

/** Inline script (runs before paint) that applies the saved language to <html lang>. */
export const LANG_BOOT_SCRIPT =
  "try{var l=localStorage.getItem('mp-lang');if(l==='en'||l==='ta')document.documentElement.lang=l}catch(e){}";

/** Centralized bilingual copy for the home-page About Muthamizh Arignar Kalaignar block. */
export const KALAIGNAR_ABOUT_COPY = {
  heading: {
    ta: "முத்தமிழறிஞர் கலைஞர் பற்றி",
    en: "About Muthamizh Arignar Kalaignar",
  },
  paragraph1: {
    ta: "முத்தமிழறிஞர் கலைஞர் மு. கருணாநிதி, 1924 ஜூன் 3 அன்று இன்றைய நாகப்பட்டினம் மாவட்டத்தில் உள்ள திருக்குவளையில் பிறந்தார். எழுத்தாளராகவும் திரைக்கதை வசன ஆசிரியராகவும் தமது பயணத்தைத் தொடங்கினார். 1969 முதல் 2018 வரை திராவிட முன்னேற்றக் கழகத்தின் தலைவராக இருந்தார். தமிழ்நாட்டின் முதலமைச்சராக ஐந்து முறை பொறுப்பு வகித்தார்.",
    en: "M. Karunanidhi, known as Kalaignar and honoured as Muthamizh Arignar, was born on 3 June 1924 in Thirukkuvalai, in present-day Nagapattinam district, Tamil Nadu. He began as a writer and screenwriter, and led the Dravida Munnetra Kazhagam as its president from 1969 until 2018. He served as Chief Minister of Tamil Nadu five times.",
  },
  paragraph2: {
    ta: "'பராசக்தி' (1952) உள்ளிட்ட திரைப்படங்களுக்கு வசனம் எழுதினார். குறளோவியம், ரோமாபுரி பாண்டியன், தென்பாண்டிச் சிங்கம், 'நெஞ்சுக்கு நீதி' உள்ளிட்ட நூறுக்கும் மேற்பட்ட படைப்புகளையும், திருக்குறளுக்கு உரையையும் எழுதினார். சென்னை வள்ளுவர் கோட்டமும், கன்னியாகுமரி திருவள்ளுவர் சிலையும் (2000) அவர் தலைமையிலான திமுக ஆட்சிகளில் உருவானவை. 2004இல் தமிழுக்குச் செம்மொழி தகுதி கிடைத்தது; அதற்காகக் குரல் கொடுத்தவர்களில் அவர் முக்கியமானவர். 2018 ஆகஸ்ட் 7 அன்று சென்னையில் மறைந்தார்.",
    en: "He wrote the dialogue for films including Parasakthi (1952), and authored more than a hundred works, among them Kuraloviyam, Romapuri Pandian, Thenpandi Singam and the memoir Nenjukku Needhi, as well as a commentary on the Thirukkural. Valluvar Kottam in Chennai and the Thiruvalluvar statue at Kanyakumari (2000) were built under DMK governments he led. Tamil was granted classical language status in 2004, a cause he championed. He passed away in Chennai on 7 August 2018.",
  },
  readMore: {
    ta: "மேலும் படிக்க",
    en: "Read more",
  },
  readLess: {
    ta: "சுருக்குக",
    en: "Read less",
  },
} as const;
