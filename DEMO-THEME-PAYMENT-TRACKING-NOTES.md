# Thrifty Bite: simplified theme, demo payment, and rider tracking

## Theme
- Account Settings now offers only Dark Theme and Light Theme.
- First visit after this preference version uses Dark Burgundy + Gold by default.
- The chosen option persists in local browser storage and is applied by `frontend/assets/theme-preference.js` on pages that load the shared script.

## Demo payment
- Card demo controls remain separate: Simulate Payment Success and Simulate Payment Failure.
- Confirmed server-side success opens the normal payment-success page.
- Confirmed server-side failure opens a red failure result screen.
- If the server cannot confirm the selected demo outcome, a browser-only fallback result is shown instead of leaving the user on a server error. A fallback success is saved only in local browser storage and is clearly labelled as not database-confirmed; it is not a real payment.

## Demo rider tracking
- Browser-only demo successes appear on Track Order with sample rider Arjun Kumar, sample phone/vehicle details, an animated scooter indicator, delivery milestones, and an 8–12 minute illustrative ETA.
- These rider details and ETA are fictional demo data. They are not live GPS, and are not proof of an actual delivery.
- Database-backed orders continue to use the existing `/api/order/my` workflow and periodic refresh.

## Validation performed
- `node --check` passed for all backend JavaScript files.
- Inline JavaScript syntax checks passed for all frontend HTML pages.
- `npm test` passed: 16 voice-order matcher cases.
- A live MongoDB/payment end-to-end test was not possible in this environment. Configure `backend/.env` and verify with your own database before presenting it as fully live.
