import "dotenv/config";
import { default as request } from "supertest";
import Knex from "knex";
import { createClient } from "redis";
import fetch from "node-fetch";
import fs from "fs-extra";
import app from "./app.js";
import { MilvusClient, DataType, MetricType, IndexType } from "@zilliz/milvus2-sdk-node";

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
      collection_name: "shotit",
      description: "Shotit Index Data Collection",
      fields: [
        {
          name: "cl_ha",
          description: "Dynamic fields for LIRE Solr",
          data_type: DataType.FloatVector,
          dim: 100,
        },
        // {
        //   name: "cl_hi",
        //   data_type: 21, //DataType.VarChar
        //   max_length: 200,
        //   description: "Metric Spaces Indexing",
        // },
        {
          name: "hash_id",
          data_type: DataType.VarChar,
          max_length: 500,
          description: "${imdbID}/${fileName}/${time}",
        },
        {
          name: "duration",
          data_type: DataType.Float,
          description: "Video duration of the given video file",
        },
        {
          name: "primary_key",
          data_type: DataType.Int64,
          is_primary_key: true,
          description: "Primary Key",
        },
      ],
    };

    await milvusClient.releaseCollection({ collection_name: "shotit" });

    await milvusClient.createCollection(params);

    await milvusClient.insert({
      collection_name: "shotit",
      fields_data: [
        {
          hash_id: `21034/Gochuumon wa Usagi Desuka 2 - 01 (BD 1280x720 x264 AAC).mp4/278.5000`,
          cl_ha: [
            0.04412470282126147, 0.14904735110511852, 0.023052187715195425, 0.08121056969895182,
            0.11090565883589248, 0.03479824519602973, 0.07078429395753709, 0.10250304842825446,
            0.06202974175272051, 0.15437047078744418, 0.1393249589580609, 0.13518964284121285,
            0.07527155187156369, 0.1442521441185607, 0.04852397528599342, 0.10615444457398199,
            0.004179308841495354, 0.001671723536598141, 0.12999850133282917, 0.16690839731193022,
            0.07496360279903246, 0.017465111684985848, 0.03840564861710993, 0.06330553076749278,
            0.1325500793623737, 0.12916263956453009, 0.12119995640336526, 0.01095418843718256,
            0.048435989836698785, 0.14733163484387304, 0.14196452243690005, 0.015001519104735954,
            0.02076456603353481, 0.027407467455280055, 0.04166111024101158, 0.012405948350544102,
            0.05406705859155568, 0.03594205603686004, 0.06770480323222473, 0.04773210624234167,
            0.022304311396190993, 0.1668644045872829, 0.031278827224244174, 0.048128040764167546,
            0.1303064504053604, 0.1677882518048766, 0.09326457625231736, 0.13998484982777068,
            0.10047938309447776, 0.09427640891920572, 0.04544448456068106, 0.13083436310112823,
            0.007478763190044317, 0.08684163845380871, 0.10140323031207148, 0.11231342602460671,
            0.10624243002327662, 0.13690535910245832, 0.15001519104735953, 0.03075091452847634,
            0.08948120193264789, 0.10611045184933467, 0.06057798183935897, 0.11561288037315567,
            0.07522755914691637, 0.160133517716243, 0.08626973303339357, 0.06264563989778299,
            0.056442665722510936, 0.06664897784068906, 0.1372573008996369, 0.15349061629449778,
            0.06977246129064875, 0.0160133517716243, 0.1746951095745058, 0.15472241258462271,
            0.014869540930793994, 0.03281857258690036, 0.004179308841495354, 0.12111197095407061,
            0.1370813300010476, 0.05415504404085032, 0.1230916435632, 0.17038382255906848,
            0.037613779573458184, 0.11270936054643259, 0.006950850494276483, 0.04082524847271251,
            0.046148368155038165, 0.09181281633895583, 0.008490595856932666, 0.11715262573581187,
            0.07166414845048348, 0.14825548206146674, 0.10861803715423188, 0.09339655442625933,
            0.11284133872037455, 0.15155493641001572, 0.17421118960338527, 0.1372573008996369,
          ],
          duration: 1422.01,
          primary_key: 3694,
        },
        {
          hash_id: `21034/Gochuumon wa Usagi Desuka 2 - 01 (BD 1280x720 x264 AAC).mp4/279.5000`,
          cl_ha: [
            0.04412470282126147, 0.14904735110511852, 0.023052187715195425, 0.08121056969895182,
            0.11090565883589248, 0.03479824519602973, 0.07078429395753709, 0.10250304842825446,
            0.06202974175272051, 0.15437047078744418, 0.1393249589580609, 0.13518964284121285,
            0.07527155187156369, 0.1442521441185607, 0.04852397528599342, 0.10615444457398199,
            0.004179308841495354, 0.001671723536598141, 0.12999850133282917, 0.16690839731193022,
            0.07496360279903246, 0.017465111684985848, 0.03840564861710993, 0.06330553076749278,
            0.1325500793623737, 0.12916263956453009, 0.12119995640336526, 0.01095418843718256,
            0.048435989836698785, 0.14733163484387304, 0.14196452243690005, 0.015001519104735954,
            0.02076456603353481, 0.027407467455280055, 0.04166111024101158, 0.012405948350544102,
            0.05406705859155568, 0.03594205603686004, 0.06770480323222473, 0.04773210624234167,
            0.022304311396190993, 0.1668644045872829, 0.031278827224244174, 0.048128040764167546,
            0.1303064504053604, 0.1677882518048766, 0.09326457625231736, 0.13998484982777068,
            0.10047938309447776, 0.09427640891920572, 0.04544448456068106, 0.13083436310112823,
            0.007478763190044317, 0.08684163845380871, 0.10140323031207148, 0.11231342602460671,
            0.10624243002327662, 0.13690535910245832, 0.15001519104735953, 0.03075091452847634,
            0.08948120193264789, 0.10611045184933467, 0.06057798183935897, 0.11561288037315567,
            0.07522755914691637, 0.160133517716243, 0.08626973303339357, 0.06264563989778299,
            0.056442665722510936, 0.06664897784068906, 0.1372573008996369, 0.15349061629449778,
            0.06977246129064875, 0.0160133517716243, 0.1746951095745058, 0.15472241258462271,
            0.014869540930793994, 0.03281857258690036, 0.004179308841495354, 0.12111197095407061,
            0.1370813300010476, 0.05415504404085032, 0.1230916435632, 0.17038382255906848,
            0.037613779573458184, 0.11270936054643259, 0.006950850494276483, 0.04082524847271251,
            0.046148368155038165, 0.09181281633895583, 0.008490595856932666, 0.11715262573581187,
            0.07166414845048348, 0.14825548206146674, 0.10861803715423188, 0.09339655442625933,
            0.11284133872037455, 0.15155493641001572, 0.17421118960338527, 0.1372573008996369,
          ],
          duration: 1422.01,
          primary_key: 3695,
        },
      ],
    });

    await milvusClient.flushSync({ collection_names: ["shotit"] });

    await milvusClient.createIndex({
      collection_name: "shotit",
      field_name: "cl_ha",
      metric_type: MetricType.IP,
      index_type: IndexType.IVF_SQ8,
      params: { nlist: 128 },
    });

    // await milvusClient.loadCollectionSync({
    //   collection_name: "shotit",
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
  test(
    "/search by image URL",
    async () => {
      const response = await request(app)
        .get("/search")
        .query({ url: "https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg" });
      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toMatch(/^application\/json/);
      expect(typeof response.body.frameCount).toBe("number");
      expect(typeof response.body.error).toBe("string");
      expect(Array.isArray(response.body.result)).toBeTruthy();
      const topResult = response.body.result[0];
      expect(typeof topResult.imdb).toBe("string");
      expect(typeof topResult.filename).toBe("string");
      expect(typeof topResult.episode).toBe("number");
      expect(typeof topResult.duration).toBe("number");
      expect(typeof topResult.from).toBe("number");
      expect(typeof topResult.to).toBe("number");
      expect(typeof topResult.similarity).toBe("number");
      expect(typeof topResult.video).toBe("string");
      expect(typeof topResult.image).toBe("string");
      expect(topResult.imdb).toBe("21034");
      expect(topResult.episode).toBe(1);
      expect(topResult.duration).toBe(1422.01);
      expect(topResult.similarity).toBeGreaterThan(0.9);
    },
    1000 * 10
  );
  test(
    "/search by Form Post",
    async () => {
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
      expect(typeof topResult.imdb).toBe("string");
      expect(typeof topResult.filename).toBe("string");
      expect(typeof topResult.episode).toBe("number");
      expect(typeof topResult.duration).toBe("number");
      expect(typeof topResult.from).toBe("number");
      expect(typeof topResult.to).toBe("number");
      expect(typeof topResult.similarity).toBe("number");
      expect(typeof topResult.video).toBe("string");
      expect(typeof topResult.image).toBe("string");
      expect(topResult.imdb).toBe("21034");
      expect(topResult.episode).toBe(1);
      expect(topResult.duration).toBe(1422.01);
      expect(topResult.similarity).toBeGreaterThan(0.9);
      await fs.remove("32B15UXxymfSMwKGTObY5e.jpg");
    },
    1000 * 10
  );
  test(
    "/search by file upload",
    async () => {
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
      expect(typeof topResult.imdb).toBe("string");
      expect(typeof topResult.filename).toBe("string");
      expect(typeof topResult.episode).toBe("number");
      expect(typeof topResult.duration).toBe("number");
      expect(typeof topResult.from).toBe("number");
      expect(typeof topResult.to).toBe("number");
      expect(typeof topResult.similarity).toBe("number");
      expect(typeof topResult.video).toBe("string");
      expect(typeof topResult.image).toBe("string");
      expect(topResult.imdb).toBe("21034");
      expect(topResult.episode).toBe(1);
      expect(topResult.duration).toBe(1422.01);
      expect(topResult.similarity).toBeGreaterThan(0.9);
      await fs.remove("32B15UXxymfSMwKGTObY5e.jpg");
    },
    1000 * 10
  );
  test(
    "/search by image URL with cutBorders",
    async () => {
      const response = await request(app)
        .get("/search?cutBorders")
        .query({ url: "https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg" });
      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toMatch(/^application\/json/);
      expect(typeof response.body.frameCount).toBe("number");
      expect(typeof response.body.error).toBe("string");
      expect(Array.isArray(response.body.result)).toBeTruthy();
      const topResult = response.body.result[0];
      expect(typeof topResult.imdb).toBe("string");
      expect(typeof topResult.filename).toBe("string");
      expect(typeof topResult.episode).toBe("number");
      expect(typeof topResult.duration).toBe("number");
      expect(typeof topResult.from).toBe("number");
      expect(typeof topResult.to).toBe("number");
      expect(typeof topResult.similarity).toBe("number");
      expect(typeof topResult.video).toBe("string");
      expect(typeof topResult.image).toBe("string");
      expect(topResult.imdb).toBe("21034");
      expect(topResult.episode).toBe(1);
      expect(topResult.duration).toBe(1422.01);
      expect(topResult.similarity).toBeGreaterThan(0.9);
    },
    1000 * 10
  );
  test(
    "/search by image URL with sort",
    async () => {
      const response = await request(app)
        .get("/search?sort")
        .query({ url: "https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg" });
      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toMatch(/^application\/json/);
      expect(typeof response.body.frameCount).toBe("number");
      expect(typeof response.body.error).toBe("string");
      expect(Array.isArray(response.body.result)).toBeTruthy();
      const topResult = response.body.result[0];
      expect(typeof topResult.imdb).toBe("string");
      expect(typeof topResult.filename).toBe("string");
      expect(typeof topResult.episode).toBe("number");
      expect(typeof topResult.duration).toBe("number");
      expect(typeof topResult.from).toBe("number");
      expect(typeof topResult.to).toBe("number");
      expect(typeof topResult.similarity).toBe("number");
      expect(typeof topResult.video).toBe("string");
      expect(typeof topResult.image).toBe("string");
      expect(topResult.imdb).toBe("21034");
      expect(topResult.episode).toBe(1);
      expect(topResult.duration).toBe(1422.01);
      expect(topResult.similarity).toBeGreaterThan(0.9);
    },
    1000 * 10
  );
  // test(
  //   "/search by image URL with imdbInfo",
  //   async () => {
  //     const response = await request(app)
  //       .get("/search?imdbInfo")
  //       .query({ url: "https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg" });
  //     expect(response.statusCode).toBe(200);
  //     expect(response.headers["content-type"]).toMatch(/^application\/json/);
  //     expect(typeof response.body.frameCount).toBe("number");
  //     expect(typeof response.body.error).toBe("string");
  //     expect(Array.isArray(response.body.result)).toBeTruthy();
  //     const topResult = response.body.result[0];
  //     expect(typeof topResult.imdb).toBe("object");
  //     expect(typeof topResult.filename).toBe("string");
  //     expect(typeof topResult.episode).toBe("number");
  //     expect(typeof topResult.duration).toBe("number");
  //     expect(typeof topResult.from).toBe("number");
  //     expect(typeof topResult.to).toBe("number");
  //     expect(typeof topResult.similarity).toBe("number");
  //     expect(typeof topResult.video).toBe("string");
  //     expect(typeof topResult.image).toBe("string");
  //     expect(topResult.imdb.id).toBe("21034");
  //     expect(topResult.episode).toBe(1);
  //     expect(topResult.duration).toBe(1422.01);
  //     expect(topResult.similarity).toBeGreaterThan(0.9);
  //   },
  //   1000 * 10
  // );
  test(
    "/search by image URL with imdb filter",
    async () => {
      const response = await request(app)
        .get("/search")
        .query({ url: "https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg", imdbID: 21034 });
      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toMatch(/^application\/json/);
      expect(typeof response.body.frameCount).toBe("number");
      expect(typeof response.body.error).toBe("string");
      expect(Array.isArray(response.body.result)).toBeTruthy();
      expect(response.body.result.every((e) => e.imdb === "21034")).toBeTruthy();
      const topResult = response.body.result[0];
      expect(typeof topResult.imdb).toBe("string");
      expect(typeof topResult.filename).toBe("string");
      expect(typeof topResult.episode).toBe("number");
      expect(typeof topResult.duration).toBe("number");
      expect(typeof topResult.from).toBe("number");
      expect(typeof topResult.to).toBe("number");
      expect(typeof topResult.similarity).toBe("number");
      expect(typeof topResult.video).toBe("string");
      expect(typeof topResult.image).toBe("string");
      expect(topResult.episode).toBe(1);
      expect(topResult.duration).toBe(1422.01);
      expect(topResult.similarity).toBeGreaterThan(0.9);
    },
    1000 * 10
  );

  test(
    "/search by image concurrency limit",
    async () => {
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
    },
    1000 * 10
  );
});

