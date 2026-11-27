import { PUBLISHER_ENTITY, buildBreadcrumbNode, buildOrganizationNodes } from "@/lib/seo-schema";
import { SITE_URL } from "@/lib/site-defaults";

export const POLICY_LAST_UPDATED_ISO = "2026-11-13";
export const POLICY_LAST_UPDATED_EN = "November 13, 2026";
export const POLICY_LAST_UPDATED_TA = "13 நவம்பர் 2026";

export interface FaqEntry {
  id: string;
  questionTa: string;
  questionEn: string;
  /** Strictly 40–60 words, direct factual opening sentence = the answer. */
  answerEn: string;
  answerTa: string;
}

export const STORE_FAQS: FaqEntry[] = [
  {
    id: "how-to-order",
    questionTa: "இணையதளத்தில் நூல்களை ஆர்டர் செய்வது எப்படி?",
    questionEn: "How do I order books on this website?",
    answerTa:
      "விரும்பிய நூலைத் தேர்ந்தெடுத்து 'நூலைத் தேர்ந்தெடு' (Add to Cart) அல்லது 'உடனே வாங்க' (Buy Now) பொத்தானை அழுத்தி, செக்அவுட் பக்கத்தில் உங்கள் முகவரி விவரங்களை உள்ளிட்டு ஆர்டர் செய்யலாம்.",
    answerEn:
      "Select any title, click Add to Cart or Buy Now, and enter your delivery address and contact details at checkout to place your order.",
  },
  {
    id: "cod-availability",
    questionTa: "புத்தகம் நேரில் வந்ததும் பணம் செலுத்தும் வசதி (COD) உள்ளதா?",
    questionEn: "Is Cash on Delivery (COD) available?",
    answerTa:
      "ஆம், தகுதியுள்ள இந்திய அஞ்சல் குறியீடுகளுக்குப் புத்தகம் நேரில் வந்ததும் பணம் செலுத்தும் வசதி (COD) உள்ளது.",
    answerEn:
      "Yes, Cash on Delivery (COD) is available for eligible Indian pincodes at checkout.",
  },
  {
    id: "delivery-time",
    questionTa: "நூல்கள் எத்தனை நாட்களில் விநியோகிக்கப்படும்?",
    questionEn: "What is the delivery time for book orders?",
    answerTa:
      "இந்தியா முழுவதும் டெலிவரி உண்டு. முத்தமிழறிஞர் பதிப்பக நூல்கள் பாதுகாப்பான பேக்கேஜிங்கில் அனுப்பப்படுகின்றன; துல்லியமான விநியோக கால அளவை அறிய செக்அவுட் (Checkout) பக்கத்தைப் பார்க்கவும்.",
    answerEn:
      "Pan-India delivery available. Orders from Muthamilarignar Pathipagam are shipped in protective packaging; see checkout for exact delivery estimates.",
  },
  {
    id: "book-authenticity",
    questionTa: "இங்கு விற்கப்படும் நூல்கள் அனைத்தும் அதிகாரப்பூர்வப் பதிப்புகளா?",
    questionEn: "Are all books official publisher editions?",
    answerTa:
      "ஆம், இத்தளத்தில் விற்கப்படும் அனைத்து நூல்களும் முத்தமிழறிஞர் பதிப்பகத்தின் 100% அதிகாரப்பூர்வ அசல் பதிப்புகளாகும்.",
    answerEn:
      "Yes, every book sold on this website is an authentic official publisher edition directly from Muthamilarignar Pathipagam.",
  },
  {
    id: "contact-whatsapp",
    questionTa: "முத்தமிழறிஞர் பதிப்பகத்தைத் தொடர்புகொள்வது அல்லது WhatsApp எண் எது?",
    questionEn: "How can I contact Muthamilarignar Pathipagam or reach WhatsApp support?",
    answerTa:
      "உதவிக்கு +91 82204 51520 என்ற WhatsApp / தொலைபேசி எண்ணிலோ அல்லது muthamilarignar@gmail.com என்ற மின்னஞ்சலிலோ தொடர்புகொள்ளலாம் (முத்தமிழறிஞர் பதிப்பகம், திமுக இளைஞர் அணி, அன்பகம், 614, அண்ணா சாலை, தேனாம்பேட்டை, சென்னை - 600 018).",
    answerEn:
      "Contact Muthamilarignar Pathipagam on WhatsApp or phone at +91 82204 51520, or email muthamilarignar@gmail.com (Muthamizharingnar Publication, DMK Youth Wing, Anbagam, 614, Anna Salai, Teynampet, Chennai - 600 018).",
  },
];

