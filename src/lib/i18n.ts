import type {
  CitySlug,
  IssueCategory,
  IssueStatus,
  LanguageCode,
  TravelMode,
  VerificationLabel,
} from '../types/sugampath';

export interface AppStrings {
  brand: string;
  chooseAppMode: string;
  languageLabel: string;
  roleTraveller: string;
  roleAuditor: string;
  installApp: string;
  installIos: string;
  iosTitle: string;
  iosStep1: string;
  iosStep2: string;
  desktopInstallTitle: string;
  desktopInstallStep1: string;
  desktopInstallStep2: string;
  close: string;
  settings: string;
  highContrast: string;
  textSize: string;
  textNormal: string;
  textLarge: string;
  textExtraLarge: string;
  reduceMotion: string;
  voiceAloud: string;
  offlineBanner: string;
  simulateOffline: string;
  on: string;
  off: string;
  done: string;
  justNow: string;
  outOf100: string;
  travellerToolsAria: string;
  travellerPhotoReportTitle: string;
  travellerPhotoReportActor: string;
  uploadedPhotoScene: string;
  csvHeaders: [string, string, string, string, string, string, string];

  // Cities
  allCities: string;
  cities: Record<CitySlug, string>;

  // Travel modes
  howDoYouTravel: string;
  modes: Record<TravelMode, string>;

  // Traveller screens
  tabFindPlace: string;
  tabBestRoute: string;
  tabCheckPhoto: string;
  micPromptTitle: string;
  micTapToSpeak: string;
  micListening: string;
  micHint: string;
  micSamples: string[];
  searchPlaceholder: string;
  readAloud: string;
  stopSpeaking: string;
  bestGateHeading: string;
  allGatesHeading: string;
  busesHeading: string;
  askOrReviewHeading: string;
  stepFree: string;
  ramp: string;
  lift: string;
  steps: string;
  tactileTiles: string;
  yes: string;
  no: string;
  partial: string;
  unknown: string;
  working: string;
  broken: string;
  none: string;
  gentle: string;
  moderate: string;
  steep: string;
  lowFloorYes: string;
  lowFloorSome: string;
  lowFloorNo: string;
  lowFloorUnknown: string;
  seeRoute: string;
  shortestWay: string;
  safestWay: string;
  stairsCount: string;
  noStairs: string;
  walkTime: string;
  distance: string;
  warningsLabel: string;
  speakAllSteps: string;
  speakStep: string;
  photoCheckTitle: string;
  photoCheckSub: string;
  pickSamplePhoto: string;
  uploadOwnPhoto: string;
  canWheelchairPass: string;
  areTactileTilesOk: string;
  isLiftWorking: string;
  sendToCityTeam: string;
  sentSuccess: string;
  stillTrue: string;
  notTrueAnymore: string;
  thanksVote: string;

  // Verification & Score words
  scoreGood: string;
  scoreFair: string;
  scorePoor: string;
  scoreBlocked: string;
  scoreUnrated: string;
  labels: Record<VerificationLabel, string>;
  labelInfoVerified: string;
  labelInfoAi: string;
  labelInfoNotVerified: string;

  // Auditor / City Team
  auditorTabFixList: string;
  auditorTabDemoGuide: string;
  auditorOpenCount: string;
  auditorFixedCount: string;
  auditorHubsCount: string;
  downloadCsv: string;
  mapHeading: string;
  fixListHeading: string;
  filterAllStatus: string;
  statuses: Record<IssueStatus, string>;
  categories: Record<IssueCategory, string>;
  severityWord: string;
  ridersPerDay: string;
  markAs: string;
  addNotePlaceholder: string;
  saveUpdate: string;
  historyHeading: string;
  proofPhotoHeading: string;
  pickIssueHint: string;

  // Tutorial / Demo Mode
  demoTitle: string;
  demoIntro: string;
  demoStartAction: string;
  demoSteps: Array<{
    stepNum: string;
    title: string;
    body: string;
    buttonLabel: string;
  }>;

  // Onboarding & Preferences (Simple App Flow)
  onboardStepOf: string;
  onboardBack: string;
  onboardSkip: string;
  onboardLangTitle: string;
  onboardRoleTitle: string;
  onboardRoleTraveller: string;
  onboardRoleTravellerSub: string;
  onboardRoleAuditor: string;
  onboardRoleAuditorSub: string;
  onboardModeTitle: string;
  onboardModeSub: string;
  onboardModeSubs: Record<TravelMode, string>;
  onboardCityTitle: string;
  onboardComfortLabel: string;
  onboardBigText: string;
  onboardVoice: string;
  onboardStartBtn: string;
  tabHome: string;
  changeLabel: string;
  pickStationLabel: string;
  otherGatesBtn: string;
  nearbyBusesBtn: string;
  didThisHelp: string;
  showMapBtn: string;
  redoSetupBtn: string;
  switchRoleToAuditor: string;
  switchRoleToTraveller: string;
  preferencesTitle: string;
  myCityLabel: string;
  myAidLabel: string;
  allHubsWord: string;

  // Empathetic Onboarding & TTS Welcome
  listenPageBtn: string;
  speakChoiceBtn: string;
  dictationHint: string;
  onboardWelcomeSpeech: string;
  onboardRoleSpeech: string;
  onboardModeSpeech: string;
  onboardCitySpeech: string;
  blindAutoWelcome: string;

  // Google Maps-Style UI & Navigation
  currentLocationLabel: string;
  currentAreaBadge: string;
  recenterMapLabel: string;
  zoomInLabel: string;
  zoomOutLabel: string;
  startNavigationBtn: string;
  stopNavigationBtn: string;
  nextStepBtn: string;
  arrivedLabel: string;
  getStepFreeRouteBtn: string;
  stepFreeAvailableText: string;
  stairsOnlyTag: string;
  stepFreeTag: string;
  partlyTag: string;
  rampPlusLiftTag: string;
  tactilePathTag: string;
  avoidStairsNote: string;
  builtFromReviewsNote: string;
  sheetTabOverview: string;
  sheetTabGates: string;
  sheetTabBuses: string;
  sheetTabPhoto: string;
  lowFloorTag: string;
  open24hLabel: string;
  voiceGuideActive: string;
  repeatVoiceBtn: string;
  mapCalloutSteps: string;
  placeDetailsTitle: string;

  // Calm Visual Clues & Guardrails
  visualOnlyLabel: string;
  showSimpleMapBtn: string;
  hideSimpleMapBtn: string;
  prevStepBtn: string;
  replayGuideHint: string;
  blindGuardrailNote: string;
  quickTourTitle: string;
  quickTourStep1: string;
  quickTourStep2: string;
  quickTourStep3: string;

  // 4-step AI Photo Check ("AI Street Audit")
  photoStepOf: string;
  photoResultStep: string;
  photoDemoSamplesBtn: string;
  photoHowToTestBtn: string;
  photoHowToGuide1: string;
  photoHowToGuide2: string;
  photoHowToGuide3: string;
  photoPrivacyNote: string;
  photoTakeBtn: string;
  photoChooseBtn: string;
  photoUseSampleBtn: string;
  photoSampleDataTag: string;
  photoErrorTooBig: string;
  photoErrorBadType: string;
  photoMetaRemovedNote: string;
  photoContinueBtn: string;
  photoStep2Title: string;
  photoChangePhotoBtn: string;
  photoSubjects: {
    gate: string;
    footpath: string;
    crossing: string;
    bus_stop: string;
  };
  photoNearLabel: string;
  photoChangePlaceBtn: string;
  photoNoteLabel: string;
  photoNotePlaceholder: string;
  photoSpeakNoteBtn: string;
  photoListeningBtn: string;
  photoCheckBtn: string;
  photoCheckingMsg: string;
  photoCancelBtn: string;
  photoOfflineSavedMsg: string;
  photoGoOnlineBtn: string;
  photoQueuedCountLabel: string;
  photoCheckedByAiDemo: string;
  photoCheckedByAiLive: string;
  photoAiSawTitle: string;
  photoAiFailed: string;
  photoRetryBtn: string;
  photoMeaningFor: string;
  photoSureLabel: string;
  photoUnclearNotice: string;
  photoFindingsTitle: string;
  photoCityIssueAdded: string;
  photoPlaceUpdatedNote: string;
  photoViewOnMapBtn: string;
  photoCheckAnotherBtn: string;
  photoMuteBtn: string;
  photoMockMicNotes: string[];
  photoStep1Speech: string;
  photoStep2Speech: string;
  photoStep3Speech: string;
  photoOfflineSpeech: string;
  photoSamples: Record<
    'good_gate' | 'bikes_tactile' | 'stairs_no_ramp' | 'open_drain' | 'low_floor_bus' | 'blurry_dark',
    { title: string; desc: string; scene: string }
  >;
  photoFindingLabels: {
    stepFreeYes: string;
    stepFreePartial: string;
    stepFreeNo: string;
    stepFreeUnknown: string;
    rampGentle: string;
    rampModerate: string;
    rampSteep: string;
    rampNone: string;
    rampUnknown: string;
    liftWorking: string;
    liftBroken: string;
    liftNone: string;
    liftUnknown: string;
    tactileGood: string;
    tactileBlocked: string;
    tactileBroken: string;
    tactileNone: string;
    tactileUnknown: string;
    obstructionBikes: string;
    obstructionDrain: string;
    obstructionGeneral: string;
    noAudibleSignal: string;
    photoTooDarkBlurry: string;
  };
}

