/*
 * Copyright (c) 2022-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifndef CONVERTORS_ETS_H
#define CONVERTORS_ETS_H

#ifdef KOALA_ETS_NAPI

#include <memory>
#include <vector>
#include <string>
#include <cmath>
#include <tuple>
#include <unordered_map>

#include "etsapi.h"
#include "koala-types.h"

template<class T>
struct InteropTypeConverter {
    using InteropType = T;
    static T convertFrom(EtsEnv* env, InteropType value) { return value; }
    static InteropType convertTo(EtsEnv* env, T value) { return value; }
    static void release(EtsEnv* env, InteropType value, T converted) {}
};

template<>
struct InteropTypeConverter<KStringPtr> {
    using InteropType = ets_string;
    static KStringPtr convertFrom(EtsEnv* env, InteropType value) {
        if (value == nullptr) return KStringPtr();
        KStringPtr result;
        // Notice that we use UTF length for buffer size, but counter is expressed in number of Unicode chars.
        result.resize(env->GetStringUTFLength(value));
        env->GetStringUTFRegion(value, 0, env->GetStringLength(value), result.data());
        return result;
    }
    static InteropType convertTo(EtsEnv* env, const KStringPtr& value) {
      return env->NewStringUTF(value.c_str());
    }
    static void release(EtsEnv* env, InteropType value, const KStringPtr& converted) {}
};

template<>
struct InteropTypeConverter<KNativePointer> {
    using InteropType = ets_long;
    static KNativePointer convertFrom(EtsEnv* env, InteropType value) {
      return reinterpret_cast<KNativePointer>(value);
    }
    static InteropType convertTo(EtsEnv* env, KNativePointer value) {
      return reinterpret_cast<ets_long>(value);
    }
    static void release(EtsEnv* env, InteropType value, KNativePointer converted) {}
};

template<>
struct InteropTypeConverter<KInt*> {
    using InteropType = ets_intArray;
    static KInt* convertFrom(EtsEnv* env, InteropType value) {
     if (!value) return nullptr;
      return env->PinIntArray(value);
    }
    static InteropType convertTo(EtsEnv* env, KInt* value) = delete;
    static void release(EtsEnv* env, InteropType value, KInt* converted) {
      if (value) env->UnpinIntArray(value);
    }
};

template<>
struct InteropTypeConverter<KFloat*> {
    using InteropType = ets_floatArray;
    static KFloat* convertFrom(EtsEnv* env, InteropType value) {
      if (!value) return nullptr;
      return env->PinFloatArray(value);
    }
    static InteropType convertTo(EtsEnv* env, KFloat* value) = delete;
    static void release(EtsEnv* env, InteropType value, KFloat* converted) {
      if (value) env->UnpinFloatArray(value);
    }
};

template<>
struct InteropTypeConverter<KByte*> {
    using InteropType = ets_byteArray;
    static KByte* convertFrom(EtsEnv* env, InteropType value) {
     if (!value) return nullptr;
      return (KByte*)env->PinByteArray(value);
    }
    static InteropType convertTo(EtsEnv* env, KByte* value) = delete;
    static void release(EtsEnv* env, InteropType value, KByte* converted) {
      if (value) env->UnpinByteArray((ets_byteArray)value);
    }
};

template <> struct InteropTypeConverter<KInteropNumber> {
  using InteropType = ets_double;
  static KInteropNumber convertFrom(EtsEnv *env, InteropType value) {
    return KInteropNumber::fromDouble(value);
  }
  static InteropType convertTo(EtsEnv *env, KInteropNumber value) {
    return value.asDouble();
  }
  static void release(EtsEnv *env, InteropType value,
                      KInteropNumber converted) {}
};

template<>
struct InteropTypeConverter<KLength> {
  using InteropType = ets_object;
  static KLength convertFrom(EtsEnv* env, InteropType value) {
    const static ets_class double_class = reinterpret_cast<ets_class>(env->NewGlobalRef(env->FindClass("std/core/Double")));
    const static ets_class int_class = reinterpret_cast<ets_class>(env->NewGlobalRef(env->FindClass("std/core/Int")));
    const static ets_class string_class = reinterpret_cast<ets_class>(env->NewGlobalRef(env->FindClass("std/core/String")));
    const static ets_class resource_class = reinterpret_cast<ets_class>(
      env->NewGlobalRef(env->FindClass("@koalaui/arkts-arkui/generated/ArkResourceInterfaces/Resource")));

    if (env->IsInstanceOf(value, double_class)) {
      const static ets_method double_p = env->Getp_method(double_class, "unboxed", ":D");
      return KLength{ 1, (KFloat)env->CallDoubleMethod(value, double_p), 1, 0 };
    } else if (env->IsInstanceOf(value, int_class)) {
      const static ets_method int_p = env->Getp_method(int_class, "unboxed", ":I");
      return KLength{ 1, (KFloat)env->CallIntMethod(value, int_p), 1, 0 };
    } else if (env->IsInstanceOf(value, string_class)) {
      KStringPtr ptr = InteropTypeConverter<KStringPtr>::convertFrom(env, reinterpret_cast<ets_string>(value));
      KLength length = { 0 };
      parseKLength(ptr, &length);
      length.type = 2;
      length.resource = 0;
      return length;
    } else if (env->IsInstanceOf(value, resource_class)) {
      const static ets_method resource_p = env->Getp_method(resource_class, "<get>id", ":D");
      return KLength{ 3, 0, 1, (KInt)env->CallDoubleMethod(value, resource_p) };
    } else {
      return KLength( { 0, 0, 0, 0});
    }
  }
  static InteropType convertTo(EtsEnv* env, KLength value) = delete;
  static void release(EtsEnv* env, InteropType value, const KLength& converted) {}
};

template <typename Type>
inline typename InteropTypeConverter<Type>::InteropType makeResult(EtsEnv* env, Type value) {
  return InteropTypeConverter<Type>::convertTo(env, value);
}

template <typename Type>
inline Type getArgument(EtsEnv* env, typename InteropTypeConverter<Type>::InteropType arg) {
  return InteropTypeConverter<Type>::convertFrom(env, arg);
}

template <typename Type>
inline void releaseArgument(EtsEnv* env, typename InteropTypeConverter<Type>::InteropType arg, Type& data) {
  InteropTypeConverter<Type>::release(env, arg, data);
}

#define ETS_SLOW_NATIVE_FLAG 1

class EtsExports {
    std::unordered_map<std::string,
        std::vector<std::tuple<std::string, std::string, void*, int>>> implementations;
    std::unordered_map<std::string, std::string> classpaths;

public:
    static EtsExports* getInstance();

    std::vector<std::string> getModules();
    void addMethod(const char* module, const char* name, const char* type, void* impl, int flags);
    const std::vector<std::tuple<std::string, std::string, void*, int>>& getMethods(const std::string& module);

    void setClasspath(const char* module, const char* classpath);
    const std::string& getClasspath(const std::string& module);
};

#define KOALA_QUOTE0(x) #x
#define KOALA_QUOTE(x) KOALA_QUOTE0(x)

#ifdef _MSC_VER
#define MAKE_ETS_EXPORT(module, name, type, flag)                             \
    static void __init_##name() {                               \
        EtsExports::getInstance()->addMethod(KOALA_QUOTE(module), "_"#name, type, reinterpret_cast<void *>(Ark_##name), flag); \
    }                                                           \
    namespace {                                                 \
      struct __Init_##name {                                    \
        __Init_##name() {  __init_##name(); }                   \
      } __Init_##name##_v;                                      \
    }
#define KOALA_ETS_INTEROP_MODULE_CLASSPATH(module, classpath)                                 \
    static void __init_classpath_##module() {                                                 \
        EtsExports::getInstance()->setClasspath(KOALA_QUOTE(module), classpath); \
    }                                                                                         \
    namespace {                                                                               \
      struct __Init_classpath_##module {                                                      \
        __Init_classpath_##module() {  __init_classpath_##module(); }                         \
      } __Init_classpath_##module##_v;                                                        \
    }
#else
#define MAKE_ETS_EXPORT(module, name, type, flag) \
    __attribute__((constructor)) \
    static void __init_ets_##name() { \
        EtsExports::getInstance()->addMethod(KOALA_QUOTE(module), "_"#name, type, reinterpret_cast<void *>(Ark_##name), flag); \
    }
#define KOALA_ETS_INTEROP_MODULE_CLASSPATH(module, classpath)                                 \
    __attribute__((constructor))                                                              \
    static void __init_ets_classpath_##module() {                                             \
        EtsExports::getInstance()->setClasspath(KOALA_QUOTE(module), classpath); \
    }
#endif

#define KOALA_INTEROP_0(name, Ret) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz) { \
      KOALA_MAYBE_LOG(name)                       \
      return makeResult<Ret>(env, impl_##name()); \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret, 0)

#define KOALA_INTEROP_1(name, Ret, P0) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
   InteropTypeConverter<P0>::InteropType _p0) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, _p0); \
      auto rv = makeResult<Ret>(env, impl_##name(p0)); \
      releaseArgument(env, _p0, p0); \
      return rv; \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0, 0)

#define KOALA_INTEROP_2(name, Ret, P0, P1) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      return rv; \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1, 0)

#define KOALA_INTEROP_3(name, Ret, P0, P1, P2) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      return rv; \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1 "|" #P2, 0)

#define KOALA_INTEROP_4(name, Ret, P0, P1, P2, P3) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      return rv; \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3, 0)

#define KOALA_INTEROP_5(name, Ret, P0, P1, P2, P3, P4) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      return rv; \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4, 0)

#define KOALA_INTEROP_6(name, Ret, P0, P1, P2, P3, P4, P5) \
InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      return rv; \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5, 0)

#define KOALA_INTEROP_7(name, Ret, P0, P1, P2, P3, P4, P5, P6) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      return rv; \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6, 0)

#define KOALA_INTEROP_8(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      return rv; \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7, 0)

#define KOALA_INTEROP_9(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7, \
    InteropTypeConverter<P8>::InteropType _p8) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      return rv; \
  } \
  MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7 "|" #P8, 0)

#define KOALA_INTEROP_10(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7, \
    InteropTypeConverter<P8>::InteropType _p8, \
    InteropTypeConverter<P9>::InteropType _p9) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      return rv; \
   } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7 "|" #P8 "|" #P9, 0)

#define KOALA_INTEROP_11(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7, \
    InteropTypeConverter<P8>::InteropType _p8, \
    InteropTypeConverter<P9>::InteropType _p9, \
    InteropTypeConverter<P10>::InteropType _p10) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
      return rv; \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7 "|" #P8 "|" #P9 "|" #P10, 0)

#define KOALA_INTEROP_12(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7, \
    InteropTypeConverter<P8>::InteropType _p8, \
    InteropTypeConverter<P9>::InteropType _p9, \
    InteropTypeConverter<P10>::InteropType _p10, \
    InteropTypeConverter<P11>::InteropType _p11) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      P11 p11 = getArgument<P11>(env, _p11); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
      releaseArgument(env, _p11, p11); \
      return rv; \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7 "|" #P8 "|" #P9 "|" #P10 "|" #P11, 0)

#define KOALA_INTEROP_13(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7, \
    InteropTypeConverter<P8>::InteropType _p8, \
    InteropTypeConverter<P9>::InteropType _p9, \
    InteropTypeConverter<P10>::InteropType _p10, \
    InteropTypeConverter<P11>::InteropType _p11, \
    InteropTypeConverter<P12>::InteropType _p12) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      P11 p11 = getArgument<P11>(env, _p11); \
      P12 p12 = getArgument<P12>(env, _p12); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
      releaseArgument(env, _p11, p11); \
      releaseArgument(env, _p12, p12); \
      return rv; \
  } \
  MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7 "|" #P8 "|" #P9 "|" #P10 "|" #P11 "|" #P12, 0)

#define KOALA_INTEROP_14(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7, \
    InteropTypeConverter<P8>::InteropType _p8, \
    InteropTypeConverter<P9>::InteropType _p9, \
    InteropTypeConverter<P10>::InteropType _p10, \
    InteropTypeConverter<P11>::InteropType _p11, \
    InteropTypeConverter<P12>::InteropType _p12, \
    InteropTypeConverter<P13>::InteropType _p13) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      P11 p11 = getArgument<P11>(env, _p11); \
      P12 p12 = getArgument<P12>(env, _p12); \
      P13 p13 = getArgument<P13>(env, _p13); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
      releaseArgument(env, _p11, p11); \
      releaseArgument(env, _p12, p12); \
      releaseArgument(env, _p13, p13); \
      return rv; \
    } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7 "|" #P8 "|" #P9 "|" #P10 "|" #P11 "|" #P12 "|" #P13, 0)

#define KOALA_INTEROP_V0(name) \
  void Ark_##name(EtsEnv *env) { \
      KOALA_MAYBE_LOG(name)                   \
      impl_##name(); \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void", 0)

#define KOALA_INTEROP_V1(name, P0) \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
  InteropTypeConverter<P0>::InteropType _p0) { \
    KOALA_MAYBE_LOG(name)              \
    P0 p0 = getArgument<P0>(env, _p0); \
    impl_##name(p0); \
    releaseArgument(env, _p0, p0); \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0, 0)

#define KOALA_INTEROP_V2(name, P0, P1) \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      impl_##name(p0, p1); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
   } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1, 0)

#define KOALA_INTEROP_V3(name, P0, P1, P2) \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      impl_##name(p0, p1, p2); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2, 0)

#define KOALA_INTEROP_V4(name, P0, P1, P2, P3) \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      impl_##name(p0, p1, p2, p3); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
} \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2 "|" #P3, 0)

#define KOALA_INTEROP_V5(name, P0, P1, P2, P3, P4) \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      impl_##name(p0, p1, p2, p3, p4); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
} \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4, 0)

#define KOALA_INTEROP_V6(name, P0, P1, P2, P3, P4, P5) \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      impl_##name(p0, p1, p2, p3, p4, p5); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5, 0)

#define KOALA_INTEROP_V7(name, P0, P1, P2, P3, P4, P5, P6) \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6, 0)

#define KOALA_INTEROP_V8(name, P0, P1, P2, P3, P4, P5, P6, P7) \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7, 0)

#define KOALA_INTEROP_V9(name, P0, P1, P2, P3, P4, P5, P6, P7, P8) \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7, \
    InteropTypeConverter<P8>::InteropType _p8) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7 "|" #P8, 0)

#define KOALA_INTEROP_V10(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9) \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7, \
    InteropTypeConverter<P8>::InteropType _p8, \
    InteropTypeConverter<P9>::InteropType _p9) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
} \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7 "|" #P8 "|" #P9, 0)

#define KOALA_INTEROP_V11(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10) \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7, \
    InteropTypeConverter<P8>::InteropType _p8, \
    InteropTypeConverter<P9>::InteropType _p9, \
    InteropTypeConverter<P10>::InteropType _p10) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7 "|" #P8 "|" #P9 "|" #P10, 0)

#define KOALA_INTEROP_V12(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11) \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7, \
    InteropTypeConverter<P8>::InteropType _p8, \
    InteropTypeConverter<P9>::InteropType _p9, \
    InteropTypeConverter<P10>::InteropType _p10, \
    InteropTypeConverter<P11>::InteropType _p11) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      P11 p11 = getArgument<P11>(env, _p11); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
      releaseArgument(env, _p11, p11); \
} \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7 "|" #P8 "|" #P9 "|" #P10 "|" #P11, 0)

#define KOALA_INTEROP_V13(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12) \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7, \
    InteropTypeConverter<P8>::InteropType _p8, \
    InteropTypeConverter<P9>::InteropType _p9, \
    InteropTypeConverter<P10>::InteropType _p10, \
    InteropTypeConverter<P11>::InteropType _p11, \
    InteropTypeConverter<P12>::InteropType _p12) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      P11 p11 = getArgument<P11>(env, _p11); \
      P12 p12 = getArgument<P12>(env, _p12); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
      releaseArgument(env, _p11, p11); \
      releaseArgument(env, _p12, p12); \
} \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7 "|" #P8 "|" #P9 "|" #P10 "|" #P11 "|" #P12, 0)

#define KOALA_INTEROP_V14(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13) \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5, \
  InteropTypeConverter<P6>::InteropType _p6, \
  InteropTypeConverter<P7>::InteropType _p7, \
  InteropTypeConverter<P8>::InteropType _p8, \
  InteropTypeConverter<P9>::InteropType _p9, \
  InteropTypeConverter<P10>::InteropType _p10, \
  InteropTypeConverter<P11>::InteropType _p11, \
  InteropTypeConverter<P12>::InteropType _p12, \
  InteropTypeConverter<P13>::InteropType _p13) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      P11 p11 = getArgument<P11>(env, _p11); \
      P12 p12 = getArgument<P12>(env, _p12); \
      P13 p13 = getArgument<P13>(env, _p13); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
      releaseArgument(env, _p11, p11); \
      releaseArgument(env, _p12, p12); \
      releaseArgument(env, _p13, p13); \
} \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7 "|" #P8 "|" #P9 "|" #P10 "|" #P11 "|" #P12 "|" #P13, 0)

#define KOALA_INTEROP_V15(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13, P14) \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5, \
  InteropTypeConverter<P6>::InteropType _p6, \
  InteropTypeConverter<P7>::InteropType _p7, \
  InteropTypeConverter<P8>::InteropType _p8, \
  InteropTypeConverter<P9>::InteropType _p9, \
  InteropTypeConverter<P10>::InteropType _p10, \
  InteropTypeConverter<P11>::InteropType _p11, \
  InteropTypeConverter<P12>::InteropType _p12, \
  InteropTypeConverter<P13>::InteropType _p13, \
  InteropTypeConverter<P14>::InteropType _p14) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      P11 p11 = getArgument<P11>(env, _p11); \
      P12 p12 = getArgument<P12>(env, _p12); \
      P13 p13 = getArgument<P13>(env, _p13); \
      P14 p14 = getArgument<P14>(env, _p14); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
      releaseArgument(env, _p11, p11); \
      releaseArgument(env, _p12, p12); \
      releaseArgument(env, _p13, p13); \
      releaseArgument(env, _p14, p14); \
} \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7 "|" #P8 "|" #P9 "|" #P10 "|" #P11 "|" #P12 "|" #P13 "|" #P14, 0)

#define KOALA_INTEROP_CTX_0(name, Ret) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz) { \
      KOALA_MAYBE_LOG(name)                   \
      KVMContext ctx = (KVMContext)env; \
      auto rv = makeResult<Ret>(env, impl_##name(ctx)); \
      return rv; \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret, ETS_SLOW_NATIVE_FLAG)

#define KOALA_INTEROP_CTX_1(name, Ret, P0) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
   InteropTypeConverter<P0>::InteropType _p0) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, _p0); \
      KVMContext ctx = (KVMContext)env; \
      auto rv = makeResult<Ret>(env, impl_##name(ctx, p0)); \
      releaseArgument(env, _p0, p0); \
      return rv; \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0, ETS_SLOW_NATIVE_FLAG)

#define KOALA_INTEROP_CTX_2(name, Ret, P0, P1) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      KVMContext ctx = (KVMContext)env; \
      auto rv = makeResult<Ret>(env, impl_##name(ctx, p0, p1)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      return rv; \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1, ETS_SLOW_NATIVE_FLAG)

#define KOALA_INTEROP_CTX_3(name, Ret, P0, P1, P2) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      KVMContext ctx = (KVMContext)env; \
      auto rv = makeResult<Ret>(env, impl_##name(ctx, p0, p1, p2)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      return rv; \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1 "|" #P2, ETS_SLOW_NATIVE_FLAG)

#define KOALA_INTEROP_CTX_4(name, Ret, P0, P1, P2, P3) \
  InteropTypeConverter<Ret>::InteropType Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      KVMContext ctx = (KVMContext)env; \
      auto rv = makeResult<Ret>(env, impl_##name(ctx, p0, p1, p2, p3)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      return rv; \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3, ETS_SLOW_NATIVE_FLAG)

#define KOALA_INTEROP_CTX_V0(name)  \
  void Ark_##name(EtsEnv *env, ets_class clazz) { \
      KOALA_MAYBE_LOG(name)                   \
      KVMContext ctx = (KVMContext)env; \
      impl_##name(ctx); \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void", ETS_SLOW_NATIVE_FLAG)

#define KOALA_INTEROP_CTX_V1(name, P0)  \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, _p0); \
      KVMContext ctx = (KVMContext)env; \
      impl_##name(ctx, p0); \
      releaseArgument(env, _p0, p0); \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0, ETS_SLOW_NATIVE_FLAG)

#define KOALA_INTEROP_CTX_V2(name, P0, P1)  \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      KVMContext ctx = (KVMContext)env; \
      impl_##name(ctx, p0, p1); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1, ETS_SLOW_NATIVE_FLAG)

#define KOALA_INTEROP_CTX_V3(name, P0, P1, P2)  \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      KVMContext ctx = (KVMContext)env; \
      impl_##name(ctx, p0, p1, p2); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2, ETS_SLOW_NATIVE_FLAG)

#define KOALA_INTEROP_CTX_V4(name, P0, P1, P2, P3)  \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      KVMContext ctx = (KVMContext)env; \
      impl_##name(ctx, p0, p1, p2, p3); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2 "|" #P3, ETS_SLOW_NATIVE_FLAG)

#define KOALA_INTEROP_CTX_V5(name, P0, P1, P2, P3, P4)  \
  void Ark_##name(EtsEnv *env, ets_class clazz, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      KVMContext ctx = (KVMContext)env; \
      impl_##name(ctx, p0, p1, p2, p3, p4); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
  } \
MAKE_ETS_EXPORT(KOALA_INTEROP_MODULE, name, "void|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4, ETS_SLOW_NATIVE_FLAG)

bool setKoalaEtsNapiCallbackDispatcher(
    EtsEnv* etsEnv,
    ets_class clazz,
    const char* dispatcherMethodName,
    const char* dispactherMethodSig
);
void getKoalaEtsNapiCallbackDispatcher(ets_class* clazz, ets_method* method);

#define KOALA_INTEROP_CALL_VOID(venv, id, length, args)                               \
{                                                                                     \
  ets_class clazz = nullptr;                                                          \
  ets_method method = nullptr;                                                        \
  getKoalaEtsNapiCallbackDispatcher(&clazz, &method);                                 \
  EtsEnv* etsEnv = reinterpret_cast<EtsEnv*>(vmContext);                              \
  etsEnv->PushLocalFrame(1);                                                          \
  ets_byteArray args_ets = etsEnv->NewByteArray(length);                              \
  etsEnv->SetByteArrayRegion(args_ets, 0, length, reinterpret_cast<ets_byte*>(args)); \
  etsEnv->CallStaticIntMethod(clazz, method, id, args_ets, length);                   \
  etsEnv->GetByteArrayRegion(args_ets, 0, length, reinterpret_cast<ets_byte*>(args)); \
  etsEnv->PopLocalFrame(nullptr);                                                     \
}

#define KOALA_INTEROP_CALL_INT(venv, id, length, args)                                \
{                                                                                     \
  ets_class clazz = nullptr;                                                          \
  ets_method method = nullptr;                                                        \
  getKoalaEtsNapiCallbackDispatcher(&clazz, &method);                                 \
  EtsEnv* etsEnv = reinterpret_cast<EtsEnv*>(venv);                              \
  etsEnv->PushLocalFrame(1);                                                          \
  ets_byteArray args_ets = etsEnv->NewByteArray(length);                              \
  etsEnv->SetByteArrayRegion(args_ets, 0, length, reinterpret_cast<ets_byte*>(args)); \
  int32_t rv = etsEnv->CallStaticIntMethod(clazz, method, id, args_ets, length);      \
  etsEnv->GetByteArrayRegion(args_ets, 0, length, reinterpret_cast<ets_byte*>(args)); \
  etsEnv->PopLocalFrame(nullptr);                                                     \
  return rv;                                                                          \
}

#define KOALA_INTEROP_CALL_VOID_INTS32(venv, id, argc, args) KOALA_INTEROP_CALL_VOID(venv, id, (argc) * sizeof(int32_t), args)
#define KOALA_INTEROP_CALL_INT_INTS32(venv, id, argc, args) KOALA_INTEROP_CALL_INT(venv, id, (argc) * sizeof(int32_t), args)

#define KOALA_INTEROP_THROW(vmContext, object, ...) \
   do { \
     EtsEnv* env = reinterpret_cast<EtsEnv*>(vmContext); \
     env->ThrowError(object); \
     return __VA_ARGS__;  \
   } while (0)

#define KOALA_INTEROP_THROW_STRING(vmContext, message, ...) \
  do { \
    EtsEnv* env = reinterpret_cast<EtsEnv*>(vmContext); \
    const static ets_class errorClass = env->FindClass("std/core/Error"); \
    env->ThrowErrorNew(errorClass, message); \
  } while (0)

#endif // KOALA_ETS_NAPI

#endif // CONVERTORS_ETS_H