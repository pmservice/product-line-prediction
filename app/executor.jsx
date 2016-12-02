/* eslint-env es6

   Copyright 2016 IBM Corp.

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
/* eslint-env jquery */

const React = require('react');
const ReactDOM = require('react-dom');
const Dropzone = require('react-dropzone');
const App = require('./static/components/App');
const Scoring = require('./static/components/Scoring');
const Overview = require('./static/components/Overview');

var inputComponent = null;

var Loader = React.createClass({
  render: function () {
    return (
      <svg viewBox="25 25 50 50" className="loader loader--dark">
        <circle r="20" cy="50" cx="50" className="loader__path">
        </circle>
      </svg>
    );
  }
});

var LoaderImpl = React.createClass({
  getInitialState: function () {
    return {
      loadingVisible: false
    };
  },

  render: function () {
    let loading = null;
    if (this.state.loadingVisible === true) {
      loading = (
        <div className="loadingOverlayContainer">
          <div className="loadingContainer">
            <Loader />
          </div>
        </div>
      );
    }
    return loading;
  }
});

var ModelContainer = React.createClass({
  getInitialState: function () {
    return {
      streams: [],
      selectedStreamData: null
    };
  },

  componentWillMount: function () {
    mainLoader.setState({
      loadingVisible: true
    });
    this.serverRequest = $.get('/env/deployments', function (result) {
      this.setState({
        streams: result
      });
      mainLoader.setState({
        loadingVisible: false
      });
    }
    .bind(this))
    .fail(function (jqXHR, textStatus, errorThrown) {
      _showError(jqXHR.responseJSON ? jqXHR.responseJSON.errors : errorThrown);
      mainLoader.setState({
        loadingVisible: false
      });
    });
  },

  componentWillUnmount: function () {
    this.serverRequest.abort();
  },

  _prepareInputInfo: function (data) {
    let values = data.map(function (dataPiece) {
      return `${dataPiece.id} (${dataPiece.type})`;
    });
    return values.join(', ');
  },

  _onStreamSelectChange: function (event) {
    let selectedStreamData = JSON.parse(event.target.value);
    this.setState({
      selectedStreamData: selectedStreamData
    });
    ReactDOM.render(<div className="format-info"> {'Format: ' + this._prepareInputInfo(selectedStreamData.modelSchema)} </div>, document.getElementById('inputFormat'));
    let input = selectedStreamData.sampleInput;
    try {
      input = input.map((item)=>{
        return item.row;
      }).join('\n');
    } catch (e) {
      console.error(e);
    }
    inputComponent = renderInputComponent(input);
  },

  render: function () {
    let data = this.state.streams;
    return (
      <div id="model-select-container">
        <select id="streamSelect" onChange={this._onStreamSelectChange} className="form-control model-select">
          <option disabled selected key="select a deployment"> -- select a deployment -- </option>
          {data.map(function (entry) {
            return (
              <option value={JSON.stringify(entry)} key={entry.id}>{entry.name}</option>
            );
          })}
        </select>
      </div>
    );
  }
});

var Input = React.createClass({
  getInitialState: function () {
    return {inputText: ''};
  },
  componentWillReceiveProps: function (nextProps) {
    this.setState({inputText: nextProps.text});
  },
  _handleChange: function (event) {
    let val = event.target.value;
    if (typeof val !== 'undefined') {
      this.setState({inputText: val});
    }
  },
  _onDrop: function (files) {
    let reader = new FileReader();
    let file = files[0];
    reader.onload = (evt, isCsv = file.name.endsWith('.csv')) => {
      let inputs = evt.target.result;
      // for .csv files remove the header (first line)
      if (isCsv) {
        inputs = inputs.slice(inputs.indexOf('\n')).trim();
      }
      inputComponent.setState({inputText: inputs});
      inputComponent.forceUpdate();
    };
    reader.readAsText(file);
  },
  validate: function () {
    try {
      return this.state.inputText.trim() !== '';
    } catch (err) {
      return false;
    }
  },

  render: function () {
    let textareaStyle = {};
    if (this.state.inputText === '') {
      textareaStyle = {
        backgroundImage: 'url(images/upload.svg)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
      };
    }
    return (
      <Dropzone style={{width: '100%'}} multiple={false} disablePreview={true} disableClick={true} accept=".csv, text/plain" onDrop={this._onDrop} ref="dropzone">
        <div>
          <textarea
            style={textareaStyle}
            required className='form-control ioTextStyle' rows="6" value={this.state.inputText}
            onChange={this._handleChange}
            onDoubleClick={() => {
              this.refs.dropzone.open();
            }} >
          </textarea>
        </div>
      </Dropzone>
    );
  }
});

