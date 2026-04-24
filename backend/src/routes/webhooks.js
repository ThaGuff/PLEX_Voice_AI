const router = require('express').Router();
// Generic inbound webhook for Make.com / GHL events
router.post('/ghl', async (req, res) => {
  console.log('[Webhook GHL]', req.body);
  res.json({ received: true });
});
module.exports = router;
