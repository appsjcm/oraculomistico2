export const APP_LANGUAGE_KEY = 'oraculo.appLanguage.v1';

export const APP_LANGUAGES = [
  { code:'auto', label:'Automático / Automatic' },
  { code:'es', label:'Español' },
  { code:'ca', label:'Català' },
  { code:'en', label:'English' },
  { code:'fr', label:'Français' },
  { code:'de', label:'Deutsch' },
  { code:'zh', label:'中文' }
];

const LOCALES = {
  es:'es-ES',
  ca:'ca-ES',
  en:'en-US',
  fr:'fr-FR',
  de:'de-DE',
  zh:'zh-CN'
};

const STRINGS = {
  es: {
    skip:'Saltar al contenido', guide:'Guía', settings:'Ajustes',
    greeting:'Bienvenida al santuario',
    heroTitle:'Encuentra una lectura simbólica clara y personal.',
    heroText:'Tarot, runas, luna, sueños, numerología, sinastría y biblioteca mística en una experiencia sencilla.',
    aiSymbolic:'IA: modo simbólico', intentionFree:'Intención: libre', installable:'Web instalable',
    firstReadings:'Primeras tiradas', connectAI:'Conectar IA', controlCenter:'Centro de control',
    tutorial:'Tutorial', install:'Instalar', voiceAvatar:'Avatar voz',
    mainModules:'Módulos principales', map:'Mapa', mapSub:'Todo de un vistazo',
    ritualChat:'Chat Ritual', ritualChatSub:'Tiradas privadas con voz e IA',
    tarot:'Tarot', tarotSub:'Carta, tiradas y biblioteca', runes:'Runas', runesSub:'Runa rápida y tiradas',
    moon:'Luna', moonSub:'Lectura lunar guiada', dreams:'Sueños', dreamsSub:'Interpretación simbólica',
    numerology:'Numerología', numerologySub:'Perfil completo y sinastría',
    grabovoi:'Grabovoi', grabovoiSub:'Secuencias y formas de uso',
    library:'Biblioteca', librarySub:'Diario y guardados', center:'Centro', centerSub:'Buscar, estado y privacidad',
    avatar:'Avatar', avatarSub:'Oráculo animado con voz', settingsSub:'Voz, avatar y visual',
    dailyMessage:'Mensaje del día',
    dailyText:'Revela la carta, la runa y la fase lunar del día. Puedes escuchar, guardar o exportar la lectura.',
    reveal:'Revelar', disclaimer:'Experiencia simbólica y de entretenimiento. No sustituye asesoramiento profesional.',
    privacy:'Privacidad', manual:'Manual', stopVoice:'Parar voz',
    appLanguage:'Idioma de la aplicación', languageHelp:'La interfaz, el dictado y la voz automática seguirán este idioma.',
    saveSettings:'Guardar ajustes', settingsSaved:'Ajustes guardados.',
    closed:'Cerrar', reversalRate:'Probabilidad invertida de esta tirada: {rate}%.',
    internationalNote:'Interfaz disponible en seis idiomas. Los significados tradicionales conservan su fuente original en español mientras se completa su revisión editorial.'
  },
  ca: {
    skip:'Saltar al contingut', guide:'Guia', settings:'Configuració',
    greeting:'Benvinguda al santuari',
    heroTitle:'Troba una lectura simbòlica clara i personal.',
    heroText:'Tarot, runes, lluna, somnis, numerologia, sinastria i biblioteca mística en una experiència senzilla.',
    aiSymbolic:'IA: mode simbòlic', intentionFree:'Intenció: lliure', installable:'Web instal·lable',
    firstReadings:'Primeres tirades', connectAI:'Connectar IA', controlCenter:'Centre de control',
    tutorial:'Tutorial', install:'Instal·lar', voiceAvatar:'Avatar amb veu',
    mainModules:'Mòduls principals', map:'Mapa', mapSub:"Tot d'un cop d'ull",
    ritualChat:'Xat Ritual', ritualChatSub:'Tirades privades amb veu i IA',
    tarot:'Tarot', tarotSub:'Carta, tirades i biblioteca', runes:'Runes', runesSub:'Runa ràpida i tirades',
    moon:'Lluna', moonSub:'Lectura lunar guiada', dreams:'Somnis', dreamsSub:'Interpretació simbòlica',
    numerology:'Numerologia', numerologySub:'Perfil complet i sinastria',
    grabovoi:'Grabovoi', grabovoiSub:"Seqüències i formes d'ús",
    library:'Biblioteca', librarySub:'Diari i desats', center:'Centre', centerSub:'Cerca, estat i privacitat',
    avatar:'Avatar', avatarSub:'Oracle animat amb veu', settingsSub:'Veu, avatar i visual',
    dailyMessage:'Missatge del dia', dailyText:'Revela la carta, la runa i la fase lunar del dia. Pots escoltar, desar o exportar la lectura.',
    reveal:'Revelar', disclaimer:"Experiència simbòlica i d'entreteniment. No substitueix l'assessorament professional.",
    privacy:'Privacitat', manual:'Manual', stopVoice:'Aturar veu',
    appLanguage:"Idioma de l'aplicació", languageHelp:'La interfície, el dictat i la veu automàtica seguiran aquest idioma.',
    saveSettings:'Desar configuració', settingsSaved:'Configuració desada.',
    closed:'Tancar', reversalRate:"Probabilitat invertida d'aquesta tirada: {rate}%.",
    internationalNote:'Interfície disponible en sis idiomes. Els significats tradicionals conserven la font original en castellà mentre es completa la revisió editorial.'
  },
  en: {
    skip:'Skip to content', guide:'Guide', settings:'Settings',
    greeting:'Welcome to the sanctuary',
    heroTitle:'Find a clear, personal symbolic reading.',
    heroText:'Tarot, runes, moon, dreams, numerology, synastry and a mystical library in one simple experience.',
    aiSymbolic:'AI: symbolic mode', intentionFree:'Intention: open', installable:'Installable web app',
    firstReadings:'First readings', connectAI:'Connect AI', controlCenter:'Control center',
    tutorial:'Tutorial', install:'Install', voiceAvatar:'Voice avatar',
    mainModules:'Main modules', map:'Map', mapSub:'Everything at a glance',
    ritualChat:'Ritual Chat', ritualChatSub:'Private readings with voice and AI',
    tarot:'Tarot', tarotSub:'Cards, spreads and library', runes:'Runes', runesSub:'Quick rune and spreads',
    moon:'Moon', moonSub:'Guided lunar reading', dreams:'Dreams', dreamsSub:'Symbolic interpretation',
    numerology:'Numerology', numerologySub:'Full profile and synastry',
    grabovoi:'Grabovoi', grabovoiSub:'Sequences and ways to use them',
    library:'Library', librarySub:'Journal and saved readings', center:'Center', centerSub:'Search, status and privacy',
    avatar:'Avatar', avatarSub:'Animated oracle with voice', settingsSub:'Voice, avatar and appearance',
    dailyMessage:'Message of the day', dailyText:"Reveal today's card, rune and moon phase. Listen, save or export the reading.",
    reveal:'Reveal', disclaimer:'A symbolic entertainment experience. It is not a substitute for professional advice.',
    privacy:'Privacy', manual:'Manual', stopVoice:'Stop voice',
    appLanguage:'App language', languageHelp:'The interface, dictation and automatic voice will use this language.',
    saveSettings:'Save settings', settingsSaved:'Settings saved.',
    closed:'Close', reversalRate:'Reversed probability for this reading: {rate}%.',
    internationalNote:'The interface is available in six languages. Traditional meanings retain their original Spanish source while editorial translation is completed.'
  },
  fr: {
    skip:'Aller au contenu', guide:'Guide', settings:'Réglages',
    greeting:'Bienvenue au sanctuaire',
    heroTitle:'Trouvez une lecture symbolique claire et personnelle.',
    heroText:'Tarot, runes, lune, rêves, numérologie, synastrie et bibliothèque mystique dans une expérience simple.',
    aiSymbolic:'IA : mode symbolique', intentionFree:'Intention : libre', installable:'Application web installable',
    firstReadings:'Premiers tirages', connectAI:"Connecter l'IA", controlCenter:'Centre de contrôle',
    tutorial:'Tutoriel', install:'Installer', voiceAvatar:'Avatar vocal',
    mainModules:'Modules principaux', map:'Carte', mapSub:"Tout en un coup d'œil",
    ritualChat:'Chat Rituel', ritualChatSub:'Tirages privés avec voix et IA',
    tarot:'Tarot', tarotSub:'Cartes, tirages et bibliothèque', runes:'Runes', runesSub:'Rune rapide et tirages',
    moon:'Lune', moonSub:'Lecture lunaire guidée', dreams:'Rêves', dreamsSub:'Interprétation symbolique',
    numerology:'Numérologie', numerologySub:'Profil complet et synastrie',
    grabovoi:'Grabovoi', grabovoiSub:"Séquences et modes d'emploi",
    library:'Bibliothèque', librarySub:'Journal et lectures sauvegardées', center:'Centre', centerSub:'Recherche, état et confidentialité',
    avatar:'Avatar', avatarSub:'Oracle animé avec voix', settingsSub:'Voix, avatar et apparence',
    dailyMessage:'Message du jour', dailyText:'Révélez la carte, la rune et la phase lunaire du jour. Écoutez, enregistrez ou exportez la lecture.',
    reveal:'Révéler', disclaimer:'Expérience symbolique et de divertissement. Ne remplace pas un avis professionnel.',
    privacy:'Confidentialité', manual:'Manuel', stopVoice:'Arrêter la voix',
    appLanguage:"Langue de l'application", languageHelp:"L'interface, la dictée et la voix automatique utiliseront cette langue.",
    saveSettings:'Enregistrer les réglages', settingsSaved:'Réglages enregistrés.',
    closed:'Fermer', reversalRate:'Probabilité inversée de ce tirage : {rate} %.',
    internationalNote:"Interface disponible en six langues. Les significations traditionnelles conservent leur source espagnole pendant la révision éditoriale."
  },
  de: {
    skip:'Zum Inhalt springen', guide:'Anleitung', settings:'Einstellungen',
    greeting:'Willkommen im Heiligtum',
    heroTitle:'Finde eine klare, persönliche symbolische Deutung.',
    heroText:'Tarot, Runen, Mond, Träume, Numerologie, Synastrie und mystische Bibliothek in einer einfachen Anwendung.',
    aiSymbolic:'KI: symbolischer Modus', intentionFree:'Absicht: offen', installable:'Installierbare Web-App',
    firstReadings:'Erste Legungen', connectAI:'KI verbinden', controlCenter:'Kontrollzentrum',
    tutorial:'Anleitung', install:'Installieren', voiceAvatar:'Sprachavatar',
    mainModules:'Hauptmodule', map:'Übersicht', mapSub:'Alles auf einen Blick',
    ritualChat:'Ritual-Chat', ritualChatSub:'Private Legungen mit Stimme und KI',
    tarot:'Tarot', tarotSub:'Karten, Legungen und Bibliothek', runes:'Runen', runesSub:'Schnelle Rune und Legungen',
    moon:'Mond', moonSub:'Geführte Monddeutung', dreams:'Träume', dreamsSub:'Symbolische Deutung',
    numerology:'Numerologie', numerologySub:'Vollständiges Profil und Synastrie',
    grabovoi:'Grabovoi', grabovoiSub:'Zahlenfolgen und Anwendung',
    library:'Bibliothek', librarySub:'Tagebuch und gespeicherte Deutungen', center:'Zentrum', centerSub:'Suche, Status und Datenschutz',
    avatar:'Avatar', avatarSub:'Animiertes Orakel mit Stimme', settingsSub:'Stimme, Avatar und Darstellung',
    dailyMessage:'Botschaft des Tages', dailyText:'Entdecke die Karte, Rune und Mondphase des Tages. Anhören, speichern oder exportieren.',
    reveal:'Aufdecken', disclaimer:'Symbolische Unterhaltung. Kein Ersatz für professionelle Beratung.',
    privacy:'Datenschutz', manual:'Handbuch', stopVoice:'Stimme stoppen',
    appLanguage:'App-Sprache', languageHelp:'Oberfläche, Diktat und automatische Stimme verwenden diese Sprache.',
    saveSettings:'Einstellungen speichern', settingsSaved:'Einstellungen gespeichert.',
    closed:'Schließen', reversalRate:'Umkehrwahrscheinlichkeit dieser Legung: {rate} %.',
    internationalNote:'Die Oberfläche ist in sechs Sprachen verfügbar. Traditionelle Bedeutungen behalten vorerst ihre spanische Originalquelle.'
  },
  zh: {
    skip:'跳到内容', guide:'指南', settings:'设置',
    greeting:'欢迎来到神谕圣殿',
    heroTitle:'获得清晰而个性化的象征解读。',
    heroText:'塔罗牌、卢恩符文、月亮、梦境、数字命理、合盘与神秘资料库，汇聚于简洁体验。',
    aiSymbolic:'AI：象征模式', intentionFree:'意图：开放', installable:'可安装网页应用',
    firstReadings:'首次解读', connectAI:'连接 AI', controlCenter:'控制中心',
    tutorial:'教程', install:'安装', voiceAvatar:'语音化身',
    mainModules:'主要功能', map:'总览', mapSub:'一目了然',
    ritualChat:'仪式聊天', ritualChatSub:'带语音和 AI 的私人解读',
    tarot:'塔罗牌', tarotSub:'单牌、牌阵与资料库', runes:'卢恩符文', runesSub:'快速符文与符文阵',
    moon:'月亮', moonSub:'月相引导解读', dreams:'梦境', dreamsSub:'象征性解析',
    numerology:'数字命理', numerologySub:'完整档案与关系合盘',
    grabovoi:'Grabovoi', grabovoiSub:'数字序列与使用方法',
    library:'资料库', librarySub:'日记与已保存解读', center:'中心', centerSub:'搜索、状态与隐私',
    avatar:'化身', avatarSub:'带语音的动画神谕', settingsSub:'语音、化身与外观',
    dailyMessage:'今日讯息', dailyText:'揭示今日塔罗牌、符文与月相。可以收听、保存或导出。',
    reveal:'揭示', disclaimer:'本应用仅供象征性娱乐，不能替代专业建议。',
    privacy:'隐私', manual:'手册', stopVoice:'停止语音',
    appLanguage:'应用语言', languageHelp:'界面、听写和自动语音将使用此语言。',
    saveSettings:'保存设置', settingsSaved:'设置已保存。',
    closed:'关闭', reversalRate:'本次解读的逆位概率：{rate}%。',
    internationalNote:'界面支持六种语言。传统牌义在编辑翻译完成前暂时保留西班牙语原文。'
  }
};

