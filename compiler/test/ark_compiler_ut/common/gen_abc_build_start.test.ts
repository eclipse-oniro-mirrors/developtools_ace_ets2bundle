/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import fs from 'fs';
import os from 'os';
import path from 'path';
import mocha from 'mocha';
import sinon from 'sinon';
import { expect } from 'chai';

import { genAbc } from '../../../lib/fast_build/ark_compiler/rollup-plugin-gen-abc';
import { checkArkCompilerCacheInfo } from '../../../lib/fast_build/ark_compiler/cache';
import * as arkConfig from '../../../lib/fast_build/ark_compiler/common/process_ark_config';
import { SourceMapGenerator } from '../../../lib/fast_build/ark_compiler/generate_sourcemap';
import { PreloadFileModules } from '../../../lib/fast_build/ark_compiler/module/module_preload_file_utils';
import {
  ARK_COMPILER_META_INFO,
  IS_CACHE_INVALID,
  ESMODULE,
  JSBUNDLE
} from '../../../lib/fast_build/ark_compiler/common/ark_define';
import { AnalyzeMode, CompileEvent } from '../../../lib/performance';
import { TRANSFORMED_MOCK_CONFIG, USER_DEFINE_MOCK_CONFIG } from '../../../lib/pre_define';

const BUILD_EVENT: string = 'genAbcBuildStart';
const CACHE_EVENT: string = 'checkArkCompilerCacheInfo';
const META_EVENT: string = 'getMetaInfo';
const MOCK_EVENT: string = 'isMockConfigModified';
const CACHE_HIT_EVENT: string = 'cache hit';
const CACHE_MISS_EVENT: string = 'cache miss';

interface RecordedEvent extends CompileEvent {
  name: string;
  parent?: RecordedEvent;
}

interface BuildContext {
  share: {
    projectConfig: {
      compileMode: string;
      compileSdkVersion: string;
      perf?: AnalyzeMode;
      isPreview?: boolean;
      isOhosTest?: boolean;
      cachePath?: string;
      mockParams?: { mockConfigPath?: string };
    };
    arkProjectConfig?: Object;
    getHookEventFactory?: sinon.SinonStub;
  };
  cache: { get: sinon.SinonStub; set: sinon.SinonStub };
}

function expectBefore(trace: string[], first: string, second: string): void {
  expect(trace.indexOf(first), `${first} was executed`).to.be.at.least(0);
  expect(trace.indexOf(second), `${second} was executed`).to.be.at.least(0);
  expect(trace.indexOf(first), `${first} precedes ${second}`).to.be.lessThan(trace.indexOf(second));
}

class BuildStartFixture {
  readonly trace: string[] = [];
  readonly events: RecordedEvent[] = [];
  readonly values: Map<string, string | boolean> = new Map();
  readonly plugin = genAbc();
  readonly configStub: sinon.SinonStub;
  readonly sourceMapStub: sinon.SinonStub;
  readonly preloadStub: sinon.SinonStub;
  readonly factoryStub: sinon.SinonStub;
  readonly context: BuildContext;

  constructor(sandbox: sinon.SinonSandbox) {
    this.factoryStub = sandbox.stub().callsFake(() => ({
      createEvent: (name: string) => this.createEvent(name)
    }));
    this.context = {
      share: {
        projectConfig: { compileMode: ESMODULE, compileSdkVersion: '12', perf: AnalyzeMode.TRACE },
        getHookEventFactory: this.factoryStub
      },
      cache: {
        get: sandbox.stub().callsFake((key: string) => {
          this.trace.push(`get:${key}`);
          return this.values.get(key);
        }),
        set: sandbox.stub().callsFake((key: string, value: string | boolean) => {
          this.trace.push(`set:${key}`);
          this.values.set(key, value);
        })
      }
    };
    this.configStub = sandbox.stub(arkConfig, 'initArkProjectConfig').callsFake(() => {
      this.trace.push('config');
      return {};
    });
    this.sourceMapStub = sandbox.stub(SourceMapGenerator, 'init').callsFake(() => {
      this.trace.push('sourceMap');
    });
    this.preloadStub = sandbox.stub(PreloadFileModules, 'initialize').callsFake(() => {
      this.trace.push('preload');
    });
  }

