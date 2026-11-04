# 验证点1（VM-1 / AC-1.1）：V1 正例——@Component 组件向 @Require 修饰且声明类型不含 undefined 的字段显式传 undefined，构建输出恰 1 条非阻断 WARNING，编译继续完成、无新增 ERROR

```ts
@Entry
@Component
struct RequireUndefinedDemoParent {
  build() {
    Column() {
      RequireUndefinedDemoChild({ 
        require_value: undefined // 预期输出恰 1 条 WARN：'@Require' decorated 'require_value' expects type 'number' but got 'undefined' through the component constructor.
      }) 
    }
  }
}

@Component
struct RequireUndefinedDemoChild {
  @Require require_value: number = 1

  build() {
    Row() {}
  }
}
```

# 验证点2（VM-2 / AC-1.2）：V2 正例——@ComponentV2 组件向 @Require 与 @Param 共同修饰且声明类型不含 undefined 的字段显式传 undefined，输出与验证点1 同级别、同文案、同定位的 1 条 WARNING

```ts
@Entry
@ComponentV2
struct RequireUndefinedV2DemoParent {
  build() {
    Column() {
      RequireUndefinedV2DemoChild({
        require_param_value: undefined // 预期输出恰 1 条 WARN：'@Require' decorated 'require_param_value' expects type 'string' but got 'undefined' through the component constructor.
      })
    }
  }
}

@ComponentV2
struct RequireUndefinedV2DemoChild {
  @Require @Param require_param_value: string = "hello"

  build() {
    Row() {}
  }
}
```

# 验证点3（VM-3 / AC-1.3）：类型边界反例——字段声明类型含 undefined（联合类型，可选属性等价形式归一为联合）或为 ESObject（any/unknown 在 ArkTS 中的替代动态类型）时，显式传 undefined 输出 0 条本特性告警

```ts
@Entry
@Component
struct TypeBoundaryDemoParent {
  build() {
    Column() {
      TypeBoundaryDemoChild({
        union_value: undefined,
        es_object_value: undefined
      })
    }
  }
}

@Component
struct TypeBoundaryDemoChild {
  @Require union_value: number | undefined = 1
  @Require es_object_value: ESObject = 1

  build() {
    Row() {}
  }
}
```

# 验证点4（VM-4 / AC-1.4）：无 @Require 修饰反例——无 @Require 修饰的字段显式传 undefined，输出 0 条本特性告警

```ts
@Entry
@Component
struct NoRequireDemoParent {
  build() {
    Column() {
      NoRequireDemoChild({ plain_value: undefined })
    }
  }
}

@Component
struct NoRequireDemoChild {
  plain_value: number = 1

  build() {
    Row() {}
  }
}
```

# 验证点5（VM-5 / AC-1.5）：非 undefined 标识符反例——@Require 字段以解析类型不含 undefined 的变量、表达式传值，或嵌套对象内部出现 undefined 时，输出 0 条本特性告警

```ts
interface NestedData {
  inner_value: number
}

@Entry
@Component
struct NonIdentifierDemoParent {
  @State numValue: number = 5

  build() {
    Column() {
      NonIdentifierDemoChild({
        variable_value: this.numValue,
        expression_value: this.numValue + 1,
        nested_value: { inner_value: undefined }
      })
    }
  }
}

@Component
struct NonIdentifierDemoChild {
  @Require variable_value: number = 1
  @Require expression_value: number = 1
  @Require nested_value: NestedData = { inner_value: 1 }

  build() {
    Row() {}
  }
}
```

# 验证点7（VM-7 / AC-1.6）：V1 类型级正例——@Component 组件向 @Require 修饰且声明类型不含 undefined 的字段传入 void 0 或类型含 undefined 的联合类型变量，每命中字段输出恰 1 条非阻断 WARNING（got 段为传入值解析类型文本），编译继续完成、无新增 ERROR

```ts
@Entry
@Component
struct RequireTypeLevelDemoParent {
  plainUnion: number | undefined = 1

  build() {
    Column() {
      RequireTypeLevelDemoChild({
        void_value: void 0, // 预期输出恰 1 条 WARN：'@Require' decorated 'void_value' expects type 'number' but got 'undefined' through the component constructor.
        union_variable_value: this.plainUnion // 预期输出恰 1 条 WARN：'@Require' decorated 'union_variable_value' expects type 'number' but got 'number | undefined' through the component constructor.
      })
    }
  }
}

@Component
struct RequireTypeLevelDemoChild {
  @Require void_value: number = 1
  @Require union_variable_value: number = 1

  build() {
    Row() {}
  }
}
```

V2 同构正例（`@ComponentV2` + `@Require @Param`，联合类型变量由 `@Local` 成员承载）：

```ts
@Entry
@ComponentV2
struct RequireTypeLevelV2DemoParent {
  @Local unionParamVariable: string | undefined = "hello"

  build() {
    Column() {
      RequireTypeLevelV2DemoChild({
        void_param_value: void 0, // 预期输出恰 1 条 WARN：'@Require' decorated 'void_param_value' expects type 'string' but got 'undefined' through the component constructor.
        union_param_value: this.unionParamVariable // 预期输出恰 1 条 WARN：'@Require' decorated 'union_param_value' expects type 'string' but got 'string | undefined' through the component constructor.
      })
    }
  }
}

@ComponentV2
struct RequireTypeLevelV2DemoChild {
  @Require @Param void_param_value: string = "a"
  @Require @Param union_param_value: string = "b"

  build() {
    Row() {}
  }
}
```

# 验证点8（VM-8 / AC-1.5）：类型级反例——联合类型变量经空值守卫收窄后传值（解析类型已不含 undefined），或以 ESObject 动态类型值传值（解析类型不明，不判定）时，输出 0 条本特性告警

```ts
@Entry
@Component
struct TypeLevelBoundaryDemoParent {
  plainUnion: number | undefined = 1
  dynamicValue: ESObject = 2

  build() {
    Column() {
      if (this.plainUnion !== undefined) {
        TypeLevelBoundaryDemoChild({
          narrowed_value: this.plainUnion,
          dynamic_value: this.dynamicValue
        })
      }
    }
  }
}

@Component
struct TypeLevelBoundaryDemoChild {
  @Require narrowed_value: number = 1
  @Require dynamic_value: number = 1

  build() {
    Row() {}
  }
}
```
