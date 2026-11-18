# Group Order Cart → Checkout Update

- Group orders are initiated from the Cart page using **PLACE GROUP ORDER**.
- The Cart opens an in-page Order Summary box containing the cart items, quantities, line amounts, and total.
- The user chooses **Split Equal** or **Split by Item** inside that box.
- Continuing sends the user to `checkout.html` with the split method and cart summary preserved in local storage.
- Checkout displays the group summary and selected split method, then continues through the existing address and payment workflow.
- The selected split method is included in the validated order draft and stored as group-order metadata on the resulting order.
- No separate splitter page or splitter navigation option is needed for this workflow; the group chat page remains separate and chat-focused.

Validation performed: JavaScript syntax checks for the edited inline scripts and backend modules, plus ZIP archive integrity. Live MongoDB, browser, and payment-provider end-to-end testing was not performed in this environment.