  private createEvent(name: string, parent?: RecordedEvent): RecordedEvent {
    const event: RecordedEvent = {
      name,
      parent,
      createEvent: (childName: string) => this.createEvent(childName, event),
      createSubEvent: (childName: string) => this.createEvent(childName, event),
      start: () => {
        this.trace.push(`start:${name}`);
      },
      stop: () => {
        this.trace.push(`stop:${name}`);
      },
      setTotalTime: () => {}
    };
    this.events.push(event);
    return event;
  }

  build(): boolean {
    this.plugin.buildStart.call(this.context);
    return this.plugin.shouldInvalidCache.call(this.context);
  }

  startParentEvent(): RecordedEvent {
    const event: RecordedEvent = this.createEvent(BUILD_EVENT);
    event.start();
    return event;
  }

  expectInitialized(): void {
    expectBefore(this.trace, 'config', `get:${ARK_COMPILER_META_INFO}`);
    expectBefore(this.trace, `set:${ARK_COMPILER_META_INFO}`, 'sourceMap');
    expectBefore(this.trace, 'sourceMap', 'preload');
    expect(this.sourceMapStub.calledWithExactly(this.context)).to.be.true;
    expect(this.preloadStub.calledWithExactly(this.context)).to.be.true;
  }

  expectCacheEventsClosed(mockChecked: boolean = false, cacheHit: boolean = false): void {
    const stoppedEvents: string[] = [META_EVENT];
    if (mockChecked) {
      stoppedEvents.push(MOCK_EVENT);
    }
    stoppedEvents.push(cacheHit ? CACHE_HIT_EVENT : CACHE_MISS_EVENT, CACHE_EVENT, BUILD_EVENT);
    expect(this.trace.filter(entry => entry.startsWith('stop:'))).to.deep.equal(
      stoppedEvents.map(name => `stop:${name}`)
    );
  }

  expectMockCheckStopped(cacheHit: boolean): void {
    const mockEvents: RecordedEvent[] = this.events.filter(event => event.name === MOCK_EVENT);
    const cacheEvents: RecordedEvent[] = this.events.filter(event => event.name === CACHE_EVENT);
    expect(mockEvents).not.to.have.lengthOf(0);
    expect(mockEvents[mockEvents.length - 1].parent).to.equal(cacheEvents[cacheEvents.length - 1]);
    expect(this.trace.filter(entry => entry.endsWith(`:${MOCK_EVENT}`))).to.deep.equal([
      `start:${MOCK_EVENT}`, `stop:${MOCK_EVENT}`
    ]);
    expectBefore(this.trace, `get:${ARK_COMPILER_META_INFO}`, `start:${MOCK_EVENT}`);
    expectBefore(this.trace, `stop:${MOCK_EVENT}`, `set:${ARK_COMPILER_META_INFO}`);
    this.expectCacheEventsClosed(true, cacheHit);
    this.expectCacheResult(cacheHit);
  }

  expectCacheResult(cacheHit: boolean): void {
    const cacheEvents: RecordedEvent[] = this.events.filter(event => event.name === CACHE_EVENT);
    const currentCacheEvent: RecordedEvent = cacheEvents[cacheEvents.length - 1];
    const results: RecordedEvent[] = this.events.filter(event =>
      (event.name === CACHE_HIT_EVENT || event.name === CACHE_MISS_EVENT) && event.parent === currentCacheEvent);
    const eventName: string = cacheHit ? CACHE_HIT_EVENT : CACHE_MISS_EVENT;
    expect(results.map(event => event.name)).to.deep.equal([eventName]);
    const currentTrace: string[] = this.trace.slice(this.trace.lastIndexOf(`start:${CACHE_EVENT}`));
    expectBefore(currentTrace, `set:${ARK_COMPILER_META_INFO}`, `start:${eventName}`);
    expectBefore(currentTrace, `start:${eventName}`, `stop:${eventName}`);
    expectBefore(currentTrace, `stop:${eventName}`, `stop:${CACHE_EVENT}`);
  }

