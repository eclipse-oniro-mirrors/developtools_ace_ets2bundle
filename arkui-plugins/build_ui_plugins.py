#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Copyright (c) 2025 Huawei Device Co., Ltd.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import argparse
import os
import shutil
import subprocess
import sys
import tarfile
import time
import tempfile
from pathlib import Path


def depfile_escape(value):
    return value.replace('\\', '\\\\').replace('$', '$$').replace(' ', '\\ ').replace('#', '\\#').replace(':', '\\:')


def add_directory_dependencies(directory, names, generated, dependencies):
    for name in names:
        path = directory / name
        if path == generated:
            continue
        if path.exists():
            dependencies.add(path)
        else:
            # Ninja follows links. Track the containing directory for
            # an optional/broken link instead of declaring a missing input.
            dependencies.add(path.parent)


def write_input_depfile(options):
    if not options.depfile:
        return
    source = Path(options.source_path).absolute()
    dependencies = {source, Path(__file__).absolute()}
    roots = [source, source.parent / 'compiler/components',
             source.parent / 'compiler/insight_intents/schema']
    roots += getattr(options, 'runtime_dependency_roots', [])
    for name in ('id_defined_json', 'sys_resource_script'):
        value = getattr(options, name)
        if value:
            dependencies.add(Path(value).absolute())
    # Follow package links while visiting each real directory once. Generated
    # plugin lib is an output of this action and must never become an input.
    visited = set()
    generated = source / 'lib'
    for root in roots:
        if not root.exists():
            parent = root.parent
            while not parent.exists() and parent != parent.parent:
                parent = parent.parent
            dependencies.add(parent)
            continue
        for parent, directories, files in os.walk(root, followlinks=True):
            directory = Path(parent)
            resolved = directory.resolve()
            if resolved == generated.resolve() or resolved in visited:
                directories[:] = []
                continue
            visited.add(resolved)
            dependencies.add(directory)
            add_directory_dependencies(directory, directories + files,
                                       generated, dependencies)
    depfile = Path(options.depfile)
    depfile.parent.mkdir(parents=True, exist_ok=True)
    target = depfile_escape(os.path.relpath(options.output_path))
    entries = ' '.join(depfile_escape(os.path.relpath(path)) for path in sorted(dependencies))
    depfile.write_text(target + ': ' + entries + '\n')


def copy_files(source_path, dest_path, is_file=False):
    try:
        if is_file or os.path.isfile(source_path):
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            shutil.copy(source_path, dest_path)
        else:
            shutil.copytree(source_path, dest_path, dirs_exist_ok=True,
                symlinks=True)
    except Exception as err:
        raise Exception("Copy files failed. Error: " + str(err)) from err


def run_cmd(cmd, execution_path=None):
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE,
                           stdin=subprocess.PIPE,
                           stderr=subprocess.PIPE,
                           cwd=execution_path)
    stdout, stderr = proc.communicate(timeout=1000)
    if proc.returncode != 0:
        raise Exception(stderr.decode())


def build(options):
    build_cmd = [options.npm, 'run', 'compile:plugins']
    if getattr(options, 'compiled_lib', None):
        build_cmd += ['--', '--out-dir', options.compiled_lib]
    run_cmd(build_cmd, options.source_path)
    if getattr(options, 'compiled_lib', None):
        # Preserve the existing generated source/lib side effect for callers
        # that use it, while publishing only this invocation's fresh payload.
        copy_files(options.compiled_lib, os.path.join(options.source_path, 'lib'))


def copy_runtime_deps(source_path, output_path, deps):
    """Copy specific npm packages and their dependencies."""
    copied = []
    for dep in deps:
        # Try to copy from arkui-plugins' node_modules first
        dep_path = os.path.join(source_path, 'node_modules', dep)
        # If not found, try to copy from compiler's node_modules
        if not os.path.exists(dep_path):
            dep_path = os.path.join(source_path, '../compiler/node_modules', dep)
        
        if os.path.exists(dep_path):
            dest_path = os.path.join(output_path, 'node_modules', dep)
            try:
                copy_files(dep_path, dest_path)
                copied.append(Path(dep_path))
            except Exception as e:
                print(f"Warning: Failed to copy {dep}: {e}")
    return copied


def copy_output(options):
    run_cmd(['rm', '-rf', options.output_path])
    copy_files(getattr(options, 'compiled_lib', os.path.join(options.source_path, 'lib')),
               os.path.join(options.output_path, 'lib'))

    copy_files(os.path.join(options.source_path, '../compiler/components'),
               os.path.join(options.output_path, 'lib/components'))

    # Copy InsightIntent schemas and configurations
    insight_intents_src = os.path.join(options.source_path, '../compiler/insight_intents/schema')
    if os.path.exists(insight_intents_src):
        copy_files(insight_intents_src,
                   os.path.join(options.output_path, 'lib/insight_intents/schema'))

    copy_files(os.path.join(options.source_path, 'package.json'),
               os.path.join(options.output_path, 'package.json'), True)

    # Copy specific runtime dependencies to avoid SDK packaging issues
    # Only copy necessary packages instead of entire node_modules
    # These will be copied from either arkui-plugins or compiler's node_modules
    runtime_deps = [
        'ajv',
        'fast-deep-equal',  # ajv dependency
        'fast-uri',  # ajv dependency
        'json-schema-traverse',  # ajv dependency
        'require-from-string',  # ajv dependency
        'json5',  # JSON5 parser used by plugin source
    ]
    options.runtime_dependency_roots = copy_runtime_deps(
        options.source_path, options.output_path, runtime_deps)

    # Update output path timestamp for incremental build
    current_time = time.time()
    os.utime(options.output_path, (current_time, current_time))


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--npm', help='path to a npm exetuable')
    parser.add_argument('--source_path', help='path to build system source')
    parser.add_argument('--output_path', help='path to output')
    parser.add_argument('--root_out_dir', help='path to root out')
    parser.add_argument('--current_os', help='current_os')
    parser.add_argument('--id_defined_json', help='resource IDs to include in the plugin payload')
    parser.add_argument('--sys_resource_script', help='sysResource generator paired with resource IDs')
    parser.add_argument('--depfile', help='optional Ninja input dependency file')

    options = parser.parse_args()
    if bool(options.id_defined_json) != bool(options.sys_resource_script):
        parser.error('--id_defined_json and --sys_resource_script must be supplied together')
    return options


def main():
    options = parse_args()

    output_parent = os.path.dirname(os.path.abspath(options.output_path))
    os.makedirs(output_parent, exist_ok=True)
    # A private fresh directory prevents deleted TS sources from leaving stale
    # JS files in the SDK and avoids cleaning another toolchain's source/lib.
    with tempfile.TemporaryDirectory(prefix='.ui-plugins-', dir=output_parent) as temporary:
        options.compiled_lib = os.path.join(temporary, 'lib')
        build(options)
        if options.id_defined_json:
            run_cmd([sys.executable, options.sys_resource_script,
                     '--input-json', options.id_defined_json,
                     '--output-js', os.path.join(options.compiled_lib, 'ui-plugins/sysResource.js')])
        copy_output(options)
        write_input_depfile(options)


if __name__ == '__main__':
    sys.exit(main())
