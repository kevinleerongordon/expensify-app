import Log from '../Log';
import CONST from '../../CONST';
import Request from '../../types/onyx/Request';
import Response from '../../types/onyx/Response';
import Middleware from './types';

function logRequestDetails(message: string, request: Request, response?: Response | void) {
    // Don't log about log or else we'd cause an infinite loop
    if (request.command === 'Log') {
        return;
    }

    const logParams: Record<string, unknown> = {
        command: request.command,
        shouldUseSecure: request.shouldUseSecure,
    };

    const returnValueList = request?.data?.returnValueList;
    if (returnValueList) {
        logParams.returnValueList = returnValueList;
    }

    const nvpNames = request?.data?.nvpNames;
    if (nvpNames) {
        logParams.nvpNames = nvpNames;
    }

    if (response) {
        logParams.jsonCode = response.jsonCode;
        logParams.requestID = response.requestID;
    }

    Log.info(message, false, logParams);
}

const Logging: Middleware = (response, request) => {
    logRequestDetails('Making API request', request);
    return response
        .then((data) => {
            logRequestDetails('Finished API request', request, data);
            return data;
        })
        .catch((error) => {
            const logParams: Record<string, unknown> = {
                message: error.message,
                status: error.status,
                title: error.title,
                request,
            };

            if (error.name === CONST.ERROR.REQUEST_CANCELLED) {
                // Cancelled requests are normal and can happen when a user logs out.
                Log.info('[Network] API request error: Request canceled', false, logParams);
            } else if (error.message === CONST.ERROR.FAILED_TO_FETCH) {
                // If the command that failed is Log it's possible that the next call to Log may also fail.
                // This will lead to infinitely complex log params that can eventually crash the app.
                if (request.command === 'Log') {
                    delete logParams.request;
                }

                // Log when we get a "Failed to fetch" error. Very common if a user is offline or experiencing an unlikely scenario like
                // incorrect url, bad cors headers returned by the server, DNS lookup failure etc.
                Log.hmmm('[Network] API request error: Failed to fetch', logParams);
            } else if (
                [
                    CONST.ERROR.IOS_NETWORK_CONNECTION_LOST,
                    CONST.ERROR.NETWORK_REQUEST_FAILED,
                    CONST.ERROR.IOS_NETWORK_CONNECTION_LOST_RUSSIAN,
                    CONST.ERROR.IOS_NETWORK_CONNECTION_LOST_SWEDISH,
                    CONST.ERROR.IOS_NETWORK_CONNECTION_LOST_SPANISH,
                ].includes(error.message)
            ) {
                // These errors seem to happen for native devices with interrupted connections. Often we will see logs about Pusher disconnecting together with these.
                // This type of error may also indicate a problem with SSL certs.
                Log.hmmm('[Network] API request error: Connection interruption likely', logParams);
            } else if ([CONST.ERROR.FIREFOX_DOCUMENT_LOAD_ABORTED, CONST.ERROR.SAFARI_DOCUMENT_LOAD_ABORTED].includes(error.message)) {
                // This message can be observed page load is interrupted (closed or navigated away).
                Log.hmmm('[Network] API request error: User likely navigated away from or closed browser', logParams);
            } else if (error.message === CONST.ERROR.IOS_LOAD_FAILED) {
                // Not yet clear why this message occurs, but it is specific to iOS and tends to happen around the same time as a Pusher code 1006
                // which is when a websocket disconnects. So it seems likely to be a spotty connection scenario.
                Log.hmmm('[Network] API request error: iOS Load Failed error', logParams);
            } else if (error.message === CONST.ERROR.SAFARI_CANNOT_PARSE_RESPONSE) {
                // Another cryptic Apple error message. Unclear why this can happen, but some speculation it can be fixed by a browser restart.
                Log.hmmm('[Network] API request error: Safari "cannot parse response"', logParams);
            } else if (error.message === CONST.ERROR.GATEWAY_TIMEOUT) {
                // This error seems to only throw on dev when localhost:8080 tries to access the production web server. It's unclear whether this can happen on production or if
                // it's a sign that the web server is down.
                Log.hmmm('[Network] API request error: Gateway Timeout error', logParams);
            } else if (request.command === 'AuthenticatePusher') {
                // AuthenticatePusher requests can return with fetch errors and no message. It happens because we return a non 200 header like 403 Forbidden.
                // This is common to see if we are subscribing to a bad channel related to something the user shouldn't be able to access. There's no additional information
                // we can get about these requests.
                Log.hmmm('[Network] API request error: AuthenticatePusher', logParams);
            } else if (error.message === CONST.ERROR.EXPENSIFY_SERVICE_INTERRUPTED) {
                // Expensify site is down completely OR
                // Auth (database connection) is down / bedrock has timed out while making a request. We currently can't tell the difference between Auth down and bedrock timing out.
                Log.hmmm('[Network] API request error: Expensify service interrupted or timed out', logParams);
            } else if (error.message === CONST.ERROR.THROTTLED) {
                Log.hmmm('[Network] API request error: Expensify API throttled the request', logParams);
            } else if (error.message === CONST.ERROR.DUPLICATE_RECORD) {
                // Duplicate records can happen when a large upload is interrupted and we need to retry to see if the original request completed
                Log.info('[Network] API request error: A record already exists with this ID', false, logParams);
            } else {
                // If we get any error that is not known log an alert so we can learn more about it and document it here.
                Log.alert(`${CONST.ERROR.ENSURE_BUGBOT} unknown API request error caught while processing request`, logParams, false);
            }

            // Re-throw this error so the next handler can manage it
            throw error;
        });
};

export default Logging;