function browserLanguage() {
  const value = String(navigator.languages?.[0] || navigator.language || 'es').toLowerCase();
  if (value.startsWith('ca')) return 'ca';
  if (value.startsWith('en')) return 'en';
  if (value.startsWith('fr')) return 'fr';
  if (value.startsWith('de')) return 'de';
  if (value.startsWith('zh')) return 'zh';
  return 'es';
}

export function getAppLanguage() {
  const selected = localStorage.getItem(APP_LANGUAGE_KEY) || 'auto';
  return selected === 'auto' ? browserLanguage() : (STRINGS[selected] ? selected : 'es');
}

export function getAppLanguagePreference() {
  return localStorage.getItem(APP_LANGUAGE_KEY) || 'auto';
}

export function setAppLanguage(value = 'auto') {
  localStorage.setItem(APP_LANGUAGE_KEY, APP_LANGUAGES.some(item => item.code === value) ? value : 'auto');
}

export function getAppLocale() {
  return LOCALES[getAppLanguage()] || 'es-ES';
}

export function t(key, vars = {}) {
  const language = getAppLanguage();
  let value = STRINGS[language]?.[key] || STRINGS.es[key] || key;
  Object.entries(vars).forEach(([name, replacement]) => {
    value = value.replaceAll(`{${name}}`, String(replacement));
  });
  return value;
}

