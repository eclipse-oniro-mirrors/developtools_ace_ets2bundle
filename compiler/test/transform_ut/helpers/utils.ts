/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
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
import path from "path";
import fs from "fs";

export function scanFiles(filepath: string, fileList: Set<string>) {
	if (!fs.existsSync(filepath)) {
		return;
	}
	const files = fs.readdirSync(filepath);
	files.forEach((file) => {
		const child = path.join(filepath, file);
		const stat = fs.statSync(child);
		if (stat.isDirectory()) {
			scanFiles(child, fileList);
		} else {
			if (child.includes("mock")) {
				return;
			}
			fileList.add(child);
		}
	});
}

export function scanFileNames(filepath: string, fileList: Set<string>) {
	if (!fs.existsSync(filepath)) {
		return;
	}
	const files = fs.readdirSync(filepath);
	files.forEach((file) => {
		const child = path.join(filepath, file);
		const stat = fs.statSync(child);
		if (stat.isDirectory()) {
			scanFiles(child, fileList);
		} else {
			if (child.includes("mock")) {
				return;
			}
			fileList.add(path.basename(child));
		}
	});
}