describe("with API Key", () => {
  test(
    "/search by image URL with API Key",
    async () => {
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
      expect(typeof topResult.imdb).toBe("string");
      expect(typeof topResult.filename).toBe("string");
      expect(typeof topResult.episode).toBe("number");
      expect(typeof topResult.duration).toBe("number");
      expect(typeof topResult.from).toBe("number");
      expect(typeof topResult.to).toBe("number");
      expect(typeof topResult.similarity).toBe("number");
      expect(typeof topResult.video).toBe("string");
      expect(typeof topResult.image).toBe("string");
      expect(topResult.imdb).toBe("21034");
      expect(topResult.episode).toBe(1);
      expect(topResult.duration).toBe(1422.01);
      expect(topResult.similarity).toBeGreaterThan(0.9);
    },
    1000 * 10
  );
});

describe("with system Tier 9 API Key", () => {
  test(
    "/search by image queue limit",
    async () => {
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
    },
    1000 * 10
  );
});

describe("with system system API Key", () => {
  test(
    "/search by image URL with API Key",
    async () => {
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
      expect(typeof topResult.imdb).toBe("string");
      expect(typeof topResult.filename).toBe("string");
      expect(typeof topResult.episode).toBe("number");
      expect(typeof topResult.duration).toBe("number");
      expect(typeof topResult.from).toBe("number");
      expect(typeof topResult.to).toBe("number");
      expect(typeof topResult.similarity).toBe("number");
      expect(typeof topResult.video).toBe("string");
      expect(typeof topResult.image).toBe("string");
      expect(topResult.imdb).toBe("21034");
      expect(topResult.episode).toBe(1);
      expect(topResult.duration).toBe(1422.01);
      expect(topResult.similarity).toBeGreaterThan(0.9);
    },
    1000 * 10
  );
});

