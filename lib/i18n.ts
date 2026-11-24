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

/** Centralized bilingual copy for the home-page About / leaders section. */
export const KALAIGNAR_ABOUT_COPY = {
  srOnlyHeading: {
    ta: "கலைஞர் மற்றும் திராவிட இயக்கத் தமிழ் நூல்கள்",
    en: "Kalaignar & Dravidian Movement Tamil Books",
  },
  kalaignar: {
    heading: {
      ta: "முத்தமிழறிஞர் கலைஞர்",
      en: "Muthamizharignar Kalaignar",
    },
    body: {
      ta: "தந்தை பெரியாரின் மாணவர், பேரறிஞர் அண்ணாவின் அன்புத் தம்பி, கோடிக்கணக்கான தமிழர்களின் அன்பு உடன்பிறப்பானவர், கொள்கையில் உறுதி கொண்டவர். எழுத்தில், பேச்சில், செயல்பாட்டில் சமூக நீதி வழுவாத தலைவர். தமிழினத்தின் உரிமைக்காக வாழ்நாள் முழுவதும் உழைத்தவர். 1957-ஆம் ஆண்டு, குளித்தலை தொகுதியில் வெற்றிபெற்றது தொடங்கி, 2018 வரை சுமார் 61 ஆண்டுகள் சட்டமன்ற உறுப்பினராகச் செயல்பட்டவர். ஐந்து முறை முதலமைச்சராகப் பொறுப்பேற்று, தமிழ்நாட்டின் இன்றைய வளர்ச்சிக்கு அடித்தளமிட்ட தொலைநோக்குச் சிற்பி.",
      en: 'A student of Thanthai Periyar, the beloved younger brother of Perarignar Anna, and the dear "udanpirappu" (sibling) of crores of Tamils, firm in his principles. A leader who never wavered from social justice in his writing, speech and action. He worked all his life for the rights of the Tamil people. From his victory in the Kulithalai constituency in 1957 until 2018, he served as a member of the Legislative Assembly for about 61 years. He served as Chief Minister five times, a far-sighted architect who laid the foundation for Tamil Nadu\'s growth today.',
    },
    imageAlt: {
      ta: "முத்தமிழறிஞர் கலைஞர்",
      en: "Muthamizharignar Kalaignar",
    },
  },
  stalin: {
    heading: {
      ta: "மாண்புமிகு மு.க.ஸ்டாலின்",
      en: "Hon'ble M.K. Stalin",
    },
    role: {
      ta: "கழகத் தலைவர்",
      en: "President of the DMK",
    },
    body: {
      ta: "மாணவர் பருவத்திலேயே கழகப் பணிகளில் தன்னை ஈடுபடுத்திக்கொண்டவர். 1976-ஆம் ஆண்டு, 'மிசா' சிறைக் கொடுமைகளையும் எதிர்கொண்டவர். 1982-ஆம் ஆண்டு கழக இளைஞர் அணியை உருவாக்கி, அதன் செயலாளராக 35 ஆண்டுகளுக்கும் மேலாகப் பணியாற்றியவர். 1989-ஆம் ஆண்டு ஆயிரம்விளக்குத் தொகுதியில் வெற்றிபெற்று, சட்டமன்ற உறுப்பினரானவர். சென்னை மாநகர மேயராகவும் உள்ளாட்சித் துறை அமைச்சராகவும், துணை முதலமைச்சராகவும் பொறுப்பேற்று அனுபவம் பெற்றவர். 2017-ஆம் ஆண்டு, கழகத்தின் செயல் தலைவராகவும் 2018-ஆம் ஆண்டு, கழகத் தலைவராகவும் பொறுப்பேற்றவர். 2021-ஆம் ஆண்டு, முதலமைச்சராகப் பொறுப்பேற்று, திராவிட மாடல் அரசியலை உலகத்துக்கே வெளிச்சமிட்ட தலைவர்.",
      en: "He took up party work while still a student. In 1976 he faced the cruelties of imprisonment under MISA. In 1982 he founded the party's Youth Wing and served as its secretary for more than 35 years. In 1989 he won the Thousand Lights constituency and became an MLA. He gained experience as Mayor of Chennai, Minister for Local Administration and Deputy Chief Minister. He became Working President of the party in 2017 and President in 2018. In 2021 he became Chief Minister, the leader who showed the Dravidian Model of governance to the whole world.",
    },
  },
  udhayanidhi: {
    heading: {
      ta: "மாண்புமிகு உதயநிதி ஸ்டாலின்",
      en: "Hon'ble Udhayanidhi Stalin",
    },
    role: {
      ta: "தமிழ்நாடு சட்டமன்ற எதிர்க்கட்சித் தலைவர்",
      en: "Leader of the Opposition, Tamil Nadu Legislative Assembly",
    },
    body: {
      ta: "திராவிட முன்னேற்றக் கழகத்தின் இளைஞர் அணிச் செயலாளர், சேப்பாக்கம் – திருவல்லிக்கேணி தொகுதியின் சட்டமன்ற உறுப்பினர். திராவிடச் சிந்தனையை அடுத்த நூற்றாண்டுக்கும் கடத்தும் ஆற்றல்மிகு இளந்தலைவர். 2021-26 திராவிட மாடல் அரசில், இளைஞர் நலன் மற்றும் விளையாட்டு மேம்பாட்டுத் துறை அமைச்சர், சிறப்பு திட்டச் செயலாக்கத் துறை அமைச்சர், துணை முதலமைச்சராகப் பொறுப்பேற்று, திறம்பட செயல்பட்டவர். 2026-ஆம் ஆண்டு, சட்டமன்றத்தில் எதிர்க்கட்சித் தலைவராகச் செயல்பட்டு வரும் வலிமையும் வல்லமையும் மிக்க தலைவர்.",
      en: "Secretary of the DMK Youth Wing and MLA for Chepauk-Thiruvallikeni. A capable young leader who carries Dravidian thought into the next century. In the Dravidian Model government of 2021-26 he served effectively as Minister for Youth Welfare and Sports Development, Minister for Special Programme Implementation and Deputy Chief Minister. In 2026 he became Leader of the Opposition in the Assembly, a strong and capable leader.",
    },
  },
  pathippagam: {
    heading: {
      ta: "முத்தமிழறிஞர் பதிப்பகம்",
      en: "Muthamizharignar Pathippagam",
    },
    body: {
      ta: "திராவிட முன்னேற்றக் கழக இளைஞர் அணியின் பதிப்பகம். உதயநிதி ஸ்டாலின் தலைமையில், கழக இளைஞர் அணி முன்னெடுத்துள்ள முக்கியமான கருத்தியல் முயற்சி. 2023-ஆம் ஆண்டு தைத் திருநாள் அன்று, கழகத் தலைவர் அவர்களால் தொடங்கிவைக்கப்பட்டது. திராவிட இயக்க வரலாறு, சமூக நீதி, இடஒதுக்கீடு, மொழியுரிமை, மாநில சுயாட்சி, திராவிட மாடல் உள்ளிட்ட கருத்துகளை இளைய தலைமுறையிடம் கொண்டுசேர்க்கும் நோக்கில் செயல்படுகிறது. திராவிட இயக்கக் கொள்கைகள், வரலாறு, அரசியல் தொடர்பான நூல்களை வெளியிட்டுவருகிறது.",
      en: "The publishing house of the Dravida Munnetra Kazhagam Youth Wing, an important ideological initiative taken up by the Youth Wing under the leadership of Udhayanidhi Stalin. It was launched on Thai Thirunaal in 2023 by the party President. It works to take ideas such as Dravidian movement history, social justice, reservation, language rights, state autonomy and the Dravidian Model to the younger generation, and publishes books on Dravidian movement principles, history and politics.",
    },
  },
  viewBooks: {
    ta: "நூல்களைக் காண்க",
    en: "View books",
  },
} as const;
