import type { ActiveHazard, HazardKind } from '../types/safety';
import type { EffortBreakdown } from './safety/effort';
import type { LanguageCode } from '../types/sugampath';

const EN = {
  // Emergency contact
  contactTitle: 'Who should we alert in an emergency?',
  contactName: 'Name',
  contactPhone: 'Phone number',
  contactSave: 'Save',
  contactChange: 'Change',
  contactInvalid: 'Enter a valid phone number',
  contactWhy: 'Used only if you fall or ask for help. Stays on this phone.',
  contactSaved: (name: string) => `Alerts go to ${name}`,
  contactNone: 'No emergency contact yet',
  mappingLabel: 'Help map smooth paths while I walk',

  // Route screen
  easiest: 'Easiest',
  heading: 'Heads-up on this route',
  slope: 'Max slope',
  slopeBand: { safe: 'Safe', steep: 'Steep', very_steep: 'Very steep' },
  stepsN: (n: number) => (n === 1 ? '1 step' : `${n} steps`),
  smoothN: (p: number) => `${p}% smooth`,
  crossingsN: (n: number) => (n === 1 ? '1 crossing' : `${n} crossings`),
  hazardKind: {
    stairs: 'Unmapped stairs',
    no_ramp: 'No ramp',
    rough_surface: 'Rough pavement',
    broken_lift: 'Lift not working',
    blocked_path: 'Path blocked',
    vendor: 'Street vendor',
    parked_vehicle: 'Parked vehicle',
    other: 'Obstruction',
  } as Record<HazardKind, string>,
  cautionLive: (kind: string, until: string) => `Live caution: ${kind}. Clears by about ${until}`,
  cautionPeak: (kind: string) => `Often blocked 5 to 8 PM: ${kind}`,
  cautionMaint: (kind: string, days: number) =>
    days < 1 ? `${kind}. Reported today` : `${kind}. Reported ${days} day${days === 1 ? '' : 's'} ago`,
  cautionStanding: (kind: string) => kind,

  // Walking
  safetyOn: 'Fall alert is on',
  shareTitle: 'Let family follow your walk',
  shareBtn: 'Share live link',
  shareCopied: 'Link copied',
  sharing: 'Family can follow you live',
  sosHold: 'Hold for emergency',
  sosHoldShort: 'Emergency',

  // Blind walking mode
  briefing:
    'Walking mode. Tap anywhere to hear directions. Hold to ask. Triple tap or hold four seconds for emergency.',
  hintTap: 'Tap: directions',
  hintHold: 'Hold: ask',
  hintSos: 'Triple tap: emergency',
  guidance: (instruction: string, m: number) => `${instruction}. About ${m} metres.`,
  stepOf: (i: number, n: number) => `Step ${i} of ${n}`,
  listening: 'Listening',
  didntCatch: "Sorry, I didn't catch that. You can say: report stairs, where is the gate, or what's ahead.",
  reported: (kind: string) => `Noted. ${kind} reported here. Thank you.`,
  gateWhere: (gate: string, side: string) => `${gate} is ${side}.`,
  gateNoCompass: (gate: string) => `${gate} is at the end of this route.`,
  side: { ahead: 'straight ahead', left: 'on your left', right: 'on your right', behind: 'behind you' },
  lookingAhead: 'Looking ahead',
  aheadFail: "I couldn't see clearly. Please stop and ask someone nearby.",
  holdToExit: 'Hold to exit',
  noContactWarn: 'No emergency contact is saved. An emergency will point you to 112.',
  nextStepSpoken: 'Next step.',

  // SOS
  sosCountdownSpeech: 'Emergency alert in 8 seconds. Tap screen anywhere to cancel.',
  sosIn: 'Emergency alert in',
  sosCancelHint: 'Tap anywhere to cancel',
  sosCancelled: 'Cancelled. Glad you are okay.',
  sosSentSpeech: (name: string | null) =>
    name
      ? `Alert sent to ${name}. Tap the top of the screen to call. Tap the middle to send a message. Hold the bottom to say you are safe.`
      : 'Alert sent. Tap the top of the screen to call 112. Hold the bottom to say you are safe.',
  sosSentTitle: 'Alert sent',
  sosCall: (name: string) => `Call ${name}`,
  sosCall112: 'Call 112',
  sosWhatsapp: 'WhatsApp message',
  sosSms: 'Send SMS',
  sosImOk: 'Hold: I am safe',
  sosFall: 'A fall was detected.',
  sosManual: 'Emergency requested.',
  sosMessage: (reason: string, url: string) => `SugamPath emergency. ${reason} I may need help. Live location: ${url}`,

  // Arrival
  arrivalQ: (gate: string) => `Was ${gate} step-free and the lift working today?`,
  arrivalYes: 'Yes',
  arrivalNo: 'No',
  arrivalSpeech: (gate: string) =>
    `You have arrived. Was ${gate} step-free and the lift working today? Tap the top for yes. Tap the bottom for no.`,
  arrivalThanks: 'Thank you. This keeps the map true for the next person.',
  arrivalMapped: (m: number) => `Your walk helped map ${m} metres of path.`,

  // Resume
  resumeTitle: (place: string) => `Continue your walk to ${place}?`,
  resumeBtn: 'Continue',
  resumeDismiss: 'No thanks',

  // Track page
  trackTitle: (name: string) => `Walking with ${name}`,
  trackWaiting: 'Waiting for the first update',
  trackNotFound: 'This link has ended or is not valid.',
  statusWalking: 'Walking',
  statusArrived: 'Arrived safely',
  statusEnded: 'Trip ended',
  statusSos: 'NEEDS HELP',
  trackStep: (i: number, n: number) => `Step ${i} of ${n}`,
  trackUpdated: (s: number) => (s < 5 ? 'Updated just now' : s < 90 ? `Updated ${s} seconds ago` : `Updated ${Math.round(s / 60)} minutes ago`),
  trackBattery: (p: number) => `Battery ${p}%`,
  trackOpenMap: 'Open location in Maps',
  trackNoLocation: 'Location not shared yet',
  trackCautions: 'On their route',
  trackSosAt: (time: string) => `Emergency alert at ${time}`,
  trackSosResolved: 'They have said they are safe.',
  trackFall: 'A fall was detected.',
  trackManual: 'They asked for help.',
  trackCall: (name: string) => `Call ${name}`,
  trackTraveller: 'your family member',
  trackOffline: 'You are offline. Showing the last update.',

  // Legal
  legalHeading: 'Official report',
  legalReady: 'Evidence meets the verification threshold.',
  legalBlocked: 'Not ready for a legal report yet',
  legalCreate: 'Create verified report',
  legalPrint: 'Print or save as PDF',
  legalClose: 'Close',
  legalStructural: 'Structural non-compliance',
  legalMunicipal: 'Municipal enforcement summary',
};

