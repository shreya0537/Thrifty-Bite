const WORD_NUMBERS = {
  a:1, an:1, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10,
  ek:1, eka:1, do:2, teen:3, char:4, paanch:5, chhah:6, saat:7, aath:8, nau:9, das:10,
  ondu:1, ondhu:1, eradu:2, yeradu:2, mooru:3, naalku:4, aidu:5, aaru:6, elu:7, entu:8,
  oka:1, okati:1, rendu:2, moodu:3, naalugu:4, aidu:5, aaru:6, edu:7, enimidi:8, tommidi:9, padi:10,
  onnu:1, oru:1, randu:2, moonnu:3, naalu:4, anchu:5, aaru:6, ezhu:7, ettu:8, onpathu:9, pathu:10,
  couple:2, few:3, thri:3, ஒரு:1, ஒன்று:1, இரண்டு:2, ரெண்டு:2, மூன்று:3, நான்கு:4, ஐந்து:5, ஆறு:6, ஏழு:7, எட்டு:8, ஒன்பது:9, பத்து:10,
  एक:1, दो:2, तीन:3, चार:4, पांच:5, पाँच:5, छह:6, सात:7, आठ:8, नौ:9, दस:10, ಒಂದು:1, ಎರಡು:2, ಮೂರು:3, నాలుగు:4, ఐదు:5,
  ഒന്ന്:1, ഒരു:1, രണ്ട്:2, മൂന്ന്:3, നാല്:4, അഞ്ച്:5, ആറ്:6, ഏഴ്:7, എട്ട്:8, ഒമ്പത്:9, പത്ത്:10
};
const STOP_WORDS = new Set(["and","also","plus","with","the","a","an","some","please","of","i","want","would","like","order","get","me","can","you","give","to","add","need","for","ஒரு","வேண்டும்","தரவும்","கொடு","கொடுங்கள்","வேணும்","மற்றும்","எனக்கு","और","चाहिए","देना","दो","मुझे","एक","खाना","ಮತ್ತು","ಬೇಕು","ಕೊಡಿ","ಕೊಡು","ನನಗೆ","ಒಂದು","ಮತ್ತು","మరియు","కావాలి","ఇవ్వండి","నాకు","ఒక","వేయండి","വേണം","തരൂ","എനിക്ക്","ഒന്ന്","nanage","nanaku","naaku","beku","kodi","kodu","ondu","mattu","hagu","enikku","venam","tharu","oru","vendum","enakku","kodunga","kodu","mujhe","chahiye","dena","ek","ekam","neeku","kavali","ivvandi","oka","okati","naku"]);

