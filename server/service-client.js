/*
   Copyright 2017 IBM Corp.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

'use strict';

const request = require('request');
const log4js = require('../utils/log4js-logger-util');
const logger = log4js.getLogger('server/service-client');
const debug = require('debug')('sample');
const TOKEN_PATH = '/v3/identity/token';

const modelInfo = require('../config/model.json');
const schema = modelInfo['model-schema'].map(obj => obj.name);

function getTokenFromTokenEndoint (tokenEndpoint, user, password) {
  debug('getTokenFromTokenEndoint', tokenEndpoint);
  return new Promise((resolve, reject) => {
    request.get(tokenEndpoint + TOKEN_PATH, {
      strictSSL: false,
      auth: {
        'user': user,
        'pass': password
      }
    }, function (err, res, body) {
      if (err) {
        reject(err);
      }
      debug('got response:', body);
      if (!res || !res.statusCode) {
        reject(new Error('Token Endpoint failure'));
      } else {
        switch (res.statusCode) {
          case 200:
            resolve(JSON.parse(res.body).token);
            break;
          default:
            reject(new Error(`Token Endpoint returned ${res.statusCode}.
              Make sure the user is privileged to perform REST API calls.`));
        }
      }
    });
  });
}

const ServiceClient = module.exports = function (service) {
  if (service) {
    this.credentials = service.credentials;
  }
};

ServiceClient.prototype = {

  isAvailable: function () {
    return (this.credentials != null);
  },

  performRequest: function (options, callback) {
    getTokenFromTokenEndoint(
      this.credentials.url,
      this.credentials.username,
      this.credentials.password
    )
    .then((token) => {
      options.headers = {Authorization: 'Bearer ' + token};
      options.uri = options.uri.startsWith('http') ? options.uri : this.credentials.url + options.uri;
      debug(`url: ${options.uri}`);
      request(options, callback);
    })
    .catch((err) => {
      callback && callback(err);
    });
  },

  getScore: function (href, data, callback) {
    logger.enter('getScore()', 'href: ' + href + ', data: ' + data);
    let options = {
      method: 'POST',
      uri: href,
      headers: {'content-type': 'application/json'}
    };
    let body = JSON.stringify({values: [data], fields: schema});
    debug(body);
    options.body = body;

    this.performRequest(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var scoreResponse = JSON.parse(body);
        var index = scoreResponse.fields.indexOf('probability');
        scoreResponse['probability'] = {values: scoreResponse.values[0][index]};

        logger.info('getScore()', `successfully finished scoring for scoringHref ${href}`);
        callback && callback(null, scoreResponse);
      } else if (error) {
        logger.error(error);
        callback && callback(JSON.stringify(error.message));
      } else {
        let error = JSON.stringify('Service error code: ' + response.statusCode);
        if (typeof response.body !== 'undefined') {
          try {
            error = JSON.stringify(JSON.parse(response.body).message);
          } catch (e) {
            // suppress
          }
        }
        logger.error(`getScore() error during scoring for scoringHref: ${href}, msg: ${error}`);
        debug(error, 'body: ', response.body);
        callback && callback(error);
      }
    });
  },

  _extendDeploymentWithModel: function (instanceDetails, deployments, callback) {
    if (deployments.length === 0) {
      callback(null, deployments);
      return;
    }

    let options = {
      method: 'GET',
      uri: instanceDetails.entity.published_models.url
    };
    this.performRequest(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        let models = JSON.parse(body).resources;
        let result = deployments
          .map((item) => {
            let {entity} = item;
            let model = models.find(m => m.metadata.guid === entity.published_model.guid);
            model = model && model.entity;
            return {
              name: entity.name,
              status: entity.status,
              createdAt: item.metadata.created_at,
              scoringHref: entity.scoring_url,
              id: item.metadata.guid,
              model: {
                author: model.author && model.author.name ? model.author.name : undefined,
                input_data_schema: model.input_data_schema,
                runtimeEnvironment: model.runtime_environment,
                name: model.name
              }
            };
          });
        return callback(null, result);
      } else if (error) {
        logger.error('_extendDeploymentWithModel()', error);
        return callback(error.message);
      } else {
        error = new Error('Service error code: ' + response.statusCode);
        logger.error('_extendDeploymentWithModel()', error);
        return callback(error.message);
      }
    });
  },

  _getInstanceDetails: function (callback) {
    logger.enter('getInstanceDetails()');
    let options = {
      method: 'GET',
      uri: '/v3/wml_instances/' + this.credentials.instance_id
    };

    this.performRequest(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        let details = JSON.parse(body);
        debug('instance details', details);
        return callback(null, details);
      } else if (error) {
        logger.error('getInstanceDetails()', error);
        return callback(error.message);
      } else {
        error = new Error('Service error code: ' + response.statusCode);
        logger.error('getInstanceDetails()', error);
        return callback(error.message);
      }
    });
  },

  getDeployments: function (callback) {
    logger.enter('getDeployments()');

    this._getInstanceDetails((error, instanceDetails) => {
      if (error) {
        return callback(error);
      } else {
        let options = {
          method: 'GET',
          uri: instanceDetails.entity.deployments.url
        };

        this.performRequest(options, (error, response, body) => {
          if (!error && response.statusCode === 200) {
            let deployments = JSON.parse(body);
            deployments = deployments && deployments.resources;
            debug('all deployments =>', deployments);
            this._extendDeploymentWithModel(instanceDetails, deployments, (err, result) => {
              if (err) {
                return callback(err);
              }
              debug('adjusted deployments: ', result);
              return callback(null, result);
            });
          } else if (error) {
            logger.error('getDeployments()', error);
            return callback(error.message);
          } else {
            error = new Error('Service error code: ' + response.statusCode);
            logger.error('getDeployments()', error);
            return callback(error.message);
          }
        });
      }
    });
  }
};
