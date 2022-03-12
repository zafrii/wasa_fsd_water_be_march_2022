const express = require("express");
var cors = require("cors");
const app = express();
const port = 8080;

app.use(cors());
app.get("/tiles/pipelines", (req, res) => {
  const pgp = require("pg-promise")(/* options */);

  res.status(200).send(process.env.DB_USERNAME);
  const db = pgp(
    `postgres://${process.env.DB_USERNAME}:${process.env.DB_AUTHENTICATION}@${process.env.HOST}:5432/${process.env.DB_NAME}`
  );
  console.log(req.query);
  const params = req.query;
  const query = `SELECT ST_AsMVT(q, 'pipelines', 4096, 'geom')
                  FROM (
                    SELECT gid, class,dia_inch,
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
