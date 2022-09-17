import "dotenv/config";
import { default as request } from "supertest";
import Knex from "knex";
import { createClient } from "redis";
import fetch from "node-fetch";
import fs from "fs-extra";
import app from "./app.js";
import { MilvusClient } from "@zilliz/milvus2-sdk-node";

const {
  SOLA_DB_HOST,
  SOLA_DB_PORT,
  SOLA_DB_USER,
  SOLA_DB_PWD,
  SOLA_DB_NAME,
  SOLA_SOLR_LIST,
  TRACE_ALGO,
  REDIS_HOST,
  REDIS_PORT,
  MILVUS_URL,
} = process.env;

beforeAll(async () => {
  app.locals.redis = createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
  });
  await app.locals.redis.connect();
  // await app.locals.redis.flushAll();

  app.locals.knex = Knex({
    client: "mysql",
    connection: {
      host: SOLA_DB_HOST,
      port: SOLA_DB_PORT,
      user: SOLA_DB_USER,
      password: SOLA_DB_PWD,
      database: SOLA_DB_NAME,
      multipleStatements: true,
    },
  });
  await app.locals.knex("user").where("email", "test@trace.moe").del();
  await app.locals.knex("user").insert({
    id: 100,
    email: "user@trace.moe",
    password: "password",
    api_key: "OwOPRvfpSg5kw1Gjww33ahbA3tEnu0DnseOIcHJt3g",
    tier: 1,
    notes: "Test Account",
  });
  app.locals.apiKeyTier0 = "OwOPRvfpSg5kw1Gjww33ahbA3tEnu0DnseOIcHJt3g";
  await app.locals.knex("user").insert({
    id: 1000,
    email: "user@trace.moe",
    password: "password",
    api_key: "OwOPRvfpSg5kw1Gjww33ahbA3tEnu0DnseOIcHJt4g",
    tier: 1,
    notes: "Test Account",
  });
  app.locals.apiKeyTier1 = "OwOPRvfpSg5kw1Gjww33ahbA3tEnu0DnseOIcHJt4g";
  await app.locals.knex("user").insert({
    id: 1001,
    email: "test@trace.moe",
    password: "password",
    api_key: "OwOPRvfpSg5kw1Gjww33ahbA3tEnu0DnseOIcHJt5g",
    tier: 9,
    notes: "Test Account",
  });
  app.locals.apiKeyTier9 = "OwOPRvfpSg5kw1Gjww33ahbA3tEnu0DnseOIcHJt5g";
  await fetch(`${SOLA_SOLR_LIST}${TRACE_ALGO}_0/update?wt=json&commit=true`, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body: '<add><doc><field name="id">21034/Gochuumon wa Usagi Desuka 2 - 01 (BD 1280x720 x264 AAC).mp4/278.5000</field><field name="cl_hi">FQYdEg4VDQcLFg8NDw0WEBQTEBEQEQ4iEBAREQwlEBAOEBA=</field><field name="cl_ha">3eb d3c 20c 736 9d9 317 649 91a 582 db5 c5f c01 6af ccf 44f 96d 5f 26 b8b ed2 6a8 18d 369 59f bc5 b78 ac3 f9 44d d15 c9b 155 1d8 26f 3b3 11a 4cd 331 603 43d 1fb ed1 2c7 446 b92 ee6 848 c6e 8ec 85f 409 b9e aa 7b6 901 9f9 96f c28 d52 2bb 7f2 96c 561 a44 6ae e38 7a9 590 503 5eb c30 da1 632 16c f83 dbd 152 2ea 5f ac1 c2c 4cf aee f21 357 a02 9e 3a0 419 827 c1 a67 65d d2a 9a5 84b a05 d75 f78 c30</field></doc></add>',
  });
  await fetch(`${SOLA_SOLR_LIST}${TRACE_ALGO}_0/update?wt=json&commit=true`, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body: '<add><doc><field name="id">21034/Gochuumon wa Usagi Desuka 2 - 01 (BD 1280x720 x264 AAC).mp4/279.5000</field><field name="cl_hi">FQYdEg4VDQcLFg8NDw0WEBQTEBEQEQ4iEBAREQwlEBAOEBA=</field><field name="cl_ha">3eb d3c 20c 736 9d9 317 649 91a 582 db5 c5f c01 6af ccf 44f 96d 5f 26 b8b ed2 6a8 18d 369 59f bc5 b78 ac3 f9 44d d15 c9b 155 1d8 26f 3b3 11a 4cd 331 603 43d 1fb ed1 2c7 446 b92 ee6 848 c6e 8ec 85f 409 b9e aa 7b6 901 9f9 96f c28 d52 2bb 7f2 96c 561 a44 6ae e38 7a9 590 503 5eb c30 da1 632 16c f83 dbd 152 2ea 5f ac1 c2c 4cf aee f21 357 a02 9e 3a0 419 827 c1 a67 65d d2a 9a5 84b a05 d75 f78 c30</field></doc></add>',
  });

  console.log("initializeAndInsertMilvusCollection begins");

  try {
    const milvusClient = new MilvusClient(MILVUS_URL);

    const params = {
      collection_name: "trace_moe",
      description: "Trace.moe Index Data Collection",
      fields: [
        {
          name: "cl_ha",
          description: "Dynamic fields for LIRE Solr",
          data_type: 101, // DataType.FloatVector
          type_params: {
            dim: "100",
          },
        },
        // {
        //   name: "cl_hi",
        //   data_type: 21, //DataType.VARCHAR
        //   type_params: {
        //     max_length: "200",
        //   },
        //   description: "Metric Spaces Indexing",
        // },
        {
          name: "id",
          data_type: 21, //DataType.VARCHAR
          type_params: {
            max_length: "500",
          },
          description: "${anilistID}/${fileName}/${time}",
        },
        {
          name: "primary_key",
          data_type: 5, //DataType.Int64
          is_primary_key: true,
          description: "Primary Key",
        },
      ],
    };

    await milvusClient.collectionManager.releaseCollection({ collection_name: "trace_moe" });

    await milvusClient.collectionManager.createCollection(params);

    await milvusClient.dataManager.insert({
      collection_name: "trace_moe",
      fields_data: [
        {
          id: `21034/Gochuumon wa Usagi Desuka 2 - 01 (BD 1280x720 x264 AAC).mp4/278.5000`,
          cl_ha: [
            0.04454241181307504, 0.15045831627387662, 0.02327041255239414, 0.08197935414450302,
            0.11195555352020158, 0.03512766474989268, 0.0714543774748133, 0.1034733993264854,
            0.06261694980701477, 0.15583182756937222, 0.1405994773680913, 0.13646942323188396,
            0.0745630203730339, 0.14561771518950456, 0.04898333023910446, 0.10715936162008981,
            0.0042188725047279454, 0.0016875490018911782, 0.13122913948916926, 0.0775384357184736,
            0.07567324997954125, 0.017586036967076488, 0.027400466688601497, 0.06381599778204271,
            0.1338048721762663, 0.13038536498822365, 0.12234730263711041, 0.011057886880813246,
            0.04889451187058387, 0.14872635808772514, 0.14330843760796927, 0.015143531832760309,
            0.020961134970858844, 0.027622512609902967, 0.04205549749449857, 0.01536557775406178,
            0.054578887455901524, 0.03628230354066033, 0.06834573457659271, 0.048183964922419165,
            0.02251545641996914, 0.16844403589929574, 0.03157493000906915, 0.048583647580761814,
            0.1315400037789913, 0.16937662876876192, 0.09414747063182362, 0.14131002431625603,
            0.10143057685051186, 0.10227435135145745, 0.04587468734088387, 0.13207291399011484,
            0.007549561324250008, 0.08766372972982067, 0.10236316971997804, 0.11337664741653099,
            0.1072481799886104, 0.13820138141803542, 0.1514353183276031, 0.030686746323863267,
            0.09032828078543832, 0.10711495243582951, 0.06115144672642506, 0.11670733623605306,
            0.07593970508510302, 0.16164943070747076, 0.08708641033443686, 0.05186992721602358,
            0.05697698340595741, 0.06727991415434566, 0.13855665489211777, 0.15494364388416632,
            0.08180171740746184, 0.016164943070747076, 0.1763488706976281, 0.15618710104345457,
            0.015010304279979427, 0.033129251458179444, 0.0042188725047279454, 0.12225848426858983,
            0.1383790181550766, 0.05466770582442211, 0.12425689756030306, 0.17199677064011928,
            0.03796985254255151, 0.11377633007487364, 0.007016651113126477, 0.04121172299355298,
            0.04658523428904857, 0.09268196755123391, 0.008570972562236772, 0.11817283931664277,
            0.07234256116001919, 0.15036949790535603, 0.10964627593866628, 0.1056494493552398,
            0.11390955762765452, 0.15298963977671337, 0.17586036967076488, 0.13855665489211777,
          ],
          primary_key: 3694,
        },
        {
          id: `21034/Gochuumon wa Usagi Desuka 2 - 01 (BD 1280x720 x264 AAC).mp4/279.5000`,
          cl_ha: [
            0.04454241181307504, 0.15045831627387662, 0.02327041255239414, 0.08197935414450302,
            0.11195555352020158, 0.03512766474989268, 0.0714543774748133, 0.1034733993264854,
            0.06261694980701477, 0.15583182756937222, 0.1405994773680913, 0.13646942323188396,
            0.0745630203730339, 0.14561771518950456, 0.04898333023910446, 0.10715936162008981,
            0.0042188725047279454, 0.0016875490018911782, 0.13122913948916926, 0.0775384357184736,
            0.07567324997954125, 0.017586036967076488, 0.027400466688601497, 0.06381599778204271,
            0.1338048721762663, 0.13038536498822365, 0.12234730263711041, 0.011057886880813246,
            0.04889451187058387, 0.14872635808772514, 0.14330843760796927, 0.015143531832760309,
            0.020961134970858844, 0.027622512609902967, 0.04205549749449857, 0.01536557775406178,
            0.054578887455901524, 0.03628230354066033, 0.06834573457659271, 0.048183964922419165,
            0.02251545641996914, 0.16844403589929574, 0.03157493000906915, 0.048583647580761814,
            0.1315400037789913, 0.16937662876876192, 0.09414747063182362, 0.14131002431625603,
            0.10143057685051186, 0.10227435135145745, 0.04587468734088387, 0.13207291399011484,
            0.007549561324250008, 0.08766372972982067, 0.10236316971997804, 0.11337664741653099,
            0.1072481799886104, 0.13820138141803542, 0.1514353183276031, 0.030686746323863267,
            0.09032828078543832, 0.10711495243582951, 0.06115144672642506, 0.11670733623605306,
            0.07593970508510302, 0.16164943070747076, 0.08708641033443686, 0.05186992721602358,
            0.05697698340595741, 0.06727991415434566, 0.13855665489211777, 0.15494364388416632,
            0.08180171740746184, 0.016164943070747076, 0.1763488706976281, 0.15618710104345457,
            0.015010304279979427, 0.033129251458179444, 0.0042188725047279454, 0.12225848426858983,
            0.1383790181550766, 0.05466770582442211, 0.12425689756030306, 0.17199677064011928,
            0.03796985254255151, 0.11377633007487364, 0.007016651113126477, 0.04121172299355298,
            0.04658523428904857, 0.09268196755123391, 0.008570972562236772, 0.11817283931664277,
            0.07234256116001919, 0.15036949790535603, 0.10964627593866628, 0.1056494493552398,
            0.11390955762765452, 0.15298963977671337, 0.17586036967076488, 0.13855665489211777,
          ],
          primary_key: 3695,
        },
      ],
    });

    await milvusClient.dataManager.flushSync({ collection_names: ["trace_moe"] });

    const index_params = {
      metric_type: "IP",
      index_type: "IVF_SQ8",
      params: JSON.stringify({ nlist: 128 }),
    };

    await milvusClient.indexManager.createIndex({
      collection_name: "trace_moe",
      field_name: "cl_ha",
      extra_params: index_params,
    });

    // await milvusClient.collectionManager.loadCollectionSync({
    //   collection_name: "trace_moe",
    // });

    console.log("initializeAndInsertMilvusCollection ends");
  } catch (error) {
    console.log("catch initializeAndInsertMilvusCollection error");
    console.log(error);
  }
  await app.locals.knex(TRACE_ALGO).truncate();
  await app.locals.knex(TRACE_ALGO).insert({
    path: "21034/Gochuumon wa Usagi Desuka 2 - 01 (BD 1280x720 x264 AAC).mp4",
    status: "LOADED",
    created: new Date(),
    updated: new Date(),
  });
});