export const STRINGS: Record<LanguageCode, AppStrings> = {
  en: {
    brand: 'SugamPath',
    chooseAppMode: 'Choose app mode',
    languageLabel: 'Language',
    roleTraveller: 'For Travellers',
    roleAuditor: 'For City Teams',
    installApp: 'Install app',
    installIos: 'Add to phone',
    iosTitle: 'Add SugamPath to your iPhone',
    iosStep1: '1. Tap the Share button at the bottom of Safari.',
    iosStep2: '2. Tap Add to Home Screen.',
    desktopInstallTitle: 'Install SugamPath app',
    desktopInstallStep1: '1. Open your browser menu or address bar install icon.',
    desktopInstallStep2: '2. Choose Install SugamPath or Add to Home Screen.',
    close: 'Close',
    settings: 'Display & Voice',
    highContrast: 'Dark high contrast',
    textSize: 'Text size',
    textNormal: 'Normal',
    textLarge: 'Big',
    textExtraLarge: 'Biggest',
    reduceMotion: 'Stop animations',
    voiceAloud: 'Voice reading',
    offlineBanner: 'You are offline. Saved stations and routes still work.',
    simulateOffline: 'Test offline mode',
    on: 'On',
    off: 'Off',
    done: 'Done',
    justNow: 'Just now',
    outOf100: 'out of 100',
    travellerToolsAria: 'Traveller tools',
    travellerPhotoReportTitle: 'Traveller photo report',
    travellerPhotoReportActor: 'Traveller photo report',
    uploadedPhotoScene: 'Uploaded street photo checked for steps, ramp, and yellow guide tiles.',
    csvHeaders: ['ID', 'City', 'Place', 'Problem', 'Urgency', 'Status', 'People/Day'],

    allCities: 'All cities',
    cities: {
      'new-delhi': 'New Delhi',
      chandigarh: 'Chandigarh',
      patiala: 'Patiala',
    },

    howDoYouTravel: 'I use a...',
    modes: {
      wheelchair: 'Wheelchair',
      blind: 'White cane / Blind',
      walker: 'Walker / Elder',
      standard: 'No aid',
    },

    tabFindPlace: 'Find Station',
    tabBestRoute: 'Safe Path',
    tabCheckPhoto: 'Check Photo',
    micPromptTitle: 'Speak to search',
    micTapToSpeak: 'Tap mic & speak',
    micListening: 'Listening... tap a phrase or speak',
    micHint: 'Or tap a quick question:',
    micSamples: [
      'Which gate at Rajiv Chowk?',
      'Chandigarh station lift',
      'Patiala railway gate',
    ],
    searchPlaceholder: 'Type a station, bus stand, or hospital...',
    readAloud: 'Read aloud',
    stopSpeaking: 'Stop voice',
    bestGateHeading: 'Best gate for you',
    allGatesHeading: 'All gates',
    busesHeading: 'Buses nearby',
    askOrReviewHeading: 'What people say',
    stepFree: 'No stairs',
    ramp: 'Ramp',
    lift: 'Lift',
    steps: 'Steps',
    tactileTiles: 'Yellow guide tiles',
    yes: 'Yes',
    no: 'No',
    partial: 'Partly',
    unknown: 'Not sure',
    working: 'Working',
    broken: 'Broken',
    none: 'None',
    gentle: 'Easy slope',
    moderate: 'Medium slope',
    steep: 'Steep',
    lowFloorYes: 'Low-floor bus (Easy step-in)',
    lowFloorSome: 'Some low-floor buses',
    lowFloorNo: 'High steps (Not accessible)',
    lowFloorUnknown: 'Not checked yet',
    seeRoute: 'Show safe path',
    shortestWay: 'Normal path',
    safestWay: 'Best path for you',
    stairsCount: 'stairs',
    noStairs: '0 stairs',
    walkTime: 'min walk',
    distance: 'm',
    warningsLabel: 'Watch out',
    speakAllSteps: 'Read all steps',
    speakStep: 'Read',
    photoCheckTitle: 'Check a gate or footpath photo',
    photoCheckSub: 'Pick a photo to see if a wheelchair or blind traveller can pass safely.',
    pickSamplePhoto: 'Try a sample photo',
    uploadOwnPhoto: 'Take or pick photo',
    canWheelchairPass: 'Can a wheelchair pass?',
    areTactileTilesOk: 'Are yellow guide tiles clear?',
    isLiftWorking: 'Is a lift working?',
    sendToCityTeam: 'Report problem to City Team',
    sentSuccess: 'Reported. The City Team can now see this in their fix list.',
    stillTrue: 'Still true',
    notTrueAnymore: 'Wrong now',
    thanksVote: 'Thanks for checking!',

    scoreGood: 'Easy',
    scoreFair: 'Okay',
    scorePoor: 'Hard',
    scoreBlocked: 'Blocked',
    scoreUnrated: 'New',
    labels: {
      verified: 'Checked by people',
      ai_estimate: 'AI check',
      not_verified: 'Needs check',
      unrated: 'Not checked',
    },
    labelInfoVerified: '3 or more real people confirmed this in person.',
    labelInfoAi: 'Checked from a photo. Not yet confirmed by 3 people.',
    labelInfoNotVerified: 'Photo was unclear. Needs a person to check.',

    auditorTabFixList: 'Fix List',
    auditorTabDemoGuide: 'How to use (Demo)',
    auditorOpenCount: 'Problems to fix',
    auditorFixedCount: 'Fixed',
    auditorHubsCount: 'Stations checked',
    downloadCsv: 'Download CSV',
    mapHeading: 'Problem map',
    fixListHeading: 'What to fix first',
    filterAllStatus: 'All',
    statuses: {
      open: 'Needs fix',
      acknowledged: 'Working on it',
      fixed: 'Fixed',
      wont_fix: 'Skipped',
    },
    categories: {
      no_ramp: 'No ramp',
      broken_lift: 'Broken lift',
      blocked_tactile: 'Blocked guide tiles',
      missing_tactile: 'No guide tiles',
      steep_ramp: 'Steep ramp',
      obstruction: 'Blocked path',
      open_drain: 'Open drain',
      no_low_floor_bus: 'No low-floor bus',
      other: 'Other',
    },
    severityWord: 'Urgency',
    ridersPerDay: 'people/day',
    markAs: 'Change status',
    addNotePlaceholder: 'Write a short note (e.g. Repair team sent)...',
    saveUpdate: 'Save update',
    historyHeading: 'Update history',
    proofPhotoHeading: 'Photo proof',
    pickIssueHint: 'Tap any problem on the left to see its photo and mark it fixed.',

    demoTitle: 'Quick Guide for City Teams & Auditors',
    demoIntro: 'Follow these 4 steps to test how SugamPath works.',
    demoStartAction: 'Go to Fix List',
    demoSteps: [
      {
        stepNum: '1',
        title: 'Spot problems right on the street map',
        body: 'Red pins on the live map show urgent barriers like broken lifts or blocked yellow tiles inside your city area.',
        buttonLabel: 'Highlight top red pin',
      },
      {
        stepNum: '2',
        title: 'Inspect photo proof & mark it Fixed',
        body: 'Tap any pin on the map to see the street photo, add a short repair note, and mark the status as Working on it or Fixed.',
        buttonLabel: 'Open broken lift pin',
      },
      {
        stepNum: '3',
        title: 'Download CSV report',
        body: 'Export the full prioritized fix list as a spreadsheet to share with station or road repair teams.',
        buttonLabel: 'Download sample CSV',
      },
      {
        stepNum: '4',
        title: 'Test the Traveller Map view',
        body: 'Switch to "For Travellers" to see how riders experience step-free green routes, gate pins, and voice directions.',
        buttonLabel: 'Open Traveller Map',
      },
    ],

    onboardStepOf: 'Step',
    onboardBack: 'Back',
    onboardSkip: 'Skip setup',
    onboardLangTitle: 'Choose your language',
    onboardRoleTitle: 'Who is using this app?',
    onboardRoleTraveller: 'I am travelling',
    onboardRoleTravellerSub: 'Find easy gates, buses, and safe paths.',
    onboardRoleAuditor: 'I work for the city',
    onboardRoleAuditorSub: 'See broken gates on the map and mark repairs done.',
    onboardModeTitle: 'How can we make this easy for you?',
    onboardModeSub: 'Take your time. You can change this anytime in Settings.',
    onboardModeSubs: {
      wheelchair: 'Shows ramps, working lifts, and low-floor buses',
      blind: 'Reads everything aloud with large safe buttons so you never mis-tap',
      walker: 'Bigger text, calm spacing, and routes with zero stairs',
      standard: 'Clear picture clues and simple words (no sound needed)',
    },
    onboardCityTitle: 'Where are you today?',
    onboardComfortLabel: 'Make it easier to read & hear',
    onboardBigText: 'Make text bigger',
    onboardVoice: 'Read answers aloud',
    onboardStartBtn: 'Start SugamPath',
    tabHome: 'Stations',
    changeLabel: 'Change',
    pickStationLabel: 'Pick a place in',
    otherGatesBtn: 'All gates',
    nearbyBusesBtn: 'Buses',
    didThisHelp: 'Is this right?',
    showMapBtn: 'Map',
    redoSetupBtn: 'Replay welcome guide',
    switchRoleToAuditor: 'Switch to City Team view',
    switchRoleToTraveller: 'Switch to Traveller view',
    preferencesTitle: 'Settings',
    myCityLabel: 'City',
    myAidLabel: 'Travel aid',
    allHubsWord: 'All',

    listenPageBtn: 'Listen',
    speakChoiceBtn: 'Speak answer',
    dictationHint: 'Listening... say English, Hindi, Punjabi, Wheelchair, Blind, or Elder',
    onboardWelcomeSpeech: 'Welcome to SugamPath. Choose your language: English, Hindi, or Punjabi.',
    onboardRoleSpeech: 'Who is using SugamPath? Tap I am travelling, or I work for the city.',
    onboardModeSpeech: 'How can we help? Tap Blind or low vision for full voice guidance, Wheelchair, Walker or elder, or Picture clues.',
    onboardCitySpeech: 'Pick your city: Patiala, Chandigarh, or New Delhi, then tap Start SugamPath.',
    blindAutoWelcome: 'Voice guide is ready. Big safe buttons are shown. Tap a station below or tap Speak answer.',

    currentLocationLabel: 'Current location',
    currentAreaBadge: 'Current area',
    recenterMapLabel: 'Center map',
    zoomInLabel: 'Zoom in',
    zoomOutLabel: 'Zoom out',
    startNavigationBtn: 'Start step-by-step',
    stopNavigationBtn: 'Done',
    nextStepBtn: 'Next step',
    arrivedLabel: 'You have arrived safely.',
    getStepFreeRouteBtn: 'Show safe way',
    stepFreeAvailableText: 'Step-free gate ready',
    stairsOnlyTag: 'Stairs only',
    stepFreeTag: 'Step-free',
    partlyTag: 'Partly',
    rampPlusLiftTag: 'Ramp + lift',
    tactilePathTag: 'Tactile path',
    avoidStairsNote: 'Avoids stairs',
    builtFromReviewsNote: 'Tap any gate to see proof photo',
    sheetTabOverview: 'Overview',
    sheetTabGates: 'Gates',
    sheetTabBuses: 'Buses',
    sheetTabPhoto: 'Photo',
    lowFloorTag: 'Low-floor',
    open24hLabel: 'Open 24 hours',
    voiceGuideActive: 'Voice guide on',
    repeatVoiceBtn: 'Repeat',
    mapCalloutSteps: 'steps',
    placeDetailsTitle: 'Station gates & score',

    visualOnlyLabel: 'Picture clues only (Mute voice)',
    showSimpleMapBtn: 'Show simple map',
    hideSimpleMapBtn: 'Hide map',
    prevStepBtn: 'Previous',
    replayGuideHint: 'You can open this welcome guide again anytime inside Settings.',
    blindGuardrailNote: 'Safe Voice Mode: Extra buttons are hidden so you do not tap by mistake.',
    quickTourTitle: 'How SugamPath works',
    quickTourStep1: '1. Pick your station',
    quickTourStep2: '2. See the green gate & picture clues',
    quickTourStep3: '3. Follow safe step-by-step directions',

    photoStepOf: 'Step {step} of 3',
    photoResultStep: 'Result',
    photoDemoSamplesBtn: 'Demo samples',
    photoHowToTestBtn: 'How to test',
    photoHowToGuide1: '1. Tap Demo samples to test 6 prepared places (including a blurry photo).',
    photoHowToGuide2: '2. Or upload any photo under 5 MB, pick Gate or Footpath, and try Speak.',
    photoHowToGuide3: '3. Turn on Test offline mode on Step 3 to save and check later.',
    photoPrivacyNote: "Please do not take photos of people's faces.",
    photoTakeBtn: 'Take a photo',
    photoChooseBtn: 'Choose from phone',
    photoUseSampleBtn: 'Use a sample photo',
    photoSampleDataTag: 'Sample data',
    photoErrorTooBig: 'Photo is too big. Pick one under 5 MB.',
    photoErrorBadType: 'Please pick a JPG, PNG, or WebP photo.',
    photoMetaRemovedNote: 'Ready. Location tags removed from photo.',
    photoContinueBtn: 'Continue',
    photoStep2Title: 'What is this & where is it?',
    photoChangePhotoBtn: 'Change photo',
    photoSubjects: {
      gate: 'Gate',
      footpath: 'Footpath',
      crossing: 'Crossing',
      bus_stop: 'Bus stop',
    },
    photoNearLabel: 'Near:',
    photoChangePlaceBtn: 'Change',
    photoNoteLabel: 'Add a short note (optional)',
    photoNotePlaceholder: 'e.g. Gate 2 ramp or lift is broken',
    photoSpeakNoteBtn: 'Speak',
    photoListeningBtn: 'Listening...',
    photoCheckBtn: 'Check photo',
    photoCheckingMsg: 'Looking at your photo...',
    photoCancelBtn: 'Cancel',
    photoOfflineSavedMsg: 'No internet. Saved on your phone. We will check it when internet comes back.',
    photoGoOnlineBtn: 'Go back online & check now',
    photoQueuedCountLabel: 'Saved on phone:',
    photoCheckedByAiDemo: 'Checked by AI (Demo)',
    photoCheckedByAiLive: 'Checked by Gemini AI',
    photoAiSawTitle: 'What AI saw',
    photoAiFailed: 'AI could not check this photo. Please try again.',
    photoRetryBtn: 'Try again',
    photoMeaningFor: 'For {mode}',
    photoSureLabel: 'Sure:',
    photoUnclearNotice: 'Photo is not clear. Score was not changed.',
    photoFindingsTitle: 'What we saw',
    photoCityIssueAdded: 'Problem added for city check.',
    photoPlaceUpdatedNote: 'Place score updated for everyone.',
    photoViewOnMapBtn: 'View on map',
    photoCheckAnotherBtn: 'Check another',
    photoMuteBtn: 'Mute',
    photoMockMicNotes: [
      'Bikes parked on the yellow guide path',
      'Lift is closed at Gate 1, steep ramp',
      'Smooth gentle ramp with railings at Gate 2',
      'Open drain next to broken footpath',
    ],
    photoStep1Speech: 'Step 1 of 3. Take a photo, choose one from your phone, or pick a demo sample.',
    photoStep2Speech: 'Step 2 of 3. Choose Gate, Footpath, Crossing, or Bus stop, then tap Check photo.',
    photoStep3Speech: 'Looking at your photo now. Please wait.',
    photoOfflineSpeech: 'No internet. Saved on your phone. Tap Go back online and check now when ready.',
    photoSamples: {
      good_gate: {
        title: 'Good Station Gate',
        desc: 'Smooth ramp, handrails, and working lift.',
        scene: 'Step-free gate with gentle ramp and working lift.',
      },
      bikes_tactile: {
        title: 'Bikes Blocking Tactile Path',
        desc: 'Motorbikes block the yellow guide tiles.',
        scene: 'Bikes parked on the yellow guide tiles.',
      },
      stairs_no_ramp: {
        title: 'Stairs With No Ramp',
        desc: '6 steps, no ramp, and lift is closed.',
        scene: '6 concrete steps with no ramp and closed lift.',
      },
      open_drain: {
        title: 'Open Drain & Broken Path',
        desc: 'Broken footpath right next to an open drain.',
        scene: 'Broken footpath next to an open drain.',
      },
      low_floor_bus: {
        title: 'Low-Floor Bus Stop',
        desc: 'Easy kerb ramp, no sound signal at crossing.',
        scene: 'Bus stop has kerb ramp, crossing has no sound signal.',
      },
      blurry_dark: {
        title: 'Dark / Blurry Photo',
        desc: 'Too dark to see clearly (Not verified).',
        scene: 'Photo is too dark and blurry to read safely.',
      },
    },
    photoFindingLabels: {
      stepFreeYes: 'No stairs at entry',
      stepFreePartial: 'Partly step-free',
      stepFreeNo: 'Has stairs / blocked',
      stepFreeUnknown: 'Step-free: Unknown',
      rampGentle: 'Gentle ramp',
      rampModerate: 'Medium slope ramp',
      rampSteep: 'Steep ramp',
      rampNone: 'No ramp',
      rampUnknown: 'Ramp: Unknown',
      liftWorking: 'Lift working',
      liftBroken: 'Lift not working',
      liftNone: 'No lift',
      liftUnknown: 'Lift: Unknown',
      tactileGood: 'Yellow tiles clear',
      tactileBlocked: 'Yellow tiles blocked',
      tactileBroken: 'Yellow tiles broken',
      tactileNone: 'No yellow tiles',
      tactileUnknown: 'Yellow tiles: Unknown',
      obstructionBikes: 'Bikes block path',
      obstructionDrain: 'Open drain near path',
      obstructionGeneral: 'Path is blocked',
      noAudibleSignal: 'No sound at crossing',
      photoTooDarkBlurry: 'Photo too dark or blurry',
    },
  },
  hi: {
    brand: 'सुगमपथ',
    chooseAppMode: 'ऐप मोड चुनें',
    languageLabel: 'भाषा',
    roleTraveller: 'यात्रियों के लिए',
    roleAuditor: 'नगर टीम के लिए',
    installApp: 'ऐप इंस्टॉल करें',
    installIos: 'फ़ोन में जोड़ें',
    iosTitle: 'iPhone पर सुगमपथ जोड़ें',
    iosStep1: '1. Safari में नीचे Share बटन दबाएं।',
    iosStep2: '2. Add to Home Screen चुनें।',
    desktopInstallTitle: 'सुगमपथ ऐप इंस्टॉल करें',
    desktopInstallStep1: '1. अपने ब्राउज़र का मेनू या एड्रेस बार का इंस्टॉल आइकन खोलें।',
    desktopInstallStep2: '2. Install SugamPath या Add to Home Screen चुनें।',
    close: 'बंद करें',
    settings: 'दिखावट और आवाज़',
    highContrast: 'गहरा हाई-कंट्रास्ट',
    textSize: 'अक्षर का आकार',
    textNormal: 'सामान्य',
    textLarge: 'बड़ा',
    textExtraLarge: 'सबसे बड़ा',
    reduceMotion: 'एनीमेशन बंद करें',
    voiceAloud: 'बोलकर सुनाएं',
    offlineBanner: 'इंटरनेट नहीं है। सेव किए गए स्टेशन और रास्ते अभी भी काम कर रहे हैं।',
    simulateOffline: 'ऑफ़लाइन टेस्ट करें',
    on: 'चालू',
    off: 'बंद',
    done: 'हो गया',
    justNow: 'अभी',
    outOf100: '100 में से',
    travellerToolsAria: 'यात्री सुविधाएं',
    travellerPhotoReportTitle: 'यात्री द्वारा भेजी फ़ोटो रिपोर्ट',
    travellerPhotoReportActor: 'यात्री फ़ोटो रिपोर्ट',
    uploadedPhotoScene: 'भेजी गई फ़ोटो में सीढ़ियाँ, रैंप और पीली गाइड टाइलें जांची गईं।',
    csvHeaders: ['आईडी', 'शहर', 'स्थान', 'समस्या', 'जरूरी स्तर', 'स्थिति', 'यात्री/दिन'],

    allCities: 'सभी शहर',
    cities: {
      'new-delhi': 'नई दिल्ली',
      chandigarh: 'चंडीगढ़',
      patiala: 'पटियाला',
    },

    howDoYouTravel: 'मैं उपयोग करता हूँ...',
    modes: {
      wheelchair: 'व्हीलचेयर',
      blind: 'सफ़ेद छड़ी / दृष्टिबाधित',
      walker: 'वॉकर / बुजुर्ग',
      standard: 'बिना सहारे',
    },

    tabFindPlace: 'स्टेशन खोजें',
    tabBestRoute: 'सुरक्षित रास्ता',
    tabCheckPhoto: 'फ़ोटो जांचें',
    micPromptTitle: 'बोलकर खोजें',
    micTapToSpeak: 'माइक दबाएं और बोलें',
    micListening: 'सुन रहे हैं... नीचे दिया सवाल चुनें या बोलें',
    micHint: 'या एक आसान सवाल चुनें:',
    micSamples: [
      'राजीव चौक का कौन सा गेट सही है?',
      'चंडीगढ़ स्टेशन की लिफ्ट',
      'पटियाला रेलवे गेट',
    ],
    searchPlaceholder: 'स्टेशन, बस अड्डा या अस्पताल लिखें...',
    readAloud: 'सुनें',
    stopSpeaking: 'आवाज़ रोकें',
    bestGateHeading: 'आपके लिए सबसे अच्छा गेट',
    allGatesHeading: 'सभी गेट',
    busesHeading: 'पास की बसें',
    askOrReviewHeading: 'लोगों की राय',
    stepFree: 'बिना सीढ़ियों के',
    ramp: 'रैंप',
    lift: 'लिफ्ट',
    steps: 'सीढ़ियाँ',
    tactileTiles: 'पीली गाइड टाइलें',
    yes: 'हाँ',
    no: 'नहीं',
    partial: 'आंशिक',
    unknown: 'पता नहीं',
    working: 'चालू है',
    broken: 'खराब है',
    none: 'नहीं है',
    gentle: 'आसान ढलान',
    moderate: 'मध्यम ढलान',
    steep: 'खड़ी ढलान',
    lowFloorYes: 'लो-फ्लोर बस (आसान चढ़ाव)',
    lowFloorSome: 'कुछ लो-फ्लोर बसें',
    lowFloorNo: 'ऊँची सीढ़ी (कठिन)',
    lowFloorUnknown: 'अभी जांच नहीं हुई',
    seeRoute: 'सुरक्षित रास्ता देखें',
    shortestWay: 'सामान्य रास्ता',
    safestWay: 'आपके लिए सबसे अच्छा रास्ता',
    stairsCount: 'सीढ़ियाँ',
    noStairs: '0 सीढ़ियाँ',
    walkTime: 'मिनट पैदल',
    distance: 'मीटर',
    warningsLabel: 'ध्यान दें',
    speakAllSteps: 'पूरा रास्ता सुनें',
    speakStep: 'सुनें',
    photoCheckTitle: 'गेट या फुटपाथ की फ़ोटो जांचें',
    photoCheckSub: 'फ़ोटो चुनें और देखें कि व्हीलचेयर या दृष्टिबाधित यात्री जा सकते हैं या नहीं।',
    pickSamplePhoto: 'नमूना फ़ोटो चुनें',
    uploadOwnPhoto: 'फ़ोटो लें या चुनें',
    canWheelchairPass: 'क्या व्हीलचेयर जा सकती है?',
    areTactileTilesOk: 'क्या पीली टाइलें साफ हैं?',
    isLiftWorking: 'क्या लिफ्ट चल रही है?',
    sendToCityTeam: 'नगर टीम को समस्या भेजें',
    sentSuccess: 'भेजा गया। नगर टीम अब इसे अपनी सूची में देख सकती है।',
    stillTrue: 'अभी भी सही है',
    notTrueAnymore: 'अब गलत है',
    thanksVote: 'जांच के लिए धन्यवाद!',

    scoreGood: 'आसान',
    scoreFair: 'ठीक',
    scorePoor: 'कठिन',
    scoreBlocked: 'बंद',
    scoreUnrated: 'नया',
    labels: {
      verified: 'लोगों द्वारा जांचा गया',
      ai_estimate: 'AI जांच',
      not_verified: 'जांच बाकी',
      unrated: 'जांच नहीं हुई',
    },
    labelInfoVerified: '3 या अधिक लोगों ने मौके पर जाकर इसकी पुष्टि की है।',
    labelInfoAi: 'फ़ोटो से जांचा गया। अभी 3 लोगों की पुष्टि बाकी है।',
    labelInfoNotVerified: 'फ़ोटो साफ नहीं थी। किसी व्यक्ति द्वारा जांच ज़रूरी है।',

    auditorTabFixList: 'सुधार सूची',
    auditorTabDemoGuide: 'इस्तेमाल कैसे करें (डेमो)',
    auditorOpenCount: 'ठीक करने योग्य',
    auditorFixedCount: 'ठीक हो चुके',
    auditorHubsCount: 'जांचे गए स्टेशन',
    downloadCsv: 'CSV डाउनलोड करें',
    mapHeading: 'समस्या नक्शा',
    fixListHeading: 'पहले क्या ठीक करें',
    filterAllStatus: 'सभी',
    statuses: {
      open: 'सुधार बाकी',
      acknowledged: 'काम जारी',
      fixed: 'ठीक हुआ',
      wont_fix: 'छोड़ा गया',
    },
    categories: {
      no_ramp: 'रैंप नहीं है',
      broken_lift: 'लिफ्ट खराब',
      blocked_tactile: 'गाइड टाइल बंद',
      missing_tactile: 'गाइड टाइल नहीं',
      steep_ramp: 'खड़ा रैंप',
      obstruction: 'रास्ते में रुकावट',
      open_drain: 'खुली नाली',
      no_low_floor_bus: 'लो-फ्लोर बस नहीं',
      other: 'अन्य',
    },
    severityWord: 'जरूरी स्तर',
    ridersPerDay: 'यात्री/दिन',
    markAs: 'स्थिति बदलें',
    addNotePlaceholder: 'छोटा नोट लिखें (जैसे: मरम्मत टीम भेजी)...',
    saveUpdate: 'अपडेट सेव करें',
    historyHeading: 'इतिहास',
    proofPhotoHeading: 'फ़ोटो प्रमाण',
    pickIssueHint: 'फ़ोटो देखने और स्थिति बदलने के लिए बाईं ओर किसी समस्या पर टैप करें।',

    demoTitle: 'नगर टीम और ऑडिटर के लिए आसान गाइड',
    demoIntro: 'सुगमपथ कैसे काम करता है, यह देखने के लिए ये 4 आसान कदम आज़माएं।',
    demoStartAction: 'सुधार सूची देखें',
    demoSteps: [
      {
        stepNum: '1',
        title: 'नक्शे पर सीधी समस्याएं देखें',
        body: 'नक्शे पर लाल पिन आपके शहर में खराब लिफ्ट या बंद गाइड टाइलों जैसी बड़ी बाधाएं दिखाते हैं।',
        buttonLabel: 'शीर्ष लाल पिन दिखाएं',
      },
      {
        stepNum: '2',
        title: 'फ़ोटो देखें और "ठीक हुआ" चुनें',
        body: 'किसी भी लाल पिन पर टैप करके फ़ोटो देखें, छोटा नोट लिखें और स्थिति बदलें।',
        buttonLabel: 'खराब लिफ्ट पिन खोलें',
      },
      {
        stepNum: '3',
        title: 'CSV रिपोर्ट डाउनलोड करें',
        body: 'पूरी सुधार सूची को स्प्रेडशीट फ़ाइल के रूप में डाउनलोड करें।',
        buttonLabel: 'CSV डाउनलोड करें',
      },
      {
        stepNum: '4',
        title: 'यात्री नक्शा आज़माएं',
        body: 'यात्रियों के लिए हरा सुरक्षित रास्ता, गेट पिन और बोलने वाले निर्देश देखने के लिए "यात्रियों के लिए" खोलें।',
        buttonLabel: 'यात्री नक्शा खोलें',
      },
    ],

    onboardStepOf: 'कदम',
    onboardBack: 'पीछे',
    onboardSkip: 'छोड़ें',
    onboardLangTitle: 'अपनी भाषा चुनें',
    onboardRoleTitle: 'आप यह ऐप कैसे इस्तेमाल करेंगे?',
    onboardRoleTraveller: 'मैं यात्रा कर रहा हूँ',
    onboardRoleTravellerSub: 'आसान गेट, बसें और सुरक्षित रास्ता खोजें।',
    onboardRoleAuditor: 'मैं नगर टीम से हूँ',
    onboardRoleAuditorSub: 'नक्शे पर टूटे गेट देखें और मरम्मत अपडेट करें।',
    onboardModeTitle: 'हम आपकी कैसे मदद करें?',
    onboardModeSub: 'आराम से चुनें। आप इसे कभी भी सेटिंग्स में बदल सकते हैं।',
    onboardModeSubs: {
      wheelchair: 'रैंप, चालू लिफ्ट और लो-फ्लोर बसें दिखाता है',
      blind: 'सब कुछ बोलकर सुनाता है और बड़े सुरक्षित बटन दिखाता है',
      walker: 'बड़े अक्षर, कम भीड़ और बिना सीढ़ियों के रास्ते',
      standard: 'साफ चित्र संकेत और आसान शब्द (आवाज़ ज़रूरी नहीं)',
    },
    onboardCityTitle: 'आज आप किस शहर में हैं?',
    onboardComfortLabel: 'पढ़ने और सुनने में आसान बनाएं',
    onboardBigText: 'अक्षर बड़े करें',
    onboardVoice: 'जवाब बोलकर सुनाएं',
    onboardStartBtn: 'सुगमपथ शुरू करें',
    tabHome: 'स्टेशन',
    changeLabel: 'बदलें',
    pickStationLabel: 'स्थान चुनें',
    otherGatesBtn: 'सभी गेट',
    nearbyBusesBtn: 'बसें',
    didThisHelp: 'क्या यह सही है?',
    showMapBtn: 'नक्शा',
    redoSetupBtn: 'शुरुआती गाइड फिर से चलाएं',
    switchRoleToAuditor: 'नगर टीम स्क्रीन पर जाएं',
    switchRoleToTraveller: 'यात्री स्क्रीन पर जाएं',
    preferencesTitle: 'सेटिंग्स',
    myCityLabel: 'शहर',
    myAidLabel: 'यात्रा सहारा',
    allHubsWord: 'सभी',

    listenPageBtn: 'सुनें',
    speakChoiceBtn: 'बोलकर चुनें',
    dictationHint: 'सुन रहे हैं... बोलें: हिंदी, अंग्रेज़ी, पंजाबी, व्हीलचेयर, या बुजुर्ग',
    onboardWelcomeSpeech: 'सुगमपथ में आपका स्वागत है। अपनी भाषा चुनें: अंग्रेज़ी, हिंदी, या पंजाबी।',
    onboardRoleSpeech: 'आप यह ऐप कैसे इस्तेमाल करेंगे? यात्रा के लिए ऊपर वाला बटन दबाएं, या नगर टीम चुनें।',
    onboardModeSpeech: 'हम आपकी कैसे मदद करें? दृष्टिबाधित यात्री ऊपर वाला विकल्प चुनें, पूरी आवाज़ गाइड शुरू होगी।',
    onboardCitySpeech: 'आज आप किस शहर में हैं? पटियाला, चंडीगढ़ या नई दिल्ली चुनें और सुगमपथ शुरू करें दबाएं।',
    blindAutoWelcome: 'आवाज़ गाइड तैयार है। सुरक्षित बड़े बटन दिखाए गए हैं। नीचे से स्टेशन चुनें या बोलें।',

    currentLocationLabel: 'मौजूदा स्थान',
    currentAreaBadge: 'मौजूदा क्षेत्र',
    recenterMapLabel: 'बीच में लाएं',
    zoomInLabel: 'ज़ूम बढ़ाएं',
    zoomOutLabel: 'ज़ूम घटाएं',
    startNavigationBtn: 'कदम-दर-कदम शुरू करें',
    stopNavigationBtn: 'पूरा हुआ',
    nextStepBtn: 'अगला कदम',
    arrivedLabel: 'आप सुरक्षित पहुँच गए हैं।',
    getStepFreeRouteBtn: 'सुरक्षित रास्ता देखें',
    stepFreeAvailableText: 'बिना सीढ़ियों का गेट तैयार',
    stairsOnlyTag: 'सिर्फ़ सीढ़ियाँ',
    stepFreeTag: 'बिना सीढ़ी',
    partlyTag: 'आंशिक',
    rampPlusLiftTag: 'रैंप + लिफ्ट',
    tactilePathTag: 'गाइड टाइल रास्ता',
    avoidStairsNote: 'सीढ़ियों से बचाता है',
    builtFromReviewsNote: 'फ़ोटो देखने के लिए किसी भी गेट पर टैप करें',
    sheetTabOverview: 'सारांश',
    sheetTabGates: 'गेट',
    sheetTabBuses: 'बसें',
    sheetTabPhoto: 'फ़ोटो',
    lowFloorTag: 'लो-फ्लोर',
    open24hLabel: '24 घंटे खुला',
    voiceGuideActive: 'आवाज़ गाइड चालू',
    repeatVoiceBtn: 'फिर सुनें',
    mapCalloutSteps: 'सीढ़ियाँ',
    placeDetailsTitle: 'स्टेशन गेट और स्कोर',

    visualOnlyLabel: 'सिर्फ़ चित्र संकेत (आवाज़ बंद)',
    showSimpleMapBtn: 'सरल नक्शा देखें',
    hideSimpleMapBtn: 'नक्शा छुपाएं',
    prevStepBtn: 'पिछला',
    replayGuideHint: 'आप इस शुरुआती गाइड को कभी भी सेटिंग्स से फिर खोल सकते हैं।',
    blindGuardrailNote: 'सुरक्षित आवाज़ मोड: गलती से दबने वाले अतिरिक्त बटन छुपा दिए गए हैं।',
    quickTourTitle: 'सुगमपथ कैसे काम करता है',
    quickTourStep1: '1. अपना स्टेशन चुनें',
    quickTourStep2: '2. हरा गेट और आसान चित्र संकेत देखें',
    quickTourStep3: '3. सुरक्षित कदम-दर-कदम रास्ते पर चलें',

    photoStepOf: 'कदम {step} / 3',
    photoResultStep: 'नतीजा',
    photoDemoSamplesBtn: 'डेमो फ़ोटो',
    photoHowToTestBtn: 'टेस्ट कैसे करें',
    photoHowToGuide1: '1. 6 तैयार जगहें आज़माने के लिए "डेमो फ़ोटो" चुनें (धुंधली फ़ोटो भी शामिल है)।',
    photoHowToGuide2: '2. या 5 MB से कम की कोई फ़ोटो चुनें, प्रकार चुनें और "बोलें" आज़माएं।',
    photoHowToGuide3: '3. बाद में जांचने के लिए कदम 3 पर "ऑफ़लाइन टेस्ट करें" चालू करें।',
    photoPrivacyNote: 'कृपया लोगों के चेहरों की फ़ोटो न लें।',
    photoTakeBtn: 'फ़ोटो खींचें',
    photoChooseBtn: 'फ़ोन से चुनें',
    photoUseSampleBtn: 'नमूना फ़ोटो इस्तेमाल करें',
    photoSampleDataTag: 'नमूना डेटा',
    photoErrorTooBig: 'फ़ोटो बहुत बड़ी है। 5 MB से छोटी चुनें।',
    photoErrorBadType: 'कृपया JPG, PNG या WebP फ़ोटो चुनें।',
    photoMetaRemovedNote: 'तैयार है। फ़ोटो से लोकेशन टैग हटा दिए गए हैं।',
    photoContinueBtn: 'आगे बढ़ें',
    photoStep2Title: 'यह क्या है और कहाँ है?',
    photoChangePhotoBtn: 'फ़ोटो बदलें',
    photoSubjects: {
      gate: 'गेट',
      footpath: 'फुटपाथ',
      crossing: 'सड़क पार',
      bus_stop: 'बस स्टॉप',
    },
    photoNearLabel: 'पास:',
    photoChangePlaceBtn: 'बदलें',
    photoNoteLabel: 'छोटा नोट लिखें (जरूरी नहीं)',
    photoNotePlaceholder: 'जैसे: गेट 2 रैंप या लिफ्ट खराब है',
    photoSpeakNoteBtn: 'बोलें',
    photoListeningBtn: 'सुन रहे हैं...',
    photoCheckBtn: 'फ़ोटो जांचें',
    photoCheckingMsg: 'आपकी फ़ोटो देखी जा रही है...',
    photoCancelBtn: 'रद्द करें',
    photoOfflineSavedMsg: 'इंटरनेट नहीं है। फ़ोन में सेव हो गई। इंटरनेट आने पर जांच होगी।',
    photoGoOnlineBtn: 'ऑनलाइन जाएं और अभी जांचें',
    photoQueuedCountLabel: 'फ़ोन में सेव:',
    photoCheckedByAiDemo: 'AI द्वारा जांचा गया (डेमो)',
    photoCheckedByAiLive: 'Gemini AI ने जांचा',
    photoAiSawTitle: 'AI ने क्या देखा',
    photoAiFailed: 'AI इस फ़ोटो को नहीं जांच सका। कृपया दोबारा कोशिश करें।',
    photoRetryBtn: 'दोबारा कोशिश करें',
    photoMeaningFor: '{mode} के लिए',
    photoSureLabel: 'भरोसा:',
    photoUnclearNotice: 'फ़ोटो साफ नहीं है। स्कोर नहीं बदला गया।',
    photoFindingsTitle: 'हमने क्या देखा',
    photoCityIssueAdded: 'नगर टीम की जांच के लिए समस्या जोड़ी गई।',
    photoPlaceUpdatedNote: 'इस जगह का स्कोर अपडेट हो गया।',
    photoViewOnMapBtn: 'नक्शे पर देखें',
    photoCheckAnotherBtn: 'एक और जांचें',
    photoMuteBtn: 'चुप करें',
    photoMockMicNotes: [
      'पीली गाइड टाइलों पर बाइक खड़ी है',
      'गेट 1 की लिफ्ट बंद है, रैंप खड़ा है',
      'गेट 2 पर रेलिंग के साथ आसान रैंप है',
      'टूटे फुटपाथ के पास खुली नाली है',
    ],
    photoStep1Speech: 'कदम 1। फ़ोटो खींचें, फ़ोन से चुनें, या नमूना फ़ोटो आज़माएं।',
    photoStep2Speech: 'कदम 2। गेट, फुटपाथ, सड़क पार या बस स्टॉप चुनें, फिर फ़ोटो जांचें दबाएं।',
    photoStep3Speech: 'आपकी फ़ोटो जांची जा रही है। कृपया प्रतीक्षा करें।',
    photoOfflineSpeech: 'इंटरनेट नहीं है। फ़ोन में सेव हो गई है।',
    photoSamples: {
      good_gate: {
        title: 'अच्छा स्टेशन गेट',
        desc: 'आसान रैंप, रेलिंग और चालू लिफ्ट।',
        scene: 'आसान रैंप और चालू लिफ्ट के साथ बिना सीढ़ियों का गेट।',
      },
      bikes_tactile: {
        title: 'पीली टाइलों पर बाइक',
        desc: 'बाइक ने पीली गाइड टाइलों का रास्ता रोका है।',
        scene: 'पीली गाइड टाइलों पर बाइक खड़ी हैं।',
      },
      stairs_no_ramp: {
        title: 'सीढ़ियाँ, कोई रैंप नहीं',
        desc: '6 सीढ़ियाँ, रैंप नहीं और लिफ्ट बंद है।',
        scene: '6 पक्की सीढ़ियाँ हैं, रैंप नहीं और लिफ्ट बंद है।',
      },
      open_drain: {
        title: 'खुली नाली और टूटा रास्ता',
        desc: 'टूटे फुटपाथ के ठीक बगल में खुली नाली।',
        scene: 'खुली नाली के पास टूटा फुटपाथ।',
      },
      low_floor_bus: {
        title: 'लो-फ्लोर बस स्टॉप',
        desc: 'आसान रैंप है, पार करने पर आवाज़ सिग्नल नहीं।',
        scene: 'बस स्टॉप पर रैंप है, पर सड़क पार करने की घंटी नहीं है।',
      },
      blurry_dark: {
        title: 'अंधेरी / धुंधली फ़ोटो',
        desc: 'साफ दिख नहीं रहा (सत्यापित नहीं)।',
        scene: 'फ़ोटो बहुत अंधेरी और धुंधली है।',
      },
    },
    photoFindingLabels: {
      stepFreeYes: 'बिना सीढ़ियों का प्रवेश',
      stepFreePartial: 'आंशिक रूप से आसान',
      stepFreeNo: 'सीढ़ियाँ या रास्ता बंद',
      stepFreeUnknown: 'सीढ़ियाँ: पता नहीं',
      rampGentle: 'आसान ढलान रैंप',
      rampModerate: 'मध्यम ढलान रैंप',
      rampSteep: 'खड़ा रैंप',
      rampNone: 'रैंप नहीं है',
      rampUnknown: 'रैंप: पता नहीं',
      liftWorking: 'लिफ्ट चालू है',
      liftBroken: 'लिफ्ट खराब है',
      liftNone: 'लिफ्ट नहीं है',
      liftUnknown: 'लिफ्ट: पता नहीं',
      tactileGood: 'पीली टाइलें साफ हैं',
      tactileBlocked: 'पीली टाइलें बंद हैं',
      tactileBroken: 'पीली टाइलें टूटी हैं',
      tactileNone: 'पीली टाइलें नहीं हैं',
      tactileUnknown: 'पीली टाइलें: पता नहीं',
      obstructionBikes: 'बाइक से रास्ता बंद',
      obstructionDrain: 'रास्ते के पास खुली नाली',
      obstructionGeneral: 'रास्ते में रुकावट है',
      noAudibleSignal: 'क्रॉसिंग पर आवाज़ नहीं',
      photoTooDarkBlurry: 'फ़ोटो अंधेरी या धुंधली है',
    },
  },
  pa: {
    brand: 'ਸੁਗਮਪਥ',
    chooseAppMode: 'ਐਪ ਮੋਡ ਚੁਣੋ',
    languageLabel: 'ਭਾਸ਼ਾ',
    roleTraveller: 'ਯਾਤਰੀਆਂ ਲਈ',
    roleAuditor: 'ਸ਼ਹਿਰ ਟੀਮ ਲਈ',
    installApp: 'ਐਪ ਇੰਸਟਾਲ ਕਰੋ',
    installIos: 'ਫ਼ੋਨ ਤੇ ਜੋੜੋ',
    iosTitle: 'iPhone ਤੇ ਸੁਗਮਪਥ ਜੋੜੋ',
    iosStep1: '1. Safari ਵਿੱਚ ਹੇਠਾਂ Share ਬਟਨ ਦਬਾਓ।',
    iosStep2: '2. Add to Home Screen ਚੁਣੋ।',
    desktopInstallTitle: 'ਸੁਗਮਪਥ ਐਪ ਇੰਸਟਾਲ ਕਰੋ',
    desktopInstallStep1: '1. ਆਪਣੇ ਬ੍ਰਾਊਜ਼ਰ ਦਾ ਮੀਨੂ ਜਾਂ ਐਡਰੈੱਸ ਬਾਰ ਦਾ ਇੰਸਟਾਲ ਆਈਕਨ ਖੋਲ੍ਹੋ।',
    desktopInstallStep2: '2. Install SugamPath ਜਾਂ Add to Home Screen ਚੁਣੋ।',
    close: 'ਬੰਦ ਕਰੋ',
    settings: 'ਦਿੱਖ ਅਤੇ ਆਵਾਜ਼',
    highContrast: 'ਗੂੜ੍ਹਾ ਹਾਈ-ਕੰਟਰਾਸਟ',
    textSize: 'ਅੱਖਰਾਂ ਦਾ ਆਕਾਰ',
    textNormal: 'ਆਮ',
    textLarge: 'ਵੱਡਾ',
    textExtraLarge: 'ਸਭ ਤੋਂ ਵੱਡਾ',
    reduceMotion: 'ਐਨੀਮੇਸ਼ਨ ਬੰਦ ਕਰੋ',
    voiceAloud: 'ਬੋਲ ਕੇ ਸੁਣਾਓ',
    offlineBanner: 'ਇੰਟਰਨੈੱਟ ਬੰਦ ਹੈ। ਸੇਵ ਕੀਤੇ ਸਟੇਸ਼ਨ ਅਤੇ ਰਸਤੇ ਹਾਲੇ ਵੀ ਕੰਮ ਕਰ ਰਹੇ ਹਨ।',
    simulateOffline: 'ਆਫ਼ਲਾਈਨ ਟੈਸਟ ਕਰੋ',
    on: 'ਚਾਲੂ',
    off: 'ਬੰਦ',
    done: 'ਹੋ ਗਿਆ',
    justNow: 'ਹੁਣੇ',
    outOf100: '100 ਵਿੱਚੋਂ',
    travellerToolsAria: 'ਯਾਤਰੀ ਟੂਲ',
    travellerPhotoReportTitle: 'ਯਾਤਰੀ ਫ਼ੋਟੋ ਰਿਪੋਰਟ',
    travellerPhotoReportActor: 'ਯਾਤਰੀ ਫ਼ੋਟੋ ਰਿਪੋਰਟ',
    uploadedPhotoScene: 'ਅਪਲੋਡ ਕੀਤੀ ਫ਼ੋਟੋ ਵਿੱਚ ਪੌੜੀਆਂ, ਰੈਂਪ ਅਤੇ ਪੀਲੀਆਂ ਗਾਈਡ ਟਾਈਲਾਂ ਜਾਂਚੀਆਂ ਗਈਆਂ।',
    csvHeaders: ['ਆਈਡੀ', 'ਸ਼ਹਿਰ', 'ਥਾਂ', 'ਸਮੱਸਿਆ', 'ਜ਼ਰੂਰੀ ਪੱਧਰ', 'ਸਥਿਤੀ', 'ਯਾਤਰੀ/ਦਿਨ'],

    allCities: 'ਸਾਰੇ ਸ਼ਹਿਰ',
    cities: {
      'new-delhi': 'ਨਵੀਂ ਦਿੱਲੀ',
      chandigarh: 'ਚੰਡੀਗੜ੍ਹ',
      patiala: 'ਪਟਿਆਲਾ',
    },

    howDoYouTravel: 'ਮੈਂ ਵਰਤਦਾ ਹਾਂ...',
    modes: {
      wheelchair: 'ਵ੍ਹੀਲਚੇਅਰ',
      blind: 'ਸਫ਼ੈਦ ਛੜੀ / ਨੇਤਰਹੀਣ',
      walker: 'ਵਾਕਰ / ਬਜ਼ੁਰਗ',
      standard: 'ਬਿਨਾਂ ਸਹਾਰੇ',
    },

    tabFindPlace: 'ਸਟੇਸ਼ਨ ਲੱਭੋ',
    tabBestRoute: 'ਸੁਰੱਖਿਅਤ ਰਸਤਾ',
    tabCheckPhoto: 'ਫ਼ੋਟੋ ਜਾਂਚੋ',
    micPromptTitle: 'ਬੋਲ ਕੇ ਲੱਭੋ',
    micTapToSpeak: 'ਮਾਈਕ ਦਬਾਓ ਤੇ ਬੋਲੋ',
    micListening: 'ਸੁਣ ਰਹੇ ਹਾਂ... ਹੇਠਾਂ ਦਿੱਤੇ ਸਵਾਲ ਦਬਾਓ ਜਾਂ ਬੋਲੋ',
    micHint: 'ਜਾਂ ਇੱਕ ਆਸਾਨ ਸਵਾਲ ਚੁਣੋ:',
    micSamples: [
      'ਰਾਜੀਵ ਚੌਕ ਦਾ ਕਿਹੜਾ ਗੇਟ ਸਹੀ ਹੈ?',
      'ਚੰਡੀਗੜ੍ਹ ਸਟੇਸ਼ਨ ਦੀ ਲਿਫਟ',
      'ਪਟਿਆਲਾ ਰੇਲਵੇ ਗੇਟ',
    ],
    searchPlaceholder: 'ਸਟੇਸ਼ਨ, ਬੱਸ ਅੱਡਾ ਜਾਂ ਹਸਪਤਾਲ ਲਿਖੋ...',
    readAloud: 'ਸੁਣੋ',
    stopSpeaking: 'ਆਵਾਜ਼ ਬੰਦ ਕਰੋ',
    bestGateHeading: 'ਤੁਹਾਡੇ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਗੇਟ',
    allGatesHeading: 'ਸਾਰੇ ਗੇਟ',
    busesHeading: 'ਨੇੜੇ ਦੀਆਂ ਬੱਸਾਂ',
    askOrReviewHeading: 'ਲੋਕਾਂ ਦੀ ਰਾਏ',
    stepFree: 'ਬਿਨਾਂ ਪੌੜੀਆਂ ਤੋਂ',
    ramp: 'ਰੈਂਪ',
    lift: 'ਲਿਫਟ',
    steps: 'ਪੌੜੀਆਂ',
    tactileTiles: 'ਪੀਲੀਆਂ ਗਾਈਡ ਟਾਈਲਾਂ',
    yes: 'ਹਾਂ',
    no: 'ਨਹੀਂ',
    partial: 'ਕੁਝ ਹਿੱਸਾ',
    unknown: 'ਪਤਾ ਨਹੀਂ',
    working: 'ਚੱਲ ਰਹੀ ਹੈ',
    broken: 'ਖਰਾਬ ਹੈ',
    none: 'ਨਹੀਂ ਹੈ',
    gentle: 'ਆਸਾਨ ਢਲਾਣ',
    moderate: 'ਦਰਮਿਆਨੀ ਢਲਾਣ',
    steep: 'ਤਿੱਖੀ ਢਲਾਣ',
    lowFloorYes: 'ਲੋ-ਫਲੋਰ ਬੱਸ (ਆਸਾਨ ਚੜ੍ਹਾਅ)',
    lowFloorSome: 'ਕੁਝ ਲੋ-ਫਲੋਰ ਬੱਸਾਂ',
    lowFloorNo: 'ਉੱਚੀਆਂ ਪੌੜੀਆਂ (ਔਖਾ)',
    lowFloorUnknown: 'ਹਾਲੇ ਜਾਂਚ ਨਹੀਂ ਹੋਈ',
    seeRoute: 'ਸੁਰੱਖਿਅਤ ਰਸਤਾ ਦੇਖੋ',
    shortestWay: 'ਆਮ ਰਸਤਾ',
    safestWay: 'ਤੁਹਾਡੇ ਲਈ ਸਹੀ ਰਸਤਾ',
    stairsCount: 'ਪੌੜੀਆਂ',
    noStairs: '0 ਪੌੜੀਆਂ',
    walkTime: 'ਮਿੰਟ ਪੈਦਲ',
    distance: 'ਮੀਟਰ',
    warningsLabel: 'ਧਿਆਨ ਦਿਓ',
    speakAllSteps: 'ਪੂਰਾ ਰਸਤਾ ਸੁਣੋ',
    speakStep: 'ਸੁਣੋ',
    photoCheckTitle: 'ਗੇਟ ਜਾਂ ਫੁੱਟਪਾਥ ਦੀ ਫ਼ੋਟੋ ਜਾਂਚੋ',
    photoCheckSub: 'ਫ਼ੋਟੋ ਚੁਣੋ ਅਤੇ ਦੇਖੋ ਕਿ ਵ੍ਹੀਲਚੇਅਰ ਜਾਂ ਨੇਤਰਹੀਣ ਯਾਤਰੀ ਲੰਘ ਸਕਦੇ ਹਨ ਜਾਂ ਨਹੀਂ।',
    pickSamplePhoto: 'ਨਮੂਨਾ ਫ਼ੋਟੋ ਚੁਣੋ',
    uploadOwnPhoto: 'ਫ਼ੋਟੋ ਖਿੱਚੋ ਜਾਂ ਚੁਣੋ',
    canWheelchairPass: 'ਕੀ ਵ੍ਹੀਲਚੇਅਰ ਜਾ ਸਕਦੀ ਹੈ?',
    areTactileTilesOk: 'ਕੀ ਪੀਲੀਆਂ ਟਾਈਲਾਂ ਸਾਫ਼ ਹਨ?',
    isLiftWorking: 'ਕੀ ਲਿਫਟ ਚੱਲ ਰਹੀ ਹੈ?',
    sendToCityTeam: 'ਸ਼ਹਿਰ ਟੀਮ ਨੂੰ ਸਮੱਸਿਆ ਭੇਜੋ',
    sentSuccess: 'ਭੇਜਿਆ ਗਿਆ। ਸ਼ਹਿਰ ਟੀਮ ਹੁਣ ਇਸਨੂੰ ਆਪਣੀ ਸੂਚੀ ਵਿੱਚ ਦੇਖ ਸਕਦੀ ਹੈ।',
    stillTrue: 'ਹਾਲੇ ਵੀ ਸਹੀ ਹੈ',
    notTrueAnymore: 'ਹੁਣ ਗਲਤ ਹੈ',
    thanksVote: 'ਜਾਂਚ ਲਈ ਧੰਨਵਾਦ!',

    scoreGood: 'ਆਸਾਨ',
    scoreFair: 'ਠੀਕ',
    scorePoor: 'ਔਖਾ',
    scoreBlocked: 'ਬੰਦ',
    scoreUnrated: 'ਨਵਾਂ',
    labels: {
      verified: 'ਲੋਕਾਂ ਵੱਲੋਂ ਜਾਂਚਿਆ',
      ai_estimate: 'AI ਜਾਂਚ',
      not_verified: 'ਜਾਂਚ ਬਾਕੀ',
      unrated: 'ਜਾਂਚ ਨਹੀਂ ਹੋਈ',
    },
    labelInfoVerified: '3 ਜਾਂ ਵੱਧ ਲੋਕਾਂ ਨੇ ਮੌਕੇ ਤੇ ਜਾ ਕੇ ਇਸਦੀ ਪੁਸ਼ਟੀ ਕੀਤੀ ਹੈ।',
    labelInfoAi: 'ਫ਼ੋਟੋ ਤੋਂ ਜਾਂਚਿਆ ਗਿਆ। ਹਾਲੇ 3 ਲੋਕਾਂ ਦੀ ਪੁਸ਼ਟੀ ਬਾਕੀ ਹੈ।',
    labelInfoNotVerified: 'ਫ਼ੋਟੋ ਸਾਫ਼ ਨਹੀਂ ਸੀ। ਕਿਸੇ ਵਿਅਕਤੀ ਵੱਲੋਂ ਜਾਂਚ ਜ਼ਰੂਰੀ ਹੈ।',

    auditorTabFixList: 'ਸੁਧਾਰ ਸੂਚੀ',
    auditorTabDemoGuide: 'ਵਰਤੋਂ ਕਿਵੇਂ ਕਰੀਏ (ਡੈਮੋ)',
    auditorOpenCount: 'ਠੀਕ ਕਰਨ ਵਾਲੀਆਂ',
    auditorFixedCount: 'ਠੀਕ ਹੋਈਆਂ',
    auditorHubsCount: 'ਜਾਂਚੇ ਗਏ ਸਟੇਸ਼ਨ',
    downloadCsv: 'CSV ਡਾਊਨਲੋਡ ਕਰੋ',
    mapHeading: 'ਸਮੱਸਿਆ ਨਕਸ਼ਾ',
    fixListHeading: 'ਪਹਿਲਾਂ ਕੀ ਠੀਕ ਕਰੀਏ',
    filterAllStatus: 'ਸਭ',
    statuses: {
      open: 'ਸੁਧਾਰ ਬਾਕੀ',
      acknowledged: 'ਕੰਮ ਜਾਰੀ',
      fixed: 'ਠੀਕ ਹੋਈ',
      wont_fix: 'ਛੱਡੀ ਗਈ',
    },
    categories: {
      no_ramp: 'ਰੈਂਪ ਨਹੀਂ ਹੈ',
      broken_lift: 'ਲਿਫਟ ਖਰਾਬ',
      blocked_tactile: 'ਗਾਈਡ ਟਾਈਲਾਂ ਬੰਦ',
      missing_tactile: 'ਗਾਈਡ ਟਾਈਲਾਂ ਨਹੀਂ',
      steep_ramp: 'ਤਿੱਖਾ ਰੈਂਪ',
      obstruction: 'ਰਸਤੇ ਵਿੱਚ ਰੁਕਾਵਟ',
      open_drain: 'ਖੁੱਲ੍ਹੀ ਨਾਲੀ',
      no_low_floor_bus: 'ਲੋ-ਫਲੋਰ ਬੱਸ ਨਹੀਂ',
      other: 'ਹੋਰ',
    },
    severityWord: 'ਜ਼ਰੂਰੀ ਪੱਧਰ',
    ridersPerDay: 'ਯਾਤਰੀ/ਦਿਨ',
    markAs: 'ਸਥਿਤੀ ਬਦਲੋ',
    addNotePlaceholder: 'ਛੋਟਾ ਨੋਟ ਲਿਖੋ (ਜਿਵੇਂ: ਟੀਮ ਭੇਜੀ ਗਈ)...',
    saveUpdate: 'ਅਪਡੇਟ ਸੇਵ ਕਰੋ',
    historyHeading: 'ਇਤਿਹਾਸ',
    proofPhotoHeading: 'ਫ਼ੋਟੋ ਸਬੂਤ',
    pickIssueHint: 'ਫ਼ੋਟੋ ਦੇਖਣ ਅਤੇ ਸਥਿਤੀ ਬਦਲਣ ਲਈ ਖੱਬੇ ਪਾਸੇ ਕਿਸੇ ਸਮੱਸਿਆ ਤੇ ਟੈਪ ਕਰੋ।',

    demoTitle: 'ਸ਼ਹਿਰ ਟੀਮ ਅਤੇ ਆਡੀਟਰਾਂ ਲਈ ਆਸਾਨ ਗਾਈਡ',
    demoIntro: 'ਸੁਗਮਪਥ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ, ਇਹ ਦੇਖਣ ਲਈ ਇਹ 4 ਆਸਾਨ ਕਦਮ ਵਰਤੋ।',
    demoStartAction: 'ਸੁਧਾਰ ਸੂਚੀ ਦੇਖੋ',
    demoSteps: [
      {
        stepNum: '1',
        title: 'ਨਕਸ਼ੇ ਤੇ ਮੌਜੂਦਾ ਇਲਾਕੇ ਦੀਆਂ ਸਮੱਸਿਆਵਾਂ ਦੇਖੋ',
        body: 'ਨਕਸ਼ਾ ਤੁਹਾਡੇ ਚੁਣੇ ਸ਼ਹਿਰ ਅਤੇ ਖਰਾਬ ਲਿਫਟ ਜਾਂ ਟੁੱਟੀਆਂ ਟਾਈਲਾਂ ਦੇ ਲਾਲ ਪਿੰਨ ਦਿਖਾਉਂਦਾ ਹੈ। ਵੱਡੇ ਨੰਬਰ ਵਾਲੀ ਸਮੱਸਿਆ ਪਹਿਲਾਂ ਠੀਕ ਕਰਨੀ ਹੁੰਦੀ ਹੈ।',
        buttonLabel: 'ਪਟਿਆਲਾ ਦੀ ਸਭ ਤੋਂ ਵੱਡੀ ਸਮੱਸਿਆ ਦਿਖਾਓ',
      },
      {
        stepNum: '2',
        title: 'ਨਕਸ਼ੇ ਤੇ ਕਿਸੇ ਵੀ ਪਿੰਨ ਨੂੰ ਦਬਾਓ',
        body: 'ਨੰਬਰ ਵਾਲੇ ਲਾਲ ਪਿੰਨ ਨੂੰ ਦਬਾਉਣ ਨਾਲ ਫ਼ੋਟੋ ਸਬੂਤ ਅਤੇ ਲੋਕਾਂ ਦੀ ਪੁਸ਼ਟੀ ਹੇਠਾਂ ਖੁੱਲ੍ਹ ਜਾਂਦੀ ਹੈ।',
        buttonLabel: 'ਖਰਾਬ ਲਿਫਟ ਦਾ ਸਬੂਤ ਖੋਲ੍ਹੋ',
      },
      {
        stepNum: '3',
        title: 'ਸਥਿਤੀ ਬਦਲੋ ਜਾਂ CSV ਡਾਊਨਲੋਡ ਕਰੋ',
        body: 'ਸਮੱਸਿਆ ਨੂੰ "ਕੰਮ ਜਾਰੀ" ਜਾਂ "ਠੀਕ ਹੋਈ" ਚੁਣੋ, ਨੋਟ ਲਿਖੋ, ਜਾਂ CSV ਫ਼ਾਈਲ ਡਾਊਨਲੋਡ ਕਰੋ।',
        buttonLabel: 'CSV ਡਾਊਨਲੋਡ ਕਰੋ',
      },
      {
        stepNum: '4',
        title: 'ਯਾਤਰੀ ਨਕਸ਼ਾ ਅਜ਼ਮਾਓ',
        body: 'ਯਾਤਰੀਆਂ ਲਈ ਹਰਾ ਸੁਰੱਖਿਅਤ ਰਸਤਾ, ਗੇਟ ਪਿੰਨ ਅਤੇ ਬੋਲ ਕੇ ਦੱਸਣ ਵਾਲੇ ਨਿਰਦੇਸ਼ ਦੇਖਣ ਲਈ "ਯਾਤਰੀਆਂ ਲਈ" ਖੋਲ੍ਹੋ।',
        buttonLabel: 'ਯਾਤਰੀ ਨਕਸ਼ਾ ਖੋਲ੍ਹੋ',
      },
    ],

    onboardStepOf: 'ਕਦਮ',
    onboardBack: 'ਪਿੱਛੇ',
    onboardSkip: 'ਛੱਡੋ',
    onboardLangTitle: 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',
    onboardRoleTitle: 'ਤੁਸੀਂ ਇਹ ਐਪ ਕਿਵੇਂ ਵਰਤੋਗੇ?',
    onboardRoleTraveller: 'ਮੈਂ ਸਫ਼ਰ ਕਰ ਰਿਹਾ ਹਾਂ',
    onboardRoleTravellerSub: 'ਆਸਾਨ ਗੇਟ, ਬੱਸਾਂ ਅਤੇ ਸੁਰੱਖਿਅਤ ਰਸਤਾ ਲੱਭੋ।',
    onboardRoleAuditor: 'ਮੈਂ ਸ਼ਹਿਰ ਟੀਮ ਤੋਂ ਹਾਂ',
    onboardRoleAuditorSub: 'ਨਕਸ਼ੇ ਤੇ ਖਰਾਬ ਗੇਟ ਦੇਖੋ ਅਤੇ ਮੁਰੰਮਤ ਅਪਡੇਟ ਕਰੋ।',
    onboardModeTitle: 'ਅਸੀਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰੀਏ?',
    onboardModeSub: 'ਆਰਾਮ ਨਾਲ ਚੁਣੋ। ਤੁਸੀਂ ਇਸਨੂੰ ਕਦੇ ਵੀ ਸੈਟਿੰਗਾਂ ਵਿੱਚ ਬਦਲ ਸਕਦੇ ਹੋ।',
    onboardModeSubs: {
      wheelchair: 'ਰੈਂਪ, ਚੱਲਦੀ ਲਿਫਟ ਅਤੇ ਲੋ-ਫਲੋਰ ਬੱਸਾਂ ਦਿਖਾਉਂਦਾ ਹੈ',
      blind: 'ਸਭ ਕੁਝ ਬੋਲ ਕੇ ਦੱਸਦਾ ਹੈ ਅਤੇ ਵੱਡੇ ਸੁਰੱਖਿਅਤ ਬਟਨ ਦਿਖਾਉਂਦਾ ਹੈ',
      walker: 'ਵੱਡੇ ਅੱਖਰ, ਘੱਟ ਭੀੜ ਅਤੇ ਬਿਨਾਂ ਪੌੜੀਆਂ ਵਾਲੇ ਰਸਤੇ',
      standard: 'ਸਾਫ਼ ਤਸਵੀਰ ਸੰਕੇਤ ਅਤੇ ਸੌਖੇ ਸ਼ਬਦ (ਆਵਾਜ਼ ਦੀ ਲੋੜ ਨਹੀਂ)',
    },
    onboardCityTitle: 'ਅੱਜ ਤੁਸੀਂ ਕਿਸ ਸ਼ਹਿਰ ਵਿੱਚ ਹੋ?',
    onboardComfortLabel: 'ਪੜ੍ਹਨ ਅਤੇ ਸੁਣਨ ਵਿੱਚ ਆਸਾਨ ਬਣਾਓ',
    onboardBigText: 'ਅੱਖਰ ਵੱਡੇ ਕਰੋ',
    onboardVoice: 'ਜਵਾਬ ਬੋਲ ਕੇ ਸੁਣਾਓ',
    onboardStartBtn: 'ਸੁਗਮਪਥ ਸ਼ੁਰੂ ਕਰੋ',
    tabHome: 'ਸਟੇਸ਼ਨ',
    changeLabel: 'ਬਦਲੋ',
    pickStationLabel: 'ਥਾਂ ਚੁਣੋ',
    otherGatesBtn: 'ਸਾਰੇ ਗੇਟ',
    nearbyBusesBtn: 'ਬੱਸਾਂ',
    didThisHelp: 'ਕੀ ਇਹ ਸਹੀ ਹੈ?',
    showMapBtn: 'ਨਕਸ਼ਾ',
    redoSetupBtn: 'ਸ਼ੁਰੂਆਤੀ ਗਾਈਡ ਮੁੜ ਚਲਾਓ',
    switchRoleToAuditor: 'ਸ਼ਹਿਰ ਟੀਮ ਸਕਰੀਨ ਤੇ ਜਾਓ',
    switchRoleToTraveller: 'ਯਾਤਰੀ ਸਕਰੀਨ ਤੇ ਜਾਓ',
    preferencesTitle: 'ਸੈਟਿੰਗਾਂ',
    myCityLabel: 'ਸ਼ਹਿਰ',
    myAidLabel: 'ਸਫ਼ਰ ਸਹਾਰਾ',
    allHubsWord: 'ਸਭ',

    listenPageBtn: 'ਸੁਣੋ',
    speakChoiceBtn: 'ਬੋਲ ਕੇ ਚੁਣੋ',
    dictationHint: 'ਸੁਣ ਰਹੇ ਹਾਂ... ਬੋਲੋ: ਪੰਜਾਬੀ, ਹਿੰਦੀ, ਅੰਗਰੇਜ਼ੀ, ਵ੍ਹੀਲਚੇਅਰ, ਜਾਂ ਬਜ਼ੁਰਗ',
    onboardWelcomeSpeech: 'ਸੁਗਮਪਥ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ। ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ: ਅੰਗਰੇਜ਼ੀ, ਹਿੰਦੀ, ਜਾਂ ਪੰਜਾਬੀ।',
    onboardRoleSpeech: 'ਤੁਸੀਂ ਇਹ ਐਪ ਕਿਵੇਂ ਵਰਤੋਗੇ? ਸਫ਼ਰ ਕਰਨ ਲਈ ਉੱਪਰ ਵਾਲਾ ਬਟਨ ਦਬਾਓ, ਜਾਂ ਸ਼ਹਿਰ ਟੀਮ ਚੁਣੋ।',
    onboardModeSpeech: 'ਅਸੀਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰੀਏ? ਨੇਤਰਹੀਣ ਯਾਤਰੀ ਉੱਪਰ ਵਾਲਾ ਵਿਕਲਪ ਚੁਣਨ, ਪੂਰੀ ਆਵਾਜ਼ ਗਾਈਡ ਸ਼ੁਰੂ ਹੋਵੇਗੀ।',
    onboardCitySpeech: 'ਅੱਜ ਤੁਸੀਂ ਕਿਸ ਸ਼ਹਿਰ ਵਿੱਚ ਹੋ? ਪਟਿਆਲਾ, ਚੰਡੀਗੜ੍ਹ ਜਾਂ ਨਵੀਂ ਦਿੱਲੀ ਚੁਣੋ ਅਤੇ ਸੁਗਮਪਥ ਸ਼ੁਰੂ ਕਰੋ ਦਬਾਓ।',
    blindAutoWelcome: 'ਆਵਾਜ਼ ਗਾਈਡ ਤਿਆਰ ਹੈ। ਸੁਰੱਖਿਅਤ ਵੱਡੇ ਬਟਨ ਦਿਖਾਏ ਗਏ ਹਨ। ਹੇਠਾਂ ਤੋਂ ਸਟੇਸ਼ਨ ਚੁਣੋ ਜਾਂ ਬੋਲੋ।',

    currentLocationLabel: 'ਮੌਜੂਦਾ ਥਾਂ',
    currentAreaBadge: 'ਮੌਜੂਦਾ ਇਲਾਕਾ',
    recenterMapLabel: 'ਵਿਚਕਾਰ ਲਿਆਓ',
    zoomInLabel: 'ਜ਼ੂਮ ਵਧਾਓ',
    zoomOutLabel: 'ਜ਼ੂਮ ਘਟਾਓ',
    startNavigationBtn: 'ਕਦਮ-ਦਰ-ਕਦਮ ਸ਼ੁਰੂ ਕਰੋ',
    stopNavigationBtn: 'ਹੋ ਗਿਆ',
    nextStepBtn: 'ਅਗਲਾ ਕਦਮ',
    arrivedLabel: 'ਤੁਸੀਂ ਸੁਰੱਖਿਅਤ ਪਹੁੰਚ ਗਏ ਹੋ।',
    getStepFreeRouteBtn: 'ਸੁਰੱਖਿਅਤ ਰਸਤਾ ਦੇਖੋ',
    stepFreeAvailableText: 'ਬਿਨਾਂ ਪੌੜੀਆਂ ਵਾਲਾ ਗੇਟ ਤਿਆਰ',
    stairsOnlyTag: 'ਸਿਰਫ਼ ਪੌੜੀਆਂ',
    stepFreeTag: 'ਬਿਨਾਂ ਪੌੜੀ',
    partlyTag: 'ਕੁਝ ਹਿੱਸਾ',
    rampPlusLiftTag: 'ਰੈਂਪ + ਲਿਫਟ',
    tactilePathTag: 'ਗਾਈਡ ਟਾਈਲ ਰਸਤਾ',
    avoidStairsNote: 'ਪੌੜੀਆਂ ਤੋਂ ਬਚਾਉਂਦਾ ਹੈ',
    builtFromReviewsNote: 'ਫ਼ੋਟੋ ਦੇਖਣ ਲਈ ਕਿਸੇ ਵੀ ਗੇਟ ਤੇ ਟੈਪ ਕਰੋ',
    sheetTabOverview: 'ਸਾਰਾਂਸ਼',
    sheetTabGates: 'ਗੇਟ',
    sheetTabBuses: 'ਬੱਸਾਂ',
    sheetTabPhoto: 'ਫ਼ੋਟੋ',
    lowFloorTag: 'ਲੋ-ਫਲੋਰ',
    open24hLabel: '24 ਘੰਟੇ ਖੁੱਲ੍ਹਾ',
    voiceGuideActive: 'ਆਵਾਜ਼ ਗਾਈਡ ਚਾਲੂ',
    repeatVoiceBtn: 'ਦੁਬਾਰਾ ਸੁਣੋ',
    mapCalloutSteps: 'ਪੌੜੀਆਂ',
    placeDetailsTitle: 'ਸਟੇਸ਼ਨ ਗੇਟ ਅਤੇ ਸਕੋਰ',

    visualOnlyLabel: 'ਸਿਰਫ਼ ਤਸਵੀਰ ਸੰਕੇਤ (ਆਵਾਜ਼ ਬੰਦ)',
    showSimpleMapBtn: 'ਸਰਲ ਨਕਸ਼ਾ ਦੇਖੋ',
    hideSimpleMapBtn: 'ਨਕਸ਼ਾ ਛੁਪਾਓ',
    prevStepBtn: 'ਪਿਛਲਾ',
    replayGuideHint: 'ਤੁਸੀਂ ਇਹ ਸ਼ੁਰੂਆਤੀ ਗਾਈਡ ਕਦੇ ਵੀ ਸੈਟਿੰਗਾਂ ਵਿੱਚੋਂ ਮੁੜ ਖੋਲ੍ਹ ਸਕਦੇ ਹੋ।',
    blindGuardrailNote: 'ਸੁਰੱਖਿਅਤ ਆਵਾਜ਼ ਮੋਡ: ਗਲਤੀ ਨਾਲ ਦੱਬਣ ਵਾਲੇ ਵਾਧੂ ਬਟਨ ਛੁਪਾ ਦਿੱਤੇ ਗਏ ਹਨ।',
    quickTourTitle: 'ਸੁਗਮਪਥ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
    quickTourStep1: '1. ਆਪਣਾ ਸਟੇਸ਼ਨ ਚੁਣੋ',
    quickTourStep2: '2. ਹਰਾ ਗੇਟ ਅਤੇ ਆਸਾਨ ਤਸਵੀਰ ਸੰਕੇਤ ਦੇਖੋ',
    quickTourStep3: '3. ਸੁਰੱਖਿਅਤ ਕਦਮ-ਦਰ-ਕਦਮ ਰਸਤੇ ਤੇ ਚੱਲੋ',

    photoStepOf: 'ਕਦਮ {step} / 3',
    photoResultStep: 'ਨਤੀਜਾ',
    photoDemoSamplesBtn: 'ਡੈਮੋ ਫ਼ੋਟੋਆਂ',
    photoHowToTestBtn: 'ਟੈਸਟ ਕਿਵੇਂ ਕਰੀਏ',
    photoHowToGuide1: '1. 6 ਤਿਆਰ ਥਾਵਾਂ ਦੇਖਣ ਲਈ "ਡੈਮੋ ਫ਼ੋਟੋਆਂ" ਦਬਾਓ (ਧੁੰਦਲੀ ਫ਼ੋਟੋ ਸਮੇਤ)।',
    photoHowToGuide2: '2. ਜਾਂ 5 MB ਤੋਂ ਛੋਟੀ ਫ਼ੋਟੋ ਚੁਣੋ, ਕਿਸਮ ਚੁਣੋ ਅਤੇ "ਬੋਲੋ" ਵਰਤੋ।',
    photoHowToGuide3: '3. ਬਾਅਦ ਵਿੱਚ ਜਾਂਚਣ ਲਈ ਕਦਮ 3 ਤੇ "ਆਫ਼ਲਾਈਨ ਟੈਸਟ" ਚਾਲੂ ਕਰੋ।',
    photoPrivacyNote: 'ਕਿਰਪਾ ਕਰਕੇ ਲੋਕਾਂ ਦੇ ਚਿਹਰਿਆਂ ਦੀ ਫ਼ੋਟੋ ਨਾ ਖਿੱਚੋ।',
    photoTakeBtn: 'ਫ਼ੋਟੋ ਖਿੱਚੋ',
    photoChooseBtn: 'ਫ਼ੋਨ ਤੋਂ ਚੁਣੋ',
    photoUseSampleBtn: 'ਨਮੂਨਾ ਫ਼ੋਟੋ ਵਰਤੋ',
    photoSampleDataTag: 'ਨਮੂਨਾ ਡੇਟਾ',
    photoErrorTooBig: 'ਫ਼ੋਟੋ ਬਹੁਤ ਵੱਡੀ ਹੈ। 5 MB ਤੋਂ ਛੋਟੀ ਚੁਣੋ।',
    photoErrorBadType: 'ਕਿਰਪਾ ਕਰਕੇ JPG, PNG ਜਾਂ WebP ਫ਼ੋਟੋ ਚੁਣੋ।',
    photoMetaRemovedNote: 'ਤਿਆਰ ਹੈ। ਫ਼ੋਟੋ ਤੋਂ ਲੋਕੇਸ਼ਨ ਟੈਗ ਹਟਾ ਦਿੱਤੇ ਗਏ ਹਨ।',
    photoContinueBtn: 'ਅੱਗੇ ਵਧੋ',
    photoStep2Title: 'ਇਹ ਕੀ ਹੈ ਅਤੇ ਕਿੱਥੇ ਹੈ?',
    photoChangePhotoBtn: 'ਫ਼ੋਟੋ ਬਦਲੋ',
    photoSubjects: {
      gate: 'ਗੇਟ',
      footpath: 'ਫੁੱਟਪਾਥ',
      crossing: 'ਕਰਾਸਿੰਗ',
      bus_stop: 'ਬੱਸ ਸਟਾਪ',
    },
    photoNearLabel: 'ਨੇੜੇ:',
    photoChangePlaceBtn: 'ਬਦਲੋ',
    photoNoteLabel: 'ਛੋਟਾ ਨੋਟ ਲਿਖੋ (ਲੋੜੀਂਦਾ ਨਹੀਂ)',
    photoNotePlaceholder: 'ਜਿਵੇਂ: ਗੇਟ 2 ਰੈਂਪ ਜਾਂ ਲਿਫਟ ਖਰਾਬ ਹੈ',
    photoSpeakNoteBtn: 'ਬੋਲੋ',
    photoListeningBtn: 'ਸੁਣ ਰਹੇ ਹਾਂ...',
    photoCheckBtn: 'ਫ਼ੋਟੋ ਜਾਂਚੋ',
    photoCheckingMsg: 'ਤੁਹਾਡੀ ਫ਼ੋਟੋ ਦੇਖੀ ਜਾ ਰਹੀ ਹੈ...',
    photoCancelBtn: 'ਰੱਦ ਕਰੋ',
    photoOfflineSavedMsg: 'ਇੰਟਰਨੈੱਟ ਨਹੀਂ ਹੈ। ਫ਼ੋਨ ਵਿੱਚ ਸੇਵ ਹੋ ਗਈ। ਇੰਟਰਨੈੱਟ ਆਉਣ ਤੇ ਜਾਂਚ ਹੋਵੇਗੀ।',
    photoGoOnlineBtn: 'ਆਨਲਾਈਨ ਜਾਓ ਅਤੇ ਹੁਣੇ ਜਾਂਚੋ',
    photoQueuedCountLabel: 'ਫ਼ੋਨ ਤੇ ਸੇਵ:',
    photoCheckedByAiDemo: 'AI ਵੱਲੋਂ ਜਾਂਚਿਆ (ਡੈਮੋ)',
    photoCheckedByAiLive: 'Gemini AI ਨੇ ਜਾਂਚਿਆ',
    photoAiSawTitle: 'AI ਨੇ ਕੀ ਦੇਖਿਆ',
    photoAiFailed: 'AI ਇਹ ਫ਼ੋਟੋ ਨਹੀਂ ਜਾਂਚ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    photoRetryBtn: 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ',
    photoMeaningFor: '{mode} ਲਈ',
    photoSureLabel: 'ਭਰੋਸਾ:',
    photoUnclearNotice: 'ਫ਼ੋਟੋ ਸਾਫ਼ ਨਹੀਂ ਹੈ। ਸਕੋਰ ਨਹੀਂ ਬਦਲਿਆ ਗਿਆ।',
    photoFindingsTitle: 'ਅਸੀਂ ਕੀ ਦੇਖਿਆ',
    photoCityIssueAdded: 'ਸ਼ਹਿਰ ਦੀ ਜਾਂਚ ਲਈ ਸਮੱਸਿਆ ਜੋੜੀ ਗਈ।',
    photoPlaceUpdatedNote: 'ਇਸ ਥਾਂ ਦਾ ਸਕੋਰ ਅਪਡੇਟ ਹੋ ਗਿਆ।',
    photoViewOnMapBtn: 'ਨਕਸ਼ੇ ਤੇ ਦੇਖੋ',
    photoCheckAnotherBtn: 'ਇੱਕ ਹੋਰ ਜਾਂਚੋ',
    photoMuteBtn: 'ਚੁੱਪ ਕਰੋ',
    photoMockMicNotes: [
      'ਪੀਲੀਆਂ ਗਾਈਡ ਟਾਈਲਾਂ ਤੇ ਬਾਈਕ ਖੜ੍ਹੀ ਹੈ',
      'ਗੇਟ 1 ਦੀ ਲਿਫਟ ਬੰਦ ਹੈ, ਰੈਂਪ ਤਿੱਖਾ ਹੈ',
      'ਗੇਟ 2 ਤੇ ਰੇਲਿੰਗ ਵਾਲਾ ਆਸਾਨ ਰੈਂਪ ਹੈ',
      'ਟੁੱਟੇ ਫੁੱਟਪਾਥ ਦੇ ਨਾਲ ਖੁੱਲ੍ਹੀ ਨਾਲੀ ਹੈ',
    ],
    photoStep1Speech: 'ਕਦਮ 1। ਫ਼ੋਟੋ ਖਿੱਚੋ, ਫ਼ੋਨ ਤੋਂ ਚੁਣੋ, ਜਾਂ ਡੈਮੋ ਫ਼ੋਟੋ ਵਰਤੋ।',
    photoStep2Speech: 'ਕਦਮ 2। ਗੇਟ, ਫੁੱਟਪਾਥ, ਕਰਾਸਿੰਗ ਜਾਂ ਬੱਸ ਸਟਾਪ ਚੁਣੋ, ਫਿਰ ਫ਼ੋਟੋ ਜਾਂਚੋ ਦਬਾਓ।',
    photoStep3Speech: 'ਤੁਹਾਡੀ ਫ਼ੋਟੋ ਜਾਂਚੀ ਜਾ ਰਹੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਉਡੀਕ ਕਰੋ।',
    photoOfflineSpeech: 'ਇੰਟਰਨੈੱਟ ਨਹੀਂ ਹੈ। ਫ਼ੋਨ ਵਿੱਚ ਸੇਵ ਹੋ ਗਈ ਹੈ।',
    photoSamples: {
      good_gate: {
        title: 'ਵਧੀਆ ਸਟੇਸ਼ਨ ਗੇਟ',
        desc: 'ਆਸਾਨ ਰੈਂਪ, ਰੇਲਿੰਗ ਅਤੇ ਚੱਲਦੀ ਲਿਫਟ।',
        scene: 'ਆਸਾਨ ਰੈਂਪ ਅਤੇ ਚੱਲਦੀ ਲਿਫਟ ਵਾਲਾ ਬਿਨਾਂ ਪੌੜੀਆਂ ਦਾ ਗੇਟ।',
      },
      bikes_tactile: {
        title: 'ਪੀਲੀਆਂ ਟਾਈਲਾਂ ਤੇ ਬਾਈਕਾਂ',
        desc: 'ਬਾਈਕਾਂ ਨੇ ਪੀਲੀਆਂ ਗਾਈਡ ਟਾਈਲਾਂ ਦਾ ਰਾਹ ਰੋਕਿਆ ਹੈ।',
        scene: 'ਪੀਲੀਆਂ ਗਾਈਡ ਟਾਈਲਾਂ ਤੇ ਬਾਈਕਾਂ ਖੜ੍ਹੀਆਂ ਹਨ।',
      },
      stairs_no_ramp: {
        title: 'ਪੌੜੀਆਂ, ਕੋਈ ਰੈਂਪ ਨਹੀਂ',
        desc: '6 ਪੌੜੀਆਂ, ਰੈਂਪ ਨਹੀਂ ਅਤੇ ਲਿਫਟ ਬੰਦ ਹੈ।',
        scene: '6 ਪੱਕੀਆਂ ਪੌੜੀਆਂ ਹਨ, ਰੈਂਪ ਨਹੀਂ ਅਤੇ ਲਿਫਟ ਬੰਦ ਹੈ।',
      },
      open_drain: {
        title: 'ਖੁੱਲ੍ਹੀ ਨਾਲੀ ਅਤੇ ਟੁੱਟਾ ਰਾਹ',
        desc: 'ਟੁੱਟੇ ਫੁੱਟਪਾਥ ਦੇ ਬਿਲਕੁਲ ਨਾਲ ਖੁੱਲ੍ਹੀ ਨਾਲੀ।',
        scene: 'ਖੁੱਲ੍ਹੀ ਨਾਲੀ ਦੇ ਨਾਲ ਟੁੱਟਾ ਫੁੱਟਪਾਥ।',
      },
      low_floor_bus: {
        title: 'ਲੋ-ਫਲੋਰ ਬੱਸ ਸਟਾਪ',
        desc: 'ਆਸਾਨ ਰੈਂਪ ਹੈ, ਕਰਾਸਿੰਗ ਤੇ ਆਵਾਜ਼ ਸਿਗਨਲ ਨਹੀਂ।',
        scene: 'ਬੱਸ ਸਟਾਪ ਤੇ ਰੈਂਪ ਹੈ, ਪਰ ਕਰਾਸਿੰਗ ਤੇ ਆਵਾਜ਼ ਨਹੀਂ ਹੈ।',
      },
      blurry_dark: {
        title: 'ਹਨੇਰੀ / ਧੁੰਦਲੀ ਫ਼ੋਟੋ',
        desc: 'ਸਾਫ਼ ਦਿਖ ਨਹੀਂ ਰਿਹਾ (ਜਾਂਚ ਬਾਕੀ)।',
        scene: 'ਫ਼ੋਟੋ ਬਹੁਤ ਹਨੇਰੀ ਅਤੇ ਧੁੰਦਲੀ ਹੈ।',
      },
    },
    photoFindingLabels: {
      stepFreeYes: 'ਬਿਨਾਂ ਪੌੜੀਆਂ ਵਾਲਾ ਰਾਹ',
      stepFreePartial: 'ਕੁਝ ਹਿੱਸਾ ਆਸਾਨ',
      stepFreeNo: 'ਪੌੜੀਆਂ ਜਾਂ ਰਾਹ ਬੰਦ',
      stepFreeUnknown: 'ਪੌੜੀਆਂ: ਪਤਾ ਨਹੀਂ',
      rampGentle: 'ਆਸਾਨ ਢਲਾਣ ਰੈਂਪ',
      rampModerate: 'ਦਰਮਿਆਨਾ ਰੈਂਪ',
      rampSteep: 'ਤਿੱਖਾ ਰੈਂਪ',
      rampNone: 'ਰੈਂਪ ਨਹੀਂ ਹੈ',
      rampUnknown: 'ਰੈਂਪ: ਪਤਾ ਨਹੀਂ',
      liftWorking: 'ਲਿਫਟ ਚੱਲ ਰਹੀ ਹੈ',
      liftBroken: 'ਲਿਫਟ ਖਰਾਬ ਹੈ',
      liftNone: 'ਲਿਫਟ ਨਹੀਂ ਹੈ',
      liftUnknown: 'ਲਿਫਟ: ਪਤਾ ਨਹੀਂ',
      tactileGood: 'ਪੀਲੀਆਂ ਟਾਈਲਾਂ ਸਾਫ਼ ਹਨ',
      tactileBlocked: 'ਪੀਲੀਆਂ ਟਾਈਲਾਂ ਬੰਦ ਹਨ',
      tactileBroken: 'ਪੀਲੀਆਂ ਟਾਈਲਾਂ ਟੁੱਟੀਆਂ ਹਨ',
      tactileNone: 'ਪੀਲੀਆਂ ਟਾਈਲਾਂ ਨਹੀਂ ਹਨ',
      tactileUnknown: 'ਪੀਲੀਆਂ ਟਾਈਲਾਂ: ਪਤਾ ਨਹੀਂ',
      obstructionBikes: 'ਬਾਈਕਾਂ ਨਾਲ ਰਾਹ ਬੰਦ',
      obstructionDrain: 'ਰਾਹ ਨੇੜੇ ਖੁੱਲ੍ਹੀ ਨਾਲੀ',
      obstructionGeneral: 'ਰਾਹ ਵਿੱਚ ਰੁਕਾਵਟ ਹੈ',
      noAudibleSignal: 'ਕਰਾਸਿੰਗ ਤੇ ਆਵਾਜ਼ ਨਹੀਂ',
      photoTooDarkBlurry: 'ਫ਼ੋਟੋ ਹਨੇਰੀ ਜਾਂ ਧੁੰਦਲੀ ਹੈ',
    },
  },
};

