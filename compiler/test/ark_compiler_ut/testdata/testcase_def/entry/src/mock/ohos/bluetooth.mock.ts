/**
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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
enum BluetoothState {
    STATE_OFF = 0,
    STATE_TURNING_ON = 1,
    STATE_ON = 2,
    STATE_TURNING_OFF = 3,
    STATE_BLE_TURNING_ON = 4,
    STATE_BLE_ON = 5,
    STATE_BLE_TURNING_OFF = 6,
}

const MockBluetooth = {
    'getState': () => {
        return BluetoothState.STATE_ON;
    },
    'replaceUrl': () => {
        return "replaceUrl";
    }
};

export default MockBluetooth;
