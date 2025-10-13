// import fetch from "node-fetch";
import { MilvusClient } from "@zilliz/milvus2-sdk-node";

// const { SOLA_SOLR_LIST, TRACE_ALGO } = process.env;
const { TRACE_ALGO, MILVUS_URL } = process.env;

export default async (req, res) => {
  const knex = req.app.locals.knex;
  const { id } = req.query;
  if (id) {
    if (!id.match(/\d+/)) {
      return res.status(400).json({
        error: "Invalid param id: must be a number",
      });
    }
    const rows = await knex(TRACE_ALGO)
      .where("path", "like", `${id}/%`)
      .select("path", "status", "created");
    return res.json(rows);
  }

  try {
    // const statusList = (
    //   await Promise.all(
    //     SOLA_SOLR_LIST.split(",").map((solrUrl) =>
    //       fetch(`${solrUrl}admin/cores?wt=json`)
    //         .then((res) => res.json())
    //         .then(({ status }) => ({ solrUrl, cores: Object.values(status) }))
    //         .catch((e) => res.status(503))
    //     )
    //   )
    // ).reduce((acc, cur) => {
    //   acc[cur.solrUrl] = cur.cores;
    //   return acc;
    // }, {});
    // return res.json(statusList);

    /* Use Milvus statistics */
    const milvusClient = new MilvusClient(MILVUS_URL);

    const collectionStatistics = await milvusClient.getCollectionStatistics({
      collection_name: `shotit_${TRACE_ALGO}`,
    });
    const rowCount = collectionStatistics?.data.row_count;

    /* 
      Total Size in Bytes
      Formula: https://milvus.io/tools/sizing/
      Parameters: 
        Number of vectors (Million) - 1
        Dimensions - 100 
        Index type - IVF_SQ8
        M (Maximum degree of the node) nlist - 128
        Segment size - 512MB
      Result:
        Memory 286.3 M
    */
    const totalSize = 286.3 * (Number(rowCount) / 1_000_000) * 1024 * 1024;

    const collectionStatus = await milvusClient.showCollections({
      type: 1,
      collection_names: [`shotit_${TRACE_ALGO}`],
    });
    const lastModified = Number(collectionStatus?.data[0].timestamp);

    return res.json({
      errorCode: "Success",
      rowCount: rowCount,
      totalSize: totalSize,
      lastModified: lastModified,
    });
  } catch (e) {
    console.log(e);
    return res.status(503);
  }
};