export function languageOptionsHTML(selected = getAppLanguagePreference()) {
  return APP_LANGUAGES.map(item => `<option value="${item.code}" ${item.code === selected ? 'selected' : ''}>${item.label}</option>`).join('');
}

export function applyAppTranslations(root = document) {
  const language = getAppLanguage();
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
  root.querySelectorAll?.('[data-i18n]').forEach(element => {
    const value = t(element.dataset.i18n);
    if (element.hasAttribute('aria-label')) element.setAttribute('aria-label', value);
    else element.textContent = value;
  });
  root.querySelectorAll?.('[data-i18n-aria]').forEach(element => {
    element.setAttribute('aria-label', t(element.dataset.i18nAria));
  });
  document.title = 'Oráculo Místico';
}

/* ============================================================
   V2 · Cadenas de la nueva carcasa
   La capa premium se había escrito solo en español: quien usara
   la app en otro idioma veía la portada a medias. Se añaden aquí
   y se fusionan con el diccionario, sin tocar lo ya traducido.
   ============================================================ */
const V2_STRINGS = {
  es: {
    omTagline: 'Las respuestas están más cerca de lo que imaginas.',
    omEnter: 'Entrar al Oráculo', omExplore: 'Explorar',
    omSanctuary: 'El Santuario', omSanctuaryTitle: 'Elige por dónde entrar',
    omSanctuarySub: 'Ocho caminos hacia la misma pregunta.',
    omTarotSub: '78 cartas, tiradas y ritual completo',
    omRunesSub: 'El Futhark antiguo, piedra a piedra',
    omMoonSub: 'Fase actual y su lectura simbólica',
    omDreamsSub: 'Escribe lo soñado y encuentra sus símbolos',
    omNumSub: 'Tu perfil numérico y la sinastría',
    omGrabovoiSub: 'Secuencias numéricas y cómo usarlas',
    omOracle: 'Consultar al Oráculo', omOracleSub: 'Conversación guiada, con voz si la quieres',
    omGrimoire: 'Mi Grimorio', omGrimoireSub: 'Tus lecturas guardadas y el diario',
    omNavHome: 'Inicio', omNavLibrary: 'Biblioteca', omNavProfile: 'Perfil',
    omGroupAppearance: 'Apariencia', omGroupOracle: 'Oráculo y voz',
    omGroupApp: 'Aplicación', omGroupAdvanced: 'Avanzado',
    omVoiceTitle: 'La Voz del Oráculo', omVoiceSub: 'Reproducir, pausar, silenciar y velocidad',
    omPanels: 'Paneles avanzados', omPanelsSub: 'Las herramientas de las versiones anteriores'
  },
  ca: {
    omTagline: 'Les respostes són més a prop del que imagines.',
    omEnter: 'Entra a l’Oracle', omExplore: 'Explorar',
    omSanctuary: 'El Santuari', omSanctuaryTitle: 'Tria per on entrar',
    omSanctuarySub: 'Vuit camins cap a la mateixa pregunta.',
    omTarotSub: '78 cartes, tirades i ritual complet',
    omRunesSub: 'El Futhark antic, pedra a pedra',
    omMoonSub: 'Fase actual i la seva lectura simbòlica',
    omDreamsSub: 'Escriu el que has somiat i troba’n els símbols',
    omNumSub: 'El teu perfil numèric i la sinastria',
    omGrabovoiSub: 'Seqüències numèriques i com fer-les servir',
    omOracle: 'Consultar l’Oracle', omOracleSub: 'Conversa guiada, amb veu si la vols',
    omGrimoire: 'El meu Grimori', omGrimoireSub: 'Les teves lectures desades i el diari',
    omNavHome: 'Inici', omNavLibrary: 'Biblioteca', omNavProfile: 'Perfil',
    omGroupAppearance: 'Aparença', omGroupOracle: 'Oracle i veu',
    omGroupApp: 'Aplicació', omGroupAdvanced: 'Avançat',
    omVoiceTitle: 'La Veu de l’Oracle', omVoiceSub: 'Reproduir, pausar, silenciar i velocitat',
    omPanels: 'Plafons avançats', omPanelsSub: 'Les eines de les versions anteriors'
  },
  en: {
    omTagline: 'The answers are closer than you think.',
    omEnter: 'Enter the Oracle', omExplore: 'Explore',
    omSanctuary: 'The Sanctuary', omSanctuaryTitle: 'Choose where to begin',
    omSanctuarySub: 'Eight paths to the same question.',
    omTarotSub: '78 cards, spreads and the full ritual',
    omRunesSub: 'The Elder Futhark, stone by stone',
    omMoonSub: 'Tonight’s phase and what it points to',
    omDreamsSub: 'Write your dream and find its symbols',
    omNumSub: 'Your number profile and synastry',
    omGrabovoiSub: 'Number sequences and how to use them',
    omOracle: 'Ask the Oracle', omOracleSub: 'A guided conversation, with voice if you want it',
    omGrimoire: 'My Grimoire', omGrimoireSub: 'Your saved readings and journal',
    omNavHome: 'Home', omNavLibrary: 'Library', omNavProfile: 'Profile',
    omGroupAppearance: 'Appearance', omGroupOracle: 'Oracle and voice',
    omGroupApp: 'App', omGroupAdvanced: 'Advanced',
    omVoiceTitle: 'The Voice of the Oracle', omVoiceSub: 'Play, pause, mute and speed',
    omPanels: 'Advanced panels', omPanelsSub: 'Tools from earlier versions'
  },
  fr: {
    omTagline: 'Les réponses sont plus proches que vous ne le pensez.',
    omEnter: 'Entrer dans l’Oracle', omExplore: 'Explorer',
    omSanctuary: 'Le Sanctuaire', omSanctuaryTitle: 'Choisissez par où entrer',
    omSanctuarySub: 'Huit chemins vers la même question.',
    omTarotSub: '78 cartes, tirages et rituel complet',
    omRunesSub: 'Le Futhark ancien, pierre après pierre',
    omMoonSub: 'La phase actuelle et sa lecture symbolique',
    omDreamsSub: 'Écrivez votre rêve et trouvez ses symboles',
    omNumSub: 'Votre profil numérique et la synastrie',
    omGrabovoiSub: 'Séquences numériques et leur usage',
    omOracle: 'Consulter l’Oracle', omOracleSub: 'Une conversation guidée, avec la voix si vous le souhaitez',
    omGrimoire: 'Mon Grimoire', omGrimoireSub: 'Vos lectures enregistrées et le journal',
    omNavHome: 'Accueil', omNavLibrary: 'Bibliothèque', omNavProfile: 'Profil',
    omGroupAppearance: 'Apparence', omGroupOracle: 'Oracle et voix',
    omGroupApp: 'Application', omGroupAdvanced: 'Avancé',
    omVoiceTitle: 'La Voix de l’Oracle', omVoiceSub: 'Lire, mettre en pause, couper le son et vitesse',
    omPanels: 'Panneaux avancés', omPanelsSub: 'Les outils des versions précédentes'
  },
  de: {
    omTagline: 'Die Antworten sind näher, als du denkst.',
    omEnter: 'Das Orakel betreten', omExplore: 'Erkunden',
    omSanctuary: 'Das Heiligtum', omSanctuaryTitle: 'Wähle deinen Eingang',
    omSanctuarySub: 'Acht Wege zur selben Frage.',
    omTarotSub: '78 Karten, Legungen und das ganze Ritual',
    omRunesSub: 'Das ältere Futhark, Stein für Stein',
    omMoonSub: 'Die aktuelle Phase und ihre Deutung',
    omDreamsSub: 'Schreib deinen Traum und finde seine Symbole',
    omNumSub: 'Dein Zahlenprofil und die Synastrie',
    omGrabovoiSub: 'Zahlenfolgen und ihre Anwendung',
    omOracle: 'Das Orakel befragen', omOracleSub: 'Ein geführtes Gespräch, auf Wunsch mit Stimme',
    omGrimoire: 'Mein Grimoire', omGrimoireSub: 'Deine gespeicherten Legungen und das Tagebuch',
    omNavHome: 'Start', omNavLibrary: 'Bibliothek', omNavProfile: 'Profil',
    omGroupAppearance: 'Erscheinungsbild', omGroupOracle: 'Orakel und Stimme',
    omGroupApp: 'App', omGroupAdvanced: 'Erweitert',
    omVoiceTitle: 'Die Stimme des Orakels', omVoiceSub: 'Abspielen, pausieren, stumm und Tempo',
    omPanels: 'Erweiterte Bereiche', omPanelsSub: 'Werkzeuge früherer Versionen'
  },
  zh: {
    omTagline: '答案比你想象的更近。',
    omEnter: '进入神谕', omExplore: '探索',
    omSanctuary: '圣所', omSanctuaryTitle: '选择你的入口',
    omSanctuarySub: '通往同一问题的八条路。',
    omTarotSub: '78 张牌、牌阵与完整仪式',
    omRunesSub: '古弗萨克文，一石一符',
    omMoonSub: '当前月相及其象征解读',
    omDreamsSub: '写下你的梦，找出其中的符号',
    omNumSub: '你的数字档案与合盘',
    omGrabovoiSub: '数字序列及其用法',
    omOracle: '请教神谕', omOracleSub: '引导式对话，可选语音',
    omGrimoire: '我的魔典', omGrimoireSub: '你保存的解读与日记',
    omNavHome: '首页', omNavLibrary: '书库', omNavProfile: '个人',
    omGroupAppearance: '外观', omGroupOracle: '神谕与语音',
    omGroupApp: '应用', omGroupAdvanced: '进阶',
    omVoiceTitle: '神谕之声', omVoiceSub: '播放、暂停、静音与语速',
    omPanels: '进阶面板', omPanelsSub: '早期版本的工具'
  }
};

Object.keys(V2_STRINGS).forEach(idioma => {
  if (STRINGS[idioma]) Object.assign(STRINGS[idioma], V2_STRINGS[idioma]);
});
