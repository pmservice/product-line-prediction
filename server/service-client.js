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
const TOKEN_PATH = '/v2/identity/token';

const modelInfo = require('../config/model.json');
var schema = modelInfo['model-schema'].map(obj => obj.name)

function getTokenFromTokenEndoint(tokenEndpoint, user, password) {
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

        var index = scoreResponse.fields.indexOf("probability");

        scoreResponse["probability"] = {values: scoreResponse.values[0][index]};

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

  _getModels: function (callback) {
    logger.enter('getModels()');
    let options = {
      method: 'GET',
      uri: '/v3/wml_instances/' + this.credentials.instance_id + '/published_models'
    };

    this.performRequest(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        let models = JSON.parse(body).resources;
        debug('all models', models);
        return callback(null, models);
      } else if (error) {
        logger.error('getModels()', error);
        return callback(error.message);
      } else {
        error = new Error('Service error code: ' + response.statusCode);
        logger.error('getModels()', error);
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
        let models = JSON.parse(body);
        debug('instance details', models);
        return callback(null, models);
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
    logger.enter('getDeploymentsU()')

    this._getInstanceDetails((error, result) => {
      if (error) {
        return callback(error);
      } else {
        let instanceDetails = result;

        let options = {
          method: 'GET',
          uri: instanceDetails.entity.published_models.url
        };

        this.performRequest(options, (error, response, body) => {
          if (!error && response.statusCode === 200) {
            let deployments_parsed = JSON.parse(body)

            let options = {
              method: 'GET',
              uri: deployments_parsed.resources[0].entity.deployments.url
            };

            this.performRequest(options, (error, response, body) => {
              if (!error && response.statusCode === 200) {

                let deployments = JSON.parse(body);
                deployments = deployments && deployments.resources;
                debug('all deployments', deployments);
                deployments = deployments
                  .map((item) => {
                    let {entity} = item;
                    let {metadata} = item;
                    let dmHref = entity.deployed_version.url;
                    debug('deployed version', dmHref);
                    let dmGuid = entity.published_model.guid;
                    debug("dmGuid", dmGuid)
                    let model = deployments_parsed.resources.find(m => m.metadata.guid === dmGuid);
                    if (model != null) {
                      model = model.entity;
                      model.trainingDataSchema = undefined;
                      model.pipelineVersion = undefined;
                      model.latestVersion = undefined;
                      model.versionsHref = undefined;
                    }
                    if (model.author && model.author.name) {
                      model.author = model.author.name;
                    } else {
                      model.author = undefined;
                    }
                    let result = {
                      name: entity.name,
                      status: entity.status,
                      createdAt: item.metadata.created_at,
                      scoringHref: entity.scoring_url,
                      id: item.metadata.guid,
                      model: model
                    };
                    return result;
                  });
                debug('matching & prepared online deployments: ', deployments);
                return callback(null, deployments);
              }
            }
            )
          } else if (error) {
            logger.error('getDeployments()', error);
            return callback(error.message);
          } else {
            error = new Error('Service error code: ' + response.statusCode);
            logger.error('getDeployments()', error);
            return callback(error.message);
          }
        })
      }
    })
  }
};