export const ISSUE_TRANSLATIONS: Record<
  string,
  { hi: { title: string; desc: string }; pa: { title: string; desc: string } }
> = {
  'ISS-1042': {
    hi: {
      title: 'लिफ्ट बंद है, बाहर बैरिकेड लगा है',
      desc: 'गेट 1 की लिफ्ट खराब है। व्हीलचेयर यात्री गेट 2 का उपयोग करें।',
    },
    pa: {
      title: 'ਲਿਫਟ ਬੰਦ ਹੈ, ਬਾਹਰ ਬੈਰੀਕੇਡ ਲੱਗਾ ਹੈ',
      desc: 'ਗੇਟ 1 ਦੀ ਲਿਫਟ ਖਰਾਬ ਹੈ। ਵ੍ਹੀਲਚੇਅਰ ਯਾਤਰੀ ਗੇਟ 2 ਵਰਤਣ।',
    },
  },
  'ISS-1041': {
    hi: {
      title: 'पीली गाइड टाइलें टूटी हैं और बीच में खंभा है',
      desc: 'स्टेशन के बाहर फुटपाथ की पीली टाइलें बिजली के खंभे से बंद हैं।',
    },
    pa: {
      title: 'ਪੀਲੀਆਂ ਗਾਈਡ ਟਾਈਲਾਂ ਟੁੱਟੀਆਂ ਹਨ ਤੇ ਵਿਚਕਾਰ ਖੰਭਾ ਹੈ',
      desc: 'ਸਟੇਸ਼ਨ ਦੇ ਬਾਹਰ ਫੁੱਟਪਾਥ ਦੀਆਂ ਪੀਲੀਆਂ ਟਾਈਲਾਂ ਬਿਜਲੀ ਦੇ ਖੰਭੇ ਕਾਰਨ ਬੰਦ ਹਨ।',
    },
  },
  'ISS-1039': {
    hi: {
      title: 'मुख्य गेट की लिफ्ट बंद है, रैंप बहुत खड़ा है',
      desc: 'गेट 1 की लिफ्ट मरम्मत में है। कृपया गेट 3 का आसान रैंप उपयोग करें।',
    },
    pa: {
      title: 'ਮੁੱਖ ਗੇਟ ਦੀ ਲਿਫਟ ਬੰਦ ਹੈ, ਰੈਂਪ ਬਹੁਤ ਤਿੱਖਾ ਹੈ',
      desc: 'ਗੇਟ 1 ਦੀ ਲਿਫਟ ਮੁਰੰਮਤ ਅਧੀਨ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਗੇਟ 3 ਦਾ ਆਸਾਨ ਰੈਂਪ ਵਰਤੋ।',
    },
  },
  'ISS-1037': {
    hi: {
      title: 'बस बे 14 पर रैंप नहीं है, ऊंचा किनारा है',
      desc: 'बस बे और फुटपाथ के बीच 22 सेमी ऊंचा किनारा है, रैंप नहीं बना है।',
    },
    pa: {
      title: 'ਬੱਸ ਬੇ 14 ਤੇ ਰੈਂਪ ਨਹੀਂ ਹੈ, ਉੱਚਾ ਕਿਨਾਰਾ ਹੈ',
      desc: 'ਬੱਸ ਬੇ ਅਤੇ ਫੁੱਟਪਾਥ ਵਿਚਕਾਰ 22 ਸੈ.ਮੀ. ਉੱਚਾ ਕਿਨਾਰਾ ਹੈ, ਰੈਂਪ ਨਹੀਂ ਹੈ।',
    },
  },
  'ISS-1035': {
    hi: {
      title: 'रास्ते के किनारे खुली नाली है',
      desc: 'बस स्टैंड के बाहर कच्चे रास्ते के साथ खुली नाली है।',
    },
    pa: {
      title: 'ਰਸਤੇ ਦੇ ਕਿਨਾਰੇ ਖੁੱਲ੍ਹੀ ਨਾਲੀ ਹੈ',
      desc: 'ਬੱਸ ਸਟੈਂਡ ਦੇ ਬਾਹਰ ਕੱਚੇ ਰਸਤੇ ਦੇ ਨਾਲ ਖੁੱਲ੍ਹੀ ਨਾਲੀ ਹੈ।',
    },
  },
  'ISS-1032': {
    hi: {
      title: 'रैंप पर स्कूटर खड़े हैं और ढलान तेज है',
      desc: 'पहाड़गंज रैंप के ऊपर दोपहिया वाहन खड़े होने से रास्ता संकरा है।',
    },
    pa: {
      title: 'ਰੈਂਪ ਤੇ ਸਕੂਟਰ ਖੜ੍ਹੇ ਹਨ ਅਤੇ ਢਲਾਣ ਤਿੱਖੀ ਹੈ',
      desc: 'ਪਹਾੜਗੰਜ ਰੈਂਪ ਦੇ ਉੱਪਰ ਸਕੂਟਰ ਖੜ੍ਹੇ ਹੋਣ ਕਰਕੇ ਰਸਤਾ ਤੰਗ ਹੈ।',
    },
  },
  'ISS-1029': {
    hi: {
      title: 'सबवे में 18 सीढ़ियाँ हैं, लिफ्ट नहीं है',
      desc: 'अंतरराज्यीय बस विंग तक जाने के लिए 18 सीढ़ियाँ चढ़नी पड़ती हैं।',
    },
    pa: {
      title: 'ਸਬਵੇ ਵਿੱਚ 18 ਪੌੜੀਆਂ ਹਨ, ਲਿਫਟ ਨਹੀਂ ਹੈ',
      desc: 'ਅੰਤਰਰਾਜੀ ਬੱਸ ਵਿੰਗ ਤੱਕ ਜਾਣ ਲਈ 18 ਪੌੜੀਆਂ ਚੜ੍ਹਨੀਆਂ ਪੈਂਦੀਆਂ ਹਨ।',
    },
  },
  'ISS-1025': {
    hi: {
      title: 'बस शेल्टर पर पीली गाइड टाइलें लग गईं',
      desc: 'नया फुटपाथ और पीली चेतावनी पट्टी लग चुकी है।',
    },
    pa: {
      title: 'ਬੱਸ ਸ਼ੈਲਟਰ ਤੇ ਪੀਲੀਆਂ ਗਾਈਡ ਟਾਈਲਾਂ ਲੱਗ ਗਈਆਂ',
      desc: 'ਨਵਾਂ ਫੁੱਟਪਾਥ ਅਤੇ ਪੀਲੀ ਚੇਤਾਵਨੀ ਪੱਟੀ ਲੱਗ ਚੁੱਕੀ ਹੈ।',
    },
  },
  'ISS-1021': {
    hi: {
      title: 'फुटपाथ की रुकावट हटा दी गई',
      desc: 'निर्माण बैरिकेड हट गया है और रास्ता चौड़ा है।',
    },
    pa: {
      title: 'ਫੁੱਟਪਾਥ ਦੀ ਰੁਕਾਵਟ ਹਟਾ ਦਿੱਤੀ ਗਈ',
      desc: 'ਉਸਾਰੀ ਬੈਰੀਕੇਡ ਹਟਾ ਦਿੱਤਾ ਗਿਆ ਹੈ ਅਤੇ ਰਸਤਾ ਖੁੱਲ੍ਹਾ ਹੈ।',
    },
  },
  'ISS-1018': {
    hi: {
      title: 'इस रूट पर केवल ऊंचे पायदान वाली बसें हैं',
      desc: 'फव्वारा चौक से अस्पताल जाने वाली बसों में लो-फ्लोर सुविधा नहीं है।',
    },
    pa: {
      title: 'ਇਸ ਰੂਟ ਤੇ ਸਿਰਫ਼ ਉੱਚੀਆਂ ਪੌੜੀਆਂ ਵਾਲੀਆਂ ਬੱਸਾਂ ਹਨ',
      desc: 'ਫੁਹਾਰਾ ਚੌਕ ਤੋਂ ਹਸਪਤਾਲ ਜਾਣ ਵਾਲੀਆਂ ਬੱਸਾਂ ਵਿੱਚ ਲੋ-ਫਲੋਰ ਸਹੂਲਤ ਨਹੀਂ ਹੈ।',
    },
  },
};