  expectNoCacheResult(): void {
    const cacheEvents: RecordedEvent[] = this.events.filter(event => event.name === CACHE_EVENT);
    const currentCacheEvent: RecordedEvent = cacheEvents[cacheEvents.length - 1];
    const currentEvents: RecordedEvent[] = currentCacheEvent ? this.events.slice(this.events.lastIndexOf(currentCacheEvent)) : this.events;
    expect(currentEvents.filter(event => event.name === CACHE_HIT_EVENT || event.name === CACHE_MISS_EVENT)).to.have.lengthOf(0);
  }
}

let sandbox: sinon.SinonSandbox;
let fixture: BuildStartFixture;
let mockDirectories: string[];

function prepareMockConfig(mode: 'isPreview' | 'isOhosTest'): string {
  const directory: string = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-abc-cache-performance-'));
  mockDirectories.push(directory);
  const inputPath: string = path.join(directory, 'project-mock.json5');
  fs.writeFileSync(inputPath, '{ source: "original" }');
  fs.writeFileSync(path.join(directory, USER_DEFINE_MOCK_CONFIG), '{ source: "original" }');
  fs.writeFileSync(path.join(directory, TRANSFORMED_MOCK_CONFIG), '{}');
  Object.assign(fixture.context.share.projectConfig, {
    [mode]: true,
    cachePath: directory,
    mockParams: { mockConfigPath: inputPath }
  });
  return inputPath;
}

function registerPerformanceCases(): void {
  [AnalyzeMode.TRACE, AnalyzeMode.VERBOSE].forEach(mode => {
    mocha.it(`records cache work inside the buildStart event in ${AnalyzeMode[mode]} mode`, function() {
      fixture.context.share.projectConfig.perf = mode;
      expect(fixture.build()).to.be.true;
      expect(fixture.factoryStub.calledOnceWithExactly('genAbc', 'buildStart')).to.be.true;
      expect(fixture.events.map(event => event.name)).to.deep.equal([BUILD_EVENT, CACHE_EVENT, META_EVENT, CACHE_MISS_EVENT]);
      expect(fixture.events[1].parent).to.equal(fixture.events[0]);
      expect(fixture.events[2].parent).to.equal(fixture.events[1]);
      expectBefore(fixture.trace, `start:${BUILD_EVENT}`, 'config');
      expectBefore(fixture.trace, 'config', `start:${CACHE_EVENT}`);
      expectBefore(fixture.trace, `start:${CACHE_EVENT}`, `get:${ARK_COMPILER_META_INFO}`);
      expectBefore(fixture.trace, `set:${ARK_COMPILER_META_INFO}`, `stop:${CACHE_EVENT}`);
      expectBefore(fixture.trace, `stop:${CACHE_EVENT}`, 'sourceMap');
      expectBefore(fixture.trace, 'preload', `stop:${BUILD_EVENT}`);
      fixture.expectInitialized();
      fixture.expectCacheEventsClosed();
      fixture.expectCacheResult(false);
    });
  });

  [AnalyzeMode.DEFAULT, AnalyzeMode.FALSE, undefined].forEach(mode => {
    mocha.it(`keeps cache computation and initialization working with performance mode ${mode}`, function() {
      fixture.context.share.projectConfig.perf = mode;
      expect(fixture.build()).to.be.true;
      expect(fixture.factoryStub.called).to.be.false;
      expect(fixture.events).to.have.lengthOf(0);
      fixture.expectInitialized();
    });
  });
}

function registerFactoryFallbackCases(): void {
  mocha.it('initializes without a host event factory', function() {
    delete fixture.context.share.getHookEventFactory;
    expect(fixture.build()).to.be.true;
    expect(fixture.events).to.have.lengthOf(0);
    fixture.expectInitialized();
  });

  [undefined, null].forEach(value => {
    mocha.it(`initializes when the host event factory returns ${value}`, function() {
      fixture.factoryStub.returns(value);
      expect(fixture.build()).to.be.true;
      expect(fixture.factoryStub.calledOnce).to.be.true;
      expect(fixture.events).to.have.lengthOf(0);
      fixture.expectInitialized();
    });
  });
}

