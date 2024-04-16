import { decodeAppOpaqueId, decodeShopOpaqueId } from "../../xforms/id.js";
/**
 * @name Mutation/sendResetAccountPasswordEmail
 * @summary resolver for the sendResetAccountPasswordEmail GraphQL mutation
 * @param {Object} _ - unused
 * @param {Object} args.input - an object of all mutation arguments that were sent by the client
 * @param {String} args.input.email - email of account to reset
 * @param {String} [args.input.clientMutationId] - An optional string identifying the mutation call
 * @param {Object} context - an object containing the per-request state
 * @returns {Object} r=sendResetAccountPasswordEmailPayload
 */
export default async function sendResetAccountPasswordEmail(
  _,
  { input },
  context,
) {
  const res = await context.mutations.sendResetPasswordEmailx(context, {
    ...input,
    shopId: decodeShopOpaqueId(input.shopId),
    appId: decodeAppOpaqueId(
      input.appId ||
        context.requestHeaders.appid ||
        context.requestHeaders["app-id"]
    ),
  });
  return { ...input, ...res };
}
