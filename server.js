const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

// ROUTES
app.use("/api/auth", require("./routes/auth"));
app.use("/api/ai", require("./routes/ai"));

app.get("/", (req, res) => {
  res.send("Backend running successfully");
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
