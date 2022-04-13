const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
var cors = require("cors");
const app = express();
const port = process.env.PORT;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/tiles/pipelines", (req, res) => {
  const pgp = require("pg-promise")(/* options */);
  const db = pgp(process.env.DATABASE_URL);
  console.log(req.query);
  const params = req.query;
  const query = `SELECT ST_AsMVT(q, 'pipelines', 4096, 'geom')
                  FROM (
                    SELECT gid, class, dia_inch, diameter, depth, material, age, valve, condition, status, remarks, shape_leng, depth_feet, length,
                      ST_AsMvtGeom(
                        geom,
                        ST_TileEnvelope($1, $2, $3),
                        4096,
                        256,
                        true
                      ) AS geom
                    FROM pipelines
                    WHERE geom && ST_TileEnvelope($1, $2, $3)
                  ) AS q;`;
  db.one(query, [params.z, params.x, params.y])
    .then((data) => {
      res.status(200).send(data.st_asmvt);
      // res.send("Hello World!");
    })
    .catch((error) => {
      console.log("ERROR:", error);
    });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