export type SafetyStrings = typeof EN;

const HI: SafetyStrings = {
  contactTitle: 'आपातकाल में किसे सूचित करें?',
  contactName: 'नाम',
  contactPhone: 'फ़ोन नंबर',
  contactSave: 'सहेजें',
  contactChange: 'बदलें',
  contactInvalid: 'सही फ़ोन नंबर लिखें',
  contactWhy: 'सिर्फ़ गिरने या मदद माँगने पर इस्तेमाल होगा। यह इसी फ़ोन में रहता है।',
  contactSaved: (name) => `अलर्ट ${name} को जाएगा`,
  contactNone: 'अभी कोई आपातकालीन संपर्क नहीं',
  mappingLabel: 'चलते समय समतल रास्ते मैप करने में मदद करें',

  easiest: 'सबसे आसान',
  heading: 'इस रास्ते पर ध्यान दें',
  slope: 'अधिकतम ढलान',
  slopeBand: { safe: 'सुरक्षित', steep: 'तेज़', very_steep: 'बहुत तेज़' },
  stepsN: (n) => `${n} सीढ़ी`,
  smoothN: (p) => `${p}% समतल`,
  crossingsN: (n) => `${n} क्रॉसिंग`,
  hazardKind: {
    stairs: 'बिना मैप की सीढ़ियाँ',
    no_ramp: 'रैंप नहीं है',
    rough_surface: 'ऊबड़-खाबड़ रास्ता',
    broken_lift: 'लिफ़्ट बंद है',
    blocked_path: 'रास्ता बंद है',
    vendor: 'ठेला / दुकानदार',
    parked_vehicle: 'खड़ी गाड़ी',
    other: 'रुकावट',
  },
  cautionLive: (kind, until) => `अभी सावधानी: ${kind}। लगभग ${until} तक हट जाएगा`,
  cautionPeak: (kind) => `शाम 5 से 8 बजे अक्सर बंद: ${kind}`,
  cautionMaint: (kind, days) => (days < 1 ? `${kind}। आज बताया गया` : `${kind}। ${days} दिन पहले बताया गया`),
  cautionStanding: (kind) => kind,

  safetyOn: 'गिरने पर अलर्ट चालू है',
  shareTitle: 'परिवार को अपनी यात्रा दिखाएँ',
  shareBtn: 'लाइव लिंक भेजें',
  shareCopied: 'लिंक कॉपी हो गया',
  sharing: 'परिवार आपको लाइव देख सकता है',
  sosHold: 'आपातकाल के लिए दबाए रखें',
  sosHoldShort: 'आपातकाल',

  briefing:
    'वॉकिंग मोड। दिशा सुनने के लिए कहीं भी टैप करें। पूछने के लिए दबाए रखें। आपातकाल के लिए तीन बार टैप करें या चार सेकंड दबाए रखें।',
  hintTap: 'टैप: दिशा',
  hintHold: 'दबाएँ: पूछें',
  hintSos: 'तीन टैप: आपातकाल',
  guidance: (instruction, m) => `${instruction}। लगभग ${m} मीटर।`,
  stepOf: (i, n) => `चरण ${i} / ${n}`,
  listening: 'सुन रहा हूँ',
  didntCatch: 'माफ़ कीजिए, समझ नहीं आया। आप कह सकते हैं: सीढ़ी बताओ, गेट कहाँ है, या आगे क्या है।',
  reported: (kind) => `ठीक है। ${kind} यहाँ दर्ज किया। धन्यवाद।`,
  gateWhere: (gate, side) => `${gate} ${side} है।`,
  gateNoCompass: (gate) => `${gate} इस रास्ते के अंत में है।`,
  side: { ahead: 'सीधे आगे', left: 'आपके बाईं ओर', right: 'आपके दाईं ओर', behind: 'आपके पीछे' },
  lookingAhead: 'आगे देख रहा हूँ',
  aheadFail: 'साफ़ दिखाई नहीं दिया। कृपया रुकें और पास किसी से पूछें।',
  holdToExit: 'बाहर जाने के लिए दबाएँ',
  noContactWarn: 'कोई आपातकालीन संपर्क सहेजा नहीं है। आपातकाल में 112 की ओर ले जाया जाएगा।',
  nextStepSpoken: 'अगला चरण।',

  sosCountdownSpeech: '8 सेकंड में आपातकालीन अलर्ट जाएगा। रद्द करने के लिए स्क्रीन पर कहीं भी टैप करें।',
  sosIn: 'आपातकालीन अलर्ट',
  sosCancelHint: 'रद्द करने के लिए कहीं भी टैप करें',
  sosCancelled: 'रद्द किया। अच्छा है कि आप ठीक हैं।',
  sosSentSpeech: (name) =>
    name
      ? `${name} को अलर्ट भेज दिया। कॉल के लिए स्क्रीन के ऊपरी हिस्से पर टैप करें। संदेश के लिए बीच में टैप करें। सुरक्षित होने के लिए नीचे दबाए रखें।`
      : 'अलर्ट भेज दिया। 112 पर कॉल के लिए ऊपर टैप करें। सुरक्षित होने के लिए नीचे दबाए रखें।',
  sosSentTitle: 'अलर्ट भेजा गया',
  sosCall: (name) => `${name} को कॉल करें`,
  sosCall112: '112 पर कॉल करें',
  sosWhatsapp: 'WhatsApp संदेश',
  sosSms: 'SMS भेजें',
  sosImOk: 'दबाएँ: मैं सुरक्षित हूँ',
  sosFall: 'गिरने का पता चला।',
  sosManual: 'आपातकाल का अनुरोध।',
  sosMessage: (reason, url) => `SugamPath आपातकाल। ${reason} मुझे मदद चाहिए। लाइव लोकेशन: ${url}`,

  arrivalQ: (gate) => `क्या ${gate} आज बिना सीढ़ी का था और लिफ़्ट चल रही थी?`,
  arrivalYes: 'हाँ',
  arrivalNo: 'नहीं',
  arrivalSpeech: (gate) =>
    `आप पहुँच गए। क्या ${gate} आज बिना सीढ़ी का था और लिफ़्ट चल रही थी? हाँ के लिए ऊपर टैप करें। नहीं के लिए नीचे टैप करें।`,
  arrivalThanks: 'धन्यवाद। इससे अगले व्यक्ति के लिए नक्शा सही रहता है।',
  arrivalMapped: (m) => `आपकी यात्रा से ${m} मीटर रास्ता मैप हुआ।`,

  resumeTitle: (place) => `${place} की यात्रा जारी रखें?`,
  resumeBtn: 'जारी रखें',
  resumeDismiss: 'नहीं, धन्यवाद',

  trackTitle: (name) => `${name} के साथ`,
  trackWaiting: 'पहले अपडेट का इंतज़ार',
  trackNotFound: 'यह लिंक समाप्त हो गया है या सही नहीं है।',
  statusWalking: 'चल रहे हैं',
  statusArrived: 'सुरक्षित पहुँच गए',
  statusEnded: 'यात्रा समाप्त',
  statusSos: 'मदद चाहिए',
  trackStep: (i, n) => `चरण ${i} / ${n}`,
  trackUpdated: (s) => (s < 5 ? 'अभी अपडेट हुआ' : s < 90 ? `${s} सेकंड पहले अपडेट` : `${Math.round(s / 60)} मिनट पहले अपडेट`),
  trackBattery: (p) => `बैटरी ${p}%`,
  trackOpenMap: 'मैप में लोकेशन खोलें',
  trackNoLocation: 'लोकेशन अभी साझा नहीं हुई',
  trackCautions: 'उनके रास्ते पर',
  trackSosAt: (time) => `${time} पर आपातकालीन अलर्ट`,
  trackSosResolved: 'उन्होंने बताया है कि वे सुरक्षित हैं।',
  trackFall: 'गिरने का पता चला।',
  trackManual: 'उन्होंने मदद माँगी।',
  trackCall: (name) => `${name} को कॉल करें`,
  trackTraveller: 'आपके परिजन',
  trackOffline: 'आप ऑफ़लाइन हैं। आख़िरी अपडेट दिख रहा है।',

  legalHeading: 'आधिकारिक रिपोर्ट',
  legalReady: 'प्रमाण सत्यापन सीमा पूरी करते हैं।',
  legalBlocked: 'कानूनी रिपोर्ट अभी तैयार नहीं',
  legalCreate: 'सत्यापित रिपोर्ट बनाएँ',
  legalPrint: 'प्रिंट करें या PDF सहेजें',
  legalClose: 'बंद करें',
  legalStructural: 'ढाँचागत गैर-अनुपालन',
  legalMunicipal: 'नगरपालिका प्रवर्तन सारांश',
};