function registerCacheCases(): void {
  [ESMODULE, JSBUNDLE].forEach(mode => {
    mocha.it(`preserves cache results and creates fresh events across ${mode} builds`, function() {
      fixture.context.share.projectConfig.compileMode = mode;
      expect(fixture.build()).to.be.true;
      const firstMeta = fixture.values.get(ARK_COMPILER_META_INFO);
      expect(firstMeta).to.be.a('string');
      expect(fixture.values.get(IS_CACHE_INVALID)).to.be.true;
      fixture.expectCacheResult(false);
      expect(fixture.events.filter(event => event.name === MOCK_EVENT)).to.have.lengthOf(0);
      fixture.trace.length = 0;
      expect(fixture.build()).to.be.false;
      expect(fixture.values.get(ARK_COMPILER_META_INFO)).to.equal(firstMeta);
      fixture.expectMockCheckStopped(true);
      expect(fixture.values.get(IS_CACHE_INVALID)).to.be.true;
      fixture.context.share.projectConfig.compileSdkVersion = '13';
      expect(fixture.build()).to.be.true;
      expect(fixture.values.get(ARK_COMPILER_META_INFO)).not.to.equal(firstMeta);
      fixture.expectCacheResult(false);
      expect(fixture.events.filter(event => event.name === MOCK_EVENT)).to.have.lengthOf(1);
      expect(fixture.events).to.have.lengthOf(13);
      expect(new Set(fixture.events).size).to.equal(13);
      fixture.events.filter(event => event.name === CACHE_EVENT).forEach(event => {
        expect(event.parent.name).to.equal(BUILD_EVENT);
      });
      fixture.events.filter(event => event.name === META_EVENT).forEach(event => {
        expect(event.parent.name).to.equal(CACHE_EVENT);
      });
    });
  });

  mocha.it('keeps the cache result unchanged when performance collection is switched off and on', function() {
    expect(fixture.build()).to.be.true;
    fixture.expectCacheResult(false);
    const meta = fixture.values.get(ARK_COMPILER_META_INFO);
    fixture.context.share.projectConfig.perf = AnalyzeMode.FALSE;
    expect(fixture.build()).to.be.false;
    expect(fixture.events).to.have.lengthOf(4);
    fixture.context.share.projectConfig.perf = AnalyzeMode.VERBOSE;
    expect(fixture.build()).to.be.false;
    expect(fixture.values.get(ARK_COMPILER_META_INFO)).to.equal(meta);
    expect(fixture.events).to.have.lengthOf(9);
    fixture.expectCacheResult(true);
  });
}

function registerMockCases(): void {
  const modes: Array<'isPreview' | 'isOhosTest'> = ['isPreview', 'isOhosTest'];
  modes.forEach(mode => {
    mocha.it(`detects changed Mock configuration in ${mode}`, function() {
      const inputPath: string = prepareMockConfig(mode);
      expect(fixture.build()).to.be.true;
      fixture.expectCacheResult(false);
      fixture.trace.length = 0;
      expect(fixture.build()).to.be.false;
      fixture.expectMockCheckStopped(true);
      fs.writeFileSync(inputPath, '{ source: "changed" }');
      fixture.trace.length = 0;
      expect(fixture.build()).to.be.true;
      fixture.expectMockCheckStopped(false);
      fixture.expectInitialized();
    });
  });

  mocha.it('propagates a malformed Mock configuration without initializing output stages', function() {
    const inputPath: string = prepareMockConfig('isPreview');
    fixture.build();
    fs.writeFileSync(inputPath, '{ source: ');
    fixture.trace.length = 0;
    fixture.sourceMapStub.resetHistory();
    fixture.preloadStub.resetHistory();
    expect(() => fixture.build()).to.throw(SyntaxError);
    fixture.expectNoCacheResult();
    expect(fixture.sourceMapStub.called).to.be.false;
    expect(fixture.preloadStub.called).to.be.false;
  });
}