afterAll(async () => {
  await app.locals.knex(TRACE_ALGO).truncate();
  await app.locals.knex("user").where("email", "test@trace.moe").del();
  await app.locals.redis.disconnect();
  await app.locals.knex.destroy();
});

describe("without API Key", () => {
  test("/search by image URL", async () => {
    const response = await request(app)
      .get("/search")
      .query({ url: "https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(typeof response.body.frameCount).toBe("number");
    expect(typeof response.body.error).toBe("string");
    expect(Array.isArray(response.body.result)).toBeTruthy();
    const topResult = response.body.result[0];
    expect(typeof topResult.anilist).toBe("number");
    expect(typeof topResult.filename).toBe("string");
    expect(typeof topResult.episode).toBe("number");
    expect(typeof topResult.from).toBe("number");
    expect(typeof topResult.to).toBe("number");
    expect(typeof topResult.similarity).toBe("number");
    expect(typeof topResult.video).toBe("string");
    expect(typeof topResult.image).toBe("string");
    expect(topResult.anilist).toBe(21034);
    expect(topResult.episode).toBe(1);
    expect(topResult.similarity).toBeGreaterThan(0.9);
  });
  test("/search by Form Post", async () => {
    if (!fs.existsSync("32B15UXxymfSMwKGTObY5e.jpg")) {
      await fetch("https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg")
        .then((e) => e.arrayBuffer())
        .then((arrayBuffer) =>
          fs.outputFile("32B15UXxymfSMwKGTObY5e.jpg", Buffer.from(arrayBuffer))
        );
    }
    const response = await request(app)
      .post("/search")
      .attach("image", "32B15UXxymfSMwKGTObY5e.jpg");
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(typeof response.body.frameCount).toBe("number");
    expect(typeof response.body.error).toBe("string");
    expect(Array.isArray(response.body.result)).toBeTruthy();
    const topResult = response.body.result[0];
    expect(typeof topResult.anilist).toBe("number");
    expect(typeof topResult.filename).toBe("string");
    expect(typeof topResult.episode).toBe("number");
    expect(typeof topResult.from).toBe("number");
    expect(typeof topResult.to).toBe("number");
    expect(typeof topResult.similarity).toBe("number");
    expect(typeof topResult.video).toBe("string");
    expect(typeof topResult.image).toBe("string");
    expect(topResult.anilist).toBe(21034);
    expect(topResult.episode).toBe(1);
    expect(topResult.similarity).toBeGreaterThan(0.9);
    await fs.remove("32B15UXxymfSMwKGTObY5e.jpg");
  });
  test("/search by file upload", async () => {
    const response = await request(app)
      .post("/search")
      .set("Content-Type", "image/jpeg")
      .send(
        Buffer.from(
          await fetch("https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg").then((e) =>
            e.arrayBuffer()
          )
        )
      );
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(typeof response.body.frameCount).toBe("number");
    expect(typeof response.body.error).toBe("string");
    expect(Array.isArray(response.body.result)).toBeTruthy();
    const topResult = response.body.result[0];
    expect(typeof topResult.anilist).toBe("number");
    expect(typeof topResult.filename).toBe("string");
    expect(typeof topResult.episode).toBe("number");
    expect(typeof topResult.from).toBe("number");
    expect(typeof topResult.to).toBe("number");
    expect(typeof topResult.similarity).toBe("number");
    expect(typeof topResult.video).toBe("string");
    expect(typeof topResult.image).toBe("string");
    expect(topResult.anilist).toBe(21034);
    expect(topResult.episode).toBe(1);
    expect(topResult.similarity).toBeGreaterThan(0.9);
    await fs.remove("32B15UXxymfSMwKGTObY5e.jpg");
  });
  test("/search by image URL with cutBorders", async () => {
    const response = await request(app)
      .get("/search?cutBorders")
      .query({ url: "https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(typeof response.body.frameCount).toBe("number");
    expect(typeof response.body.error).toBe("string");
    expect(Array.isArray(response.body.result)).toBeTruthy();
    const topResult = response.body.result[0];
    expect(typeof topResult.anilist).toBe("number");
    expect(typeof topResult.filename).toBe("string");
    expect(typeof topResult.episode).toBe("number");
    expect(typeof topResult.from).toBe("number");
    expect(typeof topResult.to).toBe("number");
    expect(typeof topResult.similarity).toBe("number");
    expect(typeof topResult.video).toBe("string");
    expect(typeof topResult.image).toBe("string");
    expect(topResult.anilist).toBe(21034);
    expect(topResult.episode).toBe(1);
    expect(topResult.similarity).toBeGreaterThan(0.9);
  });
  test("/search by image URL with anilistInfo", async () => {
    const response = await request(app)
      .get("/search?anilistInfo")
      .query({ url: "https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(typeof response.body.frameCount).toBe("number");
    expect(typeof response.body.error).toBe("string");
    expect(Array.isArray(response.body.result)).toBeTruthy();
    const topResult = response.body.result[0];
    expect(typeof topResult.anilist).toBe("object");
    expect(typeof topResult.filename).toBe("string");
    expect(typeof topResult.episode).toBe("number");
    expect(typeof topResult.from).toBe("number");
    expect(typeof topResult.to).toBe("number");
    expect(typeof topResult.similarity).toBe("number");
    expect(typeof topResult.video).toBe("string");
    expect(typeof topResult.image).toBe("string");
    expect(topResult.anilist.id).toBe(21034);
    expect(topResult.episode).toBe(1);
    expect(topResult.similarity).toBeGreaterThan(0.9);
  });
  test("/search by image URL with anilist filter", async () => {
    const response = await request(app)
      .get("/search")
      .query({ url: "https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg", anilistID: 21034 });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(typeof response.body.frameCount).toBe("number");
    expect(typeof response.body.error).toBe("string");
    expect(Array.isArray(response.body.result)).toBeTruthy();
    expect(response.body.result.every((e) => e.anilist === 21034)).toBeTruthy();
    const topResult = response.body.result[0];
    expect(typeof topResult.anilist).toBe("number");
    expect(typeof topResult.filename).toBe("string");
    expect(typeof topResult.episode).toBe("number");
    expect(typeof topResult.from).toBe("number");
    expect(typeof topResult.to).toBe("number");
    expect(typeof topResult.similarity).toBe("number");
    expect(typeof topResult.video).toBe("string");
    expect(typeof topResult.image).toBe("string");
    expect(topResult.episode).toBe(1);
    expect(topResult.similarity).toBeGreaterThan(0.9);
  });

  test("/search by image concurrency limit", async () => {
    if (!fs.existsSync("32B15UXxymfSMwKGTObY5e.jpg")) {
      await fetch("https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg")
        .then((e) => e.arrayBuffer())
        .then((arrayBuffer) =>
          fs.outputFile("32B15UXxymfSMwKGTObY5e.jpg", Buffer.from(arrayBuffer))
        );
    }
    const res = await Promise.all(
      [...new Array(5)].map((_) =>
        request(app).post("/search").attach("image", "32B15UXxymfSMwKGTObY5e.jpg")
      )
    );
    expect(res.map((e) => e.statusCode).includes(402)).toBe(true);
  });
});

describe("with API Key", () => {
  test("/search by image URL with API Key", async () => {
    const response = await request(app).get("/search").query({
      url: "https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg",
      key: app.locals.apiKeyTier1,
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(typeof response.body.frameCount).toBe("number");
    expect(typeof response.body.error).toBe("string");
    expect(Array.isArray(response.body.result)).toBeTruthy();
    const topResult = response.body.result[0];
    expect(typeof topResult.anilist).toBe("number");
    expect(typeof topResult.filename).toBe("string");
    expect(typeof topResult.episode).toBe("number");
    expect(typeof topResult.from).toBe("number");
    expect(typeof topResult.to).toBe("number");
    expect(typeof topResult.similarity).toBe("number");
    expect(typeof topResult.video).toBe("string");
    expect(typeof topResult.image).toBe("string");
    expect(topResult.anilist).toBe(21034);
    expect(topResult.episode).toBe(1);
    expect(topResult.similarity).toBeGreaterThan(0.9);
  });
});

describe("with system Tier 9 API Key", () => {
  test("/search by image queue limit", async () => {
    if (!fs.existsSync("32B15UXxymfSMwKGTObY5e.jpg")) {
      await fetch("https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg")
        .then((e) => e.arrayBuffer())
        .then((arrayBuffer) =>
          fs.outputFile("32B15UXxymfSMwKGTObY5e.jpg", Buffer.from(arrayBuffer))
        );
    }
    const res = await Promise.all(
      [...new Array(8)].map((_) =>
        request(app)
          .post("/search")
          .query({ key: app.locals.apiKeyTier9 })
          .attach("image", "32B15UXxymfSMwKGTObY5e.jpg")
      )
    );
    expect(res.map((e) => e.statusCode).includes(503)).toBe(true);
  });
});

describe("with system system API Key", () => {
  test("/search by image URL with API Key", async () => {
    const response = await request(app).get("/search").query({
      url: "https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg",
      key: app.locals.apiKeyTier0,
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(typeof response.body.frameCount).toBe("number");
    expect(typeof response.body.error).toBe("string");
    expect(Array.isArray(response.body.result)).toBeTruthy();
    const topResult = response.body.result[0];
    expect(typeof topResult.anilist).toBe("number");
    expect(typeof topResult.filename).toBe("string");
    expect(typeof topResult.episode).toBe("number");
    expect(typeof topResult.from).toBe("number");
    expect(typeof topResult.to).toBe("number");
    expect(typeof topResult.similarity).toBe("number");
    expect(typeof topResult.video).toBe("string");
    expect(typeof topResult.image).toBe("string");
    expect(topResult.anilist).toBe(21034);
    expect(topResult.episode).toBe(1);
    expect(topResult.similarity).toBeGreaterThan(0.9);
  });
});

describe("invalid input", () => {
  test("/search with wrong HTTP Method", async () => {
    // Method Not Allowed
    const response = await request(app).get("/search");
    expect(response.statusCode).toBe(405);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(typeof response.body.error).toBe("string");
  });
  test("/search by image URL with invalid URL", async () => {
    // Invalid image url
    const response = await request(app).get("/search").query({ url: "explosion" });
    expect(response.statusCode).toBe(400);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(typeof response.body.error).toBe("string");
  });
  test("/search by image URL with inaccessible image URL", async () => {
    // Failed to fetch image
    const response = await request(app).get("/search").query({ url: "https://0.0.0.0/a" });
    expect(response.statusCode).toBeGreaterThanOrEqual(400);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(typeof response.body.error).toBe("string");
  });
  test("/search by image URL with invalid image", async () => {
    // Failed to process image
    const response = await request(app).get("/search").query({ url: "https://media.trace.moe" });
    expect(response.statusCode).toBe(400);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(typeof response.body.error).toBe("string");
  });
  test("/search by image URL with invalid API Key", async () => {
    // Invalid API key
    const response = await request(app).get("/search").query({ key: "explosion" });
    expect(response.statusCode).toBe(403);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(typeof response.body.error).toBe("string");
  });
});

describe.each([
  ["16:9 in 16:9,  no border", "https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg"],
  ["16:9 in 16:10, #000 border", "https://images.plurk.com/I7r7frYsuiYcyWTmC8DAL.jpg"],
])("%s", (_, url, expected) => {
  test("/search by image URL with cutBorders", async () => {
    const response = await request(app).get("/search?cutBorders").query({ url });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(typeof response.body.frameCount).toBe("number");
    expect(typeof response.body.error).toBe("string");
    expect(Array.isArray(response.body.result)).toBeTruthy();
    const topResult = response.body.result[0];
    expect(typeof topResult.anilist).toBe("number");
    expect(typeof topResult.filename).toBe("string");
    expect(typeof topResult.episode).toBe("number");
    expect(typeof topResult.from).toBe("number");
    expect(typeof topResult.to).toBe("number");
    expect(typeof topResult.similarity).toBe("number");
    expect(typeof topResult.video).toBe("string");
    expect(typeof topResult.image).toBe("string");
    expect(topResult.anilist).toBe(21034);
    expect(topResult.episode).toBe(1);
    expect(topResult.similarity).toBeGreaterThan(0.9);
  });
});