const PA: SafetyStrings = {
  contactTitle: 'ਐਮਰਜੈਂਸੀ ਵਿੱਚ ਕਿਸਨੂੰ ਦੱਸੀਏ?',
  contactName: 'ਨਾਮ',
  contactPhone: 'ਫ਼ੋਨ ਨੰਬਰ',
  contactSave: 'ਸੰਭਾਲੋ',
  contactChange: 'ਬਦਲੋ',
  contactInvalid: 'ਸਹੀ ਫ਼ੋਨ ਨੰਬਰ ਲਿਖੋ',
  contactWhy: 'ਸਿਰਫ਼ ਡਿੱਗਣ ਜਾਂ ਮਦਦ ਮੰਗਣ ਵੇਲੇ ਵਰਤਿਆ ਜਾਵੇਗਾ। ਇਹ ਇਸੇ ਫ਼ੋਨ ਵਿੱਚ ਰਹਿੰਦਾ ਹੈ।',
  contactSaved: (name) => `ਅਲਰਟ ${name} ਨੂੰ ਜਾਵੇਗਾ`,
  contactNone: 'ਹਾਲੇ ਕੋਈ ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ ਨਹੀਂ',
  mappingLabel: 'ਤੁਰਦੇ ਸਮੇਂ ਸਮਤਲ ਰਸਤੇ ਮੈਪ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰੋ',

  easiest: 'ਸਭ ਤੋਂ ਆਸਾਨ',
  heading: 'ਇਸ ਰਸਤੇ ਬਾਰੇ ਧਿਆਨ ਦਿਓ',
  slope: 'ਵੱਧ ਤੋਂ ਵੱਧ ਢਲਾਣ',
  slopeBand: { safe: 'ਸੁਰੱਖਿਅਤ', steep: 'ਤਿੱਖੀ', very_steep: 'ਬਹੁਤ ਤਿੱਖੀ' },
  stepsN: (n) => `${n} ਪੌੜੀ`,
  smoothN: (p) => `${p}% ਸਮਤਲ`,
  crossingsN: (n) => `${n} ਕਰਾਸਿੰਗ`,
  hazardKind: {
    stairs: 'ਬਿਨਾਂ ਮੈਪ ਦੀਆਂ ਪੌੜੀਆਂ',
    no_ramp: 'ਰੈਂਪ ਨਹੀਂ ਹੈ',
    rough_surface: 'ਉੱਬੜ-ਖਾਬੜ ਰਸਤਾ',
    broken_lift: 'ਲਿਫ਼ਟ ਬੰਦ ਹੈ',
    blocked_path: 'ਰਸਤਾ ਬੰਦ ਹੈ',
    vendor: 'ਰੇਹੜੀ / ਦੁਕਾਨਦਾਰ',
    parked_vehicle: 'ਖੜ੍ਹੀ ਗੱਡੀ',
    other: 'ਰੁਕਾਵਟ',
  },
  cautionLive: (kind, until) => `ਹੁਣੇ ਸਾਵਧਾਨੀ: ${kind}। ਲਗਭਗ ${until} ਤੱਕ ਹਟ ਜਾਵੇਗਾ`,
  cautionPeak: (kind) => `ਸ਼ਾਮ 5 ਤੋਂ 8 ਵਜੇ ਅਕਸਰ ਬੰਦ: ${kind}`,
  cautionMaint: (kind, days) => (days < 1 ? `${kind}। ਅੱਜ ਦੱਸਿਆ ਗਿਆ` : `${kind}। ${days} ਦਿਨ ਪਹਿਲਾਂ ਦੱਸਿਆ ਗਿਆ`),
  cautionStanding: (kind) => kind,

  safetyOn: 'ਡਿੱਗਣ ਦਾ ਅਲਰਟ ਚਾਲੂ ਹੈ',
  shareTitle: 'ਪਰਿਵਾਰ ਨੂੰ ਆਪਣੀ ਯਾਤਰਾ ਦਿਖਾਓ',
  shareBtn: 'ਲਾਈਵ ਲਿੰਕ ਭੇਜੋ',
  shareCopied: 'ਲਿੰਕ ਕਾਪੀ ਹੋ ਗਿਆ',
  sharing: 'ਪਰਿਵਾਰ ਤੁਹਾਨੂੰ ਲਾਈਵ ਵੇਖ ਸਕਦਾ ਹੈ',
  sosHold: 'ਐਮਰਜੈਂਸੀ ਲਈ ਦਬਾਈ ਰੱਖੋ',
  sosHoldShort: 'ਐਮਰਜੈਂਸੀ',

  briefing:
    'ਵਾਕਿੰਗ ਮੋਡ। ਦਿਸ਼ਾ ਸੁਣਨ ਲਈ ਕਿਤੇ ਵੀ ਟੈਪ ਕਰੋ। ਪੁੱਛਣ ਲਈ ਦਬਾਈ ਰੱਖੋ। ਐਮਰਜੈਂਸੀ ਲਈ ਤਿੰਨ ਵਾਰ ਟੈਪ ਕਰੋ ਜਾਂ ਚਾਰ ਸਕਿੰਟ ਦਬਾਈ ਰੱਖੋ।',
  hintTap: 'ਟੈਪ: ਦਿਸ਼ਾ',
  hintHold: 'ਦਬਾਓ: ਪੁੱਛੋ',
  hintSos: 'ਤਿੰਨ ਟੈਪ: ਐਮਰਜੈਂਸੀ',
  guidance: (instruction, m) => `${instruction}। ਲਗਭਗ ${m} ਮੀਟਰ।`,
  stepOf: (i, n) => `ਕਦਮ ${i} / ${n}`,
  listening: 'ਸੁਣ ਰਿਹਾ ਹਾਂ',
  didntCatch: 'ਮਾਫ਼ ਕਰਨਾ, ਸਮਝ ਨਹੀਂ ਆਇਆ। ਤੁਸੀਂ ਕਹਿ ਸਕਦੇ ਹੋ: ਪੌੜੀਆਂ ਦੱਸੋ, ਗੇਟ ਕਿੱਥੇ ਹੈ, ਜਾਂ ਅੱਗੇ ਕੀ ਹੈ।',
  reported: (kind) => `ਠੀਕ ਹੈ। ${kind} ਇੱਥੇ ਦਰਜ ਕੀਤਾ। ਧੰਨਵਾਦ।`,
  gateWhere: (gate, side) => `${gate} ${side} ਹੈ।`,
  gateNoCompass: (gate) => `${gate} ਇਸ ਰਸਤੇ ਦੇ ਅੰਤ ਵਿੱਚ ਹੈ।`,
  side: { ahead: 'ਸਿੱਧਾ ਅੱਗੇ', left: 'ਤੁਹਾਡੇ ਖੱਬੇ ਪਾਸੇ', right: 'ਤੁਹਾਡੇ ਸੱਜੇ ਪਾਸੇ', behind: 'ਤੁਹਾਡੇ ਪਿੱਛੇ' },
  lookingAhead: 'ਅੱਗੇ ਵੇਖ ਰਿਹਾ ਹਾਂ',
  aheadFail: 'ਸਾਫ਼ ਨਹੀਂ ਦਿਸਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਰੁਕੋ ਅਤੇ ਨੇੜੇ ਕਿਸੇ ਨੂੰ ਪੁੱਛੋ।',
  holdToExit: 'ਬਾਹਰ ਜਾਣ ਲਈ ਦਬਾਓ',
  noContactWarn: 'ਕੋਈ ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ ਸੰਭਾਲਿਆ ਨਹੀਂ ਹੈ। ਐਮਰਜੈਂਸੀ ਵਿੱਚ 112 ਵੱਲ ਲਿਜਾਇਆ ਜਾਵੇਗਾ।',
  nextStepSpoken: 'ਅਗਲਾ ਕਦਮ।',

  sosCountdownSpeech: '8 ਸਕਿੰਟ ਵਿੱਚ ਐਮਰਜੈਂਸੀ ਅਲਰਟ ਜਾਵੇਗਾ। ਰੱਦ ਕਰਨ ਲਈ ਸਕ੍ਰੀਨ ਤੇ ਕਿਤੇ ਵੀ ਟੈਪ ਕਰੋ।',
  sosIn: 'ਐਮਰਜੈਂਸੀ ਅਲਰਟ',
  sosCancelHint: 'ਰੱਦ ਕਰਨ ਲਈ ਕਿਤੇ ਵੀ ਟੈਪ ਕਰੋ',
  sosCancelled: 'ਰੱਦ ਕੀਤਾ। ਚੰਗਾ ਹੈ ਕਿ ਤੁਸੀਂ ਠੀਕ ਹੋ।',
  sosSentSpeech: (name) =>
    name
      ? `${name} ਨੂੰ ਅਲਰਟ ਭੇਜ ਦਿੱਤਾ। ਕਾਲ ਲਈ ਸਕ੍ਰੀਨ ਦੇ ਉੱਪਰਲੇ ਹਿੱਸੇ ਤੇ ਟੈਪ ਕਰੋ। ਸੁਨੇਹੇ ਲਈ ਵਿਚਕਾਰ ਟੈਪ ਕਰੋ। ਸੁਰੱਖਿਅਤ ਹੋਣ ਲਈ ਹੇਠਾਂ ਦਬਾਈ ਰੱਖੋ।`
      : 'ਅਲਰਟ ਭੇਜ ਦਿੱਤਾ। 112 ਤੇ ਕਾਲ ਲਈ ਉੱਪਰ ਟੈਪ ਕਰੋ। ਸੁਰੱਖਿਅਤ ਹੋਣ ਲਈ ਹੇਠਾਂ ਦਬਾਈ ਰੱਖੋ।',
  sosSentTitle: 'ਅਲਰਟ ਭੇਜਿਆ ਗਿਆ',
  sosCall: (name) => `${name} ਨੂੰ ਕਾਲ ਕਰੋ`,
  sosCall112: '112 ਤੇ ਕਾਲ ਕਰੋ',
  sosWhatsapp: 'WhatsApp ਸੁਨੇਹਾ',
  sosSms: 'SMS ਭੇਜੋ',
  sosImOk: 'ਦਬਾਓ: ਮੈਂ ਸੁਰੱਖਿਅਤ ਹਾਂ',
  sosFall: 'ਡਿੱਗਣ ਦਾ ਪਤਾ ਲੱਗਾ।',
  sosManual: 'ਐਮਰਜੈਂਸੀ ਦੀ ਬੇਨਤੀ।',
  sosMessage: (reason, url) => `SugamPath ਐਮਰਜੈਂਸੀ। ${reason} ਮੈਨੂੰ ਮਦਦ ਚਾਹੀਦੀ ਹੈ। ਲਾਈਵ ਲੋਕੇਸ਼ਨ: ${url}`,

  arrivalQ: (gate) => `ਕੀ ${gate} ਅੱਜ ਬਿਨਾਂ ਪੌੜੀ ਦਾ ਸੀ ਅਤੇ ਲਿਫ਼ਟ ਚੱਲ ਰਹੀ ਸੀ?`,
  arrivalYes: 'ਹਾਂ',
  arrivalNo: 'ਨਹੀਂ',
  arrivalSpeech: (gate) =>
    `ਤੁਸੀਂ ਪਹੁੰਚ ਗਏ। ਕੀ ${gate} ਅੱਜ ਬਿਨਾਂ ਪੌੜੀ ਦਾ ਸੀ ਅਤੇ ਲਿਫ਼ਟ ਚੱਲ ਰਹੀ ਸੀ? ਹਾਂ ਲਈ ਉੱਪਰ ਟੈਪ ਕਰੋ। ਨਹੀਂ ਲਈ ਹੇਠਾਂ ਟੈਪ ਕਰੋ।`,
  arrivalThanks: 'ਧੰਨਵਾਦ। ਇਸ ਨਾਲ ਅਗਲੇ ਵਿਅਕਤੀ ਲਈ ਨਕਸ਼ਾ ਸਹੀ ਰਹਿੰਦਾ ਹੈ।',
  arrivalMapped: (m) => `ਤੁਹਾਡੀ ਯਾਤਰਾ ਨੇ ${m} ਮੀਟਰ ਰਸਤਾ ਮੈਪ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕੀਤੀ।`,

  resumeTitle: (place) => `${place} ਦੀ ਯਾਤਰਾ ਜਾਰੀ ਰੱਖੋ?`,
  resumeBtn: 'ਜਾਰੀ ਰੱਖੋ',
  resumeDismiss: 'ਨਹੀਂ, ਧੰਨਵਾਦ',

  trackTitle: (name) => `${name} ਦੇ ਨਾਲ`,
  trackWaiting: 'ਪਹਿਲੇ ਅੱਪਡੇਟ ਦੀ ਉਡੀਕ',
  trackNotFound: 'ਇਹ ਲਿੰਕ ਖ਼ਤਮ ਹੋ ਗਿਆ ਹੈ ਜਾਂ ਸਹੀ ਨਹੀਂ ਹੈ।',
  statusWalking: 'ਤੁਰ ਰਹੇ ਹਨ',
  statusArrived: 'ਸੁਰੱਖਿਅਤ ਪਹੁੰਚ ਗਏ',
  statusEnded: 'ਯਾਤਰਾ ਖ਼ਤਮ',
  statusSos: 'ਮਦਦ ਚਾਹੀਦੀ ਹੈ',
  trackStep: (i, n) => `ਕਦਮ ${i} / ${n}`,
  trackUpdated: (s) => (s < 5 ? 'ਹੁਣੇ ਅੱਪਡੇਟ ਹੋਇਆ' : s < 90 ? `${s} ਸਕਿੰਟ ਪਹਿਲਾਂ ਅੱਪਡੇਟ` : `${Math.round(s / 60)} ਮਿੰਟ ਪਹਿਲਾਂ ਅੱਪਡੇਟ`),
  trackBattery: (p) => `ਬੈਟਰੀ ${p}%`,
  trackOpenMap: 'ਮੈਪ ਵਿੱਚ ਲੋਕੇਸ਼ਨ ਖੋਲ੍ਹੋ',
  trackNoLocation: 'ਲੋਕੇਸ਼ਨ ਹਾਲੇ ਸਾਂਝੀ ਨਹੀਂ ਹੋਈ',
  trackCautions: 'ਉਨ੍ਹਾਂ ਦੇ ਰਸਤੇ ਤੇ',
  trackSosAt: (time) => `${time} ਵਜੇ ਐਮਰਜੈਂਸੀ ਅਲਰਟ`,
  trackSosResolved: 'ਉਨ੍ਹਾਂ ਨੇ ਦੱਸਿਆ ਹੈ ਕਿ ਉਹ ਸੁਰੱਖਿਅਤ ਹਨ।',
  trackFall: 'ਡਿੱਗਣ ਦਾ ਪਤਾ ਲੱਗਾ।',
  trackManual: 'ਉਨ੍ਹਾਂ ਨੇ ਮਦਦ ਮੰਗੀ।',
  trackCall: (name) => `${name} ਨੂੰ ਕਾਲ ਕਰੋ`,
  trackTraveller: 'ਤੁਹਾਡੇ ਪਰਿਵਾਰ ਦਾ ਮੈਂਬਰ',
  trackOffline: 'ਤੁਸੀਂ ਔਫ਼ਲਾਈਨ ਹੋ। ਆਖ਼ਰੀ ਅੱਪਡੇਟ ਦਿਖ ਰਿਹਾ ਹੈ।',

  legalHeading: 'ਅਧਿਕਾਰਤ ਰਿਪੋਰਟ',
  legalReady: 'ਸਬੂਤ ਪੜਤਾਲ ਦੀ ਹੱਦ ਪੂਰੀ ਕਰਦੇ ਹਨ।',
  legalBlocked: 'ਕਾਨੂੰਨੀ ਰਿਪੋਰਟ ਹਾਲੇ ਤਿਆਰ ਨਹੀਂ',
  legalCreate: 'ਪੜਤਾਲ ਕੀਤੀ ਰਿਪੋਰਟ ਬਣਾਓ',
  legalPrint: 'ਪ੍ਰਿੰਟ ਕਰੋ ਜਾਂ PDF ਸੰਭਾਲੋ',
  legalClose: 'ਬੰਦ ਕਰੋ',
  legalStructural: 'ਢਾਂਚਾਗਤ ਗੈਰ-ਪਾਲਣਾ',
  legalMunicipal: 'ਨਗਰ ਪਾਲਿਕਾ ਲਾਗੂਕਰਨ ਸਾਰ',
};

