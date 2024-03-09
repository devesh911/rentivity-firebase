const functions = require("firebase-functions");
const {getDocument} = require("./utils");
const {logger, db} = require("./config");

exports.ratingOverviewOnNewFeedbackTrigger = functions.firestore
    .document("feedback/{feedbackId}")
    .onWrite(
        async (change, ctx) => {
          console.log(change);
          // logger.info(ctx)
          const reviewId = ctx.params.feedbackId;
          const review = await getDocument(`feedback/${reviewId}`);
          if (!review) {
            logger.error(`No feedback found with id: ${reviewId}`);
            return;
          }
          const listingId = review.productId;
          const listing = await getDocument(`ratingOverviews/${listingId}`);
          let updatedOverview;
          if (!listing) {
            const stars = [0, 0, 0, 0, 0];
            stars[review.overallRating - 1] = 1;
            updatedOverview = {totalReviews: 1, stars};
          } else {
            updatedOverview = {
              totalReviews: listing.totalReviews + 1,
              stars: listing.stars,
            };
            updatedOverview.stars[review.overallRating - 1] += 1;
          }
          try {
            logger.info(`Update overview for productId: ${listingId}`);
            db.collection(`ratingOverviews`)
                .doc(listingId)
                .set(updatedOverview);
          } catch (err) {
            logger.error(err.message);
          }
        },
    );
