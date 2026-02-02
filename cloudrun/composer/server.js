import express from "express";

const app = express();
app.use(express.json());

// Main Entry Point for Service Mode (if needed) but JOB is preferred.
app.get("/health", (req, res) => {
  res.json({ status: "ok", mode: "composer-service" });
});

// Deprecate direct HTTP composition
app.post("/compose", (req, res) => {
  res.status(405).json({
    error: "Synchronous composition is disabled. Please use Cloud Run Jobs.",
    docs: "Trigger via gcloud beta run jobs execute or REST API."
  });
});

const port = Number(process.env.PORT || 8080);
app.listen(port, "0.0.0.0", () => console.log(`Composer Service (Healthcheck) on port ${port}`));
