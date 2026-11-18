# Cash on Delivery Demo Update

Updated `frontend/upi-payment.html` so sessions using Cash on Delivery show a dedicated cash-collection demo experience rather than a UPI QR flow.

- Cash-at-hand visual and COD-specific instructions
- Cash-to-collect / due-on-delivery summary
- Demo buttons relabeled for cash collection success or failure
- UPI QR workflow remains unchanged for UPI sessions
- Local fallback order records preserve the selected payment method

This is a UI/demo simulation only; it does not collect or verify real cash. Extract the ZIP and run the project using the existing start instructions.