export function buildFaqJsonLd(faqs: FaqEntry[], pageUrl?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(pageUrl ? { "@id": `${pageUrl}#faq` } : {}),
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: `${f.questionTa} | ${f.questionEn}`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${f.answerTa} ${f.answerEn}`,
      },
    })),
  };
}

export interface AuthorProfile {
  slug: string;
  nameTa: string;
  nameEn: string;
  honorificTa: string;
  honorificEn: string;
  bioTa: string;
  bioEn: string;
  keywords: RegExp;
  sameAs: string[];
}

export const AUTHORS: AuthorProfile[] = [
  {
    slug: "muthamilarignar-kalaignar",
    nameTa: "முத்தமிழறிஞர் டாக்டர் கலைஞர் மு. கருணாநிதி",
    nameEn: "Muthamilarignar Dr. Kalaignar M. Karunanidhi",
    honorificTa: "முத்தமிழறிஞர் • ஐந்து முறை தமிழ்நாடு முதலமைச்சர் • எழுத்தாளர்",
    honorificEn: "Classical Tamil Scholar, Statesman & Five-Time Chief Minister of Tamil Nadu",
    bioTa:
      "முத்தமிழறிஞர் டாக்டர் கலைஞர் மு. கருணாநிதி (1924–2018) தமிழ் இலக்கியம், வரலாற்றுப் புதினம், திருக்குறள் உரை, நாடகம், திரைப்பட வசனம் மற்றும் சமூகநீதி அரசியல் ஆகிய துறைகளில் 75 ஆண்டுகளுக்கும் மேலாகப் பங்களித்த மாபெரும் படைப்பாளி. குறளோவியம், திருக்குறள் கலைஞர் உரை, நெஞ்சுக்கு நீதி, தென்பாண்டிச் சிங்கம், ரோமாபுரிப் பாண்டியன் உள்ளிட்ட நூற்றுக்கும் மேற்பட்ட நூல்களை எழுதியுள்ளார்.",
    bioEn:
      "Muthamilarignar Dr. Kalaignar M. Karunanidhi (1924–2018) was a towering Tamil literary figure, rationalist thinker, screenwriter, and five-time Chief Minister of Tamil Nadu. Across seven decades he authored landmark commentaries, historical novels, poetry, and memoirs including Tirukkural Kalaignar Urai, Kuraloviyam, Nenjukku Needhi, and Thenpandi Singam.",
    keywords: /kalaignar|karunanidhi|கலைஞர்|கருணாநிதி|குறள்|தென்பாண்டி|காகிதப் பூ/i,
    sameAs: [
      "https://en.wikipedia.org/wiki/M._Karunanidhi",
      ...PUBLISHER_ENTITY.sameAs,
    ],
  },
  {
    slug: "m-k-stalin",
    nameTa: "முத்துவேல் கருணாநிதி ஸ்டாலின்",
    nameEn: "M. K. Stalin",
    honorificTa: "தமிழ்நாடு முதலமைச்சர் • திராவிட மாடல் நாயகர்",
    honorificEn: "Chief Minister of Tamil Nadu & Proponent of the Dravidian Model",
    bioTa:
      "மாண்புமிகு தமிழ்நாடு முதலமைச்சர் மு. க. ஸ்டாலின் அவர்களின் உரைகள், வரலாற்றுப் பதிவுகள் மற்றும் சமூகநீதி-கூட்டாட்சி குறித்த 'திராவிட மாடல்' ஆட்சித் தத்துவ நூல்கள் முத்தமிழறிஞர் பதிப்பகத்தின் வழியாக வாசகர்களுக்கு வழங்கப்படுகின்றன.",
    bioEn:
      "M. K. Stalin serves as the Chief Minister of Tamil Nadu and President of the Dravida Munnetra Kazhagam. Publications covering his political journey, constitutional federalism speeches, and Tamil Nadu's inclusive Dravidian Model of governance are published and distributed through Muthamilarignar Pathipagam.",
    keywords: /stalin|ஸ்டாலின்|திராவிட மாடல்|dravidian model|மாநில சுயாட்சி|தமிழ்நாடு போராடும்/i,
    sameAs: [
      "https://en.wikipedia.org/wiki/M._K._Stalin",
      ...PUBLISHER_ENTITY.sameAs,
    ],
  },
  {
    slug: "dravidian-movement-scholars",
    nameTa: "திராவிட இயக்க வரலாற்று ஆய்வாளர்கள்",
    nameEn: "Dravidian Movement Historians & Editorial Collective",
    honorificTa: "முத்தமிழறிஞர் பதிப்பக ஆசிரியர் குழு",
    honorificEn: "Muthamilarignar Pathipagam Research & Editorial Board",
    bioTa:
      "தந்தை பெரியார், பேரறிஞர் அண்ணா, நீதிக்கட்சி முன்னோடிகள் மற்றும் சமூகநீதிப் போராட்ட வரலாற்றை ஆவணப்படுத்தும் ஆய்வாளர்கள் மற்றும் முத்தமிழறிஞர் பதிப்பக ஆசிரியர் குழுவின் தொகுப்பு நூல்கள்.",
    bioEn:
      "Historians, constitutional scholars, and the Muthamilarignar Pathipagam editorial collective documenting the Justice Party, Thanthai Periyar's Self-Respect Movement, Perarignar Anna's writings, reservation milestones, and linguistic federalism.",
    keywords: /திராவிட|சமூகநீதி|இந்தி|இடஒதுக்கீடு|dravid|varalaru|history/i,
    sameAs: [...PUBLISHER_ENTITY.sameAs],
  },
];

export function buildPersonJsonLd(author: AuthorProfile) {
  const homeUrl = SITE_URL;
  const authorUrl = `${homeUrl}/authors/${author.slug}`;
  const orgId = `${SITE_URL}/#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      ...buildOrganizationNodes(),
      {
        "@type": "Person",
        "@id": `${authorUrl}#person`,
        name: author.nameEn,
        alternateName: author.nameTa,
        jobTitle: author.honorificEn,
        description: author.bioEn,
        url: authorUrl,
        affiliation: { "@id": orgId },
        sameAs: author.sameAs,
      },
      buildBreadcrumbNode(
        [
          { name: `${PUBLISHER_ENTITY.nameTa} | Home`, url: homeUrl },
          { name: "ஆசிரியர்கள் | Authors", url: `${homeUrl}/authors` },
          { name: `${author.nameTa} | ${author.nameEn}`, url: authorUrl },
        ],
        `${authorUrl}#breadcrumb`,
      ),
    ],
  };
}

