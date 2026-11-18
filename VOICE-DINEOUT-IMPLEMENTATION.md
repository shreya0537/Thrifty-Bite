# Voice Ordering and Dine Out changes

## Voice ordering
- Uses the selected Web Speech API locale (`en-IN`, `ta-IN`, `hi-IN`, `kn-IN`, `te-IN`, `ml-IN`).
- Expands native-language dish aliases, quantities, and polite filler handling in `backend/utils/voiceOrderMatcher.js`.
- Matches only available menu items from MongoDB. The browser transcript and available menu still determine recognition quality; use Chrome and grant microphone access.
- Adding matches requires a signed-in user and writes each item through `/api/cart`; the page only redirects after successful API responses.

## Dine Out
- `frontend/dineout.html` includes searchable cafe cards with representative cafe photos, neighbourhood, indicative spend/person, menu/details links and Google Maps search links. Choosing a card pre-fills the table request.
- Submitting a request requires sign-in and posts to `/api/dineout`; the existing authenticated route stores the request in MongoDB. A request is not a confirmed reservation.
- Price ranges are indicative and may change. Confirm exact menu prices and table availability with each cafe. Cafe images are representative ambience photos, not guaranteed photos of the named venue.

## Run and test
1. Configure `backend/.env` from `.env.example` with your MongoDB Atlas URI and JWT secret.
2. From `backend`, run `npm install` then `npm run dev`.
3. Open the site through `http://localhost:5500/` (do not open HTML pages as `file://`).
4. Sign in, open Voice Ordering, choose a language, speak a dish that exists in the loaded menu, confirm the transcript and test the cart.
5. Open Dine Out, choose a cafe, select a future date/time, submit, and verify the request appears under Your dine-out plans.

## Multilingual voice matching update

Voice-order matching now transliterates native-script dish text from Devanagari, Tamil, Kannada, Telugu, and Malayalam into a normalized phonetic form before comparing it with available MongoDB menu items. Existing food aliases still normalize common local-language dish words; matching remains constrained to available menu records and uses the real menu item ID for cart persistence. Long-vowel spelling differences are normalized, and the voice-cart save path guards against duplicate concurrent submissions. Automated matcher tests include mixed-script and native-script Rava Dosa examples.

## Multi-dish voice-order enhancement
- Voice matching also recognizes consecutive menu names in one utterance even when the user omits pauses or conjunctions, for example: "two chicken biryani one masala dosa three idli".
- The matcher scans for exact normalized menu-name spans and prioritizes longer dish names. Quantity words are applied to the matching dish; unmatched words are reported rather than being added as food.
- Automated coverage includes consecutive multi-dish orders in English, Kannada, Hindi, and Tamil, alongside the existing native-script aliases.
- On successful match, the Voice page sends each matched menu item ID and quantity to the authenticated `/api/cart` endpoint. It redirects to `cart.html` only after all cart writes succeed. Voice recognition depends on the browser's speech-recognition support and its selected locale; Chrome with microphone permission is recommended.
