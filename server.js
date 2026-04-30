// eslint-disable-next-line no-undef
const express = require("express");
const app = express();

app.use(express.json());

app.get("/api/test", (req, res) => {
  res.json({ message: "API working 🚀" });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});