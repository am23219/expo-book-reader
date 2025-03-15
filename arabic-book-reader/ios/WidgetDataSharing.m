#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetDataSharing, NSObject)

RCT_EXTERN_METHOD(updateWidgetData:(NSString *)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