function registerMetaEventCase(): void {
  mocha.it('records configuration reads and the resulting meta before consulting the cache', function() {
    Object.defineProperty(fixture.context.share.projectConfig, 'compileSdkVersion', {
      configurable: true,
      get: () => {
        fixture.trace.push('read:compileSdkVersion');
        return '12';
      }
    });
    expect(fixture.build()).to.be.true;
    const meta = fixture.values.get(ARK_COMPILER_META_INFO);
    expect(meta).to.be.a('string');
    expect(String(meta).split(':')[0]).to.equal('12');
    expectBefore(fixture.trace, `start:${CACHE_EVENT}`, `start:${META_EVENT}`);
    expectBefore(fixture.trace, `start:${META_EVENT}`, 'read:compileSdkVersion');
    expect(fixture.trace.lastIndexOf('read:compileSdkVersion')).to.be.lessThan(fixture.trace.indexOf(`stop:${META_EVENT}`));
    expectBefore(fixture.trace, `stop:${META_EVENT}`, `get:${ARK_COMPILER_META_INFO}`);
    expect(fixture.trace.filter(entry => entry.endsWith(`:${META_EVENT}`))).to.deep.equal([
      `start:${META_EVENT}`, `stop:${META_EVENT}`
    ]);
    expect(fixture.events.find(event => event.name === META_EVENT).parent.name).to.equal(CACHE_EVENT);
  });
}

function registerMockEarlyReturnCases(): void {
  const configurations: Array<{ mockConfigPath?: string } | undefined> = [undefined, {}];
  configurations.forEach((mockParams, index) => {
    mocha.it(`ends Mock checking with no ${index === 0 ? 'configuration' : 'configuration path'}`, function() {
      fixture.context.share.projectConfig.isPreview = true;
      fixture.context.share.projectConfig.mockParams = mockParams;
      expect(fixture.build()).to.be.true;
      fixture.trace.length = 0;
      expect(fixture.build()).to.be.false;
      fixture.expectMockCheckStopped(true);
    });
  });

  [USER_DEFINE_MOCK_CONFIG, TRANSFORMED_MOCK_CONFIG].forEach(missingFile => {
    mocha.it(`ends Mock checking and invalidates the cache when ${missingFile} is missing`, function() {
      const inputPath: string = prepareMockConfig('isPreview');
      expect(fixture.build()).to.be.true;
      fs.unlinkSync(path.join(path.dirname(inputPath), missingFile));
      fixture.trace.length = 0;
      expect(fixture.build()).to.be.true;
      fixture.expectMockCheckStopped(false);
    });
  });
}

function registerDirectCacheCases(): void {
  mocha.it('times direct cache computation under the supplied parent event', function() {
    fixture.context.share.arkProjectConfig = {};
    const parentEvent: RecordedEvent = fixture.startParentEvent();
    checkArkCompilerCacheInfo(fixture.context, parentEvent);
    expect(fixture.plugin.shouldInvalidCache.call(fixture.context)).to.be.true;
    const firstMeta = fixture.values.get(ARK_COMPILER_META_INFO);
    expect(firstMeta).to.be.a('string');
    expect(fixture.values.get(IS_CACHE_INVALID)).to.be.true;
    fixture.expectCacheResult(false);
    checkArkCompilerCacheInfo(fixture.context, parentEvent);
    expect(fixture.plugin.shouldInvalidCache.call(fixture.context)).to.be.false;
    expect(fixture.values.get(ARK_COMPILER_META_INFO)).to.equal(firstMeta);
    fixture.expectCacheResult(true);
    parentEvent.stop();
    expect(fixture.events.map(event => event.name)).to.deep.equal([
      BUILD_EVENT, CACHE_EVENT, META_EVENT, CACHE_MISS_EVENT, CACHE_EVENT, META_EVENT, MOCK_EVENT, CACHE_HIT_EVENT
    ]);
    fixture.events.filter(event => event.name === CACHE_EVENT).forEach(event => {
      expect(event.parent).to.equal(parentEvent);
    });
    expectBefore(fixture.trace, `start:${CACHE_EVENT}`, `get:${ARK_COMPILER_META_INFO}`);
    expectBefore(fixture.trace, `set:${ARK_COMPILER_META_INFO}`, `stop:${CACHE_EVENT}`);
    expect(fixture.trace.filter(entry => entry.endsWith(`:${CACHE_EVENT}`))).to.deep.equal([
      `start:${CACHE_EVENT}`, `stop:${CACHE_EVENT}`, `start:${CACHE_EVENT}`, `stop:${CACHE_EVENT}`
    ]);
    expect(fixture.factoryStub.called).to.be.false;
    expect(fixture.configStub.called).to.be.false;
  });

  mocha.it('preserves the single-argument cache API without obtaining a hook event factory', function() {
    fixture.context.share.arkProjectConfig = {};
    checkArkCompilerCacheInfo(fixture.context);
    expect(fixture.plugin.shouldInvalidCache.call(fixture.context)).to.be.true;
    const firstMeta = fixture.values.get(ARK_COMPILER_META_INFO);
    expect(firstMeta).to.be.a('string');
    checkArkCompilerCacheInfo(fixture.context);
    expect(fixture.plugin.shouldInvalidCache.call(fixture.context)).to.be.false;
    expect(fixture.values.get(ARK_COMPILER_META_INFO)).to.equal(firstMeta);
    expect(fixture.factoryStub.called).to.be.false;
    expect(fixture.events).to.have.lengthOf(0);
    expect(fixture.configStub.called).to.be.false;
    expect(fixture.sourceMapStub.called).to.be.false;
    expect(fixture.preloadStub.called).to.be.false;
  });
}