describe("invalid input", () => {
  test(
    "/search with wrong HTTP Method",
    async () => {
      // Method Not Allowed
      const response = await request(app).get("/search");
      expect(response.statusCode).toBe(405);
      expect(response.headers["content-type"]).toMatch(/^application\/json/);
      expect(typeof response.body.error).toBe("string");
    },
    1000 * 10
  );
  test(
    "/search by image URL with invalid URL",
    async () => {
      // Invalid image url
      const response = await request(app).get("/search").query({ url: "explosion" });
      expect(response.statusCode).toBe(400);
      expect(response.headers["content-type"]).toMatch(/^application\/json/);
      expect(typeof response.body.error).toBe("string");
    },
    1000 * 10
  );
  test(
    "/search by image URL with inaccessible image URL",
    async () => {
      // Failed to fetch image
      const response = await request(app).get("/search").query({ url: "https://0.0.0.0/a" });
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
      expect(response.headers["content-type"]).toMatch(/^application\/json/);
      expect(typeof response.body.error).toBe("string");
    },
    1000 * 10
  );
  test(
    "/search by image URL with invalid image",
    async () => {
      // Failed to process image
      const response = await request(app).get("/search").query({ url: "https://media.trace.moe" });
      expect(response.statusCode).toBe(400);
      expect(response.headers["content-type"]).toMatch(/^application\/json/);
      expect(typeof response.body.error).toBe("string");
    },
    1000 * 10
  );
  test(
    "/search by image URL with invalid API Key",
    async () => {
      // Invalid API key
      const response = await request(app).get("/search").query({ key: "explosion" });
      expect(response.statusCode).toBe(403);
      expect(response.headers["content-type"]).toMatch(/^application\/json/);
      expect(typeof response.body.error).toBe("string");
    },
    1000 * 10
  );
});