export const PLACE_NAME_TRANSLATIONS: Record<string, { hi: string; pa: string }> = {
  'Rajiv Chowk Metro Station': { hi: 'राजीव चौक मेट्रो स्टेशन', pa: 'ਰਾਜੀਵ ਚੌਕ ਮੈਟਰੋ ਸਟੇਸ਼ਨ' },
  'New Delhi Railway Station': { hi: 'नई दिल्ली रेलवे स्टेशन', pa: 'ਨਵੀਂ ਦਿੱਲੀ ਰੇਲਵੇ ਸਟੇਸ਼ਨ' },
  'Kashmere Gate ISBT & Metro': { hi: 'कश्मीरी गेट आईएसबीटी', pa: 'ਕਸ਼ਮੀਰੀ ਗੇਟ ਆਈਐਸਬੀਟੀ' },
  'Hauz Khas Metro & Hospital Link': { hi: 'हौज खास मेट्रो स्टेशन', pa: 'ਹੌਜ਼ ਖਾਸ ਮੈਟਰੋ ਸਟੇਸ਼ਨ' },
  'Chandigarh Railway Station': { hi: 'चंडीगढ़ रेलवे स्टेशन', pa: 'ਚੰਡੀਗੜ੍ਹ ਰੇਲਵੇ ਸਟੇਸ਼ਨ' },
  'ISBT Sector 17 Bus Terminus': { hi: 'आईएसबीटी सेक्टर 17', pa: 'ਆਈਐਸਬੀਟੀ ਸੈਕਟਰ 17' },
  'PGIMER Nehru Hospital OPD': { hi: 'पीजीआईएमईआर नेहरू अस्पताल', pa: 'ਪੀਜੀਆਈਐਮਈਆਰ ਨਹਿਰੂ ਹਸਪਤਾਲ' },
  'Patiala Railway Station': { hi: 'पटियाला रेलवे स्टेशन', pa: 'ਪਟਿਆਲਾ ਰੇਲਵੇ ਸਟੇਸ਼ਨ' },
  'Patiala New Bus Stand': { hi: 'पटियाला न्यू बस स्टैंड', pa: 'ਪਟਿਆਲਾ ਨਿਊ ਬੱਸ ਸਟੈਂਡ' },
  'Rajindra Hospital OPD': { hi: 'राजिंदरा अस्पताल', pa: 'ਰਾਜਿੰਦਰਾ ਹਸਪਤਾਲ' },
};

