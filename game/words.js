// Every clip the games can say.
//   ur    – what the Urdu voice says (and what's shown on screen)
//   roman – transliteration shown under the Urdu word
//   hi    – same sound in Devanagari, only used if no Urdu voice is available
//           (the Mac's Hindi voice can read it; spoken Hindi ≈ spoken Urdu for these words)
// Keep this file valid JSON after the "window.WORDS = " prefix — the voice builder reads it.
window.WORDS = {
  "hello":      { "ur": "چلو کھیلیں!",   "roman": "chalo khelein!",  "hi": "चलो खेलें!" },
  "g_animals":  { "ur": "جانور!",        "roman": "jaanwar",         "hi": "जानवर!" },
  "g_balloons": { "ur": "غبارے!",        "roman": "ghubaare",        "hi": "ग़ुब्बारे!" },
  "g_counting": { "ur": "گنتی!",         "roman": "ginti",           "hi": "गिनती!" },

  "a_cat":      { "ur": "بلی!",          "roman": "billi",           "hi": "बिल्ली!" },
  "s_cat":      { "ur": "میاؤں، میاؤں!",  "roman": "miyaun miyaun",   "hi": "म्याऊँ, म्याऊँ!" },
  "a_dog":      { "ur": "کتا!",          "roman": "kutta",           "hi": "कुत्ता!" },
  "s_dog":      { "ur": "بھوں بھوں!",     "roman": "bhaun bhaun",     "hi": "भौं भौं!" },
  "a_cow":      { "ur": "گائے!",         "roman": "gaaye",           "hi": "गाय!" },
  "a_goat":     { "ur": "بکری!",         "roman": "bakri",           "hi": "बकरी!" },
  "s_goat":     { "ur": "میں میں!",       "roman": "mein mein",       "hi": "में में!" },
  "a_duck":     { "ur": "بطخ!",          "roman": "batakh",          "hi": "बत्तख़!" },
  "s_duck":     { "ur": "قیں قیں!",       "roman": "qain qain",       "hi": "क़ैं क़ैं!" },
  "a_rooster":  { "ur": "مرغا!",         "roman": "murgha",          "hi": "मुर्ग़ा!" },
  "s_rooster":  { "ur": "ککڑوں کوں!",     "roman": "kukrooN koon",    "hi": "कुकड़ूँ कूँ!" },
  "a_fish":     { "ur": "مچھلی!",        "roman": "machhli",         "hi": "मछली!" },
  "a_elephant": { "ur": "ہاتھی!",        "roman": "haathi",          "hi": "हाथी!" },
  "a_lion":     { "ur": "شیر!",          "roman": "sher",            "hi": "शेर!" },
  "a_frog":     { "ur": "مینڈک!",        "roman": "mendak",          "hi": "मेंढक!" },
  "s_frog":     { "ur": "ٹر ٹر!",         "roman": "tarr tarr",       "hi": "टर्र टर्र!" },
  "a_bird":     { "ur": "چڑیا!",         "roman": "chiriya",         "hi": "चिड़िया!" },
  "s_bird":     { "ur": "چوں چوں!",       "roman": "choon choon",     "hi": "चूँ चूँ!" },
  "a_rabbit":   { "ur": "خرگوش!",        "roman": "khargosh",        "hi": "ख़रगोश!" },

  "c_red":      { "ur": "لال غبارہ!",     "roman": "laal ghubaara",     "hi": "लाल ग़ुब्बारा!" },
  "c_blue":     { "ur": "نیلا غبارہ!",    "roman": "neela ghubaara",    "hi": "नीला ग़ुब्बारा!" },
  "c_yellow":   { "ur": "پیلا غبارہ!",    "roman": "peela ghubaara",    "hi": "पीला ग़ुब्बारा!" },
  "c_green":    { "ur": "ہرا غبارہ!",     "roman": "hara ghubaara",     "hi": "हरा ग़ुब्बारा!" },
  "c_orange":   { "ur": "نارنجی غبارہ!",  "roman": "naaranji ghubaara", "hi": "नारंजी ग़ुब्बारा!" },
  "c_pink":     { "ur": "گلابی غبارہ!",   "roman": "gulaabi ghubaara",  "hi": "गुलाबी ग़ुब्बारा!" },
  "c_purple":   { "ur": "جامنی غبارہ!",   "roman": "jaamni ghubaara",   "hi": "जामनी ग़ुब्बारा!" },
  "c_white":    { "ur": "سفید غبارہ!",    "roman": "safaid ghubaara",   "hi": "सफ़ेद ग़ुब्बारा!" },
  "c_black":    { "ur": "کالا غبارہ!",    "roman": "kaala ghubaara",    "hi": "काला ग़ुब्बारा!" },
  "c_brown":    { "ur": "بھورا غبارہ!",   "roman": "bhoora ghubaara",   "hi": "भूरा ग़ुब्बारा!" },

  "n1":  { "ur": "ایک!",  "roman": "ek",    "hi": "एक!" },
  "n2":  { "ur": "دو!",   "roman": "do",    "hi": "दो!" },
  "n3":  { "ur": "تین!",  "roman": "teen",  "hi": "तीन!" },
  "n4":  { "ur": "چار!",  "roman": "chaar", "hi": "चार!" },
  "n5":  { "ur": "پانچ!", "roman": "paanch","hi": "पाँच!" },
  "n6":  { "ur": "چھ!",   "roman": "chhe",  "hi": "छह!" },
  "n7":  { "ur": "سات!",  "roman": "saat",  "hi": "सात!" },
  "n8":  { "ur": "آٹھ!",  "roman": "aath",  "hi": "आठ!" },
  "n9":  { "ur": "نو!",   "roman": "nau",   "hi": "नौ!" },
  "n10": { "ur": "دس!",   "roman": "das",   "hi": "दस!" },

  "f_apples": { "ur": "دس سیب! شاباش!",       "roman": "das seb — shaabaash!",        "hi": "दस सेब! शाबाश!" },
  "f_stars":  { "ur": "دس ستارے! شاباش!",     "roman": "das sitaare — shaabaash!",    "hi": "दस सितारे! शाबाश!" },
  "f_fish":   { "ur": "دس مچھلیاں! شاباش!",   "roman": "das machhliyaan — shaabaash!","hi": "दस मछलियाँ! शाबाश!" }
};
