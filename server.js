const express = require('express');
const app = express();

app.get("/", (req, res) => {
  res.send("Bot aktif ağa!");
});

app.listen(3000, () => {
  console.log("Web sunucu aktif! (UptimeRobot çalışıyor)");
});
