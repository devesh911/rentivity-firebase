const {db, logger} = require("./config");


exports.getDocument = async (docPath) => {
  let doc;
  logger.info(`Fetching doc with path: ${docPath}`);
  try {
    doc = await db.doc(docPath).get();
  } catch (err) {
    logger.error("Cannot fetch doc with path: " + docPath, err);
    return;
  }
  logger.info(`Received doc with id: ${doc.id}`);
  return doc.data();
};
