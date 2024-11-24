/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const TabPaneTreeHtml = `<style>
        :host{
          padding: 10px 10px;
          display: flex;
          flex-direction: column;
        }
        .tab-summary-head {
          display: grid;
          grid-template-columns: 55% 15% 15% 15%;
          height: 30px;
          line-height: 30px;
          align-items: center;
          background-color: white;
        }
        .tree-row-tr {
          display: flex;
          height: 30px;
          line-height: 30px;
          align-items: center;
          background-color: white;
          width: 100%;
        }
        .tree-row-tr:hover {
          background-color: #DEEDFF;
        }
        .tree-row-tr:nth-last-child(1):hover {
          background-color: white;
        }
        .head-label, .head-count {
          white-space: nowrap;
          overflow: hidden;
          font-weight: bold;
        }
        .row-name-td {
          white-space: nowrap;
          overflow-y: hidden;
          display: inline-block;
          margin-right: 15px;
          height: 30px;
        }
        tr {
          height: 30px;
        }
        .row-name-td::-webkit-scrollbar {
          display: none;
        }
        .log-tree-table {
          display: grid;
          overflow: hidden;
          grid-template-rows: repeat(auto-fit, 30px);
          position: sticky;
          top: 0;
        }
        .log-tree-table:hover{
          overflow-x: auto;
        }
        </style>
        <div class="tab-summary-head">
          <div style="justify-content: flex-start; display: flex">
            <div class="expansion-div" style="display: grid;">
              <lit-icon class="expansion-up-icon" name="up"></lit-icon>
              <lit-icon class="expansion-down-icon" name="down"></lit-icon>
            </div>
            <label class="head-label" style="cursor: pointer;">ParentStage</label>
            <label class="head-label" style="cursor: pointer;">->Stage</label>
            <label class="head-label" style="cursor: pointer;">->Timestamp</label>
          </div>
          <label class="head-count">RSS</label> 
          <label class="head-count">Heap Total</label> 
          <label class="head-count">Heap Used</label>
        </div>
        <div id="tab-summary" style="overflow: auto;display: grid;grid-template-columns: 55% 15% 15% 15%;"></div>
        `;