describe.each([
  ["16:9 in 16:9,  no border", "https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg"],
  ["16:9 in 16:10, #000 border", "https://images.plurk.com/I7r7frYsuiYcyWTmC8DAL.jpg"],
])("%s", (_, url, expected) => {
  test(
    "/search by image URL with cutBorders",
    async () => {
      const response = await request(app).get("/search?cutBorders").query({ url });
      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toMatch(/^application\/json/);
      expect(typeof response.body.frameCount).toBe("number");
      expect(typeof response.body.error).toBe("string");
      expect(Array.isArray(response.body.result)).toBeTruthy();
      const topResult = response.body.result[0];
      expect(typeof topResult.imdb).toBe("string");
      expect(typeof topResult.filename).toBe("string");
      expect(typeof topResult.episode).toBe("number");
      expect(typeof topResult.duration).toBe("number");
      expect(typeof topResult.from).toBe("number");
      expect(typeof topResult.to).toBe("number");
      expect(typeof topResult.similarity).toBe("number");
      expect(typeof topResult.video).toBe("string");
      expect(typeof topResult.image).toBe("string");
      expect(topResult.imdb).toBe("21034");
      expect(topResult.episode).toBe(1);
      expect(topResult.duration).toBe(1422.01);
      expect(topResult.similarity).toBeGreaterThan(0.9);
    },
    1000 * 10
  );
});