// Lightweight Indic transliteration lets menu matching work when speech recognition returns
// a dish modifier/name in native script (for example Kannada "ರವ dosa" -> "rava dosa").
// Food vocabulary aliases below still handle words whose transliteration differs from English.
const INDIC_SCRIPTS = [
  { // Devanagari
    chars:"कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहक़ख़ग़ज़ड़ढ़फ़",
    values:["k","kh","g","gh","ng","ch","chh","j","jh","ny","t","th","d","dh","n","t","th","d","dh","n","p","ph","b","bh","m","y","r","l","v","sh","sh","s","h","q","kh","gh","z","r","rh","f"],
    vowels:{"अ":"a","आ":"aa","इ":"i","ई":"ee","उ":"u","ऊ":"oo","ऋ":"ri","ए":"e","ऐ":"ai","ओ":"o","औ":"au"},
    signs:{"ा":"aa","ि":"i","ी":"ee","ु":"u","ू":"oo","ृ":"ri","े":"e","ै":"ai","ो":"o","ौ":"au","ॅ":"e","ॉ":"o"}, virama:"्", anusvara:"ं", visarga:"ः"
  },
  { // Tamil
    chars:"கஙசஞடணதநபமயரலவழளறனஜஷஸஹ",
    values:["k","ng","ch","ny","t","n","th","n","p","m","y","r","l","v","zh","l","r","n","j","sh","s","h"],
    vowels:{"அ":"a","ஆ":"aa","இ":"i","ஈ":"ee","உ":"u","ஊ":"oo","எ":"e","ஏ":"e","ஐ":"ai","ஒ":"o","ஓ":"o","ஔ":"au"},
    signs:{"ா":"aa","ி":"i","ீ":"ee","ு":"u","ூ":"oo","ெ":"e","ே":"e","ை":"ai","ொ":"o","ோ":"o","ௌ":"au"}, virama:"்", anusvara:"ஂ", visarga:"ஃ"
  },
  { // Kannada
    chars:"ಕಖಗಘಙಚಛಜಝಞಟಠಡಢಣತಥದಧನಪಫಬಭಮಯರಲವಶಷಸಹಳಱ",
    values:["k","kh","g","gh","ng","ch","chh","j","jh","ny","t","th","d","dh","n","t","th","d","dh","n","p","ph","b","bh","m","y","r","l","v","sh","sh","s","h","l","r"],
    vowels:{"ಅ":"a","ಆ":"aa","ಇ":"i","ಈ":"ee","ಉ":"u","ಊ":"oo","ಋ":"ri","ಎ":"e","ಏ":"e","ಐ":"ai","ಒ":"o","ಓ":"o","ಔ":"au"},
    signs:{"ಾ":"aa","ಿ":"i","ೀ":"ee","ು":"u","ೂ":"oo","ೃ":"ri","ೆ":"e","ೇ":"e","ೈ":"ai","ೊ":"o","ೋ":"o","ೌ":"au"}, virama:"್", anusvara:"ಂ", visarga:"ಃ"
  },
  { // Telugu
    chars:"కఖగఘఙచఛజఝఞటఠడఢణతథదధనపఫబభమయరలవశషసహళ",
    values:["k","kh","g","gh","ng","ch","chh","j","jh","ny","t","th","d","dh","n","t","th","d","dh","n","p","ph","b","bh","m","y","r","l","v","sh","sh","s","h","l"],
    vowels:{"అ":"a","ఆ":"aa","ఇ":"i","ఈ":"ee","ఉ":"u","ఊ":"oo","ఋ":"ri","ఎ":"e","ఏ":"e","ఐ":"ai","ఒ":"o","ఓ":"o","ఔ":"au"},
    signs:{"ా":"aa","ి":"i","ీ":"ee","ు":"u","ూ":"oo","ృ":"ri","ె":"e","ే":"e","ై":"ai","ొ":"o","ో":"o","ౌ":"au"}, virama:"్", anusvara:"ం", visarga:"ః"
  },
  { // Malayalam
    chars:"കഖഗഘങചഛജഝഞടഠഡഢണതഥദധനപഫബഭമയരലവശഷസഹളഴറ",
    values:["k","kh","g","gh","ng","ch","chh","j","jh","ny","t","th","d","dh","n","th","th","d","dh","n","p","ph","b","bh","m","y","r","l","v","sh","sh","s","h","l","zh","r"],
    vowels:{"അ":"a","ആ":"aa","ഇ":"i","ഈ":"ee","ഉ":"u","ഊ":"oo","ഋ":"ri","എ":"e","ഏ":"e","ഐ":"ai","ഒ":"o","ഓ":"o","ഔ":"au"},
    signs:{"ാ":"aa","ി":"i","ീ":"ee","ു":"u","ൂ":"oo","ൃ":"ri","െ":"e","േ":"e","ൈ":"ai","ൊ":"o","ോ":"o","ൗ":"au"}, virama:"്", anusvara:"ം", visarga:"ഃ"
  }
];
function transliterateIndic(input) {
  let out = "";
  const chars = Array.from(String(input || ""));
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    let handled = false;
    for (const script of INDIC_SCRIPTS) {
      if (script.vowels[ch]) { out += script.vowels[ch]; handled = true; break; }
      const consonantIndex = Array.from(script.chars).indexOf(ch);
      if (consonantIndex !== -1) {
        out += script.values[consonantIndex];
        // A consonant carries an inherent "a" unless a vowel sign or virama follows.
        const next = chars[i + 1];
        if (next && script.signs[next]) { out += script.signs[next]; i++; }
        else if (next === script.virama) { i++; }
        else if (next === "\u200d" || next === "\u200c") { i++; }
        else out += "a";
        handled = true; break;
      }
      if (script.signs[ch]) { out += script.signs[ch]; handled = true; break; }
      if (ch === script.virama) { handled = true; break; }
      if (ch === script.anusvara) { out += "n"; handled = true; break; }
      if (ch === script.visarga) { out += "h"; handled = true; break; }
    }
    if (!handled) out += ch;
  }
  return out;
}