export const SAFE: Record<LanguageCode, SafetyStrings> = { en: EN, hi: HI, pa: PA };

/** "380 m • 0 steps • Max slope 3.6° (Safe) • 90% smooth • 2 crossings" */
export function effortLine(e: EffortBreakdown, lang: LanguageCode): string {
  const s = SAFE[lang];
  return [
    `${e.distanceM} m`,
    s.stepsN(e.steps),
    `${s.slope} ${e.maxSlopeDeg.toFixed(1)}° (${s.slopeBand[e.slopeBand]})`,
    s.smoothN(e.smoothPct),
    s.crossingsN(e.crossings),
  ].join(' • ');
}

export function clockTime(ts: number, lang: LanguageCode): string {
  const loc = lang === 'hi' ? 'hi-IN' : lang === 'pa' ? 'pa-IN' : 'en-IN';
  return new Date(ts).toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' });
}

/** One plain sentence for a hazard, based on how it decays. */
export function cautionText(h: ActiveHazard, lang: LanguageCode, now = Date.now()): string {
  const s = SAFE[lang];
  const kind = s.hazardKind[h.kind];
  if (h.status === 'peak') return s.cautionPeak(kind);
  if (h.tier === 'transient' && h.expiresAt) return s.cautionLive(kind, clockTime(h.expiresAt, lang));
  if (h.tier === 'maintenance') {
    return s.cautionMaint(kind, Math.floor((now - h.lastReportedAt) / 86_400_000));
  }
  return s.cautionStanding(kind);
}
