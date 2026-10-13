/*
 * Copyright (c) 2025-2026 Huawei Device Co., Ltd.
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

import * as path from 'path';
import { PluginTester } from '../../../utils/plugin-tester';
import { mockBuildConfig } from '../../../utils/artkts-config';
import { getRootPath, MOCK_ENTRY_DIR_PATH } from '../../../utils/path-config';
import { parseDumpSrc } from '../../../utils/parse-string';
import { collectNoRecheck, uiNoRecheck, memoNoRecheck, recheck } from '../../../utils/plugins';
import { BuildConfig, PluginTestContext } from '../../../utils/shared-types';
import { uiTransform } from '../../../../ui-plugins';
import { Plugins } from '../../../../common/plugin-context';

const ADVANCED_UI_COMPONENTS_DIR_PATH: string = 'advanced-ui-components';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(
        getRootPath(),
        MOCK_ENTRY_DIR_PATH,
        ADVANCED_UI_COMPONENTS_DIR_PATH,
        'mock-popup.ets'
    ),
];

const pluginTester = new PluginTester('test advanced-ui-components mock-popup', buildConfig);

const parsedTransform: Plugins = {
    name: 'mock-popup-parsed',
    parsed: uiTransform().parsed,
};

const expectedScript: string = `
import { MemoSkip } from "arkui.incremental.annotation";

import { IPropRefDecoratedVariable } from "arkui.stateManagement.decorator";

import { STATE_MGMT_FACTORY } from "arkui.component.customComponent";

import { IStateDecoratedVariable } from "arkui.stateManagement.decorator";

import { ImageImpl } from "arkui.component.image";

import { ImageAttribute } from "arkui.component.image";

import { Memo } from "arkui.incremental.annotation";

import { SymbolGlyphImpl } from "arkui.component.symbolglyph";

import { SymbolGlyphAttribute } from "arkui.component.symbolglyph";

import { TextImpl } from "arkui.component.text";

import { TextAttribute } from "arkui.component.text";

import { ButtonImpl } from "arkui.component.button";

import { ButtonAttribute } from "arkui.component.button";

import { FlexImpl } from "arkui.component.flex";

import { FlexAttribute } from "arkui.component.flex";

import { ScrollImpl } from "arkui.component.scroll";

import { ScrollAttribute } from "arkui.component.scroll";

import { ColumnImpl } from "arkui.component.column";

import { ColumnAttribute } from "arkui.component.column";

import { RowImpl } from "arkui.component.row";

import { RowAttribute } from "arkui.component.row";

import { MemoIntrinsic } from "arkui.incremental.annotation";

import { Memo } from "arkui.incremental.annotation";

import { ComponentBuilder } from "arkui.component.builder";

import { LocalStorage } from "arkui.stateManagement.storage.localStorage";

import { Builder } from "arkui.component.builder";

import { CustomComponent } from "arkui.component.customComponent";

import { ReusePoolOwnership } from "arkui.component.customComponent";

import display from "@ohos.display";

import { Alignment, BarState, BorderRadiuses, Builder, Button, ButtonType, Color, Column, Component, ConstraintSizeOptions, ColorContent, Context, Dimension, Direction, EdgeEffect, Flex, FlexWrap, FontWeight, Image, ItemAlign, Length, LocalizedMargin, LocalizedPadding, Resource, ResourceColor, ResourceStr, Row, Scroll, ScrollDirection, SizeOptions, SymbolGlyph, Text, TextAlign, TextOverflow, VerticalAlign, VoidCallback, $r } from "@ohos.arkui.component";

import { SymbolGlyphModifier } from "@ohos.arkui.modifier";

import { Theme } from "@ohos.arkui.theme";

import { State, Watch, PropRef } from "@ohos.arkui.stateManagement";

import { LengthMetrics, LengthUnit } from "@ohos.arkui.node";

import systemDateTime from "@ohos.systemDateTime";

import resourceManager from "@ohos.resourceManager";

import mediaQuery from "@ohos.mediaquery";

import I18n from "@ohos.i18n";

const RESOURCE_TYPE_STRING = 10003;
const RESOURCE_TYPE_FLOAT = 10002;
const RESOURCE_TYPE_INTEGER = 10007;
const RESOURCE_TYPE_MEDIA = 20000;
const RESOURCE_TYPE_RAWFILE = 30000;
const RESOURCE_TYPE_SYMBOL = 40000;
const defaultTheme: PopupTheme = {
  icon: {
    size: {
      width: 32,
      height: 32,
    },
    margin: {
      top: LengthMetrics.vp(12),
      bottom: LengthMetrics.vp(12),
      start: LengthMetrics.vp(12),
      end: LengthMetrics.vp(12),
    },
    fillColor: "",
    borderRadius: _r(16777216, 10003, "com.example.mock", "entry"),
  },
  title: {
    margin: {
      bottom: LengthMetrics.vp(2),
    },
    minFontSize: 12,
    fontWeight: FontWeight.Medium,
    fontSize: _r(16777216, 10003, "com.example.mock", "entry"),
    fontColor: _r(16777216, 10003, "com.example.mock", "entry"),
  },
  button: {
    margin: {
      top: LengthMetrics.vp(16),
      bottom: LengthMetrics.vp(16),
      start: LengthMetrics.vp(16),
      end: LengthMetrics.vp(16),
    },
    padding: {
      top: LengthMetrics.vp(4),
      bottom: LengthMetrics.vp(4),
      start: LengthMetrics.vp(4),
      end: LengthMetrics.vp(4),
    },
    fontSize: _r(16777216, 10003, "com.example.mock", "entry"),
    fontColor: _r(16777216, 10003, "com.example.mock", "entry"),
    textMargin: {
      top: LengthMetrics.vp(8),
      bottom: LengthMetrics.vp(8),
      start: LengthMetrics.vp(8),
      end: LengthMetrics.vp(8),
    },
    minFontSize: 9,
    fontWeight: FontWeight.Medium,
    hoverColor: _r(16777216, 10003, "com.example.mock", "entry"),
    backgroundColor: _r(16777216, 10003, "com.example.mock", "entry"),
  },
  message: {
    fontSize: _r(16777216, 10003, "com.example.mock", "entry"),
    fontColor: _r(16777216, 10003, "com.example.mock", "entry"),
    fontWeight: FontWeight.Regular,
    plainFontColor: _r(16777216, 10003, "com.example.mock", "entry"),
  },
  windows: {
    padding: {
      top: LengthMetrics.vp(12),
      bottom: LengthMetrics.vp(12),
      start: LengthMetrics.vp(12),
      end: LengthMetrics.vp(12),
    },
  },
  closeButton: {
    size: {
      width: 22,
      height: 22,
    },
    padding: {
      top: LengthMetrics.vp(2),
      bottom: LengthMetrics.vp(2),
      start: LengthMetrics.vp(2),
      end: LengthMetrics.vp(2),
    },
    margin: {
      top: LengthMetrics.vp(12),
      bottom: LengthMetrics.vp(12),
      start: LengthMetrics.vp(12),
      end: LengthMetrics.vp(12),
    },
    symbolStyle: new SymbolGlyphModifier(_r(16777216, 10003, "com.example.mock", "entry")),
    fillColor: _r(16777216, 10003, "com.example.mock", "entry"),
    hoverColor: _r(16777216, 10003, "com.example.mock", "entry"),
    backgroundColor: _r(16777216, 10003, "com.example.mock", "entry"),
    symbolSize: "18vp",
    accessibilityMessage: _r(16777216, 10003, "com.example.mock", "entry"),
  },
};
const noop = (() => {});
const POPUP_DEFAULT_MAXWIDTH = 400;
function main() {}

@Builder() 
@Memo() 
function Popup(@MemoSkip() options: PopupOptions) {
  PopupComponent._invoke(undefined, (() => {
    return {
      icon: options.icon,
      __options_has_icon: true,
      title: options.title,
      __options_has_title: true,
      message: ((options.message) ?? (({
        text: "",
      } as PopupTextOptions))),
      __options_has_message: true,
      popupDirection: options.direction,
      __options_has_popupDirection: true,
      showClose: options.showClose,
      __options_has_showClose: true,
      onClose: ((options.onClose) ?? (noop)),
      __options_has_onClose: true,
      buttons: options.buttons,
      __options_has_buttons: true,
      maxWidth: options.maxWidth,
      __options_has_maxWidth: true,
    };
  }), undefined, undefined, undefined);
}

function isValidString(dimension: string, regex: RegExp): boolean {
  const matches = dimension.match(regex);
  if (((!matches) || (((matches.length) < (3))))) {
    return false;
  }
  const value = Number.parseFloat((matches[1] as string));
  return ((value) >= (0));
}

function isValidDimensionString(dimension: string): boolean {
  return isValidString(dimension, new RegExp("(-?\\\\d+(?:\\\\.\\\\d+)?)_?(fp|vp|px|lpx|%)?$", "i"));
}

function isValidResource(context: (Context | undefined), value: Resource) {
  const resourceManager = ({let gensym%%_134 = context;
  (((gensym%%_134) == (null)) ? undefined : gensym%%_134.resourceManager)});
  if (((((((value) === (undefined))) || (((value) === (null))))) || (((resourceManager) === (undefined))))) {
    return false;
  }
  if (((((((value.type) !== (RESOURCE_TYPE_STRING))) && (((value.type) !== (RESOURCE_TYPE_INTEGER))))) && (((value.type) !== (RESOURCE_TYPE_FLOAT))))) {
    return false;
  }
  if (((value.type) === (RESOURCE_TYPE_INTEGER))) {
    if (((resourceManager.getInt(value.id)) >= (0))) {
      return true;
    } else {
      return false;
    }
  }
  if (((value.type) === (RESOURCE_TYPE_FLOAT))) {
    if (((resourceManager.getDouble(value.id)) >= (0))) {
      return true;
    } else {
      return false;
    }
  }
  if (((((value.type) === (RESOURCE_TYPE_STRING))) && (!(isValidDimensionString(resourceManager.getStringSync(value.id)))))) {
    return false;
  } else {
    return true;
  }
}


interface IconTheme {
  get size(): SizeOptions
  set size(size: SizeOptions)
  get margin(): LocalizedMargin
  set margin(margin: LocalizedMargin)
  get fillColor(): ResourceColor
  set fillColor(fillColor: ResourceColor)
  get borderRadius(): Length
  set borderRadius(borderRadius: Length)
  
}

interface TitleTheme {
  get margin(): LocalizedMargin
  set margin(margin: LocalizedMargin)
  get minFontSize(): number
  set minFontSize(minFontSize: number)
  get fontWeight(): FontWeight
  set fontWeight(fontWeight: FontWeight)
  get fontSize(): Resource
  set fontSize(fontSize: Resource)
  get fontColor(): ResourceColor
  set fontColor(fontColor: ResourceColor)
  
}

interface ButtonTheme {
  get margin(): LocalizedMargin
  set margin(margin: LocalizedMargin)
  get padding(): LocalizedPadding
  set padding(padding: LocalizedPadding)
  get fontSize(): Resource
  set fontSize(fontSize: Resource)
  get fontColor(): ResourceColor
  set fontColor(fontColor: ResourceColor)
  get textMargin(): LocalizedMargin
  set textMargin(textMargin: LocalizedMargin)
  get minFontSize(): number
  set minFontSize(minFontSize: number)
  get fontWeight(): FontWeight
  set fontWeight(fontWeight: FontWeight)
  get hoverColor(): ResourceColor
  set hoverColor(hoverColor: ResourceColor)
  get backgroundColor(): ResourceColor
  set backgroundColor(backgroundColor: ResourceColor)
  
}

interface MessageTheme {
  get fontSize(): Resource
  set fontSize(fontSize: Resource)
  get fontColor(): ResourceColor
  set fontColor(fontColor: ResourceColor)
  get fontWeight(): FontWeight
  set fontWeight(fontWeight: FontWeight)
  get plainFontColor(): ResourceColor
  set plainFontColor(plainFontColor: ResourceColor)
  
}

interface CloseButtonTheme {
  get size(): SizeOptions
  set size(size: SizeOptions)
  get margin(): LocalizedMargin
  set margin(margin: LocalizedMargin)
  get padding(): LocalizedPadding
  set padding(padding: LocalizedPadding)
  get fillColor(): ResourceColor
  set fillColor(fillColor: ResourceColor)
  get hoverColor(): ResourceColor
  set hoverColor(hoverColor: ResourceColor)
  get backgroundColor(): ResourceColor
  set backgroundColor(backgroundColor: ResourceColor)
  get symbolStyle(): SymbolGlyphModifier
  set symbolStyle(symbolStyle: SymbolGlyphModifier)
  get symbolSize(): string
  set symbolSize(symbolSize: string)
  get accessibilityMessage(): Resource
  set accessibilityMessage(accessibilityMessage: Resource)
  
}

interface WindowsTheme {
  get padding(): LocalizedPadding
  set padding(padding: LocalizedPadding)
  
}

interface PopupTheme {
  get icon(): IconTheme
  set icon(icon: IconTheme)
  get title(): TitleTheme
  set title(title: TitleTheme)
  get button(): ButtonTheme
  set button(button: ButtonTheme)
  get message(): MessageTheme
  set message(message: MessageTheme)
  get windows(): WindowsTheme
  set windows(windows: WindowsTheme)
  get closeButton(): CloseButtonTheme
  set closeButton(closeButton: CloseButtonTheme)
  
}

interface PopupTextOptions {
  get text(): (ResourceStr | undefined) {
    return undefined;
  }
  set text(text: (ResourceStr | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get fontSize(): ((number | string | Resource) | undefined) {
    return undefined;
  }
  set fontSize(fontSize: ((number | string | Resource) | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get fontColor(): (ResourceColor | undefined) {
    return undefined;
  }
  set fontColor(fontColor: (ResourceColor | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get fontWeight(): ((number | FontWeight | string) | undefined) {
    return undefined;
  }
  set fontWeight(fontWeight: ((number | FontWeight | string) | undefined)) {
    throw new InvalidStoreAccessError();
  }
  
}

interface PopupButtonOptions {
  get text(): (ResourceStr | undefined) {
    return undefined;
  }
  set text(text: (ResourceStr | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get action(): (VoidCallback | undefined) {
    return undefined;
  }
  set action(action: (VoidCallback | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get fontSize(): ((number | string | Resource) | undefined) {
    return undefined;
  }
  set fontSize(fontSize: ((number | string | Resource) | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get fontColor(): (ResourceColor | undefined) {
    return undefined;
  }
  set fontColor(fontColor: (ResourceColor | undefined)) {
    throw new InvalidStoreAccessError();
  }
  
}

interface PopupIconOptions {
  get image(): (ResourceStr | undefined) {
    return undefined;
  }
  set image(image: (ResourceStr | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get width(): (Dimension | undefined) {
    return undefined;
  }
  set width(width: (Dimension | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get height(): (Dimension | undefined) {
    return undefined;
  }
  set height(height: (Dimension | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get fillColor(): (ResourceColor | undefined) {
    return undefined;
  }
  set fillColor(fillColor: (ResourceColor | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get borderRadius(): ((Length | BorderRadiuses) | undefined) {
    return undefined;
  }
  set borderRadius(borderRadius: ((Length | BorderRadiuses) | undefined)) {
    throw new InvalidStoreAccessError();
  }
  
}

interface PopupOptions {
  get icon(): (PopupIconOptions | undefined) {
    return undefined;
  }
  set icon(icon: (PopupIconOptions | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get title(): (PopupTextOptions | undefined) {
    return undefined;
  }
  set title(title: (PopupTextOptions | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get message(): (PopupTextOptions | undefined) {
    return undefined;
  }
  set message(message: (PopupTextOptions | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get direction(): (Direction | undefined) {
    return undefined;
  }
  set direction(direction: (Direction | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get showClose(): ((boolean | Resource) | undefined) {
    return undefined;
  }
  set showClose(showClose: ((boolean | Resource) | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get onClose(): (VoidCallback | undefined) {
    return undefined;
  }
  set onClose(onClose: (VoidCallback | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get buttons(): ([(PopupButtonOptions | undefined), (PopupButtonOptions | undefined)] | undefined) {
    return undefined;
  }
  set buttons(buttons: ([(PopupButtonOptions | undefined), (PopupButtonOptions | undefined)] | undefined)) {
    throw new InvalidStoreAccessError();
  }
  get maxWidth(): (Dimension | undefined) {
    return undefined;
  }
  set maxWidth(maxWidth: (Dimension | undefined)) {
    throw new InvalidStoreAccessError();
  }
  
}

@Component() final struct PopupComponent extends CustomComponent<PopupComponent, __Options_PopupComponent> {
  public __initializeStruct(initializers: (__Options_PopupComponent | undefined), @Memo() content: ((()=> void) | undefined)): void {
    this.__backing_onClose = (({let gensym___255085215 = initializers;
    (((gensym___255085215) == (null)) ? undefined : gensym___255085215.__options_has_onClose)}) ? (initializers!.onClose as (()=> void)) : (noop as (()=> void)));
    this.__backing_theme = (({let gensym___224268141 = initializers;
    (((gensym___224268141) == (null)) ? undefined : gensym___224268141.__options_has_theme)}) ? (initializers!.theme as PopupTheme) : (defaultTheme as PopupTheme));
    this.__backing_applyContentKey = (({let gensym___10135168 = initializers;
    (((gensym___10135168) == (null)) ? undefined : gensym___10135168.__options_has_applyContentKey)}) ? (initializers!.applyContentKey as string) : ((("applyContent") + (systemDateTime.getTime(false))) as string));
    this.__backing_icon = STATE_MGMT_FACTORY.makePropRef<(PopupIconOptions | undefined)>(this, "icon", (({let gensym___67637471 = initializers;
    (((gensym___67637471) == (null)) ? undefined : gensym___67637471.__options_has_icon)}) ? (initializers!.icon as (PopupIconOptions | undefined)) : ({
      image: "",
    } as PopupIconOptions)));
    this.__backing_maxWidth = STATE_MGMT_FACTORY.makePropRef<(Dimension | undefined)>(this, "maxWidth", (({let gensym___260112023 = initializers;
    (((gensym___260112023) == (null)) ? undefined : gensym___260112023.__options_has_maxWidth)}) ? (initializers!.maxWidth as (Dimension | undefined)) : undefined));
    this.__backing_messageMaxWidth = STATE_MGMT_FACTORY.makePropRef<(number | undefined)>(this, "messageMaxWidth", (({let gensym___182217970 = initializers;
    (((gensym___182217970) == (null)) ? undefined : gensym___182217970.__options_has_messageMaxWidth)}) ? (initializers!.messageMaxWidth as (number | undefined)) : (0 as (number | undefined))));
    this.__backing_title = STATE_MGMT_FACTORY.makePropRef<(PopupTextOptions | undefined)>(this, "title", (({let gensym___127348604 = initializers;
    (((gensym___127348604) == (null)) ? undefined : gensym___127348604.__options_has_title)}) ? (initializers!.title as (PopupTextOptions | undefined)) : ({
      text: "",
    } as PopupTextOptions)));
    this.__backing_message = STATE_MGMT_FACTORY.makePropRef<(PopupTextOptions | undefined)>(this, "message", (({let gensym___121695736 = initializers;
    (((gensym___121695736) == (null)) ? undefined : gensym___121695736.__options_has_message)}) ? (initializers!.message as (PopupTextOptions | undefined)) : ({
      text: "",
    } as PopupTextOptions)));
    this.__backing_popupDirection = STATE_MGMT_FACTORY.makePropRef<(Direction | undefined)>(this, "popupDirection", (({let gensym___214861709 = initializers;
    (((gensym___214861709) == (null)) ? undefined : gensym___214861709.__options_has_popupDirection)}) ? (initializers!.popupDirection as (Direction | undefined)) : Direction.Auto));
    this.__backing_showClose = STATE_MGMT_FACTORY.makePropRef<(boolean | Resource | undefined)>(this, "showClose", (({let gensym___109524533 = initializers;
    (((gensym___109524533) == (null)) ? undefined : gensym___109524533.__options_has_showClose)}) ? (initializers!.showClose as (boolean | Resource | undefined)) : (true as (boolean | Resource | undefined))));
    this.__backing_buttons = STATE_MGMT_FACTORY.makePropRef<([(PopupButtonOptions | undefined), (PopupButtonOptions | undefined)] | undefined)>(this, "buttons", (({let gensym___220397803 = initializers;
    (((gensym___220397803) == (null)) ? undefined : gensym___220397803.__options_has_buttons)}) ? (initializers!.buttons as ([(PopupButtonOptions | undefined), (PopupButtonOptions | undefined)] | undefined)) : ([{
      text: "",
    }, {
      text: "",
    }] as [(PopupButtonOptions | undefined), (PopupButtonOptions | undefined)])));
    this.__backing_textHeight = (({let gensym___240076152 = initializers;
    (((gensym___240076152) == (null)) ? undefined : gensym___240076152.__options_has_textHeight)}) ? (initializers!.textHeight as number) : (0 as number));
    this.__backing_titleHeight = STATE_MGMT_FACTORY.makeState<number>(this, "titleHeight", (({let gensym___112516543 = initializers;
    (((gensym___112516543) == (null)) ? undefined : gensym___112516543.__options_has_titleHeight)}) ? (initializers!.titleHeight as number) : (0 as number)));
    this.__backing_applyHeight = STATE_MGMT_FACTORY.makeState<number>(this, "applyHeight", (({let gensym___196045595 = initializers;
    (((gensym___196045595) == (null)) ? undefined : gensym___196045595.__options_has_applyHeight)}) ? (initializers!.applyHeight as number) : (0 as number)));
    this.__backing_buttonHeight = STATE_MGMT_FACTORY.makeState<number>(this, "buttonHeight", (({let gensym___236189145 = initializers;
    (((gensym___236189145) == (null)) ? undefined : gensym___236189145.__options_has_buttonHeight)}) ? (initializers!.buttonHeight as number) : (0 as number)));
    this.__backing_messageMaxWeight = STATE_MGMT_FACTORY.makeState<(number | undefined)>(this, "messageMaxWeight", (({let gensym___115078601 = initializers;
    (((gensym___115078601) == (null)) ? undefined : gensym___115078601.__options_has_messageMaxWeight)}) ? (initializers!.messageMaxWeight as (number | undefined)) : (0 as (number | undefined))));
    this.__backing_beforeScreenStatus = (({let gensym___144911660 = initializers;
    (((gensym___144911660) == (null)) ? undefined : gensym___144911660.__options_has_beforeScreenStatus)}) ? (initializers!.beforeScreenStatus as (boolean | undefined)) : undefined);
    this.__backing_currentScreenStatus = STATE_MGMT_FACTORY.makeState<(boolean | undefined)>(this, "currentScreenStatus", (({let gensym___257481597 = initializers;
    (((gensym___257481597) == (null)) ? undefined : gensym___257481597.__options_has_currentScreenStatus)}) ? (initializers!.currentScreenStatus as (boolean | undefined)) : undefined));
    this.__backing_applySizeOptions = STATE_MGMT_FACTORY.makeState<(ConstraintSizeOptions | undefined)>(this, "applySizeOptions", (({let gensym___49463046 = initializers;
    (((gensym___49463046) == (null)) ? undefined : gensym___49463046.__options_has_applySizeOptions)}) ? (initializers!.applySizeOptions as (ConstraintSizeOptions | undefined)) : undefined));
    this.__backing_closeButtonBackgroundColor = STATE_MGMT_FACTORY.makeState<ResourceColor>(this, "closeButtonBackgroundColor", (({let gensym___175995359 = initializers;
    (((gensym___175995359) == (null)) ? undefined : gensym___175995359.__options_has_closeButtonBackgroundColor)}) ? (initializers!.closeButtonBackgroundColor as ResourceColor) : (_r(16777216, 10003, "com.example.mock", "entry") as ResourceColor)));
    this.__backing_firstButtonBackgroundColor = STATE_MGMT_FACTORY.makeState<ResourceColor>(this, "firstButtonBackgroundColor", (({let gensym___268169723 = initializers;
    (((gensym___268169723) == (null)) ? undefined : gensym___268169723.__options_has_firstButtonBackgroundColor)}) ? (initializers!.firstButtonBackgroundColor as ResourceColor) : (_r(16777216, 10003, "com.example.mock", "entry") as ResourceColor)));
    this.__backing_secondButtonBackgroundColor = STATE_MGMT_FACTORY.makeState<ResourceColor>(this, "secondButtonBackgroundColor", (({let gensym___142521100 = initializers;
    (((gensym___142521100) == (null)) ? undefined : gensym___142521100.__options_has_secondButtonBackgroundColor)}) ? (initializers!.secondButtonBackgroundColor as ResourceColor) : (_r(16777216, 10003, "com.example.mock", "entry") as ResourceColor)));
    this.__backing_closeButtonFillColorWithTheme = STATE_MGMT_FACTORY.makeState<ResourceColor>(this, "closeButtonFillColorWithTheme", (({let gensym___56260722 = initializers;
    (((gensym___56260722) == (null)) ? undefined : gensym___56260722.__options_has_closeButtonFillColorWithTheme)}) ? (initializers!.closeButtonFillColorWithTheme as ResourceColor) : (_r(16777216, 10003, "com.example.mock", "entry") as ResourceColor)));
    this.__backing_listener = (({let gensym___94919179 = initializers;
    (((gensym___94919179) == (null)) ? undefined : gensym___94919179.__options_has_listener)}) ? (initializers!.listener as (mediaQuery.MediaQueryListener | undefined)) : (this.getUIContext().getMediaQuery().matchMediaSync("(orientation: landscape)") as (mediaQuery.MediaQueryListener | undefined)));
  }
  
  public __updateStruct(initializers: (__Options_PopupComponent | undefined)): void {
    if (({let gensym___203369287 = initializers;
    (((gensym___203369287) == (null)) ? undefined : gensym___203369287.__options_has_icon)})) {
      this.__backing_icon!.update((initializers!.icon as (PopupIconOptions | undefined)));
    }
    if (({let gensym___173479457 = initializers;
    (((gensym___173479457) == (null)) ? undefined : gensym___173479457.__options_has_maxWidth)})) {
      this.__backing_maxWidth!.update((initializers!.maxWidth as (Dimension | undefined)));
    }
    if (({let gensym___27113036 = initializers;
    (((gensym___27113036) == (null)) ? undefined : gensym___27113036.__options_has_messageMaxWidth)})) {
      this.__backing_messageMaxWidth!.update((initializers!.messageMaxWidth as (number | undefined)));
    }
    if (({let gensym___23444944 = initializers;
    (((gensym___23444944) == (null)) ? undefined : gensym___23444944.__options_has_title)})) {
      this.__backing_title!.update((initializers!.title as (PopupTextOptions | undefined)));
    }
    if (({let gensym___74055695 = initializers;
    (((gensym___74055695) == (null)) ? undefined : gensym___74055695.__options_has_message)})) {
      this.__backing_message!.update((initializers!.message as (PopupTextOptions | undefined)));
    }
    if (({let gensym___162798633 = initializers;
    (((gensym___162798633) == (null)) ? undefined : gensym___162798633.__options_has_popupDirection)})) {
      this.__backing_popupDirection!.update((initializers!.popupDirection as (Direction | undefined)));
    }
    if (({let gensym___65854073 = initializers;
    (((gensym___65854073) == (null)) ? undefined : gensym___65854073.__options_has_showClose)})) {
      this.__backing_showClose!.update((initializers!.showClose as (boolean | Resource | undefined)));
    }
    if (({let gensym___62277301 = initializers;
    (((gensym___62277301) == (null)) ? undefined : gensym___62277301.__options_has_buttons)})) {
      this.__backing_buttons!.update((initializers!.buttons as ([(PopupButtonOptions | undefined), (PopupButtonOptions | undefined)] | undefined)));
    }
  }
  
  public resetStateVarsOnReuse(initializers: (__Options_PopupComponent | undefined)): void {
    this.__backing_icon!.resetOnReuse(((({let gensym___190822970 = initializers;
    (((gensym___190822970) == (null)) ? undefined : gensym___190822970.icon)})) ?? (({
      image: "",
    } as PopupIconOptions))));
    this.__backing_maxWidth!.resetOnReuse((initializers!.maxWidth as (Dimension | undefined)));
    this.__backing_messageMaxWidth!.resetOnReuse((((({let gensym___30568080 = initializers;
    (((gensym___30568080) == (null)) ? undefined : gensym___30568080.messageMaxWidth)})) ?? (0)) as (number | undefined)));
    this.__backing_title!.resetOnReuse(((({let gensym___56743092 = initializers;
    (((gensym___56743092) == (null)) ? undefined : gensym___56743092.title)})) ?? (({
      text: "",
    } as PopupTextOptions))));
    this.__backing_message!.resetOnReuse(((({let gensym___235842534 = initializers;
    (((gensym___235842534) == (null)) ? undefined : gensym___235842534.message)})) ?? (({
      text: "",
    } as PopupTextOptions))));
    this.__backing_popupDirection!.resetOnReuse(((({let gensym___173587488 = initializers;
    (((gensym___173587488) == (null)) ? undefined : gensym___173587488.popupDirection)})) ?? (Direction.Auto)));
    this.__backing_showClose!.resetOnReuse((((({let gensym___83723627 = initializers;
    (((gensym___83723627) == (null)) ? undefined : gensym___83723627.showClose)})) ?? (true)) as (boolean | Resource | undefined)));
    this.__backing_buttons!.resetOnReuse(((({let gensym___268415726 = initializers;
    (((gensym___268415726) == (null)) ? undefined : gensym___268415726.buttons)})) ?? (([{
      text: "",
    }, {
      text: "",
    }] as [(PopupButtonOptions | undefined), (PopupButtonOptions | undefined)]))));
    this.__backing_titleHeight!.resetOnReuse((((({let gensym___119058894 = initializers;
    (((gensym___119058894) == (null)) ? undefined : gensym___119058894.titleHeight)})) ?? (0)) as number));
    this.__backing_applyHeight!.resetOnReuse((((({let gensym___251895900 = initializers;
    (((gensym___251895900) == (null)) ? undefined : gensym___251895900.applyHeight)})) ?? (0)) as number));
    this.__backing_buttonHeight!.resetOnReuse((((({let gensym___201319644 = initializers;
    (((gensym___201319644) == (null)) ? undefined : gensym___201319644.buttonHeight)})) ?? (0)) as number));
    this.__backing_messageMaxWeight!.resetOnReuse((((({let gensym___81810824 = initializers;
    (((gensym___81810824) == (null)) ? undefined : gensym___81810824.messageMaxWeight)})) ?? (0)) as (number | undefined)));
    this.__backing_currentScreenStatus!.resetOnReuse(((({let gensym___97699550 = initializers;
    (((gensym___97699550) == (null)) ? undefined : gensym___97699550.currentScreenStatus)})) ?? (undefined)));
    this.__backing_applySizeOptions!.resetOnReuse(((({let gensym___145002520 = initializers;
    (((gensym___145002520) == (null)) ? undefined : gensym___145002520.applySizeOptions)})) ?? (undefined)));
    this.__backing_closeButtonBackgroundColor!.resetOnReuse((((({let gensym___100510131 = initializers;
    (((gensym___100510131) == (null)) ? undefined : gensym___100510131.closeButtonBackgroundColor)})) ?? (_r(16777216, 10003, "com.example.mock", "entry"))) as ResourceColor));
    this.__backing_firstButtonBackgroundColor!.resetOnReuse((((({let gensym___106615075 = initializers;
    (((gensym___106615075) == (null)) ? undefined : gensym___106615075.firstButtonBackgroundColor)})) ?? (_r(16777216, 10003, "com.example.mock", "entry"))) as ResourceColor));
    this.__backing_secondButtonBackgroundColor!.resetOnReuse((((({let gensym___143052158 = initializers;
    (((gensym___143052158) == (null)) ? undefined : gensym___143052158.secondButtonBackgroundColor)})) ?? (_r(16777216, 10003, "com.example.mock", "entry"))) as ResourceColor));
    this.__backing_closeButtonFillColorWithTheme!.resetOnReuse((((({let gensym___212000584 = initializers;
    (((gensym___212000584) == (null)) ? undefined : gensym___212000584.closeButtonFillColorWithTheme)})) ?? (_r(16777216, 10003, "com.example.mock", "entry"))) as ResourceColor));
  }
  
  @MemoIntrinsic() 
  public static _invoke(style: (@Memo() ((instance: PopupComponent)=> void) | undefined), initializers: ((()=> __Options_PopupComponent) | undefined), storage: ((()=> LocalStorage) | undefined), reuseId: (string | undefined), @Memo() content: ((()=> void) | undefined)): void {
    CustomComponent._invokeImpl<PopupComponent, __Options_PopupComponent>(style, ((): PopupComponent => {
      return new PopupComponent(false, ({let gensym___62798498 = storage;
      (((gensym___62798498) == (null)) ? undefined : gensym___62798498())}));
    }), initializers, reuseId, content);
  }
  
  @ComponentBuilder() 
  public static $_invoke(initializers?: __Options_PopupComponent, storage?: LocalStorage, @Builder() @Memo() content?: (()=> void)): PopupComponent {
    throw new Error("Declare interface");
  }
  
  private __backing_onClose?: ((()=> void) | undefined);
  public get onClose(): (()=> void) {
    return (this.__backing_onClose as (()=> void));
  }
  
  public set onClose(value: (()=> void)) {
    this.__backing_onClose = value;
  }
  
  private __backing_theme?: PopupTheme;
  public get theme(): PopupTheme {
    return (this.__backing_theme as PopupTheme);
  }
  
  public set theme(value: PopupTheme) {
    this.__backing_theme = value;
  }
  
  private __backing_applyContentKey?: string;
  public get applyContentKey(): string {
    return (this.__backing_applyContentKey as string);
  }
  
  public set applyContentKey(value: string) {
    this.__backing_applyContentKey = value;
  }
  
  private __backing_icon?: IPropRefDecoratedVariable<(PopupIconOptions | undefined)>;
  public get icon(): (PopupIconOptions | undefined) {
    return this.__backing_icon!.get();
  }
  
  public set icon(value: (PopupIconOptions | undefined)) {
    this.__backing_icon!.set(value);
  }
  
  private __backing_maxWidth?: IPropRefDecoratedVariable<(Dimension | undefined)>;
  public get maxWidth(): (Dimension | undefined) {
    return this.__backing_maxWidth!.get();
  }
  
  public set maxWidth(value: (Dimension | undefined)) {
    this.__backing_maxWidth!.set(value);
  }
  
  private __backing_messageMaxWidth?: IPropRefDecoratedVariable<(number | undefined)>;
  public get messageMaxWidth(): (number | undefined) {
    return this.__backing_messageMaxWidth!.get();
  }
  
  public set messageMaxWidth(value: (number | undefined)) {
    this.__backing_messageMaxWidth!.set(value);
  }
  
  private __backing_title?: IPropRefDecoratedVariable<(PopupTextOptions | undefined)>;
  public get title(): (PopupTextOptions | undefined) {
    return this.__backing_title!.get();
  }
  
  public set title(value: (PopupTextOptions | undefined)) {
    this.__backing_title!.set(value);
  }
  
  private __backing_message?: IPropRefDecoratedVariable<(PopupTextOptions | undefined)>;
  public get message(): (PopupTextOptions | undefined) {
    return this.__backing_message!.get();
  }
  
  public set message(value: (PopupTextOptions | undefined)) {
    this.__backing_message!.set(value);
  }
  
  private __backing_popupDirection?: IPropRefDecoratedVariable<(Direction | undefined)>;
  public get popupDirection(): (Direction | undefined) {
    return this.__backing_popupDirection!.get();
  }
  
  public set popupDirection(value: (Direction | undefined)) {
    this.__backing_popupDirection!.set(value);
  }
  
  private __backing_showClose?: IPropRefDecoratedVariable<(boolean | Resource | undefined)>;
  public get showClose(): (boolean | Resource | undefined) {
    return this.__backing_showClose!.get();
  }
  
  public set showClose(value: (boolean | Resource | undefined)) {
    this.__backing_showClose!.set(value);
  }
  
  private __backing_buttons?: IPropRefDecoratedVariable<([(PopupButtonOptions | undefined), (PopupButtonOptions | undefined)] | undefined)>;
  public get buttons(): ([(PopupButtonOptions | undefined), (PopupButtonOptions | undefined)] | undefined) {
    return this.__backing_buttons!.get();
  }
  
  public set buttons(value: ([(PopupButtonOptions | undefined), (PopupButtonOptions | undefined)] | undefined)) {
    this.__backing_buttons!.set(value);
  }
  
  private __backing_textHeight?: number;
  public get textHeight(): number {
    return (this.__backing_textHeight as number);
  }
  
  public set textHeight(value: number) {
    this.__backing_textHeight = value;
  }
  
  private __backing_titleHeight?: IStateDecoratedVariable<number>;
  public get titleHeight(): number {
    return this.__backing_titleHeight!.get();
  }
  
  public set titleHeight(value: number) {
    this.__backing_titleHeight!.set(value);
  }
  
  private __backing_applyHeight?: IStateDecoratedVariable<number>;
  public get applyHeight(): number {
    return this.__backing_applyHeight!.get();
  }
  
  public set applyHeight(value: number) {
    this.__backing_applyHeight!.set(value);
  }
  
  private __backing_buttonHeight?: IStateDecoratedVariable<number>;
  public get buttonHeight(): number {
    return this.__backing_buttonHeight!.get();
  }
  
  public set buttonHeight(value: number) {
    this.__backing_buttonHeight!.set(value);
  }
  
  private __backing_messageMaxWeight?: IStateDecoratedVariable<(number | undefined)>;
  public get messageMaxWeight(): (number | undefined) {
    return this.__backing_messageMaxWeight!.get();
  }
  
  public set messageMaxWeight(value: (number | undefined)) {
    this.__backing_messageMaxWeight!.set(value);
  }
  
  private __backing_beforeScreenStatus?: (boolean | undefined);
  public get beforeScreenStatus(): (boolean | undefined) {
    return (this.__backing_beforeScreenStatus as (boolean | undefined));
  }
  
  public set beforeScreenStatus(value: (boolean | undefined)) {
    this.__backing_beforeScreenStatus = value;
  }
  
  private __backing_currentScreenStatus?: IStateDecoratedVariable<(boolean | undefined)>;
  public get currentScreenStatus(): (boolean | undefined) {
    return this.__backing_currentScreenStatus!.get();
  }
  
  public set currentScreenStatus(value: (boolean | undefined)) {
    this.__backing_currentScreenStatus!.set(value);
  }
  
  private __backing_applySizeOptions?: IStateDecoratedVariable<(ConstraintSizeOptions | undefined)>;
  public get applySizeOptions(): (ConstraintSizeOptions | undefined) {
    return this.__backing_applySizeOptions!.get();
  }
  
  public set applySizeOptions(value: (ConstraintSizeOptions | undefined)) {
    this.__backing_applySizeOptions!.set(value);
  }
  
  private __backing_closeButtonBackgroundColor?: IStateDecoratedVariable<ResourceColor>;
  public get closeButtonBackgroundColor(): ResourceColor {
    return this.__backing_closeButtonBackgroundColor!.get();
  }
  
  public set closeButtonBackgroundColor(value: ResourceColor) {
    this.__backing_closeButtonBackgroundColor!.set(value);
  }
  
  private __backing_firstButtonBackgroundColor?: IStateDecoratedVariable<ResourceColor>;
  public get firstButtonBackgroundColor(): ResourceColor {
    return this.__backing_firstButtonBackgroundColor!.get();
  }
  
  public set firstButtonBackgroundColor(value: ResourceColor) {
    this.__backing_firstButtonBackgroundColor!.set(value);
  }
  
  private __backing_secondButtonBackgroundColor?: IStateDecoratedVariable<ResourceColor>;
  public get secondButtonBackgroundColor(): ResourceColor {
    return this.__backing_secondButtonBackgroundColor!.get();
  }
  
  public set secondButtonBackgroundColor(value: ResourceColor) {
    this.__backing_secondButtonBackgroundColor!.set(value);
  }
  
  private __backing_closeButtonFillColorWithTheme?: IStateDecoratedVariable<ResourceColor>;
  public get closeButtonFillColorWithTheme(): ResourceColor {
    return this.__backing_closeButtonFillColorWithTheme!.get();
  }
  
  public set closeButtonFillColorWithTheme(value: ResourceColor) {
    this.__backing_closeButtonFillColorWithTheme!.set(value);
  }
  
  private __backing_listener?: (mediaQuery.MediaQueryListener | undefined);
  public get listener(): (mediaQuery.MediaQueryListener | undefined) {
    return (this.__backing_listener as (mediaQuery.MediaQueryListener | undefined));
  }
  
  public set listener(value: (mediaQuery.MediaQueryListener | undefined)) {
    this.__backing_listener = value;
  }
  
  private getIconWidth(): Dimension {
    return ((({let gensym%%_1 = this.icon;
    (((gensym%%_1) == (null)) ? undefined : gensym%%_1.width)})) ?? ((this.theme.icon.size.width as number)));
  }
  
  private getIconHeight(): Dimension {
    return ((({let gensym%%_2 = this.icon;
    (((gensym%%_2) == (null)) ? undefined : gensym%%_2.height)})) ?? ((this.theme.icon.size.height as number)));
  }
  
  private getIconFillColor(): ResourceColor {
    return ((({let gensym%%_3 = this.icon;
    (((gensym%%_3) == (null)) ? undefined : gensym%%_3.fillColor)})) ?? (this.theme.icon.fillColor));
  }
  
  private getIconBorderRadius(): (Length | BorderRadiuses) {
    return ((({let gensym%%_4 = this.icon;
    (((gensym%%_4) == (null)) ? undefined : gensym%%_4.borderRadius)})) ?? (this.theme.icon.borderRadius));
  }
  
  private getLengthMetrics(value: number, unit?: (LengthUnit | undefined)): LengthMetrics {
    if (((((unit) === (undefined))) || (((unit) === (null))))) {
      unit = LengthUnit.VP;
    }
    switch ((unit as LengthUnit)) {
      case LengthUnit.PX: {
        return LengthMetrics.px(value);
      }
      case LengthUnit.VP: {
        return LengthMetrics.vp(value);
      }
      case LengthUnit.FP: {
        return LengthMetrics.fp(value);
      }
      case LengthUnit.PERCENT: {
        return LengthMetrics.percent(value);
      }
      case LengthUnit.LPX: {
        return LengthMetrics.lpx(value);
      }
      default: {
        return LengthMetrics.vp(value);
      }
    }
  }
  
  private getIconMargin(): LocalizedMargin {
    const buttonMarginStart = ((({let gensym%%_5 = this.theme.button.margin.start;
    (((gensym%%_5) == (null)) ? undefined : gensym%%_5.value)})) ?? (0));
    const buttonMarginStartUnit = ({let gensym%%_6 = this.theme.button.margin.start;
    (((gensym%%_6) == (null)) ? undefined : gensym%%_6.unit)});
    const buttonMarginEnd = ((({let gensym%%_7 = this.theme.button.margin.end;
    (((gensym%%_7) == (null)) ? undefined : gensym%%_7.value)})) ?? (0));
    const iconMarginStart = ((({let gensym%%_8 = this.theme.icon.margin.start;
    (((gensym%%_8) == (null)) ? undefined : gensym%%_8.value)})) ?? (0));
    const iconMarginStartUnit = ({let gensym%%_9 = this.theme.icon.margin.start;
    (((gensym%%_9) == (null)) ? undefined : gensym%%_9.unit)});
    return {
      start: this.getLengthMetrics(((buttonMarginStart) / (2)), buttonMarginStartUnit),
      end: this.getLengthMetrics(((iconMarginStart) - (((buttonMarginEnd) / (2)))), iconMarginStartUnit),
    };
  }
  
  private getIconImage(): (ResourceStr | undefined) {
    return ({let gensym%%_10 = this.icon;
    (((gensym%%_10) == (null)) ? undefined : gensym%%_10.image)});
  }
  
  private getTitleText(): (ResourceStr | undefined) {
    return ({let gensym%%_11 = this.title;
    (((gensym%%_11) == (null)) ? undefined : gensym%%_11.text)});
  }
  
  private getTitlePadding(): LocalizedPadding {
    return {
      start: this.getLengthMetrics((((((({let gensym%%_12 = this.theme.button.margin.start;
      (((gensym%%_12) == (null)) ? undefined : gensym%%_12.value)}) as number)) || (0))) / (2)), ({let gensym%%_13 = this.theme.button.margin.start;
      (((gensym%%_13) == (null)) ? undefined : gensym%%_13.unit)})),
      end: this.theme.closeButton.margin.end,
    };
  }
  
  private getTitleMargin(): LocalizedMargin {
    return this.theme.title.margin;
  }
  
  private getTitleMinFontSize(): (number | string | Resource) {
    return this.theme.title.minFontSize;
  }
  
  private getTitleFontWeight(): (int | FontWeight | string) {
    const fontWeight = ({let gensym%%_14 = this.title;
    (((gensym%%_14) == (null)) ? undefined : gensym%%_14.fontWeight)});
    if (((((fontWeight) === (undefined))) || (((fontWeight) === (null))))) {
      return this.theme.title.fontWeight;
    } else {
      if ((((typeof fontWeight)) === ("string"))) {
        return (fontWeight as string);
      } else {
        if ((((typeof fontWeight)) === ("number"))) {
          return Math.trunc((fontWeight as number)).toInt();
        } else {
          return (fontWeight as FontWeight);
        }
      }
    }
  }
  
  private getTitleFontSize(): (number | string | Resource) {
    return ((({let gensym%%_15 = this.title;
    (((gensym%%_15) == (null)) ? undefined : gensym%%_15.fontSize)})) ?? (this.theme.title.fontSize));
  }
  
  private getTitleFontColor(): ResourceColor {
    return ((({let gensym%%_16 = this.title;
    (((gensym%%_16) == (null)) ? undefined : gensym%%_16.fontColor)})) ?? (this.theme.title.fontColor));
  }
  
  private getCloseButtonWidth(): (Length | undefined) {
    return this.theme.closeButton.size.width;
  }
  
  private getCloseButtonHeight(): (Length | undefined) {
    return this.theme.closeButton.size.height;
  }
  
  private getCloseButtonFillColor(): ResourceColor {
    return this.closeButtonFillColorWithTheme;
  }
  
  private getCloseButtonHoverColor(): ResourceColor {
    return this.theme.closeButton.hoverColor;
  }
  
  private getCloseButtonBackgroundColor(): ResourceColor {
    return this.theme.closeButton.backgroundColor;
  }
  
  private getCloseButtonPadding(): LocalizedPadding {
    return this.theme.closeButton.padding;
  }
  
  private getCloseButtonSymbolSize(): (string | undefined) {
    return this.theme.closeButton.symbolSize;
  }
  
  private getMessageText(): (ResourceStr | undefined) {
    return ((({let gensym%%_17 = this.message;
    (((gensym%%_17) == (null)) ? undefined : gensym%%_17.text)})) ?? (""));
  }
  
  private getMessageFontSize(): (number | string | Resource) {
    return ((({let gensym%%_18 = this.message;
    (((gensym%%_18) == (null)) ? undefined : gensym%%_18.fontSize)})) ?? (this.theme.message.fontSize));
  }
  
  private getMessageFontColor(): (ResourceColor | undefined) {
    let fontColor: (ResourceColor | undefined);
    if (({let gensym%%_19 = this.message;
    (((gensym%%_19) == (null)) ? undefined : gensym%%_19.fontColor)})) {
      fontColor = ({let gensym%%_20 = this.message;
      (((gensym%%_20) == (null)) ? undefined : gensym%%_20.fontColor)});
    } else {
      if (((((({let gensym%%_21 = this.title;
      (((gensym%%_21) == (null)) ? undefined : gensym%%_21.text)})) !== (""))) && (((({let gensym%%_22 = this.title;
      (((gensym%%_22) == (null)) ? undefined : gensym%%_22.text)})) !== (undefined))))) {
        fontColor = this.theme.message.fontColor;
      } else {
        fontColor = this.theme.message.plainFontColor;
      }
    }
    return fontColor;
  }
  
  private getMessagePadding(): LocalizedPadding {
    let padding: LocalizedPadding;
    padding = {
      start: LengthMetrics.vp((((({let gensym%%_23 = this.theme.button.margin.start;
      (((gensym%%_23) == (null)) ? undefined : gensym%%_23.value)}) as number)) / (2))),
      end: LengthMetrics.vp((({let gensym%%_24 = this.theme.closeButton.margin.end;
      (((gensym%%_24) == (null)) ? undefined : gensym%%_24.value)}) as number)),
    };
    return padding;
  }
  
  private getMessageMaxWeight(messageMaxWidth?: number): (number | undefined) {
    let textMaxWeight: number = 0;
    let defaultDisplaySync: (display.Display | undefined) = undefined;
    let defaultDisplaySyncWidth: number = 0;
    try {
      defaultDisplaySync = display.getDefaultDisplaySync();
      defaultDisplaySyncWidth = defaultDisplaySync.width.toDouble();
    } catch (error) {
      console.error(\`Ace Popup getDefaultDisplaySync, error: \${error.toString()}\`);
      return textMaxWeight = 400;
    }
    if (((this.showClose) || (((this.showClose) === (undefined))))) {
      if (((messageMaxWidth) != (undefined))) {
        if (((((this.maxWidth) != (undefined))) && (((this.toVp(this.maxWidth)) > (this.getUIContext().px2vp(defaultDisplaySyncWidth)))))) {
          textMaxWeight = this.getUIContext().px2vp(defaultDisplaySyncWidth);
        } else {
          textMaxWeight = (messageMaxWidth as number);
        }
      } else {
        if (((defaultDisplaySyncWidth) != (0))) {
          textMaxWeight = this.getUIContext().px2vp(defaultDisplaySyncWidth);
        } else {
          textMaxWeight = -1;
        }
      }
      textMaxWeight -= (((({let gensym%%_25 = this.theme.windows.padding.start;
      (((gensym%%_25) == (null)) ? undefined : gensym%%_25.value)}) as number)) - ((((({let gensym%%_26 = this.theme.button.margin.end;
      (((gensym%%_26) == (null)) ? undefined : gensym%%_26.value)}) as number)) / (2))));
      textMaxWeight -= (({let gensym%%_27 = this.theme.windows.padding.end;
      (((gensym%%_27) == (null)) ? undefined : gensym%%_27.value)}) as number);
      textMaxWeight -= (((({let gensym%%_28 = this.theme.button.margin.start;
      (((gensym%%_28) == (null)) ? undefined : gensym%%_28.value)}) as number)) / (2));
      textMaxWeight -= (({let gensym%%_29 = this.theme.closeButton.margin.end;
      (((gensym%%_29) == (null)) ? undefined : gensym%%_29.value)}) as number);
      textMaxWeight -= (this.getCloseButtonWidth() as number);
    }
    return textMaxWeight;
  }
  
  private getMessageFontWeight(): (Int | FontWeight | string | undefined) {
    return this.theme.message.fontWeight;
  }
  
  private getButtonMargin(): LocalizedMargin {
    return {
      top: LengthMetrics.vp((((((({let gensym%%_30 = this.theme.button.textMargin.top;
      (((gensym%%_30) == (null)) ? undefined : gensym%%_30.value)}) as number)) / (2))) - (4))),
      bottom: LengthMetrics.vp((((((({let gensym%%_31 = this.theme.button.textMargin.bottom;
      (((gensym%%_31) == (null)) ? undefined : gensym%%_31.value)}) as number)) / (2))) - (4))),
      start: LengthMetrics.vp((((((({let gensym%%_32 = this.theme.button.margin.start;
      (((gensym%%_32) == (null)) ? undefined : gensym%%_32.value)}) as number)) / (2))) - (4))),
      end: LengthMetrics.vp((((((({let gensym%%_33 = this.theme.button.margin.end;
      (((gensym%%_33) == (null)) ? undefined : gensym%%_33.value)}) as number)) / (2))) - (4))),
    };
  }
  
  private getButtonTextMargin(): LocalizedMargin {
    return {
      top: LengthMetrics.vp((({let gensym%%_34 = this.theme.button.textMargin.bottom;
      (((gensym%%_34) == (null)) ? undefined : gensym%%_34.value)}) as number)),
    };
  }
  
  private getButtonTextPadding(): LocalizedPadding {
    return this.theme.button.padding;
  }
  
  private getButtonHoverColor(): ResourceColor {
    return this.theme.button.hoverColor;
  }
  
  private getButtonBackgroundColor(): ResourceColor {
    return this.theme.button.backgroundColor;
  }
  
  private getFirstButtonText(): (string | Resource | undefined) {
    return ({let gensym%%_36 = ({let gensym%%_35 = this.buttons;
    (((gensym%%_35) == (null)) ? undefined : gensym%%_35[0])});
    (((gensym%%_36) == (null)) ? undefined : gensym%%_36.text)});
  }
  
  private getSecondButtonText(): (string | Resource | undefined) {
    return ({let gensym%%_38 = ({let gensym%%_37 = this.buttons;
    (((gensym%%_37) == (null)) ? undefined : gensym%%_37[1])});
    (((gensym%%_38) == (null)) ? undefined : gensym%%_38.text)});
  }
  
  private getFirstButtonFontSize(): (number | string | Resource) {
    return ((({let gensym%%_40 = ({let gensym%%_39 = this.buttons;
    (((gensym%%_39) == (null)) ? undefined : gensym%%_39[0])});
    (((gensym%%_40) == (null)) ? undefined : gensym%%_40.fontSize)})) ?? (this.theme.button.fontSize));
  }
  
  private getSecondButtonFontSize(): (number | string | Resource) {
    return ((({let gensym%%_42 = ({let gensym%%_41 = this.buttons;
    (((gensym%%_41) == (null)) ? undefined : gensym%%_41[1])});
    (((gensym%%_42) == (null)) ? undefined : gensym%%_42.fontSize)})) ?? (this.theme.button.fontSize));
  }
  
  private getFirstButtonFontColor(): ResourceColor {
    return ((({let gensym%%_44 = ({let gensym%%_43 = this.buttons;
    (((gensym%%_43) == (null)) ? undefined : gensym%%_43[0])});
    (((gensym%%_44) == (null)) ? undefined : gensym%%_44.fontColor)})) ?? (this.theme.button.fontColor));
  }
  
  private getSecondButtonFontColor(): ResourceColor {
    return ((({let gensym%%_46 = ({let gensym%%_45 = this.buttons;
    (((gensym%%_45) == (null)) ? undefined : gensym%%_45[1])});
    (((gensym%%_46) == (null)) ? undefined : gensym%%_46.fontColor)})) ?? (this.theme.button.fontColor));
  }
  
  private getButtonMinFontSize(): Dimension {
    return this.theme.button.minFontSize;
  }
  
  private getButtonFontWeight(): (Int | FontWeight | string | undefined) {
    return this.theme.button.fontWeight;
  }
  
  private getWindowsPadding(): LocalizedPadding {
    let top = this.theme.windows.padding.top;
    let bottom = LengthMetrics.vp((((({let gensym%%_47 = this.theme.windows.padding.bottom;
    (((gensym%%_47) == (null)) ? undefined : gensym%%_47.value)}) as number)) - ((((({let gensym%%_48 = this.theme.button.textMargin.bottom;
    (((gensym%%_48) == (null)) ? undefined : gensym%%_48.value)}) as number)) / (2)))));
    let start = LengthMetrics.vp((((({let gensym%%_49 = this.theme.windows.padding.start;
    (((gensym%%_49) == (null)) ? undefined : gensym%%_49.value)}) as number)) - ((((({let gensym%%_50 = this.theme.button.margin.end;
    (((gensym%%_50) == (null)) ? undefined : gensym%%_50.value)}) as number)) / (2)))));
    let end = this.theme.windows.padding.end;
    let resolvedMaxWidth = this.toVp(this.maxWidth);
    if (((resolvedMaxWidth) === (0))) {
      start = LengthMetrics.vp(0);
      end = LengthMetrics.vp(0);
    }
    return {
      top: top,
      bottom: bottom,
      start: start,
      end: end,
    };
  }
  
  @Memo() 
  public closeButtonBuilderImage() {
    ImageImpl(@Memo() ((instance: ImageAttribute): void => {
      instance.setImageOptions((this.showClose as Resource), undefined).width(this.getCloseButtonWidth()).height(this.getCloseButtonHeight()).direction(this.popupDirection).focusable(true).draggable(false);
      instance.applyAttributesFinish();
      return;
    }));
  }
  
  @Memo() 
  public closeButtonBuilderSymbolGlyph(@MemoSkip() symbolGlyphModifier: SymbolGlyphModifier) {
    SymbolGlyphImpl(@Memo() ((instance: SymbolGlyphAttribute): void => {
      instance.setSymbolGlyphOptions(undefined).fontColor([this.getCloseButtonFillColor()]).fontSize(this.getCloseButtonSymbolSize()).direction(this.popupDirection).attributeModifier(symbolGlyphModifier).focusable(true).draggable(false);
      instance.applyAttributesFinish();
      return;
    }));
  }
  
  public onWillApplyTheme(theme: Theme): void {
    this.theme.title.fontColor = theme.colors.fontPrimary;
    this.theme.button.fontColor = theme.colors.fontEmphasize;
    this.theme.message.fontColor = theme.colors.fontSecondary;
    this.theme.message.plainFontColor = theme.colors.fontPrimary;
    this.closeButtonFillColorWithTheme = theme.colors.iconSecondary;
  }
  
  public aboutToAppear() {
    ({let gensym%%_52 = this.listener;
    (((gensym%%_52) == (null)) ? undefined : gensym%%_52.onChange(((mediaQueryResult) => {
      setTimeout((() => {
        this.currentScreenStatus = (({let gensym%%_51 = mediaQueryResult;
        (((gensym%%_51) == (null)) ? undefined : gensym%%_51.matches)}) as boolean);
      }), 10);
    })))});
  }
  
  public aboutToDisappear() {
    ({let gensym%%_53 = this.listener;
    (((gensym%%_53) == (null)) ? undefined : gensym%%_53.offChange())});
  }
  
  public getScrollMaxHeight(): (number | undefined) {
    let scrollMaxHeight: number = 0;
    if (((((this.beforeScreenStatus) === (undefined))) || (((this.currentScreenStatus) !== (this.beforeScreenStatus))))) {
      this.applySizeOptions = this.getApplyMaxSize();
      this.beforeScreenStatus = this.currentScreenStatus;
    }
    scrollMaxHeight = this.getUIContext().px2vp((({let gensym%%_55 = ({let gensym%%_54 = this.getUIContext().getComponentUtils().getRectangleById(this.applyContentKey);
    (((gensym%%_54) == (null)) ? undefined : gensym%%_54.size)});
    (((gensym%%_55) == (null)) ? undefined : gensym%%_55.height)}) as number));
    scrollMaxHeight -= this.titleHeight;
    scrollMaxHeight -= this.buttonHeight;
    scrollMaxHeight -= (({let gensym%%_56 = this.theme.windows.padding.top;
    (((gensym%%_56) == (null)) ? undefined : gensym%%_56.value)}) as number);
    scrollMaxHeight -= (((({let gensym%%_57 = this.theme.button.textMargin.bottom;
    (((gensym%%_57) == (null)) ? undefined : gensym%%_57.value)}) as number)) / (2));
    scrollMaxHeight -= (({let gensym%%_58 = this.theme.title.margin.bottom;
    (((gensym%%_58) == (null)) ? undefined : gensym%%_58.value)}) as number);
    scrollMaxHeight -= (((({let gensym%%_59 = this.theme.windows.padding.bottom;
    (((gensym%%_59) == (null)) ? undefined : gensym%%_59.value)}) as number)) - ((((({let gensym%%_60 = this.theme.button.textMargin.bottom;
    (((gensym%%_60) == (null)) ? undefined : gensym%%_60.value)}) as number)) / (2))));
    if (((Math.floor(this.textHeight)) > (Math.floor(((scrollMaxHeight) + (1)))))) {
      return scrollMaxHeight;
    } else {
      return undefined;
    }
  }
  
  private getLayoutWeight(): number {
    let layoutWeight: number;
    if (((((((((((({let gensym%%_61 = this.icon;
    (((gensym%%_61) == (null)) ? undefined : gensym%%_61.image)})) !== (""))) && (((({let gensym%%_62 = this.icon;
    (((gensym%%_62) == (null)) ? undefined : gensym%%_62.image)})) !== (undefined))))) || (((((({let gensym%%_63 = this.title;
    (((gensym%%_63) == (null)) ? undefined : gensym%%_63.text)})) !== (""))) && (((({let gensym%%_64 = this.title;
    (((gensym%%_64) == (null)) ? undefined : gensym%%_64.text)})) !== (undefined))))))) || (((((({let gensym%%_66 = ({let gensym%%_65 = this.buttons;
    (((gensym%%_65) == (null)) ? undefined : gensym%%_65[0])});
    (((gensym%%_66) == (null)) ? undefined : gensym%%_66.text)})) !== (""))) && (((({let gensym%%_68 = ({let gensym%%_67 = this.buttons;
    (((gensym%%_67) == (null)) ? undefined : gensym%%_67[0])});
    (((gensym%%_68) == (null)) ? undefined : gensym%%_68.text)})) !== (undefined))))))) || (((((({let gensym%%_70 = ({let gensym%%_69 = this.buttons;
    (((gensym%%_69) == (null)) ? undefined : gensym%%_69[1])});
    (((gensym%%_70) == (null)) ? undefined : gensym%%_70.text)})) !== (""))) && (((({let gensym%%_72 = ({let gensym%%_71 = this.buttons;
    (((gensym%%_71) == (null)) ? undefined : gensym%%_71[1])});
    (((gensym%%_72) == (null)) ? undefined : gensym%%_72.text)})) !== (undefined))))))) {
      layoutWeight = 1;
    } else {
      layoutWeight = 0;
    }
    return layoutWeight;
  }
  
  private resourceToVp(value: Resource): number {
    try {
      if ((((value as Resource).id) !== (-1))) {
        if (((({let gensym%%_74 = ({let gensym%%_73 = value;
        (((gensym%%_73) == (null)) ? undefined : gensym%%_73.type)});
        (((gensym%%_74) == (null)) ? undefined : gensym%%_74.toInt())})) === (RESOURCE_TYPE_FLOAT))) {
          return this.getUIContext().px2vp(Number.$_invoke(({let gensym%%_76 = ({let gensym%%_75 = this.getUIContext().getHostContext();
          (((gensym%%_75) == (null)) ? undefined : gensym%%_75.resourceManager)});
          (((gensym%%_76) == (null)) ? undefined : gensym%%_76.getDouble((value as Resource).id).toDouble())})).toDouble());
        }
        if (((({let gensym%%_78 = ({let gensym%%_77 = value;
        (((gensym%%_77) == (null)) ? undefined : gensym%%_77.type)});
        (((gensym%%_78) == (null)) ? undefined : gensym%%_78.toInt())})) === (RESOURCE_TYPE_INTEGER))) {
          return this.getUIContext().px2vp(Number.$_invoke(({let gensym%%_80 = ({let gensym%%_79 = this.getUIContext().getHostContext();
          (((gensym%%_79) == (null)) ? undefined : gensym%%_79.resourceManager)});
          (((gensym%%_80) == (null)) ? undefined : gensym%%_80.getInt((value as Resource).id).toDouble())})).toDouble());
        }
        return POPUP_DEFAULT_MAXWIDTH;
      } else {
        let valueParams: Array<string> = ([] as Array<string>);
        if (value.params) {
          ((value.params) ?? (([] as Array<(String | Int | Long | Double | Resource)>))).forEach(((item: (String | Int | Long | Double | Resource)) => {
            if ((((typeof item)) === ("string"))) {
              valueParams.push((item as string));
            }
          }));
        }
        return this.getUIContext().px2vp((({let gensym%%_82 = ({let gensym%%_81 = this.getUIContext().getHostContext();
        (((gensym%%_81) == (null)) ? undefined : gensym%%_81.resourceManager)});
        (((gensym%%_82) == (null)) ? undefined : gensym%%_82.getDoubleByName(((valueParams[0] as string).split(".")[2] as string)))}) as number));
      }
    } catch (error) {
      return POPUP_DEFAULT_MAXWIDTH;
    }
  }
  
  private toVp(value: (Dimension | Length | undefined)): number {
    let defaultDisplaySync: (display.Display | undefined) = undefined;
    let defaultDisplaySyncWidth: number = 0;
    try {
      defaultDisplaySync = display.getDefaultDisplaySync();
      defaultDisplaySyncWidth = defaultDisplaySync.width.toDouble();
    } catch (error) {
      console.error(\`Ace Popup getDefaultDisplaySync, error: \${error.toString()}\`);
      return Number.NEGATIVE_INFINITY;
    }
    if (((value) === (undefined))) {
      return Number.NEGATIVE_INFINITY;
    }
    switch ((typeof value)) {
      case "number": {
        return (value as number);
      }
      case "object": {
        try {
          let returnValue = this.resourceToVp((value as Resource));
          if (((((returnValue) === (0))) && (!(isValidResource(this.getUIContext().getHostContext(), (value as Resource)))))) {
            return Number.NEGATIVE_INFINITY;
          }
          return returnValue;
        } catch (error) {
          return Number.NEGATIVE_INFINITY;
        }
      }
      case "string": {
        let regex: RegExp = new RegExp("(-?\\\\d+(?:\\\\.\\\\d+)?)_?(fp|vp|px|lpx|%)?$", "i");
        let matches: (RegExpMatchArray | null) = ((value as string).match(regex) as RegExpMatchArray);
        if (!matches) {
          return Number.NEGATIVE_INFINITY;
        }
        let length: number = Number.$_invoke((((({let gensym%%_83 = matches;
        (((gensym%%_83) == (null)) ? undefined : gensym%%_83[1])}) as string)) ?? ("0")));
        let unit: string = ((({let gensym%%_84 = matches;
        (((gensym%%_84) == (null)) ? undefined : gensym%%_84[2])})) ?? ("vp"));
        switch (unit.toLowerCase()) {
          case "px": {
            length = this.getUIContext().px2vp(length);
            break;
          }
          case "fp": {
            length = this.getUIContext().px2vp(this.getUIContext().fp2px(length));
            break;
          }
          case "lpx": {
            length = this.getUIContext().px2vp(this.getUIContext().lpx2px(length));
            break;
          }
          case "%": {
            length = ((((length) / (100))) * (this.getUIContext().px2vp(defaultDisplaySyncWidth)));
            break;
          }
          case "vp": {
            break;
          }
          default: {
            break;
          }
        }
        return length;
      }
      default: {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  
  private getApplyMaxSize(): ConstraintSizeOptions {
    let applyMaxWidth: (number | undefined) = undefined;
    let applyMaxHeight: (number | undefined) = undefined;
    let applyMaxSize: (ConstraintSizeOptions | undefined) = undefined;
    let defaultDisplaySync: (display.Display | undefined) = undefined;
    let maxWidthSize: number = 400;
    try {
      defaultDisplaySync = display.getDefaultDisplaySync();
    } catch (error) {
      console.error(\`Ace Popup getDefaultDisplaySync, error: \${error.toString()}\`);
      this.messageMaxWeight = 400;
      return applyMaxSize = {
        maxWidth: 400,
        maxHeight: 480,
      };
    }
    if (((this.maxWidth) !== (undefined))) {
      if ((((((typeof this.maxWidth)) === ("number"))) && ((((this.maxWidth as number)) >= (0))))) {
        maxWidthSize = (this.maxWidth as number);
      } else {
        if ((((((typeof this.maxWidth)) === ("number"))) && (((0) > ((this.maxWidth as number)))))) {
          maxWidthSize = POPUP_DEFAULT_MAXWIDTH;
        } else {
          maxWidthSize = this.toVp(this.maxWidth);
        }
      }
    }
    if (((this.getUIContext().px2vp((({let gensym%%_85 = defaultDisplaySync;
    (((gensym%%_85) == (null)) ? undefined : gensym%%_85.width)}) as Long))) > (maxWidthSize))) {
      applyMaxWidth = maxWidthSize;
    } else {
      if (((({let gensym%%_86 = defaultDisplaySync;
      (((gensym%%_86) == (null)) ? undefined : gensym%%_86.width)})) != (0))) {
        applyMaxWidth = this.getUIContext().px2vp((({let gensym%%_87 = defaultDisplaySync;
        (((gensym%%_87) == (null)) ? undefined : gensym%%_87.width)}) as Long));
      } else {
        applyMaxWidth = -1;
      }
    }
    if (((this.getUIContext().px2vp((({let gensym%%_88 = defaultDisplaySync;
    (((gensym%%_88) == (null)) ? undefined : gensym%%_88.height)}) as Long))) > (480))) {
      applyMaxHeight = 480;
    } else {
      applyMaxHeight = ((((this.getUIContext().px2vp((({let gensym%%_89 = defaultDisplaySync;
      (((gensym%%_89) == (null)) ? undefined : gensym%%_89.height)}) as Long))) - (40))) - (40));
    }
    applyMaxSize = {
      maxWidth: applyMaxWidth,
      maxHeight: applyMaxHeight,
    };
    this.messageMaxWidth = applyMaxWidth;
    this.messageMaxWeight = this.getMessageMaxWeight(applyMaxWidth);
    return applyMaxSize;
  }
  
  private getTitleTextAlign(): TextAlign {
    let titleAlign = TextAlign.Start;
    try {
      let systemLanguage: string = I18n.System.getSystemLanguage();
      if (((I18n.isRTL(systemLanguage)) && (((((this.popupDirection) === (Direction.Auto))) || (((this.popupDirection) === (undefined))))))) {
        titleAlign = TextAlign.End;
      }
    } catch (error) {
      console.error(\`popup getSystemLanguage, error: \${error.toString()}\`);
    }
    return titleAlign;
  }
  
  @Memo() 
  public build() {
    RowImpl(@Memo() ((instance: RowAttribute): void => {
      instance.setRowOptions(undefined).direction(this.popupDirection).alignItems(VerticalAlign.Top).padding(this.getWindowsPadding()).constraintSize(this.getApplyMaxSize()).key(this.applyContentKey).onAreaChange(((_, rect) => {
        this.applyHeight = (rect.height as number);
      }));
      instance.applyAttributesFinish();
      return;
    }), @Memo() (() => {
      if (((((({let gensym%%_90 = this.icon;
      (((gensym%%_90) == (null)) ? undefined : gensym%%_90.image)})) !== (""))) && (((({let gensym%%_91 = this.icon;
      (((gensym%%_91) == (null)) ? undefined : gensym%%_91.image)})) !== (undefined))))) {
        ImageImpl(@Memo() ((instance: ImageAttribute): void => {
          instance.setImageOptions(this.getIconImage(), undefined).direction(this.popupDirection).width(this.getIconWidth()).height(this.getIconHeight()).margin(this.getIconMargin()).fillColor(this.getIconFillColor()).borderRadius(this.getIconBorderRadius()).draggable(false);
          instance.applyAttributesFinish();
          return;
        }));
      }
      if (((((({let gensym%%_92 = this.title;
      (((gensym%%_92) == (null)) ? undefined : gensym%%_92.text)})) !== (""))) && (((({let gensym%%_93 = this.title;
      (((gensym%%_93) == (null)) ? undefined : gensym%%_93.text)})) !== (undefined))))) {
        ColumnImpl(@Memo() ((instance: ColumnAttribute): void => {
          instance.setColumnOptions(undefined).direction(this.popupDirection).layoutWeight(this.getLayoutWeight());
          instance.applyAttributesFinish();
          return;
        }), @Memo() (() => {
          FlexImpl(@Memo() ((instance: FlexAttribute): void => {
            instance.setFlexOptions({
              alignItems: ItemAlign.Start,
            }).direction(this.popupDirection).width("100%").margin(this.getTitleMargin()).onAreaChange(((_, rect) => {
              this.titleHeight = (rect.height as number);
            }));
            instance.applyAttributesFinish();
            return;
          }), @Memo() (() => {
            TextImpl(@Memo() ((instance: TextAttribute): void => {
              instance.setTextOptions(this.getTitleText(), undefined).direction(this.popupDirection).flexGrow(1).maxLines(2).align(Alignment.Start).padding(this.getTitlePadding()).minFontSize(this.getTitleMinFontSize()).textOverflow({
                overflow: TextOverflow.Ellipsis,
              }).fontWeight(this.getTitleFontWeight()).fontSize(this.getTitleFontSize()).fontColor(this.getTitleFontColor()).constraintSize({
                minHeight: this.getCloseButtonHeight(),
              }).textAlign(this.getTitleTextAlign());
              instance.applyAttributesFinish();
              return;
            }), undefined);
            if (((this.showClose) || (((this.showClose) === (undefined))))) {
              ButtonImpl(@Memo() ((instance: ButtonAttribute): void => {
                instance.setButtonOptions(undefined).direction(this.popupDirection).width(this.getCloseButtonWidth()).height(this.getCloseButtonHeight()).padding(this.getCloseButtonPadding()).backgroundColor(this.closeButtonBackgroundColor).flexShrink(0).accessibilityText(this.theme.closeButton.accessibilityMessage).onHover(((isHover: boolean) => {
                  if (isHover) {
                    this.closeButtonBackgroundColor = this.getCloseButtonHoverColor();
                  } else {
                    this.closeButtonBackgroundColor = this.getCloseButtonBackgroundColor();
                  }
                })).onClick((() => {
                  if (this.onClose) {
                    this.onClose();
                  }
                }));
                instance.applyAttributesFinish();
                return;
              }), @Memo() (() => {
                if ((((((typeof this.showClose)) === ("object"))) && ((((((this.showClose as Resource).type) === (RESOURCE_TYPE_MEDIA))) || ((((this.showClose as Resource).type) === (RESOURCE_TYPE_RAWFILE))))))) {
                  this.closeButtonBuilderImage();
                } else {
                  if ((((((typeof this.showClose)) === ("object"))) && ((((this.showClose as Resource).type) === (RESOURCE_TYPE_SYMBOL))))) {
                    this.closeButtonBuilderSymbolGlyph(new SymbolGlyphModifier((this.showClose as Resource)));
                  } else {
                    this.closeButtonBuilderSymbolGlyph(this.theme.closeButton.symbolStyle);
                  }
                }
              }));
            }
          }));
          ScrollImpl(@Memo() ((instance: ScrollAttribute): void => {
            instance.setScrollOptions(undefined).direction(this.popupDirection).width("100%").align(Alignment.TopStart).padding(this.getMessagePadding()).scrollBar(BarState.Auto).scrollable(ScrollDirection.Vertical).constraintSize({
              maxHeight: this.getScrollMaxHeight(),
            }).edgeEffect(EdgeEffect.Spring, {
              alwaysEnabled: false,
            });
            instance.applyAttributesFinish();
            return;
          }), @Memo() (() => {
            TextImpl(@Memo() ((instance: TextAttribute): void => {
              instance.setTextOptions(this.getMessageText(), undefined).textAlign(this.getTitleTextAlign()).direction(this.popupDirection).fontSize(this.getMessageFontSize()).fontColor(this.getMessageFontColor()).fontWeight(this.getMessageFontWeight()).constraintSize({
                minHeight: this.getCloseButtonHeight(),
              }).onAreaChange(((_, rect) => {
                this.textHeight = (rect.height as number);
              }));
              instance.applyAttributesFinish();
              return;
            }), undefined);
          }));
          FlexImpl(@Memo() ((instance: FlexAttribute): void => {
            instance.setFlexOptions({
              wrap: FlexWrap.Wrap,
            }).direction(this.popupDirection).margin(this.getButtonTextMargin()).flexGrow(1).onAreaChange(((_, rect) => {
              if (((((((({let gensym%%_107 = ({let gensym%%_106 = this.buttons;
              (((gensym%%_106) == (null)) ? undefined : gensym%%_106[0])});
              (((gensym%%_107) == (null)) ? undefined : gensym%%_107.text)})) !== (""))) && (((({let gensym%%_109 = ({let gensym%%_108 = this.buttons;
              (((gensym%%_108) == (null)) ? undefined : gensym%%_108[0])});
              (((gensym%%_109) == (null)) ? undefined : gensym%%_109.text)})) !== (undefined))))) || (((((({let gensym%%_111 = ({let gensym%%_110 = this.buttons;
              (((gensym%%_110) == (null)) ? undefined : gensym%%_110[1])});
              (((gensym%%_111) == (null)) ? undefined : gensym%%_111.text)})) !== (""))) && (((({let gensym%%_113 = ({let gensym%%_112 = this.buttons;
              (((gensym%%_112) == (null)) ? undefined : gensym%%_112[1])});
              (((gensym%%_113) == (null)) ? undefined : gensym%%_113.text)})) !== (undefined))))))) {
                this.buttonHeight = (rect.height as number);
              } else {
                this.buttonHeight = 0;
              }
            }));
            instance.applyAttributesFinish();
            return;
          }), @Memo() (() => {
            if (((((({let gensym%%_95 = ({let gensym%%_94 = this.buttons;
            (((gensym%%_94) == (null)) ? undefined : gensym%%_94[0])});
            (((gensym%%_95) == (null)) ? undefined : gensym%%_95.text)})) !== (""))) && (((({let gensym%%_97 = ({let gensym%%_96 = this.buttons;
            (((gensym%%_96) == (null)) ? undefined : gensym%%_96[0])});
            (((gensym%%_97) == (null)) ? undefined : gensym%%_97.text)})) !== (undefined))))) {
              ButtonImpl(@Memo() ((instance: ButtonAttribute): void => {
                instance.setButtonOptions(undefined).type(ButtonType.Normal).borderRadius(_r(16777216, 10003, "com.example.mock", "entry")).direction(this.popupDirection).margin(this.getButtonMargin()).padding(this.getButtonTextPadding()).backgroundColor(this.firstButtonBackgroundColor).onHover(((isHover: boolean) => {
                  if (isHover) {
                    this.firstButtonBackgroundColor = this.getButtonHoverColor();
                  } else {
                    this.firstButtonBackgroundColor = this.getButtonBackgroundColor();
                  }
                })).onClick(({let gensym%%_99 = ({let gensym%%_98 = this.buttons;
                (((gensym%%_98) == (null)) ? undefined : gensym%%_98[0])});
                (((gensym%%_99) == (null)) ? undefined : gensym%%_99.action)}));
                instance.applyAttributesFinish();
                return;
              }), @Memo() (() => {
                TextImpl(@Memo() ((instance: TextAttribute): void => {
                  instance.setTextOptions(this.getFirstButtonText(), undefined).direction(this.popupDirection).maxLines(2).focusable(true).fontSize(this.getFirstButtonFontSize()).fontColor(this.getFirstButtonFontColor()).fontWeight(this.getButtonFontWeight()).minFontSize(this.getButtonMinFontSize()).textOverflow({
                    overflow: TextOverflow.Ellipsis,
                  });
                  instance.applyAttributesFinish();
                  return;
                }), undefined);
              }));
            }
            if (((((({let gensym%%_101 = ({let gensym%%_100 = this.buttons;
            (((gensym%%_100) == (null)) ? undefined : gensym%%_100[1])});
            (((gensym%%_101) == (null)) ? undefined : gensym%%_101.text)})) !== (""))) && (((({let gensym%%_103 = ({let gensym%%_102 = this.buttons;
            (((gensym%%_102) == (null)) ? undefined : gensym%%_102[1])});
            (((gensym%%_103) == (null)) ? undefined : gensym%%_103.text)})) !== (undefined))))) {
              ButtonImpl(@Memo() ((instance: ButtonAttribute): void => {
                instance.setButtonOptions(undefined).type(ButtonType.Normal).borderRadius(_r(16777216, 10003, "com.example.mock", "entry")).direction(this.popupDirection).margin(this.getButtonMargin()).padding(this.getButtonTextPadding()).backgroundColor(this.secondButtonBackgroundColor).onHover(((isHover: boolean) => {
                  if (isHover) {
                    this.secondButtonBackgroundColor = this.getButtonHoverColor();
                  } else {
                    this.secondButtonBackgroundColor = this.getButtonBackgroundColor();
                  }
                })).onClick(({let gensym%%_105 = ({let gensym%%_104 = this.buttons;
                (((gensym%%_104) == (null)) ? undefined : gensym%%_104[1])});
                (((gensym%%_105) == (null)) ? undefined : gensym%%_105.action)}));
                instance.applyAttributesFinish();
                return;
              }), @Memo() (() => {
                TextImpl(@Memo() ((instance: TextAttribute): void => {
                  instance.setTextOptions(this.getSecondButtonText(), undefined).direction(this.popupDirection).maxLines(2).focusable(true).fontSize(this.getSecondButtonFontSize()).fontColor(this.getSecondButtonFontColor()).fontWeight(this.getButtonFontWeight()).minFontSize(this.getButtonMinFontSize()).textOverflow({
                    overflow: TextOverflow.Ellipsis,
                  });
                  instance.applyAttributesFinish();
                  return;
                }), undefined);
              }));
            }
          }));
        }));
      } else {
        ColumnImpl(@Memo() ((instance: ColumnAttribute): void => {
          instance.setColumnOptions(undefined).direction(this.popupDirection).layoutWeight(this.getLayoutWeight());
          instance.applyAttributesFinish();
          return;
        }), @Memo() (() => {
          FlexImpl(@Memo() ((instance: FlexAttribute): void => {
            instance.setFlexOptions(undefined).height(0).onAreaChange(((_, rect) => {
              this.titleHeight = (rect.height as number);
            }));
            instance.applyAttributesFinish();
            return;
          }), undefined);
          RowImpl(@Memo() ((instance: RowAttribute): void => {
            instance.setRowOptions(undefined).direction(this.popupDirection).alignItems(VerticalAlign.Top);
            instance.applyAttributesFinish();
            return;
          }), @Memo() (() => {
            ScrollImpl(@Memo() ((instance: ScrollAttribute): void => {
              instance.setScrollOptions(undefined).direction(this.popupDirection).layoutWeight(this.getLayoutWeight()).edgeEffect(EdgeEffect.Spring, {
                alwaysEnabled: false,
              }).align(Alignment.TopStart).padding(this.getMessagePadding()).scrollBar(BarState.Auto).scrollable(ScrollDirection.Vertical).constraintSize({
                maxHeight: this.getScrollMaxHeight(),
              });
              instance.applyAttributesFinish();
              return;
            }), @Memo() (() => {
              TextImpl(@Memo() ((instance: TextAttribute): void => {
                instance.setTextOptions(this.getMessageText(), undefined).textAlign(this.getTitleTextAlign()).direction(this.popupDirection).fontSize(this.getMessageFontSize()).fontColor(this.getMessageFontColor()).fontWeight(this.getMessageFontWeight()).constraintSize({
                  maxWidth: this.messageMaxWeight,
                  minHeight: this.getCloseButtonHeight(),
                }).onAreaChange(((_, rect) => {
                  this.textHeight = (rect.height as number);
                }));
                instance.applyAttributesFinish();
                return;
              }), undefined);
            }));
            if (((this.showClose) || (((this.showClose) === (undefined))))) {
              ButtonImpl(@Memo() ((instance: ButtonAttribute): void => {
                instance.setButtonOptions(undefined).direction(this.popupDirection).width(this.getCloseButtonWidth()).height(this.getCloseButtonHeight()).padding(this.getCloseButtonPadding()).backgroundColor(this.closeButtonBackgroundColor).flexShrink(0).accessibilityText(this.theme.closeButton.accessibilityMessage).onHover(((isHover: boolean) => {
                  if (isHover) {
                    this.closeButtonBackgroundColor = this.getCloseButtonHoverColor();
                  } else {
                    this.closeButtonBackgroundColor = this.getCloseButtonBackgroundColor();
                  }
                })).onClick((() => {
                  if (this.onClose) {
                    this.onClose();
                  }
                }));
                instance.applyAttributesFinish();
                return;
              }), @Memo() (() => {
                if ((((((typeof this.showClose)) === ("object"))) && ((((((this.showClose as Resource).type) === (RESOURCE_TYPE_MEDIA))) || ((((this.showClose as Resource).type) === (RESOURCE_TYPE_RAWFILE))))))) {
                  this.closeButtonBuilderImage();
                } else {
                  if ((((((typeof this.showClose)) === ("object"))) && ((((this.showClose as Resource).type) === (RESOURCE_TYPE_SYMBOL))))) {
                    this.closeButtonBuilderSymbolGlyph(new SymbolGlyphModifier((this.showClose as Resource)));
                  } else {
                    this.closeButtonBuilderSymbolGlyph(this.theme.closeButton.symbolStyle);
                  }
                }
              }));
            }
          }));
          FlexImpl(@Memo() ((instance: FlexAttribute): void => {
            instance.setFlexOptions({
              wrap: FlexWrap.Wrap,
            }).direction(this.popupDirection).margin(this.getButtonTextMargin()).flexGrow(1).onAreaChange(((_, rect) => {
              if (((((((({let gensym%%_127 = ({let gensym%%_126 = this.buttons;
              (((gensym%%_126) == (null)) ? undefined : gensym%%_126[0])});
              (((gensym%%_127) == (null)) ? undefined : gensym%%_127.text)})) !== (""))) && (((({let gensym%%_129 = ({let gensym%%_128 = this.buttons;
              (((gensym%%_128) == (null)) ? undefined : gensym%%_128[0])});
              (((gensym%%_129) == (null)) ? undefined : gensym%%_129.text)})) !== (undefined))))) || (((((({let gensym%%_131 = ({let gensym%%_130 = this.buttons;
              (((gensym%%_130) == (null)) ? undefined : gensym%%_130[1])});
              (((gensym%%_131) == (null)) ? undefined : gensym%%_131.text)})) !== (""))) && (((({let gensym%%_133 = ({let gensym%%_132 = this.buttons;
              (((gensym%%_132) == (null)) ? undefined : gensym%%_132[1])});
              (((gensym%%_133) == (null)) ? undefined : gensym%%_133.text)})) !== (undefined))))))) {
                this.buttonHeight = (rect.height as number);
              } else {
                this.buttonHeight = 0;
              }
            }));
            instance.applyAttributesFinish();
            return;
          }), @Memo() (() => {
            if (((((({let gensym%%_115 = ({let gensym%%_114 = this.buttons;
            (((gensym%%_114) == (null)) ? undefined : gensym%%_114[0])});
            (((gensym%%_115) == (null)) ? undefined : gensym%%_115.text)})) !== (""))) && (((({let gensym%%_117 = ({let gensym%%_116 = this.buttons;
            (((gensym%%_116) == (null)) ? undefined : gensym%%_116[0])});
            (((gensym%%_117) == (null)) ? undefined : gensym%%_117.text)})) !== (undefined))))) {
              ButtonImpl(@Memo() ((instance: ButtonAttribute): void => {
                instance.setButtonOptions(undefined).type(ButtonType.Normal).borderRadius(_r(16777216, 10003, "com.example.mock", "entry")).direction(this.popupDirection).margin(this.getButtonMargin()).padding(this.getButtonTextPadding()).backgroundColor(this.firstButtonBackgroundColor).onHover(((isHover: boolean) => {
                  if (isHover) {
                    this.firstButtonBackgroundColor = this.getButtonHoverColor();
                  } else {
                    this.firstButtonBackgroundColor = this.getButtonBackgroundColor();
                  }
                })).onClick(({let gensym%%_119 = ({let gensym%%_118 = this.buttons;
                (((gensym%%_118) == (null)) ? undefined : gensym%%_118[0])});
                (((gensym%%_119) == (null)) ? undefined : gensym%%_119.action)}));
                instance.applyAttributesFinish();
                return;
              }), @Memo() (() => {
                TextImpl(@Memo() ((instance: TextAttribute): void => {
                  instance.setTextOptions(this.getFirstButtonText(), undefined).direction(this.popupDirection).maxLines(2).focusable(true).fontSize(this.getFirstButtonFontSize()).fontColor(this.getFirstButtonFontColor()).fontWeight(this.getButtonFontWeight()).minFontSize(this.getButtonMinFontSize()).textOverflow({
                    overflow: TextOverflow.Ellipsis,
                  });
                  instance.applyAttributesFinish();
                  return;
                }), undefined);
              }));
            }
            if (((((({let gensym%%_121 = ({let gensym%%_120 = this.buttons;
            (((gensym%%_120) == (null)) ? undefined : gensym%%_120[1])});
            (((gensym%%_121) == (null)) ? undefined : gensym%%_121.text)})) !== (""))) && (((({let gensym%%_123 = ({let gensym%%_122 = this.buttons;
            (((gensym%%_122) == (null)) ? undefined : gensym%%_122[1])});
            (((gensym%%_123) == (null)) ? undefined : gensym%%_123.text)})) !== (undefined))))) {
              ButtonImpl(@Memo() ((instance: ButtonAttribute): void => {
                instance.setButtonOptions(undefined).type(ButtonType.Normal).borderRadius(_r(16777216, 10003, "com.example.mock", "entry")).direction(this.popupDirection).margin(this.getButtonMargin()).padding(this.getButtonTextPadding()).backgroundColor(this.secondButtonBackgroundColor).onHover(((isHover: boolean) => {
                  if (isHover) {
                    this.secondButtonBackgroundColor = this.getButtonHoverColor();
                  } else {
                    this.secondButtonBackgroundColor = this.getButtonBackgroundColor();
                  }
                })).onClick(({let gensym%%_125 = ({let gensym%%_124 = this.buttons;
                (((gensym%%_124) == (null)) ? undefined : gensym%%_124[1])});
                (((gensym%%_125) == (null)) ? undefined : gensym%%_125.action)}));
                instance.applyAttributesFinish();
                return;
              }), @Memo() (() => {
                TextImpl(@Memo() ((instance: TextAttribute): void => {
                  instance.setTextOptions(this.getSecondButtonText(), undefined).direction(this.popupDirection).maxLines(2).focusable(true).fontSize(this.getSecondButtonFontSize()).fontColor(this.getSecondButtonFontColor()).fontWeight(this.getButtonFontWeight()).minFontSize(this.getButtonMinFontSize()).textOverflow({
                    overflow: TextOverflow.Ellipsis,
                  });
                  instance.applyAttributesFinish();
                  return;
                }), undefined);
              }));
            }
          }));
        }));
      }
    }));
  }
  
  protected constructor(useSharedStorage?: boolean, storage?: LocalStorage) {
    super(useSharedStorage, storage);
  }
  
  static {
    
  }
}

@Component() class __Options_PopupComponent {
  public onClose?: ((()=> void) | undefined);
  public __options_has_onClose?: boolean;
  public theme?: PopupTheme;
  public __options_has_theme?: boolean;
  public applyContentKey?: string;
  public __options_has_applyContentKey?: boolean;
  @PropRef() public icon?: (PopupIconOptions | undefined);
  public __backing_icon?: IPropRefDecoratedVariable<(PopupIconOptions | undefined)>;
  public __options_has_icon?: boolean;
  @PropRef() public maxWidth?: (Dimension | undefined);
  public __backing_maxWidth?: IPropRefDecoratedVariable<(Dimension | undefined)>;
  public __options_has_maxWidth?: boolean;
  @PropRef() public messageMaxWidth?: (number | undefined);
  public __backing_messageMaxWidth?: IPropRefDecoratedVariable<(number | undefined)>;
  public __options_has_messageMaxWidth?: boolean;
  @PropRef() public title?: (PopupTextOptions | undefined);
  public __backing_title?: IPropRefDecoratedVariable<(PopupTextOptions | undefined)>;
  public __options_has_title?: boolean;
  @PropRef() public message?: (PopupTextOptions | undefined);
  public __backing_message?: IPropRefDecoratedVariable<(PopupTextOptions | undefined)>;
  public __options_has_message?: boolean;
  @PropRef() public popupDirection?: (Direction | undefined);
  public __backing_popupDirection?: IPropRefDecoratedVariable<(Direction | undefined)>;
  public __options_has_popupDirection?: boolean;
  @PropRef() public showClose?: (boolean | Resource | undefined);
  public __backing_showClose?: IPropRefDecoratedVariable<(boolean | Resource | undefined)>;
  public __options_has_showClose?: boolean;
  @PropRef() public buttons?: ([(PopupButtonOptions | undefined), (PopupButtonOptions | undefined)] | undefined);
  public __backing_buttons?: IPropRefDecoratedVariable<([(PopupButtonOptions | undefined), (PopupButtonOptions | undefined)] | undefined)>;
  public __options_has_buttons?: boolean;
  public textHeight?: number;
  public __options_has_textHeight?: boolean;
  @State() public titleHeight?: number;
  public __backing_titleHeight?: IStateDecoratedVariable<number>;
  public __options_has_titleHeight?: boolean;
  @State() public applyHeight?: number;
  public __backing_applyHeight?: IStateDecoratedVariable<number>;
  public __options_has_applyHeight?: boolean;
  @State() public buttonHeight?: number;
  public __backing_buttonHeight?: IStateDecoratedVariable<number>;
  public __options_has_buttonHeight?: boolean;
  @State() public messageMaxWeight?: (number | undefined);
  public __backing_messageMaxWeight?: IStateDecoratedVariable<(number | undefined)>;
  public __options_has_messageMaxWeight?: boolean;
  public beforeScreenStatus?: (boolean | undefined);
  public __options_has_beforeScreenStatus?: boolean;
  @State() public currentScreenStatus?: (boolean | undefined);
  public __backing_currentScreenStatus?: IStateDecoratedVariable<(boolean | undefined)>;
  public __options_has_currentScreenStatus?: boolean;
  @State() public applySizeOptions?: (ConstraintSizeOptions | undefined);
  public __backing_applySizeOptions?: IStateDecoratedVariable<(ConstraintSizeOptions | undefined)>;
  public __options_has_applySizeOptions?: boolean;
  @State() public closeButtonBackgroundColor?: ResourceColor;
  public __backing_closeButtonBackgroundColor?: IStateDecoratedVariable<ResourceColor>;
  public __options_has_closeButtonBackgroundColor?: boolean;
  @State() public firstButtonBackgroundColor?: ResourceColor;
  public __backing_firstButtonBackgroundColor?: IStateDecoratedVariable<ResourceColor>;
  public __options_has_firstButtonBackgroundColor?: boolean;
  @State() public secondButtonBackgroundColor?: ResourceColor;
  public __backing_secondButtonBackgroundColor?: IStateDecoratedVariable<ResourceColor>;
  public __options_has_secondButtonBackgroundColor?: boolean;
  @State() public closeButtonFillColorWithTheme?: ResourceColor;
  public __backing_closeButtonFillColorWithTheme?: IStateDecoratedVariable<ResourceColor>;
  public __options_has_closeButtonFillColorWithTheme?: boolean;
  public listener?: (mediaQuery.MediaQueryListener | undefined);
  public __options_has_listener?: boolean;
  public constructor() {}
  
}
`;

function testMockPopupUITransformer(this: PluginTestContext): void {
    expect(parseDumpSrc(this.scriptSnapshot ?? '')).toBe(parseDumpSrc(expectedScript));
}

pluginTester.run(
    'transform advanced-ui-components mock-popup',
    [parsedTransform, collectNoRecheck, uiNoRecheck, memoNoRecheck, recheck],
    {
        'checked:ui-no-recheck': [testMockPopupUITransformer],
    },
    {
        stopAfter: 'checked',
    }
);
