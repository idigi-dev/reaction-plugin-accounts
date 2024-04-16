import _ from "lodash";
import ReactionError from "@reactioncommerce/reaction-error";
import config from "../config.js";

/**
 * @method sendResetEmail
 * @memberof Core
 * @summary Send an email with a link that the user can use to reset their password.
 * @param {Object} context - GraphQL execution context
 * @param {Object} inp - account object that is related to email address
 * @param {Object} inp.account - account object that is related to email address
 * @param {String} inp.email - email of account to reset
 * @param {String} inp.url - the url to be sent in the email
 * @returns {Job} - returns a sendEmail Job instance
 */
async function sendResetEmail(context, inp) {
  // Account emails are always sent from the primary shop email and using primary shop
  // email templates.
  const shop = await context.collections.Shops.findOne(
    inp.shopId ? { _id: inp.shopId } : { shopType: "primary" }
  );
  if (!shop) throw new ReactionError("not-found", "Shop not found");

  const app = {
    ...shop,
    addresses: shop.addressBook || [],
    ...inp.app,
    urls: {
      ...shop.storefrontUrls,
      ...shop.urls,
      ...inp.app.storefrontUrls,
      ...inp.app.urls,
    },
  };

  const contactEmail =
    app.email ||
    (app.emails && app.emails[0] && app.emails[0].address) ||
    config.EMAIL;

  const dataForEmail = {
    ...inp,
    contactEmail,
    homepage: _.get(
      app,
      "urls.store",
      _.get(app, "urls.storefrontHomeUrl", null)
    ),
    copyrightDate: new Date().getFullYear(),
    legalName: _.get(app, "addresses[0].company", app.shopName || app.name),
    physicalAddress: {
      address: `${_.get(app, "addresses[0].address1", "")} ${_.get(
        app,
        "addresses[0].address2",
        ""
      )}`,
      city: _.get(app, "addresses[0].city", ""),
      region: _.get(app, "addresses[0].region", ""),
      postal: _.get(app, "addresses[0].postal", ""),
    },
    shopName: app.shopName || app.name,
    // Account Data
    passwordResetUrl: context.utils.template(
      app.urls.passwordReset || app.urls.passwordResetUrl || inp.url,
      { code: inp.code || inp.token, token: inp.token || inp.code, ...inp }
    ),
  };

  // get account profile language for email
  const language = inp.account.profile && inp.account.profile.language;

  const res = await context.mutations.sendEmail(context, {
    data: dataForEmail,
    fromShop: shop,
    language,
    templateName: "accounts/resetPassword",
    to: inp.email,
  });

  return { dataForEmail, ...res };
}

/**
 * @name accounts/sendResetAccountPasswordEmail
 * @summary Checks to see if a user exists for a given email, and sends a password password if user exists
 * @param {Object} context - GraphQL execution context
 * @param {Object} input - Necessary input for mutation. See SimpleSchema.
 * @param {String} input.appId - email of account to reset
 * @param {String} input.email - email of account to reset
 * @param {String} input.url - url to use for password reset
 * @return {Promise<Object>} with email address if found
 */
export default async function sendResetAccountPasswordEmail(context, input) {
  input.email = input.email.toLowerCase();

  const account = await context.collections.Accounts.findOne({
    "emails.address": input.email,
  });
  if (!account) throw new ReactionError("not-found", "Account not found");

  return await sendResetEmail(context, { ...input, account });
}
