/* eslint-disable rulesdir/no-api-in-views,rulesdir/no-api-side-effects-method */

import _ from 'underscore';
import requireParameters from './requireParameters';
import * as Network from './Network';
import * as NetworkStore from './Network/NetworkStore';
import updateSessionAuthTokens from './actions/Session/updateSessionAuthTokens';
import redirectToSignIn from './actions/SignInRedirect';
import CONST from '../CONST';
import Log from './Log';
import * as ErrorUtils from './ErrorUtils';
import * as API from './API';
import ONYXKEYS from '../ONYXKEYS';

/**
 * @param {Object} parameters
 * @param {Boolean} [parameters.useExpensifyLogin]
 * @param {String} parameters.partnerName
 * @param {String} parameters.partnerPassword
 * @param {String} parameters.partnerUserID
 * @param {String} parameters.partnerUserSecret
 * @param {String} [parameters.twoFactorAuthCode]
 * @param {String} [parameters.email]
 * @param {String} [parameters.authToken]
 * @returns {Promise}
 */
function Authenticate(parameters) {
    const commandName = 'Authenticate';

    requireParameters([
        'partnerName',
        'partnerPassword',
        'partnerUserID',
        'partnerUserSecret',
    ], parameters, commandName);

    return Network.post(commandName, {
        // When authenticating for the first time, we pass useExpensifyLogin as true so we check
        // for credentials for the expensify partnerID to let users Authenticate with their expensify user
        // and password.
        useExpensifyLogin: parameters.useExpensifyLogin,
        partnerName: parameters.partnerName,
        partnerPassword: parameters.partnerPassword,
        partnerUserID: parameters.partnerUserID,
        partnerUserSecret: parameters.partnerUserSecret,
        twoFactorAuthCode: parameters.twoFactorAuthCode,
        authToken: parameters.authToken,
        shouldRetry: false,

        // Force this request to be made because the network queue is paused when re-authentication is happening
        forceNetworkRequest: true,

        // Add email param so the first Authenticate request is logged on the server w/ this email
        email: parameters.email,
    });
}

/**
 * Reauthenticate using the stored credentials and redirect to the sign in page if unable to do so.
 *
 * @param {String} [command] command name for logging purposes
 */
function reauthenticate(command = '') {
    const optimisticData = [
        {
            onyxMethod: CONST.ONYX.METHOD.MERGE,
            key: ONYXKEYS.ACCOUNT,
            value: {
                ...CONST.DEFAULT_ACCOUNT_DATA,
                isLoading: true,
            },
        },
    ];

    const successData = [
        {
            onyxMethod: CONST.ONYX.METHOD.MERGE,
            key: ONYXKEYS.ACCOUNT,
            value: {
                isLoading: false,
            },
        },
    ];

    const failureData = [
        {
            onyxMethod: CONST.ONYX.METHOD.MERGE,
            key: ONYXKEYS.ACCOUNT,
            value: {
                isLoading: false,
            },
        },
    ];

    const credentials = NetworkStore.getCredentials();
    API.makeRequestWithSideEffects(
        'ReauthenticateUser',
        {
            partnerUserID: credentials.autoGeneratedLogin,
            partnerUserSecret: credentials.autoGeneratedPassword,
        },
        {optimisticData, successData, failureData},
    )
        .then((response) => {
            console.log(">>>>", JSON.stringify(response));
            if (response.jsonCode === CONST.JSON_CODE.UNABLE_TO_RETRY) {
                // If authentication fails, then the network can be unpaused
                NetworkStore.setIsAuthenticating(false);

                // When a fetch() fails due to a network issue and an error is thrown we won't log the user out. Most likely they
                // have a spotty connection and will need to try to reauthenticate when they come back online. We will error so it
                // can be handled by callers of reauthenticate().
                throw new Error('Unable to retry Authenticate request');
            }

            // If authentication fails and we are online then log the user out
            if (response.jsonCode !== 200) {
                const errorMessage = ErrorUtils.getAuthenticateErrorMessage(response);
                NetworkStore.setIsAuthenticating(false);
                Log.hmmm('Redirecting to Sign In because we failed to reauthenticate', {
                    command,
                    error: errorMessage,
                });
                redirectToSignIn(errorMessage);
                return;
            }

            const sessionResponse = _.find(response.onyxData, onyxData => onyxData.key === ONYXKEYS.SESSION);

            // Update authToken in Onyx and in our local variables so that API requests will use the new authToken
            updateSessionAuthTokens(sessionResponse.value.authToken, sessionResponse.value.encryptedAuthToken);

            // Note: It is important to manually set the authToken that is in the store here since any requests that are hooked into
            // reauthenticate .then() will immediate post and use the local authToken. Onyx updates subscribers lately so it is not
            // enough to do the updateSessionAuthTokens() call above.
            NetworkStore.setAuthToken(sessionResponse.value.authToken);

            // The authentication process is finished so the network can be unpaused to continue processing requests
            NetworkStore.setIsAuthenticating(false);
        });
}

window.reauthenticate = reauthenticate;

export {
    reauthenticate,
    Authenticate,
};