var ScoreTable = React.createClass({
  render: function () {
    let data = this.props.data;
    let format = modelComponent.state.selectedStreamData.modelSchema;
    let predictionMapping = modelComponent.state.selectedStreamData.predictionMapping;
    return (
      <div>
        <label className="control-label" htmlFor="focusedInput">Output data</label>
        <div id="scoreDiv" className="ioTextStyle">
          <table id="scoreTable" className="table table-bordered light-color2">
            <thead>
              <tr>
                {format.map(function (entry, index) {
                  return <th key={index}>{entry.name}</th>;
                })}
                <th>Prediction</th>
              </tr>
            </thead>
            <tbody>
              {data.map(function (row) {
                return (
                  <tr>
                    {format.map(function (entry, index) {
                      return <td key={index}>{row[entry.id]}</td>;
                    })}
                    <td>{predictionMapping[row.prediction] ? predictionMapping[row.prediction] : row.prediction}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
});

function _validateForm() {
  let selectResult = $('#modelCntn select').val();
  if (typeof selectResult === 'undefined' || selectResult === null) {
    _showError('Select deployment from a list.');
  } else if (!inputComponent.validate()) {
    _showError('Provide valid input data.');
  } else {
    return true;
  }
  return false;
}

function _showError(message) {
  alert.warn(message);
}

var RunButton = React.createClass({
  _updateResponse: function (e) {
    alert.clear();
    e.preventDefault();

    if (!_validateForm()) {
      return;
    }
    mainLoader.setState({
      loadingVisible: true
    });
    ReactDOM.render(
      <p>Waiting for a score....</p>,
      document.getElementById('scoringCntn')
    );
    var streamResult = modelComponent.state.selectedStreamData;
    let scoringData = $('#inputCntn textarea').val().trim().split('\n');

    let toIntIndex = streamResult.modelSchema.map((e, index) => {
      return (e.type === 'INTEGER') ? index : -1;
    }).filter((i) => (i > -1));
    scoringData = scoringData.map(function (row) {
      return row.split(',').map(function (element, index) {
        let result = element.trim();
        return toIntIndex.includes(index) ? parseInt(result) : result;
      });
    });

    var data = {
      scoringData: JSON.stringify(scoringData),
      scoringHref: streamResult.scoringHref
    };
    $.post('/env/score/', data, function (response) {
      mainLoader.setState({
        loadingVisible: false
      });
      if (response.errors) {
        _showError(response.errors);
      }
      ReactDOM.render(
        <ScoreTable data={response.score} />,
        document.getElementById('scoringCntn')
      );
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      _showError(jqXHR.responseJSON ? jqXHR.responseJSON.errors : 'Scoring service failure.');
      mainLoader.setState({
        loadingVisible: false
      });
      /* extract error */
      let err = [jqXHR];
      try {
        err = err[0].responseJSON.error;
      } catch (e) {
        // suppress
      }
      ReactDOM.render(<p></p>, document.getElementById('scoringCntn'));
      _showError((typeof err === 'undefined') ? 'Undefined error' : err);
    });
  },

  render: function () {
    return (
      <button type="button" onClick={this._updateResponse} className="btn btn-primary">Get score</button>
    );
  }
});

var AlertImpl = React.createClass({
  getInitialState: function () {
    return {
      errorMsg: [],
      display: false
    };
  },

  warn: function (msg) {
    this.setState({
      errorMsg: Array.isArray(msg) ? msg : [msg],
      display: true
    });
  },

  clear: function () {
    this.setState({
      errorMsg: [],
      display: false
    });
  },

  render: function () {
    if (!this.state.display)
      return null;
    else if (this.state.errorMsg.length === 0)
      return null;
    else
      return (
        <div className="alert alert-warning">
          <a href="#" className="close" onClick={this.clear} data-dismiss="alert" aria-label="close">&times;</a>
          <strong>Warning!</strong>
          {this.state.errorMsg.map((entry, index) => {
            return <p key={index}>{entry}</p>;
          })}
        </div>
      );
  }
});

function renderInputComponent(text) {
  return ReactDOM.render(<Input text={text}/>, document.getElementById('inputCntn'));
}

if (document.getElementById('scoring-mount')) {
  ReactDOM.render(<App><Scoring /></App>, document.getElementById('scoring-mount'));
  var alert = ReactDOM.render(<AlertImpl />, document.getElementById('alert'));

  var mainLoader = ReactDOM.render(<LoaderImpl />, document.getElementById('loader'));
  ReactDOM.render(<RunButton />, document.getElementById('runButton'));

  var modelComponent = ReactDOM.render(<ModelContainer />, document.getElementById('modelCntn'));
  let inputComponent = renderInputComponent('');
}

if (document.getElementById('overview-mount'))
  ReactDOM.render(<App><Overview /></App>, document.getElementById('overview-mount'));
