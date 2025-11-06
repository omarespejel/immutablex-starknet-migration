#import <Security/Security.h>
#import <Foundation/Foundation.h>

extern "C" {
    void _SaveToKeychain(const char* key, const char* value) {
        NSString *keyStr = [NSString stringWithUTF8String:key];
        NSData *valueData = [[NSString stringWithUTF8String:value] dataUsingEncoding:NSUTF8StringEncoding];
        
        NSDictionary *query = @{
            (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
            (__bridge id)kSecAttrAccount: keyStr,
            (__bridge id)kSecValueData: valueData,
            (__bridge id)kSecAttrAccessible: (__bridge id)kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        };
        
        SecItemDelete((__bridge CFDictionaryRef)query);
        SecItemAdd((__bridge CFDictionaryRef)query, NULL);
    }
    
    const char* _LoadFromKeychain(const char* key) {
        NSString *keyStr = [NSString stringWithUTF8String:key];
        
        NSDictionary *query = @{
            (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
            (__bridge id)kSecAttrAccount: keyStr,
            (__bridge id)kSecReturnData: @YES,
            (__bridge id)kSecMatchLimit: (__bridge id)kSecMatchLimitOne
        };
        
        CFTypeRef result = NULL;
        OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &result);
        
        if (status == noErr) {
            NSData *data = (__bridge_transfer NSData *)result;
            NSString *value = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
            return strdup([value UTF8String]);
        }
        
        return strdup("");
    }
}