export interface PolicyDoc {
  slug: "shipping" | "returns" | "privacy" | "terms";
  titleTa: string;
  titleEn: string;
  summaryEn: string;
  summaryTa: string;
  sections: Array<{ hTa: string; hEn: string; pTa: string; pEn: string }>;
}

export const POLICIES: Record<PolicyDoc["slug"], PolicyDoc> = {
  shipping: {
    slug: "shipping",
    titleTa: "விநியோகக் கொள்கை",
    titleEn: "Shipping & Delivery Policy",
    summaryEn:
      "Muthamilarignar Pathipagam dispatches authentic printed books from Chennai within 24–48 business hours. Pan-India delivery available (3–6 business days in Tamil Nadu and 5–8 business days across India).",
    summaryTa:
      "முத்தமிழறிஞர் பதிப்பக நூல்கள் சென்னையிலிருந்து 24–48 வேலை மணி நேரத்திற்குள் அனுப்பப்படுகின்றன. இந்தியா முழுவதும் டெலிவரி உண்டு (தமிழ்நாட்டிற்குள் 3–6 வேலை நாட்கள், பிற மாநிலங்களுக்கு 5–8 வேலை நாட்கள்).",
    sections: [
      {
        hTa: "1. அனுப்புதல் மற்றும் விநியோகக் கால அளவு",
        hEn: "1. Dispatch & Transit Timelines",
        pTa: "உறுதி செய்யப்பட்ட அனைத்து ஆர்டர்களும் சென்னை தேனாம்பேட்டை மையத்திலிருந்து 24 முதல் 48 மணி நேரத்திற்குள் ஈரப்பதம் தாங்கும் பாதுகாப்பான பொதிகளில் அனுப்பப்படுகின்றன. தமிழ்நாட்டிற்குள் 3–6 வேலை நாட்களிலும், இந்தியாவின் பிற பகுதிகளுக்கு 5–8 வேலை நாட்களிலும் சென்றடையும்.",
        pEn: "All confirmed orders are packed in moisture-resistant protective sleeves and dispatched from our Teynampet, Chennai fulfillment desk within 24–48 business hours. Transit takes 3–6 business days across Tamil Nadu and 5–8 business days across the rest of India.",
      },
      {
        hTa: "2. விநியோகக் கட்டணம் மற்றும் இந்தியா முழுவதும் டெலிவரி",
        hEn: "2. Shipping Charges & Pan-India Delivery",
        pTa: "இந்தியா முழுவதும் டெலிவரி உண்டு. விநியோகக் கட்டணம் உங்கள் ஆர்டர் மற்றும் முகவரியைப் பொறுத்து செக்அவுட் (Checkout) பக்கத்தில் கட்டணம் செலுத்தும் முன் வெளிப்படையாகக் காட்டப்படும்.",
        pEn: "Pan-India delivery available. Applicable shipping charges are calculated and displayed transparently at checkout prior to payment.",
      },
      {
        hTa: "3. கண்காணிப்பு மற்றும் உதவி",
        hEn: "3. Order Tracking & Support",
        pTa: "நூல் அனுப்பப்பட்டவுடன் கண்காணிப்பு விவரம் வழங்கப்படும். உதவிக்கு WhatsApp: +91 82204 51520 அல்லது muthamilarignar@gmail.com வழியாகத் தொடர்புகொள்ளலாம்.",
        pEn: "Tracking updates are shared once dispatched. For delivery assistance, reach Muthamilarignar Pathipagam at +91 82204 51520 (WhatsApp) or muthamilarignar@gmail.com.",
      },
    ],
  },
  returns: {
    slug: "returns",
    titleTa: "மாற்று மற்றும் பணம் திரும்பப் பெறும் கொள்கை",
    titleEn: "Returns, Replacements & Refunds Policy",
    summaryEn:
      "Readers may request a free replacement or full refund within 7 days of delivery for damaged, misprinted, missing-page, or wrong book shipments from Muthamilarignar Pathipagam.",
    summaryTa:
      "போக்குவரத்தில் சேதமடைந்த, அச்சுப் பிழையுள்ள அல்லது தவறாக அனுப்பப்பட்ட நூல்களுக்கு விநியோகம் செய்யப்பட்ட 7 நாட்களுக்குள் இலவச மாற்றுப் பிரதி அல்லது முழுப் பணத்தைத் திரும்பப் பெறலாம்.",
    sections: [
      {
        hTa: "1. தகுதியான மாற்றுக் கோரிக்கைகள்",
        hEn: "1. Eligibility for Replacement or Refund",
        pTa: "நூல் போக்குவரத்தில் சேதமடைந்திருந்தாலோ, பக்கங்கள் விடுபட்டிருந்தாலோ அல்லது வேறு நூல் அனுப்பப்பட்டிருந்தாலோ, பொருள் கிடைத்த 7 நாட்களுக்குள் ஆர்டர் எண் மற்றும் புகைப்படங்களுடன் தெரிவிக்கவும்.",
        pEn: "If your book arrives physically damaged in transit, has binding/printing defects, or differs from the ordered title, notify us within 7 calendar days of delivery with your order number and clear photos.",
      },
      {
        hTa: "2. பணம் திரும்பச் செலுத்தும் கால அளவு",
        hEn: "2. Refund Processing Timeline",
        pTa: "மாற்றுப் பிரதி உடனடியாகக் கட்டணமின்றி அனுப்பப்படும். பணம் திரும்பப் பெறும் நிகழ்வுகளில், ஆய்வு முடிந்த 5–7 வேலை நாட்களுக்குள் மூலக் கட்டண முறைக்கே (UPI / கார்டு / வங்கிக் கணக்கு) முழுத் தொகையும் திருப்பி அனுப்பப்படும்.",
        pEn: "Free replacement copies ship within 48 hours of approval. Approved refunds are credited back to the original payment method (or bank/UPI for COD orders) within 5–7 business days.",
      },
    ],
  },
  privacy: {
    slug: "privacy",
    titleTa: "தனியுரிமைக் கொள்கை",
    titleEn: "Privacy Policy",
    summaryEn:
      "Muthamilarignar Pathipagam collects only essential contact and delivery details required to fulfill book orders, issue GST/tax-exempt invoices, and provide order support under Indian data protection standards.",
    summaryTa:
      "முத்தமிழறிஞர் பதிப்பகம் நூல் விநியோகம், விலைப்பட்டியல் மற்றும் வாடிக்கையாளர் சேவைக்குத் தேவையான அடிப்படைத் தகவல்களை மட்டுமே பாதுகாப்பாகச் சேகரிக்கிறது.",
    sections: [
      {
        hTa: "1. சேகரிக்கப்படும் தகவல்கள்",
        hEn: "1. Information We Collect",
        pTa: "பெயர், கைபேசி எண், மின்னஞ்சல் மற்றும் விநியோக முகவரி ஆகியவை உங்கள் நூல் ஆர்டரை நிறைவேற்ற மட்டுமே பயன்படுத்தப்படுகின்றன. ஆன்லைன் கட்டணங்கள் Razorpay பாதுகாப்பான தளத்தின் வழியாக நடைபெறுகின்றன; கார்டு எண்கள் எமது சேவையகத்தில் சேமிக்கப்படுவதில்லை.",
        pEn: "We collect your name, phone number, email address, and shipping address solely to process and deliver your book orders. Online payments are processed via PCI-DSS compliant Razorpay; card credentials are never stored on our servers.",
      },
      {
        hTa: "2. தரவுப் பாதுகாப்பு மற்றும் உரிமைகள்",
        hEn: "2. Data Protection & Reader Rights",
        pTa: "உங்கள் தனிப்பட்ட தகவல்கள் மூன்றாம் தரப்பு விளம்பர நிறுவனங்களுக்கு விற்கப்படுவதில்லை. உங்கள் கணக்குத் தகவலைத் திருத்தவோ நீக்கவோ muthamilarignar@gmail.com என்ற மின்னஞ்சலுக்கு எழுதலாம்.",
        pEn: "We never sell or rent reader data to third-party marketers. You may review, update, or request deletion of your stored profile data anytime by emailing muthamilarignar@gmail.com.",
      },
    ],
  },
  terms: {
    slug: "terms",
    titleTa: "பயன்பாட்டு விதிமுறைகள்",
    titleEn: "Terms & Conditions",
    summaryEn:
      "All publications sold on this official storefront are authentic editions of Muthamilarignar Pathipagam, priced in Indian Rupees (INR) with 0% GST on printed books.",
    summaryTa:
      "இத்தளத்தில் விற்கப்படும் அனைத்து நூல்களும் முத்தமிழறிஞர் பதிப்பகத்தின் அதிகாரப்பூர்வப் பதிப்புகளாகும்; இந்திய ரூபாயில் (INR) 0% GST உடன் வழங்கப்படுகின்றன.",
    sections: [
      {
        hTa: "1. பதிப்புரிமை மற்றும் அசல் பதிப்புகள்",
        hEn: "1. Copyright & Authentic Editions",
        pTa: "இத்தளத்தில் இடம்பெற்றுள்ள நூல்கள், அட்டைப் படங்கள் மற்றும் உள்ளடக்கங்களின் பதிப்புரிமை முத்தமிழறிஞர் பதிப்பகத்திற்கு உரியது. அனுமதியின்றி மறுஅச்சு செய்வது சட்டப்படி தடுக்கப்பட்டுள்ளது.",
        pEn: "All book texts, cover designs, and catalog metadata are copyrighted publications of Muthamilarignar Pathipagam, Chennai. Unauthorized reproduction or commercial redistribution is prohibited.",
      },
      {
        hTa: "2. விலை மற்றும் கையிருப்பு",
        hEn: "2. Pricing, Stock & Order Confirmation",
        pTa: "அனைத்து விலைகளும் இந்திய ரூபாயில் (₹) குறிப்பிடப்பட்டுள்ளன. அச்சிடப்பட்ட நூல்களுக்கு 0% GST பொருந்தும். அதிகாரப்பூர்வ ஆர்டர் எண் உருவான பிறகே ஆர்டர் உறுதி செய்யப்படும்.",
        pEn: "All prices are listed in Indian Rupees (INR) and printed books carry 0% GST. Orders are confirmed upon generation of a verified server order ID, subject to live stock availability.",
      },
    ],
  },
};