export function localizePlaceName(name: string, lang: LanguageCode): string {
  if (lang === 'en') return name;
  return PLACE_NAME_TRANSLATIONS[name]?.[lang] || name;
}

export const GATE_NAME_TRANSLATIONS: Record<string, { hi: string; pa: string }> = {
  'Gate 2 — Radial Road 3 Side Entrance': {
    hi: 'गेट 2 — रेडियल रोड 3 साइड प्रवेश',
    pa: 'ਗੇਟ 2 — ਰੇਡੀਅਲ ਰੋਡ 3 ਸਾਈਡ ਗੇਟ',
  },
  'Gate 1 — Palika Bazaar Concourse': {
    hi: 'गेट 1 — पालिका बाज़ार कॉनकोर्स',
    pa: 'ਗੇਟ 1 — ਪਾਲਿਕਾ ਬਾਜ਼ਾਰ ਕਾਨਕੋਰਸ',
  },
  'Gate 4 — Foot Overbridge Link': {
    hi: 'गेट 4 — फुट ओवरब्रिज रास्ता',
    pa: 'ਗੇਟ 4 — ਫੁੱਟ ਓਵਰਬ੍ਰਿਜ ਰਸਤਾ',
  },
  'Ajmeri Gate — VIP & Accessible Entry': {
    hi: 'अजमेरी गेट — आसान और वीआईपी प्रवेश',
    pa: 'ਅਜਮੇਰੀ ਗੇਟ — ਆਸਾਨ ਅਤੇ ਵੀਆਈਪੀ ਗੇਟ',
  },
  'Paharganj Gate — Platform 1 Porch': {
    hi: 'पहाड़गंज गेट — प्लेटफ़ॉर्म 1 बरामदा',
    pa: 'ਪਹਾੜਗੰਜ ਗੇਟ — ਪਲੇਟਫਾਰਮ 1 ਬਰਾਮਦਾ',
  },
  'Gate 5 — Metro Interchange Lift Entry': {
    hi: 'गेट 5 — मेट्रो इंटरचेंज लिफ्ट प्रवेश',
    pa: 'ਗੇਟ 5 — ਮੈਟਰੋ ਇੰਟਰਚੇਂਜ ਲਿਫਟ ਗੇਟ',
  },
  'ISBT Outstation Departure Bay 14': {
    hi: 'आईएसबीटी बाहर जाने वाली बस बे 14',
    pa: 'ਆਈਐਸਬੀਟੀ ਬਾਹਰ ਜਾਣ ਵਾਲੀ ਬੱਸ ਬੇ 14',
  },
  'Gate 3 — Panchsheel Marg Lift Entrance': {
    hi: 'गेट 3 — पंचशील मार्ग लिफ्ट प्रवेश',
    pa: 'ਗੇਟ 3 — ਪੰਚਸ਼ੀਲ ਮਾਰਗ ਲਿਫਟ ਗੇਟ',
  },
  'Gate 1 — IIT Crossing Side': {
    hi: 'गेट 1 — आईआईटी क्रॉसिंग साइड',
    pa: 'ਗੇਟ 1 — ਆਈਆਈਟੀ ਕਰਾਸਿੰਗ ਸਾਈਡ',
  },
  'Gate 3 — Side Ramp & Battery Cart Bay': {
    hi: 'गेट 3 — साइड रैंप और बैटरी कार्ट बे',
    pa: 'ਗੇਟ 3 — ਸਾਈਡ ਰੈਂਪ ਅਤੇ ਬੈਟਰੀ ਕਾਰਟ ਬੇ',
  },
  'Gate 1 — Main Porch Entrance': {
    hi: 'गेट 1 — मुख्य बरामदा प्रवेश',
    pa: 'ਗੇਟ 1 — ਮੁੱਖ ਬਰਾਮਦਾ ਗੇਟ',
  },
  'Local CTU Bay 1-4 — Tactile Boarding Strip': {
    hi: 'लोकल सीटीयू बे 1-4 — पीली गाइड पट्टी',
    pa: 'ਲੋਕਲ ਸੀਟੀਯੂ ਬੇ 1-4 — ਪੀਲੀ ਗਾਈਡ ਪੱਟੀ',
  },
  'Interstate Wing — Subway Stair Access': {
    hi: 'अंतरराज्यीय विंग — सीढ़ियों वाला सबवे',
    pa: 'ਅੰਤਰਰਾਜੀ ਵਿੰਗ — ਪੌੜੀਆਂ ਵਾਲਾ ਸਬਵੇ',
  },
  'New OPD — Step-Free Ambulatory Porch': {
    hi: 'नई ओपीडी — बिना सीढ़ियों का प्रवेश',
    pa: 'ਨਵੀਂ ਓਪੀਡੀ — ਬਿਨਾਂ ਪੌੜੀਆਂ ਵਾਲਾ ਗੇਟ',
  },
  'East Parcel Gate — Platform 1 Ramp': {
    hi: 'ईस्ट पार्सल गेट — प्लेटफ़ॉर्म 1 रैंप',
    pa: 'ਈਸਟ ਪਾਰਸਲ ਗੇਟ — ਪਲੇਟਫਾਰਮ 1 ਰੈਂਪ',
  },
  'Main Ticket Hall — West Approach': {
    hi: 'मुख्य टिकट हॉल — पश्चिमी रास्ता',
    pa: 'ਮੁੱਖ ਟਿਕਟ ਹਾਲ — ਪੱਛਮੀ ਰਸਤਾ',
  },
  'Bay 1 Main Arrival Concourse': {
    hi: 'बे 1 मुख्य आगमन हॉल',
    pa: 'ਬੇ 1 ਮੁੱਖ ਆਗਮਨ ਹਾਲ',
  },
  'Emergency Wing Ramp Entry': {
    hi: 'आपातकालीन विंग रैंप प्रवेश',
    pa: 'ਐਮਰਜੈਂਸੀ ਵਿंग ਰੈਂਪ ਗੇਟ',
  },
};

