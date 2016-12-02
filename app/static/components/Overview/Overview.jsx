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

class Overview extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
    };
  }

  render () {
    return (
      <div>
        <h3>Documentation</h3>
        <hr />
        Github link: <a href="https://github.com/pmservice/product-line-prediction" target="_blank">https://github.com/pmservice/product-line-prediction</a>
        <hr />
        <h4>This sample application shows how to easily score data using IBM Watson Machine Learning online deployment.</h4>
        <br/>
        <p>Within sample scoring application you are able to:</p>
        <ul>
          <li>select one of online deployments (scoring) based on GoodsCategoryPrediction sample model</li>
          <li>using the Input data drop box you can easily either drag and drop csv file with input data for scoring (or double click on input data field to open file browser)</li>
          <li>call IBM Watson Machine Learning REST API using „Get Score” button</li>
          <li>display scoring result in form of a table</li>
          <br/>
            <a href="images/scoring_result.png"><img src="images/scoring_result.png" alt="Scoring screen" width="100%" /></a>
        </ul>
      </div>
    );
  }
}

module.exports = Overview;
