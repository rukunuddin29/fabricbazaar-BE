const express = require("express");
const app = express();
const config = require("./app/config/config");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const connectDB = require("./app/config/connectDB");

// Connect to MongoDB
connectDB();

// const corsOptions = {
//     origin: "*",
//     optionsSuccessStatus: 200,
// };

app.use(cors());
app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());
app.use(morgan("common"));
app.use("/api", router);

const routesPath = path.join(__dirname, "app/routes");
const routeFiles = fs.readdirSync(routesPath);

routeFiles.forEach((routeFile) => {
    if (routeFile !== "index.js" && routeFile.endsWith(".js")) {
        const routeModule = require(path.join(routesPath, routeFile));
        routeModule(router);
    }
});

app.get("/api/health", (req, res) => res.send({ msg: "Fabric Bazar Backend are running and lived at 17-02-2025 !" }));

app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
});
