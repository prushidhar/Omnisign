/**
 * DialogueSynthesizer.ts
 *
 * OmniSign Multilingual Semantic Dialogue Synthesizer.
 * Formulates polite, context-rich spoken sentences from accumulated ISL gloss tokens.
 *
 * Supports:
 * - English (en-IN)
 * - Hindi   (hi-IN)
 * - Telugu  (te-IN) — specifically tailored for the Hyderabad iQOO Hackathon
 */

export type SupportedLanguage = 'en' | 'hi' | 'te';

export interface DialogueOutput {
  language: SupportedLanguage;
  sentence: string;
  isEmergency: boolean;
}

export class DialogueSynthesizer {
  /**
   * Synthesize natural spoken sentences across supported languages.
   */
  static synthesize(
    tokens: readonly string[],
    scenario: string = 'hospital',
    lang: SupportedLanguage = 'en',
  ): DialogueOutput {
    if (!tokens || tokens.length === 0) {
      return { language: lang, sentence: '', isEmergency: false };
    }

    const has = (t: string) => tokens.includes(t);
    const spelledToken = tokens.find(t => t.startsWith('#'));
    const cleanSpelled = spelledToken ? spelledToken.slice(1).trim() : null;

    // ── 1. Priority Emergency & Acute Distress Protocols ────────────────────
    if (has('CHEST-PAIN')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Emergency! I am experiencing severe chest pain and heart distress. Please call a doctor immediately.',
        hi: 'आपातकालीन! मुझे सीने में बहुत तेज दर्द हो रहा है। कृपया तुरंत डॉक्टर को बुलाएं।',
        te: 'అత్యవసరం! నాకు తీవ్రమైన గుండెనొప్పిగా ఉంది. దయచేసి వెంటనే వైద్యుడిని పిలవండి.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: true };
    }

    if (has('BREATHING')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Emergency! I am experiencing acute respiratory distress and difficulty breathing.',
        hi: 'आपातकालीन! मुझे सांस लेने में गंभीर तकलीफ हो रही है, तुरंत सहायता चाहिए।',
        te: 'అత్యవసరం! నాకు శ్వాస తీసుకోవడంలో తీవ్రమైన ఇబ్బందిగా ఉంది, వెంటనే సహాయం కావాలి.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: true };
    }

    if (has('AMBULANCE')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Emergency! Please call an ambulance immediately for medical transport.',
        hi: 'आपातकालीन! कृपया तुरंत एम्बुलेंस को कॉल करें।',
        te: 'అత్యవసరం! దయచేసి వెంటనే అంబులెన్స్‌కు కాల్ చేయండి.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: true };
    }

    if (has('FIRE')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Emergency! Fire alert at this counter, please evacuate and call emergency services.',
        hi: 'आपातकालीन! यहाँ आग का खतरा है, कृपया आपातकालीन सेवाओं को सूचित करें।',
        te: 'అత్యవసరం! ఇక్కడ అగ్ని ప్రమాదం ఉంది, దయచేసి వెంటనే రక్షణ బృందాన్ని పిలవండి.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: true };
    }

    if (has('POLICE') && !has('LOST') && !has('COMPLAINT')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Urgent! Police or security assistance is requested at this counter immediately.',
        hi: 'तत्काल! इस काउंटर पर तुरंत पुलिस या सुरक्षा सहायता की आवश्यकता है।',
        te: 'తక్షణ అవసరం! ఈ కౌంటర్ వద్ద వెంటనే పోలీసు లేదా భద్రతా సహాయం కావాలి.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: true };
    }

    const isPainEmergency = has('PAIN') && (has('HELP') || has('EMERGENCY') || tokens.length === 1);
    if (isPainEmergency) {
      const emergencyMap: Record<SupportedLanguage, string> = {
        en: 'Emergency: I am experiencing severe physical pain and need immediate medical attention.',
        hi: 'आपातकालीन: मुझे बहुत तेज दर्द हो रहा है और तुरंत चिकित्सा सहायता चाहिए।',
        te: 'అత్యవసరం: నాకు తీవ్రమైన నొప్పిగా ఉంది, దయచేసి వెంటనే వైద్య సహాయం అందించండి.',
      };
      return {
        language: lang,
        sentence: emergencyMap[lang] ?? emergencyMap.en,
        isEmergency: true,
      };
    }

    // ── 2. Delivery & Transit Call Protocols (Zomato / Swiggy / Blinkit / Uber) ──
    if (has('GATE_LEFT') || has('LEFT') || (has('GATE') && has('LEFT'))) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Bhaiya, please take a left turn at the main society gate. My building is right there.',
        hi: 'भैया, मुख्य गेट से बाएं मुड़ें। इमारत वहीं सामने है।',
        te: 'అన్నా, మెయిన్ గేట్ వద్ద ఎడమవైపుకి తిరగండి. భవనం అక్కడే ఉంది.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('GATE_RIGHT') || has('RIGHT') || (has('GATE') && has('RIGHT'))) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Bhaiya, please take a right turn after entering the gate, near Tower C.',
        hi: 'भैया, गेट के अंदर आकर दाएं मुड़ें, टावर सी के पास।',
        te: 'అన్నా, గేటు లోపలికి వచ్చి కుడివైపుకి తిరగండి, టవర్ సి దగ్గర.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('DOOR') || has('LEAVE_AT_DOOR')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Please leave the package at the door outside flat 402, no need to wait.',
        hi: 'कृपया पार्सल फ्लैट 402 के दरवाजे के बाहर रख दें, इंतजार करने की जरूरत नहीं है।',
        te: 'దయచేసి పార్సెల్ ఫ్లాట్ 402 తలుపు బయట ఉంచండి, వేచి ఉండాల్సిన అవసరం లేదు.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('COMING_DOWN')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'I am taking the elevator down to the lobby right now, please wait 1 minute.',
        hi: 'मैं लिफ्ट से नीचे लॉबी में आ रहा हूँ, कृपया 1 मिनट प्रतीक्षा करें।',
        te: 'నేను లిఫ్ట్ ద్వారా కింద లాబీకి వస్తున్నాను, దయచేసి 1 నిమిషం ఆగండి.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('FLOOR_2') || (has('FLOOR') && has('2'))) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Please come up to the 2nd floor, flat 204. The lift is on the right.',
        hi: 'कृपया दूसरी मंजिल, फ्लैट 204 पर आ जाएं। लिफ्ट दाईं ओर है।',
        te: 'దయచేసి 2వ అంతస్తు, ఫ్లాట్ 204 కి రండి. లిఫ్ట్ కుడివైపున ఉంది.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('BELL') || has('RING_BELL')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Please ring the doorbell once you reach my door.',
        hi: 'दरवाजे पर पहुँचकर कृपया घंटी बजाएं।',
        te: 'తలుపు వద్దకు చేరుకున్నాక దయచేసి కాలింగ్ బెల్ కొట్టండి.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('OTP')) {
      const otpVal = cleanSpelled ?? '4 8 2 1';
      const map: Record<SupportedLanguage, string> = {
        en: `Your delivery verification OTP is ${otpVal}.`,
        hi: `डिलीवरी सत्यापन ओटीपी ${otpVal} है।`,
        te: `డెలివరీ ధృవీకరణ ఓటీపీ ${otpVal}.`,
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('YES') && tokens.length === 1) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Yes, that is correct, thank you!',
        hi: 'हाँ, बिल्कुल सही है, धन्यवाद!',
        te: 'అవును, సరిగ్గానే ఉంది, ధన్యవాదాలు!',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('NO') && tokens.length === 1) {
      const map: Record<SupportedLanguage, string> = {
        en: 'No, that is not required, please leave it outside.',
        hi: 'नहीं, उसकी आवश्यकता नहीं है, कृपया बाहर रख दें।',
        te: 'వద్దు, అవసరం లేదు, దయచేసి బయట ఉంచండి.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    // ── 3. Fingerspelled Tokens / Numbers Integration ────────────────────────
    if (cleanSpelled) {
      const formattedWord = cleanSpelled.charAt(0).toUpperCase() + cleanSpelled.slice(1).toLowerCase();

      // Cash Deposit / Withdrawal with amount (prioritized over generic digits)
      if (has('DEPOSIT') || has('WITHDRAW') || has('CASH') || (has('MONEY') && /^\d+$/.test(cleanSpelled))) {
        const action = has('WITHDRAW') ? 'withdraw' : 'deposit';
        const actionHi = has('WITHDRAW') ? 'निकासी' : 'जमा';
        const actionTe = has('WITHDRAW') ? 'విత్‌డ్రా' : 'జమ';
        const map: Record<SupportedLanguage, string> = {
          en: `Hello, I would like to ${action} ${cleanSpelled} rupees into my account, please.`,
          hi: `नमस्ते, मैं अपने खाते में ${cleanSpelled} रुपये ${actionHi} करना चाहता हूँ।`,
          te: `నమస్కారం, నేను నా ఖాతాలో ${cleanSpelled} రూపాయలు ${actionTe} చేయాలనుకుంటున్నాను.`,
        };
        return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
      }

      // Prescribed Drug Name (e.g. #METFORMIN, #PARACETAMOL)
      if (has('MEDICINE') || has('PRESCRIPTION')) {
        const map: Record<SupportedLanguage, string> = {
          en: `Hello, I need to collect my prescribed ${formattedWord} medication, please.`,
          hi: `नमस्ते, मुझे अपनी निर्धारित दवाई ${formattedWord} प्राप्त करनी है, कृपया।`,
          te: `నమస్కారం, నాకు సూచించిన ${formattedWord} మందులు తీసుకోవాలి, దయచేసి.`,
        };
        return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
      }

      // Token number (e.g. TOKEN 42 or generic digits)
      if (has('TOKEN') || /^\d+$/.test(cleanSpelled)) {
        const map: Record<SupportedLanguage, string> = {
          en: `Hello, my service token number is ${cleanSpelled}.`,
          hi: `नमस्ते, मेरा टोकन नंबर ${cleanSpelled} है।`,
          te: `నమస్కారం, నా టోకెన్ సంఖ్య ${cleanSpelled}.`,
        };
        return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
      }
    }

    // ── 3. Compound Healthcare Phrases ──────────────────────────────────────
    if (has('MEDICINE') && has('PRESCRIPTION')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, could you please help me refill my prescription medication?',
        hi: 'नमस्ते, क्या आप कृपया मेरे पर्चे की दवाई देने में मदद करेंगे?',
        te: 'నమస్కారం, దయచేసి నా ప్రిస్క్రిప్షన్ మందులు ఇవ్వడానికి సహాయం చేస్తారా?',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('HELP') && has('MEDICINE')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, I need assistance getting my prescribed medication, please.',
        hi: 'नमस्ते, मुझे अपनी निर्धारित दवाई प्राप्त करने में सहायता चाहिए।',
        te: 'నమస్కారం, నా మందులు తీసుకోవడానికి దయచేసి సహాయం చేయండి.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('DOCTOR') || (has('HELP') && has('DOCTOR'))) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, could you please tell me which consultation room the on-duty doctor is in?',
        hi: 'नमस्ते, क्या आप बता सकते हैं कि ड्यूटी डॉक्टर किस कमरे में हैं?',
        te: 'నమస్కారం, ఆన్-డ్యూటీ డాక్టర్ ఏ గదిలో ఉన్నారో దయచేసి చెప్పగలరా?',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('APPOINTMENT')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, I have an appointment scheduled today. Could you please check me in?',
        hi: 'नमस्ते, आज मेरा अपॉइंटमेंट निर्धारित है। कृपया मेरा नाम दर्ज करें?',
        te: 'నమస్కారం, ఈరోజు నాకు అపాయింట్‌మెంట్ ఉంది. దయచేసి నమోదు చేస్తారా?',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    // ── 4. Compound Banking Phrases ─────────────────────────────────────────
    if (has('PASSBOOK')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, I would like to update my bank passbook entries, please.',
        hi: 'नमस्ते, मैं अपनी बैंक पासबुक प्रविष्टियों को अपडेट करवाना चाहता हूँ।',
        te: 'నమస్కారం, నేను నా బ్యాంక్ పాస్‌బుక్ ఎంట్రీలను అప్‌డేట్ చేయాలనుకుంటున్నాను.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('ACCOUNT') && (has('PROBLEM') || has('HELP'))) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, I have an issue with my bank account that I need help resolving.',
        hi: 'नमस्ते, मेरे बैंक खाते में एक समस्या है, कृपया समाधान में मदद करें।',
        te: 'నమస్కారం, నా బ్యాంక్ ఖాతాలో ఒక సమస్య ఉంది, దయచేసి పరిష్కరించండి.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('MONEY') || has('CASH') || has('DEPOSIT')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, I would like to process a cash deposit or withdrawal, please.',
        hi: 'नमस्ते, मैं नकद लेन-देन (जमा या निकासी) करना चाहता हूँ।',
        te: 'నమస్కారం, నేను నగదు డిపాజిట్ లేదా విత్‌డ్రా చేసుకోవాలనుకుంటున్నాను.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    // ── 5. Civic & Government Desks ─────────────────────────────────────
    if (has('AADHAAR')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, I need assistance with updating my Aadhaar card details.',
        hi: 'नमस्ते, मुझे अपने आधार कार्ड विवरण को अपडेट करने में सहायता चाहिए।',
        te: 'నమస్కారం, నా ఆధార్ కార్డ్ వివరాలను అప్‌డేట్ చేయడంలో సహాయం కావాలి.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('CERTIFICATE') || has('FORM')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, where can I submit this official certificate application form?',
        hi: 'नमस्ते, मैं यह आधिकारिक प्रमाण पत्र आवेदन पत्र कहाँ जमा कर सकता हूँ?',
        te: 'నమస్కారం, ఈ అధికారిక ధృవీకరణ పత్రం దరఖాస్తు ఫారమ్‌ను నేను ఎక్కడ సమర్పించగలను?',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('COMPLAINT') || (has('POLICE') && has('LOST'))) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Officer, I need to report a lost personal item and file an official complaint.',
        hi: 'अधिकारी महोदय, मुझे एक खोई हुई वस्तु की रिपोर्ट करनी है और शिकायत दर्ज करवानी है।',
        te: 'అధికారి గారూ, నా వస్తువు పోయినట్లు ఫిర్యాదు నమోదు చేయాలనుకుంటున్నాను.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    // ── 6. Education & Classroom Scenarios ──────────────────────────────────
    if (has('QUESTION') || (has('EXAM') && has('HELP')) || (has('TEACHER') && has('QUESTION'))) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Excuse me professor, I have a doubt regarding the lecture and upcoming examination.',
        hi: 'माफ़ कीजिए प्रोफेसर, मुझे व्याख्यान और आगामी परीक्षा के बारे में एक शंका है।',
        te: 'నన్ను క్షమించండి ప్రొఫెసర్, నాకు ఉపన్యాసం మరియు రాబోయే పరీక్షపై ఒక సందేహం ఉంది.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('STUDY') || has('BOOK') || has('SCHOOL')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, I am looking for the required study textbooks and course reference materials.',
        hi: 'नमस्ते, मुझे आवश्यक पाठ्यपुस्तकों और संदर्भ सामग्री की आवश्यकता है।',
        te: 'నమస్కారం, నాకు అవసరమైన అధ్యయన పుస్తకాలు మరియు కోర్సు మెటీరియల్స్ కావాలి.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    // ── 7. Workplace, Tech & Corporate Scenarios ────────────────────────────
    if (has('PROJECT') || has('MEETING') || has('WORK')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello team, I would like to present my project progress and sprint updates during the meeting.',
        hi: 'नमस्ते टीम, मैं बैठक में अपनी परियोजना की प्रगति और अद्यतन प्रस्तुत करना चाहता हूँ।',
        te: 'నమస్కారం టీమ్, సమావేశంలో నా ప్రాజెక్ట్ పురోగతిని వివరించాలనుకుంటున్నాను.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('JOB') || has('INTERVIEW')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, I am here for my scheduled job interview and look forward to our discussion.',
        hi: 'नमस्ते, मैं अपने निर्धारित साक्षात्कार के लिए यहाँ उपस्थित हुआ हूँ।',
        te: 'నమస్కారం, నేను నా ఉద్యోగ ఇంటర్వ్యూ కోసం ఇక్కడికి వచ్చాను.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('COMPUTER') || has('EMAIL') || has('CODE')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'I have sent the updated technical files and code repository review to your email.',
        hi: 'मैंने अद्यतन तकनीकी फाइलें और कोड समीक्षा आपके ईमेल पर भेज दी है।',
        te: 'నేను అప్‌డేట్ చేసిన కోడ్ మరియు ప్రాజెక్ట్ ఫైళ్ళను మీ ఇమెయిల్‌కి పంపాను.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    // ── 8. Travel, Transit & Airports ───────────────────────────────────────
    if (has('TRAIN') || has('PLATFORM')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Could you please guide me to the platform where my scheduled train arrives?',
        hi: 'कृपया मुझे बताएं कि मेरी निर्धारित ट्रेन किस प्लेटफॉर्म पर आएगी?',
        te: 'దయచేసి నా రైలు ఏ ప్లాట్‌ఫారమ్‌పై వస్తుందో చెప్పగలరా?',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('FLIGHT') || has('AIRPORT')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, could you please tell me the boarding gate and departure status for my flight?',
        hi: 'नमस्ते, क्या आप मेरी उड़ान के लिए बोर्डिंग गेट और प्रस्थान की स्थिति बता सकते हैं?',
        te: 'నమస్కారం, నా విమానం యొక్క బోర్డింగ్ గేట్ మరియు బయలుదేరే సమయం చెప్పగలరా?',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('HOTEL') || has('LUGGAGE') || has('PASSPORT')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, I have a reservation and would like assistance with check-in and luggage, please.',
        hi: 'नमस्ते, मेरा आरक्षण है और मुझे चेक-इन तथा सामान के लिए सहायता चाहिए।',
        te: 'నమస్కారం, నాకు రిజర్వేషన్ ఉంది, దయచేసి చెక్-ఇన్ మరియు లగేజీ సహాయం చేయండి.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    // ── 9. Retail, Shopping & Dining ────────────────────────────────────────
    if (has('PRICE') || has('DISCOUNT') || (has('SHOP') && has('BUY'))) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, could you please tell me the price of this item and if any discount applies?',
        hi: 'नमस्ते, क्या आप इस वस्तु की कीमत और छूट की जानकारी दे सकते हैं?',
        te: 'నమస్కారం, ఈ వస్తువు ధర మరియు ఏదైనా తగ్గింపు ఉందో చెప్పగలరా?',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('TEA') || has('COFFEE') || has('FOOD') || has('ORDER') || has('BILL')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, I would like to place my order and receive the bill, please.',
        hi: 'नमस्ते, मैं अपना ऑर्डर देना चाहता हूँ और कृपया बिल दें।',
        te: 'నమస్కారం, నేను ఆర్డర్ ఇవ్వాలనుకుంటున్నాను మరియు దయచేసి బిల్లు ఇవ్వండి.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    // ── 10. Family, Social Life & Emotions ──────────────────────────────────
    if (has('FAMILY') || has('HOME') || has('FATHER') || has('MOTHER')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Hello, I am spending quality time with my family at home.',
        hi: 'नमस्ते, मैं घर पर अपने परिवार के साथ समय बिता रहा हूँ।',
        te: 'నమస్కారం, నేను ఇంట్లో నా కుటుంబంతో సమయం గడుపుతున్నాను.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('FRIEND') || has('HAPPY') || has('LOVE')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'I am very glad and happy to meet and communicate with you today!',
        hi: 'आज आपसे मिलकर और बातचीत करके मुझे बहुत खुशी हुई!',
        te: 'ఈరోజు మిమ్మల్ని కలిసి మాట్లాడటం నాకు చాలా సంతోషంగా ఉంది!',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    // ── 11. Conversational & Polite Desks ───────────────────────────────────
    if (has('THANK-YOU')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Thank you very much for your kind support and assistance.',
        hi: 'आपकी सहायता और सहयोग के लिए बहुत-बहुत धन्यवाद।',
        te: 'మీ సహాయానికి చాలా ధన్యవాదాలు.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    if (has('WAIT')) {
      const map: Record<SupportedLanguage, string> = {
        en: 'Please give me a moment to organize my documents.',
        hi: 'कृपया मुझे अपने दस्तावेज़ देखने के लिए एक क्षण दें।',
        te: 'దయచేసి నా పత్రాలు చూసుకోవడానికి ఒక క్షణం సమయం ఇవ్వండి.',
      };
      return { language: lang, sentence: map[lang] ?? map.en, isEmergency: false };
    }

    // ── 12. General Fallback Synthesis ──────────────────────────────────────
    const enFallback = tokens
      .map(t => t.startsWith('#') ? t.slice(1) : (t.charAt(0) + t.slice(1).toLowerCase()))
      .join(' ');

    if (lang === 'hi') {
      return { language: 'hi', sentence: `कृपया सहायता करें: ${enFallback}।`, isEmergency: false };
    }
    if (lang === 'te') {
      return { language: 'te', sentence: `దయచేసి సహాయం చేయండి: ${enFallback}.`, isEmergency: false };
    }

    return {
      language: 'en',
      sentence: `Please assist with: ${enFallback}, please.`,
      isEmergency: false,
    };
  }
}
