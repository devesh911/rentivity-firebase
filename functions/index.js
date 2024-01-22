/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const logger = require("firebase-functions/logger");
const sgMail = require("@sendgrid/mail");
const admin = require("firebase-admin");
const {getFirestore} = require("firebase-admin/firestore");
const functions = require("firebase-functions");
// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const app = admin.initializeApp();
const db = getFirestore(app);
const sendgridApiKey = functions.config().sendgrid.key;
const mailFrom = functions.config().sendgrid.from;
sgMail.setApiKey(sendgridApiKey);

// eslint-disable-next-line require-jsdoc
async function getDocument(docPath) {
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
}

exports.sendMailOnNewListing = functions.firestore
    .document("listings/{listingId}")
    .onWrite(
        async (change, ctx) => {
          const listingId = ctx.params.listingId;
          const listing = await getDocument(`listings/${listingId}`);
          if (!listing) {
            logger.error(
                `No data associated with listingId: ${listingId}`,
            );
            return;
          }
          const userId = listing.userRef;
          const user = await getDocument(`users/${userId}`);
          if (!user) {
            logger.error("User not found with id: " + userId);
            return;
          }
          const templateId = "d-b158f15e085645cea98ccb063ca63f76";
          try {
            logger.info("sending mail to " + user.email);
            await sgMail.send({
              templateId,
              to: user.email,
              from: mailFrom,
              dynamicTemplateData: {
                name: user.name,
                listing_url: `https://rentivity.in/${listing.category}/${listing.id}`,
                listing_price: listing.regularPrice,
                listing_period: listing.rentPeriod,
                listing_title: listing.title,
              },
            });
            logger.info("Mail sent to userId: " + userId);
          } catch (err) {
            logger.error("Error occured while sending mail", err.message);
          }
        },
    );

exports.sendMailOnRentalRequest = functions.firestore
    .document("rentalRequest/{requestId}")
    .onWrite(async (change, event) => {
      const requestId = event.params.requestId;
      const rentalRequest = await getDocument(`rentalRequest/${requestId}}`);
      if (!rentalRequest) {
        logger.error("Rental request not found with id: " + requestId);
        return;
      }

      const ownerId = rentalRequest.ownerId;
      const owner = await getDocument(`users/${ownerId}`);
      if (!owner) {
        logger.error("User not found with id: " + ownerId);
        return;
      }

      const requesterId = rentalRequest.userId;
      const requester = await getDocument(`users/${requesterId}`);
      if (!requester) {
        logger.error("Rental request not found with id: " + requesterId);
        return;
      }

      const productId = rentalRequest.productId;
      const product = await getDocument(`listings/${productId}`);
      if (!product) {
        logger.error("Product not found with id: " + productId);
        return;
      }

      try {
        sgMail.send({
          templateId: "d-107660403856466bb454bab4da8863e6",
          to: owner.email,
          from: mailFrom,
          dynamicTemplateData: {
            name: owner.name,
            listing_title: product.title,
            rental_period: rentalRequest.rentalPeriod,
            rental_url: "https://rentivity.in/profile/rentalRequests",
          },
        });
      } catch (err) {
        logger.error("Error occured while sending mail", err.message);
      }
    });
