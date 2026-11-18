const assert = require("node:assert/strict");
const matchVoiceOrder = require("./voiceOrderMatcher");
const menu = [
  { _id: "1", name: "Chicken Biryani", category: "Biryani", description: "Spiced rice", tags: [] },
  { _id: "2", name: "Masala Dosa", category: "South Indian", description: "Crispy dosa", tags: [] },
  { _id: "3", name: "Idli", category: "South Indian", description: "Steamed rice cakes", tags: [] },
  { _id: "4", name: "Paneer Butter Masala", category: "North Indian", description: "Paneer curry", tags: [] },
  { _id: "5", name: "Veg Fried Rice", category: "Chinese", description: "Vegetable rice", tags: [] },
  { _id: "6", name: "Coffee", category: "Beverages", description: "Hot coffee", tags: [] },
  { _id: "7", name: "Rava Dosa", category: "South Indian", description: "Crispy semolina dosa", tags: [] }
];
const cases = [
  ["2 chicken biryani", "Chicken Biryani", 2],
  ["சிக்கன் பிரியாணி", "Chicken Biryani", 1],
  ["दो चिकन बिरयानी", "Chicken Biryani", 2],
  ["ಎರಡು ಚಿಕನ್ ಬಿರಿಯಾನಿ", "Chicken Biryani", 2],
  ["రెండు చికెన్ బిర్యానీ", "Chicken Biryani", 2],
  ["രണ്ട് ചിക്കൻ ബിരിയാണി", "Chicken Biryani", 2],
  ["masala dosa", "Masala Dosa", 1],
  ["ರವ dosa", "Rava Dosa", 1],
  ["ರವಾ ದೋಸೆ", "Rava Dosa", 1],
  ["ரவா தோசை", "Rava Dosa", 1],
  ["ರವ ದೋಸೆ", "Rava Dosa", 1],
  ["రావా దోసె", "Rava Dosa", 1],
  ["रवा डोसा", "Rava Dosa", 1],
  ["ಎರಡು ರವ dosa", "Rava Dosa", 2],
  ["दो चिकन बिरयानी और तीन इडली", "Chicken Biryani", 2],
  ["இரண்டு சிக்கன் பிரியாணி மற்றும் மூன்று இட்லி", "Chicken Biryani", 2]
];
for (const [text, expectedName, expectedQuantity] of cases) {
  const result = matchVoiceOrder(text, menu);
  const hit = result.matches.find(x => x.menuItem.name === expectedName);
  assert.ok(hit, `Expected ${expectedName} for: ${text}; unmatched=${result.unmatched.join("|")}`);
  assert.equal(hit.quantity, expectedQuantity, `Unexpected quantity for: ${text}`);
}

const multiDishCases = [
  ["two chicken biryani one masala dosa three idli", [["Chicken Biryani", 2], ["Masala Dosa", 1], ["Idli", 3]]],
  ["ಎರಡು ಚಿಕನ್ ಬಿರಿಯಾನಿ ಒಂದು ಮಸಾಲೆ ದೋಸೆ ಮೂರು ಇಡ್ಲಿ", [["Chicken Biryani", 2], ["Masala Dosa", 1], ["Idli", 3]]],
  ["दो चिकन बिरयानी एक मसाला डोसा तीन इडली", [["Chicken Biryani", 2], ["Masala Dosa", 1], ["Idli", 3]]],
  ["சிக்கன் பிரியாணி இரண்டு மசாலா தோசை மூன்று இட்லி", [["Chicken Biryani", 1], ["Masala Dosa", 2], ["Idli", 3]]]
];
for (const [spoken, expected] of multiDishCases) {
  const result = matchVoiceOrder(spoken, menu);
  for (const [name, quantity] of expected) {
    const hit = result.matches.find(x => x.menuItem.name === name);
    assert.ok(hit, `Expected ${name} in multi-dish order: ${spoken}`);
    assert.equal(hit.quantity, quantity, `Wrong quantity for ${name} in: ${spoken}`);
  }
}
console.log(`Voice matcher tests passed: ${cases.length} single-dish cases and ${multiDishCases.length} multi-dish cases.`);