// Common spoken dish words in supported Indian languages. These normalize native-script speech
// to the English menu vocabulary; matching still only returns dishes that exist in MongoDB.
const ALIASES = [
  [/சிக்கன்|चिकन|ಚಿಕನ್|చికెన్|ചിക്കൻ|கோழி|मुर्गा|मुर्गी|ಕೋಳಿ|కోడి|കോഴി/gu,"chicken"],
  [/பிரியாணி|बिरयानी|ಬಿರಿಯானி|బిర్యానీ|ബിരിയാണി|பிரியாணி|ಬಿರಿಯಾನಿ/gu,"biryani"],
  [/மட்டன்|मटन|ಮಟನ್|మటన్|മട്ടൻ/gu,"mutton"],
  [/மசாலா தோசை|मसाला डोसा|ಮಸಾಲೆ ದೋಸೆ|మసాలా దోసె|മസാല ദോശ/gu,"masala dosa"],
  [/தோசை|डोसा|ದೋಸೆ|దోసె|ദോശ/gu,"dosa"],
  [/இட்லி|इडली|ಇಡ್ಲಿ|ఇడ్లీ|ഇഡലി/gu,"idli"],
  [/பன்னீர்|पनीर|ಪನೀರ್|పనీర్|പനീർ/gu,"paneer"],
  [/வெண்ணெய் கோழி|बटर चिकन|ಬೆಣ್ಣೆ ಕೋಳಿ|బటర్ చికెన్|ബട്ടർ ചിക്കൻ/gu,"butter chicken"],
  [/சப்பாத்தி|चपाती|ಚಪಾತಿ|చపాతి|ചപ്പാത്തി/gu,"chapati"],
  [/பரோட்டா|पराठा|ಪರೋಟಾ|పరోటా|പറോട്ട/gu,"parotta"],
  [/பாஸ்தா|पास्ता|ಪಾಸ್ತಾ|పాస్తా|പാസ്ത/gu,"pasta"],
  [/பிரைஸ்|राइस|ಅನ್ನ|రైస్|റൈസ്/gu,"rice"],
  [/சூப்|सूप|ಸೂಪ್|సూప్|സൂപ്പ്/gu,"soup"],
  [/வெஜ்|सब्जी|ಸಸ್ಯಾಹಾರಿ|వెజ్|വെജ്/gu,"veg"],
  [/ஃப்ரைட் ரைஸ்|फ्राइड राइस|ಫ್ರೈಡ್ ರೈಸ್|ఫ్రైಡ್ రైస్|ഫ്രൈഡ് റൈസ്/gu,"fried rice"],
  [/நூடுல்ஸ்|नूडल्स|ನೂಡಲ್ಸ್|నూడుల్స్|നൂഡിൽസ്/gu,"noodles"],
  [/பர்கர்|बर्गर|ಬರ್ಗರ್|బర్గర్|ബർഗർ/gu,"burger"],
  [/பீட்சா|पिज्जा|ಪಿಜ್ಜಾ|పిజ్జా|പിസ്സ/gu,"pizza"],
  [/தேநீர்|चाय|ಚಹಾ|టీ|ചായ/gu,"tea"],
  [/காபி|कॉफी|ಕಾಫಿ|కాఫీ|കാപ്പി/gu,"coffee"],
  [/தண்ணீர்|पानी|ನೀರು|నీళ్లు|വെള്ളം/gu,"water"],
  [/ஜூஸ்|जूस|ಜ್ಯೂಸ್|జ్యూస్|ജ്യൂസ്/gu,"juice"],
  [/சாதம்|चावल|ಅನ್ನ|అన్నం|ചോറ്/gu,"rice"],
  [/கிரில்|ग्रिल|ಗ್ರಿಲ್|గ్రిల్|ഗ്രിൽ/gu,"grilled"],
  [/ஐஸ்கிரீம்|आइसक्रीम|ಐಸ್ ಕ್ರೀಮ್|ఐస్ క్రీమ్|ഐസ്ക്രീം/gu,"ice cream"]
];
function normalize(text) {
  let value = String(text || "").toLocaleLowerCase().normalize("NFKC");
  // Convert standalone spoken quantity words before dish aliases are normalized.
  // Whitespace boundaries are used because JavaScript \b is unreliable for Indian scripts.
  const quantityAliases = [
    [/એક|एक|ஒரு|ஒன்று|ಒಂದು|ఒక|ఒకటి|ഒരു|ഒന്ന്/gu, "one"],
    [/બે|दो|రెండు|రెండు|ಎರಡು|రెండు|രണ്ട്|രണ്ടു|இரண்டு|ரெண்டு/gu, "two"],
    [/तीन|மூன்று|ಮೂರು|మూడు|മൂന്ന്/gu, "three"],
    [/चार|நான்கு|ನಾಲ್ಕು|నాలుగు|നാല്/gu, "four"],
    [/पांच|पाँच|ஐந்து|ಐದು|ఐదు|അഞ്ച്/gu, "five"]
  ];
  for (const [pattern, replacement] of quantityAliases) {
    value = value.replace(pattern, (match, offset, whole) => {
      const before = whole[offset - 1];
      const after = whole[offset + match.length];
      return (offset === 0 || /\s/.test(before)) && (after === undefined || /\s/.test(after)) ? replacement : match;
    });
  }
  for (const [pattern, replacement] of ALIASES) value = value.replace(pattern, ` ${replacement} `);
  value = transliterateIndic(value).replace(/aa/g, "a").replace(/ee/g, "i").replace(/oo/g, "u");
  return value.replace(/[^\p{L}\p{N}\s.-]/gu," ").replace(/\s+/g," ").trim();
}
function splitIntoClauses(text) {
  // Native-language conjunctions plus common English separators.
  const parts = String(text || "").toLocaleLowerCase().normalize("NFKC")
    .split(/,|\band\b|\bplus\b|\balso\b|மற்றும்|மற்றும்|மற்றும்|और|ಮತ್ತು|ಹಾಗೂ|మరియు|మరియు|പിന്നെ|കൂടാതെ/gu)
    .map(x => normalize(x).trim()).filter(Boolean);
  return parts.map(raw=>{
    const words=raw.split(/\s+/).filter(Boolean); let quantity=1;
    if(words.length && /^\d+$/.test(words[0])) quantity=Math.min(20,parseInt(words.shift(),10));
    else if(words.length && WORD_NUMBERS[words[0]]!==undefined) quantity=WORD_NUMBERS[words.shift()];
    const phrase=words.filter(w=>!STOP_WORDS.has(w)).join(" ").trim();
    return {quantity,phrase,raw};
  }).filter(c=>c.phrase);
}
function levenshtein(a,b) {
  if(a===b)return 0;if(!a)return b.length;if(!b)return a.length;
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){const cur=[i];for(let j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=cur;}return prev[b.length];
}
function scoreItem(item, phrase) {
  const name=normalize([item.name,item.category,item.description||"",...(item.tags||[])].join(" "));
  const query=normalize(phrase);
  if(!query)return 0;
  if(name.includes(query))return 100+query.length;
  const q=query.split(/\s+/).filter(w=>w.length>1), n=name.split(/\s+/);
  let score=0, hits=0;
  for(const word of q){
    let best=0;
    for(const nw of n){
      if(nw===word)best=Math.max(best,3);
      else if(nw.startsWith(word)||word.startsWith(nw))best=Math.max(best,2);
      else if(Math.min(word.length,nw.length)>=4 && levenshtein(word,nw)<=1)best=Math.max(best,1.5);
    }
    if(best){hits++;score+=best;}
  }
  // Require meaningful coverage to avoid matching unrelated food on a single generic word.
  return score * (hits/Math.max(q.length,1));
}
function extractImplicitMenuMatches(text, menuItems) {
  // A user may speak a list without pauses/conjunctions, e.g. "two biryani one dosa three idli".
  // Scan the normalized transcript for exact menu-name spans, preferring the longest dish name.
  // This fallback is deliberately exact so unrelated words cannot trigger an accidental order.
  const tokens = normalize(text).split(/\s+/).filter(Boolean);
  const menuNames = menuItems.map(item => ({
    item,
    tokens: normalize(item.name || "").split(/\s+/).filter(Boolean)
  })).filter(x => x.tokens.length);
  const matches = [];
  const consumed = new Set();
  const quantityWords = new Set(Object.keys(WORD_NUMBERS));
  const separators = new Set(["and", "also", "plus", "with", "then", "please", "order", "get", "me", "add"]);

  for (let i = 0; i < tokens.length;) {
    const candidates = menuNames.filter(entry =>
      entry.tokens.every((token, offset) => tokens[i + offset] === token)
    ).sort((a, b) => b.tokens.length - a.tokens.length);

    if (!candidates.length) { i++; continue; }

    const chosen = candidates[0];
    let quantity = 1;
    let q = i - 1;
    while (q >= 0 && separators.has(tokens[q])) q--;
    if (q >= 0 && /^\d+$/.test(tokens[q])) quantity = Math.max(1, Math.min(20, Number(tokens[q])));
    else if (q >= 0 && WORD_NUMBERS[tokens[q]] !== undefined) quantity = WORD_NUMBERS[tokens[q]];

    const start = i;
    const end = i + chosen.tokens.length;
    for (let j = start; j < end; j++) consumed.add(j);
    if (q >= 0 && (quantityWords.has(tokens[q]) || /^\d+$/.test(tokens[q]))) consumed.add(q);
    matches.push({
      menuItem: chosen.item,
      quantity,
      phrase: tokens.slice(Math.max(0, q), end).join(" "),
      confidence: 1
    });
    i = end;
  }

  if (matches.length < 2) return null;
  const unmatchedWords = tokens.filter((token, index) =>
    !consumed.has(index) && !STOP_WORDS.has(token) && !separators.has(token) &&
    !quantityWords.has(token) && !/^\d+$/.test(token)
  );
  return { matches, unmatched: unmatchedWords.length ? [unmatchedWords.join(" ")] : [] };
}

function matchVoiceOrder(text, menuItems) {
  const matches=[], unmatched=[];
  for(const clause of splitIntoClauses(text)){
    let best=null,bestScore=0,second=0;
    for(const item of menuItems){const score=scoreItem(item,clause.phrase);if(score>bestScore){second=bestScore;bestScore=score;best=item;}else if(score>second)second=score;}
    // Exact/strong matches only; uncertain phrases stay unmatched rather than adding wrong food.
    const words=normalize(clause.phrase).split(/\s+/).filter(Boolean);
    const threshold=words.length===1?3:4;
    if(best && bestScore>=threshold && (bestScore-second>=0.5 || bestScore>=100))
      matches.push({menuItem:best,quantity:clause.quantity,phrase:clause.raw,confidence:Math.min(1,bestScore/(words.length*3))});
    else unmatched.push(clause.raw);
  }
  // Use menu-name span extraction when the speech contains multiple dishes in one unseparated phrase.
  // Keep normal clause matching as the primary path for language aliases and fuzzy speech recognition.
  if (matches.length < 2) {
    const implicit = extractImplicitMenuMatches(text, menuItems);
    if (implicit) return implicit;
  }
  return {matches,unmatched};
}
module.exports=matchVoiceOrder;
