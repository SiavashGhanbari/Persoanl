/*
 * Zarpin gold purchase funnel.
 * PLACEHOLDER numbers: replace with real analytics (users reaching each step,
 * same-length windows before and after release), then set placeholder: false.
 * Every percentage on the site is computed from these counts.
 */
window.ZARPIN = {
  placeholder: true,
  steps: ["Started purchase", "Passed pre-invoice", "Paid at gateway", "Gold purchased"],
  before: [10000, 7700, 6600, 5800],
  after:  [10000, 8000, 6700, 6600],
};

(function () {
  const z = window.ZARPIN;
  const rate = (arr) => arr[arr.length - 1] / arr[0];
  z.successBefore = rate(z.before);
  z.successAfter = rate(z.after);
  z.liftPts = (z.successAfter - z.successBefore) * 100;          // percentage points
  z.liftRel = (z.successAfter / z.successBefore - 1) * 100;       // relative %
  // Users lost after paying (the "Complete purchase" trap)
  const lostAfterPay = (a) => (a[2] - a[3]) / a[2];
  z.paidNotBoughtBefore = lostAfterPay(z.before) * 100;
  z.paidNotBoughtAfter = lostAfterPay(z.after) * 100;
})();
