#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetDataSharing, NSObject)

RCT_EXTERN_METHOD(
  updateWidgetData:(NSString *)data
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  updateNextUpProgress:(nonnull NSNumber *)sectionId
  currentPage:(nonnull NSNumber *)currentPage
  totalPages:(nonnull NSNumber *)totalPages
  completed:(BOOL)completed
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end 