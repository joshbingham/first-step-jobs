const express = require("express");
const cors = require("cors");

const jobsRoutes = require("./routes/jobsRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use("/api/jobs", jobsRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});