export function localizeGateName(name: string, lang: LanguageCode): string {
  if (lang === 'en') return name;
  return GATE_NAME_TRANSLATIONS[name]?.[lang] || name;
}

export const ROUTE_TRANSLATIONS: Record<
  string,
  {
    hi: {
      end_label: string;
      summary: Record<TravelMode, string>;
      warnings: string[];
      steps: Record<string, string>;
    };
    pa: {
      end_label: string;
      summary: Record<TravelMode, string>;
      warnings: string[];
      steps: Record<string, string>;
    };
  }
> = {
  'rt-ndls-rc': {
    hi: {
      end_label: 'राजीव चौक मेट्रो (प्लेटफ़ॉर्म 2)',
      summary: {
        wheelchair: 'गेट 2 चुनें (लिफ्ट चालू है और आसान रैंप है)। गेट 4 की 42 सीढ़ियों और गेट 1 की खराब लिफ्ट से बचाता है।',
        blind: 'गेट 2 पर रेडियल 3 से प्लेटफ़ॉर्म 2 तक लगातार पीली गाइड टाइलें हैं।',
        walker: 'गेट 2 का आसान रैंप लें; केवल 65 मीटर अधिक चलकर 42 सीढ़ियों से बचें।',
        standard: 'सबसे छोटा रास्ता सीधे गेट 4 की सीढ़ियों से जाता है।',
      },
      warnings: ['गेट 4 पर 42 सीढ़ियाँ हैं', 'गेट 1 की लिफ्ट बंद है'],
      steps: {
        a1: 'कनॉट प्लेस के समतल बरामदे के साथ 140 मीटर आगे बढ़ें।',
        a2: 'रेडियल रोड 3 क्रॉसिंग पर ढलान वाले किनारे से सड़क पार करें।',
        a3: 'दोनों तरफ रेलिंग वाले आसान रैंप से गेट 2 में प्रवेश करें।',
        a4: 'कॉनकोर्स लिफ्ट B से सीधे प्लेटफ़ॉर्म 2 पर जाएं।',
        ba1: 'इनर सर्कल के साथ लगातार पीली गाइड लाइन पर 145 मीटर चलें।',
        ba2: 'रेडियल 3 सिग्नल पर घंटी बजने का इंतज़ार करें और फिर पार करें।',
        ba3: 'गाइड लाइन के मोड़ से बाएं गेट 2 में मुड़ें; 4 मीटर में रेलिंग मिल जाएगी।',
        wa1: 'छायादार समतल कॉरिडोर पर 140 मीटर चलें।',
        wa2: 'दोनों तरफ रेलिंग वाले गेट 2 रैंप का उपयोग करें।',
        wa3: 'प्लेटफ़ॉर्म 2 के लिए लिफ्ट लें।',
        sa1: 'गेट 2 के रैंप और लिफ्ट से अंदर जाएं।',
      },
    },
    pa: {
      end_label: 'ਰਾਜੀਵ ਚੌਕ ਮੈਟਰੋ (ਪਲੇਟਫਾਰਮ 2)',
      summary: {
        wheelchair: 'ਗੇਟ 2 ਵਰਤੋ (ਲਿਫਟ ਚੱਲ ਰਹੀ ਹੈ ਤੇ ਆਸਾਨ ਰੈਂਪ ਹੈ)। ਗੇਟ 4 ਦੀਆਂ 42 ਪੌੜੀਆਂ ਅਤੇ ਗੇਟ 1 ਦੀ ਖਰਾਬ ਲਿਫਟ ਤੋਂ ਬਚੋ।',
        blind: 'ਗੇਟ 2 ਤੇ ਰੇਡੀਅਲ 3 ਤੋਂ ਪਲੇਟਫਾਰਮ 2 ਤੱਕ ਲਗਾਤਾਰ ਪੀਲੀਆਂ ਗਾਈਡ ਟਾਈਲਾਂ ਹਨ।',
        walker: 'ਗੇਟ 2 ਦਾ ਆਸਾਨ ਰੈਂਪ ਲਓ; ਸਿਰਫ਼ 65 ਮੀਟਰ ਵੱਧ ਤੁਰ ਕੇ 42 ਪੌੜੀਆਂ ਤੋਂ ਬਚੋ।',
        standard: 'ਸਭ ਤੋਂ ਛੋਟਾ ਰਸਤਾ ਸਿੱਧਾ ਗੇਟ 4 ਦੀਆਂ ਪੌੜੀਆਂ ਤੋਂ ਜਾਂਦਾ ਹੈ।',
      },
      warnings: ['ਗੇਟ 4 ਤੇ 42 ਪੌੜੀਆਂ ਹਨ', 'ਗੇਟ 1 ਦੀ ਲਿਫਟ ਖਰਾਬ ਹੈ'],
      steps: {
        a1: 'ਕਨਾਟ ਪਲੇਸ ਦੇ ਪੱਧਰੇ ਬਰਾਮਦੇ ਦੇ ਨਾਲ 140 ਮੀਟਰ ਅੱਗੇ ਵਧੋ।',
        a2: 'ਰੇਡੀਅਲ ਰੋਡ 3 ਕਰਾਸਿੰਗ ਤੇ ਢਲਾਣ ਵਾਲੇ ਕਿਨਾਰੇ ਤੋਂ ਸੜਕ ਪਾਰ ਕਰੋ।',
        a3: 'ਦੋਵੇਂ ਪਾਸੇ ਰੇਲਿੰਗ ਵਾਲੇ ਆਸਾਨ ਰੈਂਪ ਰਾਹੀਂ ਗੇਟ 2 ਵਿੱਚ ਜਾਓ।',
        a4: 'ਕਾਨਕੋਰਸ ਲਿਫਟ B ਰਾਹੀਂ ਸਿੱਧੇ ਪਲੇਟਫਾਰਮ 2 ਤੇ ਜਾਓ।',
        ba1: 'ਇਨਰ ਸਰਕਲ ਦੇ ਨਾਲ ਲਗਾਤਾਰ ਪੀਲੀ ਗਾਈਡ ਲਾਈਨ ਤੇ 145 ਮੀਟਰ ਤੁਰੋ।',
        ba2: 'ਰੇਡੀਅਲ 3 ਸਿਗਨਲ ਤੇ ਘੰਟੀ ਵੱਜਣ ਦੀ ਉਡੀਕ ਕਰਕੇ ਸੜਕ ਪਾਰ ਕਰੋ।',
        ba3: 'ਗਾਈਡ ਮੋੜ ਤੋਂ ਖੱਬੇ ਗੇਟ 2 ਵਿੱਚ ਮੁੜੋ; 4 ਮੀਟਰ ਵਿੱਚ ਰੇਲਿੰਗ ਮਿਲੇਗੀ।',
        wa1: 'ਛਾਂਦਾਰ ਪੱਧਰੇ ਰਸਤੇ ਤੇ 140 ਮੀਟਰ ਤੁਰੋ।',
        wa2: 'ਦੋਵੇਂ ਪਾਸੇ ਰੇਲਿੰਗ ਵਾਲੇ ਗੇਟ 2 ਰੈਂਪ ਦੀ ਵਰਤੋਂ ਕਰੋ।',
        wa3: 'ਪਲੇਟਫਾਰਮ 2 ਲਈ ਲਿਫਟ ਲਓ।',
        sa1: 'ਗੇਟ 2 ਦੇ ਰੈਂਪ ਅਤੇ ਲਿਫਟ ਰਾਹੀਂ ਅੰਦਰ ਜਾਓ।',
      },
    },
  },
  'rt-chd-stn': {
    hi: {
      end_label: 'चंडीगढ़ रेलवे स्टेशन (प्लेटफ़ॉर्म 1)',
      summary: {
        wheelchair: 'गेट 3 साइड रैंप और बैटरी कार्ट बे से जाएं; गेट 1 की बंद लिफ्ट से बचें।',
        blind: 'उद्योग पथ के समतल किनारे से गेट 3 की लगातार पीली गाइड लाइन तक जाएं।',
        walker: 'मुख्य गेट की 5 सीढ़ियाँ और बंद लिफ्ट छोड़ें; समतल साइड रास्ता लें।',
        standard: 'सीधा रास्ता गेट 1 मुख्य बरामदे से जाता है।',
      },
      warnings: ['गेट 1 की लिफ्ट बंद है', 'बरामदे पर 5 सीढ़ियाँ और खड़ा रैंप है'],
      steps: {
        ca1: 'रेलवे पार्क के किनारे समतल पक्के रास्ते पर 150 मीटर दक्षिण-पूर्व चलें।',
        ca2: 'गेट 3 के आसान रैंप से सीधे प्लेटफ़ॉर्म 1 पर जाएं।',
        cba1: 'टैक्सी स्टैंड से दूर किनारे की पीली पट्टी के साथ 150 मीटर चलें।',
        cba2: 'गाइड मैट से बाएं मुड़कर ढके हुए गेट 3 रैंप में जाएं।',
        cwa1: 'छायादार दक्षिणी रास्ते से चलकर गेट 3 रैंप में जाएं।',
        csa1: 'गेट 3 से अंदर जाएं।',
      },
    },
    pa: {
      end_label: 'ਚੰਡੀਗੜ੍ਹ ਰੇਲਵੇ ਸਟੇਸ਼ਨ (ਪਲੇਟਫਾਰਮ 1)',
      summary: {
        wheelchair: 'ਗੇਟ 3 ਸਾਈਡ ਰੈਂਪ ਅਤੇ ਬੈਟਰੀ ਕਾਰਟ ਬੇ ਰਾਹੀਂ ਜਾਓ; ਗੇਟ 1 ਦੀ ਖਰਾਬ ਲਿਫਟ ਤੋਂ ਬਚੋ।',
        blind: 'ਉਦਯੋਗ ਪੱਥ ਦੇ ਪੱਧਰੇ ਕਿਨਾਰੇ ਤੋਂ ਗੇਟ 3 ਦੀ ਲਗਾਤਾਰ ਪੀਲੀ ਗਾਈਡ ਲਾਈਨ ਤੱਕ ਜਾਓ।',
        walker: 'ਮੁੱਖ ਗੇਟ ਦੀਆਂ 5 ਪੌੜੀਆਂ ਤੇ ਬੰਦ ਲਿਫਟ ਛੱਡੋ; ਪੱਧਰਾ ਸਾਈਡ ਰਸਤਾ ਲਓ।',
        standard: 'ਸਿੱਧਾ ਰਸਤਾ ਗੇਟ 1 ਮੁੱਖ ਬਰਾਮਦੇ ਤੋਂ ਜਾਂਦਾ ਹੈ।',
      },
      warnings: ['ਗੇਟ 1 ਦੀ ਲਿਫਟ ਬੰਦ ਹੈ', 'ਬਰਾਮਦੇ ਤੇ 5 ਪੌੜੀਆਂ ਅਤੇ ਤਿੱਖਾ ਰੈਂਪ ਹੈ'],
      steps: {
        ca1: 'ਰੇਲਵੇ ਪਾਰਕ ਦੇ ਨਾਲ ਪੱਧਰੇ ਪੱਕੇ ਰਸਤੇ ਤੇ 150 ਮੀਟਰ ਦੱਖਣ-ਪੂਰਬ ਤੁਰੋ।',
        ca2: 'ਗੇਟ 3 ਦੇ ਆਸਾਨ ਰੈਂਪ ਰਾਹੀਂ ਸਿੱਧੇ ਪਲੇਟਫਾਰਮ 1 ਤੇ ਜਾਓ।',
        cba1: 'ਟੈਕਸੀ ਸਟੈਂਡ ਤੋਂ ਦੂਰ ਕਿਨਾਰੇ ਦੀ ਪੀਲੀ ਪੱਟੀ ਦੇ ਨਾਲ 150 ਮੀਟਰ ਤੁਰੋ।',
        cba2: 'ਗਾਈਡ ਮੈਟ ਤੋਂ ਖੱਬੇ ਮੁੜ ਕੇ ਢੱਕੇ ਹੋਏ ਗੇਟ 3 ਰੈਂਪ ਵਿੱਚ ਜਾਓ।',
        cwa1: 'ਛਾਂਦਾਰ ਦੱਖਣੀ ਰਸਤੇ ਤੋਂ ਤੁਰ ਕੇ ਗੇਟ 3 ਰੈਂਪ ਵਿੱਚ ਜਾਓ।',
        csa1: 'ਗੇਟ 3 ਰਾਹੀਂ ਅੰਦਰ ਜਾਓ।',
      },
    },
  },
  'rt-pta-stn': {
    hi: {
      end_label: 'पटियाला रेलवे स्टेशन (प्लेटफ़ॉर्म 1)',
      summary: {
        wheelchair: 'ईस्ट पार्सल गेट रैंप से जाएं; मुख्य हॉल की 7 सीढ़ियाँ और टूटा फुटपाथ छोड़ें।',
        blind: 'पश्चिमी रास्ते पर पीली टाइलों में खंभे की रुकावट से बचें; पूर्वी रास्ते में जांच बाकी है।',
        walker: 'पश्चिमी रास्ते के टूटे पत्थरों से बचें और समतल ईस्ट पार्सल गेट लें।',
        standard: 'सीधा पश्चिमी रास्ता टूटी टाइलों और 7 सीढ़ियों से जाता है।',
      },
      warnings: ['मुख्य हॉल पर 7 सीढ़ियाँ हैं', 'पश्चिमी फुटपाथ पर खंभा और टूटी टाइलें हैं'],
      steps: {
        pa1: 'पक्की स्टेशन सर्विस लेन पर 220 मीटर दक्षिण-पूर्व चलें।',
        pa2: 'ईस्ट लूप पर 110 मीटर आगे बढ़ें (जांच बाकी है — सड़क किनारे ध्यान रखें)।',
        pa3: 'ईस्ट पार्सल गेट के रैंप से प्लेटफ़ॉर्म 1 पर जाएं।',
        pba1: 'दक्षिणी किनारे से ईस्ट पार्सल गेट तक जाएं और कार्यालय से मदद मांगें।',
        pwa1: 'समतल बाहरी लेन से ईस्ट पार्सल गेट रैंप तक चलें।',
        psa1: 'ईस्ट पार्सल गेट से अंदर जाएं।',
      },
    },
    pa: {
      end_label: 'ਪਟਿਆਲਾ ਰੇਲਵੇ ਸਟੇਸ਼ਨ (ਪਲੇਟਫਾਰਮ 1)',
      summary: {
        wheelchair: 'ਈਸਟ ਪਾਰਸਲ ਗੇਟ ਰੈਂਪ ਰਾਹੀਂ ਜਾਓ; ਮੁੱਖ ਹਾਲ ਦੀਆਂ 7 ਪੌੜੀਆਂ ਤੇ ਟੁੱਟੇ ਫੁੱਟਪਾਥ ਤੋਂ ਬਚੋ।',
        blind: 'ਪੱਛਮੀ ਰਸਤੇ ਤੇ ਪੀਲੀਆਂ ਟਾਈਲਾਂ ਵਿੱਚ ਖੰਭੇ ਦੀ ਰੁਕਾਵਟ ਤੋਂ ਬਚੋ; ਪੂਰਬੀ ਰਸਤੇ ਦੀ ਜਾਂਚ ਬਾਕੀ ਹੈ।',
        walker: 'ਪੱਛਮੀ ਰਸਤੇ ਦੇ ਟੁੱਟੇ ਪੱਥਰਾਂ ਤੋਂ ਬਚੋ ਅਤੇ ਪੱਧਰਾ ਈਸਟ ਪਾਰਸਲ ਗੇਟ ਲਓ।',
        standard: 'ਸਿੱਧਾ ਪੱਛਮੀ ਰਸਤਾ ਟੁੱਟੀਆਂ ਟਾਈਲਾਂ ਅਤੇ 7 ਪੌੜੀਆਂ ਤੋਂ ਜਾਂਦਾ ਹੈ।',
      },
      warnings: ['ਮੁੱਖ ਹਾਲ ਤੇ 7 ਪੌੜੀਆਂ ਹਨ', 'ਪੱਛਮੀ ਫੁੱਟਪਾਥ ਤੇ ਖੰਭਾ ਤੇ ਟੁੱਟੀਆਂ ਟਾਈਲਾਂ ਹਨ'],
      steps: {
        pa1: 'ਪੱਕੀ ਸਟੇਸ਼ਨ ਸਰਵਿਸ ਲੇਨ ਤੇ 220 ਮੀਟਰ ਦੱਖਣ-ਪੂਰਬ ਤੁਰੋ।',
        pa2: 'ਈਸਟ ਲूप ਤੇ 110 ਮੀਟਰ ਅੱਗੇ ਵਧੋ (ਜਾਂਚ ਬਾਕੀ ਹੈ — ਸੜਕ ਕਿਨਾਰੇ ਧਿਆਨ ਰੱਖੋ)।',
        pa3: 'ਈਸਟ ਪਾਰਸਲ ਗੇਟ ਦੇ ਰੈਂਪ ਰਾਹੀਂ ਪਲੇਟਫਾਰਮ 1 ਤੇ ਜਾਓ।',
        pba1: 'ਦੱਖਣੀ ਕਿਨਾਰੇ ਤੋਂ ਈਸਟ ਪਾਰਸਲ ਗੇਟ ਤੱਕ ਜਾਓ ਅਤੇ ਦਫ਼ਤਰ ਤੋਂ ਮਦਦ ਮੰਗੋ।',
        pwa1: 'ਪੱਧਰੀ ਬਾਹਰੀ ਲੇਨ ਤੋਂ ਈਸਟ ਪਾਰਸਲ ਗੇਟ ਰੈਂਪ ਤੱਕ ਤੁਰੋ।',
        psa1: 'ਈਸਟ ਪਾਰਸਲ ਗੇਟ ਰਾਹੀਂ ਅੰਦਰ ਜਾਓ।',
      },
    },
  },
};

export function getSpeechLocale(lang: LanguageCode): string {
  if (lang === 'hi') return 'hi-IN';
  if (lang === 'pa') return 'pa-IN';
  return 'en-IN';
}
