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

import React from 'react';
import ReactDOM from 'react-dom';

class Scoring extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
    };
  }

  render () {
    return (
      <div>
        <h3>Score data</h3>
        <hr className="special-border" />
        <div id="alert"></div>
        <div className="form-group">
          <label className="control-label" for="focusedInput">Online deployment of “GoodsCategoryPrediction” model</label>
          <div id="modelCntn"></div>
        </div>
        <div className="form-group">
          <div id="inputLabel">
            <label className="control-label" for="focusedInput">Input data</label>
            <div className="special-text" id="inputFormat"></div>
          </div>
          <div id="inputCntn">Put input control here</div>
        </div>
        <div className="form-group">
          <div id="runButton">Put run button here</div>
        </div>
        <div className="form-group">
          <div id='scoringCntn'>
            <p>&nbsp;</p>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = Scoring;