function registerCacheResultFailureCase(): void {
  mocha.it('does not report a cache hit when writing the final meta fails', function() {
    expect(fixture.build()).to.be.true;
    fixture.trace.length = 0;
    fixture.sourceMapStub.resetHistory();
    fixture.preloadStub.resetHistory();
    const error = new Error('meta write failed');
    fixture.context.cache.set.withArgs(ARK_COMPILER_META_INFO).throws(error);
    expect(() => fixture.build()).to.throw(error);
    fixture.expectNoCacheResult();
    expect(fixture.values.get(IS_CACHE_INVALID)).to.be.true;
    expect(fixture.sourceMapStub.called).to.be.false;
    expect(fixture.preloadStub.called).to.be.false;
  });
}

function registerFailureCases(): void {
  mocha.it('preserves a project configuration error without executing later stages', function() {
    const error = new Error('configuration initialization failed');
    fixture.configStub.throws(error);
    expect(() => fixture.build()).to.throw(error);
    fixture.expectNoCacheResult();
    expect(fixture.context.cache.get.called).to.be.false;
    expect(fixture.context.cache.set.called).to.be.false;
    expect(fixture.sourceMapStub.called).to.be.false;
    expect(fixture.preloadStub.called).to.be.false;
  });

  const operations: Array<'get' | 'set'> = ['get', 'set'];
  operations.forEach(operation => {
    mocha.it(`preserves the cache ${operation} error without initializing output stages`, function() {
      const error = new Error(`cache ${operation} failed`);
      fixture.context.cache[operation].throws(error);
      expect(() => fixture.build()).to.throw(error);
      fixture.expectNoCacheResult();
      expect(fixture.sourceMapStub.called).to.be.false;
      expect(fixture.preloadStub.called).to.be.false;
    });
  });

  ['sourceMap', 'preload'].forEach(stage => {
    mocha.it(`preserves a ${stage} initialization error after the cache check completes`, function() {
      const error = new Error(`${stage} initialization failed`);
      const failingStub = stage === 'sourceMap' ? fixture.sourceMapStub : fixture.preloadStub;
      failingStub.throws(error);
      expect(() => fixture.build()).to.throw(error);
      fixture.expectCacheResult(false);
      expect(fixture.trace).to.include(`stop:${CACHE_EVENT}`);
      expect(fixture.plugin.shouldInvalidCache.call(fixture.context)).to.be.true;
      if (stage === 'sourceMap') {
        expect(fixture.preloadStub.called).to.be.false;
      } else {
        expect(fixture.sourceMapStub.calledOnce).to.be.true;
      }
    });
  });
}

mocha.describe('genAbc buildStart cache performance', function() {
  mocha.beforeEach(function() {
    sandbox = sinon.createSandbox();
    mockDirectories = [];
    fixture = new BuildStartFixture(sandbox);
  });

  mocha.afterEach(function() {
    sandbox.restore();
    mockDirectories.forEach(directory => fs.rmSync(directory, { recursive: true, force: true }));
  });

  registerPerformanceCases();
  registerFactoryFallbackCases();
  registerCacheCases();
  registerMockCases();
  registerMetaEventCase();
  registerMockEarlyReturnCases();
  registerDirectCacheCases();
  registerCacheResultFailureCase();
  registerFailureCases();
});
