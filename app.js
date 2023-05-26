const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB ERROR : ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDBObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API 1

app.get("/states/", async (request, response) => {
  const getStatesQuery = `select * from state order by state_id`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachObject) => convertDBObjectToResponseObject(eachObject))
  );
});

//API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `select * from state where state_id = ${stateId}`;
  const dbResponse = await db.get(getQuery);
  response.send(convertDBObjectToResponseObject(dbResponse));
});

//API 3
app.use(express.json());
app.post("/districts/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const insertQuery = `insert into district(district_name,state_id,cases,cured,active,deaths)
        values(
            '${districtName}',${stateId},${cases},${cured},${active},${deaths}
        )`;
  await db.run(insertQuery);
  response.send("District Successfully Added");
});

//API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `select * from district where district_id = ${districtId}`;
  const dbResponse = await db.get(getDistrictQuery);
  response.send(convertDBObjectToResponseObject(dbResponse));
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `delete from district where district_id = ${districtId}`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

//API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateQuery = `update district set
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    where district_id = ${districtId}`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statsQuery = `select 
        sum(cases),
        sum(cured),
        sum(active),
        sum(deaths) from district where state_id = ${stateId}`;
  const stats = await db.get(statsQuery);
  response.send({
    totalCases: stats["sum(cases"],
    totalCured: stats["sum(cured)"],
    totalActive: stats["sum(active"],
    totalDeaths: stats["sum(deaths)"],
  });
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await db.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
